import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import type { Post } from '../types/post';

interface RelatedPostsProps {
  post: Post;
}

export function RelatedPosts({ post }: RelatedPostsProps) {
  const [items, setItems] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const load = async () => {
      try {
        const results: Post[] = [];
        const seen = new Set([post.id]);

        // 1. More from this author (requires authorId — seeded/legacy posts may not have one)
        if (post.authorId) {
          const authorQ = query(
            collection(db, 'posts'),
            where('authorId', '==', post.authorId),
            orderBy('createdAt', 'desc'),
            limit(4)
          );
          const authorSnap = await getDocs(authorQ);
          authorSnap.docs.forEach(d => {
            if (!seen.has(d.id) && results.length < 3) {
              seen.add(d.id);
              results.push({ id: d.id, ...d.data() } as Post);
            }
          });
        }

        // 2. Fill remaining slots with same-category posts
        if (results.length < 3) {
          const categoryQ = query(
            collection(db, 'posts'),
            where('category', '==', post.category),
            orderBy('createdAt', 'desc'),
            limit(6)
          );
          const categorySnap = await getDocs(categoryQ);
          categorySnap.docs.forEach(d => {
            if (!seen.has(d.id) && results.length < 3) {
              seen.add(d.id);
              results.push({ id: d.id, ...d.data() } as Post);
            }
          });
        }

        if (!cancelled) setItems(results);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'posts');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [post.id, post.authorId, post.category]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map(i => <div key={i} className="h-32 bg-surface-high/40 rounded-lg-2xl animate-pulse" />)}
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {items.map(item => (
        <Link
          key={item.id}
          to={`/post/${item.id}`}
          className="bg-surface-raised border border-surface-high rounded-lg-2xl p-5 hover:border-electric-mint/40 transition-all flex flex-col"
        >
          <span className="text-[9px] font-black text-electric-mint uppercase tracking-widest mb-2">
            {item.authorId === post.authorId ? 'More from this author' : item.category}
          </span>
          <h5 className="text-sm font-bold text-text-primary leading-snug line-clamp-2 mb-2">
            {item.title || item.content?.slice(0, 60)}
          </h5>
          <span className="text-[10px] text-text-muted mt-auto">{item.author}</span>
        </Link>
      ))}
    </div>
  );
}
