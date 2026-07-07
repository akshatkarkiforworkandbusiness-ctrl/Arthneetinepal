import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { BookOpen, TrendingUp, BarChart3, Clock, ChevronRight } from 'lucide-react';

const modules = [
  {
    id: 1,
    title: 'Financial Literacy',
    titleNepali: 'वित्तीय साक्षरता',
    icon: BookOpen,
    color: '#059669',
    bgColor: 'from-emerald-50 to-emerald-100',
    borderColor: 'border-emerald-200',
    hoverBorder: 'hover:border-emerald-400',
    duration: '4 Sessions',
    level: 'Beginner',
    topics: [
      'Personal Budgeting & 50/30/20 Rule',
      'Emergency Fund Building',
      'Banking Operations & Digital Payments',
      'NRB Financial Access Guidelines'
    ],
    description: 'Build the foundation of money management and smart saving habits.',
    descriptionNepali: 'पैसा व्यवस्थापन र बुद्धिमानी बचतका बानीहरूको आधार बनाउनुहोस्।'
  },
  {
    id: 2,
    title: 'Stock Market',
    titleNepali: 'शेयर बजार',
    icon: TrendingUp,
    color: '#0891b2',
    bgColor: 'from-cyan-50 to-cyan-100',
    borderColor: 'border-cyan-200',
    hoverBorder: 'hover:border-cyan-400',
    duration: '4 Sessions',
    level: 'Intermediate',
    topics: [
      'NEPSE Index & DEMAT Accounts',
      'IPO Application Process',
      'Reading Financial Statements',
      'Technical Analysis Basics'
    ],
    description: 'Navigate Nepal\'s stock market with confidence.',
    descriptionNepali: 'नेपालको शेयर बजारमा आत्मविश्वासका साथ नेभिगेट गर्नुहोस्।'
  },
  {
    id: 3,
    title: 'Economic Research',
    titleNepali: 'आर्थिक अनुसन्धान',
    icon: BarChart3,
    color: '#7c3aed',
    bgColor: 'from-violet-50 to-violet-100',
    borderColor: 'border-violet-200',
    hoverBorder: 'hover:border-violet-400',
    duration: '4 Sessions',
    level: 'Advanced',
    topics: [
      'GDP, Inflation & Monetary Systems',
      'NRB Monetary Policy Analysis',
      'Remittance Economy & Trade',
      'Research Methods & Report Writing'
    ],
    description: 'Think critically about economic policies and their impact.',
    descriptionNepali: 'आर्थिक नीतिहरू र तिनका प्रभावहरूबारे सोच्नुहोस्।'
  }
];

export default function CurriculumRoadmap() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-[10px] font-bold text-emerald-600 mb-3 block uppercase tracking-[0.3em]">
            Learning Path
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Curriculum Roadmap
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            A structured journey from financial basics to advanced economic thinking.
            Each module builds on the previous one.
          </p>
        </motion.div>

        {/* Visual Path Connection */}
        <div className="relative">
          {/* Connection Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-200 via-cyan-200 to-violet-200 -translate-y-1/2 z-0" />
          
          {/* Module Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
            {modules.map((module, idx) => {
              const Icon = module.icon;
              return (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15, duration: 0.5 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className={`bg-white p-6 rounded-2xl border-2 ${module.borderColor} ${module.hoverBorder} shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer`}
                >
                  {/* Module Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div 
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${module.bgColor} flex items-center justify-center`}
                    >
                      <Icon size={28} style={{ color: module.color }} />
                    </div>
                    <span 
                      className="text-xs font-bold px-3 py-1 rounded-full"
                      style={{ 
                        backgroundColor: `${module.color}15`,
                        color: module.color 
                      }}
                    >
                      Module {module.id}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{module.title}</h3>
                  <p className="text-sm text-gray-500 mb-3" style={{ fontFamily: '"Noto Sans Devanagari", sans-serif' }}>
                    {module.titleNepali}
                  </p>

                  {/* Description */}
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    {module.description}
                  </p>

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{module.duration}</span>
                    </div>
                    <div 
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      style={{ 
                        backgroundColor: `${module.color}10`,
                        color: module.color 
                      }}
                    >
                      {module.level}
                    </div>
                  </div>

                  {/* Topics Preview */}
                  <div className="space-y-2 mb-4">
                    {module.topics.slice(0, 3).map((topic, topicIdx) => (
                      <div key={topicIdx} className="flex items-start gap-2 text-sm text-gray-600">
                        <span 
                          className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor: module.color }}
                        />
                        <span>{topic}</span>
                      </div>
                    ))}
                    {module.topics.length > 3 && (
                      <p className="text-xs text-gray-400 ml-3.5">
                        +{module.topics.length - 3} more topics
                      </p>
                    )}
                  </div>

                  {/* CTA */}
                  <Link 
                    to="/learn"
                    className="flex items-center gap-1 text-sm font-semibold transition-all group-hover:gap-2"
                    style={{ color: module.color }}
                  >
                    Start Learning <ChevronRight size={16} />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link
            to="/learn"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
          >
            View Full Curriculum <ChevronRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
