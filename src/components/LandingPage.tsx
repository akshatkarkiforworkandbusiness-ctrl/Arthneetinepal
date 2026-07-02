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
      className="flex flex-col bg-white"
    >
      {/* Hero Section */}
      <section className="hero-gradient relative overflow-hidden pt-40 pb-32 px-6 min-h-[100vh] flex flex-col justify-center items-start text-left">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-7xl mx-auto w-full"
        >
          <h1 className="text-6xl md:text-[155px] text-white leading-[0.9] tracking-[0.03em] font-display font-medium mb-8">
            Think Big.<br />
            Invest Smart.<br />
            Lead Nepal.
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl font-sans">
            Building the next generation of economically literate leaders and investors across Nepal.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6">
            {!user ? (
              <button 
                onClick={handleJoinAction}
                className="outlined-cta"
              >
                Sign up
              </button>
            ) : (
              <Link 
                to="/profile" 
                className="outlined-cta"
              >
                Go to Dashboard
                <span className="text-base">→</span>
              </Link>
            )}
            <Link 
              to="/discover" 
              className="bg-white/20 backdrop-blur-sm border border-white/40 text-white rounded-[16px] px-6 py-2.5 font-sans font-medium transition-transform active:scale-95 hover:bg-white hover:text-coral-flame text-center"
            >
              Explore Markets
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

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
        </motion.div>
      </section>

      {/* Market Ticker Sparkline Section */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header row with status + disclaimer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brandwood">NEPSE Market Indices</span>
              {marketDataSource === 'live' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-mint-action/10 border border-mint-action/30 text-mint-action text-[9px] font-bold uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-mint-action animate-pulse inline-block" />
                  Live
                </span>
              )}
              {marketDataSource === 'simulated' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-coral-flame/10 border border-coral-flame/30 text-coral-flame text-[9px] font-bold uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-coral-flame inline-block" />
                  Simulated
                </span>
              )}
              {marketDataSource === 'loading' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blush-mist text-brandwood text-[9px] font-bold uppercase tracking-widest">
                  <span className="inline-block w-2 h-2 border border-brandwood border-t-transparent rounded-full animate-spin" />
                  Loading
                </span>
              )}
            </div>
            <div className="flex flex-col sm:items-end gap-0.5">
              <p className="text-[10px] text-text-muted leading-relaxed max-w-xs sm:text-right">
                {marketDataSource === 'live'
                  ? `Data via NepseAPI (unofficial). For educational use only — not financial advice.${lastUpdated ? ` Updated ${lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : ''}`
                  : 'Live data unavailable. Showing simulated values for educational illustration only — not real market data.'}
              </p>
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
              const accentColor = isGain ? '#34c771' : '#f73b20';
              const sign = isGain ? '+' : '';
              const gradients = [
                'linear-gradient(135deg, rgba(132,125,255,0.2) 0%, rgba(15,16,17,0.95) 100%)',
                'linear-gradient(135deg, rgba(0,179,221,0.2) 0%, rgba(15,16,17,0.95) 100%)',
                'linear-gradient(135deg, rgba(144,184,240,0.2) 0%, rgba(15,16,17,0.95) 100%)',
              ];
              
              return (
                <div 
                  key={key} 
                  className="bg-sunset-fade p-6 rounded-3xl flex justify-between items-center shadow-warm-lift transition-all duration-300 border border-blush-mist"
                >
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-brandwood/60 block mb-1">{item.name}</span>
                    <h4 className="text-3xl font-medium font-display text-brandwood tracking-tight">{item.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h4>
                    <span 
                      className="text-sm font-bold font-sans inline-flex items-center gap-0.5 mt-1"
                      style={{ color: accentColor }}
                    >
                      <span className="material-symbols-outlined text-[12px]">
                        {isGain ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                      <span>{sign}{item.changePercent}%</span>
                    </span>
                  </div>
                  
                  {/* Sparkline Graphic */}
                  <div className="w-[100px] h-[40px] flex items-center">
                    <svg className="w-full h-full">
                      <path 
                        d={getSparklinePath(item.sparkline)}
                        fill="none"
                        stroke={accentColor}
                        strokeWidth="2.5"
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
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div>
              <h2 className="text-[72px] text-coral-flame leading-[0.9] tracking-[0.03em] font-display font-medium">Curriculum<br/>Roadmap</h2>
            </div>
            <p className="text-brandwood/70 max-w-sm text-base leading-relaxed font-sans">
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
                  className={`w-full text-left p-6 rounded-3xl border-2 transition-all duration-300 flex items-start gap-4 ${
                    activePillarIndex === i 
                      ? 'bg-white border-coral-flame shadow-warm-lift' 
                      : 'bg-transparent border-blush-mist hover:border-coral-flame hover:bg-sunset-fade'
                  }`}
                  style={{ borderRadius: '16px' }}
                >
                  <span className="text-2xl font-sans tracking-tight text-coral-flame/40 font-bold">{pillar.num}</span>
                  <div>
                    <h3 className="text-xl font-bold text-brandwood mb-2 font-display">{pillar.title}</h3>
                    <p className="text-sm text-text-muted leading-relaxed font-sans">{pillar.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Right Side: Accordion Details */}
            <div className="lg:col-span-7 bg-sunset-fade border border-blush-mist rounded-3xl p-8 flex flex-col justify-between shadow-warm-lift">
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
                      <div className="flex justify-between items-center border-b border-blush-mist pb-4 mb-6">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-brandwood/70">
                          Syllabus Modules ({pillarsSyllabus[activePillarIndex].title})
                        </h4>
                        <span className="text-[10px] font-bold text-mint-action uppercase tracking-widest bg-mint-action/10 border border-mint-action/20 px-3 py-1 rounded-xl">
                          {pillarsSyllabus[activePillarIndex].modules.length} Lessons
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {pillarsSyllabus[activePillarIndex].modules.map((mod, idx) => (
                          <div key={idx} className="h-[280px]">
                            <div className="h-full bg-white border border-blush-mist rounded-2xl p-6 shadow-warm-lift flex flex-col justify-between">
                              <span className="text-[10px] font-bold text-coral-flame uppercase tracking-widest bg-coral-flame/10 w-fit px-2 py-1 rounded-lg">0{idx + 1}</span>
                              <h3 className="text-lg font-bold text-brandwood mt-4 line-clamp-3">{mod.title}</h3>
                              <p className="text-sm text-text-muted mt-2">Master {mod.title.toLowerCase()} in this module.</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-blush-mist pt-6 mt-auto">
                      <span className="text-sm text-text-muted font-sans">Ready to review? Jump into our market explorer.</span>
                      <Link 
                        to="/learn"
                        className="outlined-cta"
                      >
                        Start Learning Modules
                      </Link>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full flex items-center justify-center text-text-muted italic text-sm py-20 text-center">
                    Select a core pillar roadmap on the left to view lessons and module materials.
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Nepal Rastra Bank (NRB) Financial Resource Portal */}
      <section className="py-24 px-6 bg-sunset-fade border-y border-blush-mist">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[10px] font-black text-coral-flame mb-2 block uppercase tracking-[0.4em]">NRB-INSPIRED PORTAL</span>
            <h2 className="text-[60px] text-brandwood font-display tracking-[0.03em] leading-[1.0] font-medium mb-6">Financial Resource Library</h2>
            <p className="text-text-muted text-lg leading-relaxed font-sans">
              Explore media materials, Central Bank publications, downloadable infographics, and bilingual FAQs.
            </p>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex justify-center border-b border-blush-mist pb-4 mb-10 gap-3">
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
                className={`px-6 py-3 text-sm font-bold uppercase tracking-wider rounded-2xl transition-all flex items-center gap-2 ${
                  activeResourceTab === tab.key 
                    ? 'bg-coral-flame text-white shadow-warm-float' 
                    : 'text-text-muted hover:text-brandwood hover:bg-white border border-blush-mist'
                }`}
                style={{ borderRadius: '9999px' }}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
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
                      className="bg-white border border-blush-mist rounded-3xl overflow-hidden group shadow-warm-lift flex flex-col justify-between"
                    >
                      <div className="relative aspect-video overflow-hidden bg-blush-mist">
                        <img 
                          src={video.thumbnail} 
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                        />
                        <button 
                          onClick={() => setSelectedVideoEmbed(video.videoUrl)}
                          className="absolute inset-0 m-auto w-14 h-14 bg-white/90 text-coral-flame border-2 border-coral-flame rounded-full flex items-center justify-center shadow-warm-float hover:scale-110 transition-transform cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-3xl">play_arrow</span>
                        </button>
                        <span className="absolute bottom-3 right-3 bg-white text-brandwood text-[10px] font-bold font-mono px-3 py-1 rounded-xl shadow-sm">
                          {video.duration}
                        </span>
                      </div>
                      
                      <div className="p-6">
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-xl border border-blush-mist text-brandwood bg-sunset-fade">
                            {video.level}
                          </span>
                        </div>
                        <h4 className="text-xl font-bold text-brandwood group-hover:text-coral-flame transition-colors mb-3 leading-snug line-clamp-2 font-display">
                          {video.title}
                        </h4>
                        <p className="text-sm text-text-muted leading-relaxed line-clamp-3 font-sans">
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
                      className="bg-white border border-blush-mist p-6 rounded-3xl flex flex-col justify-between shadow-warm-lift hover:border-coral-flame hover:shadow-warm-float transition-all duration-300"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="bg-sunset-fade text-brandwood text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-xl border border-blush-mist">
                            {pamphlet.category}
                          </span>
                          <span className="text-[10px] font-bold font-mono text-text-muted">{pamphlet.size}</span>
                        </div>
                        
                        <h4 className="text-lg font-bold text-brandwood mb-3 leading-snug font-display">
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
                        className="w-full py-3 bg-sunset-fade hover:bg-coral-flame hover:text-white border border-blush-mist hover:border-coral-flame text-brandwood text-[10px] font-bold uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
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
                  className="max-w-3xl mx-auto bg-white border border-blush-mist rounded-3xl p-6 md:p-8 shadow-warm-lift"
                >
                  {/* FAQ Header & Language Toggle */}
                  <div className="flex justify-between items-center border-b border-blush-mist pb-4 mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Bilingual FAQ Accordion</span>
                    <div className="flex gap-1.5 bg-sunset-fade border border-blush-mist p-1 rounded-xl">
                      <button
                        onClick={() => { setFaqLanguage('en'); setActiveFaqIndex(null); }}
                        className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                          faqLanguage === 'en' ? 'bg-coral-flame text-white shadow-sm' : 'text-brandwood/70 hover:text-brandwood hover:bg-white'
                        }`}
                        style={{ borderRadius: '9999px' }}
                      >
                        English
                      </button>
                      <button
                        onClick={() => { setFaqLanguage('np'); setActiveFaqIndex(null); }}
                        className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                          faqLanguage === 'np' ? 'bg-coral-flame text-white shadow-sm' : 'text-brandwood/70 hover:text-brandwood hover:bg-white'
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
                          className="border border-blush-mist rounded-2xl overflow-hidden shadow-sm"
                        >
                          <button
                            onClick={() => setActiveFaqIndex(isOpen ? null : idx)}
                            className={`w-full flex justify-between items-center p-5 transition-colors text-left text-sm font-bold text-brandwood ${isOpen ? 'bg-sunset-fade' : 'bg-white hover:bg-sunset-fade/50'}`}
                          >
                            <span>{faq.q}</span>
                            <span className={`material-symbols-outlined text-coral-flame transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                              expand_more
                            </span>
                          </button>
                          
                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="overflow-hidden bg-white border-t border-blush-mist"
                              >
                                <p className="p-5 text-sm text-text-muted leading-relaxed font-sans">
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
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
            <div className="text-center md:text-left">
              <span className="text-[10px] font-bold text-mint-action mb-2 block uppercase tracking-[0.4em]">LIVE DISCOURSE FEED</span>
              <h2 className="text-[48px] md:text-[60px] text-brandwood font-display tracking-[0.03em] leading-[1.0] font-medium">Latest Discussion Topics</h2>
            </div>
            <Link 
              to="/community" 
              className="outlined-cta"
            >
              Join the Forum
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
                className="group p-8 rounded-3xl bg-sunset-fade border border-blush-mist hover:border-coral-flame/50 hover:bg-white transition-all duration-300 shadow-warm-lift"
              >
                <div className="flex justify-between items-start mb-6">
                  <span className="px-3.5 py-1 bg-coral-flame/10 text-coral-flame text-[10px] font-bold uppercase tracking-widest rounded-xl border border-coral-flame/20">
                    {topic.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-mint-action">
                    <span className="material-symbols-outlined text-sm">favorite</span>
                    <span className="text-[10px] font-mono">{topic.likes}</span>
                  </div>
                </div>
                <Link to="/community" className="block">
                  <h3 className="text-xl text-brandwood font-display tracking-tight font-bold mb-4 leading-snug group-hover:text-coral-flame transition-colors line-clamp-2">
                    {topic.title || (topic as any).content?.replace(/<[^>]*>?/gm, '').substring(0, 60) + '...'}
                  </h3>
                </Link>
                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-blush-mist">
                  <div className="w-8 h-8 rounded-xl bg-coral-flame/10 border border-coral-flame/20 flex items-center justify-center text-[10px] font-bold text-coral-flame uppercase">
                    {topic.author[0]}
                  </div>
                  <span className="tracked-label text-[10px]">{topic.author}</span>
                </div>
              </motion.div>
            ))}

            {latestTopics.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-blush-mist rounded-3xl bg-sunset-fade/40">
                <p className="text-text-muted italic text-sm font-sans">Connecting to community database server...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Social Mission & Equity Support Section */}
      <section className="bg-sunset-fade border-y border-blush-mist py-28 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:w-1/2 border-l-8 border-coral-flame pl-10"
          >
            <h2 className="text-5xl text-brandwood leading-[1.0] font-display tracking-[0.03em] font-medium mb-6">
              "We don't just teach finance — we use it to build a more equitable Nepal."
            </h2>
            <p className="text-text-muted text-lg leading-relaxed max-w-lg font-sans">
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
                className="flex flex-col items-center text-center p-8 bg-white border border-blush-mist rounded-3xl hover:border-coral-flame/50 hover:shadow-warm-float transition-all duration-300 shadow-warm-lift"
              >
                <div className="w-16 h-16 rounded-2xl bg-coral-flame/10 flex items-center justify-center text-coral-flame mb-4 border border-coral-flame/20">
                  <span className="material-symbols-outlined text-3xl">{item.icon}</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-brandwood">{item.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Executive Board Section */}
      <section className="py-24 px-6 bg-white border-b border-blush-mist">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-[10px] font-bold text-coral-flame mb-4 block uppercase tracking-[0.4em]">LEADERSHIP</span>
            <h2 className="text-[60px] text-brandwood mb-6 font-display tracking-[0.03em] font-medium leading-[1.0]">Executive Board</h2>
            <p className="text-text-muted max-w-xl mx-auto font-sans text-lg">
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
                className="bg-white p-10 rounded-3xl relative border-t-8 border-t-coral-flame border border-blush-mist shadow-warm-lift flex flex-col items-center text-center group hover:-translate-y-2 hover:shadow-warm-float transition-all duration-500"
              >
                <div className="w-20 h-20 rounded-2xl bg-sunset-fade border border-blush-mist flex items-center justify-center text-brandwood font-display font-medium text-3xl mb-8 group-hover:border-coral-flame group-hover:text-coral-flame group-hover:bg-coral-flame/5 transition-all duration-500 shadow-sm">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 className="text-2xl text-brandwood font-display tracking-tight font-bold mb-2">{member.name}</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-mint-action mb-6">{member.role}</p>
                <p className="text-text-muted text-sm font-sans leading-relaxed mb-6">
                  {member.bio}
                </p>
                <a 
                  href="mailto:learnarthneeti@gmail.com"
                  className="text-[10px] font-bold uppercase tracking-widest text-brandwood/50 hover:text-coral-flame transition-colors mt-auto"
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
            className="fixed inset-0 z-[100] bg-brandwood/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedVideoEmbed(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-blush-mist rounded-3xl overflow-hidden max-w-3xl w-full shadow-warm-float relative"
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
              <div className="p-4 flex justify-between items-center bg-sunset-fade border-t border-blush-mist">
                <span className="text-[10px] text-text-muted font-sans font-bold uppercase tracking-wider">Arthneeti Academy Resource System</span>
                <button
                  onClick={() => setSelectedVideoEmbed(null)}
                  className="bg-coral-flame text-white px-5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-coral-flame/90 transition-all cursor-pointer shadow-sm"
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
