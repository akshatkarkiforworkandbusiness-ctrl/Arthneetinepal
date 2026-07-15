import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  collection, query, orderBy, onSnapshot, addDoc, serverTimestamp,
  doc, updateDoc, increment
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Send, X } from 'lucide-react';
import type { Comment } from '../types/post';

interface CommentItemProps {
  comment: Comment;
  postId: string;
  onReply: (parentId: string, authorName: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  postId,
  onReply
}) => {
  const { user } = useAuth();
  const [likeCount, setLikeCount] = useState(comment.likes);
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = async () => {
    if (!user) return;
    setIsLiked(true);
    setLikeCount(prev => prev + 1);
    try {
      await updateDoc(doc(db, `posts/${postId}/comments`, comment.id), {
        likes: increment(1)
      });
      toast.success("Comment liked!");
    } catch (error) {
      setIsLiked(false);
      setLikeCount(comment.likes);
      toast.error("Failed to like comment.");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex gap-4"
    >
      <div className="w-8 h-8 rounded-xl bg-club-green flex items-center justify-center text-white font-bold text-[11px] shrink-0 shadow-sm">
        {comment.authorName?.[0]?.toUpperCase()}
      </div>
      <div className="flex-1">
        <div className="bg-white p-4 rounded-2xl border border-border shadow-card hover:border-club-green/20 transition-colors">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">{comment.authorName}</span>
            <span className="text-[10px] text-text-muted font-medium">
              {comment.createdAt?.toDate ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(comment.createdAt.toDate()) : 'Just now'}
            </span>
          </div>
          <p className="text-sm text-text-primary leading-relaxed">{comment.text}</p>
        </div>
        <div className="flex items-center gap-6 mt-2 ml-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleLike}
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-text-muted hover:text-club-green transition-colors"
          >
            <Heart size={14} fill={likeCount > 0 || isLiked ? 'currentColor' : 'none'} className={likeCount > 0 || isLiked ? 'text-club-green' : ''} />
            <span>{likeCount}</span>
          </motion.button>
          {!comment.parentId && (
            <button
              onClick={() => onReply(comment.id, comment.authorName)}
              className="text-[11px] font-bold uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors"
            >
              Reply
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export function CommentSection({ postId }: { postId: string }) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const path = `posts/${postId}/comments`;
    const qComments = query(
      collection(db, path),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(qComments,
      (snapshot) => {
        setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment)));
      },
      (error) => handleFirestoreError(error, OperationType.GET, path)
    );
    return () => unsubscribe();
  }, [postId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;
    const path = `posts/${postId}/comments`;

    try {
      const commentData: any = {
        authorId: user.uid,
        authorName: profile?.name || user.displayName || 'Anonymous User',
        text: newComment,
        likes: 0,
        createdAt: serverTimestamp(),
      };
      if (replyTo) {
        commentData.parentId = replyTo.id;
      }

      await addDoc(collection(db, path), commentData);
      await updateDoc(doc(db, 'posts', postId), {
        commentCount: increment(1)
      });
      setNewComment('');
      setReplyTo(null);
      toast.success("Comment posted!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      toast.error("Failed to add comment.");
    }
  };

  const rootComments = comments.filter(c => !c.parentId);
  const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId);

  return (
    <div id="comments" className="mt-8 pt-8 border-t border-border space-y-8">
      <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted">
        {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
      </h3>

      {user && (
        <form onSubmit={handleAddComment} className="relative mb-12">
          <AnimatePresence>
            {replyTo && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex justify-between items-center bg-emerald-50 border border-emerald-200 p-2.5 px-4 rounded-xl mb-3"
              >
                <span className="text-xs font-bold text-club-green uppercase tracking-wider">Replying to {replyTo.name}</span>
                <button onClick={() => setReplyTo(null)} className="text-text-muted hover:text-text-primary"><X size={16} /></button>
              </motion.div>
            )}
          </AnimatePresence>
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Share your economic research or perspective..."
            className="w-full bg-white border border-border rounded-2xl p-5 text-sm text-text-primary outline-none focus:border-club-green focus:ring-1 focus:ring-club-green/30 transition-all resize-none h-28 shadow-card"
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="absolute bottom-4 right-4 bg-club-green text-white p-3 rounded-xl hover:bg-[#047857] transition-all disabled:opacity-30 shadow-sm"
          >
            <Send size={18} />
          </button>
        </form>
      )}

      <div className="space-y-8">
        <AnimatePresence initial={false}>
          {rootComments.map((comment) => (
            <motion.div 
              key={comment.id} 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <CommentItem
                comment={comment}
                postId={postId}
                onReply={(id, name) => setReplyTo({ id, name })}
              />
              {/* Replies */}
              <div className="ml-10 space-y-4 border-l-2 border-border pl-6">
                {getReplies(comment.id).map(reply => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    postId={postId}
                    onReply={(pid, name) => setReplyTo({ id: pid, name })}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default CommentSection;
