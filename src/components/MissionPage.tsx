import { motion } from 'motion/react';
import LogoLoop from './LogoLoop';
import LiquidOcean from './LiquidOcean';

export default function AboutUsPage() {
  const values = [
    {
      nepali: 'ज्ञान',
      english: 'Knowledge First',
      desc: 'Real market understanding over surface-level finance tips. We teach how things actually work.'
    },
    {
      nepali: 'परिवर्तन',
      english: 'Change Starts Here',
      desc: 'Youth who think economically transform nations. Every session plants a seed of change.'
    },
    {
      nepali: 'समृद्धि',
      english: 'Prosperity for All',
      desc: 'Financial freedom is not a privilege — it is a skill. We make it accessible to every student.'
    },
    {
      nepali: 'उन्नति',
      english: 'Upward Always',
      desc: 'Continuous learning, compounding improvement. Like a good portfolio, we grow over time.'
    },
    {
      nepali: 'सहभागिता',
      english: 'Community-Driven',
      desc: 'We grow as a collective. Strong networks build stronger financial futures.'
    },
    {
      nepali: 'सत्य',
      english: 'Grounded in Truth',
      desc: 'No noise, no hype. Only evidence-based economic thinking that students can trust.'
    }
  ];

  const topics = [
    {
      id: '01',
      title: 'Financial Literacy',
      items: [
        'Saving & Budgeting: Rules of thumb for high schoolers',
        'Banking 101: Understanding types of accounts & interest',
        'The NRB System: Nepal Rastra Bank\'s role in our economy',
        'Digital Finance: Mobile banking, e-Sewa, Khalti safety'
      ]
    },
    {
      id: '02',
      title: 'Stock Market',
      items: [
        'NEPSE 101: How our stock exchange works',
        'The IPO Journey: How to apply & evaluate listings',
        'Fundamental Analysis: Reading balance sheets like a pro',
        'Technical Analysis: Indicators, charts, & market sentiment'
      ]
    },
    {
      id: '03',
      title: 'Economic Research',
      items: [
        'GDP & Policy: Impact of national policy on daily life',
        'Global Markets: How international events affect Nepal',
        'Research Methods: Gathering & analyzing economic data',
        'Public Speaking: Communicating research to leadership'
      ]
    }
  ];

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col bg-surface-base"
    >
      {/* Introduction */}
      <section className="relative min-h-[600px] flex items-center justify-center bg-black overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 z-0">
          <LiquidOcean />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-32 pointer-events-none">
          <span className="text-[10px] font-black text-electric-mint mb-8 block uppercase tracking-[0.4em]">INTRODUCING ARTHNEETI</span>
          <h1 className="text-5xl md:text-7xl text-white italic leading-tight mb-12 drop-shadow-2xl">Who We Are</h1>
          <div className="border-l-4 border-electric-mint pl-8 md:pl-12 py-6 backdrop-blur-md bg-black/40 rounded-r-2xl border border-white/5 shadow-2xl">
            <p className="text-xl md:text-2xl text-white/90 italic leading-relaxed font-sans tracking-tight font-semibold">
              "Arthneeti is a student-led collective dedicated to bringing real economic intelligence into the lives of Nepali youth. We believe that financial freedom isn't a gift — it's a skill that must be taught, practiced, and mastered. From school orientations to deep-dive research sessions, we are building Nepal's next generation of informed investors and economic leaders."
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-24">
          <div className="space-y-8">
            <h2 className="text-4xl text-slate-base">Our Mission</h2>
            <p className="text-electric-mint font-sans tracking-tight font-semibold text-2xl italic">"Empowering Nepal's next generation with real financial intelligence."</p>
            <p className="text-slate-base/60 leading-relaxed font-sans">
              To travel across Nepal, school by school, bringing interactive workshops and professional-grade financial education to every high school student regardless of their background.
            </p>
          </div>
          <div className="space-y-8">
            <h2 className="text-4xl text-slate-base">Our Vision</h2>
            <p className="text-club-green font-sans tracking-tight font-semibold text-2xl italic">"A Nepal where youth lead economic change, not follow it."</p>
            <p className="text-slate-base/60 leading-relaxed font-sans">
              Creating a community of thinkers who understand the mechanics of wealth, markets, and policy — ensuring Nepal's economic future is built on intelligence and foresight.
            </p>
          </div>
        </div>
      </section>

      {/* Values Grid (Animated Loop) */}
      <section className="py-32 bg-slate-raised overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-20">
          <h2 className="text-5xl text-slate-base text-center italic">Core Values</h2>
        </div>
        <div className="w-full">
          <LogoLoop
            logos={values}
            speed={60}
            gap={32}
            pauseOnHover={true}
            renderItem={(v: any) => (
              <div className="bg-white p-12 rounded-lg shadow-sm border border-slate-base/5 hover:border-club-green/30 transition-all w-[350px] h-full flex flex-col">
                <p className="text-4xl font-sans tracking-tight font-semibold text-electric-mint mb-4">{v.nepali}</p>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-base mb-6">{v.english}</h4>
                <p className="text-slate-base/60 text-sm italic font-sans leading-relaxed">{v.desc}</p>
              </div>
            )}
          />
        </div>
      </section>

      {/* What We Teach (Accordions) */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl text-slate-base mb-20 italic">What We Teach</h2>
          <div className="space-y-6">
            {topics.map((t) => (
              <div key={t.id} className="border-b border-[#1F2A3F] pb-8">
                <div className="flex items-center gap-6 mb-6">
                  <span className="text-electric-mint text-sm font-black tracking-widest">{t.id}</span>
                  <h3 className="text-3xl text-slate-base">{t.title}</h3>
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-12">
                  {t.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-text-muted text-sm font-sans">
                      <span className="text-electric-mint mt-1">→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How We Teach */}
      <section className="py-20 px-6 bg-slate-base text-white">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between gap-12">
          {[
            { icon: 'forum', text: 'Interactive & Discussion-Based', color: 'text-electric-mint' },
            { icon: 'location_on', text: 'Grounded in Nepal\'s Context', color: 'text-club-green' },
            { icon: 'trending_up', text: 'Progressive Modules', color: 'text-electric-mint' },
            { icon: 'school', text: 'Designed for High Schoolers', color: 'text-electric-mint' }
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center ${item.color}`}>
                <span className="material-symbols-outlined">{item.icon}</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Partner With Us */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-slate-raised rounded-lg-2xl overflow-hidden shadow-sm border border-[#1F2A3F] grid grid-cols-1 md:grid-cols-2">
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
