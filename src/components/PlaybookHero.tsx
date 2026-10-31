import { motion } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import './PlaybookHero.css';
import { Link } from 'react-router-dom';
import { 
  Sparkles, ArrowRight, LineChart, BadgeCheck, Bot, 
  AlertCircle, MessageSquareWarning, FileQuestion, BookX, TrendingDown, RadioReceiver, 
  Users, GraduationCap, PieChart, ShieldCheck, Check
} from 'lucide-react';

const PROMPTS = [
  "How do I apply for an IPO in Nepal?",
  "Reorganize my NEPSE watchlist...",
  "What is a Demat account?",
  "Analyze Hydropower stocks performance...",
  "How does compound interest work?"
];

/* Each entry pairs a pain point with the feature that removes it. The feature
 * is what renders — the problem is kept as a muted "Solves:" line so the
 * problem → solution story survives without needing a scroll to reveal it. */
const ASSETS = [
  { 
    id: 'ipo',
    problem: { title: 'Confusing IPOs', content: 'Missing Allotments', icon: AlertCircle },
    feature: { title: 'IPO Dashboard', content: 'Live allotment results and application tracking in one place.', icon: BadgeCheck, color: 'blue' }
  },
  { 
    id: 'tips',
    problem: { title: 'Fake Stock Tips', content: 'Unverified Groups', icon: MessageSquareWarning },
    feature: { title: 'Verified Community', content: 'Moderated discussion with expert analysis you can check.', icon: Users, color: 'emerald' }
  },
  { 
    id: 'data',
    problem: { title: 'Scattered Data', content: 'No Unified View', icon: FileQuestion },
    feature: { title: 'Live Market Data', content: 'NEPSE indices and sector stats gathered into a single view.', icon: LineChart, color: 'indigo' }
  },
  { 
    id: 'literacy',
    problem: { title: 'Financial Literacy', content: 'Where to start?', icon: BookX },
    feature: { title: 'Structured Learning', content: 'A bilingual curriculum that awards Gyan Badges as you progress.', icon: GraduationCap, color: 'purple' }
  },
  { 
    id: 'trading',
    problem: { title: 'Complex Trading', content: 'Hard to track', icon: TrendingDown },
    feature: { title: 'Portfolio Tracker', content: 'Practise with a simulated portfolio synced to your progress.', icon: PieChart, color: 'teal' }
  },
  { 
    id: 'news',
    problem: { title: 'Unverified News', content: 'Rumor Investing', icon: RadioReceiver },
    feature: { title: 'AI Market Insights', content: 'Arthneeti AI researches every sector so you do not have to.', icon: Bot, color: 'amber' }
  },
];

const FeatureCard = ({ asset, index }: { asset: typeof ASSETS[0], index: number }) => {
  const ProblemIcon = asset.problem.icon;
  const FeatureIcon = asset.feature.icon;

  return (
    <motion.div
      className="bento-card"
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.15 + index * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={`state-layer color-${asset.feature.color}`}>
        <div>
          <div className="bento-card-header">
            <span className="bento-card-icon"><FeatureIcon size={20} /></span>
            <span className="bento-card-title">{asset.feature.title}</span>
          </div>
          <div className="bento-card-content">{asset.feature.content}</div>
        </div>
        <div className="bento-card-problem">
          <Check size={12} className="text-emerald-600 shrink-0" />
          <span>Solves: {asset.problem.title} — {asset.problem.content}</span>
          <ProblemIcon size={12} className="text-slate-400 shrink-0" />
        </div>
      </div>
    </motion.div>
  );
};

export default function PlaybookHero() {
  const [promptIndex, setPromptIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const glowRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /* Decorative pointer glow. Written straight to the DOM on animation frames:
   * doing this through state re-rendered the entire hero (typing animation
   * included) on every single mousemove. */
  useEffect(() => {
    const glow = glowRef.current;
    const container = containerRef.current;
    if (!glow || !container) return;

    const isCoarse = window.matchMedia('(pointer: coarse)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isCoarse || prefersReducedMotion) {
      glow.style.display = 'none';
      return;
    }

    let frame = 0;
    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect();
        glow.style.opacity = '1';
        glow.style.transform =
          `translate3d(${e.clientX - rect.left}px, ${e.clientY - rect.top}px, 0) translate(-50%, -50%)`;
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const currentPrompt = PROMPTS[promptIndex];
    let timeout: NodeJS.Timeout;

    if (!isDeleting && typedText.length < currentPrompt.length) {
      timeout = setTimeout(() => {
        setTypedText(currentPrompt.slice(0, typedText.length + 1));
      }, 50 + Math.random() * 50);
    } else if (!isDeleting && typedText.length === currentPrompt.length) {
      timeout = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && typedText.length > 0) {
      timeout = setTimeout(() => {
        setTypedText(typedText.slice(0, -1));
      }, 30);
    } else if (isDeleting && typedText.length === 0) {
      setIsDeleting(false);
      setPromptIndex((prev) => (prev + 1) % PROMPTS.length);
    }

    return () => clearTimeout(timeout);
  }, [typedText, isDeleting, promptIndex]);

  return (
    <div ref={containerRef} className="playbook-hero-container">
      {/* Background glow tracking mouse */}
      <div ref={glowRef} className="cursor-glow" aria-hidden="true" />

      <div className="playbook-hero-content">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hero-main-content"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="hero-badge"
          >
            <Sparkles size={16} className="inline mr-2" />
            The AI-Powered Intelligence Platform
          </motion.div>
          
          <h1 className="hero-title">
            Your Blueprint for<br />
            <span className="hero-title-highlight">Financial Mastery</span>
          </h1>

          <div className="prompt-box-container">
            <div className="prompt-box">
              <Sparkles className="prompt-icon" />
              <span className="prompt-text">{typedText}</span>
              <span className="prompt-cursor" />
            </div>
          </div>

          <p className="hero-subtitle">
            Say goodbye to disorganized notes and fake stock tips. Arthneeti 
            unifies market data, expert education, and community insights into 
            one powerful ecosystem.
          </p>

          <div className="hero-actions">
            {/* These used to point at /dashboard and /explore — neither route
                exists, so the catch-all bounced users straight back to "/". */}
            <Link to="/discover" className="btn-primary">
              Launch Dashboard <ArrowRight size={20} className="ml-2" />
            </Link>
            <Link to="/trade-game" className="btn-secondary">
              <LineChart size={20} /> Explore Markets
            </Link>
          </div>
        </motion.div>

        <div className="bento-grid-container">
          {ASSETS.map((asset, index) => (
            <FeatureCard key={asset.id} asset={asset} index={index} />
          ))}
          
          {/* Central Arthneeti Solution Card */}
          <motion.div
            className="bento-card central-solution-card"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="state-layer color-teal border-2 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <ShieldCheck size={32} className="text-emerald-600 shrink-0" />
              <div className="text-left">
                <div className="font-bold text-2xl text-slate-800 mb-1">ARTHNEETI</div>
                <div className="text-sm text-slate-600 font-medium">One unified ecosystem — pick any feature from the menu above.</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
