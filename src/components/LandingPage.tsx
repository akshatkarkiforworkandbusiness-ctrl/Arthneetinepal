import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import ArthneetiTextAnimation from './ArthneetiTextAnimation';
import { RevealText } from './RevealText';

// Types and Mocks
interface Topic {
  id: string;
  title: string;
  author: string;
  category: string;
  likes: number;
}

interface IndexState {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  sparkline: number[];
}

const initialIndices: Record<string, IndexState> = {
  NEPSE: { name: 'NEPSE Index', value: 2054.32, change: 18.42, changePercent: 0.90, sparkline: [2032, 2038, 2045, 2040, 2048, 2045, 2051, 2049, 2054.32] },
  BANKING: { name: 'Banking Index', value: 1248.60, change: -5.20, changePercent: -0.41, sparkline: [1260, 1258, 1254, 1251, 1248, 1253, 1251, 1247, 1248.60] },
};

const pillarsSyllabus = [
  { num: '01', title: 'Financial Literacy', desc: 'Saving, budgeting, banking mechanisms.' },
  { num: '02', title: 'Stock Market & Investing', desc: 'NEPSE index, IPO applications, secondary trading.' },
  { num: '03', title: 'Economic & Policy Research', desc: 'National accounts, monetary policies, inflation.' }
];

