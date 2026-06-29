import { motion } from 'motion/react';

export default function ArthneetiTextAnimation() {
  const text = "ARTHNEETI";
  
  return (
    <div className="relative flex justify-center items-center h-24 md:h-32 mb-10 mt-4" style={{ perspective: '1000px' }}>
      <motion.div
        animate={{ 
          rotateX: [10, 20, 10], 
          rotateY: [-20, -10, -20],
          y: [-10, 10, -10]
        }}
        transition={{ 
          duration: 5, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative flex items-center justify-center"
      >
        {/* Shadow */}
        <span 
          className="absolute text-5xl md:text-[6rem] font-black tracking-[0.2em] opacity-30 blur-md pointer-events-none"
          style={{ transform: 'translateZ(-50px) translateY(20px)', color: '#00ffaa' }}
        >
          {text}
        </span>
        {/* Layer 4 */}
        <span 
          className="absolute text-5xl md:text-[6rem] font-black tracking-[0.2em] pointer-events-none"
          style={{ transform: 'translateZ(-30px)', color: '#031414', WebkitTextStroke: '1px #062b2b' }}
        >
          {text}
        </span>
        {/* Layer 3 */}
        <span 
          className="absolute text-5xl md:text-[6rem] font-black tracking-[0.2em] pointer-events-none"
          style={{ transform: 'translateZ(-20px)', color: '#062b2b', WebkitTextStroke: '1px #0a4d4d' }}
        >
          {text}
        </span>
        {/* Layer 2 */}
        <span 
          className="absolute text-5xl md:text-[6rem] font-black tracking-[0.2em] pointer-events-none"
          style={{ transform: 'translateZ(-10px)', color: '#0a4d4d', WebkitTextStroke: '1px #00ffaa' }}
        >
          {text}
        </span>
        {/* Layer 1 (Top) */}
        <span 
          className="relative text-5xl md:text-[6rem] font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-tr from-electric-mint via-white to-electric-mint pointer-events-none"
          style={{ 
            transform: 'translateZ(0px)',
            filter: 'drop-shadow(0 0 15px rgba(0,255,170,0.4))'
          }}
        >
          {text}
        </span>
      </motion.div>
    </div>
  );
}
