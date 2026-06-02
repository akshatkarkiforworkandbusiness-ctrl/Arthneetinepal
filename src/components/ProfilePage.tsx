import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Briefcase, User as UserIcon } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

interface UserPost {
  id: string;
  title: string;
  category: string;
  type: 'discussion' | 'research' | 'question';
  likes: number;
  createdAt: any;
  abstract?: string;
  content: string;
}

export default function ProfilePage() {
  const { user, profile, handleJoinAction } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');
  const [myPosts, setMyPosts] = useState<UserPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    if (!user) return;

    const path = 'posts';
    const q = query(
      collection(db, path),
      where('authorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        setMyPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserPost)));
        setLoadingPosts(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        setLoadingPosts(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F19]">
       <div className="text-center p-12 bg-[#161F30] rounded-2xl shadow-xl border border-[#1F2A3F] flex flex-col items-center">
          <h2 className="text-3xl text-white italic font-display mb-4">Access Denied</h2>
          <p className="text-text-muted mb-8 max-w-sm text-sm">Please log in to view and manage your community profile.</p>
          <button 
             onClick={handleJoinAction}
             className="bg-crimson text-white px-10 py-4 rounded text-xs font-black uppercase tracking-widest hover:bg-royal transition-all shadow-xl cursor-pointer"
          >
             Sign In with Google
          </button>
       </div>
    </div>
  );

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-6 py-20"
    >
      {/* Profile Header Card */}
      <section className="bg-white rounded-2xl shadow-sm border border-green-deep/5 overflow-hidden mb-16">
        <div className="h-48 bg-green-deep relative">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_30%,_white,_transparent_70%)]" />
        </div>
        
        <div className="px-12 pb-12">
          <div className="relative -mt-20 flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
            <div className="flex flex-col md:flex-row md:items-end gap-8">
              <div className="w-40 h-40 bg-white rounded-2xl border-8 border-white shadow-2xl flex items-center justify-center overflow-hidden">
                <div className="w-full h-full bg-crimson flex items-center justify-center text-white text-5xl font-black font-display italic">
                  {(profile?.name || user.displayName || 'U').charAt(0)}
                </div>
              </div>
              
              <div className="pb-4">
                <h1 className="text-5xl text-green-deep italic font-display mb-4 leading-tight">
                  {profile?.name || user.displayName}
                </h1>
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2 text-green-deep/40">
                    <UserIcon size={14} className="text-crimson" />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Member</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-deep/40">
                    <Mail size={14} className="text-royal" />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">{profile?.email || user.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-12 border-t border-green-deep/5">
             <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-green-deep/40 mb-4">Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {(profile?.topics || ['Economics', 'Finance']).map(topic => (
                    <span key={topic} className="px-4 py-1.5 bg-cream border border-green-deep/5 rounded text-[10px] font-black uppercase tracking-widest text-green-deep/60">
                      {topic}
                    </span>
                  ))}
                </div>
             </div>
             <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-green-deep/40 mb-4">Stats</h4>
                <div className="flex gap-12">
                   <div>
                      <p className="text-3xl text-green-deep font-display italic">{myPosts.length}</p>
                      <p className="text-[10px] text-green-deep/40 uppercase font-black tracking-widest">Contributions</p>
                   </div>
                   <div>
                      <p className="text-3xl text-green-deep font-display italic">
                        {myPosts.reduce((acc, p) => acc + (p.likes || 0), 0)}
                      </p>
                      <p className="text-[10px] text-green-deep/40 uppercase font-black tracking-widest">Total Likes</p>
                   </div>
                </div>
             </div>
             <div className="flex items-center justify-md-end">
                <button className="bg-crimson text-white px-8 py-4 rounded text-xs font-black uppercase tracking-widest hover:bg-royal transition-all shadow-xl">
                   Edit Profile
                </button>
             </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-12 border-b border-green-deep/5 mb-16 overflow-x-auto">
        {[
          { id: 'posts', label: 'My Contributions' },
          { id: 'bookmarks', label: 'Saved Analysis' },
          { id: 'activity', label: 'Activity Log' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-6 text-xs font-black uppercase tracking-[0.2em] relative transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'text-crimson' : 'text-green-deep/40 hover:text-green-deep'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="profileTabLine" className="absolute bottom-[-1px] left-0 w-full h-1 bg-crimson rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
        {activeTab === 'posts' && myPosts.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group p-8 rounded-2xl bg-white border border-green-deep/5 hover:border-crimson/20 hover:shadow-xl transition-all"
          >
            <div className="flex justify-between items-start mb-6">
              <span className="px-3 py-1 bg-crimson/5 text-crimson text-[8px] font-black uppercase tracking-widest rounded-full">
                {post.type}
              </span>
              <div className="flex items-center gap-1.5 text-royal">
                <span className="material-symbols-outlined text-sm">favorite</span>
                <span className="text-[10px] font-bold">{post.likes}</span>
              </div>
            </div>
            <h3 className="text-xl text-green-deep font-display italic mb-4 line-clamp-2 leading-relaxed">
              {post.title || post.content.substring(0, 50) + '...'}
            </h3>
            <p className="text-[10px] font-bold text-green-deep/40 uppercase tracking-widest">
              {post.category}
            </p>
          </motion.div>
        ))}
      </div>

      {activeTab === 'posts' && myPosts.length === 0 && !loadingPosts && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
           <div className="w-20 h-20 bg-green-deep/5 rounded-full flex items-center justify-center text-green-deep/20 mb-8">
              <Briefcase size={40} />
           </div>
           <h3 className="text-3xl text-green-deep italic font-display mb-4">No Activity Yet</h3>
           <p className="text-green-deep/60 font-sans italic max-w-sm">
             Start contributing to the community feed to build your intellectual portfolio.
           </p>
        </div>
      )}
    </motion.main>
  );
}
