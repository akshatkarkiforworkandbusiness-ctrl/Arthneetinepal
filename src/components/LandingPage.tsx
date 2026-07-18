import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import PlaybookHero from './PlaybookHero';
import CinematicIntro from './CinematicIntro';
import CurriculumRoadmap from './CurriculumRoadmap';
import SessionPhotos from './SessionPhotos';
import { LESSONS } from './LearnPage';
import { FAQ_DATA, FAQ_CATEGORIES } from '../data/faqData';
import { ArrowRight, ArrowUp, ArrowDown, Play, Download, Heart, ChevronDown, Users, PlayCircle, FileText, HelpCircle, Star, Shield } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

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

export default function LandingPage() {
  const { user, handleJoinAction } = useAuth();
  const [latestTopics, setLatestTopics] = useState<Topic[]>([]);
  const reduce = useReducedMotion();

  const [marketIndices, setMarketIndices] = useState<Record<string, IndexState>>(initialIndices);
  const [activeResourceTab, setActiveResourceTab] = useState<'videos' | 'pamphlets' | 'faq'>('videos');
  const [selectedVideoEmbed, setSelectedVideoEmbed] = useState<string | null>(null);
  const [faqLanguage, setFaqLanguage] = useState<'en' | 'np'>('en');
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);
  const [faqCategory, setFaqCategory] = useState<string>('all');

  // GSAP ScrollTrigger refs
  const tickerRef = useRef<HTMLDivElement>(null);
  const resourcesRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  // GSAP ScrollTrigger animations
  useEffect(() => {
    if (reduce) return;

    const ctx = gsap.context(() => {
      // Market ticker parallax on scroll
      if (tickerRef.current) {
        gsap.fromTo(tickerRef.current,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: tickerRef.current,
              start: 'top 85%',
              end: 'top 60%',
              toggleActions: 'play none none reverse',
            }
          }
        );
      }

      // Resources section reveal
      if (resourcesRef.current) {
        gsap.fromTo(resourcesRef.current,
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: resourcesRef.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            }
          }
        );
      }

      // CTA section reveal
      if (ctaRef.current) {
        gsap.fromTo(ctaRef.current,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: ctaRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            }
          }
        );
      }
    });

    return () => ctx.revert();
  }, [reduce]);

  // Cinematic Intro State
  const [showIntro, setShowIntro] = useState(() => {
    const hasSeenIntro = localStorage.getItem('arthneeti-intro-seen');
    return !hasSeenIntro;
  });

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
    localStorage.setItem('arthneeti-intro-seen', 'true');
  }, []);

  useEffect(() => {
    const qLatest = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(6));
    const unsubscribeLatest = onSnapshot(qLatest, (snapshot) => {
      const topics = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Topic[];
      setLatestTopics(topics);
    }, (error) => {
      console.warn('Failed to fetch latest topics:', error);
    });

    return () => unsubscribeLatest();
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

  // Filter FAQs by category
  const filteredFAQs = faqCategory === 'all' 
    ? FAQ_DATA 
    : FAQ_DATA.filter(faq => faq.category === faqCategory);

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col bg-white"
    >
      {/* Cinematic Intro */}
      {showIntro && <CinematicIntro onComplete={handleIntroComplete} />}

      {/* Hero Section */}
      <PlaybookHero />

      {/* Session Photos Section (Improved) */}
      <SessionPhotos />

      {/* Curriculum Roadmap Section (Visual) */}
      <CurriculumRoadmap />

      {/* Market Ticker Sparkline Section */}
      <section ref={tickerRef} className="bg-surface py-16 px-6 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-text-primary">NEPSE Market Indices</span>
              {marketDataSource === 'live' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-club-green text-[10px] font-bold uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-club-green animate-pulse inline-block" />
                  Live Data
                </span>
              )}
              {marketDataSource === 'simulated' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                  Simulated
                </span>
              )}
            </div>
            <p className="text-[11px] text-text-muted max-w-xs sm:text-right">
              {marketDataSource === 'live'
                ? `Data via NepseAPI. For educational use.${lastUpdated ? ` Updated ${lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : ''}`
                : 'Showing simulated values for demonstration.'}
            </p>
          </div>

          {/* Index Cards with Live Pulse Animation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.keys(marketIndices).map((key) => {
              const item = marketIndices[key];
              const isGain = item.change >= 0;
              const accentColor = isGain ? '#00875a' : '#ef4444';
              const sign = isGain ? '+' : '';
              
              return (
                <motion.div 
                  key={key} 
                  whileHover={{ y: -3, scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white p-6 rounded-3xl flex justify-between items-center border border-border shadow-card hover:border-club-green/30 transition-all"
                >
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1">{item.name}</span>
                    <AnimatePresence mode="wait">
                      <motion.h4 
                        key={item.value}
                        initial={{ opacity: 0.6, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0.6 }}
                        transition={{ duration: 0.2 }}
                        className="text-3xl font-bold font-display text-text-primary tracking-tight"
                      >
                        {item.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </motion.h4>
                    </AnimatePresence>
                    <span 
                      className="text-xs font-bold font-sans inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md"
                      style={{ 
                        color: accentColor,
                        backgroundColor: isGain ? '#EFF5F2' : '#FEF2F2'
                      }}
                    >
                      {isGain ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                      <span>{sign}{item.changePercent}%</span>
                    </span>
                  </div>
                  
                  {/* Sparkline Graphic */}
                  <div className="w-[110px] h-[44px] flex items-center">
                    <svg className="w-full h-full overflow-visible">
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
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3 Product Pillars Feature Showcase Section */}
      <section className="py-24 px-6 bg-surface-muted border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-club-green uppercase tracking-[0.3em] block mb-2">Platform Pillars</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-text-primary tracking-tight mb-4">
              Everything You Need for Financial Intelligence
            </h2>
            <p className="text-text-muted text-base md:text-lg">
              Explore our core products designed to guide Nepali youth from beginner concepts to market mastery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: Discover */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-white p-8 rounded-3xl border border-border shadow-card hover:shadow-elevated transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-club-green mb-6 group-hover:scale-110 transition-transform">
                  <LineChart size={28} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-club-green bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">Pillar 01</span>
                <h3 className="text-2xl font-bold font-display text-text-primary mt-3 mb-3">Discover Markets</h3>
                <p className="text-text-muted text-sm leading-relaxed mb-6">
                  Access real-time NEPSE indices, company fundamentals, financial pamphlets, and market signals customized for Nepal's economic landscape.
                </p>
              </div>

              <div className="bg-surface-muted p-4 rounded-2xl border border-border mb-6">
                <div className="flex justify-between text-xs font-bold text-text-primary mb-2">
                  <span>NEPSE Index</span>
                  <span className="text-club-green">+1.75%</span>
                </div>
                <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: "30%" }}
                    whileInView={{ width: "78%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="bg-club-green h-full rounded-full"
                  />
                </div>
              </div>

              <Link 
                to="/discover" 
                className="w-full py-3 px-5 rounded-xl bg-surface-muted hover:bg-club-green hover:text-white text-text-primary font-bold text-sm transition-all text-center flex items-center justify-center gap-2 group-hover:bg-club-green group-hover:text-white"
              >
                <span>Explore Discover</span>
                <ArrowRight size={16} />
              </Link>
            </motion.div>

            {/* Card 2: Community */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -4 }}
              className="bg-white p-8 rounded-3xl border border-border shadow-card hover:shadow-elevated transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                  <Users size={28} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">Pillar 02</span>
                <h3 className="text-2xl font-bold font-display text-text-primary mt-3 mb-3">Verified Community</h3>
                <p className="text-text-muted text-sm leading-relaxed mb-6">
                  Engage in constructive economic debates, post research threads, verify market rumors, and interact with fellow student investors.
                </p>
              </div>

              <div className="bg-surface-muted p-4 rounded-2xl border border-border mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-club-green text-white text-[10px] font-bold flex items-center justify-center">AK</div>
                  <span className="text-xs font-bold text-text-primary">Akshat Karki</span>
                </div>
                <p className="text-[11px] text-text-muted line-clamp-1 italic">"Evaluating Hydropower quarter 3 earnings..."</p>
              </div>

              <Link 
                to="/community" 
                className="w-full py-3 px-5 rounded-xl bg-surface-muted hover:bg-blue-600 hover:text-white text-text-primary font-bold text-sm transition-all text-center flex items-center justify-center gap-2 group-hover:bg-blue-600 group-hover:text-white"
              >
                <span>Join Discussion</span>
                <ArrowRight size={16} />
              </Link>
            </motion.div>

            {/* Card 3: Learn */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -4 }}
              className="bg-white p-8 rounded-3xl border border-border shadow-card hover:shadow-elevated transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
                  <FileText size={28} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">Pillar 03</span>
                <h3 className="text-2xl font-bold font-display text-text-primary mt-3 mb-3">Structured Learning</h3>
                <p className="text-text-muted text-sm leading-relaxed mb-6">
                  Master financial literacy through structured video modules, bilingual quizzes, earn verifiable digital certificates, and prepare for our upcoming trading league.
                </p>
              </div>

              <div className="bg-surface-muted p-4 rounded-2xl border border-border mb-6">
                <div className="flex justify-between text-xs font-bold text-text-primary mb-1">
                  <span>Module Progress</span>
                  <span className="text-purple-600">80% Completed</span>
                </div>
                <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: "0%" }}
                    whileInView={{ width: "80%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="bg-purple-600 h-full rounded-full"
                  />
                </div>
              </div>

              <Link 
                to="/learn" 
                className="w-full py-3 px-5 rounded-xl bg-surface-muted hover:bg-purple-600 hover:text-white text-text-primary font-bold text-sm transition-all text-center flex items-center justify-center gap-2 group-hover:bg-purple-600 group-hover:text-white"
              >
                <span>Start Curriculum</span>
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Mission & Equity Support Section */}
      <section className="bg-slate-900 py-28 px-6 overflow-hidden relative">
        {/* Full background Image */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <img src="/Pitcures for Arthneeti/Image 2 — SOS Disability Center.jpg" alt="Arthneeti for Children - SOS" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-900/40" />
        </div>

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20 relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:w-1/2 border-l-4 border-emerald-500 pl-10"
          >
            <h2 className="text-4xl md:text-5xl text-white leading-[1.1] font-display tracking-[0.02em] font-medium mb-6">
              "We don't just teach finance — we use it to build a more equitable Nepal."
            </h2>
            <p className="text-white/70 text-lg leading-relaxed max-w-lg font-sans">
              Arthneeti allocates workshop support and targeted curricula specifically for disadvantaged youths, disabled students, and underprivileged municipal schools to narrow the financial intelligence gap.
            </p>
          </motion.div>
          
          <div className="lg:w-1/2 grid grid-cols-2 gap-6">
            {[
              { name: 'Women & Girls', nameNp: 'महिला र बालिका', icon: <Heart size={24} />, delay: 0 },
              { name: "Children's Welfare", nameNp: 'बाल कल्याण', icon: <Star size={24} />, delay: 0.1 },
              { name: 'Disability Inclusion', nameNp: 'अपाङ्गता समावेशीकरण', icon: <Shield size={24} />, delay: 0.2 },
              { name: 'Underprivileged', nameNp: 'विपन्न', icon: <Users size={24} />, delay: 0.3 }
            ].map((item, i) => (
              <motion.div 
                key={item.name} 
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: item.delay, type: 'spring', stiffness: 100 }}
                className="flex flex-col items-center text-center p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl hover:border-emerald-500/50 hover:bg-white/10 transition-all duration-300 shadow-xl group"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-white mb-3 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <span className="text-sm font-bold text-white/90">{item.name}</span>
                <span className="text-xs text-white/50 mt-1 font-nepali">
                  {item.nameNp}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Resource Library Section */}
      <section ref={resourcesRef} className="py-24 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[10px] font-bold text-emerald-600 mb-2 block uppercase tracking-[0.4em]">Resources</span>
            <h2 className="text-4xl md:text-5xl text-slate-900 font-display tracking-[0.02em] leading-[1.0] font-medium mb-4">Financial Resource Library</h2>
            <p className="text-slate-600 text-lg leading-relaxed font-sans">
              Explore video lessons, downloadable guides, and bilingual FAQs.
            </p>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex justify-center border-b border-slate-200 pb-4 mb-10 gap-3">
            {[
              { key: 'videos', label: 'Video Lessons', icon: <PlayCircle size={20} /> },
              { key: 'pamphlets', label: 'Guides & PDFs', icon: <FileText size={20} /> },
              { key: 'faq', label: 'Bilingual FAQs', icon: <HelpCircle size={20} /> }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveResourceTab(tab.key as any);
                  setActiveFaqIndex(null);
                }}
                className={`px-6 py-3 text-sm font-bold uppercase tracking-wider rounded-full transition-all flex items-center gap-2 ${
                  activeResourceTab === tab.key 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white border border-slate-200'
                }`}
              >
                {tab.icon}
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
                      className="bg-white border border-slate-200 rounded-3xl overflow-hidden group shadow-sm hover:shadow-lg transition-shadow flex flex-col justify-between"
                    >
                      <div className="relative aspect-video overflow-hidden bg-slate-100">
                        <img 
                          src={video.thumbnail} 
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                        />
                        <button 
                          onClick={() => setSelectedVideoEmbed(video.videoUrl)}
                          className="absolute inset-0 m-auto w-14 h-14 bg-white/90 text-emerald-600 border-2 border-emerald-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Play size={30} />
                        </button>
                        <span className="absolute bottom-3 right-3 bg-white text-slate-900 text-[10px] font-bold font-mono px-3 py-1 rounded-xl shadow-sm">
                          {video.duration}
                        </span>
                      </div>
                      
                      <div className="p-6">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-xl border border-slate-200 text-slate-600 bg-slate-50">
                            {video.level}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors mb-2 leading-snug line-clamp-2 font-display">
                          {video.title}
                        </h4>
                        <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 font-sans">
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
                      className="bg-white border border-slate-200 p-6 rounded-3xl flex flex-col justify-between shadow-sm hover:shadow-lg transition-shadow"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-xl border border-slate-200">
                            {pamphlet.category}
                          </span>
                          <span className="text-[10px] font-bold font-mono text-slate-400">{pamphlet.size}</span>
                        </div>
                        
                        <h4 className="text-lg font-bold text-slate-900 mb-2 leading-snug font-display">
                          {pamphlet.title}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-6 block">
                          Language: {pamphlet.language}
                        </p>
                      </div>

                      <a 
                        href={pamphlet.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-3 bg-slate-50 hover:bg-emerald-600 hover:text-white border border-slate-200 hover:border-emerald-600 text-slate-700 text-[10px] font-bold uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Download size={16} />
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
                  className="max-w-4xl mx-auto"
                >
                  {/* Category Filter */}
                  <div className="flex flex-wrap justify-center gap-2 mb-8">
                    <button
                      onClick={() => { setFaqCategory('all'); setActiveFaqIndex(null); }}
                      className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all ${
                        faqCategory === 'all' 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-white text-slate-500 border border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      All Questions
                    </button>
                    {Object.entries(FAQ_CATEGORIES).map(([key, value]) => (
                      <button
                        key={key}
                        onClick={() => { setFaqCategory(key); setActiveFaqIndex(null); }}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all ${
                          faqCategory === key 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-white text-slate-500 border border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        {value.label}
                      </button>
                    ))}
                  </div>

                  {/* Language Toggle */}
                  <div className="flex justify-center mb-6">
                    <div className="flex gap-1.5 bg-slate-100 border border-slate-200 p-1 rounded-full">
                      <button
                        onClick={() => { setFaqLanguage('en'); setActiveFaqIndex(null); }}
                        className={`px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all ${
                          faqLanguage === 'en' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        English
                      </button>
                      <button
                        onClick={() => { setFaqLanguage('np'); setActiveFaqIndex(null); }}
                        className={`px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all ${
                          faqLanguage === 'np' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        नेपाली
                      </button>
                    </div>
                  </div>

                  {/* FAQ Accordion */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
                    <div className="space-y-3">
                      {filteredFAQs.map((faq, idx) => {
                        const isOpen = activeFaqIndex === idx;
                        return (
                          <div 
                            key={faq.id}
                            className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
                          >
                            <button
                              onClick={() => setActiveFaqIndex(isOpen ? null : idx)}
                              className={`w-full flex justify-between items-center p-5 transition-colors text-left ${
                                isOpen ? 'bg-slate-50' : 'bg-white hover:bg-slate-50'
                              }`}
                            >
                              <div>
                                <p className="text-sm font-bold text-slate-900">
                                  {faqLanguage === 'en' ? faq.question : faq.questionNepali}
                                </p>
                                {faqLanguage === 'en' && (
                                  <p className="text-xs text-slate-400 mt-1 font-nepali">
                                    {faq.questionNepali}
                                  </p>
                                )}
                                {faqLanguage === 'np' && (
                                  <p className="text-xs text-slate-400 mt-1">
                                    {faq.question}
                                  </p>
                                )}
                              </div>
                              <ChevronDown size={24} className={`text-emerald-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                            </button>
                            
                            <AnimatePresence initial={false}>
                              {isOpen && (
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: 'auto' }}
                                  exit={{ height: 0 }}
                                  className="overflow-hidden bg-white border-t border-slate-100"
                                >
                                  <div className="p-5">
                                    <p className="text-sm text-slate-600 leading-relaxed font-sans mb-3">
                                      {faqLanguage === 'en' ? faq.answer : faq.answerNepali}
                                    </p>
                                    {faqLanguage === 'en' && (
                                      <p className="text-xs text-slate-400 leading-relaxed font-nepali">
                                        {faq.answerNepali}
                                      </p>
                                    )}
                                    {faqLanguage === 'np' && (
                                      <p className="text-xs text-slate-400 leading-relaxed">
                                        {faq.answer}
                                      </p>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
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
              <span className="text-[10px] font-bold text-emerald-600 mb-2 block uppercase tracking-[0.4em]">Community</span>
              <h2 className="text-4xl md:text-5xl text-slate-900 font-display tracking-[0.02em] leading-[1.0] font-medium">Latest Discussion Topics</h2>
            </div>
            <Link 
              to="/community" 
              className="bg-white text-emerald-600 border-2 border-emerald-600 rounded-2xl px-6 py-3 font-sans font-bold hover:bg-emerald-600 hover:text-white transition-all duration-300"
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
                className="group p-8 rounded-3xl bg-slate-50 border border-slate-200 hover:border-emerald-300 hover:bg-white transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <div className="flex justify-between items-start mb-6">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest rounded-xl border border-emerald-200">
                    {topic.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Heart size={16} />
                    <span className="text-[10px] font-mono">{topic.likes}</span>
                  </div>
                </div>
                <Link to="/community" className="block">
                  <h3 className="text-lg text-slate-900 font-display tracking-tight font-bold mb-4 leading-snug group-hover:text-emerald-600 transition-colors line-clamp-2">
                    {topic.title || (topic as any).content?.replace(/<[^>]*>?/gm, '').substring(0, 60) + '...'}
                  </h3>
                </Link>
                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-200">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-[10px] font-bold text-emerald-600 uppercase">
                    {topic.author[0]}
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{topic.author}</span>
                </div>
              </motion.div>
            ))}

            {latestTopics.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
                <p className="text-slate-400 italic text-sm font-sans">Connecting to community database server...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section ref={ctaRef} className="py-24 px-6 bg-emerald-600 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  width: `${100 + i * 50}px`,
                  height: `${100 + i * 50}px`,
                  top: `${20 + i * 15}%`,
                  left: `${10 + i * 20}%`,
                  opacity: 0.1
                }}
              />
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Start Your Financial Journey?
            </h2>
            <p className="text-emerald-100 text-lg mb-10 max-w-2xl mx-auto">
              Join hundreds of Nepali students who are building financial literacy and economic thinking skills.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user ? (
                <button 
                  onClick={handleJoinAction}
                  className="bg-white text-emerald-600 rounded-2xl px-8 py-4 font-sans font-bold hover:bg-emerald-50 transition-all duration-300 text-lg shadow-xl"
                >
                  Join Free Today
                </button>
              ) : (
                <Link 
                  to="/learn" 
                  className="bg-white text-emerald-600 rounded-2xl px-8 py-4 font-sans font-bold hover:bg-emerald-50 transition-all duration-300 text-lg shadow-xl text-center"
                >
                  Start Learning →
                </Link>
              )}
              <Link 
                to="/about-us" 
                className="bg-transparent text-white border-2 border-white/30 rounded-2xl px-8 py-4 font-sans font-bold hover:bg-white/10 transition-all duration-300 text-lg"
              >
                Learn About Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Video Playback Modal */}
      <AnimatePresence>
        {selectedVideoEmbed && (
          <div 
            className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedVideoEmbed(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl overflow-hidden max-w-3xl w-full shadow-2xl relative"
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
              <div className="p-4 flex justify-between items-center bg-slate-50 border-t border-slate-200">
                <span className="text-[10px] text-slate-500 font-sans font-bold uppercase tracking-wider">Arthneeti Academy Resource</span>
                <button
                  onClick={() => setSelectedVideoEmbed(null)}
                  className="bg-emerald-600 text-white px-5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all cursor-pointer shadow-sm"
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
