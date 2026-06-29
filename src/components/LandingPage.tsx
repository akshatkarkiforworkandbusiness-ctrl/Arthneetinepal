import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { LESSONS } from './LearnPage';
import LiquidOcean from './LiquidOcean';

interface Topic {
  id: string;
  title: string;
  author: string;
  category: string;
  likes: number;
}

interface IndexState {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  sparkline: number[];
}

const initialIndices: Record<string, IndexState> = {
  NEPSE: {
    name: 'NEPSE Index',
    value: 2054.32,
    change: 18.42,
    changePercent: 0.90,
    sparkline: [2032, 2038, 2045, 2040, 2048, 2045, 2051, 2049, 2054.32]
  },
  BANKING: {
    name: 'Banking Index',
    value: 1248.60,
    change: -5.20,
    changePercent: -0.41,
    sparkline: [1260, 1258, 1254, 1251, 1248, 1253, 1251, 1247, 1248.60]
  },
  HYDRO: {
    name: 'Hydropower Index',
    value: 2480.15,
    change: 42.80,
    changePercent: 1.75,
    sparkline: [2410, 2425, 2440, 2435, 2460, 2452, 2470, 2465, 2480.15]
  }
};

const pillarsSyllabus = [
  {
    num: '01',
    title: 'Financial Literacy',
    desc: 'Saving, budgeting, banking mechanisms, and the Central Bank (NRB) regulations.',
    modules: [
      { title: 'Personal Budgeting & High-Yield Savings Accounts', duration: '45 mins' },
      { title: 'Understanding Banking Operations & Deposit Insurance', duration: '60 mins' },
      { title: 'Nepal Rastra Bank (NRB) Financial Access Guidelines', duration: '75 mins' },
      { title: 'Digital Payment Security & Cyber Safety in Nepal', duration: '50 mins' }
    ]
  },
  {
    num: '02',
    title: 'Stock Market & Investing',
    desc: 'NEPSE index, IPO application processes, secondary trading, and fundamental analysis.',
    modules: [
      { title: 'NEPSE 101: Stock Exchanges, Brokers & DEMAT Accounts', duration: '60 mins' },
      { title: 'The IPO Lifecycle: From Application to Secondary Listing', duration: '80 mins' },
      { title: 'How to Read Balance Sheets and EPS/PE Ratios', duration: '90 mins' },
      { title: 'Technical Indicators & Basic Chart Patterns', duration: '75 mins' }
    ]
  }
];

const mockPamphlets = [
  {
    title: 'Stock Market Investing in Practice',
    size: '833 KB',
    language: 'English',
    category: 'Investing',
    downloadUrl: '/nepse-investing-guide.pdf'
  },
  {
    title: 'Financial Literacy Guide — Nepal',
    size: '484 KB',
    language: 'Nepali / English',
    category: 'Curriculum',
    downloadUrl: '/nepal_financial_literacy_curriculum.pdf'
  },
  {
    title: 'Economic Research Guidebook',
    size: '948 KB',
    language: 'English',
    category: 'Research',
    downloadUrl: '/arthneeti-economics-guidebook.pdf'
  }
];

