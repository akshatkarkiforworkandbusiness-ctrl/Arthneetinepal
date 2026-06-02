import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

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
  },
  {
    num: '03',
    title: 'Economic & Policy Research',
    desc: 'National accounts, monetary policies, trade balances, and inflation metrics.',
    modules: [
      { title: 'Macroeconomic Principles: GDP, Inflation & Monetary Systems', duration: '80 mins' },
      { title: 'Understanding NRB Monetary Policy & Bank Rate Adjustments', duration: '90 mins' },
      { title: 'The Remittance Economy & Nepal\'s Balance of Payments', duration: '70 mins' },
      { title: 'Designing Survey Methods & Writing Financial Reports', duration: '110 mins' }
    ]
  }
];

const mockVideos = [
  {
    title: 'NEPSE Share Market Guide for Beginners in Nepal',
    desc: 'Step-by-step guidance on DEMAT, Meroshare, IPO application criteria, and brokerage accounts.',
    duration: '25:12',
    videoUrl: 'https://www.youtube.com/embed/Wv-L63uD4m8',
    thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80'
  },
  {
    title: 'Nepal Rastra Bank Monetary Policy Analysis & NEPSE Impact',
    desc: 'Deep-dive explanation of bank interest rates, liquidity constraints, and fiscal policies of Nepal Rastra Bank.',
    duration: '19:40',
    videoUrl: 'https://www.youtube.com/embed/vOenP8oQ_oI',
    thumbnail: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=600&q=80'
  },
  {
    title: 'Stock Selection & Technical Analysis for Beginners',
    desc: 'Learn how to read candlestick charts, support/resistance, and find the best stock entry points.',
    duration: '18:02',
    videoUrl: 'https://www.youtube.com/embed/q6g4V52u1O8',
    thumbnail: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=600&q=80'
  }
];

const mockPamphlets = [
  {
    title: 'Stock Market Investing in Practice — A NEPSE Guide',
    size: '833 KB',
    language: 'English',
    category: 'Investing Guide',
    downloadUrl: '/nepse-investing-guide.pdf'
  },
  {
    title: 'Financial Literacy Guide — Nepal (Rastra Bank Syllabus)',
    size: '484 KB',
    language: 'Nepali / English',
    category: 'National Curriculum',
    downloadUrl: '/nepal_financial_literacy_curriculum.pdf'
  },
  {
    title: 'Arthneeti — Economic Research Guidebook',
    size: '948 KB',
    language: 'English',
    category: 'Research Guidebook',
    downloadUrl: '/arthneeti-economics-guidebook.pdf'
  }
];

const mockFAQs = {
  en: [
    {
      q: 'What is NEPSE and how can I start investing in Nepal?',
      a: 'NEPSE is the Nepal Stock Exchange. To start investing, you must open a Demat Account at a Bank or stock brokerage, register for Meroshare online to apply for IPOs, and open a Trading Account with a licensed broker for secondary market trading.'
    },
    {
      q: 'How does the Nepal Rastra Bank control inflation and money supply?',
      a: 'Nepal Rastra Bank (NRB) is the central bank. It uses monetary tools like Bank Rate adjustments, Cash Reserve Ratio (CRR), Statutory Liquidity Ratio (SLR), and credit allocation limits to control inflation and liquidity.'
    },
    {
      q: 'What is Arthneeti and how does it help students?',
      a: 'Arthneeti is a student-led initiative aiming to build financial literacy and economic reasoning in school children across Nepal through workshops, curriculum roadmaps, and digital resource archives.'
    }
  ],
  np: [
    {
      q: 'नेप्से (NEPSE) भनेको के हो र नेपालमा सेयर लगानी कसरी सुरु गर्ने?',
      a: 'नेप्से नेपाल स्टक एक्सचेन्ज हो। सेयर लगानी सुरु गर्न तपाईँले कुनै पनि बैंक वा धितोपत्र ब्रोकरमा डिम्याट खाता (Demat Account) खोल्नुपर्छ, मेरोसेयर (Meroshare) मार्फत आईपीओ (IPO) आवेदन दिनुपर्छ र दोस्रो बजारका लागि ब्रोकर कहाँ खाता खोल्नुपर्छ।'
    },
    {
      q: 'नेपाल राष्ट्र बैंकले मुद्रा आपूर्ति र मुद्रास्फीति कसरी नियन्त्रण गर्छ?',
      a: 'नेपाल राष्ट्र बैंक केन्द्रीय बैंक हो। यसले मौद्रिक नीति उपकरणहरू जस्तै बैंक दर, अनिवार्य नगद मौज्दात (CRR), वैधानिक तरलता अनुपात (SLR), र कर्जा सीमा तोकेर बजारमा मुद्रा आपूर्ति र मुद्रास्फीति नियन्त्रण गर्छ।'
    },
    {
      q: 'अर्थनीति के हो र यसले विद्यार्थीहरूलाई कसरी मद्दत गर्छ?',
      a: 'अर्थनीति विद्यार्थीहरूद्वारा सञ्चालित अभियान हो जसले नेपालका विद्यालय स्तरका विद्यार्थीहरूमा वित्तीय साक्षरता र आर्थिक समझदारी बढाउन पाठ्यक्रम, कार्यशाला र अध्ययन सामग्रीहरू उपलब्ध गराउँछ।'
    }
  ]
};

