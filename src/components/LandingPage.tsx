import { motion, AnimatePresence } from 'motion/react';
import { Canvas } from '@react-three/fiber';
import { Float, OrbitControls, Environment, Sphere, Box, Torus, Octahedron, Icosahedron } from '@react-three/drei';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { OnboardingModal } from './layout/OnboardingModal';
import Hero3DVisuals from './Hero3DVisuals';
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
      <section className="relative overflow-hidden pt-40 pb-32 px-6 min-h-[90vh] flex flex-col justify-center items-center text-center bg-sunset-fade">
        <Hero3DVisuals />
        
        {/* Background ambient shapes (can stay as a soft glowing backdrop behind the 3D canvas) */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-coral-flame/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-mint-action/10 rounded-full blur-[120px] pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 max-w-5xl mx-auto w-full flex flex-col items-center"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="glass-card px-4 py-1.5 rounded-full text-xs font-bold text-coral-flame uppercase tracking-widest mb-8 border-coral-flame/20 inline-block"
          >
            Arthneeti
          </motion.div>
          
          <h1 className="text-6xl md:text-[100px] text-brandwood leading-[0.95] tracking-tight font-display font-medium mb-8">
            Think Big.<br />
            Invest Smart.<br />
            <span className="text-coral-flame italic">Lead Nepal.</span>
          </h1>
          <p className="text-lg md:text-2xl text-text-muted mb-12 max-w-2xl font-sans leading-relaxed">
            Building the next generation of economically literate leaders and investors across Nepal through structural economic knowledge.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center w-full sm:w-auto">
            {!user ? (
              <button 
                onClick={handleJoinAction}
                className="bg-coral-flame text-white rounded-2xl px-8 py-4 font-sans font-bold hover-scale shadow-warm-float transition-all duration-300 text-lg"
              >
                Join the Movement
              </button>
            ) : (
              <Link 
                to="/profile" 
                className="bg-coral-flame text-white rounded-2xl px-8 py-4 font-sans font-bold hover-scale shadow-warm-float transition-all duration-300 text-lg"
              >
                Go to Dashboard
                <span className="ml-2">→</span>
              </Link>
            )}
            <Link 
              to="/discover" 
              className="glass-card text-brandwood rounded-2xl px-8 py-4 font-sans font-bold hover:text-coral-flame transition-all duration-300 text-lg flex items-center justify-center gap-2"
            >
              Explore Markets
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Bento-Box Features / Past Sessions */}
      <section className="py-24 px-6 bg-white relative">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-[10px] font-black text-coral-flame mb-2 block uppercase tracking-widest">Our Impact</span>
            <h2 className="text-4xl md:text-5xl text-brandwood font-display font-medium tracking-tight">Transforming Education in Action</h2>
          </motion.div>

          <div className="prodigy-grid">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-[2rem] p-8 md:col-span-2 flex flex-col justify-between overflow-hidden relative min-h-[350px] group"
            >
              <div className="absolute inset-0 z-0">
                <img src="/Pitcures for Arthneeti/Image 5 — Problem solving session.jpg" alt="Xavier A Levels" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-brandwood/90 via-brandwood/40 to-transparent" />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-end">
                <div className="w-12 h-12 bg-coral-flame text-white rounded-2xl flex items-center justify-center mb-6 shadow-warm-float transition-transform group-hover:-translate-y-2">
                  <span className="material-symbols-outlined">school</span>
                </div>
                <h3 className="text-3xl text-white font-display font-medium mb-3">Xavier A Levels</h3>
                <p className="text-white/80 font-sans">Engaging high school students in advanced financial concepts and structural economic knowledge.</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-[2rem] p-8 flex flex-col justify-between overflow-hidden relative min-h-[350px] group"
            >
              <div className="absolute inset-0 z-0">
                <img src="/Pitcures for Arthneeti/Image 1 — Inaugural session (503020 Rule).jpg" alt="First Session" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-brandwood/90 via-brandwood/40 to-transparent" />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-end">
                <div className="w-12 h-12 bg-white text-coral-flame rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:-translate-y-2">
                  <span className="material-symbols-outlined">flag</span>
                </div>
                <h3 className="text-2xl text-white font-display font-medium mb-3">Our Genesis</h3>
                <p className="text-white/80 font-sans">Where it all started. Building the foundation of Arthneeti.</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="glass-card rounded-[2rem] p-8 flex flex-col justify-between overflow-hidden relative min-h-[350px] group"
            >
              <div className="absolute inset-0 z-0">
                <img src="/Pitcures for Arthneeti/Image 3 — St. Lawrence School.png" alt="St. Lawrence" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-brandwood/90 via-brandwood/40 to-transparent" />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-end">
                <div className="w-12 h-12 bg-mint-action text-white rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:-translate-y-2">
                  <span className="material-symbols-outlined">group</span>
                </div>
                <h3 className="text-2xl text-white font-display font-medium mb-3">St. Lawrence</h3>
                <p className="text-white/80 font-sans">Peer-to-peer learning with bright young minds.</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="glass-card rounded-[2rem] p-8 md:col-span-2 flex flex-col justify-between overflow-hidden relative min-h-[350px] group"
            >
              <div className="absolute inset-0 z-0">
                <img src="/Pitcures for Arthneeti/Image 4 — Kathmandu Valley Public School.png" alt="Xavier Public School" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-brandwood/90 via-brandwood/40 to-transparent" />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-end">
                <div className="w-12 h-12 bg-white text-coral-flame rounded-2xl flex items-center justify-center mb-6 shadow-sm transition-transform group-hover:-translate-y-2">
                  <span className="material-symbols-outlined">menu_book</span>
                </div>
                <h3 className="text-3xl text-white font-display font-medium mb-3">Xavier Public School</h3>
                <p className="text-white/80 font-sans">Bringing interactive economic literacy directly to the classroom.</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="glass-card rounded-[2rem] p-8 md:col-span-3 flex flex-col justify-between overflow-hidden relative min-h-[350px] group"
            >
              <div className="absolute inset-0 z-0">
                <img src="/Pitcures for Arthneeti/Image 6 — Think Big. Invest Smart. Lead Nepal..jpg" alt="Second Session" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-brandwood/90 via-brandwood/40 to-transparent" />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-end">
                <div className="w-12 h-12 bg-white text-brandwood rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:-translate-y-2">
                  <span className="material-symbols-outlined">trending_up</span>
                </div>
                <h3 className="text-2xl text-white font-display font-medium mb-3">Interactive Simulations</h3>
                <p className="text-white/80 font-sans">Market simulation and practical workshops.</p>
              </div>
            </motion.div>
          </div>
        </div>
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
      <section className="py-24 px-6 bg-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-20">
          <Canvas camera={{ position: [0, 0, 10] }}>
            <Environment preset="city" />
            <Float speed={2} rotationIntensity={1} floatIntensity={2}>
              <Torus args={[3, 0.4, 16, 100]} position={[4, 2, -2]} material-color="#ef4444" material-wireframe />
            </Float>
            <Float speed={1.5} rotationIntensity={2} floatIntensity={1}>
              <Icosahedron args={[2, 1]} position={[-5, -2, -5]} material-color="#847dff" material-wireframe />
            </Float>
          </Canvas>
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8"
          >
            <div>
              <span className="text-[10px] font-black text-coral-flame mb-2 block uppercase tracking-[0.4em]">EDUCATION JOURNEY</span>
              <h2 className="text-[60px] md:text-[72px] text-brandwood leading-[0.9] tracking-[0.03em] font-display font-medium">Curriculum<br/>Roadmap</h2>
            </div>
            <p className="text-brandwood/70 max-w-sm text-base leading-relaxed font-sans">
              Explore the interactive educational path designed to empower students with structural economic knowledge and real market insights.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 flex flex-col gap-4">
              {pillarsSyllabus.map((pillar, i) => (
                <motion.button
                  key={pillar.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setActivePillarIndex(activePillarIndex === i ? null : i)}
                  className={`w-full text-left p-6 rounded-3xl border-2 transition-all duration-300 flex items-start gap-4 ${
                    activePillarIndex === i 
                      ? 'bg-white border-coral-flame shadow-warm-lift scale-[1.02]' 
                      : 'bg-sunset-fade/50 border-blush-mist hover:border-coral-flame hover:bg-sunset-fade'
                  }`}
                  style={{ borderRadius: '16px' }}
                >
                  <span className="text-2xl font-sans tracking-tight text-coral-flame/40 font-bold">{pillar.num}</span>
                  <div>
                    <h3 className="text-xl font-bold text-brandwood mb-2 font-display">{pillar.title}</h3>
                    <p className="text-sm text-text-muted leading-relaxed font-sans">{pillar.desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="lg:col-span-7 bg-white border border-blush-mist rounded-3xl p-8 flex flex-col justify-between shadow-warm-lift relative overflow-hidden">
              {/* Subtle 3D background for the active card */}
              <div className="absolute -bottom-20 -right-20 w-64 h-64 pointer-events-none opacity-30">
                 <Canvas>
                   <ambientLight intensity={1} />
                   <directionalLight position={[10, 10, 10]} intensity={2} />
                   <Float speed={3} rotationIntensity={2} floatIntensity={1}>
                     <Box args={[2, 2, 2]} rotation={[0.5, 0.5, 0]}>
                       <meshStandardMaterial color={activePillarIndex !== null ? '#ef4444' : '#847dff'} />
                     </Box>
                   </Float>
                 </Canvas>
              </div>

              <AnimatePresence mode="wait">
                {activePillarIndex !== null ? (
                  <motion.div
                    key={activePillarIndex}
                    initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                    transition={{ duration: 0.3 }}
                    className="flex-grow flex flex-col justify-between relative z-10"
                  >
                    <div>
                      <div className="flex justify-between items-center border-b border-blush-mist pb-4 mb-6">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-brandwood/70">
                          {pillarsSyllabus[activePillarIndex].title} Modules
                        </h4>
                        <span className="text-[10px] font-bold text-coral-flame uppercase tracking-widest bg-coral-flame/10 border border-coral-flame/20 px-3 py-1 rounded-xl">
                          {pillarsSyllabus[activePillarIndex].modules.length} Lessons
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {pillarsSyllabus[activePillarIndex].modules.map((mod, idx) => (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            key={idx} 
                            className="h-[240px]"
                          >
                            <div className="h-full bg-sunset-fade border border-blush-mist rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-coral-flame/50 hover:shadow-warm-float transition-all group">
                              <span className="text-[10px] font-bold text-coral-flame uppercase tracking-widest bg-white/80 w-fit px-2 py-1 rounded-lg group-hover:bg-coral-flame group-hover:text-white transition-colors">0{idx + 1}</span>
                              <h3 className="text-lg font-bold text-brandwood mt-4 line-clamp-3">{mod.title}</h3>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-blush-mist pt-6 mt-auto">
                      <span className="text-sm text-text-muted font-sans">Ready to review?</span>
                      <Link 
                        to="/learn"
                        className="outlined-cta"
                      >
                        Start Learning
                      </Link>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-text-muted italic text-sm py-20 text-center relative z-10">
                    <span className="material-symbols-outlined text-4xl text-blush-mist mb-4">touch_app</span>
                    Select a core pillar roadmap on the left to view interactive modules.
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>
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
      <section className="bg-brandwood border-y border-brandwood/20 py-28 px-6 overflow-hidden relative">
        {/* Full background SOS Image */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <img src="/Pitcures for Arthneeti/Image 2 — SOS Disability Center.jpg" alt="Arthneeti for Children - SOS" className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-r from-brandwood/95 via-brandwood/80 to-brandwood/40" />
        </div>

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20 relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:w-1/2 border-l-8 border-coral-flame pl-10"
          >
            <h2 className="text-5xl text-white leading-[1.0] font-display tracking-[0.03em] font-medium mb-6">
              "We don't just teach finance — we use it to build a more equitable Nepal."
            </h2>
            <p className="text-white/70 text-lg leading-relaxed max-w-lg font-sans">
              Arthneeti allocates workshop support and targeted curricula specifically for disadvantaged youths, disabled students, and underprivileged municipal schools to narrow the financial intelligence gap.
            </p>
          </motion.div>
          
          <div className="lg:w-1/2 grid grid-cols-2 gap-6">
            {[
              { name: 'Women & Girls', icon: 'woman', delay: 0 },
              { name: "Children's Welfare", icon: 'child_care', delay: 0.1 },
              { name: 'Disability Inclusion', icon: 'accessible', delay: 0.2 },
              { name: 'Underprivileged', icon: 'groups', delay: 0.3 }
            ].map((item, i) => (
              <motion.div 
                key={item.name} 
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: item.delay, type: 'spring', stiffness: 100 }}
                className="flex flex-col items-center text-center p-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl hover:border-coral-flame/50 hover:bg-white/10 transition-all duration-300 shadow-xl group"
              >
                <div className="w-16 h-16 rounded-2xl bg-coral-flame flex items-center justify-center text-white mb-4 shadow-[0_0_20px_rgba(247,59,32,0.3)] group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl">{item.icon}</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/90">{item.name}</span>
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
