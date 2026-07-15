import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

export const AmbientBackground: React.FC = () => {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div 
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-40 bg-[#F7FAF9]" 
        aria-hidden="true" 
      />
    );
  }

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#F7FAF9] opacity-70"
      aria-hidden="true"
    >
      {/* Soft gradient blob 1 - Club Green */}
      <motion.div
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 30, 0],
          scale: [1, 1.08, 0.95, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -top-[10%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-tr from-[#00875a]/10 via-[#00F59B]/5 to-transparent blur-3xl"
      />

      {/* Soft gradient blob 2 - Electric Mint Glow */}
      <motion.div
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 40, -40, 0],
          scale: [1, 0.92, 1.1, 1],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-[40%] -right-[15%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-bl from-[#00F59B]/10 via-[#00875a]/5 to-transparent blur-3xl"
      />

      {/* Subtle bottom accent mesh */}
      <motion.div
        animate={{
          x: [0, 30, -30, 0],
          y: [0, -20, 20, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -bottom-[20%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-t from-[#00875a]/8 via-[#EFF5F2] to-transparent blur-3xl"
      />

      {/* Ultra-fine grid texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage: `radial-gradient(#E1E8E4 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />
    </div>
  );
};

export default AmbientBackground;