export default function LandingPage() {
  const { user, handleJoinAction } = useAuth();
  const [latestTopics, setLatestTopics] = useState<Topic[]>([]);
  const [topicCount, setTopicCount] = useState(100);

  // Market indices simulator
  const [marketIndices, setMarketIndices] = useState<Record<string, IndexState>>(initialIndices);
  
  // Interactive UI states
  const [activePillarIndex, setActivePillarIndex] = useState<number | null>(0);
  const [activeResourceTab, setActiveResourceTab] = useState<'videos' | 'pamphlets' | 'faq'>('videos');
  const [selectedVideoEmbed, setSelectedVideoEmbed] = useState<string | null>(null);
  const [faqLanguage, setFaqLanguage] = useState<'en' | 'np'>('en');
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);

  // Firestore subscription for community updates
  useEffect(() => {
    const qLatest = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(6));
    const unsubscribeLatest = onSnapshot(qLatest, (snapshot) => {
      const topics = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Topic[];
      setLatestTopics(topics);
    });

    const qAll = query(collection(db, 'posts'));
    const unsubscribeCount = onSnapshot(qAll, (snapshot) => {
      setTopicCount(94 + snapshot.size);
    });

    return () => {
      unsubscribeLatest();
      unsubscribeCount();
    };
  }, []);

  // Simulate market indices ticking
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketIndices(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          const item = { ...next[key] };
          const drift = (Math.random() - 0.48) * (item.value * 0.0006); // slight positive drift
          item.value = parseFloat((item.value + drift).toFixed(2));
          item.change = parseFloat((item.change + drift).toFixed(2));
          const basePrice = item.value - item.change;
          item.changePercent = parseFloat(((item.change / basePrice) * 100).toFixed(2));
          
          // Rotate sparkline history
          const updatedSpark = [...item.sparkline.slice(1), item.value];
          item.sparkline = updatedSpark;
          next[key] = item;
        });
        return next;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: 'Active Topics', value: `${topicCount}+` },
    { label: 'Board Members', value: '4' },
    { label: 'Core Pillars', value: '3' }
  ];

  const socialIcons = [
    { name: 'Women & Girls', icon: 'woman' },
    { name: 'Children\'s Welfare', icon: 'child_care' },
    { name: 'Disability Inclusion', icon: 'accessible' },
    { name: 'Underprivileged Communities', icon: 'groups' }
  ];

  // Map numbers to SVG sparkline values
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
      className="flex flex-col bg-[#0B0F19]"
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-44 px-6 min-h-[85vh] flex flex-col justify-center items-center text-center">
        {/* Geometric Dot/Grid Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dotPattern" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="15" cy="15" r="1.5" fill="#94A3B8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dotPattern)" />
          </svg>
        </div>

        {/* Nepal Flag Floating Accents */}
        <div className="absolute top-20 right-[15%] w-72 h-72 bg-crimson/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-[15%] w-72 h-72 bg-royal/10 rounded-full blur-3xl" />

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-4xl"
        >
          <span className="text-[10px] font-black text-crimson mb-4 block uppercase tracking-[0.4em]">NEPALESE YOUTH LED MOVEMENT</span>
          <h1 className="text-5xl md:text-8xl text-white mb-8 leading-tight tracking-tight font-display italic">
            Think Big. <br />
            Invest Smart. <br />
            Lead Nepal.
          </h1>
          <p className="text-lg md:text-xl text-text-muted mb-12 max-w-2xl mx-auto font-sans font-medium">
            Building the next generation of economically literate leaders and investors across Nepal.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            {!user ? (
              <button 
                onClick={handleJoinAction}
                className="bg-crimson text-white px-10 py-4 rounded text-xs font-black uppercase tracking-widest hover:bg-white hover:text-crimson transition-all shadow-2xl cursor-pointer"
              >
                Join Arthneeti
              </button>
            ) : (
              <Link 
                to="/profile" 
                className="bg-crimson text-white px-10 py-4 rounded text-xs font-black uppercase tracking-widest hover:bg-white hover:text-crimson transition-all shadow-2xl text-center"
              >
                Go to Dashboard
              </Link>
            )}
            <Link 
              to="/discover" 
              className="border border-[#1F2A3F] bg-[#161F30] text-white px-10 py-4 rounded text-xs font-black uppercase tracking-widest hover:bg-royal hover:border-royal transition-all text-center"
            >
              Explore Ticker & Tools
            </Link>
          </div>
        </motion.div>

        {/* Animated Marquee Bottom */}
        <div className="absolute bottom-0 left-0 w-full bg-[#161F30]/80 py-4 overflow-hidden border-t border-[#1F2A3F]">
          <div className="flex whitespace-nowrap animate-marquee">
            {[...Array(8)].map((_, i) => (
              <span key={i} className="text-text-muted text-[9px] font-black uppercase tracking-[0.4em] mx-10">
                NEPSE MARKET HUB • CAPITAL EDUCATION • NRB COMPLIANCE • POLICY DISCOURSE • FINANCIAL DEMOCRACY •
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Market Ticker Sparkline Section */}
      <section className="bg-[#161F30] border-y border-[#1F2A3F] py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.keys(marketIndices).map((key) => {
              const item = marketIndices[key];
              const isGain = item.change >= 0;
              const accentColor = isGain ? '#10B981' : '#F43F5E';
              const sign = isGain ? '+' : '';
              
              return (
                <div 
                  key={key} 
                  className="bg-[#0B0F19] border border-[#1F2A3F] p-5 rounded-2xl flex justify-between items-center shadow-lg hover:border-royal/50 transition-all duration-300"
                >
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-text-muted block mb-1">{item.name}</span>
                    <h4 className="text-2xl font-black font-mono text-white tracking-tight">{item.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h4>
                    <span 
                      className="text-xs font-bold font-mono inline-flex items-center gap-0.5 mt-1"
                      style={{ color: accentColor }}
                    >
                      <span className="material-symbols-outlined text-[10px]">
                        {isGain ? 'arrow_upward' : 'arrow_downward'}
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
                        stroke={accentColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Learning Academy Curriculum Roadmap Section */}
      <section className="py-28 px-6 bg-[#0B0F19]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div>
              <span className="text-[10px] font-black text-crimson mb-4 block uppercase tracking-[0.4em]">ARTHNEETI ACADEMY</span>
              <h2 className="text-4xl md:text-6xl text-white leading-tight italic font-display">Curriculum Roadmap</h2>
            </div>
            <p className="text-text-muted max-w-sm text-sm leading-relaxed">
              Explore the educational path designed to empower students with structural economic knowledge and real market insights.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Side: Accordion Headers */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {pillarsSyllabus.map((pillar, i) => (
                <button
                  key={pillar.title}
                  onClick={() => setActivePillarIndex(activePillarIndex === i ? null : i)}
                  className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 flex items-start gap-4 ${
                    activePillarIndex === i 
                      ? 'bg-[#161F30] border-royal shadow-lg' 
                      : 'bg-transparent border-[#1F2A3F] hover:border-text-muted/40 hover:bg-[#161F30]/30'
                  }`}
                >
                  <span className="text-2xl font-display text-royal/40 font-bold">{pillar.num}</span>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">{pillar.title}</h3>
                    <p className="text-xs text-text-muted leading-relaxed">{pillar.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Right Side: Accordion Details */}
            <div className="lg:col-span-7 bg-[#161F30] border border-[#1F2A3F] rounded-3xl p-8 flex flex-col justify-between shadow-2xl">
              <AnimatePresence mode="wait">
                {activePillarIndex !== null ? (
                  <motion.div
                    key={activePillarIndex}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="flex-grow flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-center border-b border-[#1F2A3F] pb-4 mb-6">
                        <h4 className="text-xs font-black uppercase tracking-widest text-text-muted">
                          Syllabus Modules ({pillarsSyllabus[activePillarIndex].title})
                        </h4>
                        <span className="text-[10px] font-black text-royal uppercase tracking-widest bg-royal/10 border border-royal/20 px-3 py-1 rounded-full">
                          {pillarsSyllabus[activePillarIndex].modules.length} Lessons
                        </span>
                      </div>
                      
                      <div className="space-y-4 mb-8">
                        {pillarsSyllabus[activePillarIndex].modules.map((mod, idx) => (
                          <div 
                            key={idx} 
                            className="flex justify-between items-center bg-[#0B0F19] border border-[#1F2A3F] p-4 rounded-xl"
                          >
                            <span className="text-xs font-bold text-white flex items-center gap-3">
                              <span className="w-5 h-5 rounded bg-royal/10 border border-royal/25 text-royal flex items-center justify-center text-[9px] font-black">
                                {idx + 1}
                              </span>
                              {mod.title}
                            </span>
                            <span className="text-[9px] font-bold font-mono text-text-muted uppercase tracking-widest bg-[#161F30] px-2.5 py-1 rounded border border-[#1F2A3F]">
                              {mod.duration}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#1F2A3F] pt-6 mt-auto">
                      <span className="text-[10px] text-text-muted italic">Ready to review? Jump into our market explorer.</span>
                      <Link 
                        to="/discover"
                        className="bg-royal text-white px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-royal transition-all flex items-center gap-1.5"
                      >
                        Start Learning Modules
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </Link>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full flex items-center justify-center text-text-muted italic text-xs py-20 text-center">
                    Select a core pillar roadmap on the left to view lessons and module materials.
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Nepal Rastra Bank (NRB) Financial Resource Portal */}
      <section className="py-24 px-6 bg-[#161F30] border-y border-[#1F2A3F]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[10px] font-black text-crimson mb-2 block uppercase tracking-[0.4em]">NRB-INSPIRED PORTAL</span>
            <h2 className="text-4xl md:text-5xl text-white font-display italic mb-6">Financial Resource Library</h2>
            <p className="text-text-muted text-sm leading-relaxed">
              Explore media materials, Central Bank publications, downloadable infographics, and bilingual FAQs.
            </p>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex justify-center border-b border-[#1F2A3F] pb-4 mb-10 gap-3">
            {[
              { key: 'videos', label: 'Video Lessons', icon: 'play_circle' },
              { key: 'pamphlets', label: 'Guidelines & PDFs', icon: 'article' },
              { key: 'faq', label: 'Bilingual FAQs', icon: 'help' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveResourceTab(tab.key as any);
                  setActiveFaqIndex(null);
                }}
                className={`px-6 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 ${
                  activeResourceTab === tab.key 
                    ? 'bg-royal text-white shadow-xl' 
                    : 'text-text-muted hover:text-white hover:bg-[#0B0F19]/60 border border-[#1F2A3F]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab contents */}
          <div className="min-h-[300px]">
            <AnimatePresence mode="wait">
              {activeResourceTab === 'videos' && (
                <motion.div 
                  key="videos" 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-8"
                >
                  {mockVideos.map((video, idx) => (
                    <div 
                      key={idx}
                      className="bg-[#0B0F19] border border-[#1F2A3F] rounded-2xl overflow-hidden group shadow-lg flex flex-col justify-between"
                    >
                      <div className="relative aspect-video overflow-hidden bg-black/40">
                        <img 
                          src={video.thumbnail} 
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                        />
                        <button 
                          onClick={() => setSelectedVideoEmbed(video.videoUrl)}
                          className="absolute inset-0 m-auto w-12 h-12 bg-royal text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-2xl">play_arrow</span>
                        </button>
                        <span className="absolute bottom-3 right-3 bg-[#0B0F19] text-white text-[9px] font-bold font-mono px-2 py-0.5 rounded border border-[#1F2A3F]">
                          {video.duration}
                        </span>
                      </div>
                      
                      <div className="p-6">
                        <h4 className="text-sm font-bold text-white group-hover:text-royal transition-colors mb-3 leading-snug line-clamp-2">
                          {video.title}
                        </h4>
                        <p className="text-xs text-text-muted leading-relaxed line-clamp-3">
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
                      className="bg-[#0B0F19] border border-[#1F2A3F] p-6 rounded-2xl flex flex-col justify-between shadow-lg hover:border-royal/50 transition-all duration-300"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="bg-[#161F30] text-text-muted text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded border border-[#1F2A3F]">
                            {pamphlet.category}
                          </span>
                          <span className="text-[8px] font-bold font-mono text-text-muted">{pamphlet.size}</span>
                        </div>
                        
                        <h4 className="text-sm font-bold text-white mb-3 leading-snug">
                          {pamphlet.title}
                        </h4>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-6 block">
                          Language: {pamphlet.language}
                        </p>
                      </div>

                      <a 
                        href={pamphlet.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-3 bg-[#161F30] hover:bg-royal hover:text-white border border-[#1F2A3F] text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                        Download PDF Guide
                      </a>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeResourceTab === 'faq' && (
                <motion.div 
                  key="faq" 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-3xl mx-auto bg-[#0B0F19] border border-[#1F2A3F] rounded-3xl p-6 md:p-8 shadow-xl"
                >
                  {/* FAQ Header & Language Toggle */}
                  <div className="flex justify-between items-center border-b border-[#1F2A3F] pb-4 mb-6">
                    <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">Bilingual FAQ Accordion</span>
                    <div className="flex gap-1.5 bg-[#161F30] border border-[#1F2A3F] p-1 rounded-lg">
                      <button
                        onClick={() => { setFaqLanguage('en'); setActiveFaqIndex(null); }}
                        className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-md transition-all ${
                          faqLanguage === 'en' ? 'bg-royal text-white' : 'text-text-muted hover:text-white'
                        }`}
                      >
                        English
                      </button>
                      <button
                        onClick={() => { setFaqLanguage('np'); setActiveFaqIndex(null); }}
                        className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-md transition-all ${
                          faqLanguage === 'np' ? 'bg-royal text-white' : 'text-text-muted hover:text-white'
                        }`}
                      >
                        नेपाली
                      </button>
                    </div>
                  </div>

                  {/* Accordion Questions */}
                  <div className="space-y-4">
                    {mockFAQs[faqLanguage].map((faq, idx) => {
                      const isOpen = activeFaqIndex === idx;
                      return (
                        <div 
                          key={idx}
                          className="border border-[#1F2A3F] rounded-xl overflow-hidden"
                        >
                          <button
                            onClick={() => setActiveFaqIndex(isOpen ? null : idx)}
                            className="w-full flex justify-between items-center p-4 bg-[#161F30] hover:bg-[#161F30]/80 transition-colors text-left text-xs font-bold text-white"
                          >
                            <span>{faq.q}</span>
                            <span className="material-symbols-outlined text-text-muted transition-transform duration-300" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                              expand_more
                            </span>
                          </button>
                          
                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="overflow-hidden bg-[#0B0F19]/40 border-t border-[#1F2A3F]"
                              >
                                <p className="p-4 text-xs text-text-muted leading-relaxed">
                                  {faq.a}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Dynamic Community Discussion Section */}
      <section className="py-24 px-6 bg-[#0B0F19]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
            <div className="text-center md:text-left">
              <span className="text-[10px] font-black text-crimson mb-2 block uppercase tracking-[0.4em]">LIVE DISCOURSE FEED</span>
              <h2 className="text-4xl md:text-5xl text-white italic font-display">Latest Discussion Topics</h2>
            </div>
            <Link 
              to="/community" 
              className="text-[10px] font-black text-royal uppercase tracking-widest border border-royal/30 px-8 py-4 rounded-xl hover:bg-royal hover:text-white transition-all bg-[#161F30]/50"
            >
              JOIN THE FORUM
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {latestTopics.map((topic, i) => (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group p-8 rounded-3xl bg-[#161F30] border border-[#1F2A3F] hover:border-royal/50 hover:bg-[#161F30]/80 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-6">
                  <span className="px-3.5 py-1 bg-royal/10 text-royal text-[8px] font-black uppercase tracking-widest rounded-full border border-royal/20">
                    {topic.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-crimson">
                    <span className="material-symbols-outlined text-sm">favorite</span>
                    <span className="text-[10px] font-bold">{topic.likes}</span>
                  </div>
                </div>
                <Link to="/community" className="block">
                  <h3 className="text-lg text-white font-display italic mb-4 leading-snug group-hover:text-royal transition-colors line-clamp-2">
                    {topic.title || (topic as any).content?.replace(/<[^>]*>?/gm, '').substring(0, 60) + '...'}
                  </h3>
                </Link>
                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-[#1F2A3F]">
                  <div className="w-8 h-8 rounded-full bg-royal/10 border border-royal/30 flex items-center justify-center text-[10px] font-bold text-royal uppercase">
                    {topic.author[0]}
                  </div>
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{topic.author}</span>
                </div>
              </motion.div>
            ))}

            {latestTopics.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-[#1F2A3F] rounded-3xl bg-[#161F30]/40">
                <p className="text-text-muted italic text-xs">Connecting to community database server...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Social Mission & Equity Support Section */}
      <section className="bg-[#161F30] border-t border-[#1F2A3F] py-28 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:w-1/2 border-l-8 border-royal pl-10"
          >
            <h2 className="text-4xl md:text-5xl text-white leading-tight italic font-display mb-6">
              "We don't just teach finance — we use it to build a more equitable Nepal."
            </h2>
            <p className="text-text-muted text-sm leading-relaxed max-w-lg">
              Arthneeti allocates workshop support and targeted curricula specifically for disadvantaged youths, disabled students, and underprivileged municipal schools to narrow the financial intelligence gap.
            </p>
          </motion.div>
          
          <div className="lg:w-1/2 grid grid-cols-2 gap-8">
            {socialIcons.map((item, i) => (
              <motion.div 
                key={item.name} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center p-6 bg-[#0B0F19] border border-[#1F2A3F] rounded-2xl hover:border-royal/50 transition-all duration-300"
              >
                <div className="w-16 h-16 rounded-full bg-royal/10 flex items-center justify-center text-royal mb-4 border border-royal/20">
                  <span className="material-symbols-outlined text-3xl">{item.icon}</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white">{item.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Executive Board Section */}
      <section className="py-24 px-6 bg-[#0B0F19] border-t border-[#1F2A3F]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-[10px] font-black text-crimson mb-4 block uppercase tracking-[0.4em]">LEADERSHIP</span>
            <h2 className="text-4xl md:text-5xl text-white italic mb-6 font-display">Executive Board</h2>
            <p className="text-text-muted max-w-xl mx-auto italic font-sans text-sm">
              The founding team driving the movement for financial intelligence in Nepal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                name: 'Akshat Karki',
                role: 'President',
                email: 'akshatkarkiforwork.and.business@gmail.com',
                bio: "Leading Arthneeti's vision to build Nepal's most impactful youth financial education movement. Focused on school partnerships, club strategy, and driving the mission forward."
              },
              {
                name: 'Manash Koirala',
                role: 'Vice President',
                email: 'manashkoirala19@gmail.com',
                bio: "Supporting club operations and co-leading educational strategy. Passionate about making stock market knowledge accessible to every Nepali high schooler."
              },
              {
                name: 'Ujjwal Dhungana',
                role: 'Head of Research & Communication',
                email: 'dhunganaujjwal94@gmail.com',
                bio: "Driving Arthneeti's research agenda and external communications. Builds the intellectual content that makes our sessions substantive and credible."
              },
              {
                name: 'Pranjal Khatiwada',
                role: 'Secretary',
                email: 'pranjalkhatiwada17@gmail.com',
                bio: "Managing club coordination, records, and logistics. Ensures Arthneeti runs smoothly across all schools and sessions."
              }
            ].map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#161F30] p-10 rounded-xl relative border-t-8 border-crimson border border-[#1F2A3F] shadow-2xl flex flex-col items-center text-center group hover:-translate-y-2 transition-all duration-500"
              >
                <div className="w-20 h-20 rounded-full border-4 border-white/10 flex items-center justify-center text-white font-display italic text-3xl mb-8 group-hover:border-crimson group-hover:text-crimson transition-all duration-500">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 className="text-xl text-white font-display italic mb-2">{member.name}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-crimson mb-6">{member.role}</p>
                <p className="text-text-muted text-xs italic font-sans leading-relaxed mb-6">
                  {member.bio}
                </p>
                <a 
                  href={`mailto:${member.email}`}
                  className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-crimson transition-colors"
                >
                  Get In Touch
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Playback Modal Overlay */}
      <AnimatePresence>
        {selectedVideoEmbed && (
          <div 
            className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedVideoEmbed(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#161F30] border border-[#1F2A3F] rounded-2xl overflow-hidden max-w-3xl w-full shadow-2xl relative"
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
              <div className="p-4 flex justify-between items-center">
                <span className="text-[10px] text-text-muted italic">Arthneeti Academy Resource System</span>
                <button
                  onClick={() => setSelectedVideoEmbed(null)}
                  className="bg-royal text-white px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-white hover:text-royal transition-all cursor-pointer"
                >
                  Close Player
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}} />
    </motion.main>
  );
}
