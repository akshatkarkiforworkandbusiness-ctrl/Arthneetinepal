import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Mail, Phone, Instagram, ChevronRight, Users, ArrowUpRight } from 'lucide-react';
import NepalMap3D from './NepalMap3D';
import { 
  REGION_DETAILS, 
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
    transition: { duration: 0.6, ease: "easeOut" }
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
      {/* --- HERO SECTION (3D Nepal Map) --- */}
      <section className="py-12 px-6 bg-gradient-to-b from-[#F0FDF4] to-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
              Explore <span className="text-[#34D399]">Nepal</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover the three regions that make up our beautiful country. 
              Click on each region to learn more.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <NepalMap3D />
          </motion.div>
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
            className="bg-gradient-to-br from-[#F0FDF4] to-white p-8 rounded-3xl border border-[#D1FAE5] cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{MISSION_VISION.mission.title}</h2>
              <motion.div
                animate={{ rotate: expandedMission ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronRight className="w-6 h-6 text-[#34D399]" />
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
                  <p className="text-gray-600 leading-relaxed mt-4 pt-4 border-t border-[#D1FAE5]">
                    {MISSION_VISION.mission.description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-6 flex items-center gap-2 text-sm text-[#34D399] font-semibold group-hover:gap-3 transition-all">
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
            className="bg-gradient-to-br from-[#ECFDF5] to-white p-8 rounded-3xl border border-[#A7F3D0] cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{MISSION_VISION.vision.title}</h2>
              <motion.div
                animate={{ rotate: expandedVision ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronRight className="w-6 h-6 text-[#34D399]" />
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
                  <p className="text-gray-600 leading-relaxed mt-4 pt-4 border-t border-[#A7F3D0]">
                    {MISSION_VISION.vision.description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-6 flex items-center gap-2 text-sm text-[#34D399] font-semibold group-hover:gap-3 transition-all">
              {expandedVision ? 'Show less' : 'Read more'} <ArrowUpRight className="w-4 h-4" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- CORE VALUES --- */}
      <section className="py-24 px-6 bg-[#F9FAFB]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Core Values</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
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
                className="bg-white p-6 rounded-2xl border border-gray-100 cursor-pointer group relative overflow-hidden"
              >
                {/* Hover gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#F0FDF4] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-3xl">{value.icon}</span>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{value.title}</h3>
                      <p className="text-sm text-[#34D399] font-medium">{value.titleEnglish}</p>
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
                        className="mt-4 pt-4 border-t border-gray-100"
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
            <p className="text-gray-500 max-w-2xl mx-auto">
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
                    ? 'border-[#34D399] shadow-lg shadow-[#34D399]/10' 
                    : 'border-gray-100 hover:border-[#D1FAE5]'
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
                      <div className="pt-4 border-t border-gray-100">
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
                              <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                              {detail}
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-[#34D399] group-hover:gap-3 transition-all">
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
              className="inline-flex items-center gap-2 bg-[#34D399] text-white px-8 py-4 rounded-full font-semibold hover:bg-[#2DD4BF] transition-colors shadow-lg shadow-[#34D399]/30"
            >
              Start Learning <ChevronRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* --- BOARD OF DIRECTORS --- */}
      <section className="py-24 px-6 bg-[#F9FAFB]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Board of Directors</h2>
            <p className="text-gray-500">The leaders behind Arthneeti's vision.</p>
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
                className="group text-center bg-white p-6 rounded-2xl border border-gray-100 cursor-pointer"
              >
                <div className="relative w-32 h-32 mx-auto mb-4 overflow-hidden rounded-full border-4 border-white shadow-lg">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=6EE7B7&color=fff&size=256&font-size=0.33`}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-[#34D399] font-medium text-sm tracking-wide uppercase mb-2">{member.role}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CONTACT SECTION --- */}
      <section className="py-24 px-6 bg-gradient-to-b from-white to-[#F0FDF4]">
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
                <Mail className="w-5 h-5 text-[#34D399]" />
                <span className="text-gray-700">contact@arthneeti.com</span>
              </motion.a>

              <motion.a
                href="https://instagram.com/arthneeti"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <Instagram className="w-5 h-5 text-[#34D399]" />
                <span className="text-gray-700">@arthneeti</span>
              </motion.a>

              <motion.a
                href="tel:+977-XXXXXXXXX"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <Phone className="w-5 h-5 text-[#34D399]" />
                <span className="text-gray-700">+977-XXXXXXXXX</span>
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>
    </motion.main>
  );
}
