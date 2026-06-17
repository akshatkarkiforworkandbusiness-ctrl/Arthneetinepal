import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Lesson {
  id: string;
  title: string;
  desc: string;
  duration: string;
  tag: string;
  videoUrl: string;
  thumbnail: string;
  chapters: string[];
}

interface Guide {
  id: string;
  title: string;
  category: string;
  language: string;
  readingTime: string;
  description: string;
  htmlUrl: string;
  pdfUrl: string;
  chapters: string[];
}

// ─── Data ────────────────────────────────────────────────────────────────────

const LESSONS: Lesson[] = [
  {
    id: 'nepse-basics',
    title: 'NEPSE Share Market Guide for Beginners',
    desc: 'Step-by-step guidance on DEMAT accounts, Meroshare, IPO application criteria, and brokerage setup for Nepali investors.',
    duration: '25:12',
    tag: 'Stock Market',
    videoUrl: 'https://www.youtube.com/embed/Wv-L63uD4m8',
    thumbnail: 'https://img.youtube.com/vi/Wv-L63uD4m8/hqdefault.jpg',
    chapters: [
      'What is NEPSE and who regulates it (SEBON)',
      'Opening a DEMAT account and Meroshare registration',
      'How to apply for IPOs using ASBA',
      'Secondary market trading via licensed brokers',
      'Reading the NEPSE index and understanding market cap',
    ],
  },
  {
    id: 'nrb-monetary-policy',
    title: 'Nepal Rastra Bank Monetary Policy & NEPSE Impact',
    desc: 'Deep-dive into bank interest rates, liquidity constraints, credit-to-deposit ratios, and how NRB policy decisions move the NEPSE index.',
    duration: '19:40',
    tag: 'Policy & Economics',
    videoUrl: 'https://www.youtube.com/embed/vOenP8oQ_oI',
    thumbnail: 'https://img.youtube.com/vi/vOenP8oQ_oI/hqdefault.jpg',
    chapters: [
      'What is monetary policy and why it matters for investors',
      'Cash Reserve Ratio (CRR) and Statutory Liquidity Ratio (SLR)',
      'How bank rate adjustments affect loan availability',
      'Credit-to-Deposit (CD) ratio and market liquidity',
      'Reading the NRB monetary policy report',
    ],
  },
  {
    id: 'technical-analysis',
    title: 'Stock Selection & Technical Analysis for Beginners',
    desc: 'Learn to read candlestick charts, identify support and resistance levels, and use moving averages to find stock entry points on NEPSE.',
    duration: '18:02',
    tag: 'Technical Analysis',
    videoUrl: 'https://www.youtube.com/embed/q6g4V52u1O8',
    thumbnail: 'https://img.youtube.com/vi/q6g4V52u1O8/hqdefault.jpg',
    chapters: [
      'Candlestick basics: bullish vs bearish patterns',
      'Support, resistance, and trend lines',
      'Simple Moving Averages (SMA) and EMA crossovers',
      'RSI: identifying overbought and oversold conditions',
      'Building a basic NEPSE watchlist strategy',
    ],
  },
];

