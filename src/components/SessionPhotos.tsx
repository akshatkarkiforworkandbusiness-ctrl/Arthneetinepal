import { motion } from 'motion/react';

const sessions = [
  {
    id: 1,
    image: '/Pitcures for Arthneeti/Image 5 — Problem solving session.jpg',
    title: 'Problem Solving Session',
    titleNepali: 'समस्या समाधान कार्यशाला',
    location: 'Xavier A Levels, Kathmandu',
    quote: '"I never thought finance could be this fun!"',
    quoteNepali: '"मैले कहिल्यै सोचेको थिएन कि वित्त यति रमाइलो हुन सक्छ!"',
    featured: true
  },
  {
    id: 2,
    image: '/Pitcures for Arthneeti/Image 1 — Inaugural session (503020 Rule).jpg',
    title: 'Inaugural Session',
    titleNepali: 'उद्घाटन कार्यशाला',
    location: 'First Workshop',
    quote: '"Learning the 50/30/20 rule changed how I think about money."',
    quoteNepali: '"50/30/20 नियम सिक्दा मेरो पैसा बारेमा सोच्ने तरिका बदलियो।"',
    featured: false
  },
  {
    id: 3,
    image: '/Pitcures for Arthneeti/Image 3 — St. Lawrence School.png',
    title: 'St. Lawrence School',
    titleNepali: 'सेन्ट लारेन्स विद्यालय',
    location: 'Kathmandu',
    quote: '"Peer learning made complex topics simple."',
    quoteNepali: '"साथीहरूसँगको अध्ययनले जटिल विषयहरू सजिलो बनायो।"',
    featured: false
  },
  {
    id: 4,
    image: '/Pitcures for Arthneeti/Image 4 — Kathmandu Valley Public School.png',
    title: 'Kathmandu Valley Public School',
    titleNepali: 'काठमाडौं उपत्यका सार्वजनिक विद्यालय',
    location: 'Kathmandu',
    quote: '"Now I understand how banks actually work."',
    quoteNepali: '"अब म बुझ्छु कि बैंकहरू वास्तवमै कसरी काम गर्छन्।"',
    featured: false
  },
  {
    id: 5,
    image: '/Pitcures for Arthneeti/Image 6 — Think Big. Invest Smart. Lead Nepal..jpg',
    title: 'Interactive Workshop',
    titleNepali: 'अन्तरक्रियात्मक कार्यशाला',
    location: 'Multiple Schools',
    quote: '"The stock market simulation was eye-opening!"',
    quoteNepali: '"शेयर बजार सिमुलेशन आँखा खोल्ने थियो!"',
    featured: false
  }
];

export default function SessionPhotos() {
  const featured = sessions.find(s => s.featured);
  const others = sessions.filter(s => !s.featured);

  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-[10px] font-bold text-emerald-600 mb-3 block uppercase tracking-[0.3em]">
            Our Impact
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Sessions in Action
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Real photos from our workshops across Nepal. See the impact of financial literacy education.
          </p>
        </motion.div>

        {/* Photo Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Featured Photo - Large */}
          {featured && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="lg:col-span-7 relative group overflow-hidden rounded-2xl cursor-pointer"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img 
                  src={featured.image}
                  alt={featured.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-white/80 text-xs font-medium">{featured.location}</span>
                </div>
                <h3 className="text-white text-xl font-bold mb-1">{featured.title}</h3>
                <p className="text-white/70 text-sm mb-2" style={{ fontFamily: '"Noto Sans Devanagari", sans-serif' }}>
                  {featured.titleNepali}
                </p>
                <p className="text-white/90 text-sm italic">{featured.quote}</p>
              </div>
            </motion.div>
          )}

          {/* Other Photos - Grid */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            {others.slice(0, 4).map((session, idx) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative group overflow-hidden rounded-2xl cursor-pointer"
              >
                <div className="aspect-square overflow-hidden">
                  <img 
                    src={session.image}
                    alt={session.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-white/80 text-[10px] font-medium">{session.location}</span>
                  </div>
                  <h4 className="text-white text-sm font-bold mb-0.5">{session.title}</h4>
                  <p className="text-white/70 text-xs" style={{ fontFamily: '"Noto Sans Devanagari", sans-serif' }}>
                    {session.titleNepali}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { number: '500+', label: 'Students Trained', labelNepali: 'विद्यार्थीहरू प्रशिक्षित' },
            { number: '50+', label: 'Sessions Conducted', labelNepali: 'कार्यशालाहरू सञ्चालित' },
            { number: '12', label: 'Districts Covered', labelNepali: 'जिल्लाहरू समेटिएका' },
            { number: '6+', label: 'Schools Partnered', labelNepali: 'विद्यालयहरू साझेदार' }
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-5 rounded-xl border border-gray-200 text-center hover:shadow-md transition-shadow"
            >
              <p className="text-3xl font-bold text-emerald-600 mb-1">{stat.number}</p>
              <p className="text-sm text-gray-700 font-medium">{stat.label}</p>
              <p className="text-xs text-gray-500" style={{ fontFamily: '"Noto Sans Devanagari", sans-serif' }}>
                {stat.labelNepali}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