export default function LandingPage() {
  const { user, handleJoinAction } = useAuth();
  const [latestTopics, setLatestTopics] = useState<Topic[]>([]);
  const [topicCount, setTopicCount] = useState(100);

  // Market indices simulator
  const [marketIndices, setMarketIndices] = useState<Record<string, IndexState>>(initialIndices);
  
  // Interactive UI states
  const [activeResourceTab, setActiveResourceTab] = useState<'videos' | 'pamphlets'>('videos');
  const [selectedVideoEmbed, setSelectedVideoEmbed] = useState<string | null>(null);

  useEffect(() => {
    const qLatest = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(4));
    const unsubscribeLatest = onSnapshot(qLatest, (snapshot) => {
      const topics = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Topic[];
      setLatestTopics(topics);
    });

    const qAll = query(collection(db, 'posts'));
    const unsubscribeCount = onSnapshot(qAll, (snapshot) => {
      setTopicCount(snapshot.size);
    });

    return () => {
      unsubscribeLatest();
      unsubscribeCount();
    };
  }, []);

  const [marketDataSource, setMarketDataSource] = useState<'live' | 'simulated' | 'loading'>('loading');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const NEPSE_API = 'https://nepseapi.surajrimal.dev';
    const INDEX_MAP: Record<string, { key: string; name: string }> = {
      '58': { key: 'NEPSE', name: 'NEPSE Index' },
      '3':  { key: 'BANKING', name: 'Banking Index' },
      '11': { key: 'HYDRO', name: 'Hydropower Index' },
    };

    const fetchLiveData = async () => {
      try {
        const [indexRes, subIndexRes] = await Promise.all([
          fetch(`${NEPSE_API}/NepseIndex`, { signal: AbortSignal.timeout(6000) }),
          fetch(`${NEPSE_API}/SubIndices`, { signal: AbortSignal.timeout(6000) }),
        ]);
        if (!indexRes.ok) throw new Error('API error');
        const indexData = await indexRes.json();
        const subData = subIndexRes.ok ? await subIndexRes.json() : [];

        const all = [indexData, ...(Array.isArray(subData) ? subData : [])];
        const next: Record<string, IndexState> = { ...initialIndices };

        all.forEach((entry: any) => {
          const id = String(entry?.id ?? entry?.indexId ?? '');
          const mapped = INDEX_MAP[id];
          if (!mapped) return;
          const value = parseFloat(entry.currentValue ?? entry.value ?? 0);
          const change = parseFloat(entry.change ?? 0);
          const changePercent = parseFloat(entry.perChange ?? entry.percentageChange ?? 0);
          const prev = next[mapped.key];
          next[mapped.key] = {
            name: mapped.name,
            value,
            change,
            changePercent,
            sparkline: [...prev.sparkline.slice(1), value],
          };
        });

        setMarketIndices(next);
        setMarketDataSource('live');
        setLastUpdated(new Date());
      } catch {
        if (marketDataSource === 'loading') setMarketDataSource('simulated');
      }
    };

    fetchLiveData();
    const liveInterval = setInterval(fetchLiveData, 60_000);
    return () => clearInterval(liveInterval);
  }, []);

  useEffect(() => {
    if (marketDataSource !== 'simulated') return;
    const interval = setInterval(() => {
      setMarketIndices(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          const item = { ...next[key] };
          const drift = (Math.random() - 0.48) * (item.value * 0.0006);
          item.value = parseFloat((item.value + drift).toFixed(2));
          item.change = parseFloat((item.change + drift).toFixed(2));
          const basePrice = item.value - item.change;
          item.changePercent = parseFloat(((item.change / basePrice) * 100).toFixed(2));
          item.sparkline = [...item.sparkline.slice(1), item.value];
          next[key] = item;
        });
        return next;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [marketDataSource]);

  const getSparklinePath = (points: number[]) => {
    if (points.length === 0) return '';
    const width = 120;
    const height = 40;
    const padding = 4;
    const minVal = Math.min(...points);
    const maxVal = Math.max(...points);
    const range = maxVal - minVal || 1;

    return points
      .map((val, idx) => {
        const x = padding + (idx / (points.length - 1)) * (width - padding * 2);
        const y = height - padding - ((val - minVal) / range) * (height - padding * 2);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col bg-black min-h-screen text-white font-sans"
    >
      {/* Sequel Nav Overlay (Sticky top handled by App.tsx, but we ensure styling aligns) */}
      
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex flex-col justify-center items-center text-center">
        <div className="absolute inset-0 z-0">
           <LiquidOcean />
        </div>
        <div className="absolute inset-0 z-0 bg-black/40 pointer-events-none" />

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 w-full max-w-[1280px] px-6 flex flex-col items-center mt-16"
        >
          <h1 className="font-display text-[58px] md:text-[128px] text-white leading-[1] tracking-[-0.05em] mb-8 max-w-5xl">
            Build the future.
          </h1>
          <p className="font-sans font-light text-[18px] md:text-[22px] text-[#c0c0c0] mb-12 max-w-2xl leading-[1.4] tracking-[-0.02em]">
            Arthneeti is the new cinematic learning standard for Nepal. 
            Financial literacy, market analysis, and youth empowerment.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user ? (
              <button 
                onClick={handleJoinAction}
                className="bg-white text-black px-6 py-4 rounded-[9999px] font-sans font-medium text-[15px] hover:bg-[#f5f5f0] transition-colors shadow-[0_4px_20px_rgba(0,0,0,0.15)] flex items-center justify-center gap-2 cursor-pointer"
              >
                Join Arthneeti <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            ) : (
              <Link 
                to="/profile" 
                className="bg-white text-black px-6 py-4 rounded-[9999px] font-sans font-medium text-[15px] hover:bg-[#f5f5f0] transition-colors shadow-[0_4px_20px_rgba(0,0,0,0.15)] flex items-center justify-center gap-2"
              >
                Go to Dashboard <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Link>
            )}
            <Link 
              to="/discover" 
              className="bg-transparent text-white border border-white/50 px-6 py-4 rounded-[9999px] font-sans font-medium text-[15px] hover:border-white transition-colors text-center"
            >
              Explore Markets
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Market Ticker Section */}
      <section className="bg-black py-24 px-6">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-12 border-b border-[#333333] pb-6">
            <h2 className="font-display text-[32px] text-white tracking-[-0.05em]">Market Overview</h2>
            <span className="font-sans font-medium text-[12px] uppercase tracking-[0.08em] text-[#999999]">
              {marketDataSource === 'live' ? 'Live Data' : 'Simulated Data'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.keys(marketIndices).map((key) => {
              const item = marketIndices[key];
              const isGain = item.change >= 0;
              const sign = isGain ? '+' : '';
              
              return (
                <div 
                  key={key} 
                  className="bg-[#202020] rounded-[10px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] flex justify-between items-center"
                >
                  <div>
                    <span className="font-sans font-medium text-[11px] uppercase tracking-[0.08em] text-[#999999] block mb-2">{item.name}</span>
                    <h4 className="text-[32px] font-display text-white tracking-[-0.05em] leading-[1]">{item.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h4>
                    <span 
                      className="font-sans font-light text-[14px] inline-flex items-center gap-1 mt-2 text-[#c0c0c0]"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {isGain ? 'north_east' : 'south_east'}
                      </span>
                      <span>{sign}{item.changePercent}%</span>
                    </span>
                  </div>
                  
                  {/* Sparkline Graphic - Achromatic */}
                  <div className="w-[120px] h-[40px] flex items-center">
                    <svg className="w-full h-full">
                      <path 
                        d={getSparklinePath(item.sparkline)}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.5"
                      />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Two-column Feature Pair (Syllabus) */}
      <section className="bg-black py-24 px-6 border-t border-[#333333]">
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-16">
            <h2 className="font-display text-[58px] text-white tracking-[-0.05em] leading-[1.2]">
              Curriculum Roadmap
            </h2>
            <p className="font-sans font-light text-[18px] text-[#999999] mt-4 max-w-xl leading-[1.5]">
              Explore the educational path designed to empower students with structural economic knowledge and real market insights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pillarsSyllabus.map((pillar) => (
              <div key={pillar.num} className="bg-[#202020] rounded-[10px] shadow-[0_10px_30px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] overflow-hidden flex flex-col h-full relative p-8">
                {/* Badge top right */}
                <div className="absolute top-6 right-6 bg-white/5 border border-white/10 rounded-[9999px] px-3 py-1 font-sans font-medium text-[10px] uppercase text-white tracking-[0.08em]">
                  Pillar {pillar.num}
                </div>
                
                <h3 className="font-display text-[32px] text-white tracking-[-0.05em] mt-8 mb-4">{pillar.title}</h3>
                <p className="font-sans font-light text-[15px] text-[#c0c0c0] leading-[1.5] mb-8">
                  {pillar.desc}
                </p>
                
                <div className="mt-auto border-t border-[#333333] pt-6 flex flex-col gap-3">
                  {pillar.modules.slice(0, 2).map((mod, i) => (
                    <div key={i} className="flex justify-between items-center text-sm font-sans font-light text-[#999999]">
                      <span className="truncate pr-4">{mod.title}</span>
                      <span className="shrink-0 font-medium">{mod.duration}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Resources & Library (Editorial Cards) */}
      <section className="bg-black py-24 px-6 border-t border-[#333333]">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <h2 className="font-display text-[58px] text-white tracking-[-0.05em] leading-[1.2]">
              Resource Library
            </h2>
            <div className="flex gap-2 mt-6 md:mt-0">
              <button
                onClick={() => setActiveResourceTab('videos')}
                className={`px-6 py-2 rounded-[9999px] font-sans font-medium text-[14px] transition-colors ${
                  activeResourceTab === 'videos' 
                    ? 'bg-white text-black' 
                    : 'bg-transparent text-white border border-white/50 hover:border-white'
                }`}
              >
                Videos
              </button>
              <button
                onClick={() => setActiveResourceTab('pamphlets')}
                className={`px-6 py-2 rounded-[9999px] font-sans font-medium text-[14px] transition-colors ${
                  activeResourceTab === 'pamphlets' 
                    ? 'bg-white text-black' 
                    : 'bg-transparent text-white border border-white/50 hover:border-white'
                }`}
              >
                Guides
              </button>
            </div>
          </div>

          <div className="min-h-[300px]">
            <AnimatePresence mode="wait">
              {activeResourceTab === 'videos' && (
                <motion.div 
                  key="videos" 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                  {LESSONS.slice(0, 3).map((video, idx) => (
                    <div 
                      key={idx}
                      className="bg-[#202020] rounded-[10px] shadow-[0_10px_30px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] overflow-hidden flex flex-col group relative"
                    >
                      <div className="relative aspect-video w-full bg-black cursor-pointer" onClick={() => setSelectedVideoEmbed(video.videoUrl)}>
                        <img 
                          src={video.thumbnail} 
                          alt={video.title}
                          className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500 grayscale"
                        />
                        <div className="absolute inset-0 m-auto w-12 h-12 rounded-full border border-white flex items-center justify-center group-hover:scale-110 transition-transform bg-black/20 backdrop-blur-sm">
                          <span className="material-symbols-outlined text-white">play_arrow</span>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <h4 className="font-sans font-medium text-[18px] text-white mb-2 leading-[1.4] line-clamp-2">
                          {video.title}
                        </h4>
                        <p className="font-sans font-light text-[14px] text-[#999999] leading-[1.5] line-clamp-3">
                          {video.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeResourceTab === 'pamphlets' && (
                <motion.div 
                  key="pamphlets" 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                  {mockPamphlets.map((pamphlet, idx) => (
                    <div 
                      key={idx}
                      className="bg-[#202020] rounded-[10px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] flex flex-col justify-between min-h-[200px]"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="bg-white/5 border border-white/10 rounded-[9999px] px-3 py-1 font-sans font-medium text-[10px] uppercase text-white tracking-[0.08em]">
                            {pamphlet.category}
                          </span>
                          <span className="font-sans font-medium text-[10px] text-[#999999] tracking-[0.08em]">{pamphlet.size}</span>
                        </div>
                        <h4 className="font-sans font-medium text-[18px] text-white mb-2 leading-[1.4]">
                          {pamphlet.title}
                        </h4>
                      </div>

                      <a 
                        href={pamphlet.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-transparent text-white border border-[#333333] hover:border-white px-4 py-3 rounded-[9999px] font-sans font-medium text-[13px] transition-colors flex items-center justify-center gap-2 mt-6"
                      >
                        <span className="material-symbols-outlined text-sm">download</span> Download PDF
                      </a>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Community / Latest Topics */}
      <section className="bg-black py-24 px-6 border-t border-[#333333]">
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-16">
             <h2 className="font-display text-[58px] text-white tracking-[-0.05em] leading-[1.2]">
              Forum
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {latestTopics.map((topic, i) => (
              <div
                key={topic.id}
                className="p-8 rounded-[10px] bg-[#202020] shadow-[0_10px_30px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] flex flex-col"
              >
                <div className="flex justify-between items-start mb-6">
                  <span className="bg-white/5 border border-white/10 rounded-[9999px] px-3 py-1 font-sans font-medium text-[10px] uppercase text-white tracking-[0.08em]">
                    {topic.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-[#999999]">
                    <span className="material-symbols-outlined text-[14px]">favorite</span>
                    <span className="font-sans font-medium text-[12px]">{topic.likes}</span>
                  </div>
                </div>
                <Link to="/community" className="block mb-6">
                  <h3 className="font-sans font-medium text-[22px] text-white leading-[1.4] tracking-[-0.02em] line-clamp-2">
                    {topic.title || (topic as any).content?.replace(/<[^>]*>?/gm, '').substring(0, 60) + '...'}
                  </h3>
                </Link>
                <div className="mt-auto pt-6 border-t border-[#333333] flex items-center gap-3">
                  <span className="font-sans font-medium text-[12px] text-[#c0c0c0] uppercase tracking-[0.08em]">{topic.author}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Link 
              to="/community" 
              className="bg-transparent text-white border border-[#333333] hover:border-white px-8 py-4 rounded-[9999px] font-sans font-medium text-[15px] transition-colors inline-block"
            >
              Enter the Community
            </Link>
          </div>
        </div>
      </section>

      {/* Inverted Light Panel - Social Mission */}
      <section className="bg-[#f5f5f0] py-24 px-6">
        <div className="max-w-[720px] mx-auto text-center">
          <h2 className="font-display text-[58px] text-[#000000] tracking-[-0.05em] leading-[1.2] mb-6">
            Equitable Access
          </h2>
          <p className="font-sans font-light text-[18px] text-[#333333] leading-[1.5] mb-10">
            Arthneeti allocates workshop support and targeted curricula specifically for disadvantaged youths, disabled students, and underprivileged municipal schools to narrow the financial intelligence gap.
          </p>
          <a 
            href="mailto:learnarthneeti@gmail.com"
            className="bg-[#202020] text-white px-8 py-4 rounded-[9999px] font-sans font-medium text-[15px] hover:bg-black transition-colors inline-block shadow-lg"
          >
            Partner With Us
          </a>
        </div>
      </section>

      {/* Video Modal */}
      <AnimatePresence>
        {selectedVideoEmbed && (
          <div 
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSelectedVideoEmbed(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#202020] rounded-[10px] overflow-hidden max-w-[1024px] w-full shadow-2xl relative border border-[#333333]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-video">
                <iframe 
                  className="w-full h-full"
                  src={selectedVideoEmbed}
                  title="Video Player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-4 flex justify-between items-center border-t border-[#333333]">
                <span className="font-sans font-light text-[12px] text-[#999999]">Arthneeti Academy Resource System</span>
                <button
                  onClick={() => setSelectedVideoEmbed(null)}
                  className="bg-transparent text-white border border-[#333333] hover:border-white px-4 py-2 rounded-[9999px] font-sans font-medium text-[13px] transition-colors cursor-pointer"
                >
                  Close Player
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}
