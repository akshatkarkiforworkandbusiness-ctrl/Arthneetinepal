import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, 
  doc, updateDoc, increment, where, getDocs, setDoc, deleteDoc, getDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import { Heart, MessageSquare, Share2, Download, Plus, FileText, HelpCircle, MoreVertical, X, RefreshCw, Users } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { GradientCard } from './GradientCard';
import LeaderboardPage from './LeaderboardPage';
import CommunityAssistant from './CommunityAssistant';
import PostActions from './PostActions';
import SeedButton from './SeedButton';
import {
  TRENDING_SECTORS,
  SECTOR_ICONS,
  SECTOR_DESCRIPTIONS,
  researchSectorNews,
  type Sector,
} from '../lib/newsService';
import type { Post } from '../types/post';

export default function CommunityPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const sectorParam = searchParams.get('sector') as Sector | null;
  const validSector = sectorParam && TRENDING_SECTORS.includes(sectorParam as Sector) ? sectorParam as Sector : null;
  const tabParam = searchParams.get('tab');
  const dateParam = searchParams.get('date');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'discussions' | 'research' | 'questions' | 'news' | 'leaderboard'>(
    tabParam === 'news' ? 'news' : 'discussions'
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCommunityAssistant, setShowCommunityAssistant] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  
  // Create Post State
  const [isUploading, setIsUploading] = useState(false);
  const [createData, setCreateData] = useState({
    title: '',
    category: 'Finance' as any,
    content: '', // Rich text
    abstract: '',
    image: null as File | null,
    pdf: null as File | null,
    authorName: '', // Pre-filled but editable
  });

  useEffect(() => {
    if (profile) {
      setCreateData(prev => ({ ...prev, authorName: profile.name }));
    }
  }, [profile]);

  // Seeding & Cleanup Logic
  useEffect(() => {
    const seedAndCleanup = async () => {
      try {
        const metaRef = doc(db, 'meta', 'seeded');
        const metaSnap = await getDoc(metaRef);
        
        // 1. Hardened Cleanup: Remove any duplicates (identifiable by title and author)
        const postsSnap = await getDocs(collection(db, 'posts'));
        const seen = new Set<string>();
        const toDelete: string[] = [];

        postsSnap.docs.forEach(docSnap => {
          const data = docSnap.data();
          const identifier = `${data.title}-${data.author}`;
          if (seen.has(identifier)) {
            toDelete.push(docSnap.id);
          } else {
            seen.add(identifier);
          }
        });

        if (toDelete.length > 0) {
          console.log(`Cleaning up ${toDelete.length} duplicate posts...`);
          for (const id of toDelete) {
            await deleteDoc(doc(db, 'posts', id));
          }
        }
        
        // 2. Controlled Seeding
        const metaRefV6 = doc(db, 'meta', 'seeded_v6');
        const metaSnapV6 = await getDoc(metaRefV6);

        if (!metaSnapV6.exists()) {
          const seededPosts = [
            {
              title: "Fundamental Analysis of Stocks: Reading a Company Before You Invest",
              author: "Akshat Karki",
              category: "Finance",
              type: "discussion",
              createdAt: serverTimestamp(),
              likes: 47,
              commentCount: 0,
              seeded: true,
              content: `Before you buy a single share of any company, you owe it to yourself — and your money — to actually understand what that business does, how it makes money, and whether the price you are being asked to pay is reasonable. This is the essence of fundamental analysis, and it is the single most important skill separating investors from gamblers. Start with the income statement, which tells you whether the company is genuinely profitable — look at revenue growth over multiple years, not just one good quarter, and pay attention to net profit margins, because a company selling billions but keeping almost nothing is a red flag. Move to the balance sheet next, where you get a honest picture of financial health: how much debt does the company carry relative to its equity, does it have enough liquid assets to survive a bad year, and is it consistently generating more than it owes. The cash flow statement is arguably the most telling of all three, because profit on paper can be manipulated through accounting choices, but cash moving in and out of a business is much harder to fake — a company consistently generating strong operating cash flow is usually a company with a real, functioning business model. In the Nepali context, when analyzing NEPSE-listed companies — particularly banks, hydropower projects, and insurance firms — pay close attention to metrics like earnings per share (EPS), price-to-earnings ratio (P/E), net worth per share, and return on equity (ROE), all of which are publicly available through the company's annual reports and the NEPSE website itself. Beyond the numbers, ask qualitative questions too: does this company have a competitive advantage, is management trustworthy and transparent, does the industry it operates in have long-term growth potential in Nepal's developing economy. Numbers tell you what a company has done — judgment tells you what it is likely to do next — and fundamental analysis is the disciplined practice of combining both before you commit your hard-earned money.`,
              imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1000"
            },
            {
              title: "Technical Analysis of Stocks: How to Read Charts Like a Trader",
              author: "Manash Koirala",
              category: "Finance",
              type: "discussion",
              createdAt: serverTimestamp(),
              likes: 38,
              commentCount: 0,
              seeded: true,
              content: `Where fundamental analysis asks what a company is worth, technical analysis asks what the market is doing right now — and for active traders, that distinction is everything. Technical analysis is the practice of reading price charts, volume patterns, and momentum indicators to forecast where a stock is likely to move next, based on the simple but powerful premise that all known information about a stock is already reflected in its price, and that human behavior in markets tends to repeat itself in recognizable patterns. The first thing any aspiring trader needs to get comfortable with is the candlestick chart — each candle tells you four things about a given time period: the opening price, the closing price, the highest point reached, and the lowest point touched — and learning to read clusters of these candles reveals whether buyers or sellers are currently in control of a stock. From there, support and resistance levels become your map: support is a price floor where buying interest has historically been strong enough to stop a stock from falling further, while resistance is a ceiling where selling pressure tends to overpower buyers — and when a stock decisively breaks through either level on high volume, it often signals the beginning of a significant move. Moving averages — particularly the 50-day and 200-day — smooth out the noise of daily price swings and help traders identify the broader trend direction, with the widely watched "golden cross" occurring when the shorter average crosses above the longer one, historically signaling bullish momentum. Indicators like the Relative Strength Index (RSI) tell you whether a stock is overbought or oversold, the MACD helps identify shifts in momentum before they fully materialize in price, and volume analysis confirms whether a price move has genuine conviction behind it or is likely to reverse. In the context of NEPSE, technical analysis is particularly relevant because the market is still developing in terms of information transparency, meaning price action and volume patterns often reveal institutional and broker behavior before any news becomes public — watching for unusual volume spikes, breakouts from consolidation zones, and trend reversals on the NEPSE chart can give alert traders a meaningful edge. The most important thing to internalize about technical analysis, however, is that no indicator is a crystal ball — they are probabilistic tools, not guarantees, and the best traders use them not to predict the future with certainty but to identify high-probability setups where the potential reward clearly justifies the risk being taken.`,
              imageUrl: "https://images.unsplash.com/photo-1611974714658-75d4f1ad33da?auto=format&fit=crop&q=80&w=1000"
            },
            {
              title: "Budgeting & Saving: The Financial Foundation You Can't Skip",
              author: "Pranjal Khatiwada",
              category: "Finance",
              type: "discussion",
              createdAt: serverTimestamp(),
              likes: 55,
              commentCount: 0,
              seeded: true,
              content: `Before you invest a single rupee, you need to know where your rupees are going. Budgeting is not about restriction — it's about intention. This post covers the 50/30/20 rule adapted for Nepali students and young earners, how to track expenses (apps, spreadsheets, or just a notebook), and how to build an emergency fund before you think about the stock market. We'll also cover the psychology of saving — why it's hard, why lifestyle inflation is dangerous, and how small habits compound into wealth over time. Financial freedom starts with knowing your numbers. This is the foundation. Everything else is built on top of it.`,
              imageUrl: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=1000"
            },
            {
              title: "Investment Roadmap for Beginners: Where to Start and How to Grow",
              author: "Ujjwal Dhungana",
              category: "Finance",
              type: "discussion",
              createdAt: serverTimestamp(),
              likes: 62,
              commentCount: 0,
              seeded: true,
              content: `Starting your investment journey in Nepal begins with one essential step: understanding what you are getting into before putting a single rupee at risk. The Nepal Stock Exchange (NEPSE) is the country's only stock market, and for most Nepalese beginners, it represents the most accessible entry point into formal investing. Before diving in, you need a DEMAT account — opened through your bank or a licensed broker — which is essentially a digital wallet that holds your shares. From there, the smartest move is not to chase hot stocks based on tips from friends or social media, but to start with what you actually understand. Many beginners in Nepal find it useful to look at companies they interact with daily — banks, hydropower firms, insurance companies — since these sectors dominate NEPSE and tend to be more stable than speculative counters. Mutual funds are another underrated starting point, particularly for those who do not yet have the confidence or time to pick individual stocks, as they pool money across many securities and spread the risk. The honest truth about NEPSE is that it can be volatile — prices swing with political news, interest rate changes from Nepal Rastra Bank, and even seasonal liquidity patterns tied to agricultural cycles and remittance flows. This means patience is not just a virtue here; it is a strategy. Growing your investments over time means consistently reinvesting returns, gradually learning to read financial statements of listed companies, and resisting the very human urge to panic-sell during market dips. Nepal's capital market is still maturing, which cuts both ways — there is real risk, but also real opportunity for those who take the time to learn the rules of the game before playing it .`,
              imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=1000"
            },
            {
              title: "Why Is Gold So Popular Right Now? A Macroeconomic Perspective",
              author: "Aman",
              category: "Economics",
              type: "discussion",
              createdAt: serverTimestamp(),
              likes: 41,
              commentCount: 0,
              seeded: true,
              content: `Gold's extraordinary rally — surging over 60% in 2025 and briefly surpassing $5,500 per ounce — is no accident. It reflects a confluence of powerful macroeconomic forces reshaping the global financial landscape. Persistent inflation has eroded confidence in paper currencies, driving investors toward hard assets that preserve real purchasing power. Meanwhile, central banks — particularly in emerging markets like China, India, and Turkey — have been buying electric-mint at record levels, seeking to reduce dependence on the US dollar following the weaponization of dollar-based sanctions against Russia. This broader de-dollarization trend, combined with a weakening dollar index, has made electric-mint increasingly attractive as a neutral, sovereign-free store of value. Compounding this, an exceptionally volatile geopolitical environment — marked by ongoing conflicts and US-China tensions — has embedded a significant "fear premium" into prices. On the monetary policy side, the US Federal Reserve's rate-cutting cycle has lowered the opportunity cost of holding non-yielding electric-mint, while record ETF inflows have brought the rally within reach of everyday investors. Taken together, electric-mint's rise is less a speculative bubble and more a rational, broad-based response to a world questioning the reliability of traditional financial systems — making it one of the most important macroeconomic stories of our time.`,
              imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1000"
            },
            {
              title: "How to Educate Yourself Financially: A Self-Learning Roadmap",
              author: "Biraj",
              category: "Finance",
              type: "discussion",
              createdAt: serverTimestamp(),
              likes: 33,
              commentCount: 0,
              seeded: true,
              content: `Financial education rarely comes from a single book, course, or moment of inspiration — it builds slowly, through consistent curiosity and the willingness to learn from both theory and real-world mistakes. The most honest starting point is admitting what you do not know, because most people's financial blind spots are not about complex instruments or advanced mathematics — they are about basics like how interest compounds, what inflation actually does to savings, and why diversification matters. From there, the self-learning journey has a natural progression: start with personal finance fundamentals — budgeting, debt management, emergency funds — before ever touching investment concepts. Books like Robert Kiyosaki's Rich Dad Poor Dad, Morgan Housel's The Psychology of Money, and Benjamin Graham's The Intelligent Investor are widely recommended not because they give you stock tips, but because they reshape how you think about money entirely. Once the mindset is in place, move into understanding how markets work — read annual reports of companies you are curious about, follow credible financial news sources, and study how economic indicators like inflation, interest rates, and GDP growth connect to asset prices. In the Nepali context, this means paying attention to Nepal Rastra Bank's monetary policy announcements, understanding how remittance flows affect liquidity in the economy, and following NEPSE trends with analytical eyes rather than speculative ones. YouTube channels, podcasts, and free platforms like Investopedia have made quality financial education more accessible than ever, but the real differentiator is application — tracking your own spending, paper-trading before investing real money, and discussing ideas with peers who challenge your thinking. Financial literacy is ultimately a lifelong practice, not a destination, and the people who grow their wealth most consistently are almost always the ones who never stopped treating themselves as students of money.`,
              imageUrl: "/financial_roadmap.png"
            }
          ];

          // Check for existing before seeding to avoid duplicates
          for (const p of seededPosts) {
            const existingQ = query(collection(db, 'posts'), where('title', '==', p.title), where('author', '==', p.author));
            const existingSnap = await getDocs(existingQ);
            if (existingSnap.empty) {
              await addDoc(collection(db, 'posts'), p);
            } else {
              // Update content and imageUrl for existing seeded posts to reflect changes in central data
              const docId = existingSnap.docs[0].id;
              await updateDoc(doc(db, 'posts', docId), { 
                content: p.content,
                imageUrl: p.imageUrl
              });
            }
          }
          await setDoc(metaRefV6, { seededAt: serverTimestamp() });
        }
      } catch (error) {
        console.warn("Seeding or Cleanup failed/skipped", error);
      }
    };
    seedAndCleanup();
  }, []);

