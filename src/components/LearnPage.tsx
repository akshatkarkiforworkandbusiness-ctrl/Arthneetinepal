import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Check, BookOpen, Download, Award, Gift } from 'lucide-react';
import CertificateModal from './CertificateModal';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import LessonCommentSection from './LessonCommentSection';
import LessonQuiz from './LessonQuiz';
import { awardLessonCompletion, markLessonComplete } from '../lib/rewards';
import { LESSONS, type FAQ, type Lesson } from '../data/lessonsData';

// ─── Types ───────────────────────────────────────────────────────────────────


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

interface Module {
  id: string;
  title: string;
  description: string;
  lessonIds: string[];
  guideIds: string[];
}

const MODULES: Module[] = [
  {
    id: 'financial-literacy',
    title: 'Financial Literacy',
    description: 'Personal finance fundamentals — banking, taxes, retirement, real estate, cooperatives, gold, and digital export income.',
    lessonIds: [
      'financial-literacy-youth', 
      'digital-payments-security', 
      'banking-interest-dynamics',
      'navigating-taxes-nepal', 
      'retirement-social-security', 
      'insurance-101',
      'real-estate-nepal',
      'cooperatives-financial-safety',
      'gold-silver-investing',
      'freelance-remittance-economics'
    ],
    guideIds: ['financial-literacy'],
  },
  {
    id: 'investing-markets',
    title: 'Investing & Markets',
    description: 'How NEPSE works, fundamental & technical analysis, floor sheets, M&A swap ratios, financial news, and portfolio risk management.',
    lessonIds: [
      'demystifying-nepse', 
      'ipo-vs-secondary-market', 
      'mutual-funds-sips', 
      'nepse-fundamental-analysis', 
      'technical-analysis-intro', 
      'floorsheet-advanced-ta', 
      'mergers-acquisitions-nepse',
      'reading-financial-news-nepal',
      'portfolio-risk-management', 
      'modern-finance-intro', 
      'behavioral-finance'
    ],
    guideIds: ['nepse-guide'],
  },
  {
    id: 'economics-research',
    title: 'Economics & Research',
    description: 'Macroeconomics, monetary & fiscal policy, trade deficit, microfinance, remittance economics, and original Arthneeti research.',
    lessonIds: [
      'monetary-policy-2026', 
      'national-budget-fiscal-policy', 
      'remittance-economy', 
      'trade-deficit-hydropower', 
      'microfinance-rural-credit',
      'ssa-reality'
    ],
    guideIds: ['economics-guidebook'],
  },
];

// Flattened FAQ list — pulled from all lessons that have FAQs attached.
// New lessons with a `faqs` array automatically show up here too.
const FAQS: FAQ[] = LESSONS.flatMap(lesson => lesson.faqs || []);

export const LEVEL_COLORS: Record<string, string> = {
  'Beginner': 'bg-brand-emerald-light/10 text-brand-emerald-light border-brand-emerald-light/20',
  'Intermediate': 'bg-amber-400/10 text-amber-500 border-amber-400/20',
  'Advanced': 'bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20',
};

