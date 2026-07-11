import React, { useState, useEffect } from 'react';
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

  const handleLike = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, `posts/${postId}/comments`, comment.id), {
        likes: increment(1)
      });
      toast.success("Comment liked!");
    } catch (error) {
      toast.error("Failed to like comment.");
    }
  };

  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-lg bg-brand-emerald flex items-center justify-center text-white font-black text-[10px] shrink-0">
        {comment.authorName?.[0]}
      </div>
      <div className="flex-1">
        <div className="bg-surface-base p-4 rounded-lg border border-surface-high">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-black text-text-primary uppercase tracking-widest">{comment.authorName}</span>
            <span className="text-[10px] text-text-muted font-medium">
              {comment.createdAt?.toDate ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(comment.createdAt.toDate()) : '...'}
            </span>
          </div>
          <p className="text-sm text-text-muted leading-relaxed">{comment.text}</p>
        </div>
        <div className="flex items-center gap-6 mt-2 ml-2">
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-brand-emerald transition-colors"
          >
            <Heart size={12} fill={comment.likes > 0 ? 'currentColor' : 'none'} className={comment.likes > 0 ? 'text-brand-emerald' : ''} />
            {comment.likes}
          </button>
          {!comment.parentId && (
            <button
              onClick={() => onReply(comment.id, comment.authorName)}
              className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors"
            >
              Reply
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

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
        authorName: profile?.name || user.displayName || 'Anonymous',
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
      toast.success("Comment added!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      toast.error("Failed to add comment.");
    }
  };

  const rootComments = comments.filter(c => !c.parentId);
  const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId);

  return (
    <div id="comments" className="mt-8 pt-8 border-t border-white/5 space-y-8">
      <h3 className="text-xs font-black uppercase tracking-widest text-text-muted">
        {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
      </h3>

      {user && (
        <form onSubmit={handleAddComment} className="relative mb-12">
          {replyTo && (
            <div className="flex justify-between items-center bg-brand-emerald/10 p-2 px-4 rounded-lg mb-2">
              <span className="text-[10px] font-black text-brand-emerald uppercase tracking-widest">Replying to {replyTo.name}</span>
              <button onClick={() => setReplyTo(null)} className="text-text-muted hover:text-text-primary"><X size={14} /></button>
            </div>
          )}
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            className="w-full bg-surface-base border border-surface-high rounded-lg p-5 text-sm text-text-primary outline-none focus:border-brand-emerald transition-all resize-none h-24"
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="absolute bottom-4 right-4 bg-white text-white p-3 rounded-lg hover:bg-brand-emerald transition-all disabled:opacity-20"
          >
            <Send size={18} />
          </button>
        </form>
      )}

      <div className="space-y-10">
        {rootComments.map((comment) => (
          <div key={comment.id} className="space-y-6">
            <CommentItem
              comment={comment}
              postId={postId}
              onReply={(id, name) => setReplyTo({ id, name })}
            />
            {/* Replies */}
            <div className="ml-12 space-y-6 border-l-2 border-slate-raised/5 pl-8">
              {getReplies(comment.id).map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  onReply={(pid, name) => setReplyTo({ id: pid, name })}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
