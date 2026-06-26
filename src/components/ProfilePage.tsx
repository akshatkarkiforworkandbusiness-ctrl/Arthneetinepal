import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Briefcase, User as UserIcon } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

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
       <div className="text-center p-12 bg-[#161F30] rounded-lg-2xl shadow-xl border border-[#1F2A3F] flex flex-col items-center">
          <h2 className="text-3xl text-white italic font-sans tracking-tight font-semibold mb-4">Access Denied</h2>
          <p className="text-text-muted mb-8 max-w-sm text-sm">Please log in to view and manage your community profile.</p>
          <button 
             onClick={handleJoinAction}
             className="bg-electric-mint text-slate-base px-10 py-4 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-club-green transition-all shadow-xl cursor-pointer"
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
      <section className="bg-white rounded-lg-2xl shadow-sm border border-slate-base/5 overflow-hidden mb-16">
        <div className="h-48 bg-slate-base relative">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_30%,_white,_transparent_70%)]" />
        </div>
        
        <div className="px-12 pb-12">
          <div className="relative -mt-20 flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
            <div className="flex flex-col md:flex-row md:items-end gap-8">
              <div className="w-40 h-40 bg-white rounded-lg-2xl border-8 border-white shadow-2xl flex items-center justify-center overflow-hidden">
                <div className="w-full h-full bg-electric-mint flex items-center justify-center text-slate-base text-5xl font-black font-sans tracking-tight font-semibold italic">
                  {(profile?.name || user.displayName || 'U').charAt(0)}
                </div>
              </div>
              
              <div className="pb-4">
                <h1 className="text-5xl text-slate-base italic font-sans tracking-tight font-semibold mb-4 leading-tight">
                  {profile?.name || user.displayName}
                </h1>
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2 text-slate-base/40">
                    <UserIcon size={14} className="text-electric-mint" />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Member</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-base/40">
                    <Mail size={14} className="text-club-green" />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">{profile?.email || user.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-12 border-t border-slate-base/5">
             <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-base/40 mb-4">Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {(profile?.topics || ['Economics', 'Finance']).map(topic => (
                    <Badge key={topic} variant="outline" className="px-4 py-1.5 bg-surface-base border border-surface-high rounded-lg text-[10px] font-black uppercase tracking-widest text-text-muted">
                      {topic}
                    </Badge>
                  ))}
                </div>
             </div>
             <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-base/40 mb-4">Stats</h4>
                <div className="flex gap-12">
                   <div>
                      <p className="text-3xl text-slate-base font-sans tracking-tight font-semibold italic">{myPosts.length}</p>
                      <p className="text-[10px] text-slate-base/40 uppercase font-black tracking-widest">Contributions</p>
                   </div>
                   <div>
                      <p className="text-3xl text-slate-base font-sans tracking-tight font-semibold italic">
                        {myPosts.reduce((acc, p) => acc + (p.likes || 0), 0)}
                      </p>
                      <p className="text-[10px] text-slate-base/40 uppercase font-black tracking-widest">Total Likes</p>
                   </div>
                </div>
             </div>
             <div className="flex items-center justify-md-end">
                <button className="bg-electric-mint text-slate-base px-8 py-4 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-club-green transition-all shadow-xl">
                   Edit Profile
                </button>
             </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab} className="mb-16">
        <TabsList className="flex gap-12 border-b border-slate-base/5 mb-16 overflow-x-auto bg-transparent p-0 rounded-lg-none w-full justify-start h-auto">
          {[
            { id: 'posts', label: 'My Contributions' },
            { id: 'bookmarks', label: 'Saved Analysis' },
            { id: 'activity', label: 'Activity Log' },
          ].map(tab => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="pb-6 text-xs font-black uppercase tracking-[0.2em] relative transition-all whitespace-nowrap rounded-lg-none border-b-2 border-transparent data-[state=active]:border-electric-mint data-[state=active]:text-electric-mint text-text-muted hover:text-text-primary bg-transparent data-[state=active]:bg-transparent p-0 h-auto dark:bg-transparent dark:data-[state=active]:bg-transparent"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="posts">
          {loadingPosts ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
              <Skeleton className="h-48 w-full bg-white/5 border border-slate-base/5 rounded-lg-2xl" />
              <Skeleton className="h-48 w-full bg-white/5 border border-slate-base/5 rounded-lg-2xl" />
              <Skeleton className="h-48 w-full bg-white/5 border border-slate-base/5 rounded-lg-2xl" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
                {myPosts.map((post, i) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group p-8 rounded-lg-2xl bg-white border border-slate-base/5 hover:border-electric-mint/20 hover:shadow-xl transition-all"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <Badge variant="outline" className="px-3 py-1 bg-electric-mint/5 text-electric-mint border-transparent text-[8px] font-black uppercase tracking-widest rounded-lg">
                        {post.type}
                      </Badge>
                      <div className="flex items-center gap-1.5 text-club-green">
                        <span className="material-symbols-outlined text-sm">favorite</span>
                        <span className="text-[10px] font-bold">{post.likes}</span>
                      </div>
                    </div>
                    <h3 className="text-xl text-slate-base font-sans tracking-tight font-semibold italic mb-4 line-clamp-2 leading-relaxed">
                      {post.title || post.content.substring(0, 50) + '...'}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-base/40 uppercase tracking-widest">
                      {post.category}
                    </p>
                  </motion.div>
                ))}
              </div>

              {myPosts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                   <div className="w-20 h-20 bg-slate-base/5 rounded-lg flex items-center justify-center text-slate-base/20 mb-8">
                      <Briefcase size={40} />
                   </div>
                   <h3 className="text-3xl text-text-primary italic font-sans tracking-tight font-semibold mb-4">No Activity Yet</h3>
                   <p className="text-text-muted font-sans italic max-w-sm">
                     Start contributing to the community feed to build your intellectual portfolio.
                   </p>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="bookmarks">
          <div className="flex flex-col items-center justify-center py-20 text-center">
             <h3 className="text-2xl text-text-primary italic font-sans tracking-tight font-semibold mb-4">No Bookmarked Analysis</h3>
             <p className="text-text-muted font-sans italic max-w-sm">
               Bookmark posts from the explore page to read them later.
             </p>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <div className="flex flex-col items-center justify-center py-20 text-center">
             <h3 className="text-2xl text-text-primary italic font-sans tracking-tight font-semibold mb-4">No Recent Activity</h3>
             <p className="text-text-muted font-sans italic max-w-sm">
               Your recent interactions and activities will be displayed here.
             </p>
          </div>
        </TabsContent>
      </Tabs>
    </motion.main>
  );
}
