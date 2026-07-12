import { motion, useScroll, useTransform, MotionValue } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import './PlaybookHero.css';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Sparkles, ArrowRight, LineChart, BadgeCheck, FileText, Bot, 
  AlertCircle, MessageSquareWarning, FileQuestion, BookX, TrendingDown, RadioReceiver, 
  Users, GraduationCap, PieChart, ShieldCheck
} from 'lucide-react';

const PROMPTS = [
  "How do I apply for an IPO in Nepal?",
  "Reorganize my NEPSE watchlist...",
  "What is a Demat account?",
  "Analyze Hydropower stocks performance...",
  "How does compound interest work?"
];

const ASSETS = [
  { 
    id: 'ipo',
    problem: { title: 'Confusing IPOs', content: 'Missing Allotments', icon: AlertCircle, color: 'rose' },
    feature: { title: 'IPO Dashboard', content: 'Live Results', icon: BadgeCheck, color: 'blue' }
  },
  { 
    id: 'tips',
    problem: { title: 'Fake Stock Tips', content: 'Unverified Groups', icon: MessageSquareWarning, color: 'orange' },
    feature: { title: 'Verified Community', content: 'Expert Analysis', icon: Users, color: 'emerald' }
  },
  { 
    id: 'data',
    problem: { title: 'Scattered Data', content: 'No Unified View', icon: FileQuestion, color: 'amber' },
    feature: { title: 'Live Market Data', content: 'Real-time Stats', icon: LineChart, color: 'indigo' }
  },
  { 
    id: 'literacy',
    problem: { title: 'Financial Literacy', content: 'Where to start?', icon: BookX, color: 'rose' },
    feature: { title: 'Structured Learning', content: 'Gyan Badges', icon: GraduationCap, color: 'purple' }
  },
  { 
    id: 'trading',
    problem: { title: 'Complex Trading', content: 'Hard to track', icon: TrendingDown, color: 'rose' },
    feature: { title: 'Portfolio Tracker', content: 'Seamless Sync', icon: PieChart, color: 'emerald' }
  },
  { 
    id: 'news',
    problem: { title: 'Unverified News', content: 'Rumor Investing', icon: RadioReceiver, color: 'orange' },
    feature: { title: 'AI Market Insights', content: 'Arthneeti AI', icon: Bot, color: 'teal' }
  },
];

// Helper Component to avoid calling hooks in a loop
const AssetCard = ({ asset, index, scrollYProgress }: { asset: typeof ASSETS[0], index: number, scrollYProgress: MotionValue<number> }) => {
  const seed = (index * 17.5 + 43.1) % 100;
  const randomX = (seed - 50) * 15;
  const randomY = ((seed * 7) % 100 - 50) * 10 - 200;
  const randomRotation = (seed - 50) * 1.5;

  const angle = (index * 60) * (Math.PI / 180);
  const radiusX = 350;
  const radiusY = 220;
  const gridX = Math.cos(angle) * radiusX;
  const gridY = Math.sin(angle) * radiusY;

  // Timings:
  // Move: 0.0 -> 0.25
  // Transform colors: 0.15 -> 0.25 (as they land)
  const x = useTransform(scrollYProgress, [0, 0.25], [randomX, gridX]);
  const y = useTransform(scrollYProgress, [0, 0.25], [randomY, gridY]);
  const rotate = useTransform(scrollYProgress, [0, 0.25], [randomRotation, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.25], [0.8, 1]);
  const containerOpacity = useTransform(scrollYProgress, [0, 0.1], [0.8, 1]);

  const problemOpacity = useTransform(scrollYProgress, [0.15, 0.25], [1, 0]);
  const featureOpacity = useTransform(scrollYProgress, [0.15, 0.25], [0, 1]);
  const problemScale = useTransform(scrollYProgress, [0.15, 0.25], [1, 0.9]);
  const featureScale = useTransform(scrollYProgress, [0.15, 0.25], [0.9, 1]);

  const ProblemIcon = asset.problem.icon;
  const FeatureIcon = asset.feature.icon;

  return (
    <motion.div
      className="bento-card"
      style={{ x, y, rotate, scale, opacity: containerOpacity }}
    >
      <motion.div 
        className={`state-layer color-${asset.problem.color}`}
        style={{ opacity: problemOpacity, scale: problemScale }}
      >
        <div className="bento-card-header">
          <span className="bento-card-icon"><ProblemIcon size={20} /></span>
          <span className="bento-card-title">{asset.problem.title}</span>
        </div>
        <div className="bento-card-content">{asset.problem.content}</div>
      </motion.div>

      <motion.div 
        className={`state-layer color-${asset.feature.color}`}
        style={{ opacity: featureOpacity, scale: featureScale }}
      >
        <div className="bento-card-header">
          <span className="bento-card-icon"><FeatureIcon size={20} /></span>
          <span className="bento-card-title">{asset.feature.title}</span>
        </div>
        <div className="bento-card-content">{asset.feature.content}</div>
      </motion.div>
    </motion.div>
  );
};

export default function PlaybookHero() {
  const { user, handleJoinAction } = useAuth();
  const [promptIndex, setPromptIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
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

  // Central Card Timings:
  // Show up precisely as the grid locks into place (0.2 -> 0.3)
  const centralScale = useTransform(scrollYProgress, [0.2, 0.3], [0.5, 1.2]);
  const centralOpacity = useTransform(scrollYProgress, [0.2, 0.3], [0, 1]);

  return (
    <div ref={containerRef} className="playbook-hero-container">
      {/* Background glow tracking mouse */}
      <div 
        className="cursor-glow"
        style={{
          left: mousePosition.x,
          top: mousePosition.y + window.scrollY,
        }}
      />

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
            <Link to="/dashboard" className="btn-primary">
              Launch Dashboard <ArrowRight size={20} className="ml-2" />
            </Link>
            <Link to="/explore" className="btn-secondary">
              <LineChart size={20} /> Explore Markets
            </Link>
          </div>
        </motion.div>

        <div className="bento-grid-container">
          {ASSETS.map((asset, index) => (
            <AssetCard 
              key={asset.id} 
              asset={asset} 
              index={index} 
              scrollYProgress={scrollYProgress} 
            />
          ))}
          
          {/* Central Arthneeti Solution Card */}
          <motion.div
            className="bento-card central-solution-card"
            style={{
              x: 0,
              y: 0,
              scale: centralScale,
              opacity: centralOpacity,
            }}
          >
            <div className="state-layer color-teal flex flex-col items-center justify-center p-6 border-2 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <ShieldCheck size={32} className="text-emerald-600 mb-3" />
              <div className="text-center font-bold text-2xl text-slate-800 mb-1">ARTHNEETI</div>
              <div className="text-center text-sm text-slate-600 font-medium">The Unified Ecosystem</div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
