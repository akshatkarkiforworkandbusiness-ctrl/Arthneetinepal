import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Mail, Phone, Instagram, ChevronRight, ArrowUpRight } from 'lucide-react';
import Tagline3D from './Tagline3D';
import { 
  CORE_VALUES, 
  TEACHINGS, 
  BOARD_MEMBERS, 
  MISSION_VISION 
} from '../data/regionInfo';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: "easeOut" as const }
  }
};

const cardHover = {
  scale: 1.02,
  y: -8,
  transition: { duration: 0.3 }
};

const cardTap = {
  scale: 0.98
};

export default function MissionPage() {
  const [selectedCoreValue, setSelectedCoreValue] = useState<string | null>(null);
  const [selectedTeaching, setSelectedTeaching] = useState<string | null>(null);
  const [expandedMission, setExpandedMission] = useState(false);
  const [expandedVision, setExpandedVision] = useState(false);

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col bg-white text-gray-900 font-sans min-h-screen"
    >
      {/* --- HERO SECTION (3D Tagline with Mountain Background) --- */}
      <Tagline3D />

      {/* --- THREE REGIONS BACKGROUND SECTION --- */}
      <section className="relative py-24 px-6 bg-[#0f172a] overflow-hidden">
        {/* Mountain Silhouette Background */}
        <div className="absolute inset-0 pointer-events-none">
          <svg
            viewBox="0 0 1440 600"
            className="w-full h-full"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <linearGradient id="aboutTerai" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="aboutHilly" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="aboutHimalayan" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#047857" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0.5" />
              </linearGradient>
            </defs>

            {/* Terai */}
            <path
              d="M0,600 L0,480 Q360,460 720,470 Q1080,460 1440,480 L1440,600 Z"
              fill="url(#aboutTerai)"
            />

            {/* Hilly */}
            <path
              d="M0,600 L0,400 Q180,340 360,380 Q540,300 720,350 Q900,280 1080,330 Q1260,290 1440,360 L1440,600 Z"
              fill="url(#aboutHilly)"
            />

            {/* Himalayan */}
            <path
              d="M0,600 L0,320 Q120,180 240,260 Q360,120 480,220 Q600,80 720,180 Q840,60 960,150 Q1080,100 1200,200 Q1320,140 1440,280 L1440,600 Z"
              fill="url(#aboutHimalayan)"
            />
          </svg>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">About Arthneeti</h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Empowering Nepal's youth through financial literacy, from the Terai plains to the Himalayan peaks.
            </p>
          </motion.div>

          {/* Region Labels */}
          <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              { name: 'Terai', nameNp: 'तराई', desc: 'Southern Plains', color: '#847dff' },
              { name: 'Hilly', nameNp: 'पहाडी', desc: 'Central Midlands', color: '#3b82f6' },
              { name: 'Himalayan', nameNp: 'हिमाली', desc: 'Northern Peaks', color: '#003893' },
            ].map((region, idx) => (
              <motion.div
                key={region.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15, duration: 0.6 }}
                whileHover={cardHover}
                className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl text-center cursor-pointer"
              >
                <div 
                  className="w-3 h-3 rounded-full mx-auto mb-3"
                  style={{ backgroundColor: region.color }}
                />
                <h3 className="text-lg font-bold text-white mb-1">{region.name}</h3>
                <p className="text-white/40 text-sm">{region.nameNp}</p>
                <p className="text-white/50 text-xs mt-2">{region.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- MISSION & VISION --- */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Mission Card */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            whileHover={cardHover}
            whileTap={cardTap}
            onClick={() => setExpandedMission(!expandedMission)}
            className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-3xl border border-blue-200 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{MISSION_VISION.mission.title}</h2>
              <motion.div
                animate={{ rotate: expandedMission ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronRight className="w-6 h-6 text-blue-600" />
              </motion.div>
            </div>
            
            <p className="text-xl text-gray-700 font-medium mb-4">
              {MISSION_VISION.mission.subtitle}
            </p>

            <AnimatePresence>
              {expandedMission && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <p className="text-gray-600 leading-relaxed mt-4 pt-4 border-t border-blue-200">
                    {MISSION_VISION.mission.description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-6 flex items-center gap-2 text-sm text-blue-600 font-semibold group-hover:gap-3 transition-all">
              {expandedMission ? 'Show less' : 'Read more'} <ArrowUpRight className="w-4 h-4" />
            </div>
          </motion.div>

          {/* Vision Card */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            whileHover={cardHover}
            whileTap={cardTap}
            onClick={() => setExpandedVision(!expandedVision)}
            className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-3xl border border-blue-200 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{MISSION_VISION.vision.title}</h2>
              <motion.div
                animate={{ rotate: expandedVision ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronRight className="w-6 h-6 text-blue-600" />
              </motion.div>
            </div>
            
            <p className="text-xl text-gray-700 font-medium mb-4">
              {MISSION_VISION.vision.subtitle}
            </p>

            <AnimatePresence>
              {expandedVision && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <p className="text-gray-600 leading-relaxed mt-4 pt-4 border-t border-blue-200">
                    {MISSION_VISION.vision.description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-6 flex items-center gap-2 text-sm text-blue-600 font-semibold group-hover:gap-3 transition-all">
              {expandedVision ? 'Show less' : 'Read more'} <ArrowUpRight className="w-4 h-4" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- CORE VALUES --- */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Core Values</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              The principles that drive our community forward. Click each value to learn more.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {CORE_VALUES.map((value, idx) => (
              <motion.div
                key={value.title}
                variants={itemVariants}
                whileHover={cardHover}
                whileTap={cardTap}
                onClick={() => setSelectedCoreValue(selectedCoreValue === value.title ? null : value.title)}
                className="bg-white p-6 rounded-2xl border border-gray-200 cursor-pointer group relative overflow-hidden shadow-sm"
              >
                {/* Hover gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-3xl">{value.icon}</span>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{value.title}</h3>
                      <p className="text-sm text-blue-600 font-medium">{value.titleEnglish}</p>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm leading-relaxed">
                    {value.description}
                  </p>

                  <AnimatePresence>
                    {selectedCoreValue === value.title && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-gray-200"
                      >
                        <p className="text-xs text-gray-500">
                          This value guides everything we do at ArthNeeti, from our curriculum design to our community outreach programs.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* --- WHAT WE TEACH --- */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">What We Teach</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Comprehensive financial education designed for Nepal's youth. Click to explore each topic.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TEACHINGS.map((teaching, idx) => (
              <motion.div
                key={teaching.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                whileHover={cardHover}
                whileTap={cardTap}
                onClick={() => setSelectedTeaching(selectedTeaching === teaching.id ? null : teaching.id)}
                className={`bg-white p-8 rounded-3xl border-2 cursor-pointer transition-colors duration-300 ${
                  selectedTeaching === teaching.id 
                    ? 'border-blue-500 shadow-lg shadow-blue-500/10' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <span className="text-4xl mb-4 block">{teaching.icon}</span>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{teaching.title}</h3>
                <p className="text-gray-600 leading-relaxed mb-6">{teaching.description}</p>

                <AnimatePresence>
                  {selectedTeaching === teaching.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className="pt-4 border-t border-gray-200">
                        <p className="text-sm font-semibold text-gray-700 mb-3">Topics covered:</p>
                        <ul className="space-y-2">
                          {teaching.details.map((detail, detailIdx) => (
                            <motion.li
                              key={detailIdx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: detailIdx * 0.1 }}
                              className="flex items-center gap-2 text-sm text-gray-600"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              {detail}
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-blue-600 group-hover:gap-3 transition-all">
                  {selectedTeaching === teaching.id ? 'Show less' : 'Learn more'} <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-center mt-12"
          >
            <Link
              to="/learn"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30"
            >
              Start Learning <ChevronRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* --- BOARD OF DIRECTORS --- */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Board of Directors</h2>
            <p className="text-gray-600">The leaders behind Arthneeti's vision.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {BOARD_MEMBERS.map((member, idx) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                whileHover={cardHover}
                whileTap={cardTap}
                className="group text-center bg-white p-6 rounded-2xl border border-gray-200 cursor-pointer shadow-sm"
              >
                <div className="relative w-32 h-32 mx-auto mb-4 overflow-hidden rounded-full border-4 border-white shadow-lg">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=059669&color=fff&size=256&font-size=0.33`}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-blue-600 font-medium text-sm tracking-wide uppercase mb-2">{member.role}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CONTACT SECTION --- */}
      <section className="py-24 px-6 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Get In Touch</h2>
            <p className="text-gray-600 mb-12 max-w-2xl mx-auto">
              Have questions about our programs? Want to partner with us? 
              We'd love to hear from you.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <motion.a
                href="mailto:contact@arthneeti.com"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <Mail className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700">contact@arthneeti.com</span>
              </motion.a>

              <motion.a
                href="https://instagram.com/arthneeti"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <Instagram className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700">@arthneeti</span>
              </motion.a>

              <motion.a
                href="tel:+977-XXXXXXXXX"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <Phone className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700">+977-XXXXXXXXX</span>
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>
    </motion.main>
  );
}
