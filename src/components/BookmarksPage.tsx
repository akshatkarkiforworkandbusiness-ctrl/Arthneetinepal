import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Bookmark, Trash2 } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { Post } from '../types/post';

interface BookmarkData {
  postId: string;
  bookmarkedAt: any;
}

export default function BookmarksPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
  const [posts, setPosts] = useState<Map<string, Post>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const qBookmarks = query(
      collection(db, `users/${user.uid}/bookmarks`),
      orderBy('bookmarkedAt', 'desc')
    );

    const unsubscribe = onSnapshot(qBookmarks,
      (snapshot) => {
        const bookmarkData = snapshot.docs.map(doc => ({
          postId: doc.id,
          ...doc.data(),
        })) as BookmarkData[];
        setBookmarks(bookmarkData);

        // Fetch posts for each bookmark
        const postIds = bookmarkData.map(b => b.postId);
        if (postIds.length > 0) {
          fetchPosts(postIds);
        } else {
          setLoading(false);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/bookmarks`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const fetchPosts = async (postIds: string[]) => {
    try {
      const { getDoc } = await import('firebase/firestore');
      const postsMap = new Map<string, Post>();
      
      for (const postId of postIds) {
        const postDoc = await getDoc(doc(db, 'posts', postId));
        if (postDoc.exists()) {
          postsMap.set(postId, { id: postDoc.id, ...postDoc.data() } as Post);
        }
      }
      
      setPosts(postsMap);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load bookmarked posts');
      setLoading(false);
    }
  };

  const removeBookmark = async (postId: string) => {
    if (!user) return;
    
    try {
      await deleteDoc(doc(db, `users/${user.uid}/bookmarks/${postId}`));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/bookmarks/${postId}`);
    }
  };

  if (!user) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-24 min-h-screen">
        <div className="text-center">
          <Bookmark size={48} className="mx-auto mb-4 text-text-muted" />
          <h1 className="text-2xl font-display font-medium text-brandwood mb-2">Bookmarks</h1>
          <p className="text-text-muted">Sign in to view your saved posts</p>
        </div>
      </main>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto px-6 py-24 min-h-screen"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-display font-medium text-brandwood mb-2">Bookmarks</h1>
        <p className="text-text-muted text-sm">Posts you've saved for later</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full bg-white border border-blush-mist rounded-2xl" />
          ))}
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="text-center py-16">
          <Bookmark size={48} className="mx-auto mb-4 text-text-muted" />
          <p className="text-text-muted">No bookmarks yet. Save posts to read later!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarks.map((bookmark) => {
            const post = posts.get(bookmark.postId);
            if (!post) return null;

            return (
              <motion.div
                key={bookmark.postId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-blush-mist p-6 rounded-2xl shadow-sm hover:shadow-card transition-all cursor-pointer"
                onClick={() => navigate(`/post/${bookmark.postId}`)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] font-bold text-brand-emerald-light uppercase tracking-widest bg-brand-emerald-light/10 px-2 py-0.5 rounded-lg">
                        {post.category}
                      </span>
                      {post.sector && (
                        <span className="text-[9px] font-bold text-brand-emerald uppercase tracking-widest bg-brand-emerald/10 px-2 py-0.5 rounded-lg">
                          {post.sector}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-brandwood mb-1">{post.title}</h3>
                    <p className="text-xs text-text-muted line-clamp-2">
                      {post.content?.replace(/<[^>]+>/g, '').substring(0, 150)}...
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-[10px] text-text-muted">
                      <span>{post.author}</span>
                      <span>·</span>
                      <span>{post.likes} likes</span>
                      <span>·</span>
                      <span>{post.commentCount} comments</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeBookmark(bookmark.postId);
                    }}
                    className="p-2 text-text-muted hover:text-brand-emerald transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.main>
  );
}
