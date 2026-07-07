import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';

interface CinematicIntroProps {
  onComplete: () => void;
}

export default function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),      // Logo appears
      setTimeout(() => setPhase(2), 1200),      // Mountain silhouette rises
      setTimeout(() => setPhase(3), 2400),      // Tagline reveals
      setTimeout(() => setPhase(4), 4000),      // Mission statement
      setTimeout(() => onComplete(), 5500),     // Complete intro
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase < 4 && (
        <motion.div
          className="fixed inset-0 z-[200] bg-[#0f172a] flex items-center justify-center overflow-hidden"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Ambient Background Glow */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute w-[600px] h-[600px] rounded-full blur-[150px]"
              style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)' }}
              animate={{
                x: ['-10%', '5%', '-10%'],
                y: ['-5%', '3%', '-5%'],
              }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          {/* Mountain Silhouette - Three Layers (Terai, Hilly, Himalayan) */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-[50%]"
            initial={{ opacity: 0, y: 80 }}
            animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <svg
              viewBox="0 0 1440 500"
              className="w-full h-full"
              preserveAspectRatio="xMidYMax slice"
            >
              <defs>
                {/* Terai - Southern Plains (lightest) */}
                <linearGradient id="teraiGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0.6" />
                </linearGradient>
                {/* Hilly - Central Midlands (medium) */}
                <linearGradient id="hillyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#059669" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0.7" />
                </linearGradient>
                {/* Himalayan - Northern Peaks (darkest, most prominent) */}
                <linearGradient id="himalayanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#047857" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0.85" />
                </linearGradient>
              </defs>

              {/* Terai - Flat southern plains */}
              <motion.path
                d="M0,500 L0,420 Q360,400 720,410 Q1080,400 1440,420 L1440,500 Z"
                fill="url(#teraiGrad)"
                initial={{ opacity: 0, y: 30 }}
                animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 1.2, delay: 0.2 }}
              />

              {/* Hilly - Rolling hills */}
              <motion.path
                d="M0,500 L0,380 Q180,320 360,360 Q540,280 720,340 Q900,260 1080,320 Q1260,280 1440,350 L1440,500 Z"
                fill="url(#hillyGrad)"
                initial={{ opacity: 0, y: 50 }}
                animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 1.2, delay: 0.4 }}
              />

              {/* Himalayan - Majestic peaks */}
              <motion.path
                d="M0,500 L0,320 Q120,200 240,280 Q360,150 480,250 Q600,100 720,200 Q840,80 960,180 Q1080,120 1200,220 Q1320,160 1440,280 L1440,500 Z"
                fill="url(#himalayanGrad)"
                initial={{ opacity: 0, y: 70 }}
                animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 1.2, delay: 0.6 }}
              />

              {/* Rising growth line */}
              <motion.polyline
                points="100,450 300,380 500,400 700,300 900,250 1100,180 1300,100"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={phase >= 2 ? { pathLength: 1, opacity: 0.6 } : {}}
                transition={{ duration: 2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />

              {/* Peak dot */}
              <motion.circle
                cx="1300"
                cy="100"
                r="4"
                fill="#10b981"
                initial={{ scale: 0, opacity: 0 }}
                animate={phase >= 2 ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 0.4, delay: 2.5, type: 'spring', stiffness: 200 }}
              />
            </svg>
          </motion.div>

          {/* Content Overlay */}
          <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
            {/* Logo Mark */}
            <motion.div
              className="flex items-center justify-center gap-3 mb-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={phase >= 1 ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
                <path d="M20 46 L32 24 L44 46Z" fill="#10b981" opacity="0.8" />
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
              <span className="text-white/70 text-sm font-medium tracking-[0.3em] uppercase">
                Arthneeti
              </span>
            </motion.div>

            {/* Tagline - Cinematic Reveal */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0 }}
              animate={phase >= 3 ? { opacity: 1 } : {}}
              transition={{ duration: 0.4 }}
            >
              <div className="overflow-hidden">
                <motion.h1
                  className="text-5xl md:text-7xl lg:text-8xl text-white font-display font-bold leading-[1.1] tracking-tight"
                  initial={{ y: 80 }}
                  animate={phase >= 3 ? { y: 0 } : {}}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                  Think Big.
                </motion.h1>
              </div>
              <div className="overflow-hidden mt-1">
                <motion.h1
                  className="text-5xl md:text-7xl lg:text-8xl font-display font-bold leading-[1.1] tracking-tight"
                  initial={{ y: 80 }}
                  animate={phase >= 3 ? { y: 0 } : {}}
                  transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="text-[#10b981]">Invest Smart.</span>
                </motion.h1>
              </div>
              <div className="overflow-hidden mt-1">
                <motion.h1
                  className="text-5xl md:text-7xl lg:text-8xl text-white font-display font-bold leading-[1.1] tracking-tight"
                  initial={{ y: 80 }}
                  animate={phase >= 3 ? { y: 0 } : {}}
                  transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  Lead Nepal.
                </motion.h1>
              </div>
            </motion.div>

            {/* Nepali Tagline */}
            <motion.p
              className="text-white/40 text-sm tracking-[0.15em] mb-8"
              initial={{ opacity: 0 }}
              animate={phase >= 3 ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              ठूलो सोच · स्मार्ट लगानी · नेपाल नेतृत्व
            </motion.p>
          </div>

          {/* Skip Button */}
          <motion.button
            className="absolute bottom-8 right-8 text-white/30 text-xs tracking-widest uppercase hover:text-white/60 transition-colors z-20"
            onClick={onComplete}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            Skip →
          </motion.button>

          {/* Progress Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="h-1 rounded-full"
                initial={{ width: 24, backgroundColor: 'rgba(255,255,255,0.1)' }}
                animate={
                  phase >= i
                    ? { width: 32, backgroundColor: '#10b981' }
                    : { width: 24, backgroundColor: 'rgba(255,255,255,0.1)' }
                }
                transition={{ duration: 0.4 }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
