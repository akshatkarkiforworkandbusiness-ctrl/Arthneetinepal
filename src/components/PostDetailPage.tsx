import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  doc, onSnapshot, updateDoc, deleteDoc, increment, getDoc, setDoc, serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import {
  Heart, MessageSquare, Share2, Download, FileText, ArrowLeft,
  MoreVertical, Pencil, Trash2, Link2, Twitter, Linkedin, X
} from 'lucide-react';
import type { Post } from '../types/post';
import { AuthorCard } from './AuthorCard';
import { RelatedPosts } from './RelatedPosts';
import { CommentSection } from './CommentSection';

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user, profile, isAdmin } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [showFloatingBar, setShowFloatingBar] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editData, setEditData] = useState({ title: '', content: '', abstract: '', category: 'Finance' as any });

  const isAuthor = !!user && !!post && user.uid === post.authorId;
  const canManage = isAuthor || isAdmin;

  // Load post
  useEffect(() => {
    if (!postId) return;
    const unsubscribe = onSnapshot(
      doc(db, 'posts', postId),
      (snap) => {
        if (!snap.exists()) {
          setNotFound(true);
        } else {
          setPost({ id: snap.id, ...snap.data() } as Post);
        }
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `posts/${postId}`);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [postId]);

  // Check whether the current user already liked this post
  useEffect(() => {
    if (!user || !postId) { setHasLiked(false); return; }
    getDoc(doc(db, `posts/${postId}/likes/${user.uid}`)).then(snap => setHasLiked(snap.exists()));
  }, [user, postId]);

  // Show the floating action bar once the reader scrolls past the header
  useEffect(() => {
    const onScroll = () => setShowFloatingBar(window.scrollY > 420);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (post) {
      setEditData({
        title: post.title || '',
        content: post.content || '',
        abstract: post.abstract || '',
        category: post.category,
      });
    }
  }, [post]);

  const handleLike = async () => {
    if (!user || !postId) return;
    const postRef = doc(db, 'posts', postId);
    const likeRef = doc(db, `posts/${postId}/likes/${user.uid}`);
    try {
      if (hasLiked) {
        await deleteDoc(likeRef);
        await updateDoc(postRef, { likes: increment(-1) });
        setHasLiked(false);
      } else {
        await setDoc(likeRef, { likedAt: serverTimestamp() });
        await updateDoc(postRef, { likes: increment(1) });
        setHasLiked(true);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `posts/${postId}/likes`);
      toast.error('Failed to update like.');
    }
  };

  const shareUrl = postId ? `${window.location.origin}/post/${postId}` : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard!');
    setShowShareMenu(false);
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(post?.title || 'Check out this post on Arthneeti');
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, '_blank');
    setShowShareMenu(false);
  };

  const handleShareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
    setShowShareMenu(false);
  };

  const jumpToComments = () => {
    document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postId) return;
    try {
      // REQUIRES a firestore.rules update — the current ruleset only allows
      // `likes` / `commentCount` updates on posts. See plan notes.
      await updateDoc(doc(db, 'posts', postId), {
        title: editData.title,
        content: editData.content,
        abstract: editData.abstract,
        category: editData.category,
        updatedAt: serverTimestamp(),
      });
      toast.success('Post updated.');
      setShowEditModal(false);
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        toast.error('Editing is blocked by firestore.rules — update the rules to allow author edits.');
      } else {
        toast.error('Failed to update post.');
      }
      handleFirestoreError(error, OperationType.WRITE, `posts/${postId}`);
    }
  };

  const handleDelete = async () => {
    if (!postId) return;
    try {
      // REQUIRES a firestore.rules update for non-admin authors — current
      // ruleset only allows `allow delete: if isAdmin();`. See plan notes.
      await deleteDoc(doc(db, 'posts', postId));
      toast.success('Post deleted.');
      navigate('/community');
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        toast.error('Delete is blocked by firestore.rules — only admins can delete posts right now.');
      } else {
        toast.error('Failed to delete post.');
      }
      handleFirestoreError(error, OperationType.WRITE, `posts/${postId}`);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-20 space-y-8">
        <Skeleton className="h-6 w-32 bg-white/5" />
        <Skeleton className="h-12 w-full bg-white/5" />
        <Skeleton className="h-64 w-full bg-white/5 rounded-lg-2xl" />
        <Skeleton className="h-40 w-full bg-white/5 rounded-lg-2xl" />
      </main>
    );
  }

  if (notFound || !post) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-32 text-center">
        <h2 className="text-3xl text-text-primary italic font-sans tracking-tight font-semibold mb-4">Post not found</h2>
        <p className="text-text-muted mb-8">This post may have been removed, or the link is incorrect.</p>
        <Link to="/community" className="bg-electric-mint text-slate-base px-8 py-4 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-club-green transition-all">
          Back to Community
        </Link>
      </main>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-3xl mx-auto px-6 py-20"
    >
      {/* Back link */}
      <button
        onClick={() => navigate('/community')}
        className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors text-xs font-black uppercase tracking-widest mb-10"
      >
        <ArrowLeft size={14} /> Back to Feed
      </button>

      {/* Header: author + meta + management */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-club-green flex items-center justify-center text-white font-black text-sm uppercase">
            {post.author?.[0]}
          </div>
          <div>
            <h4 className="text-xs font-black text-text-primary uppercase tracking-widest">{post.author}</h4>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant="outline" className="text-[9px] font-black text-text-primary border-surface-high uppercase tracking-widest bg-surface-raised px-2 py-0.5 rounded-lg">
                {post.category}
              </Badge>
              <span className="text-[9px] font-medium text-text-muted uppercase tracking-widest">
                {post.createdAt?.toDate ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(post.createdAt.toDate()) : '...'}
                {post.updatedAt && ' · Edited'}
              </span>
            </div>
          </div>
        </div>

        {canManage && (
          <div className="relative">
            <button onClick={() => setShowActions(v => !v)} className="text-text-muted hover:text-text-primary transition-colors p-1">
              <MoreVertical size={18} />
            </button>
            {showActions && (
              <div className="absolute right-0 mt-2 w-44 bg-surface-raised border border-surface-high rounded-lg shadow-xl z-20 overflow-hidden">
                {isAuthor && (
                  <button
                    onClick={() => { setShowEditModal(true); setShowActions(false); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-text-primary hover:bg-surface-high transition-colors"
                  >
                    <Pencil size={14} /> Edit Post
                  </button>
                )}
                <button
                  onClick={() => { setShowDeleteConfirm(true); setShowActions(false); }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-red-400 hover:bg-surface-high transition-colors"
                >
                  <Trash2 size={14} /> Delete Post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      {post.title && (
        <h1 className="text-3xl md:text-5xl text-text-primary font-bold mb-8 leading-tight">{post.title}</h1>
      )}

      {/* Body — branches the same way the feed card does */}
      {post.type === 'discussion' && (
        <>
          {post.imageUrl && (
            <div className="aspect-video rounded-lg-2xl overflow-hidden mb-10 border border-surface-high shadow-lg">
              <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          )}
          <div className="prose prose-invert text-text-primary leading-relaxed font-sans mb-10 max-w-none">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
        </>
      )}

      {post.type === 'research' && (
        <div className="bg-surface-raised p-10 rounded-lg-2xl border border-surface-high flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 bg-surface-high/40 rounded-lg flex items-center justify-center text-club-green mb-6 shadow-sm border border-surface-high">
            <FileText size={32} />
          </div>
          <p className="text-text-muted text-base italic font-sans max-w-lg mb-8">"{post.abstract}"</p>
          <a
            href={post.pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 bg-club-green/20 text-club-green px-8 py-3 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-club-green hover:text-white border border-club-green/30 transition-all"
          >
            <Download size={14} /> Download PDF
          </a>
        </div>
      )}

      {post.type === 'question' && (
        <p className="text-xl text-text-primary leading-relaxed font-bold italic mb-10">"{post.content}"</p>
      )}

      {/* Inline action row (stays in flow; floating bar below mirrors it on scroll) */}
      <div className="flex items-center gap-8 pt-6 border-t border-surface-high">
        <button onClick={handleLike} className="flex items-center gap-2 group" disabled={!user}>
          <Heart size={18} fill={hasLiked ? 'currentColor' : 'none'} className={hasLiked ? 'text-electric-mint' : 'text-text-muted group-hover:text-electric-mint transition-colors'} />
          <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{post.likes}</span>
        </button>
        <button onClick={jumpToComments} className="flex items-center gap-2 group text-text-muted hover:text-club-green transition-colors">
          <MessageSquare size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest">{post.commentCount}</span>
        </button>
        <div className="relative">
          <button onClick={() => setShowShareMenu(v => !v)} className="text-text-muted hover:text-text-primary transition-colors">
            <Share2 size={18} />
          </button>
          {showShareMenu && <ShareMenu onCopy={handleCopyLink} onTwitter={handleShareTwitter} onLinkedIn={handleShareLinkedIn} onClose={() => setShowShareMenu(false)} />}
        </div>
      </div>

      {/* Author card */}
      <div className="mt-12">
        <AuthorCard authorId={post.authorId} authorName={post.author} />
      </div>

      {/* Related / more from this author */}
      <div className="mt-16">
        <h3 className="text-[10px] font-black text-electric-mint uppercase tracking-[0.3em] mb-6">Keep Reading</h3>
        <RelatedPosts post={post} />
      </div>

      {/* Comments */}
      <CommentSection postId={post.id} />

      {/* Floating action bar — long-read companion */}
      <FloatingActionBar visible={showFloatingBar}>
        <button onClick={handleLike} className="flex items-center gap-2" disabled={!user}>
          <Heart size={16} fill={hasLiked ? 'currentColor' : 'none'} className={hasLiked ? 'text-electric-mint' : 'text-text-muted'} />
          <span className="text-[10px] font-black text-text-muted">{post.likes}</span>
        </button>
        <span className="w-px h-5 bg-surface-high" />
        <button onClick={jumpToComments} className="flex items-center gap-2 text-text-muted hover:text-club-green transition-colors">
          <MessageSquare size={16} />
          <span className="text-[10px] font-black">{post.commentCount}</span>
        </button>
        <span className="w-px h-5 bg-surface-high" />
        <button onClick={handleCopyLink} className="text-text-muted hover:text-text-primary transition-colors">
          <Share2 size={16} />
        </button>
      </FloatingActionBar>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] bg-slate-base/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-surface-raised p-8 md:p-12 rounded-lg-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl"
          >
            <button onClick={() => setShowEditModal(false)} className="absolute top-8 right-8 text-text-muted hover:text-text-primary transition-colors">
              <X size={24} />
            </button>
            <h2 className="font-sans tracking-tight font-semibold text-3xl text-text-primary italic mb-8">Edit Post</h2>
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Category</label>
                <select
                  value={editData.category}
                  onChange={e => setEditData({ ...editData, category: e.target.value as any })}
                  className="w-full bg-surface-base border-2 border-surface-high rounded-lg p-4 outline-none focus:border-electric-mint transition-all font-bold text-text-primary"
                >
                  {['Finance', 'Economics', 'Business', 'Policy', 'Other'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              {post.type !== 'question' && (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Title</label>
                  <input
                    type="text"
                    value={editData.title}
                    onChange={e => setEditData({ ...editData, title: e.target.value })}
                    className="w-full bg-surface-base border-2 border-surface-high rounded-lg p-4 outline-none focus:border-electric-mint transition-all font-bold text-text-primary"
                  />
                </div>
              )}

              {post.type === 'research' && (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Abstract</label>
                  <textarea
                    value={editData.abstract}
                    onChange={e => setEditData({ ...editData, abstract: e.target.value })}
                    className="w-full bg-surface-base border-2 border-surface-high rounded-lg p-4 outline-none focus:border-electric-mint transition-all font-bold text-text-primary resize-none h-24"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Content</label>
                {post.type === 'question' ? (
                  <textarea
                    value={editData.content}
                    onChange={e => setEditData({ ...editData, content: e.target.value })}
                    className="w-full bg-surface-base border-2 border-surface-high rounded-lg p-4 outline-none focus:border-electric-mint transition-all font-bold text-text-primary resize-none h-32"
                  />
                ) : (
                  <div className="bg-surface-base rounded-lg border-2 border-surface-high focus-within:border-electric-mint transition-all overflow-hidden font-sans">
                    <ReactQuill theme="snow" value={editData.content} onChange={val => setEditData({ ...editData, content: val })} className="bg-surface-base min-h-[200px]" />
                  </div>
                )}
              </div>

              <button type="submit" className="w-full bg-electric-mint text-slate-base py-5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-club-green transition-all shadow-xl">
                Save Changes
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] bg-slate-base/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-surface-raised p-10 rounded-lg-2xl max-w-md w-full text-center shadow-2xl"
          >
            <h2 className="text-2xl text-text-primary font-bold mb-4">Delete this post?</h2>
            <p className="text-text-muted text-sm mb-8">This can't be undone. Comments and likes on this post will be orphaned.</p>
            <div className="flex gap-4">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-4 rounded-lg text-xs font-black uppercase tracking-widest border border-surface-high text-text-muted hover:text-text-primary transition-all">
                Cancel
              </button>
              <button onClick={handleDelete} className="flex-1 py-4 rounded-lg text-xs font-black uppercase tracking-widest bg-red-500/90 text-white hover:bg-red-500 transition-all">
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.main>
  );
}

function ShareMenu({ onCopy, onTwitter, onLinkedIn, onClose }: { onCopy: () => void; onTwitter: () => void; onLinkedIn: () => void; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute right-0 mt-2 w-52 bg-surface-raised border border-surface-high rounded-lg shadow-xl z-20 overflow-hidden">
        <button onClick={onCopy} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-text-primary hover:bg-surface-high transition-colors">
          <Link2 size={14} /> Copy Link
        </button>
        <button onClick={onTwitter} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-text-primary hover:bg-surface-high transition-colors">
          <Twitter size={14} /> Share to Twitter
        </button>
        <button onClick={onLinkedIn} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-text-primary hover:bg-surface-high transition-colors">
          <Linkedin size={14} /> Share to LinkedIn
        </button>
      </div>
    </>
  );
}

function FloatingActionBar({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  return (
    <motion.div
      initial={false}
      animate={{ y: visible ? 0 : 80, opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-surface-raised border border-surface-high rounded-lg-2xl shadow-2xl px-6 py-3 flex items-center gap-5"
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
    >
      {children}
    </motion.div>
  );
}
