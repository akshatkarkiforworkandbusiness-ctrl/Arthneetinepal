import { useRef, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import { gsap } from 'gsap';
import { motion, AnimatePresence } from 'motion/react';

interface ProblemToFeatureAnimationProps {
  onComplete: () => void;
}

interface CardData {
  problem: string;
  feature: string;
  problemIcon: ReactNode;
  featureIcon: ReactNode;
}

const CARDS: CardData[] = [
  {
    problem: 'No Financial Literacy',
    feature: 'Structured Curriculum',
    problemIcon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    featureIcon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    problem: 'Market Confusion',
    feature: 'Expert Guidance',
    problemIcon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    featureIcon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    problem: 'No Structured Learning',
    feature: 'Progressive Roadmap',
    problemIcon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    featureIcon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    problem: 'Information Overload',
    feature: 'Curated Resources',
    problemIcon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    featureIcon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    problem: 'Fear of Investing',
    feature: 'Safe Practice',
    problemIcon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    featureIcon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    problem: 'No Expert Guidance',
    feature: 'Mentor Support',
    problemIcon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    featureIcon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 4.354a4 4 0 110 7.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

const FLOATING_ICONS = [
  // Chart icon
  <svg key="chart" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>,
  // Trending up
  <svg key="trend" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>,
  // Checkmark
  <svg key="check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>,
  // Star
  <svg key="star" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>,
  // Arrow right
  <svg key="arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>,
  // Lightbulb
  <svg key="bulb" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>,
];

const getRandomPositions = (count: number) =>
  Array.from({ length: count }).map(() => ({
    x: (Math.random() - 0.5) * 600,
    y: (Math.random() - 0.5) * 400,
    rotation: (Math.random() - 0.5) * 30,
    scale: 0.7 + Math.random() * 0.6,
  }));

const getHexPositions = (count: number, radius: number) =>
  Array.from({ length: count }).map((_, i) => ({
    x: radius * Math.cos((2 * Math.PI * i) / count - Math.PI / 2),
    y: radius * Math.sin((2 * Math.PI * i) / count - Math.PI / 2),
  }));

export default function ProblemToFeatureAnimation({ onComplete }: ProblemToFeatureAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const arthneetiCardRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);
  const [flippedCards, setFlippedCards] = useState<boolean[]>(new Array(6).fill(false));
  const [showArthneeti, setShowArthneeti] = useState(false);
  const [showTagline, setShowTagline] = useState(false);
  const [taglinePhase, setTaglinePhase] = useState(0);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const initialPositions = useMemo(() => getRandomPositions(6), []);
  const hexPositions = useMemo(() => getHexPositions(6, 140), []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          setTimeout(onComplete, 1200);
        },
      });
      timelineRef.current = tl;

      // Set initial positions (off-screen scattered)
      cardsRef.current.forEach((card, i) => {
        if (card) {
          gsap.set(card, {
            x: initialPositions[i].x * 2,
            y: initialPositions[i].y * 2,
            rotation: initialPositions[i].rotation * 2,
            scale: 0,
            opacity: 0,
          });
        }
      });

      // Phase 1: Problem cards fly in (0-2s)
      tl.to(cardsRef.current, {
        x: (i: number) => initialPositions[i].x,
        y: (i: number) => initialPositions[i].y,
        rotation: (i: number) => initialPositions[i].rotation,
        scale: (i: number) => initialPositions[i].scale,
        opacity: 1,
        stagger: {
          each: 0.12,
          from: 'random',
        },
        duration: 0.8,
        ease: 'back.out(1.4)',
      });

      // Phase 2: Cards flip to features (2-4s)
      tl.to(
        cardsRef.current,
        {
          rotateY: 180,
          stagger: {
            each: 0.08,
            from: 'center',
          },
          duration: 0.5,
          ease: 'power2.inOut',
          onStart: () => {
            setFlippedCards(new Array(6).fill(true));
          },
        },
        '+=0.8'
      );

      // Phase 3: Align to hexagon (4-5.5s)
      tl.to(
        cardsRef.current,
        {
          x: (i: number) => hexPositions[i].x,
          y: (i: number) => hexPositions[i].y,
          rotation: 0,
          scale: 0.85,
          duration: 1,
          ease: 'power2.inOut',
        },
        '+=0.3'
      );

      // Phase 4: Merge to Arthneeti card (5.5-7s)
      tl.to(
        cardsRef.current,
        {
          scale: 0,
          opacity: 0,
          stagger: {
            each: 0.04,
            from: 'random',
          },
          duration: 0.4,
          ease: 'power2.in',
          onComplete: () => setShowArthneeti(true),
        },
        '+=0.2'
      );

      tl.from(
        arthneetiCardRef.current,
        {
          scale: 0,
          opacity: 0,
          rotation: -10,
          duration: 0.7,
          ease: 'back.out(1.7)',
        },
        '-=0.1'
      );

      // Phase 5: Tagline reveal (7-9s)
      tl.call(
        () => {
          setShowTagline(true);
          setTimeout(() => setTaglinePhase(1), 200);
          setTimeout(() => setTaglinePhase(2), 600);
          setTimeout(() => setTaglinePhase(3), 1000);
        },
        undefined,
        '+=0.4'
      );

      tl.from(
        taglineRef.current,
        {
          y: 40,
          opacity: 0,
          duration: 0.6,
          ease: 'power3.out',
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [onComplete, initialPositions, hexPositions]);

  const handleSkip = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.kill();
    }
    onComplete();
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)',
      }}
    >
      {/* Grid pattern background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(16,185,129,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16,185,129,1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Ambient glow - light green */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
            filter: 'blur(80px)',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {FLOATING_ICONS.map((icon, i) => (
          <motion.div
            key={i}
            className="absolute text-emerald-400/20"
            style={{
              left: `${15 + i * 14}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, (i % 2 === 0 ? 10 : -10), 0],
              rotate: [0, (i % 2 === 0 ? 10 : -10), 0],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.3,
            }}
          >
            {icon}
          </motion.div>
        ))}
      </div>

      {/* Cards container with perspective */}
      <div
        className="relative z-10 w-full h-full flex items-center justify-center"
        style={{ perspective: '1200px' }}
      >
        {/* Problem/Feature Cards */}
        {CARDS.map((card, i) => (
          <div
            key={i}
            ref={(el) => { cardsRef.current[i] = el; }}
            className="absolute w-44 h-28 rounded-2xl flex items-center justify-center text-center p-4 cursor-default"
            style={{
              transformStyle: 'preserve-3d',
              background: flippedCards[i]
                ? 'rgba(255, 255, 255, 0.7)'
                : 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: flippedCards[i]
                ? '1px solid rgba(16, 185, 129, 0.3)'
                : '1px solid rgba(239, 68, 68, 0.2)',
              boxShadow: flippedCards[i]
                ? '0 8px 32px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255,255,255,0.6)'
                : '0 8px 32px rgba(239, 68, 68, 0.1), inset 0 1px 0 rgba(255,255,255,0.6)',
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <div
                className="transition-colors duration-300"
                style={{
                  color: flippedCards[i] ? '#10b981' : '#ef4444',
                }}
              >
                {flippedCards[i] ? card.featureIcon : card.problemIcon}
              </div>
              <span
                className="text-xs font-bold leading-tight transition-colors duration-300"
                style={{
                  color: flippedCards[i] ? '#065f46' : '#991b1b',
                }}
              >
                {flippedCards[i] ? card.feature : card.problem}
              </span>
            </div>
          </div>
        ))}

        {/* Arthneeti Card */}
        <AnimatePresence>
          {showArthneeti && (
            <motion.div
              ref={arthneetiCardRef}
              className="absolute flex flex-col items-center justify-center text-center p-8 rounded-3xl"
              style={{
                width: '320px',
                height: '200px',
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                boxShadow: '0 20px 60px rgba(16, 185, 129, 0.2), 0 0 100px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
              }}
              initial={{ scale: 0, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Arthneeti Logo */}
              <div className="flex items-center gap-3 mb-3">
                <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
                  <path d="M20 46 L32 24 L44 46Z" fill="#10b981" opacity="0.9" />
                  <polyline
                    points="14,44 24,36 32,38 40,26 50,18"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <circle cx="50" cy="18" r="3" fill="#10b981" />
                </svg>
                <span className="text-3xl font-display font-bold" style={{ color: '#065f46' }}>
                  Arthneeti
                </span>
              </div>
              <span className="text-sm font-medium" style={{ color: '#6b7280' }}>
                Financial Mastery Platform
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tagline */}
        <AnimatePresence>
          {showTagline && (
            <motion.div
              ref={taglineRef}
              className="absolute text-center"
              style={{ bottom: '15%' }}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex flex-col items-center gap-2">
                <motion.span
                  className="text-lg font-medium tracking-widest uppercase"
                  style={{ color: '#6b7280' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={taglinePhase >= 1 ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4 }}
                >
                  Think Big
                </motion.span>
                <motion.span
                  className="text-lg font-medium tracking-widest uppercase"
                  style={{ color: '#6b7280' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={taglinePhase >= 2 ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4 }}
                >
                  Invest Smart
                </motion.span>
                <motion.span
                  className="text-2xl font-display font-bold"
                  style={{ color: '#10b981' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={taglinePhase >= 3 ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4 }}
                >
                  Lead Nepal
                </motion.span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Skip Button */}
      <motion.button
        className="absolute bottom-8 right-8 text-gray-400 text-xs tracking-widest uppercase hover:text-gray-600 transition-colors z-20"
        onClick={handleSkip}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        Skip →
      </motion.button>

      {/* Progress Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {[1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            className="h-1 rounded-full"
            initial={{ width: 24, backgroundColor: 'rgba(16,185,129,0.15)' }}
            animate={
              showTagline && i === 5
                ? { width: 40, backgroundColor: '#10b981' }
                : showArthneeti && i >= 4
                ? { width: 32, backgroundColor: '#10b981' }
                : { width: 24, backgroundColor: 'rgba(16,185,129,0.15)' }
            }
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        ))}
      </div>
    </div>
  );
}
