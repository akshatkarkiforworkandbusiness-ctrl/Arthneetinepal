import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { LESSONS } from './LearnPage';

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

const socialIcons = [
  { name: 'Women & Girls', icon: 'woman' },
  { name: "Children's Welfare", icon: 'child_care' },
  { name: 'Disability Inclusion', icon: 'accessible' },
  { name: 'Underprivileged Communities', icon: 'groups' }
];

const executiveBoard = [
  {
    name: 'Akshat Karki',
    role: 'President',
    bio: "Leading Arthneeti's vision to build Nepal's most impactful youth financial education movement. Focused on school partnerships, club strategy, and driving the mission forward."
  },
  {
    name: 'Manash Koirala',
    role: 'Vice President',
    bio: "Supporting club operations and co-leading educational strategy. Passionate about making stock market knowledge accessible to every Nepali high schooler."
  },
  {
    name: 'Ujjwal Dhungana',
    role: 'Head of Research & Comm',
    bio: "Driving Arthneeti's research agenda and external communications. Builds the intellectual content that makes our sessions substantive and credible."
  },
  {
    name: 'Pranjal Khatiwada',
    role: 'Secretary',
    bio: "Managing club coordination, records, and logistics. Ensures Arthneeti runs smoothly across all schools and sessions."
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
      className="flex flex-col bg-[#ffffff] min-h-screen text-[#000000] font-neufile"
    >
      
      {/* Dark Hero Stage */}
      <section className="bg-[#191b1f] pt-[128px] pb-[96px] px-6 min-h-[80vh] flex flex-col items-center">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-[1200px] flex flex-col items-center text-center"
        >
          <h1 className="font-albra text-[46px] md:text-[80px] text-[#ffffff] font-semibold leading-[1.1] tracking-[1.6px] max-w-5xl mb-6">
            Structural intelligence for Nepal's next generation.
          </h1>
          <p className="font-albra text-[22px] font-semibold text-[#ffffff] opacity-70 leading-[1.2] tracking-[0.44px] mb-12 max-w-2xl">
            A private gallery of financial knowledge, market analysis, and economic discourse.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mt-4">
            {!user ? (
              <>
                <button 
                  onClick={handleJoinAction}
                  className="bg-[#186f64] text-[#ffffff] px-[27px] py-[12px] rounded-[2px] font-neufile font-medium text-[16px] cursor-pointer"
                >
                  Join Arthneeti
                </button>
                <Link 
                  to="/discover" 
                  className="text-[#186f64] px-[27px] py-[12px] font-neufile font-medium text-[16px] inline-flex items-center"
                >
                  Explore Markets
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to="/profile" 
                  className="bg-[#186f64] text-[#ffffff] px-[27px] py-[12px] rounded-[2px] font-neufile font-medium text-[16px] text-center"
                >
                  Go to Dashboard
                </Link>
                <Link 
                  to="/discover" 
                  className="text-[#186f64] px-[27px] py-[12px] font-neufile font-medium text-[16px] inline-flex items-center"
                >
                  Explore Markets
                </Link>
              </>
            )}
          </div>
        </motion.div>
        
        {/* Abstract 3D Render Placeholder */}
        <div className="flex-grow flex items-end justify-center w-full max-w-[1200px] mt-16 relative">
          <div className="w-full max-w-[800px] h-[300px] bg-gradient-to-t from-[#ffffff]/5 to-transparent rounded-[2px] border-t border-[#e6ebec]/10 flex items-center justify-center opacity-50">
             <span className="font-neufile text-[13px] text-[#ffffff]/30 uppercase tracking-widest">Chrome Sculptural Accent Space</span>
          </div>
        </div>
      </section>

      {/* Market Ticker Section (Paper White) */}
      <section className="bg-[#ffffff] py-[96px] px-6 border-b border-[#e6ebec]">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-12">
            <h2 className="font-albra text-[46px] font-semibold text-[#000000] tracking-[0.92px] leading-[1.2]">
              Market Action
            </h2>
            <span className="font-neufile font-medium text-[13px] text-[#9fabad]">
              {marketDataSource === 'live' ? 'Live Data Feed' : 'Simulated Data'}
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
                  className="border border-[#e6ebec] rounded-[0px] p-[32px] bg-[#ffffff] flex flex-col gap-6"
                >
                  <div>
                    <span className="font-neufile text-[13px] text-[#9fabad] block mb-2">{item.name}</span>
                    <h4 className="text-[28px] font-neufile font-medium text-[#000000] leading-[1.3]">{item.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h4>
                    <span 
                      className="font-neufile text-[16px] inline-flex items-center gap-2 mt-2 text-[#9fabad]"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isGain ? 'north_east' : 'south_east'}
                      </span>
                      <span>{sign}{item.changePercent}%</span>
                    </span>
                  </div>
                  
                  {/* Sparkline Graphic */}
                  <div className="w-[120px] h-[40px] flex items-center">
                    <svg className="w-full h-full">
                      <path 
                        d={getSparklinePath(item.sparkline)}
                        fill="none"
                        stroke="#000000"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.2"
                      />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Curriculum Section (Peach Wall Tinted Feature Card Style) */}
      <section className="bg-[#ffffff] py-[96px] px-6">
        <div className="max-w-[1200px] mx-auto bg-[#fcede1] p-[64px] rounded-[0px]">
          <div className="flex flex-col lg:flex-row gap-[64px]">
            <div className="lg:w-1/2">
              <h2 className="font-albra text-[46px] font-semibold text-[#000000] tracking-[0.92px] leading-[1.2] mb-6">
                Curriculum Structure
              </h2>
              <p className="font-neufile text-[16px] text-[#000000] leading-[1.4] mb-12">
                A rigorous educational path designed to empower students with structural economic knowledge and actual market insights. Built for high-schoolers, taught by peers.
              </p>
              
              <div className="flex items-center gap-4">
                 <Link 
                    to="/learn"
                    className="bg-[#536eff] text-[#ffffff] px-[27px] py-[12px] rounded-[2px] font-neufile font-medium text-[16px] inline-flex"
                  >
                    Start Learning
                  </Link>
                  <Link 
                    to="/learn"
                    className="text-[#536eff] font-neufile font-medium text-[16px] inline-flex px-[27px]"
                  >
                    View Modules
                  </Link>
              </div>
            </div>
            
            <div className="lg:w-1/2 flex flex-col gap-6">
               {pillarsSyllabus.map((pillar) => (
                  <div key={pillar.num} className="bg-[#ffffff]/60 border border-[#e6ebec]/50 p-[32px] rounded-[0px]">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="font-neufile font-medium text-[13px] bg-[#ffffff] px-2 py-1 rounded-[2px] text-[#000000] border border-[#e6ebec]">
                        Pillar {pillar.num}
                      </span>
                      <h3 className="font-albra text-[22px] font-semibold text-[#000000] tracking-[0.44px]">{pillar.title}</h3>
                    </div>
                    <p className="font-neufile text-[16px] text-[#000000] leading-[1.4]">
                      {pillar.desc}
                    </p>
                  </div>
               ))}
            </div>
          </div>
        </div>
      </section>

      {/* Resource Library Section (Mint Wall Tinted Feature Card Style) */}
      <section className="bg-[#f6f9f9] py-[96px] px-6">
        <div className="max-w-[1200px] mx-auto bg-[#eefcef] p-[64px] rounded-[0px]">
          <div className="flex flex-col lg:flex-row gap-[64px]">
            <div className="lg:w-1/3">
              <h2 className="font-albra text-[46px] font-semibold text-[#000000] tracking-[0.92px] leading-[1.2] mb-6">
                Resource Vault
              </h2>
              <p className="font-neufile text-[16px] text-[#000000] leading-[1.4] mb-12">
                Explore media materials, central bank publications, downloadable infographics, and guided video series.
              </p>
              
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setActiveResourceTab('videos')}
                  className={`px-[27px] py-[12px] rounded-[2px] font-neufile font-medium text-[16px] text-left transition-colors ${
                    activeResourceTab === 'videos' 
                      ? 'bg-[#186f64] text-[#ffffff]' 
                      : 'bg-transparent text-[#191b1f] hover:bg-[#ffffff]/50'
                  }`}
                >
                  Video Masterclasses
                </button>
                <button
                  onClick={() => setActiveResourceTab('pamphlets')}
                  className={`px-[27px] py-[12px] rounded-[2px] font-neufile font-medium text-[16px] text-left transition-colors ${
                    activeResourceTab === 'pamphlets' 
                      ? 'bg-[#186f64] text-[#ffffff]' 
                      : 'bg-transparent text-[#191b1f] hover:bg-[#ffffff]/50'
                  }`}
                >
                  Printable Guides
                </button>
              </div>
            </div>

            <div className="lg:w-2/3 min-h-[300px]">
              <AnimatePresence mode="wait">
                {activeResourceTab === 'videos' && (
                  <motion.div 
                    key="videos" 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    {LESSONS.slice(0, 4).map((video, idx) => (
                      <div 
                        key={idx}
                        className="bg-[#ffffff] border border-[#e6ebec] rounded-[0px] p-[32px] flex flex-col"
                      >
                        <h4 className="font-albra text-[22px] font-semibold text-[#000000] mb-4 tracking-[0.44px] leading-[1.2] line-clamp-2">
                          {video.title}
                        </h4>
                        <p className="font-neufile text-[13px] text-[#9fabad] leading-[1.4] mb-6 line-clamp-2">
                          {video.desc}
                        </p>
                        <button 
                           onClick={() => setSelectedVideoEmbed(video.videoUrl)}
                           className="mt-auto text-[#186f64] font-neufile font-medium text-[16px] text-left flex items-center gap-2"
                        >
                           Watch Segment <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeResourceTab === 'pamphlets' && (
                  <motion.div 
                    key="pamphlets" 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    {mockPamphlets.map((pamphlet, idx) => (
                      <div 
                        key={idx}
                        className="bg-[#ffffff] border border-[#e6ebec] rounded-[0px] p-[32px] flex flex-col"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <span className="font-neufile text-[13px] text-[#9fabad]">{pamphlet.category}</span>
                          <span className="font-neufile text-[13px] text-[#9fabad]">{pamphlet.size}</span>
                        </div>
                        <h4 className="font-albra text-[22px] font-semibold text-[#000000] mb-8 tracking-[0.44px] leading-[1.2]">
                          {pamphlet.title}
                        </h4>
                        <a 
                          href={pamphlet.downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-auto text-[#186f64] font-neufile font-medium text-[16px] text-left flex items-center gap-2"
                        >
                          Download Artifact <span className="material-symbols-outlined text-[16px]">download</span>
                        </a>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Community Forum (Lavender Wall Tinted Feature Card Style) */}
      <section className="bg-[#ffffff] py-[96px] px-6">
        <div className="max-w-[1200px] mx-auto bg-[#e6def0] p-[64px] rounded-[0px]">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
              <h2 className="font-albra text-[46px] font-semibold text-[#000000] tracking-[0.92px] leading-[1.2]">
                Forum & Discourse
              </h2>
            </div>
            <div className="flex items-center gap-4 mt-6 md:mt-0">
               <Link 
                  to="/community" 
                  className="bg-[#154ea5] text-[#ffffff] px-[27px] py-[12px] rounded-[2px] font-neufile font-medium text-[16px] inline-flex"
                >
                  Enter Discourse
                </Link>
                <Link 
                  to="/community" 
                  className="text-[#154ea5] font-neufile font-medium text-[16px] inline-flex px-[27px]"
                >
                  View All Topics
                </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {latestTopics.map((topic) => (
              <div
                key={topic.id}
                className="bg-[#ffffff] border border-[#e6ebec] rounded-[0px] p-[32px] flex flex-col"
              >
                <div className="flex justify-between items-start mb-6">
                  <span className="font-neufile text-[13px] text-[#9fabad]">
                    {topic.category}
                  </span>
                </div>
                <h3 className="font-albra text-[22px] font-semibold text-[#000000] mb-8 tracking-[0.44px] leading-[1.2] line-clamp-3">
                  {topic.title || (topic as any).content?.replace(/<[^>]*>?/gm, '').substring(0, 60) + '...'}
                </h3>
                <div className="mt-auto flex items-center justify-between">
                  <span className="font-neufile text-[13px] text-[#000000]">{topic.author}</span>
                  <div className="flex items-center gap-1 text-[#9fabad]">
                    <span className="material-symbols-outlined text-[13px]">favorite</span>
                    <span className="font-neufile text-[13px]">{topic.likes}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Mission (Mist White) */}
      <section className="bg-[#f6f9f9] py-[96px] px-6 border-y border-[#e6ebec]">
        <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row items-center gap-[64px]">
          <div className="lg:w-1/2">
            <h2 className="font-albra text-[46px] font-semibold text-[#000000] tracking-[0.92px] leading-[1.2] mb-6">
              Equitable Architecture
            </h2>
            <p className="font-neufile text-[16px] text-[#000000] leading-[1.4] mb-8">
              We allocate workshop support and targeted curricula specifically for disadvantaged youths, disabled students, and underprivileged municipal schools to narrow the financial intelligence gap.
            </p>
          </div>
          
          <div className="lg:w-1/2 grid grid-cols-2 gap-6">
            {socialIcons.map((item) => (
              <div 
                key={item.name} 
                className="flex items-center gap-4 p-[24px] bg-[#ffffff] border border-[#e6ebec] rounded-[0px]"
              >
                <span className="material-symbols-outlined text-[24px] text-[#191b1f]">{item.icon}</span>
                <span className="font-neufile font-medium text-[13px] text-[#000000]">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Executive Board */}
      <section className="bg-[#ffffff] py-[96px] px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="mb-16">
            <h2 className="font-albra text-[46px] font-semibold text-[#000000] tracking-[0.92px] leading-[1.2] mb-4">
              Executive Board
            </h2>
            <p className="font-neufile text-[16px] text-[#9fabad]">
              The core team guiding the structural intelligence of the movement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {executiveBoard.map((member) => (
              <div
                key={member.name}
                className="bg-[#ffffff] border border-[#e6ebec] p-[32px] rounded-[0px] flex flex-col"
              >
                <div className="w-[48px] h-[48px] bg-[#f6f9f9] border border-[#e6ebec] flex items-center justify-center text-[#000000] font-albra font-semibold text-[22px] mb-6">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 className="font-albra text-[22px] font-semibold text-[#000000] mb-2 tracking-[0.44px] leading-[1.2]">{member.name}</h3>
                <p className="font-neufile font-medium text-[13px] text-[#9fabad] mb-6">{member.role}</p>
                <p className="font-neufile text-[13px] text-[#000000] leading-[1.4]">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Modal */}
      <AnimatePresence>
        {selectedVideoEmbed && (
          <div 
            className="fixed inset-0 z-[100] bg-[#191b1f]/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedVideoEmbed(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#ffffff] rounded-[0px] overflow-hidden max-w-[1024px] w-full shadow-none relative border border-[#e6ebec]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-video bg-[#191b1f]">
                <iframe 
                  className="w-full h-full"
                  src={selectedVideoEmbed}
                  title="Video Player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-[24px] flex justify-between items-center bg-[#ffffff]">
                <span className="font-neufile text-[13px] text-[#9fabad]">Arthneeti Media Viewer</span>
                <button
                  onClick={() => setSelectedVideoEmbed(null)}
                  className="bg-[#191b1f] text-[#ffffff] px-[27px] py-[12px] rounded-[2px] font-neufile font-medium text-[16px] cursor-pointer"
                >
                  Close Artifact
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}
