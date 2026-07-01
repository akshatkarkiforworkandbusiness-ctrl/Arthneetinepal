import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { LESSONS, LEVEL_COLORS } from './LearnPage';

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

const CHROMATIC_GRADIENTS = [
  'linear-gradient(135deg, rgba(132,125,255,0.15) 0%, rgba(9,10,11,0.95) 100%)',
  'linear-gradient(135deg, rgba(0,179,221,0.15) 0%, rgba(9,10,11,0.95) 100%)',
  'linear-gradient(135deg, rgba(221,144,216,0.15) 0%, rgba(9,10,11,0.95) 100%)',
  'linear-gradient(135deg, rgba(144,184,240,0.15) 0%, rgba(9,10,11,0.95) 100%)',
];

export default function LandingPage() {
  const { user, handleJoinAction } = useAuth();
  const [latestTopics, setLatestTopics] = useState<Topic[]>([]);
  const [topicCount, setTopicCount] = useState(100);

  const [marketIndices, setMarketIndices] = useState<Record<string, IndexState>>(initialIndices);
  const [activePillarIndex, setActivePillarIndex] = useState<number | null>(0);
  const [activeResourceTab, setActiveResourceTab] = useState<'videos' | 'pamphlets' | 'faq'>('videos');
  const [selectedVideoEmbed, setSelectedVideoEmbed] = useState<string | null>(null);
  const [faqLanguage, setFaqLanguage] = useState<'en' | 'np'>('en');
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      className="flex flex-col bg-[#0f1011]"
    >
      {/* ═══════════════════════════════════════════
       * HERO SECTION — Dusk Sky Atmosphere
       * ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden min-h-[90vh] flex flex-col justify-center items-center text-center px-6">
        {/* Dusk Sky Gradient Background */}
        <div className="absolute inset-0 gradient-dusk-sky" />
        
        {/* Subtle noise texture overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto pt-20">
          {/* Promo Pill */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-10"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/[0.05] backdrop-blur-sm text-[11px] font-bold uppercase tracking-[0.182em] text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-[#847dff] animate-pulse" />
              Nepali Youth Led Movement
            </span>
          </motion.div>

          {/* Display Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="display-heading mb-8"
          >
            Think Big. <br />
            Invest Smart. <br />
            Lead Nepal.
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-lg text-[#9f9fa0] mb-12 max-w-2xl mx-auto font-light leading-relaxed"
          >
            Building the next generation of economically literate leaders and investors across Nepal.
          </motion.p>
          
          {/* CTA — Single White Pill */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="flex flex-col items-center gap-6"
          >
            {!user ? (
              <button onClick={handleJoinAction} className="btn-primary-pill text-[12px] px-10 py-4">
                Join Arthneeti
                <span className="text-base">→</span>
              </button>
            ) : (
              <Link to="/profile" className="btn-primary-pill text-[12px] px-10 py-4">
                Go to Dashboard
                <span className="text-base">→</span>
              </Link>
            )}
            <Link 
              to="/discover"
              className="text-[11px] font-bold uppercase tracking-[0.182em] text-[#9f9fa0] hover:text-white transition-colors flex items-center gap-2"
            >
              Explore Markets
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </motion.div>

          {/* Award Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="flex items-center justify-center gap-12 mt-20"
          >
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.182em] text-[#9f9fa0]/60 block mb-1">Featured In</span>
              <span className="text-sm font-light text-white/80">Student Leadership Forum</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.182em] text-[#9f9fa0]/60 block mb-1">Recognition</span>
              <span className="text-sm font-light text-white/80">Nepal Financial Education</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
       * MARKET TICKER — Chromatic Illuminated Cards
       * ═══════════════════════════════════════════ */}
      <section className="bg-[#0f1011] py-16 px-6">
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-10">
            <div className="flex items-center gap-3">
              <span className="tracked-label">NEPSE Market Indices</span>
              {marketDataSource === 'live' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00f59b]/10 text-[#00f59b] text-[9px] font-bold uppercase tracking-[0.182em]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00f59b] animate-pulse" />
                  Live
                </span>
              )}
              {marketDataSource === 'simulated' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#dd90d8]/10 text-[#dd90d8] text-[9px] font-bold uppercase tracking-[0.182em]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#dd90d8]" />
                  Simulated
                </span>
              )}
            </div>
            <p className="text-[9px] text-[#9f9fa0]/60 max-w-xs sm:text-right leading-relaxed">
              {marketDataSource === 'live'
                ? `Data via NepseAPI (unofficial). For educational use only.${lastUpdated ? ` Updated ${lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : ''}`
                : 'Live data unavailable. Showing simulated values for illustration only.'}
            </p>
          </div>

          {/* Chromatic Index Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.keys(marketIndices).map((key, idx) => {
              const item = marketIndices[key];
              const isGain = item.change >= 0;
              const accentColor = isGain ? '#00f59b' : '#ef4444';
              const sign = isGain ? '+' : '';
              const gradients = [
                'linear-gradient(135deg, rgba(132,125,255,0.2) 0%, rgba(15,16,17,0.95) 100%)',
                'linear-gradient(135deg, rgba(0,179,221,0.2) 0%, rgba(15,16,17,0.95) 100%)',
                'linear-gradient(135deg, rgba(144,184,240,0.2) 0%, rgba(15,16,17,0.95) 100%)',
              ];
              
              return (
                <motion.div 
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative overflow-hidden p-6 flex justify-between items-center group"
                  style={{
                    borderRadius: '30px',
                    background: gradients[idx % 3],
                  }}
                >
                  {/* Subtle inner glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at 50% 100%, ${accentColor}10 0%, transparent 70%)`,
                    }}
                  />
                  
                  <div className="relative z-10">
                    <span className="text-[10px] font-bold uppercase tracking-[0.182em] text-[#9f9fa0] block mb-2">
                      {item.name}
                    </span>
                    <h4 className="text-3xl font-light text-white tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {item.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </h4>
                    <span 
                      className="text-xs font-bold font-mono inline-flex items-center gap-1 mt-2"
                      style={{ color: accentColor }}
                    >
                      <span className="material-symbols-outlined text-[10px]">
                        {isGain ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                      <span>{sign}{item.changePercent}%</span>
                    </span>
                  </div>
                  
                  {/* Sparkline */}
                  <div className="w-[120px] h-[40px] flex items-center relative z-10">
                    <svg className="w-full h-full">
                      <path 
                        d={getSparklinePath(item.sparkline)}
                        fill="none"
                        stroke={accentColor}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
       * CURRICULUM ROADMAP — Editorial Section
       * ═══════════════════════════════════════════ */}
      <section className="py-28 px-6 bg-[#0f1011]">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div>
              <span className="tracked-label text-[#847dff] mb-4 block">ARTHNEETI ACADEMY</span>
              <h2 className="section-heading">Curriculum<br />Roadmap</h2>
            </div>
            <p className="text-[#9f9fa0] max-w-sm text-sm leading-relaxed">
              Explore the educational path designed to empower students with structural economic knowledge and real market insights.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Accordion Headers */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              {pillarsSyllabus.map((pillar, i) => (
                <button
                  key={pillar.title}
                  onClick={() => setActivePillarIndex(activePillarIndex === i ? null : i)}
                  className={`w-full text-left p-6 border transition-all duration-300 flex items-start gap-4 ${
                    activePillarIndex === i 
                      ? 'bg-[#090a0b] border-white/10' 
                      : 'bg-transparent border-transparent hover:bg-[#090a0b]/50 hover:border-white/[0.04]'
                  }`}
                  style={{ borderRadius: '16px' }}
                >
                  <span className="text-2xl font-light text-[#9f9fa0]/30" style={{ fontFamily: 'Playfair Display, serif' }}>
                    {pillar.num}
                  </span>
                  <div>
                    <h3 className="text-base font-medium text-white mb-2">{pillar.title}</h3>
                    <p className="text-xs text-[#9f9fa0] leading-relaxed">{pillar.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Right: Accordion Details */}
            <div className="lg:col-span-7 bg-[#090a0b] border border-white/[0.06] p-8 flex flex-col justify-between" style={{ borderRadius: '30px' }}>
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
                      <div className="flex justify-between items-center border-b border-white/[0.06] pb-4 mb-6">
                        <h4 className="tracked-label">
                          Syllabus Modules — {pillarsSyllabus[activePillarIndex].title}
                        </h4>
                        <span className="tracked-label text-[#847dff] bg-[#847dff]/10 px-3 py-1" style={{ borderRadius: '9999px' }}>
                          {pillarsSyllabus[activePillarIndex].modules.length} Lessons
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {pillarsSyllabus[activePillarIndex].modules.map((mod, idx) => (
                          <div 
                            key={idx} 
                            className="p-6 flex flex-col justify-between min-h-[200px]"
                            style={{
                              borderRadius: '30px',
                              background: CHROMATIC_GRADIENTS[idx % CHROMATIC_GRADIENTS.length],
                            }}
                          >
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-[0.182em] text-[#847dff] block mb-3">
                                Module 0{idx + 1}
                              </span>
                              <h4 className="text-sm font-medium text-white leading-snug mb-2">
                                {mod.title}
                              </h4>
                              <p className="text-xs text-[#9f9fa0] leading-relaxed">
                                Master {mod.title.toLowerCase()} in this comprehensive module.
                              </p>
                            </div>
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06]">
                              <span className="text-[10px] font-mono text-[#9f9fa0]/60">{mod.duration}</span>
                              <span className="text-[10px] font-bold uppercase tracking-[0.182em] text-[#9f9fa0]/40">
                                0{idx + 1}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/[0.06] pt-6 mt-auto">
                      <span className="text-xs text-[#9f9fa0]/60 italic">Ready to review? Jump into our market explorer.</span>
                      <Link 
                        to="/learn"
                        className="btn-primary-pill text-[10px] py-2.5 px-5"
                      >
                        Start Learning
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </Link>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full flex items-center justify-center text-[#9f9fa0]/40 italic text-xs py-20 text-center">
                    Select a core pillar roadmap on the left to view lessons and module materials.
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
       * FINANCIAL RESOURCE LIBRARY — Clean Tabs
       * ═══════════════════════════════════════════ */}
      <section className="py-24 px-6 bg-[#090a0b]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="tracked-label text-[#847dff] mb-4 block">RESOURCES</span>
            <h2 className="section-heading mb-6">Financial Resource<br />Library</h2>
            <p className="text-[#9f9fa0] text-sm leading-relaxed">
              Explore media materials, Central Bank publications, downloadable infographics, and bilingual FAQs.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center border-b border-white/[0.06] pb-4 mb-10 gap-2">
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
                className={`px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.182em] transition-all flex items-center gap-2 ${
                  activeResourceTab === tab.key 
                    ? 'text-white bg-white/[0.06]' 
                    : 'text-[#9f9fa0] hover:text-white hover:bg-white/[0.03]'
                }`}
                style={{ borderRadius: '9999px' }}
              >
                <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
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
                      className="bg-[#0f1011] border border-white/[0.06] overflow-hidden group flex flex-col justify-between"
                      style={{ borderRadius: '30px' }}
                    >
                      <div className="relative aspect-video overflow-hidden bg-black/40">
                        <img 
                          src={video.thumbnail} 
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-70"
                        />
                        <button 
                          onClick={() => setSelectedVideoEmbed(video.videoUrl)}
                          className="absolute inset-0 m-auto w-12 h-12 bg-white/90 text-[#090a0b] rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-2xl">play_arrow</span>
                        </button>
                        <span className="absolute bottom-3 right-3 bg-[#090a0b]/80 backdrop-blur-sm text-white text-[9px] font-mono px-2 py-1 border border-white/[0.06]" style={{ borderRadius: '9999px' }}>
                          {video.duration}
                        </span>
                      </div>
                      
                      <div className="p-6">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="text-[8px] font-bold uppercase tracking-[0.182em] px-2 py-0.5 border border-white/[0.06] text-[#9f9fa0] inline-block" style={{ borderRadius: '9999px' }}>
                            {video.level}
                          </span>
                        </div>
                        <h4 className="text-sm font-medium text-white group-hover:text-[#847dff] transition-colors mb-2 leading-snug line-clamp-2">
                          {video.title}
                        </h4>
                        <p className="text-xs text-[#9f9fa0] leading-relaxed line-clamp-3">
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
                      className="bg-[#0f1011] border border-white/[0.06] p-6 flex flex-col justify-between"
                      style={{ borderRadius: '30px' }}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="tracked-label text-[#847dff] bg-[#847dff]/10 px-2.5 py-1" style={{ borderRadius: '9999px' }}>
                            {pamphlet.category}
                          </span>
                          <span className="text-[9px] font-mono text-[#9f9fa0]/60">{pamphlet.size}</span>
                        </div>
                        
                        <h4 className="text-sm font-medium text-white mb-2 leading-snug">
                          {pamphlet.title}
                        </h4>
                        <p className="text-[10px] font-bold text-[#9f9fa0]/60 uppercase tracking-[0.182em] mb-6 block">
                          Language: {pamphlet.language}
                        </p>
                      </div>

                      <a 
                        href={pamphlet.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-3 border border-white/20 text-white text-[10px] font-bold uppercase tracking-[0.182em] transition-all flex items-center justify-center gap-1.5 hover:bg-white hover:text-[#090a0b]"
                        style={{ borderRadius: '9999px' }}
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                        Download PDF
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
                  className="max-w-3xl mx-auto bg-[#0f1011] border border-white/[0.06] p-6 md:p-8"
                  style={{ borderRadius: '30px' }}
                >
                  {/* FAQ Header & Language Toggle */}
                  <div className="flex justify-between items-center border-b border-white/[0.06] pb-4 mb-6">
                    <span className="tracked-label">Bilingual FAQ</span>
                    <div className="flex gap-1 bg-[#090a0b] border border-white/[0.06] p-1" style={{ borderRadius: '9999px' }}>
                      <button
                        onClick={() => { setFaqLanguage('en'); setActiveFaqIndex(null); }}
                        className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.182em] transition-all ${
                          faqLanguage === 'en' ? 'bg-white text-[#090a0b]' : 'text-[#9f9fa0] hover:text-white'
                        }`}
                        style={{ borderRadius: '9999px' }}
                      >
                        English
                      </button>
                      <button
                        onClick={() => { setFaqLanguage('np'); setActiveFaqIndex(null); }}
                        className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.182em] transition-all ${
                          faqLanguage === 'np' ? 'bg-white text-[#090a0b]' : 'text-[#9f9fa0] hover:text-white'
                        }`}
                        style={{ borderRadius: '9999px' }}
                      >
                        नेपाली
                      </button>
                    </div>
                  </div>

                  {/* Accordion */}
                  <div className="space-y-3">
                    {mockFAQs[faqLanguage].map((faq, idx) => {
                      const isOpen = activeFaqIndex === idx;
                      return (
                        <div 
                          key={idx}
                          className="border border-white/[0.06] overflow-hidden"
                          style={{ borderRadius: '16px' }}
                        >
                          <button
                            onClick={() => setActiveFaqIndex(isOpen ? null : idx)}
                            className="w-full flex justify-between items-center p-5 bg-[#090a0b] hover:bg-[#090a0b]/80 transition-colors text-left text-sm text-white"
                          >
                            <span className="font-medium pr-4">{faq.q}</span>
                            <span className="material-symbols-outlined text-[#9f9fa0] transition-transform duration-300 shrink-0" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                              expand_more
                            </span>
                          </button>
                          
                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="overflow-hidden bg-[#0f1011]/50 border-t border-white/[0.04]"
                              >
                                <p className="p-5 text-sm text-[#9f9fa0] leading-relaxed">
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

      {/* ═══════════════════════════════════════════
       * COMMUNITY DISCUSSION — Editorial Cards
       * ═══════════════════════════════════════════ */}
      <section className="py-24 px-6 bg-[#0f1011]">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
            <div className="text-center md:text-left">
              <span className="tracked-label text-[#847dff] mb-4 block">LIVE DISCOURSE</span>
              <h2 className="section-heading">Latest Discussions</h2>
            </div>
            <Link 
              to="/community" 
              className="btn-primary-pill text-[10px]"
            >
              Join the Forum
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestTopics.map((topic, i) => (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group p-8 bg-[#090a0b] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
                style={{ borderRadius: '30px' }}
              >
                <div className="flex justify-between items-start mb-6">
                  <span className="tracked-label text-[#847dff] bg-[#847dff]/10 px-3 py-1" style={{ borderRadius: '9999px' }}>
                    {topic.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-[#9f9fa0]/60">
                    <span className="material-symbols-outlined text-sm">favorite</span>
                    <span className="text-[10px] font-mono">{topic.likes}</span>
                  </div>
                </div>
                <Link to="/community" className="block">
                  <h3 className="text-base text-white font-medium mb-4 leading-snug group-hover:text-[#847dff] transition-colors line-clamp-2">
                    {topic.title || (topic as any).content?.replace(/<[^>]*>?/gm, '').substring(0, 60) + '...'}
                  </h3>
                </Link>
                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/[0.06]">
                  <div className="w-8 h-8 rounded-full bg-[#847dff]/10 border border-white/[0.06] flex items-center justify-center text-[10px] font-bold text-[#847dff] uppercase">
                    {topic.author[0]}
                  </div>
                  <span className="tracked-label text-[10px]">{topic.author}</span>
                </div>
              </motion.div>
            ))}

            {latestTopics.length === 0 && (
              <div className="col-span-full py-20 text-center border border-dashed border-white/[0.06] bg-[#090a0b]/50" style={{ borderRadius: '30px' }}>
                <p className="text-[#9f9fa0]/40 italic text-xs">Connecting to community database server...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
       * SOCIAL MISSION — Editorial Quote Block
       * ═══════════════════════════════════════════ */}
      <section className="bg-[#090a0b] py-28 px-6 overflow-hidden">
        <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row items-center gap-20">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:w-1/2 pl-8 border-l border-white/10"
          >
            <h2 className="text-3xl md:text-4xl text-white leading-snug font-light mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
              "We don't just teach finance — we use it to build a more equitable Nepal."
            </h2>
            <p className="text-[#9f9fa0] text-sm leading-relaxed max-w-lg">
              Arthneeti allocates workshop support and targeted curricula specifically for disadvantaged youths, disabled students, and underprivileged municipal schools to narrow the financial intelligence gap.
            </p>
          </motion.div>
          
          <div className="lg:w-1/2 grid grid-cols-2 gap-6">
            {[
              { name: 'Women & Girls', icon: 'woman' },
              { name: "Children's Welfare", icon: 'child_care' },
              { name: 'Disability Inclusion', icon: 'accessible' },
              { name: 'Underprivileged Communities', icon: 'groups' }
            ].map((item, i) => (
              <motion.div 
                key={item.name} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center p-6 bg-[#0f1011] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
                style={{ borderRadius: '30px' }}
              >
                <div className="w-14 h-14 rounded-full bg-[#847dff]/10 flex items-center justify-center text-[#847dff] mb-4 border border-[#847dff]/20">
                  <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                </div>
                <span className="tracked-label text-[10px] text-white">{item.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
       * EXECUTIVE BOARD — Minimal Editorial Cards
       * ═══════════════════════════════════════════ */}
      <section className="py-24 px-6 bg-[#0f1011]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-20">
            <span className="tracked-label text-[#847dff] mb-4 block">LEADERSHIP</span>
            <h2 className="section-heading mb-6">Executive Board</h2>
            <p className="text-[#9f9fa0] max-w-xl mx-auto text-sm">
              The founding team driving the movement for financial intelligence in Nepal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: 'Akshat Karki',
                role: 'President',
                bio: "Leading Arthneeti's vision to build Nepal's most impactful youth financial education movement."
              },
              {
                name: 'Manash Koirala',
                role: 'Vice President',
                bio: "Supporting club operations and co-leading educational strategy for accessible stock market knowledge."
              },
              {
                name: 'Ujjwal Dhungana',
                role: 'Head of Research',
                bio: "Driving Arthneeti's research agenda and external communications with substantive, credible content."
              },
              {
                name: 'Pranjal Khatiwada',
                role: 'Secretary',
                bio: "Managing club coordination, records, and logistics across all schools and sessions."
              }
            ].map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#090a0b] border border-white/[0.06] p-8 flex flex-col items-center text-center group hover:border-white/[0.12] transition-all duration-500"
                style={{ borderRadius: '30px' }}
              >
                <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center text-white text-lg font-light mb-6 group-hover:border-[#847dff]/40 transition-all duration-500" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 className="text-base text-white font-medium mb-1">{member.name}</h3>
                <p className="tracked-label text-[#847dff] text-[9px] mb-4">{member.role}</p>
                <p className="text-[#9f9fa0] text-xs leading-relaxed mb-6">
                  {member.bio}
                </p>
                <a 
                  href="mailto:learnarthneeti@gmail.com"
                  className="tracked-label text-[9px] text-[#9f9fa0]/40 hover:text-[#847dff] transition-colors mt-auto"
                >
                  Get In Touch
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Playback Modal */}
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
              className="bg-[#090a0b] border border-white/[0.06] overflow-hidden max-w-3xl w-full shadow-2xl relative"
              style={{ borderRadius: '30px' }}
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
              <div className="p-5 flex justify-between items-center">
                <span className="text-[10px] text-[#9f9fa0]/60 italic">Arthneeti Academy Resource System</span>
                <button
                  onClick={() => setSelectedVideoEmbed(null)}
                  className="btn-primary-pill text-[10px] py-2 px-5"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.main>
  );
}