const GUIDES: Guide[] = [
  {
    id: 'nepse-guide',
    title: 'Stock Market Investing in Practice',
    category: 'Syllabus Guide',
    language: 'English',
    readingTime: '2 hrs',
    description: 'A ground-up practical guide to investing in NEPSE. Uses real Nepali companies and local market mechanics. Built for students with no prior finance background.',
    htmlUrl: '/nepse-investing-guide.html',
    pdfUrl: '/nepse-investing-guide.pdf',
    chapters: [
      'Introduction to NEPSE & Market Infrastructure',
      'Shares, IPOs & Secondary Market Trading',
      'Stock Charts & Technical Analysis',
      'Fundamental Stock Valuation',
      'Portfolio Allocation & Risk Management',
      'Paper Trading Protocol & Watchlist Strategy',
    ],
  },
  {
    id: 'financial-literacy',
    title: 'Financial Literacy — Nepal (NRB Syllabus)',
    category: 'National Curriculum',
    language: 'Nepali / English',
    readingTime: '1.5 hrs',
    description: 'Official financial literacy curriculum aligned with Nepal Rastra Bank guidelines. Covers household budgeting, banking, loans, and digital payment safety.',
    htmlUrl: '/nepal_financial_literacy_curriculum.html',
    pdfUrl: '/nepal_financial_literacy_curriculum.pdf',
    chapters: [
      'Money, Budgeting & Financial Goal Planning',
      'Financial Institutions & Banking Services in Nepal',
      'Bank Deposits, Interest Rates & Inflation',
      'Loan Types, Debt Management & Credit Basics',
      'Digital Banking & Fraud Prevention',
      'Central Banking Role & NRB Regulations',
    ],
  },
  {
    id: 'economics-guidebook',
    title: 'Arthneeti — Economic Research Guidebook',
    category: 'Research Guidebook',
    language: 'English',
    readingTime: '3 hrs',
    description: 'Advanced economics guidebook for students conducting economic research. Covers macroeconomic indicators, national accounts, and monetary policy analytics.',
    htmlUrl: '/arthneeti-economics-guidebook.html',
    pdfUrl: '/arthneeti-economics-guidebook.pdf',
    chapters: [
      'Macroeconomics Core: GDP, Inflation & Monetary Systems',
      'Microeconomic Concepts: Supply, Demand & Consumer Choice',
      'Central Banking Mechanics: CRR & SLR Policy',
      'International Trade, Remittances & Balance of Payments',
      'Designing Surveys & Field Research Methods',
      'Drafting Policy Reports & Economic Papers',
    ],
  },
];

