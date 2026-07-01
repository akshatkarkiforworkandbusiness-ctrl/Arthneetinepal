import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Briefcase, User as UserIcon, Award, BookOpen, Star, X, Check, Plus, TrendingUp, Bookmark } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
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

interface PublicProfile {
  name: string;
  topics: string[];
}

const AVAILABLE_TOPICS = [
  'Economics', 'Finance', 'Stock Market', 'NEPSE', 'Investment',
  'Banking', 'Fiscal Policy', 'Trade', 'Development', 'Policy',
  'Entrepreneurship', 'Real Estate', 'Cryptocurrency', 'Insurance',
  'Taxation', 'Agriculture', 'Tourism', 'Energy'
];

const TOPIC_COLORS: Record<string, string> = {
  'Economics': 'bg-purple-100 text-purple-700 border-purple-200',
  'Finance': 'bg-blue-100 text-blue-700 border-blue-200',
  'Stock Market': 'bg-green-100 text-green-700 border-green-200',
  'NEPSE': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Investment': 'bg-amber-100 text-amber-700 border-amber-200',
  'Banking': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Fiscal Policy': 'bg-rose-100 text-rose-700 border-rose-200',
  'Trade': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Development': 'bg-teal-100 text-teal-700 border-teal-200',
  'Policy': 'bg-violet-100 text-violet-700 border-violet-200',
  'Entrepreneurship': 'bg-orange-100 text-orange-700 border-orange-200',
  'Real Estate': 'bg-pink-100 text-pink-700 border-pink-200',
  'Cryptocurrency': 'bg-sky-100 text-sky-700 border-sky-200',
  'Insurance': 'bg-lime-100 text-lime-700 border-lime-200',
  'Taxation': 'bg-red-100 text-red-700 border-red-200',
  'Agriculture': 'bg-green-100 text-green-700 border-green-200',
  'Tourism': 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
  'Energy': 'bg-yellow-100 text-yellow-700 border-yellow-200',
};

function getTopicColor(topic: string): string {
  return TOPIC_COLORS[topic] || 'bg-gray-100 text-gray-700 border-gray-200';
}

