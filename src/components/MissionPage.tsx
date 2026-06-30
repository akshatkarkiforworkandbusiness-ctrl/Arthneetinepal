import { motion } from 'motion/react';
import About3DExperience from './About3DExperience';
import Hero3DObject from './Hero3DObject';

export default function AboutUsPage() {
  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col bg-surface-base"
    >
      {/* Introduction */}
      <section className="relative min-h-[600px] flex items-center justify-center bg-black overflow-hidden border-b border-white/10">
        <Hero3DObject />
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 pointer-events-none text-center">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-[10px] font-black text-electric-mint mb-8 block uppercase tracking-[0.4em]"
          >
            INTRODUCING ARTHNEETI
          </motion.span>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-5xl md:text-7xl text-white italic leading-tight mb-8 drop-shadow-2xl"
          >
            Who We Are
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-xl md:text-2xl text-white/90 italic leading-relaxed font-sans tracking-tight font-semibold max-w-3xl mx-auto drop-shadow-xl"
          >
            "Arthneeti is a student-led collective dedicated to bringing real economic intelligence into the lives of Nepali youth. We believe that financial freedom isn't a gift — it's a skill."
          </motion.p>
        </div>
      </section>

      {/* 3D Interactive Experience */}
      <section className="py-20 px-6 relative z-10 bg-surface-base">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-4xl md:text-5xl text-white italic mb-4 font-display">The Arthneeti Universe</h2>
              <p className="text-slate-400 font-sans max-w-xl">
                Explore our core pillars. Drag to rotate the universe and click on the floating nodes to dive deeper into our mission, values, and platform features.
              </p>
            </div>
          </div>
          
          <About3DExperience />
        </div>
      </section>

      {/* Partner With Us */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-slate-raised rounded-2xl overflow-hidden shadow-sm border border-[#1F2A3F] grid grid-cols-1 md:grid-cols-2">
            <div className="p-12 md:p-20 border-b md:border-b-0 md:border-r border-[#1F2A3F]">
              <h2 className="text-4xl text-slate-base mb-8">What We Provide</h2>
              <ul className="space-y-4">
                {[
                  'Full session curriculum & materials',
                  'Professional guest speakers (optional)',
                  'Interactive tools & simulated markets',
                  'Continuous mentorship for students'
                ].map(item => (
                  <li key={item} className="flex items-center gap-3 text-text-muted font-sans italic">
                    <div className="w-1.5 h-1.5 bg-electric-mint rounded-lg" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-12 md:p-20 relative overflow-hidden">
               <h2 className="text-4xl text-slate-base mb-8">What We Need From You</h2>
               <ul className="space-y-4 mb-12">
                {[
                  'A hall or classroom for the session',
                  'Projector & basic AV setup',
                  '1.5 - 2 hours of dedicated time',
                  'Enthusiastic students ready to learn!'
                ].map(item => (
                  <li key={item} className="flex items-center gap-3 text-text-muted font-sans italic">
                    <div className="w-1.5 h-1.5 bg-electric-mint rounded-lg" />
                    {item}
                  </li>
                ))}
              </ul>
              <a 
                href="mailto:learnarthneeti@gmail.com"
                className="inline-flex items-center gap-3 bg-electric-mint text-slate-base px-10 py-4 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-white hover:text-electric-mint transition-all"
              >
                Get In Touch <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </motion.main>
  );
}
