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
          className="absolute text-5xl md:text-[6rem] font-medium tracking-normal opacity-40 blur-lg pointer-events-none"
          style={{ transform: 'translateZ(-50px) translateY(20px)', color: '#dc5000' }}
        >
          {text}
        </span>
        {/* Layer 4 */}
        <span 
          className="absolute text-5xl md:text-[6rem] font-medium tracking-normal pointer-events-none"
          style={{ transform: 'translateZ(-30px)', color: '#100904', WebkitTextStroke: '1px #382416' }}
        >
          {text}
        </span>
        {/* Layer 3 */}
        <span 
          className="absolute text-5xl md:text-[6rem] font-medium tracking-normal pointer-events-none"
          style={{ transform: 'translateZ(-20px)', color: '#382416', WebkitTextStroke: '1px #40372e' }}
        >
          {text}
        </span>
        {/* Layer 2 */}
        <span 
          className="absolute text-5xl md:text-[6rem] font-medium tracking-normal pointer-events-none"
          style={{ transform: 'translateZ(-10px)', color: '#40372e', WebkitTextStroke: '1px #6c5f51' }}
        >
          {text}
        </span>
        {/* Layer 1 (Top) */}
        <span 
          className="relative text-5xl md:text-[6rem] font-medium tracking-normal text-[#ffedd7] pointer-events-none"
          style={{ 
            transform: 'translateZ(0px)'
          }}
        >
          {text}
        </span>
      </motion.div>
    </div>
  );
}