// Listen for Posts
useEffect(() => {
  const path = 'posts';
  const qPosts = query(collection(db, path), orderBy('createdAt', 'desc'));
  const unsubscribe = onSnapshot(qPosts, 
    (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
      setLoading(false);
    },
    (error) => {
      // Non-auth users might hit this if rules change, but we allow public read
      handleFirestoreError(error, OperationType.LIST, path);
      setLoading(false);
    }
  );
  return () => unsubscribe();
}, []);

// Handle News Workflow
useEffect(() => {
  if (!validSector || tabParam !== 'news' || !dateParam) return;
  
  const handleNewsWorkflow = async () => {
    setNewsLoading(true);
    setNewsError(null);
    
    try {
      // Check for existing news article for this sector today
      const today = new Date().toISOString().split('T')[0];
      const postsRef = collection(db, 'posts');
      const existingQuery = query(
        postsRef,
        where('sector', '==', validSector),
        where('newsDate', '==', today),
        where('type', '==', 'news')
      );
      const existingSnap = await getDocs(existingQuery);
      
      if (!existingSnap.empty) {
        // Article exists, check if it's reliable (has views > 0 or was created by AI)
        const existingPost = existingSnap.docs[0].data() as Post;
        const postId = existingSnap.docs[0].id;
        
        // Navigate to the existing post
        toast.success(`Found existing ${validSector} news for today`);
        navigate(`/post/${postId}`);
        setNewsLoading(false);
        return;
      }
      
      // No existing article, research and create one
      const result = await researchSectorNews(validSector);
      
      if (result.articles.length > 0) {
        // Create a news post from the first article
        const article = result.articles[0];
        const postData = {
          type: 'news' as const,
          title: article.title,
          author: 'Arthneeti AI',
          authorId: 'system',
          category: 'Finance' as const,
          content: `<p>${article.summary}</p>`,
          sector: validSector,
          newsDate: today,
          source: article.source || 'NVIDIA AI',
          views: 0,
          isDailyNews: true,
          likes: 0,
          commentCount: 0,
          createdAt: serverTimestamp(),
        };
        
        const docRef = await addDoc(postsRef, postData);
        toast.success(`Created new ${validSector} news article`);
        navigate(`/post/${docRef.id}`);
      } else {
        setNewsError('No news articles available for this sector today.');
      }
    } catch (error) {
      console.error('News workflow error:', error);
      setNewsError(error instanceof Error ? error.message : 'Failed to fetch news');
    } finally {
      setNewsLoading(false);
    }
  };
  
  handleNewsWorkflow();
}, [validSector, tabParam, dateParam, navigate]);

