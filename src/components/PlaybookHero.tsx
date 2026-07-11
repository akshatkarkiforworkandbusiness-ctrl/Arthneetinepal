import { motion, useScroll, useTransform } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import './PlaybookHero.css';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const PROMPTS = [
  "How do I apply for an IPO in Nepal?",
  "Reorganize my NEPSE watchlist...",
  "What is a Demat account?",
  "Analyze Hydropower stocks performance...",
  "How does compound interest work?"
];

// 8 floating assets
const ASSETS = [
  { id: 'nepse', type: 'chart', title: 'NEPSE Index', content: '+18.42 (0.90%)', color: 'emerald' },
  { id: 'ipo', type: 'badge', title: 'IPO Lottery', content: 'Allotment Results', color: 'blue' },
  { id: 'demat', type: 'doc', title: 'Demat Guide', content: 'PDF Guide', color: 'orange' },
  { id: 'gyan', type: 'badge', title: 'Gyan Badge', content: 'Level 1 Scholar', color: 'purple' },
  { id: 'ai', type: 'bubble', title: 'Arthneeti AI', content: 'Market Insights', color: 'teal' },
  { id: 'stock1', type: 'chart', title: 'NABIL Bank', content: 'Rs. 580', color: 'rose' },
  { id: 'stock2', type: 'chart', title: 'Upper Tamakoshi', content: 'Rs. 240', color: 'amber' },
  { id: 'cert', type: 'doc', title: 'Certificate', content: 'Financial Literacy', color: 'indigo' },
];

export default function PlaybookHero() {
  const { user, handleJoinAction } = useAuth();
  const [promptIndex, setPromptIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll animations
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Typing effect
  useEffect(() => {
    const currentPrompt = PROMPTS[promptIndex];
    let timer: NodeJS.Timeout;

    if (!isDeleting) {
      if (typedText.length < currentPrompt.length) {
        timer = setTimeout(() => {
          setTypedText(currentPrompt.slice(0, typedText.length + 1));
        }, 80);
      } else {
        timer = setTimeout(() => setIsDeleting(true), 2000);
      }
    } else {
      if (typedText.length > 0) {
        timer = setTimeout(() => {
          setTypedText(currentPrompt.slice(0, typedText.length - 1));
        }, 40);
      } else {
        setIsDeleting(false);
        setPromptIndex((prev) => (prev + 1) % PROMPTS.length);
      }
    }

    return () => clearTimeout(timer);
  }, [typedText, isDeleting, promptIndex]);

  // Cursor glow effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
    }
    return () => {
      if (container) container.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="playbook-hero-container"
    >
      <div 
        className="cursor-glow"
        style={{
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`
        }}
      />
      
      <div className="playbook-hero-content">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hero-main-content"
          style={{
            scale: useTransform(scrollYProgress, [0, 0.5], [1, 0.8]),
            opacity: useTransform(scrollYProgress, [0, 0.5], [1, 0])
          }}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="hero-badge"
          >
            Arthneeti
          </motion.div>
          
          <h1 className="hero-title">
            Think Big.<br />
            Invest Smart.<br />
            <span className="hero-title-highlight">Lead Nepal.</span>
          </h1>
          <p className="hero-subtitle">
            Building the next generation of economically literate leaders and investors across Nepal through structural economic knowledge.
          </p>
          
          <div className="prompt-box-container">
            <div className="prompt-box">
              <span className="material-symbols-outlined prompt-icon">sparkles</span>
              <span className="prompt-text">{typedText}</span>
              <span className="prompt-cursor" />
            </div>
          </div>

          <div className="hero-actions">
            {!user ? (
              <button onClick={handleJoinAction} className="btn-primary">
                Join the Movement
              </button>
            ) : (
              <Link to="/profile" className="btn-primary">
                Go to Dashboard →
              </Link>
            )}
            <Link to="/discover" className="btn-secondary">
              Explore Markets
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </Link>
          </div>
        </motion.div>

        <div className="bento-grid-container">
          {ASSETS.map((asset, index) => {
            // Scattered cloud positions for Phase 0
            const randomX = (index % 2 === 0 ? -1 : 1) * (200 + Math.random() * 200);
            const randomY = (index < 4 ? -1 : 1) * (150 + Math.random() * 150);
            const randomRotation = (Math.random() - 0.5) * 40;
            
            // Grid positions for Phase 2 (Simple 4x2 grid approximation)
            const gridCol = index % 4;
            const gridRow = Math.floor(index / 4);
            const gridX = (gridCol - 1.5) * 220; // 4 columns centered
            const gridY = (gridRow - 0.5) * 180 + 300; // 2 rows, shifted down

            const x = useTransform(scrollYProgress, [0, 0.4, 0.8, 1], [randomX, randomX * 0.5, gridX, gridX]);
            const y = useTransform(scrollYProgress, [0, 0.4, 0.8, 1], [randomY, randomY * 0.5, gridY, gridY]);
            const rotate = useTransform(scrollYProgress, [0, 0.4, 0.8, 1], [randomRotation, randomRotation * 0.5, 0, 0]);
            const scale = useTransform(scrollYProgress, [0, 0.4, 0.8, 1], [0.8, 0.9, 1, 1]);
            const opacity = useTransform(scrollYProgress, [0, 0.1, 0.8, 1], [0, 1, 1, 1]);

            return (
              <motion.div
                key={asset.id}
                className={`bento-card color-${asset.color}`}
                style={{
                  x,
                  y,
                  rotate,
                  scale,
                  opacity
                }}
              >
                <div className="bento-card-inner">
                  <div className="bento-card-header">
                    <span className="bento-card-icon material-symbols-outlined">
                      {asset.type === 'chart' ? 'show_chart' : 
                       asset.type === 'badge' ? 'verified' : 
                       asset.type === 'doc' ? 'description' : 'smart_toy'}
                    </span>
                    <span className="bento-card-title">{asset.title}</span>
                  </div>
                  <div className="bento-card-content">{asset.content}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
