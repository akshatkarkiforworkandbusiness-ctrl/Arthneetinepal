import { motion } from 'motion/react';
import { Mail } from 'lucide-react';

export default function BoardPage() {
  const members = [
    {
      name: 'Akshat Karki',
      role: 'President',
      email: 'akshatkarkiforwork.and.business@gmail.com',
      bio: "Leading Arthneeti's vision to build Nepal's most impactful youth financial education movement. Focused on school partnerships, club strategy, and driving the mission forward."
    },
    {
      name: 'Manash Koirala',
      role: 'Vice President',
      email: 'manashkoirala19@gmail.com',
      bio: "Supporting club operations and co-leading educational strategy. Passionate about making stock market knowledge accessible to every Nepali high schooler."
    },
    {
      name: 'Ujjwal Dhungana',
      role: 'Head of Research & Communication',
      email: 'dhunganaujjwal94@gmail.com',
      bio: "Driving Arthneeti's research agenda and external communications. Builds the intellectual content that makes our sessions substantive and credible."
    },
    {
      name: 'Pranjal Khatiwada',
      role: 'Secretary',
      email: 'pranjalkhatiwada17@gmail.com',
      bio: "Managing club coordination, records, and logistics. Ensures Arthneeti runs smoothly across all schools and sessions."
    }
  ];

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="py-32 px-6"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <span className="text-[10px] font-black text-brand-emerald mb-4 block uppercase tracking-[0.4em]">LEADERSHIP</span>
          <h1 className="text-6xl md:text-8xl text-text-primary italic mb-8 font-sans tracking-tight font-semibold">Executive Board</h1>
          <p className="text-text-muted max-w-xl mx-auto italic font-sans">
            The founding team driving the movement for financial intelligence in Nepal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-32">
          {members.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-10 rounded-lg relative border-t-8 border-brand-emerald shadow-2xl flex flex-col items-center text-center group hover:-translate-y-2 transition-all duration-500"
            >
              <div className="w-24 h-24 rounded-lg border-4 border-white/10 flex items-center justify-center text-white font-sans tracking-tight font-semibold italic text-4xl mb-8 group-hover:border-brand-emerald group-hover:text-brand-emerald transition-all duration-500">
                {member.name.split(' ').map(n => n[0]).join('')}
              </div>
              <h3 className="text-2xl text-white font-sans tracking-tight font-semibold italic mb-2">{member.name}</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-emerald mb-6">{member.role}</p>
              <p className="text-white/60 text-xs italic font-sans leading-relaxed mb-6">
                {member.bio}
              </p>
              <a 
                href={`mailto:${member.email}`}
                className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-brand-emerald transition-colors"
              >
                Get In Touch
              </a>
            </motion.div>
          ))}
        </div>

        <section className="bg-surface-raised p-12 md:p-24 rounded-lg-2xl text-center border border-surface-high">
          <h2 className="text-4xl text-text-primary mb-8 italic">Contact the Club</h2>
          <p className="text-text-muted mb-12 font-sans italic">Have specific questions about school partnerships or partnerships?</p>
          <a 
            href="mailto:learnarthneeti@gmail.com"
            className="inline-flex items-center gap-4 bg-white text-white px-12 py-5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-brand-emerald transition-all shadow-xl"
          >
            <Mail size={24} className="text-brand-emerald" />
            learnarthneeti@gmail.com
          </a>
        </section>
      </div>
    </motion.main>
  );
}