const handleLike = async (postId: string) => {
  if (!user) return;
  const postRef = doc(db, 'posts', postId);
  const likePath = `posts/${postId}/likes/${user.uid}`;
  const likeRef = doc(db, likePath);
  
  try {
    const likeSnap = await getDoc(likeRef);
    if (likeSnap.exists()) {
       await deleteDoc(likeRef);
       await updateDoc(postRef, { likes: increment(-1) });
       toast.success("Post unliked!");
    } else {
       await setDoc(likeRef, { likedAt: serverTimestamp() });
       await updateDoc(postRef, { likes: increment(1) });
       toast.success("Post liked!");
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, likePath);
    toast.error("Failed to like post.");
  }
};

  const handleShare = (postId: string) => {
    const url = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUploading(true);

    try {
      let imageUrl = '';
      let pdfUrl = '';

      if (createData.image) {
        const imageRef = ref(storage, `posts/${Date.now()}_${createData.image.name}`);
        await uploadBytes(imageRef, createData.image);
        imageUrl = await getDownloadURL(imageRef);
      }

      if (createData.pdf) {
        const pdfRef = ref(storage, `research/${Date.now()}_${createData.pdf.name}`);
        await uploadBytes(pdfRef, createData.pdf);
        pdfUrl = await getDownloadURL(pdfRef);
      }

      const postData: any = {
        type: activeTab === 'discussions' ? 'discussion' : activeTab === 'research' ? 'research' : 'question',
        title: createData.title,
        author: createData.authorName,
        authorId: user.uid,
        category: createData.category,
        content: createData.content,
        abstract: createData.abstract,
        imageUrl,
        pdfUrl,
        likes: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'posts'), postData);
      setShowCreateModal(false);
      setCreateData({
        title: '',
        category: 'Finance',
        content: '',
        abstract: '',
        image: null,
        pdf: null,
        authorName: profile?.name || '',
      });
      toast.success("Post submitted successfully!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'posts');
      toast.error("Failed to submit post.");
    } finally {
      setIsUploading(false);
    }
  };

  const filteredPosts = posts.filter(p => {
    if (activeTab === 'discussions') return p.type === 'discussion' || p.type === 'trade-recap';
    if (activeTab === 'research') return p.type === 'research';
    if (activeTab === 'questions') return p.type === 'question';
    if (activeTab === 'news') return p.type === 'news';
    return true;
  }).filter(p => {
    if (!validSector) return true;
    const sector = validSector.toLowerCase();
    return (
      (p.title && p.title.toLowerCase().includes(sector)) ||
      p.category.toLowerCase().includes(sector) ||
      p.content.toLowerCase().includes(sector) ||
      (p.sector && p.sector.toLowerCase().includes(sector))
    );
  });


  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 md:px-8 pt-32 pb-24 min-h-screen bg-white"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Sidebar - Navigation (Hidden on Mobile) */}
        <aside className="hidden lg:block lg:col-span-3 space-y-8 sticky top-32 h-fit">
          <div className="flex flex-col gap-2">
            {[
              { icon: 'explore', label: 'Explore', path: '/discover' },
              { icon: 'notifications', label: 'Notifications', path: '/notifications' },
              { icon: 'bookmark', label: 'Bookmarks', path: '/bookmarks' },
              { icon: 'person', label: 'Profile', path: '/profile' },
            ].map((item, idx) => (
              <button 
                key={idx}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-4 p-4 rounded-2xl transition-all text-brandwood hover:bg-sunset-fade/50 hover:text-coral-flame"
              >
                <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                <span className="text-lg tracking-tight">{item.label}</span>
              </button>
            ))}
          </div>

          {user && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="w-full bg-coral-flame text-white py-4 rounded-2xl text-sm font-bold uppercase tracking-widest hover:bg-coral-flame/90 transition-all shadow-warm-float flex items-center justify-center gap-2"
            >
              <Plus size={20} strokeWidth={3} /> Post
            </button>
          )}
        </aside>

        {/* Middle Feed */}
        <div className="col-span-1 lg:col-span-6 space-y-6">
          <div className="bg-white/80 backdrop-blur-md sticky top-20 z-10 p-4 border-b border-blush-mist mb-6">
            <h1 className="text-2xl font-display font-medium text-brandwood tracking-tight">Feed</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 px-4 overflow-x-auto">
            {([
              { key: 'discussions', label: 'Discussion', icon: <MessageSquare size={14} /> },
              { key: 'research', label: 'Research', icon: <FileText size={14} /> },
              { key: 'news', label: 'News', icon: <RefreshCw size={14} /> },
              { key: 'questions', label: 'Questions', icon: <HelpCircle size={14} /> },
              { key: 'leaderboard', label: 'Leaderboard', icon: <Users size={14} /> },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 pb-3 text-xs font-bold uppercase tracking-widest relative transition-colors whitespace-nowrap ${
                  activeTab === tab.key ? 'text-coral-flame' : 'text-text-muted hover:text-brandwood'
                }`}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.key && (
                  <motion.div layoutId="tabIndicator" className="absolute bottom-0 left-0 right-0 h-1 bg-coral-flame rounded-t-lg" />
                )}
              </button>
            ))}
          </div>

          {/* Quick Create Box (for Questions) */}
          {activeTab === 'questions' && user && (
             <div className="bg-white p-6 rounded-3xl border border-blush-mist shadow-warm-lift mb-8 flex gap-4">
               <div className="w-12 h-12 rounded-full bg-sunset-fade flex items-center justify-center text-coral-flame font-black text-lg uppercase shrink-0">
                  {profile?.name?.[0] || user.displayName?.[0] || 'U'}
               </div>
               <div className="flex-1 space-y-4">
                  <textarea 
                    placeholder="Ask the community..."
                    className="w-full bg-transparent border-none outline-none text-brandwood placeholder:text-text-muted resize-none font-sans h-20 text-lg"
                    value={createData.content}
                    onChange={e => setCreateData({...createData, content: e.target.value})}
                  />
                  <div className="flex justify-between items-center border-t border-blush-mist pt-4">
                    <select 
                      value={createData.category}
                      onChange={e => setCreateData({...createData, category: e.target.value as any})}
                      className="bg-sunset-fade text-brandwood text-xs font-bold px-3 py-2 rounded-xl outline-none border border-blush-mist"
                    >
                      <option>Finance</option>
                      <option>Economics</option>
                      <option>Business</option>
                      <option>Policy</option>
                      <option>Other</option>
                    </select>
                    <button 
                      onClick={handleCreateSubmit}
                      disabled={!createData.content.trim() || isUploading}
                      className="bg-coral-flame text-white px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:shadow-warm-float transition-all disabled:opacity-50"
                    >
                      Post
                    </button>
                  </div>
               </div>
             </div>
          )}

          {/* Posts */}
          {activeTab === 'news' && newsLoading && (
            <div className="text-center py-12 bg-white border border-blush-mist rounded-3xl">
              <RefreshCw className="animate-spin mx-auto mb-4 text-coral-flame" size={32} />
              <p className="text-sm font-bold text-brandwood mb-2">Researching {validSector} News</p>
              <p className="text-xs text-text-muted">AI is gathering the latest information...</p>
            </div>
          )}

          {activeTab === 'news' && newsError && (
            <div className="text-center py-12 bg-red-50 border border-red-200 rounded-3xl">
              <span className="material-symbols-outlined text-red-400 text-3xl mb-4 block">error</span>
              <p className="text-sm font-bold text-brandwood mb-2">Failed to Load News</p>
              <p className="text-xs text-text-muted px-4">{newsError}</p>
            </div>
          )}

          {activeTab === 'leaderboard' ? (
            <LeaderboardPage isEmbedded={true} />
          ) : loading ? (
            <div className="space-y-6">
              <Skeleton className="h-40 w-full bg-sunset-fade border border-blush-mist rounded-3xl" />
              <Skeleton className="h-40 w-full bg-sunset-fade border border-blush-mist rounded-3xl" />
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredPosts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-white border border-blush-mist p-6 rounded-3xl shadow-sm hover:shadow-warm-lift transition-all cursor-pointer mb-6"
                  onClick={() => navigate(`/post/${post.id}`)}
                >
                  <div className="flex gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-sunset-fade border border-blush-mist flex items-center justify-center text-coral-flame font-black text-lg uppercase shrink-0">
                      {post.author?.[0] || 'U'}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-brandwood">{post.author}</h4>
                            <span className="text-sm text-text-muted">
                              · {post.createdAt?.toDate ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(post.createdAt.toDate()) : 'Recent'}
                            </span>
                          </div>
                          <span className="inline-block mt-1 text-[9px] font-bold text-mint-action uppercase tracking-widest bg-mint-action/10 px-2 py-0.5 rounded-lg">
                            {post.category}
                          </span>
                        </div>
                        <button className="text-text-muted hover:text-coral-flame transition-colors p-2"><MoreVertical size={16} /></button>
                      </div>

                      {post.type === 'discussion' && (
                        <>
                          <h3 className="text-xl font-display font-medium text-brandwood mb-3 leading-snug">
                            {post.title}
                          </h3>
                          <div className="text-text-muted text-sm leading-relaxed mb-4 line-clamp-4">
                            <div dangerouslySetInnerHTML={{ __html: post.content }} />
                          </div>
                          {post.imageUrl && (
                            <div className="rounded-2xl overflow-hidden mb-4 border border-blush-mist max-h-80">
                              <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          )}
                        </>
                      )}

                      {post.type === 'research' && (
                        <div className="bg-sunset-fade p-6 rounded-2xl border border-blush-mist mb-4">
                          <h3 className="text-lg font-bold text-brandwood mb-2">{post.title}</h3>
                          <p className="text-sm text-text-muted italic mb-4 line-clamp-3">"{post.abstract}"</p>
                          <a 
                            href={post.pdfUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 bg-white text-coral-flame px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border border-blush-mist hover:border-coral-flame transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download size={14} /> Download PDF
                          </a>
                        </div>
                      )}

                      {post.type === 'trade-recap' && (
                        <div className="bg-[#003893]/5 border border-[#003893]/10 p-6 rounded-2xl mb-4 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-20 h-20 bg-[#003893]/10 rounded-bl-full flex items-center justify-center text-[#003893] pointer-events-none">
                            <span className="material-symbols-outlined text-2xl font-bold">trending_up</span>
                          </div>
                          <span className="inline-block mb-2 text-[9px] font-black uppercase tracking-widest text-[#003893] bg-[#003893]/10 px-2 py-0.5 rounded">Shared Trade Recap</span>
                          <h3 className="text-lg font-bold text-brandwood mb-3 leading-snug">{post.title}</h3>
                          <div className="text-text-muted text-sm leading-relaxed mb-2 font-mono" dangerouslySetInnerHTML={{ __html: post.content }} />
                        </div>
                      )}

                      {post.type === 'question' && (
                        <p className="text-lg text-brandwood font-medium italic mb-4">"{post.content}"</p>
                      )}

                      {post.type === 'news' && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 mb-3">
                            <Badge variant="outline" className="text-[10px] font-black text-coral-flame border-coral-flame/30 uppercase tracking-widest bg-coral-flame/10 px-3 py-1 rounded-lg">
                              {post.sector}
                            </Badge>
                            <span className="text-[9px] font-medium text-text-muted uppercase tracking-widest">
                              {post.newsDate}
                            </span>
                            {post.source && (
                              <span className="text-[9px] font-medium text-text-muted uppercase tracking-widest">
                                Source: {post.source}
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-display font-medium text-brandwood mb-3 leading-snug">
                            {post.title}
                          </h3>
                          <div className="text-text-muted text-sm leading-relaxed mb-4">
                            <div dangerouslySetInnerHTML={{ __html: post.content }} />
                          </div>
                          <div className="flex items-center gap-4 text-[10px] text-text-muted">
                            <span className="flex items-center gap-1">
                              <RefreshCw size={12} /> Updated today
                            </span>
                            <span>{post.views || 0} views</span>
                          </div>
                        </div>
                      )}

                      {/* Interactions */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <PostActions
                          postId={post.id}
                          likes={post.likes}
                          commentCount={post.commentCount}
                          compact={true}
                          onCommentClick={() => navigate(`/post/${post.id}#comments`)}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Right Sidebar - Trending & Suggestions */}
        <aside className="hidden xl:block xl:col-span-3 space-y-8 sticky top-32 h-fit">
          {/* Trending Sectors */}
          <div className="bg-sunset-fade border border-blush-mist rounded-3xl p-6">
            <h3 className="text-lg font-display font-bold text-brandwood mb-4">Trending Sectors</h3>
            <div className="space-y-4">
              {TRENDING_SECTORS.map(sector => (
                <button
                  key={sector}
                  onClick={() => setSearchParams({ sector })}
                  className={`w-full text-left p-3 rounded-2xl transition-all flex items-center gap-3 ${validSector === sector ? 'bg-white shadow-sm border-coral-flame border' : 'hover:bg-white border border-transparent'}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-brandwood">
                    <span className="material-symbols-outlined">{SECTOR_ICONS[sector as Sector]}</span>
                  </div>
                  <div>
                    <span className="font-bold text-sm block text-brandwood">{sector}</span>
                    <span className="text-[10px] text-text-muted uppercase tracking-wider">Top Discussions</span>
                  </div>
                </button>
              ))}
            </div>
            {validSector && (
              <button
                onClick={() => setSearchParams({})}
                className="w-full mt-4 py-2 border border-blush-mist rounded-xl text-xs font-bold text-coral-flame uppercase tracking-widest hover:bg-white transition-colors"
              >
                Clear Filter
              </button>
            )}
          </div>

          {/* Suggested To Follow */}
          <div className="bg-sunset-fade border border-blush-mist rounded-3xl p-6">
            <h3 className="text-lg font-display font-bold text-brandwood mb-4">Suggested Academics</h3>
            <div className="space-y-4">
              {['Akshat Karki', 'Manash Koirala', 'Ujjwal Dhungana'].map((name, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white border border-blush-mist flex items-center justify-center text-brandwood font-bold">
                      {name[0]}
                    </div>
                    <div>
                      <span className="font-bold text-sm block text-brandwood">{name}</span>
                      <span className="text-xs text-text-muted">@{(name.split(' ')[0]).toLowerCase()}</span>
                    </div>
                  </div>
                  <button className="px-4 py-1.5 bg-brandwood text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-brandwood/90 transition-colors">
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>

      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] bg-brandwood/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white p-8 md:p-12 rounded-[2rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-warm-float border border-blush-mist"
            >
              <button 
                onClick={() => setShowCreateModal(false)}
                className="absolute top-8 right-8 w-10 h-10 bg-sunset-fade rounded-full flex items-center justify-center text-text-muted hover:text-coral-flame transition-colors"
              >
                <X size={20} />
              </button>

              <h2 className="font-display tracking-tight font-medium text-3xl text-brandwood mb-8">
                {activeTab === 'research' ? 'Submit Research' : 'Create New Post'}
              </h2>

              <form onSubmit={handleCreateSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2 block">Category</label>
                    <select 
                      value={createData.category}
                      onChange={e => setCreateData({...createData, category: e.target.value as any})}
                      className="w-full bg-sunset-fade border border-blush-mist rounded-xl p-4 outline-none focus:border-coral-flame transition-all font-bold text-brandwood"
                    >
                      <option>Finance</option>
                      <option>Economics</option>
                      <option>Business</option>
                      <option>Policy</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2 block">Your Name</label>
                    <input 
                      type="text"
                      value={createData.authorName}
                      onChange={e => setCreateData({...createData, authorName: e.target.value})}
                      className="w-full bg-sunset-fade border border-blush-mist rounded-xl p-4 outline-none focus:border-coral-flame transition-all font-bold text-brandwood"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2 block">Title</label>
                  <input 
                    required
                    type="text"
                    value={createData.title}
                    onChange={e => setCreateData({...createData, title: e.target.value})}
                    className="w-full bg-sunset-fade border border-blush-mist rounded-xl p-4 outline-none focus:border-coral-flame transition-all font-bold text-brandwood"
                    placeholder="E.g., My thoughts on the new NRB policy..."
                  />
                </div>

                {activeTab === 'research' && (
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2 block">Abstract / Summary</label>
                    <textarea 
                      required
                      value={createData.abstract}
                      onChange={e => setCreateData({...createData, abstract: e.target.value})}
                      className="w-full bg-sunset-fade border border-blush-mist rounded-xl p-4 outline-none focus:border-coral-flame transition-all font-sans text-brandwood resize-none h-24"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2 block">Content</label>
                  <div className="bg-white rounded-xl border border-blush-mist focus-within:border-coral-flame transition-all overflow-hidden font-sans">
                    <ReactQuill 
                      theme="snow"
                      value={createData.content}
                      onChange={val => setCreateData({...createData, content: val})}
                      className="bg-white min-h-[200px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2 block">Attached Image</label>
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={e => setCreateData({...createData, image: e.target.files?.[0] || null})}
                      className="w-full text-xs text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sunset-fade file:text-coral-flame hover:file:bg-blush-mist transition-all"
                    />
                  </div>
                  {activeTab === 'research' && (
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2 block">Research PDF (Required)</label>
                      <input 
                        required
                        type="file"
                        accept=".pdf"
                        onChange={e => setCreateData({...createData, pdf: e.target.files?.[0] || null})}
                        className="w-full text-xs text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sunset-fade file:text-coral-flame hover:file:bg-blush-mist transition-all"
                      />
                    </div>
                  )}
                </div>

                <button 
                  type="submit"
                  disabled={isUploading}
                  className="w-full bg-coral-flame text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-coral-flame/90 transition-all shadow-warm-float disabled:opacity-30 mt-4"
                >
                  {isUploading ? 'UPLOADING...' : 'SUBMIT POST'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Community Assistant Trigger */}
      <div className="fixed bottom-6 right-6 z-[90]">
        <button
          onClick={() => setShowCommunityAssistant(true)}
          className="group bg-white border border-blush-mist px-6 py-3 rounded-full shadow-lg hover:shadow-xl hover:border-[#1D9E75]/30 transition-all duration-300 flex items-center gap-2"
        >
          <Users className="text-[#1D9E75] group-hover:rotate-12 transition-transform" size={20} />
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-black text-brandwood tracking-widest transition-colors group-hover:text-[#1D9E75]">COMMUNITY</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#1D9E75] bg-[#1D9E75]/10 px-2 py-0.5 rounded-full">AI</span>
          </div>
        </button>
      </div>

      {/* Community Assistant Modal */}
      <CommunityAssistant 
        isOpen={showCommunityAssistant} 
        onClose={() => setShowCommunityAssistant(false)} 
      />

      {/* Seed Button (temporary - remove after seeding) */}
      <SeedButton />
    </motion.main>
  );
}
