import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';

interface CinematicIntroProps {
  onComplete: () => void;
}

export default function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const [phase, setPhase] = useState(0);
  const [skipVisible, setSkipVisible] = useState(true);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),      // Fade in mountain silhouette
      setTimeout(() => setPhase(2), 2200),      // Show rising line
      setTimeout(() => setPhase(3), 3400),      // Reveal tagline
      setTimeout(() => setPhase(4), 5200),      // Show mission
      setTimeout(() => setPhase(5), 6800),      // Final fade to site
      setTimeout(() => onComplete(), 8200),     // Complete intro
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase < 5 && (
        <motion.div
          className="fixed inset-0 z-[200] bg-[#0f2a20] flex items-center justify-center overflow-hidden"
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Ambient Background Glow */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute w-[800px] h-[800px] rounded-full blur-[200px]"
              style={{ background: 'radial-gradient(circle, rgba(29,158,117,0.15) 0%, transparent 70%)' }}
              animate={{
                x: ['-20%', '10%', '-15%'],
                y: ['-10%', '5%', '-10%'],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          {/* Mountain Silhouette */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-[60%]"
            initial={{ opacity: 0, y: 100 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
          >
            <svg
              viewBox="0 0 1440 600"
              className="w-full h-full"
              preserveAspectRatio="xMidYMax slice"
            >
              <defs>
                <linearGradient id="mountainGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1D9E75" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#0f2a20" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="mountainGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0F6E56" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#0f2a20" stopOpacity="0.9" />
                </linearGradient>
              </defs>
              {/* Far mountains */}
              <motion.path
                d="M0,600 L0,400 Q200,280 400,350 Q600,200 800,300 Q1000,180 1200,280 Q1400,220 1440,250 L1440,600 Z"
                fill="url(#mountainGrad2)"
                initial={{ opacity: 0, y: 50 }}
                animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 2.5, delay: 0.3 }}
              />
              {/* Near mountains */}
              <motion.path
                d="M0,600 L0,450 Q180,350 350,400 Q500,280 720,380 Q900,250 1100,350 Q1300,280 1440,320 L1440,600 Z"
                fill="url(#mountainGrad1)"
                initial={{ opacity: 0, y: 80 }}
                animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 2, delay: 0.6 }}
              />
              {/* Rising chart line - symbolizes growth */}
              <motion.polyline
                points="100,500 300,420 500,440 700,320 900,280 1100,200 1300,120"
                fill="none"
                stroke="#1D9E75"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={phase >= 2 ? { pathLength: 1, opacity: 1 } : {}}
                transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
              />
              {/* Peak dot */}
              <motion.circle
                cx="1300"
                cy="120"
                r="6"
                fill="#5DCAA5"
                initial={{ scale: 0, opacity: 0 }}
                animate={phase >= 2 ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 0.6, delay: 2, type: 'spring', stiffness: 200 }}
              />
            </svg>
          </motion.div>

          {/* Content Overlay */}
          <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
            {/* Logo Mark */}
            <motion.div
              className="flex items-center justify-center gap-3 mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1, delay: 0.5 }}
            >
              <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
                <path d="M20 46 L32 24 L44 46Z" fill="#5DCAA5" opacity="0.6" />
                <polyline
                  points="14,44 24,36 32,38 40,26 50,18"
                  stroke="#5DCAA5"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <circle cx="50" cy="18" r="3" fill="#5DCAA5" />
              </svg>
              <span className="text-white/60 text-sm font-medium tracking-[0.3em] uppercase">
                Arthneeti
              </span>
            </motion.div>

            {/* Tagline - Cinematic Reveal */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0 }}
              animate={phase >= 3 ? { opacity: 1 } : {}}
              transition={{ duration: 0.5 }}
            >
              <div className="overflow-hidden">
                <motion.h1
                  className="text-5xl md:text-7xl lg:text-8xl text-white font-serif leading-[1.1] tracking-tight"
                  initial={{ y: 100 }}
                  animate={phase >= 3 ? { y: 0 } : {}}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                >
                  Think Big.
                </motion.h1>
              </div>
              <div className="overflow-hidden mt-2">
                <motion.h1
                  className="text-5xl md:text-7xl lg:text-8xl font-serif leading-[1.1] tracking-tight"
                  initial={{ y: 100 }}
                  animate={phase >= 3 ? { y: 0 } : {}}
                  transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="text-[#5DCAA5]">Invest Smart.</span>
                </motion.h1>
              </div>
              <div className="overflow-hidden mt-2">
                <motion.h1
                  className="text-5xl md:text-7xl lg:text-8xl text-white font-serif leading-[1.1] tracking-tight"
                  initial={{ y: 100 }}
                  animate={phase >= 3 ? { y: 0 } : {}}
                  transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  Lead Nepal.
                </motion.h1>
              </div>
            </motion.div>

            {/* Nepali Tagline */}
            <motion.p
              className="text-white/30 text-sm tracking-[0.2em] mb-12"
              initial={{ opacity: 0 }}
              animate={phase >= 3 ? { opacity: 1 } : {}}
              transition={{ duration: 1, delay: 1 }}
            >
              ठूलो सोच · स्मार्ट लगानी · नेपाल नेतृत्व
            </motion.p>

            {/* Mission Statement */}
            <motion.div
              className="max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={phase >= 4 ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1 }}
            >
              <p className="text-white/60 text-lg md:text-xl leading-relaxed">
                Building the next generation of economically literate leaders
                <span className="text-[#5DCAA5]"> across Nepal</span>
              </p>
            </motion.div>
          </div>

          {/* Skip Button */}
          {skipVisible && (
            <motion.button
              className="absolute bottom-8 right-8 text-white/30 text-xs tracking-widest uppercase hover:text-white/60 transition-colors"
              onClick={onComplete}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
            >
              Skip →
            </motion.button>
          )}

          {/* Progress Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="w-8 h-0.5 rounded-full"
                initial={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                animate={
                  phase >= i + 1
                    ? { backgroundColor: '#5DCAA5', scaleX: 1 }
                    : { backgroundColor: 'rgba(255,255,255,0.1)', scaleX: 0.5 }
                }
                transition={{ duration: 0.5 }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