export default function ProfilePage() {
  const { userId } = useParams<{ userId?: string }>();
  const { user, profile: ownProfile, updateProfile, handleJoinAction } = useAuth();

  const isOwnProfile = !userId || (!!user && userId === user.uid);
  const targetUid = isOwnProfile ? user?.uid : userId;

  const [activeTab, setActiveTab] = useState('posts');
  const [myPosts, setMyPosts] = useState<UserPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [publicProfile, setPublicProfile] = useState<PublicProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(!isOwnProfile);
  const [learningProgress, setLearningProgress] = useState<{completed: string[], quizScores: Record<string, number>, badges: string[]}>({completed: [], quizScores: {}, badges: []});
  const [loadingProgress, setLoadingProgress] = useState(true);

  // Edit Profile modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTopics, setEditTopics] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOwnProfile || !targetUid) { setLoadingProfile(false); return; }
    let cancelled = false;
    getDoc(doc(db, 'users', targetUid))
      .then(snap => {
        if (cancelled) return;
        if (snap.exists()) {
          const data = snap.data();
          setPublicProfile({ name: data.name, topics: data.topics || [] });
        } else {
          setPublicProfile(null);
        }
      })
      .catch(error => handleFirestoreError(error, OperationType.GET, `users/${targetUid}`))
      .finally(() => { if (!cancelled) setLoadingProfile(false); });
    return () => { cancelled = true; };
  }, [isOwnProfile, targetUid]);

  useEffect(() => {
    if (!targetUid) return;
    const fetchProgress = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', targetUid, 'progress', 'lessons'));
        if (snap.exists()) {
          const data = snap.data();
          setLearningProgress({
            completed: data.completed || [],
            quizScores: data.quizScores || {},
            badges: data.badges || []
          });
        }
      } catch (err) {
        console.error("Failed to load progress", err);
      } finally {
        setLoadingProgress(false);
      }
    };
    fetchProgress();
  }, [targetUid]);

  useEffect(() => {
    if (!targetUid) return;

    const path = 'posts';
    const q = query(
      collection(db, path),
      where('authorId', '==', targetUid),
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
  }, [targetUid]);

  const openEditModal = () => {
    setEditName(ownProfile?.name || user?.displayName || '');
    setEditTopics(ownProfile?.topics || []);
    setShowEditModal(true);
  };

  const toggleTopic = (topic: string) => {
    setEditTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const saveProfile = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await updateProfile({ name: editName.trim(), topics: editTopics });
      setShowEditModal(false);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setSaving(false);
    }
  };

  if (isOwnProfile && !user) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-purple-50">
       <div className="text-center p-12 bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-teal-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-200">
            <UserIcon size={36} className="text-white" />
          </div>
          <h2 className="text-3xl text-gray-900 font-sans tracking-tight font-bold mb-3">Welcome Back</h2>
          <p className="text-gray-500 mb-8 max-w-sm text-sm leading-relaxed">Sign in to view and manage your community profile, track your learning progress, and connect with fellow members.</p>
          <button 
             onClick={handleJoinAction}
             className="bg-gradient-to-r from-purple-600 to-teal-500 text-white px-10 py-4 rounded-2xl text-sm font-bold uppercase tracking-wider hover:from-purple-700 hover:to-teal-600 transition-all shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300 hover:-translate-y-0.5 cursor-pointer"
          >
             Sign In with Google
          </button>
       </div>
    </div>
  );

  if (!isOwnProfile && loadingProfile) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-16">
        <Skeleton className="h-72 w-full bg-gradient-to-r from-purple-100 to-teal-100 rounded-3xl" />
      </main>
    );
  }

  if (!isOwnProfile && !publicProfile) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-32 text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <UserIcon size={40} className="text-gray-400" />
        </div>
        <h2 className="text-3xl text-gray-900 font-sans tracking-tight font-bold mb-3">Member Not Found</h2>
        <p className="text-gray-500">This profile doesn't exist or has been removed.</p>
      </main>
    );
  }

  const displayName = isOwnProfile ? (ownProfile?.name || user?.displayName) : publicProfile?.name;
  const displayTopics = isOwnProfile ? (ownProfile?.topics || ['Economics', 'Finance']) : (publicProfile?.topics || []);

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto px-6 py-12"
    >
      {/* Profile Header Card */}
      <section className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden mb-12">
        {/* Gradient Banner */}
        <div className="h-48 bg-gradient-to-r from-purple-600 via-purple-500 to-teal-400 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_40%,_white,_transparent_60%)]" />
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_80%_70%,_white,_transparent_50%)]" />
          <div className="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-4 left-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />
        </div>
        
        <div className="px-10 pb-10">
          <div className="relative -mt-16 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              {/* Avatar */}
              <div className="w-36 h-36 bg-white rounded-3xl border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-teal-400 flex items-center justify-center text-white text-5xl font-black font-sans tracking-tight shadow-inner">
                  {(displayName || 'U').charAt(0).toUpperCase()}
                </div>
              </div>
              
              <div className="pb-2">
                <h1 className="text-4xl text-gray-900 font-sans tracking-tight font-bold mb-3 leading-tight">
                  {displayName}
                </h1>
                <div className="flex flex-wrap items-center gap-5">
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                      <UserIcon size={12} className="text-purple-600" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider">Member</span>
                  </div>
                  {isOwnProfile && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="w-6 h-6 bg-teal-100 rounded-lg flex items-center justify-center">
                        <Mail size={12} className="text-teal-600" />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wider">{ownProfile?.email || user?.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-gray-100">
             {/* Interests */}
             <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {displayTopics.map(topic => (
                    <span key={topic} className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${getTopicColor(topic)}`}>
                      {topic}
                    </span>
                  ))}
                </div>
             </div>

             {/* Stats */}
             <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Stats</h4>
                <div className="flex gap-10">
                   <div>
                      <p className="text-3xl text-gray-900 font-sans tracking-tight font-bold">{myPosts.length}</p>
                      <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Posts</p>
                   </div>
                   <div>
                      <p className="text-3xl text-gray-900 font-sans tracking-tight font-bold">
                        {myPosts.reduce((acc, p) => acc + (p.likes || 0), 0)}
                      </p>
                      <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Likes</p>
                   </div>
                </div>
             </div>

             {/* Edit Button */}
             {isOwnProfile && (
               <div className="flex items-center md:justify-end">
                  <button 
                    onClick={openEditModal}
                    className="bg-gradient-to-r from-purple-600 to-teal-500 text-white px-8 py-3.5 rounded-2xl text-sm font-bold uppercase tracking-wider hover:from-purple-700 hover:to-teal-600 transition-all shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300 hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                     Edit Profile
                  </button>
               </div>
             )}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab} className="mb-12">
        <TabsList variant="line" className="flex gap-8 border-b border-gray-200 mb-10 overflow-x-auto bg-transparent p-0 rounded-none w-full justify-start h-auto">
          {[
            { id: 'posts', label: isOwnProfile ? 'My Contributions' : 'Contributions', icon: <Briefcase size={14} /> },
            ...(isOwnProfile ? [
              { id: 'learning', label: 'My Learning', icon: <BookOpen size={14} /> },
              { id: 'bookmarks', label: 'Saved Analysis', icon: <Bookmark size={14} /> },
              { id: 'activity', label: 'Activity Log', icon: <TrendingUp size={14} /> },
            ] : []),
          ].map(tab => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="pb-5 text-xs font-bold uppercase tracking-wider relative transition-all whitespace-nowrap rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:text-purple-600 text-gray-400 hover:text-gray-700 bg-transparent data-[state=active]:bg-transparent p-0 h-auto gap-2"
            >
              {tab.icon}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="posts">
          {loadingPosts ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              <Skeleton className="h-52 w-full bg-gradient-to-br from-purple-50 to-teal-50 border border-purple-100 rounded-3xl" />
              <Skeleton className="h-52 w-full bg-gradient-to-br from-purple-50 to-teal-50 border border-purple-100 rounded-3xl" />
              <Skeleton className="h-52 w-full bg-gradient-to-br from-purple-50 to-teal-50 border border-purple-100 rounded-3xl" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {myPosts.map((post, i) => (
                  <motion.a
                    key={post.id}
                    href={`/post/${post.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group p-6 rounded-3xl bg-white border border-gray-100 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-100/50 transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider ${
                        post.type === 'research' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                        post.type === 'question' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        'bg-purple-50 text-purple-600 border border-purple-100'
                      }`}>
                        {post.type}
                      </span>
                      <div className="flex items-center gap-1.5 text-rose-500">
                        <span className="material-symbols-outlined text-sm">favorite</span>
                        <span className="text-xs font-bold">{post.likes}</span>
                      </div>
                    </div>
                    <h3 className="text-lg text-gray-900 font-sans tracking-tight font-semibold mb-3 line-clamp-2 leading-relaxed group-hover:text-purple-700 transition-colors">
                      {post.title || post.content.substring(0, 50) + '...'}
                    </h3>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {post.category}
                    </p>
                  </motion.a>
                ))}
              </div>

              {myPosts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                   <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-teal-100 rounded-2xl flex items-center justify-center mb-6">
                      <Briefcase size={36} className="text-purple-400" />
                   </div>
                   <h3 className="text-2xl text-gray-900 font-sans tracking-tight font-bold mb-3">No Contributions Yet</h3>
                   <p className="text-gray-500 font-sans max-w-sm leading-relaxed">
                     {isOwnProfile ? 'Start sharing your insights with the community to build your intellectual portfolio.' : 'This member hasn\u2019t contributed anything yet.'}
                   </p>
                   {isOwnProfile && (
                     <a href="/community" className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-teal-500 text-white rounded-2xl text-sm font-bold uppercase tracking-wider hover:from-purple-700 hover:to-teal-600 transition-all shadow-lg shadow-purple-200">
                       Start Contributing
                     </a>
                   )}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {isOwnProfile && (
          <>
            <TabsContent value="learning">
              {loadingProgress ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Skeleton className="h-48 w-full bg-gradient-to-br from-purple-50 to-teal-50 border border-purple-100 rounded-3xl max-w-2xl" />
                </div>
              ) : (
                <div className="max-w-4xl mx-auto space-y-10">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-8 bg-white border border-gray-100 rounded-3xl shadow-sm text-center hover:shadow-lg hover:shadow-purple-100/50 transition-all duration-300">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-50 text-purple-600 mx-auto rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                        <BookOpen size={28} />
                      </div>
                      <h4 className="text-3xl text-gray-900 font-sans tracking-tight font-bold">{learningProgress.completed.length}</h4>
                      <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider mt-2">Lessons Completed</p>
                    </div>
                    <div className="p-8 bg-white border border-gray-100 rounded-3xl shadow-sm text-center hover:shadow-lg hover:shadow-amber-100/50 transition-all duration-300">
                      <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 mx-auto rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                        <Star size={28} />
                      </div>
                      <h4 className="text-3xl text-gray-900 font-sans tracking-tight font-bold">
                        {Object.keys(learningProgress.quizScores).length > 0 
                          ? Math.round(Object.values(learningProgress.quizScores).reduce((a, b) => a + b, 0) / Object.keys(learningProgress.quizScores).length)
                          : 0}%
                      </h4>
                      <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider mt-2">Avg. Quiz Score</p>
                    </div>
                    <div className="p-8 bg-white border border-gray-100 rounded-3xl shadow-sm text-center hover:shadow-lg hover:shadow-teal-100/50 transition-all duration-300">
                      <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-teal-50 text-teal-600 mx-auto rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                        <Award size={28} />
                      </div>
                      <h4 className="text-3xl text-gray-900 font-sans tracking-tight font-bold">{learningProgress.badges.length}</h4>
                      <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider mt-2">Badges Earned</p>
                    </div>
                  </div>

                  {/* Badges Section */}
                  <div>
                    <h3 className="text-xl text-gray-900 font-sans tracking-tight font-bold mb-6">Earned Badges</h3>
                    {learningProgress.badges.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center bg-gradient-to-br from-gray-50 to-white rounded-3xl border border-gray-100">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-teal-100 rounded-2xl flex items-center justify-center mb-4">
                          <Award size={28} className="text-purple-400" />
                        </div>
                        <p className="text-gray-500 font-sans">Complete lessons and quizzes to earn badges.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                        {learningProgress.badges.map(badge => (
                          <div key={badge} className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm text-center flex flex-col items-center justify-center relative overflow-hidden group hover:shadow-lg hover:shadow-purple-100/50 transition-all duration-300">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-teal-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-teal-400 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200 mb-3 transform group-hover:scale-110 transition-transform duration-300 relative z-10">
                               <Award size={28} />
                            </div>
                            <h4 className="text-sm font-sans tracking-tight font-semibold text-gray-900 mb-1 relative z-10">{badge}</h4>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-teal-500 relative z-10">Unlocked</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="bookmarks">
              <div className="flex flex-col items-center justify-center py-16 text-center">
                 <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                   <Bookmark size={36} className="text-blue-400" />
                 </div>
                 <h3 className="text-2xl text-gray-900 font-sans tracking-tight font-bold mb-3">No Saved Analysis</h3>
                 <p className="text-gray-500 font-sans max-w-sm leading-relaxed">
                   Bookmark posts from the explore page to read them later.
                 </p>
              </div>
            </TabsContent>

            <TabsContent value="activity">
              <div className="flex flex-col items-center justify-center py-16 text-center">
                 <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                   <TrendingUp size={36} className="text-green-400" />
                 </div>
                 <h3 className="text-2xl text-gray-900 font-sans tracking-tight font-bold mb-3">No Recent Activity</h3>
                 <p className="text-gray-500 font-sans max-w-sm leading-relaxed">
                   Your recent interactions and activities will be displayed here.
                 </p>
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={() => setShowEditModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-purple-600 to-teal-500 p-6 text-white relative">
                  <button 
                    onClick={() => setShowEditModal(false)}
                    className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                  <h3 className="text-xl font-bold font-sans">Edit Profile</h3>
                  <p className="text-white/70 text-sm mt-1">Update your name and interests</p>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                  {/* Name Field */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Display Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder:text-gray-400"
                      placeholder="Enter your name"
                    />
                  </div>

                  {/* Topics Selection */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Your Interests</label>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_TOPICS.map(topic => {
                        const isSelected = editTopics.includes(topic);
                        return (
                          <button
                            key={topic}
                            onClick={() => toggleTopic(topic)}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-gradient-to-r from-purple-500 to-teal-400 text-white border-transparent shadow-md shadow-purple-200'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:text-purple-600'
                            }`}
                          >
                            {isSelected && <Check size={10} className="inline mr-1" />}
                            {topic}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveProfile}
                    disabled={saving || !editName.trim()}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-teal-500 text-white text-sm font-bold rounded-2xl hover:from-purple-700 hover:to-teal-600 transition-all shadow-lg shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.main>
  );
}
