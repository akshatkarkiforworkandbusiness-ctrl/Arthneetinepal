import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect, useRef } from 'react';
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
import { Heart, MessageSquare, Share2, Download, Plus, Send, X, FileText, HelpCircle, MoreVertical } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { GradientCard } from './GradientCard';

// --- Types ---
interface Post {
  id: string;
  type: 'discussion' | 'research' | 'question';
  title?: string;
  author: string;
  authorId: string;
  category: 'Finance' | 'Economics' | 'Other';
  content: string; // HTML for discussion/research, plain text for question
  abstract?: string;
  imageUrl?: string;
  pdfUrl?: string;
  likes: number;
  commentCount: number;
  createdAt: any;
  seeded?: boolean;
}

interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  likes: number;
  createdAt: any;
  parentId?: string;
}

// --- Components ---

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
      <div className="w-8 h-8 rounded-full bg-crimson flex items-center justify-center text-white font-black text-[10px] shrink-0">
        {comment.authorName?.[0]}
      </div>
      <div className="flex-1">
        <div className="bg-surface-base p-4 rounded-xl border border-surface-high">
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
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-crimson transition-colors"
          >
            <Heart size={12} fill={comment.likes > 0 ? 'currentColor' : 'none'} className={comment.likes > 0 ? 'text-crimson' : ''} />
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