const TAG_COLORS: Record<string, string> = {
  'Stock Market':       'bg-royal/10 text-royal border-royal/20',
  'Policy & Economics': 'bg-crimson/10 text-crimson border-crimson/20',
  'Technical Analysis': 'bg-green-light/10 text-green-light border-green-light/20',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function LearnPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'videos' | 'guides'>('videos');
  const [activeLesson, setActiveLesson] = useState<Lesson>(LESSONS[0]);
  const [isPlaying, setIsPlaying]       = useState(false);
  const [completed, setCompleted]       = useState<Set<string>>(new Set());
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);
  const [searchQuery, setSearchQuery]   = useState('');
  const playerRef = useRef<HTMLDivElement>(null);

  // ── Load completed lessons from Firestore ──────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const snap = await getDoc(doc(db, 'users', user.uid, 'progress', 'lessons'));
      if (snap.exists()) {
        setCompleted(new Set(snap.data().completed || []));
      }
    };
    fetch();
  }, [user]);

  // ── Mark lesson complete ───────────────────────────────────────────────────
  const markComplete = async (lessonId: string) => {
    const next = new Set(completed);
    if (next.has(lessonId)) {
      next.delete(lessonId);
    } else {
      next.add(lessonId);
    }
    setCompleted(next);
    if (user) {
      await setDoc(
        doc(db, 'users', user.uid, 'progress', 'lessons'),
        { completed: Array.from(next), updatedAt: serverTimestamp() },
        { merge: true }
      );
    }
  };

  // ── Play a lesson ──────────────────────────────────────────────────────────
  const playLesson = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setIsPlaying(true);
    setTimeout(() => {
      playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const filteredLessons = LESSONS.filter(l =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGuides = GUIDES.filter(g =>
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const progress = LESSONS.length > 0
    ? Math.round((completed.size / LESSONS.length) * 100)
    : 0;

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#0B0F19]"
    >
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 pt-28 pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <span className="text-[10px] font-black text-crimson mb-3 block uppercase tracking-[0.4em]">
              ARTHNEETI ACADEMY
            </span>
            <h1 className="font-display text-5xl md:text-7xl text-white italic mb-4 tracking-tight">
              Learn
            </h1>
            <p className="text-text-muted text-sm max-w-lg leading-relaxed">
              Video lessons, written guides, and research resources — all built around Nepal's economy, NEPSE, and NRB policy.
            </p>
          </div>

          {/* Progress pill — only for logged-in users */}
          {user && (
            <div className="bg-[#161F30] border border-[#1F2A3F] rounded-2xl px-6 py-5 min-w-[200px]">
              <span className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-3">
                Your Progress
              </span>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-3xl font-black font-mono text-white">{progress}%</span>
                <span className="text-[10px] text-text-muted mb-1">
                  {completed.size}/{LESSONS.length} lessons
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#0B0F19] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-royal rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Tabs + Search ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          <div className="flex bg-[#161F30] border border-[#1F2A3F] rounded-xl p-1 self-start">
            {(['videos', 'guides'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSearchQuery(''); }}
                className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-royal text-white shadow-md'
                    : 'text-text-muted hover:text-white'
                }`}
              >
                {tab === 'videos' ? 'Video Lessons' : 'Written Guides'}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-md">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder={activeTab === 'videos' ? 'Search lessons...' : 'Search guides...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#161F30] border border-[#1F2A3F] rounded-xl pl-10 pr-4 py-3 text-sm focus:border-royal outline-none text-white placeholder:text-text-muted/50 transition-all"
            />
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        <AnimatePresence mode="wait">

          {/* ════════════════════════════════════════════════════════════════════
              VIDEO LESSONS TAB
          ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'videos' && (
            <motion.div
              key="videos"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {/* ── Video Player ────────────────────────────────────────────── */}
              <div ref={playerRef} className="mb-10">
                <div className="bg-[#161F30] border border-[#1F2A3F] rounded-3xl overflow-hidden">
                  {/* Player area */}
                  <div className="relative aspect-video bg-[#0B0F19]">
                    {isPlaying ? (
                      <iframe
                        key={activeLesson.videoUrl}
                        src={`${activeLesson.videoUrl}?autoplay=1&rel=0&modestbranding=1`}
                        title={activeLesson.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center group cursor-pointer" onClick={() => setIsPlaying(true)}>
                        <img
                          src={activeLesson.thumbnail}
                          alt={activeLesson.title}
                          className="absolute inset-0 w-full h-full object-cover opacity-60"
                        />
                        <div className="relative z-10 w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-royal/80 transition-all duration-300">
                          <span className="material-symbols-outlined text-white text-4xl ml-1">play_arrow</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Player footer */}
                  <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${TAG_COLORS[activeLesson.tag] || 'bg-royal/10 text-royal border-royal/20'} inline-block mb-2`}>
                        {activeLesson.tag}
                      </span>
                      <h2 className="font-display text-xl md:text-2xl text-white italic leading-tight">
                        {activeLesson.title}
                      </h2>
                      <p className="text-text-muted text-xs mt-1">{activeLesson.duration}</p>
                    </div>
                    <button
                      onClick={() => markComplete(activeLesson.id)}
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 cursor-pointer ${
                        completed.has(activeLesson.id)
                          ? 'bg-green-light/10 border border-green-light/30 text-green-light'
                          : 'bg-[#0B0F19] border border-[#1F2A3F] text-text-muted hover:border-green-light hover:text-green-light'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {completed.has(activeLesson.id) ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      {completed.has(activeLesson.id) ? 'Completed' : 'Mark Complete'}
                    </button>
                  </div>
                </div>

                {/* Chapters for active lesson */}
                {activeLesson.chapters.length > 0 && (
                  <div className="mt-4 bg-[#161F30] border border-[#1F2A3F] rounded-2xl p-6">
                    <span className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-4">
                      What's covered
                    </span>
                    <ul className="space-y-2.5">
                      {activeLesson.chapters.map((ch, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-text-muted">
                          <span className="text-[10px] font-black font-mono text-royal mt-0.5 shrink-0">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          {ch}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* ── Lesson cards ────────────────────────────────────────────── */}
              <div className="mb-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">
                  All Lessons — {filteredLessons.length} available
                </span>
              </div>

              {filteredLessons.length === 0 ? (
                <div className="text-center py-16 bg-[#161F30] rounded-2xl border border-dashed border-[#1F2A3F]">
                  <p className="text-text-muted text-sm italic">No lessons match "{searchQuery}"</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {filteredLessons.map((lesson, i) => {
                    const isActive = activeLesson.id === lesson.id;
                    const isDone   = completed.has(lesson.id);
                    return (
                      <motion.div
                        key={lesson.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        onClick={() => playLesson(lesson)}
                        className={`group cursor-pointer bg-[#161F30] border rounded-2xl overflow-hidden transition-all duration-300 ${
                          isActive
                            ? 'border-royal shadow-lg shadow-royal/10'
                            : 'border-[#1F2A3F] hover:border-royal/40'
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="relative aspect-video overflow-hidden bg-[#0B0F19]">
                          <img
                            src={lesson.thumbnail}
                            alt={lesson.title}
                            className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
                          />
                          {/* Play overlay */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-royal/80 transition-all">
                              <span className="material-symbols-outlined text-white text-xl ml-0.5">play_arrow</span>
                            </div>
                          </div>
                          {/* Duration badge */}
                          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded">
                            {lesson.duration}
                          </span>
                          {/* Completed badge */}
                          {isDone && (
                            <span className="absolute top-2 left-2 bg-green-light text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded flex items-center gap-1">
                              <span className="material-symbols-outlined text-[10px]">check</span>
                              Done
                            </span>
                          )}
                          {/* Active indicator */}
                          {isActive && (
                            <span className="absolute top-2 right-2 bg-royal text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded">
                              Playing
                            </span>
                          )}
                        </div>

                        {/* Card body */}
                        <div className="p-4">
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border inline-block mb-2 ${TAG_COLORS[lesson.tag] || 'bg-royal/10 text-royal border-royal/20'}`}>
                            {lesson.tag}
                          </span>
                          <h3 className="text-sm font-bold text-white leading-snug group-hover:text-royal transition-colors">
                            {lesson.title}
                          </h3>
                          <p className="text-[11px] text-text-muted mt-1.5 leading-relaxed line-clamp-2">
                            {lesson.desc}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Login nudge for non-logged-in users */}
              {!user && (
                <div className="mt-8 bg-[#161F30] border border-[#1F2A3F] rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <span className="material-symbols-outlined text-royal text-3xl shrink-0">account_circle</span>
                  <div>
                    <p className="text-white text-sm font-bold mb-0.5">Track your learning progress</p>
                    <p className="text-text-muted text-xs">Create a free account to mark lessons complete and track what you've covered.</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              WRITTEN GUIDES TAB
          ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'guides' && (
            <motion.div
              key="guides"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {filteredGuides.length === 0 ? (
                <div className="col-span-full text-center py-16 bg-[#161F30] rounded-2xl border border-dashed border-[#1F2A3F]">
                  <p className="text-text-muted text-sm italic">No guides match "{searchQuery}"</p>
                </div>
              ) : (
                filteredGuides.map((guide, i) => {
                  const isOpen = expandedGuide === guide.id;
                  return (
                    <motion.div
                      key={guide.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="bg-[#161F30] border border-[#1F2A3F] rounded-3xl p-8 flex flex-col justify-between hover:border-royal/40 transition-all duration-300 group"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex justify-between items-start mb-6">
                          <span className="bg-royal/10 text-royal text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-royal/20">
                            {guide.category}
                          </span>
                          <span className="text-[9px] font-mono text-text-muted bg-[#0B0F19] px-2.5 py-1 rounded border border-[#1F2A3F]">
                            {guide.readingTime}
                          </span>
                        </div>

                        <h3 className="font-display text-xl text-white italic leading-tight mb-3 group-hover:text-royal transition-colors">
                          {guide.title}
                        </h3>

                        <p className="text-xs text-text-muted leading-relaxed mb-5">
                          {guide.description}
                        </p>

                        <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider border-t border-[#1F2A3F] pt-4 mb-5">
                          Lang: <span className="text-white">{guide.language}</span>
                        </div>

                        {/* Collapsible chapters */}
                        <div className="mb-6">
                          <button
                            onClick={() => setExpandedGuide(isOpen ? null : guide.id)}
                            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-text-muted hover:text-white transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">
                              {isOpen ? 'expand_less' : 'expand_more'}
                            </span>
                            {isOpen ? 'Hide chapters' : 'View chapters'}
                          </button>

                          <AnimatePresence>
                            {isOpen && (
                              <motion.ul
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 space-y-2.5 pl-3 border-l border-royal/30 overflow-hidden"
                              >
                                {guide.chapters.map((ch, ci) => (
                                  <li key={ci} className="flex items-start gap-2 text-xs text-text-muted">
                                    <span className="text-[9px] font-black font-mono text-royal shrink-0 mt-0.5">
                                      {String(ci + 1).padStart(2, '0')}
                                    </span>
                                    {ch}
                                  </li>
                                ))}
                              </motion.ul>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-3 mt-auto">
                        <a
                          href={guide.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-3.5 bg-royal hover:bg-white hover:text-royal text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                          <span className="material-symbols-outlined text-sm">menu_book</span>
                          Read Online
                        </a>
                        <a
                          href={guide.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-3.5 bg-[#0B0F19] hover:bg-[#0B0F19]/50 border border-[#1F2A3F] hover:border-royal text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm">download</span>
                          Download PDF
                        </a>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.main>
  );
}
