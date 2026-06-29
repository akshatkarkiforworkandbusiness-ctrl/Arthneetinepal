import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Send, X } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface LessonComment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  likes: number;
  createdAt: any;
  parentId?: string;
}

function LessonCommentItem({ comment, lessonId, onReply }: {
  comment: LessonComment;
  lessonId: string;
  onReply: (id: string, name: string) => void;
}) {
  const date = comment.createdAt?.toDate?.();
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-full bg-royal/20 flex items-center justify-center text-royal font-black text-xs uppercase shrink-0">
        {comment.authorName?.[0]}
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-white">
            {comment.authorName}
          </span>
          {date && (
            <span className="text-[9px] text-gray-500 uppercase tracking-widest">
              {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date)}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-300 font-sans leading-relaxed">{comment.text}</p>
        <button
          onClick={() => onReply(comment.id, comment.authorName)}
          className="text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-royal transition-colors cursor-pointer"
        >
          Reply
        </button>
      </div>
    </div>
  );
}

export default function LessonCommentSection({ lessonId }: { lessonId: string }) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<LessonComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const path = `lessons/${lessonId}/comments`;
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LessonComment)));
      },
      (error) => handleFirestoreError(error, OperationType.GET, path)
    );
    return () => unsubscribe();
  }, [lessonId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;
    const path = `lessons/${lessonId}/comments`;
    try {
      const commentData: any = {
        authorId: user.uid,
        authorName: profile?.name || user.displayName || 'Anonymous',
        text: newComment,
        likes: 0,
        createdAt: serverTimestamp(),
      };
      if (replyTo) commentData.parentId = replyTo.id;
      await addDoc(collection(db, path), commentData);
      setNewComment('');
      setReplyTo(null);
      toast.success('Comment added!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      toast.error('Failed to add comment.');
    }
  };

  const rootComments = comments.filter(c => !c.parentId);
  const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId);

  return (
    <div className="border-t border-white/10 pt-8 space-y-8">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
        Discussion ({comments.length})
      </p>

      {user ? (
        <form onSubmit={handleAddComment} className="relative">
          {replyTo && (
            <div className="flex justify-between items-center bg-royal/10 px-4 py-2 rounded-lg mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-royal">
                Replying to {replyTo.name}
              </span>
              <button type="button" onClick={() => setReplyTo(null)} className="cursor-pointer">
                <X size={14} className="text-gray-400 hover:text-white transition-colors" />
              </button>
            </div>
          )}
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Share your thoughts on this lesson..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-5 text-sm text-white outline-none focus:border-royal transition-all resize-none h-24 font-sans"
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="absolute bottom-4 right-4 bg-royal/20 text-royal p-3 rounded-lg hover:bg-royal hover:text-white transition-all disabled:opacity-20 cursor-pointer"
          >
            <Send size={16} />
          </button>
        </form>
      ) : (
        <p className="text-sm text-gray-500 font-sans italic">
          Sign in to join the discussion.
        </p>
      )}

      <div className="space-y-8">
        {rootComments.map(comment => (
          <div key={comment.id} className="space-y-6">
            <LessonCommentItem
              comment={comment}
              lessonId={lessonId}
              onReply={(id, name) => setReplyTo({ id, name })}
            />
            <div className="ml-12 pl-6 border-l border-white/10 space-y-6">
              {getReplies(comment.id).map(reply => (
                <LessonCommentItem
                  key={reply.id}
                  comment={reply}
                  lessonId={lessonId}
                  onReply={(id, name) => setReplyTo({ id, name })}
                />
              ))}
            </div>
          </div>
        ))}
        {rootComments.length === 0 && (
          <p className="text-sm text-gray-600 font-sans italic">
            No comments yet — be the first to share your thoughts.
          </p>
        )}
      </div>
    </div>
  );
}