const TAG_COLORS: Record<string, string> = {
  'Stock Market':       'bg-brand-emerald-light/10 text-brand-emerald-light border-brand-emerald-light/20',
  'Policy & Economics': 'bg-cobalt-blue/10 text-cobalt-blue border-cobalt-blue/20',
  'Technical Analysis': 'bg-amber-400/10 text-amber-500 border-amber-400/20',
  'Financial Literacy': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  'Research':           'bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function LearnPage() {
  const { user, profile } = useAuth();
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [certificateModule, setCertificateModule] = useState<string | null>(null);
  const [certificateModuleId, setCertificateModuleId] = useState<string | null>(null);
  const [masterExamModule, setMasterExamModule] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson>(
    LESSONS.find(l => l.id === lessonId) ?? LESSONS[0]
  );
  const [isPlaying, setIsPlaying]       = useState(!!lessonId);
  const [completed, setCompleted]       = useState<Set<string>>(new Set());
  const [quizScores, setQuizScores]     = useState<Record<string, number>>({});
  const [masterExamScores, setMasterExamScores] = useState<Record<string, number>>({});
  const [badges, setBadges] = useState<Set<string>>(new Set());
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq]   = useState<number | null>(null);
  const [expandedLessonFaq, setExpandedLessonFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery]   = useState('');
  const playerRef = useRef<HTMLDivElement>(null);

  // ── Load completed lessons from Firestore ──────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const fetchProgress = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid, 'progress', 'lessons'));
        if (snap.exists()) {
          const data = snap.data();
          setCompleted(new Set(data.completed || []));
          setQuizScores(data.quizScores || {});
          setMasterExamScores(data.masterExamScores || {});
          setBadges(new Set(data.badges || []));
        }
      } catch (err) {
        console.error('Failed to load progress:', err);
      }
    };
    fetchProgress();
  }, [user]);

  const submitQuiz = async (lessonId: string, scorePercent: number) => {
    const newQuizScores = { ...quizScores, [lessonId]: scorePercent };
    setQuizScores(newQuizScores);
    
    // Check for "Quiz Whiz" badge (100% on 3 different quizzes)
    const newBadges = new Set(badges);
    if (!newBadges.has('Quiz Whiz')) {
      const perfectScores = Object.values(newQuizScores).filter(s => s === 100).length;
      if (perfectScores >= 3 || (scorePercent === 100 && perfectScores === 2)) {
        newBadges.add('Quiz Whiz');
      }
    }
    
    if (scorePercent < 60) {
      if (user) {
        await setDoc(doc(db, 'users', user.uid, 'progress', 'lessons'), { quizScores: newQuizScores, updatedAt: serverTimestamp() }, { merge: true });
      }
      return;
    }

    const next = new Set(completed);
    const isNewCompletion = !next.has(lessonId);
    next.add(lessonId);
    setCompleted(next);

    if (!newBadges.has('First Steps') && next.size >= 1) {
      newBadges.add('First Steps');
    }
    
    setBadges(newBadges);

    if (user) {
      await setDoc(
        doc(db, 'users', user.uid, 'progress', 'lessons'),
        {
          completed: Array.from(next),
          quizScores: newQuizScores,
          badges: Array.from(newBadges),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Award reward for completing a lesson (only for new completions)
      if (isNewCompletion) {
        const rewardResult = await awardLessonCompletion(user.uid, lessonId);
        if (rewardResult.success) {
          // Show reward toast
          const { toast } = await import('sonner');
          toast.success(`Earned NPR ${rewardResult.amount.toLocaleString()} for completing the quiz!`, {
            duration: 5000,
          });
        }
        
        // Mark lesson complete in portfolio for reward tracking
        await markLessonComplete(user.uid, lessonId);
      }
    }
  };

  const submitMasterExam = async (moduleId: string, scorePercent: number) => {
    const newMasterScores = { ...masterExamScores, [moduleId]: scorePercent };
    setMasterExamScores(newMasterScores);
    setMasterExamModule(null);

    if (scorePercent >= 80) {
      const newBadges = new Set(badges);
      if (moduleId === 'financial-literacy' && !newBadges.has('Financial Literacy Master')) newBadges.add('Financial Literacy Master');
      if (moduleId === 'investing-markets' && !newBadges.has('Market Maestro')) newBadges.add('Market Maestro');
      
      setBadges(newBadges);
      
      if (user) {
        await setDoc(doc(db, 'users', user.uid, 'progress', 'lessons'), {
          masterExamScores: newMasterScores,
          badges: Array.from(newBadges),
          updatedAt: serverTimestamp()
        }, { merge: true });

        // Save public certificate doc for shareable link
        const mod = MODULES.find(m => m.id === moduleId);
        const modTitle = mod ? mod.title : moduleId;
        await setDoc(doc(db, 'certificates', `${user.uid}_${moduleId}`), {
          uid: user.uid,
          name: profile?.name || user.displayName || 'Arthneeti Scholar',
          moduleId,
          moduleTitle: modTitle,
          score: scorePercent,
          completedAt: serverTimestamp(),
          topPerformer: false
        });
      }
      
      const mod = MODULES.find(m => m.id === moduleId);
      if (mod) {
        setCertificateModule(mod.title);
        setCertificateModuleId(mod.id);
      }
    }
  };

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
    setExpandedLessonFaq(null);
    navigate(`/learn/${lesson.id}`, { replace: true });
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

  const filteredFaqs = FAQS.filter(f =>
    f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const progress = LESSONS.length > 0
    ? Math.round((completed.size / LESSONS.length) * 100)
    : 0;

  return (
  <main className="py-32 px-6 min-h-screen bg-white">
    <div className="max-w-7xl mx-auto space-y-8">

      {/* Page Header */}
      <div className="mb-16">
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-emerald-light mb-4">Arthneeti Academy</p>
        <h1 className="text-5xl md:text-7xl font-display text-brandwood leading-[0.90] mb-6">
          Learn Economics.<br />Understand Nepal.
        </h1>
        <p className="text-text-muted font-sans max-w-xl">
          Structured lessons, written guides, and research — built for Nepali students who want to understand markets, policy, and money.
        </p>
      </div>

      {/* Active Lesson Player — shown when a lesson is playing */}
      {isPlaying && (
        <div ref={playerRef} className="bg-white border border-blush-mist rounded-3xl overflow-hidden mb-16 shadow-card">
          
          {/* Video */}
          <div className="aspect-video w-full">
            <iframe
              src={activeLesson.videoUrl}
              title={activeLesson.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          <div className="p-10 space-y-8">
            {/* Lesson Meta */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-[9px] font-bold uppercase tracking-widest border-transparent px-3 py-1 rounded-lg ${
                    activeLesson.level === 'Beginner' ? 'bg-brand-emerald-light/10 text-brand-emerald-light' :
                    activeLesson.level === 'Intermediate' ? 'bg-amber-400/10 text-amber-500' :
                    'bg-brand-emerald/10 text-brand-emerald'
                  }`}>
                    {activeLesson.level}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted">{activeLesson.duration}</span>
                </div>
                <h2 className="text-3xl font-display text-brandwood">{activeLesson.title}</h2>
                <p className="text-text-muted font-sans mt-2 max-w-2xl">{activeLesson.desc}</p>
              </div>

              {/* Actions: Mark Complete */}
              <div className="flex items-center gap-3 shrink-0">
                {user && (!activeLesson.quiz || activeLesson.quiz.length === 0) && (
                  <button
                    onClick={() => markComplete(activeLesson.id)}
                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shrink-0 ${
                      completed.has(activeLesson.id)
                        ? 'bg-brand-emerald-light/10 text-brand-emerald-light border border-brand-emerald-light/30'
                        : 'bg-white text-text-muted border border-blush-mist hover:border-brand-emerald-light/30 hover:text-brand-emerald-light'
                    }`}
                  >
                    {completed.has(activeLesson.id) ? '✓ Completed' : 'Mark Complete'}
                  </button>
                )}
              </div>
            </div>

            {/* Chapters */}
            {activeLesson.chapters.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">What's covered</p>
                <div className="space-y-2">
                  {activeLesson.chapters.map((chapter, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <span className="text-[9px] font-bold text-brand-emerald-light mt-0.5 shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-sm text-brandwood font-sans">{chapter}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resources */}
            {activeLesson.resources && activeLesson.resources.length > 0 && (
              <div className="border-t border-blush-mist pt-8 mt-8">
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">Downloads & Resources</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeLesson.resources.map((resource, i) => (
                    <a key={i} href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white border border-blush-mist rounded-2xl hover:border-brand-emerald-light/50 hover:bg-white transition-all group shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-text-muted group-hover:text-brand-emerald-light transition-colors">
                          <Download size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-brandwood group-hover:text-brand-emerald-light transition-colors">{resource.title}</p>
                          <p className="text-xs text-text-muted font-sans">{resource.size}</p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Inline FAQs */}
            {user && activeLesson.quiz && activeLesson.quiz.length > 0 && (
              <div className="space-y-3">
                {!completed.has(activeLesson.id) && (
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#fbbf24] bg-[#fbbf24]/10 px-3 py-2 rounded-lg">
                    <Gift size={12} />
                    <span>Earn NPR 5,000 for completing this quiz</span>
                  </div>
                )}
                <LessonQuiz
                  lessonId={activeLesson.id}
                  questions={activeLesson.quiz}
                  passed={completed.has(activeLesson.id)}
                  existingScore={quizScores[activeLesson.id]}
                  onSubmit={submitQuiz}
                />
              </div>
            )}

            {activeLesson.faqs && activeLesson.faqs.length > 0 && (
              <div className="border-t border-blush-mist pt-8">
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-6">
                  Frequently Asked Questions
                </p>
                <div className="space-y-4">
                  {activeLesson.faqs.map((faq, i) => (
                    <div key={i} className="bg-white border border-blush-mist rounded-2xl p-6 shadow-sm">
                      <h4 className="text-sm font-bold text-brandwood mb-3">{faq.question}</h4>
                      <p className="text-text-muted font-sans text-sm leading-relaxed">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lesson Discussion */}
            <LessonCommentSection lessonId={activeLesson.id} />
          </div>
        </div>
      )}

      {/* Module Sections */}
      {MODULES.map((module) => {
        const moduleLessons = module.lessonIds
          .map(id => LESSONS.find(l => l.id === id))
          .filter((l): l is Lesson => l !== undefined);

        const completedInModule = moduleLessons.filter(l => completed.has(l.id)).length;
        const moduleGuides = GUIDES.filter(g => module.guideIds.includes(g.id));

        return (
          <section key={module.id} className="space-y-6">
            
            {/* Module Header */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="border-b border-blush-mist pb-6"
            >
              <h2 className="text-2xl font-display text-brandwood mb-2">{module.title}</h2>
              <p className="text-text-muted font-sans text-sm">{module.description}</p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-text-muted">
                  <span>{completedInModule} / {moduleLessons.length} complete</span>
                  <span>{Math.round((completedInModule / moduleLessons.length) * 100) || 0}%</span>
                </div>
                <div className="h-1.5 bg-white rounded-full overflow-hidden border border-blush-mist">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(completedInModule / moduleLessons.length) * 100 || 0}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.2, type: 'spring' }}
                    className="h-full bg-brand-emerald-light"
                  />
                </div>
              </div>
              
              {/* Certificate & Master Exam Unlock */}
              {completedInModule === moduleLessons.length && moduleLessons.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', bounce: 0.5 }}
                  className="mt-6 bg-white border border-blush-mist p-4 rounded-2xl flex items-center justify-between flex-wrap gap-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-2xl border border-blush-mist shadow-card">
                      <Award size={20} className="text-brand-emerald" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brandwood">Module Completed!</p>
                      <p className="text-xs text-text-muted">
                        {masterExamScores[module.id] >= 80 
                          ? `You passed the Master Exam with ${masterExamScores[module.id]}%.` 
                          : `Unlock your certificate by passing the Master Exam.`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {(!masterExamScores[module.id] || masterExamScores[module.id] < 80) && (
                      <button
                        onClick={() => setMasterExamModule(module.id)}
                        className="px-4 py-2 bg-brand-emerald text-white text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-[0_4px_15px_rgba(247,59,32,0.3)] hover:opacity-90 transition-all"
                      >
                        Take Master Exam
                      </button>
                    )}
                    {masterExamScores[module.id] >= 80 && (
                      <button
                        onClick={() => setCertificateModule(module.title)}
                        className="px-4 py-2 bg-white text-brand-emerald border border-blush-mist text-[10px] font-bold uppercase tracking-widest rounded-xl hover:border-brand-emerald/50 hover:bg-white transition-all"
                      >
                        View Certificate
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Lesson Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {moduleLessons.map((lesson, index) => {
                return (
                  <button
                    key={lesson.id}
                    onClick={() => playLesson(lesson)}
                    className={`text-left bg-white border rounded-3xl overflow-hidden transition-all group hover:border-brand-emerald-light/50 shadow-card hover:shadow-elevated ${
                      activeLesson.id === lesson.id && isPlaying
                        ? 'border-brand-emerald-light/50 bg-white'
                        : 'border-blush-mist'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={lesson.thumbnail}
                        alt={lesson.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-brandwood/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.div 
                          whileHover={{ scale: 1.2 }}
                          className="w-12 h-12 rounded-2xl bg-white backdrop-blur flex items-center justify-center shadow-card"
                        >
                          <Play size={20} className="text-brand-emerald-light ml-1" />
                        </motion.div>
                      </div>
                      {completed.has(lesson.id) && (
                        <div className="absolute top-3 right-3 bg-brand-emerald-light rounded-2xl p-1.5 shadow-card border border-white">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur rounded-xl px-2 py-1 shadow-sm border border-blush-mist">
                        <span className="text-[9px] font-bold text-brandwood">{index + 1}</span>
                      </div>
                    </div>

                    {/* Lesson Info */}
                    <div className="p-6 space-y-3">
                      <div className="flex items-center gap-3">
                        <span className={`inline-block text-[9px] font-bold uppercase tracking-widest border-transparent px-2 py-0.5 rounded-lg ${
                          lesson.level === 'Beginner' ? 'bg-brand-emerald-light/10 text-brand-emerald-light' :
                          lesson.level === 'Intermediate' ? 'bg-amber-400/10 text-amber-500' :
                          'bg-brand-emerald/10 text-brand-emerald'
                        }`}>
                          {lesson.level}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted">{lesson.duration}</span>
                      </div>
                      <h3 className="text-base font-bold leading-snug transition-colors text-brandwood group-hover:text-brand-emerald font-display">
                        {lesson.title}
                      </h3>
                      <p className="text-text-muted font-sans text-xs line-clamp-2">{lesson.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Written Guides — bottom of module */}
            {moduleGuides.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Written Guide</p>
                {moduleGuides.map((guide, idx) => (
                  <motion.div 
                    key={guide.id} 
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, type: 'spring' }}
                    className="bg-white border border-blush-mist rounded-3xl p-6 hover:border-brand-emerald-light/50 transition-all shadow-card"
                  >
                    <div className="flex items-start justify-between gap-6 flex-wrap">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="inline-block text-[9px] font-bold uppercase tracking-widest bg-white text-brandwood border border-blush-mist px-2 py-0.5 rounded-lg">
                            {guide.category}
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted">{guide.readingTime}</span>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted">{guide.language}</span>
                        </div>
                        <h3 className="text-base font-bold text-brandwood">{guide.title}</h3>
                        <p className="text-text-muted font-sans text-sm">{guide.description}</p>

                        {/* Chapters */}
                        <div className="pt-2 space-y-1">
                          {guide.chapters.map((chapter, i) => (
                            <div key={i} className="flex items-start gap-3">
                              <span className="text-[9px] font-bold text-brand-emerald-light mt-0.5 shrink-0">
                                {String(i + 1).padStart(2, '0')}
                              </span>
                              <span className="text-xs text-brandwood font-sans">{chapter}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-3 shrink-0">
                        
                          <motion.a href={guide.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center justify-center gap-2 px-5 py-3 bg-brand-emerald-light/10 text-brand-emerald-light border border-brand-emerald-light/30 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-emerald-light hover:text-white transition-all shadow-sm"
                        >
                          <BookOpen size={14} /> Read Online
                        </motion.a>
                        
                          <motion.a href={guide.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center justify-center gap-2 px-5 py-3 bg-white text-text-muted border border-blush-mist rounded-xl text-[10px] font-bold uppercase tracking-widest hover:text-brandwood hover:border-brand-emerald transition-all shadow-sm"
                        >
                          <Download size={14} /> Download PDF
                        </motion.a>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        );
      })}

      {/* Trading League — Coming Soon Section */}
      <motion.section 
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-16 p-8 md:p-12 rounded-3xl bg-gradient-to-br from-surface to-surface-muted border border-border shadow-card text-center max-w-4xl mx-auto"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-club-green text-xs font-bold uppercase tracking-wider mb-4">
          <Award size={14} />
          <span>Feature Preview</span>
        </div>
        <h3 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-3">
          Arthneeti Simulated Trading League
        </h3>
        <p className="text-text-muted text-base max-w-xl mx-auto mb-6 leading-relaxed">
          Test your NEPSE portfolio strategies risk-free against students across Nepal. Virtual capital, real live market data, and seasonal leaderboard prizes.
        </p>
        <div className="inline-flex items-center gap-2 text-xs font-bold text-text-muted bg-white border border-border px-5 py-2.5 rounded-xl shadow-sm">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Currently in Private Beta — Releasing Season 1 Soon</span>
        </div>
      </motion.section>
    </div>

    {/* Modals & Assistants */}
     <CertificateModal 
      isOpen={!!certificateModule} 
      onClose={() => {
        setCertificateModule(null);
        setCertificateModuleId(null);
      }} 
      moduleTitle={certificateModule || ''} 
      moduleId={certificateModuleId || ''}
    />
  </main>
);
}