export default function LandingPage() {
  const { user, handleJoinAction } = useAuth();
  const [latestTopics, setLatestTopics] = useState<Topic[]>([]);
  const [marketIndices, setMarketIndices] = useState<Record<string, IndexState>>(initialIndices);
  const [activePillarIndex, setActivePillarIndex] = useState<number | null>(0);

  // Firestore community updates
  useEffect(() => {
    const qLatest = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(3));
    const unsubscribeLatest = onSnapshot(qLatest, (snapshot) => {
      const topics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Topic[];
      setLatestTopics(topics);
    });
    return () => unsubscribeLatest();
  }, []);

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col bg-[#100904] text-[#ffedd7] font-['DM_Sans'] overflow-x-hidden"
    >
      {/* 1. HERO SECTION (Dark Studio Cinematic) */}
      <section className="relative w-full h-[100vh] flex flex-col justify-between p-8 md:p-12 lg:p-24 border-b border-dashed border-[#40372e]">
        {/* Top-Right Label */}
        <div className="absolute top-24 right-10 origin-bottom-right -rotate-90 text-[10px] uppercase tracking-widest text-[#6c5f51]">
          MODEL — ARTHNEETI 1.0
        </div>

        {/* Center Object */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <ArthneetiTextAnimation />
        </div>

        <div className="relative z-10 flex-grow flex flex-col justify-between h-full pointer-events-none">
          <div className="flex justify-end pt-12">
            {/* Body Copy Center-Right split */}
            <div className="max-w-md text-right pointer-events-auto">
              <p className="text-[18px] leading-[1.20] font-normal mb-8 text-[#ffedd7]/80">
                Building the next generation of economically literate leaders and investors across Nepal. A single dark studio canvas for pure focus.
              </p>
              
              {!user ? (
                <button 
                  onClick={handleJoinAction}
                  className="bg-[#382416] text-[#ffedd7] rounded-[36px] px-6 py-[14.4px] text-[14px] uppercase tracking-wide hover:border-[#dc5000] border border-transparent transition-all duration-300 shadow-none"
                >
                  <RevealText text="Join Arthneeti" />
                </button>
              ) : (
                <Link 
                  to="/profile" 
                  className="inline-block bg-[#382416] text-[#ffedd7] rounded-[36px] px-6 py-[14.4px] text-[14px] uppercase tracking-wide hover:border-[#dc5000] border border-transparent transition-all duration-300"
                >
                  <RevealText text="Go to Dashboard" />
                </Link>
              )}
            </div>
          </div>

          {/* Large Display Headline Bottom-Left */}
          <div className="mt-auto pointer-events-auto">
            <h1 className="text-[51px] md:text-[80px] font-medium leading-[0.90] tracking-normal mb-0 uppercase">
              <RevealText text="Think Big." delay={0.2} /><br />
              <RevealText text="Invest Smart." delay={0.5} /><br />
              <RevealText text="Lead Nepal." delay={0.8} />
            </h1>
          </div>
        </div>

        {/* Scroll Prompt */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-60">
          <span className="text-[10px] uppercase tracking-widest mb-2"><RevealText text="SCROLL TO CONTINUE" delay={1.5} /></span>
          <span className="material-symbols-outlined text-[16px] animate-bounce">expand_more</span>
        </div>
      </section>

      {/* 2. MARKET INDICES (Sparse) */}
      <section className="relative w-full min-h-[60vh] flex flex-col justify-center p-8 md:p-12 lg:p-24 border-b border-dashed border-[#40372e]">
        <div className="absolute top-24 right-10 origin-bottom-right -rotate-90 text-[10px] uppercase tracking-widest text-[#6c5f51]">
          DATA — LIVE MARKETS
        </div>

        <div className="flex flex-col md:flex-row justify-between items-end gap-12 w-full">
          <div className="flex-1">
             <h2 className="text-[41px] font-medium leading-[1] mb-12">
               MARKET TICKER
             </h2>
             <div className="flex flex-col gap-8 border-t border-dashed border-[#40372e] pt-8">
               {Object.keys(marketIndices).map(key => {
                 const item = marketIndices[key];
                 return (
                   <div key={key} className="flex justify-between items-baseline group">
                     <span className="text-[18px] uppercase">{item.name}</span>
                     <div className="text-right">
                       <span className="text-[29px] block leading-[1.09] font-medium">{item.value.toLocaleString()}</span>
                       <span className={`text-[14px] ${item.change >= 0 ? 'text-[#ffedd7]' : 'text-[#dc5000]'}`}>
                         {item.change >= 0 ? '+' : ''}{item.changePercent}%
                       </span>
                     </div>
                   </div>
                 )
               })}
             </div>
          </div>
          
          <div className="flex-1 max-w-sm ml-auto">
            <p className="text-[14px] text-[#6c5f51] leading-[1.33]">
              The Nepal Stock Exchange (NEPSE) data is tracked and analyzed here. We strip away the noise to present purely what matters.
            </p>
            <Link to="/discover" className="inline-block mt-8 text-[14px] border-b border-[#ffedd7] pb-1 hover:text-[#dc5000] hover:border-[#dc5000] transition-colors">
              Explore Ticker & Tools
            </Link>
          </div>
        </div>
      </section>

      {/* 3. CURRICULUM (Ghost Buttons & Text) */}
      <section className="relative w-full min-h-[80vh] flex flex-col justify-center p-8 md:p-12 lg:p-24 border-b border-dashed border-[#40372e]">
        <div className="absolute top-24 right-10 origin-bottom-right -rotate-90 text-[10px] uppercase tracking-widest text-[#6c5f51]">
          LEARN — ACADEMY
        </div>
        
        <div className="flex flex-col lg:flex-row gap-16 justify-between w-full h-full">
           <div className="w-full lg:w-1/2 flex flex-col justify-end">
             <h2 className="text-[51px] font-medium leading-[0.9] mb-12 max-w-lg">
                CURRICULUM ROADMAP
             </h2>
             <p className="text-[18px] text-[#ffedd7]/80 leading-[1.20] max-w-md mb-8">
                Explore the educational path designed to empower students with structural economic knowledge.
             </p>
             <Link 
                to="/learn" 
                className="inline-flex items-center justify-center bg-transparent text-[#ffedd7] border border-[#ffedd7] rounded-[22.5px] px-[16px] py-[7.5px] text-[12px] uppercase hover:border-[#dc5000] transition-colors self-start"
              >
                Start Learning Modules
             </Link>
           </div>

           <div className="w-full lg:w-1/2 flex flex-col gap-0 border-t border-dashed border-[#40372e]">
              {pillarsSyllabus.map((pillar, i) => (
                <button
                  key={pillar.title}
                  onClick={() => setActivePillarIndex(activePillarIndex === i ? null : i)}
                  className="w-full text-left py-8 border-b border-dashed border-[#40372e] flex flex-col hover:opacity-70 transition-opacity"
                >
                  <div className="flex justify-between items-baseline mb-4">
                    <span className="text-[24px] font-medium leading-[1.1]">{pillar.title}</span>
                    <span className="text-[14px] text-[#6c5f51]">{pillar.num}</span>
                  </div>
                  {activePillarIndex === i && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-[14px] text-[#ffedd7]/80 leading-[1.33] max-w-md mt-4"
                    >
                      {pillar.desc}
                    </motion.p>
                  )}
                </button>
              ))}
           </div>
        </div>
      </section>

      {/* 4. COMMUNITY (Sparse Cards) */}
      <section className="relative w-full min-h-[60vh] flex flex-col justify-center p-8 md:p-12 lg:p-24 pb-32">
        <div className="absolute top-24 right-10 origin-bottom-right -rotate-90 text-[10px] uppercase tracking-widest text-[#6c5f51]">
          SOCIAL — DISCUSSIONS
        </div>

        <h2 className="text-[41px] font-medium leading-[1] mb-16">
          COMMUNITY INSIGHTS
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[18px]">
          {latestTopics.map(topic => (
            <Link 
              key={topic.id} 
              to={`/community/${topic.id}`}
              className="block p-[24px] bg-transparent border border-[#ffedd7] rounded-[12px] hover:border-[#dc5000] transition-colors"
            >
              <span className="text-[10px] uppercase text-[#6c5f51] block mb-4">{topic.category}</span>
              <h3 className="text-[18px] leading-[1.20] font-medium mb-8">{topic.title}</h3>
              <div className="flex justify-between text-[14px] text-[#ffedd7]/60">
                <span>{topic.author}</span>
                <span>{topic.likes} Likes</span>
              </div>
            </Link>
          ))}
          {latestTopics.length === 0 && (
            <div className="col-span-3 text-center text-[#6c5f51] text-[14px] py-12">
              No recent community insights available.
            </div>
          )}
        </div>
      </section>
    </motion.main>
  );
}
