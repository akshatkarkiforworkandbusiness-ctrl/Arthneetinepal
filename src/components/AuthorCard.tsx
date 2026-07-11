import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';

interface AuthorCardProps {
  authorId?: string;
  authorName: string;
}

interface AuthorStats {
  topics: string[];
  postCount: number;
  totalLikes: number;
}

// NOTE: we deliberately never read/display `email` here even though the
// current firestore.rules let any signed-in user read the full users/{uid}
// doc. Keep this component's surface to name/topics/stats only.
export function AuthorCard({ authorId, authorName }: AuthorCardProps) {
  const [stats, setStats] = useState<AuthorStats | null>(null);
  const [loading, setLoading] = useState(!!authorId);

  useEffect(() => {
    if (!authorId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const userRef = doc(db, 'users', authorId);
        const postsQuery = query(collection(db, 'posts'), where('authorId', '==', authorId));
        const [userSnap, postsSnap] = await Promise.all([getDoc(userRef), getDocs(postsQuery)]);

        if (cancelled) return;

        const topics = userSnap.exists() ? (userSnap.data().topics || []) : [];
        let totalLikes = 0;
        postsSnap.docs.forEach(d => { totalLikes += d.data().likes || 0; });

        setStats({ topics, postCount: postsSnap.size, totalLikes });
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${authorId}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [authorId]);

  return (
    <div className="bg-surface-raised border border-surface-high rounded-lg-2xl p-8 flex flex-col sm:flex-row sm:items-center gap-6">
      <div className="w-16 h-16 rounded-lg bg-brand-emerald-light flex items-center justify-center text-white font-black text-2xl uppercase shrink-0">
        {authorName?.[0] || '?'}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black text-brand-emerald uppercase tracking-widest mb-1">Written by</p>
        <h4 className="text-xl font-bold text-text-primary mb-3 truncate">{authorName}</h4>

        {loading ? (
          <div className="h-4 w-40 bg-surface-high/60 rounded animate-pulse" />
        ) : stats ? (
          <>
            {stats.topics.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {stats.topics.slice(0, 4).map(topic => (
                  <Badge key={topic} variant="outline" className="text-[9px] font-black uppercase tracking-widest border-surface-high text-text-muted bg-surface-base px-2 py-0.5 rounded-lg">
                    {topic}
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-text-muted">
              <span className="font-bold text-text-primary">{stats.postCount}</span> contribution{stats.postCount === 1 ? '' : 's'} ·{' '}
              <span className="font-bold text-text-primary">{stats.totalLikes}</span> total likes
            </p>
          </>
        ) : (
          <p className="text-xs text-text-muted italic">No public profile yet.</p>
        )}
      </div>

      {authorId && (
        <Link
          to={`/profile/${authorId}`}
          className="shrink-0 text-center bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/30 px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-brand-emerald hover:text-white transition-all"
        >
          View Profile
        </Link>
      )}
    </div>
  );
}
