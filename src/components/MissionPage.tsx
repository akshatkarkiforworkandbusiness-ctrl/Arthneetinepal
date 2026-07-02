import { motion } from 'motion/react';

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5 } }
};

export default function MissionPage() {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col bg-[#0f1011]"
    >
      {/* Hero */}
      <section className="relative min-h-[600px] flex items-center justify-center bg-gradient-to-br from-[#0f1011] via-[#1a1528] to-[#0f1011] overflow-hidden border-b border-white/[0.06]">
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="tracked-label text-[#847dff] mb-8 block"
          >
            INTRODUCING ARTHNEETI
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-white leading-tight mb-8"
            style={{
              fontFamily: 'Playfair Display, serif',
              fontWeight: 300,
              fontSize: 'clamp(48px, 8vw, 80px)'
            }}
          >
            Who We Are
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-[#9f9fa0] leading-relaxed max-w-3xl mx-auto"
            style={{
              fontFamily: 'Playfair Display, serif',
              fontWeight: 300,
              fontSize: '18px'
            }}
          >
            "Arthneeti is a student-led collective dedicated to bringing real economic intelligence into the lives of Nepali youth. We believe that financial freedom isn't a gift — it's a skill."
          </motion.p>
        </div>
      </section>

      {/* Mission Pillars */}
      <section className="py-20 px-6 bg-[#090a0b]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2
              className="section-heading text-white mb-4"
              style={{
                fontFamily: 'Playfair Display, serif',
                fontWeight: 300,
                fontSize: 'clamp(32px, 5vw, 48px)'
              }}
            >
              Our Mission
            </h2>
            <p className="text-[#9f9fa0] max-w-xl text-lg" style={{ fontFamily: 'Playfair Display, serif', fontWeight: 300 }}>
              Three pillars guide everything we build and deliver.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Financial Literacy',
                description: 'Equipping students with the foundational knowledge to understand markets, money, and economic systems.'
              },
              {
                title: 'Real-World Exposure',
                description: 'Bridging classroom theory with practical experience through simulations, speakers, and live case studies.'
              },
              {
                title: 'Youth Empowerment',
                description: 'Creating a peer-driven ecosystem where young leaders take charge of their financial futures.'
              }
            ].map((pillar, index) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15, duration: 0.6 }}
                viewport={{ once: true, amount: 0.3 }}
                className="bg-[#0f1011] p-10 border border-white/[0.06] flex flex-col"
                style={{ borderRadius: '30px' }}
              >
                <span className="tracked-label text-[#847dff] mb-6 block">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3
                  className="text-white text-xl mb-4"
                  style={{ fontFamily: 'Playfair Display, serif', fontWeight: 300 }}
                >
                  {pillar.title}
                </h3>
                <p className="text-[#9f9fa0] text-sm leading-relaxed">
                  {pillar.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner With Us */}
      <section className="py-32 px-6 bg-[#0f1011]">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#090a0b] overflow-hidden border border-white/[0.06] grid grid-cols-1 md:grid-cols-2" style={{ borderRadius: '30px' }}>

            {/* What We Provide Column */}
            <div className="relative p-12 md:p-20 border-b md:border-b-0 md:border-r border-white/[0.06]">
              <span className="tracked-label text-[#847dff] mb-6 block">FOR SCHOOLS</span>
              <h2
                className="text-white text-3xl mb-8"
                style={{ fontFamily: 'Playfair Display, serif', fontWeight: 300 }}
              >
                What We Provide
              </h2>
              <motion.ul
                className="space-y-4"
                variants={listVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
              >
                {[
                  'Full session curriculum & materials',
                  'Professional guest speakers (optional)',
                  'Interactive tools & simulated markets',
                  'Continuous mentorship for students'
                ].map(item => (
                  <motion.li key={item} variants={itemVariants} className="flex items-center gap-3 text-[#9f9fa0] text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#847dff]" />
                    {item}
                  </motion.li>
                ))}
              </motion.ul>
            </div>

            {/* What We Need Column */}
            <div className="relative p-12 md:p-20">
              <span className="tracked-label text-[#847dff] mb-6 block">PARTNERSHIPS</span>
              <h2
                className="text-white text-3xl mb-8"
                style={{ fontFamily: 'Playfair Display, serif', fontWeight: 300 }}
              >
                What We Need From You
              </h2>
              <motion.ul
                className="space-y-4 mb-12"
                variants={listVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
              >
                {[
                  'A hall or classroom for the session',
                  'Projector & basic AV setup',
                  '1.5 - 2 hours of dedicated time',
                  'Enthusiastic students ready to learn!'
                ].map(item => (
                  <motion.li key={item} variants={itemVariants} className="flex items-center gap-3 text-[#9f9fa0] text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#847dff]" />
                    {item}
                  </motion.li>
                ))}
              </motion.ul>
              <motion.a
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                viewport={{ once: true }}
                href="mailto:learnarthneeti@gmail.com"
                className="btn-primary-pill inline-flex items-center gap-3 px-10 py-4 text-xs uppercase tracking-widest"
              >
                Get In Touch
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </motion.a>
            </div>

          </div>
        </div>
      </section>
    </motion.main>
  );
}