function CommentSection({ postId }: { postId: string }) {
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
    <div className="mt-8 pt-8 border-t border-green-deep/5 space-y-8">
      {user && (
        <form onSubmit={handleAddComment} className="relative mb-12">
          {replyTo && (
            <div className="flex justify-between items-center bg-crimson/10 p-2 px-4 rounded mb-2">
              <span className="text-[10px] font-black text-crimson uppercase tracking-widest">Replying to {replyTo.name}</span>
              <button onClick={() => setReplyTo(null)} className="text-text-muted hover:text-text-primary"><X size={14} /></button>
            </div>
          )}
          <textarea 
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            className="w-full bg-surface-base border border-surface-high rounded-xl p-5 text-sm text-text-primary outline-none focus:border-crimson transition-all resize-none h-24"
          />
          <button 
            type="submit"
            disabled={!newComment.trim()}
            className="absolute bottom-4 right-4 bg-green-deep text-white p-3 rounded-full hover:bg-crimson transition-all disabled:opacity-20"
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
            <div className="ml-12 space-y-6 border-l-2 border-navy/5 pl-8">
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

export default function CommunityPage() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'discussions' | 'research' | 'questions'>('discussions');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  
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
              content: `Gold's extraordinary rally — surging over 60% in 2025 and briefly surpassing $5,500 per ounce — is no accident. It reflects a confluence of powerful macroeconomic forces reshaping the global financial landscape. Persistent inflation has eroded confidence in paper currencies, driving investors toward hard assets that preserve real purchasing power. Meanwhile, central banks — particularly in emerging markets like China, India, and Turkey — have been buying gold at record levels, seeking to reduce dependence on the US dollar following the weaponization of dollar-based sanctions against Russia. This broader de-dollarization trend, combined with a weakening dollar index, has made gold increasingly attractive as a neutral, sovereign-free store of value. Compounding this, an exceptionally volatile geopolitical environment — marked by ongoing conflicts and US-China tensions — has embedded a significant "fear premium" into prices. On the monetary policy side, the US Federal Reserve's rate-cutting cycle has lowered the opportunity cost of holding non-yielding gold, while record ETF inflows have brought the rally within reach of everyday investors. Taken together, gold's rise is less a speculative bubble and more a rational, broad-based response to a world questioning the reliability of traditional financial systems — making it one of the most important macroeconomic stories of our time.`,
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
    const url = `${window.location.origin}/community?post=${postId}`;
    navigator.clipboard.writeText(url);
    toast('Link copied to clipboard!'); // Replace with toast later
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
    if (activeTab === 'discussions') return p.type === 'discussion';
    if (activeTab === 'research') return p.type === 'research';
    if (activeTab === 'questions') return p.type === 'question';
    return true;
  });

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto px-6 py-20"
    >
      <header className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
        <div>
          <span className="text-[10px] font-black text-crimson mb-4 block uppercase tracking-[0.4em]">COMMUNITY</span>
          <h1 className="text-5xl md:text-7xl text-text-primary italic font-display">Intelligence Feed</h1>
        </div>
        
        {user && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-crimson text-white px-8 py-4 rounded text-xs font-black uppercase tracking-widest hover:bg-royal transition-all shadow-xl flex items-center gap-3"
          >
            <Plus size={16} strokeWidth={3} />
            {activeTab === 'questions' ? 'Ask Question' : activeTab === 'research' ? 'Submit Research' : 'Create Post'}
          </button>
        )}
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as typeof activeTab)} className="mb-16">
        <TabsList className="flex gap-12 border-b border-green-deep/5 bg-transparent p-0 rounded-none w-full justify-start h-auto">
          {(['discussions', 'research', 'questions'] as const).map(tab => (
            <TabsTrigger
              key={tab}
              value={tab}
              className={`pb-6 text-xs font-black uppercase tracking-[0.2em] relative bg-transparent border-none rounded-none whitespace-nowrap data-active:text-crimson data-active:bg-transparent data-active:shadow-none text-text-muted hover:text-text-primary`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="tabLine" className="absolute bottom-[-1px] left-0 w-full h-1 bg-crimson rounded-full" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Feed */}
      <div className="space-y-12">
        {activeTab === 'questions' && user && (
           <div className="bg-surface-raised p-8 rounded-2xl border border-surface-high shadow-sm mb-12">
              <div className="flex gap-4">
                 <div className="w-10 h-10 rounded-full bg-crimson flex items-center justify-center text-white font-black text-sm shrink-0 uppercase">
                    {profile?.name?.[0] || user.displayName?.[0]}
                 </div>
                 <div className="flex-1 space-y-4">
                    <textarea 
                      placeholder="What's your question today?"
                      className="w-full bg-surface-base border-none outline-none text-text-primary placeholder:text-text-muted/50 resize-none font-medium h-24 p-2 rounded"
                      value={createData.content}
                      onChange={e => setCreateData({...createData, content: e.target.value})}
                    />
                    <div className="flex justify-between items-center gap-4">
                       <div className="flex gap-2">
                          {['Finance', 'Economics', 'Business', 'Policy', 'Other'].map(cat => (
                            <button
                              key={cat}
                              onClick={() => setCreateData({...createData, category: cat as any})}
                              className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                                createData.category === cat ? 'bg-royal border-royal text-white' : 'border-surface-high text-text-muted hover:border-royal/50'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                       </div>
                       <button 
                        onClick={handleCreateSubmit}
                        disabled={!createData.content.trim() || isUploading}
                        className="bg-crimson text-white px-8 py-3 rounded text-[10px] font-black uppercase tracking-widest hover:bg-royal transition-all disabled:opacity-20"
                       >
                         Post Question
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {loading ? (
          <div className="space-y-8">
            <Skeleton className="h-64 w-full bg-white/5 border border-green-deep/5 rounded-2xl" />
            <Skeleton className="h-64 w-full bg-white/5 border border-green-deep/5 rounded-2xl" />
            <Skeleton className="h-64 w-full bg-white/5 border border-green-deep/5 rounded-2xl" />
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredPosts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-8"
              >
                <GradientCard 
                  onClick={() => post.type === 'discussion' ? setExpandedPost(expandedPost === post.id ? null : post.id) : undefined}
                >
                  <div className="flex justify-between items-start mb-8 w-full">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-royal flex items-center justify-center text-white font-black text-sm uppercase">
                        {post.author?.[0]}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-widest">{post.author}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="outline" className="text-[9px] font-black text-white border-white/20 uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded">
                            {post.category}
                          </Badge>
                          <span className="text-[9px] font-medium text-gray-400 uppercase tracking-widest">
                            {post.createdAt?.toDate ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(post.createdAt.toDate()) : '...'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-white transition-colors"><MoreVertical size={16} /></button>
                  </div>

                {post.type === 'discussion' && (
                  <>
                    <h3 className="text-2xl md:text-3xl text-white font-bold mb-6 leading-tight hover:text-royal transition-colors">
                      {post.title}
                    </h3>
                    {post.imageUrl && (
                      <div className="aspect-video rounded-xl overflow-hidden mb-6 border border-white/10 shadow-lg">
                        <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    <div className={`text-gray-300 leading-relaxed font-sans mb-6 ${expandedPost === post.id ? '' : 'line-clamp-3'}`}>
                      <div dangerouslySetInnerHTML={{ __html: post.content }} />
                    </div>
                    {!expandedPost && post.content.length > 200 && (
                      <button className="text-royal text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors mb-6 block">
                        Read more →
                      </button>
                    )}
                  </>
                )}

                {post.type === 'research' && (
                  <div className="bg-[#121624]/80 p-8 rounded-xl border border-white/10 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-royal mb-6 shadow-sm border border-white/10">
                      <FileText size={32} />
                    </div>
                    <h3 className="text-2xl text-white font-bold mb-4">{post.title}</h3>
                    <p className="text-gray-400 text-sm italic font-sans max-w-lg mb-8">"{post.abstract}"</p>
                    <a 
                      href={post.pdfUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center gap-3 bg-royal/20 text-royal px-8 py-3 rounded text-xs font-black uppercase tracking-widest hover:bg-royal hover:text-white border border-royal/30 transition-all"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download size={14} /> Download PDF
                    </a>
                  </div>
                )}

                {post.type === 'question' && (
                  <div className="space-y-6">
                    <p className="text-xl text-white leading-relaxed font-bold italic">"{post.content}"</p>
                  </div>
                )}

                <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10 w-full" onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-8">
                    <button 
                      onClick={() => handleLike(post.id)}
                      className="flex items-center gap-2 group"
                    >
                      <Heart size={18} className="text-gray-400 group-hover:text-crimson transition-colors" />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{post.likes}</span>
                    </button>
                    <button 
                      onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                      className={`flex items-center gap-2 group ${expandedPost === post.id ? 'text-royal' : 'text-gray-400 hover:text-royal transition-colors'}`}
                    >
                      <MessageSquare size={18} />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-royal">{post.commentCount}</span>
                    </button>
                    <button 
                      onClick={() => handleShare(post.id)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <Share2 size={18} />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedPost === post.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden w-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                       <CommentSection postId={post.id} />
                    </motion.div>
                  )}
                </AnimatePresence>
                </GradientCard>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] bg-green-deep/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-surface-raised p-8 md:p-12 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl"
            >
              <button 
                onClick={() => setShowCreateModal(false)}
                className="absolute top-8 right-8 text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={24} />
              </button>

              <h2 className="font-display text-4xl text-text-primary italic mb-10">
                {activeTab === 'research' ? 'Submit Research' : 'Create New Post'}
              </h2>

              <form onSubmit={handleCreateSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Category</label>
                    <select 
                      value={createData.category}
                      onChange={e => setCreateData({...createData, category: e.target.value as any})}
                      className="w-full bg-surface-base border-2 border-surface-high rounded p-4 outline-none focus:border-crimson transition-all font-bold text-text-primary"
                    >
                      <option>Finance</option>
                      <option>Economics</option>
                      <option>Business</option>
                      <option>Policy</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Your Name</label>
                    <input 
                      type="text"
                      value={createData.authorName}
                      onChange={e => setCreateData({...createData, authorName: e.target.value})}
                      className="w-full bg-surface-base border-2 border-surface-high rounded p-4 outline-none focus:border-crimson transition-all font-bold text-text-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Title</label>
                  <input 
                    required
                    type="text"
                    value={createData.title}
                    onChange={e => setCreateData({...createData, title: e.target.value})}
                    className="w-full bg-surface-base border-2 border-surface-high rounded p-4 outline-none focus:border-crimson transition-all font-bold text-text-primary"
                    placeholder="Expert analysis of..."
                  />
                </div>

                {activeTab === 'research' && (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Abstract / Summary</label>
                    <textarea 
                      required
                      value={createData.abstract}
                      onChange={e => setCreateData({...createData, abstract: e.target.value})}
                      className="w-full bg-surface-base border-2 border-surface-high rounded p-4 outline-none focus:border-crimson transition-all font-bold text-text-primary resize-none h-24"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Content</label>
                  <div className="bg-surface-base rounded-xl border-2 border-surface-high focus-within:border-crimson transition-all overflow-hidden font-sans">
                    <ReactQuill 
                      theme="snow"
                      value={createData.content}
                      onChange={val => setCreateData({...createData, content: val})}
                      className="bg-surface-base min-h-[200px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Attached Image</label>
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={e => setCreateData({...createData, image: e.target.files?.[0] || null})}
                      className="w-full text-xs text-text-muted"
                    />
                  </div>
                  {activeTab === 'research' && (
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Research PDF (Required)</label>
                      <input 
                        required
                        type="file"
                        accept=".pdf"
                        onChange={e => setCreateData({...createData, pdf: e.target.files?.[0] || null})}
                        className="w-full text-xs text-text-muted"
                      />
                    </div>
                  )}
                </div>

                <button 
                  type="submit"
                  disabled={isUploading}
                  className="w-full bg-crimson text-white py-5 rounded text-[10px] font-black uppercase tracking-widest hover:bg-royal transition-all shadow-xl disabled:opacity-30"
                >
                  {isUploading ? 'UPLOADING...' : 'SUBMIT CONTRIBUTION'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}
