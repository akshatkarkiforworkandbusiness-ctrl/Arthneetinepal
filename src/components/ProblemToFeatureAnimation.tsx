import { useRef, useEffect, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { motion } from 'motion/react';

gsap.registerPlugin(SplitText);

interface ProblemToFeatureAnimationProps {
  onComplete: () => void;
}

const CARDS = [
  { problem: 'No Financial Literacy', feature: 'Structured Curriculum' },
  { problem: 'Market Confusion', feature: 'Expert Guidance' },
  { problem: 'No Structured Learning', feature: 'Progressive Roadmap' },
  { problem: 'Information Overload', feature: 'Curated Resources' },
  { problem: 'Fear of Investing', feature: 'Safe Practice' },
  { problem: 'No Expert Guidance', feature: 'Mentor Support' },
];

const getHexPositions = (count: number, radius: number) =>
  Array.from({ length: count }).map((_, i) => ({
    x: radius * Math.cos((2 * Math.PI * i) / count - Math.PI / 2),
    y: radius * Math.sin((2 * Math.PI * i) / count - Math.PI / 2),
  }));

export default function ProblemToFeatureAnimation({ onComplete }: ProblemToFeatureAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const arthneetiCardRef = useRef<HTMLDivElement>(null);
  const blueprintRef = useRef<HTMLDivElement>(null);
  const [flippedCards, setFlippedCards] = useState<boolean[]>(new Array(6).fill(false));
  const [showArthneeti, setShowArthneeti] = useState(false);
  const [showBlueprint, setShowBlueprint] = useState(false);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const hexPositions = getHexPositions(6, 160);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          setTimeout(onComplete, 1500);
        },
      });
      timelineRef.current = tl;

      // Phase 1: Problem cards appear (0-1.5s)
      tl.from(cardsRef.current, {
        opacity: 0,
        scale: 0.8,
        y: 40,
        stagger: 0.15,
        duration: 0.6,
        ease: 'back.out(1.7)',
      });

      // Phase 2: Flip to features (1.5-3s)
      tl.to(
        cardsRef.current,
        {
          rotateY: 180,
          stagger: 0.1,
          duration: 0.4,
          ease: 'power2.inOut',
          onStart: () => {
            setFlippedCards(new Array(6).fill(true));
          },
        },
        '+=0.5'
      );

      // Phase 3: Align to hexagon (3-4.5s)
      tl.to(
        cardsRef.current,
        {
          x: (i: number) => hexPositions[i].x,
          y: (i: number) => hexPositions[i].y,
          duration: 1.2,
          ease: 'power2.inOut',
        },
        '+=0.3'
      );

      // Phase 4: Merge to Arthneeti card (4.5-5.5s)
      tl.to(
        cardsRef.current,
        {
          scale: 0,
          opacity: 0,
          stagger: 0.05,
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
          duration: 0.6,
          ease: 'back.out(1.7)',
        },
        '-=0.1'
      );

      // Phase 5: Blueprint text reveal (5.5-6.5s)
      tl.call(
        () => setShowBlueprint(true),
        undefined,
        '+=0.3'
      );

      tl.from(
        blueprintRef.current,
        {
          y: 30,
          opacity: 0,
          duration: 0.5,
          ease: 'power2.out',
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [onComplete, hexPositions]);

  const handleSkip = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.kill();
    }
    onComplete();
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[200] bg-[#0f172a] flex items-center justify-center overflow-hidden"
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full blur-[150px]"
          style={{
            background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
          }}
          animate={{
            x: ['-10%', '5%', '-10%'],
            y: ['-5%', '3%', '-5%'],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Cards container */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        {/* Problem/Feature Cards */}
        {CARDS.map((card, i) => (
          <div
            key={i}
            ref={(el) => { cardsRef.current[i] = el; }}
            className="absolute w-40 h-24 rounded-2xl flex items-center justify-center text-center p-4"
            style={{
              background: flippedCards[i]
                ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
              boxShadow: flippedCards[i]
                ? '0 0 30px rgba(16,185,129,0.4)'
                : '0 0 30px rgba(239,68,68,0.4)',
              backfaceVisibility: 'hidden',
            }}
          >
            <span className="text-white text-sm font-bold leading-tight">
              {flippedCards[i] ? card.feature : card.problem}
            </span>
          </div>
        ))}

        {/* Arthneeti Card */}
        {showArthneeti && (
          <div
            ref={arthneetiCardRef}
            className="absolute w-64 h-40 rounded-3xl flex flex-col items-center justify-center text-center p-6"
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
              boxShadow: '0 0 60px rgba(16,185,129,0.6), 0 0 100px rgba(16,185,129,0.3)',
              border: '2px solid rgba(255,255,255,0.3)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
                <path d="M20 46 L32 24 L44 46Z" fill="white" opacity="0.9" />
                <polyline
                  points="14,44 24,36 32,38 40,26 50,18"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <circle cx="50" cy="18" r="3" fill="white" />
              </svg>
              <span className="text-white text-2xl font-display font-bold">Arthneeti</span>
            </div>
            <span className="text-white/80 text-xs">Financial Mastery Platform</span>
          </div>
        )}

        {/* Blueprint Text */}
        {showBlueprint && (
          <div
            ref={blueprintRef}
            className="absolute bottom-32 text-center"
          >
            <p className="text-white/60 text-sm tracking-[0.2em] uppercase mb-2">Your</p>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white">
              Blueprint for<br />
              <span className="text-emerald-400">Financial Mastery</span>
            </h2>
          </div>
        )}
      </div>

      {/* Skip Button */}
      <motion.button
        className="absolute bottom-8 right-8 text-white/30 text-xs tracking-widest uppercase hover:text-white/60 transition-colors z-20"
        onClick={handleSkip}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        Skip →
      </motion.button>

      {/* Progress Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {[1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            className="h-1 rounded-full"
            initial={{ width: 24, backgroundColor: 'rgba(255,255,255,0.1)' }}
            animate={
              showBlueprint && i === 5
                ? { width: 32, backgroundColor: '#10b981' }
                : showArthneeti && i >= 4
                ? { width: 32, backgroundColor: '#10b981' }
                : { width: 24, backgroundColor: 'rgba(255,255,255,0.1)' }
            }
            transition={{ duration: 0.4 }}
          />
        ))}
      </div>
    </div>
  );
}
