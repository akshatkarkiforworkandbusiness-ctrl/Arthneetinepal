import { motion } from 'motion/react';
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Post {
  id: string;
  title: string;
  author: string;
  abstract?: string;
  content: string;
  type: string;
  category: string;
  pdfUrl?: string;
}

interface StockHistoryPoint {
  date: string;
  value: number;
}

interface StockItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  history: Record<string, StockHistoryPoint[]>;
}

const initialStocksData: Record<string, StockItem> = {
  NEPSE: {
    name: 'NEPSE Index',
    symbol: 'NEPSE',
    price: 2054.32,
    change: 18.42,
    changePercent: 0.90,
    history: {
      '1D': [
        { date: '11:00 AM', value: 2035.90 },
        { date: '11:30 AM', value: 2038.20 },
        { date: '12:00 PM', value: 2042.50 },
        { date: '12:30 PM', value: 2040.10 },
        { date: '1:00 PM', value: 2048.80 },
        { date: '1:30 PM', value: 2045.30 },
        { date: '2:00 PM', value: 2052.10 },
        { date: '2:30 PM', value: 2050.40 },
        { date: '3:00 PM', value: 2054.32 }
      ],
      '1W': [
        { date: 'Sun', value: 2012.40 },
        { date: 'Mon', value: 2024.15 },
        { date: 'Tue', value: 2018.90 },
        { date: 'Wed', value: 2030.50 },
        { date: 'Thu', value: 2054.32 }
      ],
      '1M': [
        { date: 'Week 1', value: 1980.50 },
        { date: 'Week 2', value: 1995.20 },
        { date: 'Week 3', value: 2035.40 },
        { date: 'Week 4', value: 2054.32 }
      ],
      '1Y': [
        { date: 'Jan', value: 1850.00 },
        { date: 'Apr', value: 1920.40 },
        { date: 'Jul', value: 2110.80 },
        { date: 'Oct', value: 2054.32 }
      ],
      'ALL': [
        { date: '2021', value: 2800.00 },
        { date: '2022', value: 2200.00 },
        { date: '2023', value: 1860.00 },
        { date: '2024', value: 2054.32 }
      ]
    }
  },
  NABIL: {
    name: 'Nabil Bank Limited',
    symbol: 'NABIL',
    price: 485.00,
    change: -2.50,
    changePercent: -0.51,
    history: {
      '1D': [
        { date: '11:00 AM', value: 487.50 },
        { date: '11:30 AM', value: 488.00 },
        { date: '12:00 PM', value: 486.20 },
        { date: '12:30 PM', value: 485.00 },
        { date: '1:00 PM', value: 486.00 },
        { date: '1:30 PM', value: 484.50 },
        { date: '2:00 PM', value: 483.20 },
        { date: '2:30 PM', value: 484.00 },
        { date: '3:00 PM', value: 485.00 }
      ],
      '1W': [
        { date: 'Sun', value: 492.00 },
        { date: 'Mon', value: 489.00 },
        { date: 'Tue', value: 488.50 },
        { date: 'Wed', value: 487.00 },
        { date: 'Thu', value: 485.00 }
      ],
      '1M': [
        { date: 'Week 1', value: 505.00 },
        { date: 'Week 2', value: 498.00 },
        { date: 'Week 3', value: 490.00 },
        { date: 'Week 4', value: 485.00 }
      ],
      '1Y': [
        { date: 'Jan', value: 540.00 },
        { date: 'Apr', value: 512.00 },
        { date: 'Jul', value: 495.00 },
        { date: 'Oct', value: 485.00 }
      ],
      'ALL': [
        { date: '2021', value: 920.00 },
        { date: '2022', value: 720.00 },
        { date: '2023', value: 580.00 },
        { date: '2024', value: 485.00 }
      ]
    }
  },
  GBIME: {
    name: 'Global IME Bank Limited',
    symbol: 'GBIME',
    price: 194.50,
    change: 1.20,
    changePercent: 0.62,
    history: {
      '1D': [
        { date: '11:00 AM', value: 193.30 },
        { date: '11:30 AM', value: 193.50 },
        { date: '12:00 PM', value: 194.00 },
        { date: '12:30 PM', value: 193.80 },
        { date: '1:00 PM', value: 194.10 },
        { date: '1:30 PM', value: 194.50 },
        { date: '2:00 PM', value: 194.20 },
        { date: '2:30 PM', value: 194.30 },
        { date: '3:00 PM', value: 194.50 }
      ],
      '1W': [
        { date: 'Sun', value: 191.00 },
        { date: 'Mon', value: 192.50 },
        { date: 'Tue', value: 193.00 },
        { date: 'Wed', value: 193.80 },
        { date: 'Thu', value: 194.50 }
      ],
      '1M': [
        { date: 'Week 1', value: 188.00 },
        { date: 'Week 2', value: 190.20 },
        { date: 'Week 3', value: 192.50 },
        { date: 'Week 4', value: 194.50 }
      ],
      '1Y': [
        { date: 'Jan', value: 175.00 },
        { date: 'Apr', value: 182.00 },
        { date: 'Jul', value: 190.00 },
        { date: 'Oct', value: 194.50 }
      ],
      'ALL': [
        { date: '2021', value: 290.00 },
        { date: '2022', value: 260.00 },
        { date: '2023', value: 185.00 },
        { date: '2024', value: 194.50 }
      ]
    }
  },
  UPPER: {
    name: 'Upper Tamakoshi Hydropower',
    symbol: 'UPPER',
    price: 312.00,
    change: 8.60,
    changePercent: 2.83,
    history: {
      '1D': [
        { date: '11:00 AM', value: 303.40 },
        { date: '11:30 AM', value: 305.00 },
        { date: '12:00 PM', value: 308.20 },
        { date: '12:30 PM', value: 307.00 },
        { date: '1:00 PM', value: 309.50 },
        { date: '1:30 PM', value: 310.00 },
        { date: '2:00 PM', value: 311.20 },
        { date: '2:30 PM', value: 310.50 },
        { date: '3:00 PM', value: 312.00 }
      ],
      '1W': [
        { date: 'Sun', value: 298.00 },
        { date: 'Mon', value: 302.00 },
        { date: 'Tue', value: 305.00 },
        { date: 'Wed', value: 307.50 },
        { date: 'Thu', value: 312.00 }
      ],
      '1M': [
        { date: 'Week 1', value: 285.00 },
        { date: 'Week 2', value: 294.00 },
        { date: 'Week 3', value: 302.00 },
        { date: 'Week 4', value: 312.00 }
      ],
      '1Y': [
        { date: 'Jan', value: 340.00 },
        { date: 'Apr', value: 320.00 },
        { date: 'Jul', value: 295.00 },
        { date: 'Oct', value: 312.00 }
      ],
      'ALL': [
        { date: '2021', value: 520.00 },
        { date: '2022', value: 480.00 },
        { date: '2023', value: 350.00 },
        { date: '2024', value: 312.00 }
      ]
    }
  }
};

const financialNews = [
  {
    title: 'Nepal Rastra Bank Issues Revised Guidelines on Microfinance Lending Limits',
    source: 'NRB Circular',
    time: '2 hours ago',
    url: 'https://www.nrb.org.np/'
  },
  {
    title: 'NEPSE Climbs to 2,054.32 points driven by commercial bank earnings',
    source: 'NEPSE Daily',
    time: '4 hours ago',
    url: '#'
  },
  {
    title: 'Upcoming Hydropower IPOs: What investors need to check before applying',
    source: 'Arthneeti Research',
    time: '1 day ago',
    url: '#'
  }
];

export default function ExplorePage() {
  const [researchPosts, setResearchPosts] = useState<Post[]>([]);
  const [stocks, setStocks] = useState<Record<string, StockItem>>(initialStocksData);
  const [selectedStockKey, setSelectedStockKey] = useState<string>('NEPSE');
  const [timeframe, setTimeframe] = useState<string>('1D');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Interactive coordinate hover states
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Firestore subscription for research posts
  useEffect(() => {
    const q = query(
      collection(db, 'posts'), 
      where('type', '==', 'research'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setResearchPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
    });
    return () => unsubscribe();
  }, []);

  // Simulate real-time stock price fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setStocks(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          const item = { ...next[key] };
          const drift = (Math.random() - 0.49) * (item.price * 0.001); // slight upward bias
          item.price = parseFloat((item.price + drift).toFixed(2));
          item.change = parseFloat((item.change + drift).toFixed(2));
          const basePrice = item.price - item.change;
          item.changePercent = parseFloat(((item.change / basePrice) * 100).toFixed(2));
          
          // Modify last point of 1D history to match current price
          const hist1D = [...item.history['1D']];
          if (hist1D.length > 0) {
            hist1D[hist1D.length - 1] = { 
              ...hist1D[hist1D.length - 1], 
              value: item.price 
            };
            item.history = {
              ...item.history,
              '1D': hist1D
            };
          }
          next[key] = item;
        });
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const activeStock = stocks[selectedStockKey];
  const activeHistory = activeStock.history[timeframe];
  
  // Determine return color values
  const isGainer = activeStock.change >= 0;
  const themeColor = isGainer ? '#10B981' : '#F43F5E'; // green-light / electric-mint
  const returnPrefix = isGainer ? '+' : '';

  // Get currently displayed price (either hovered coordinate or latest index price)
  const displayedPrice = hoverIndex !== null ? activeHistory[hoverIndex].value : activeStock.price;
  const displayedDate = hoverIndex !== null ? activeHistory[hoverIndex].date : 'Current Price';
  const pricePercentChange = hoverIndex !== null 
    ? parseFloat((((activeHistory[hoverIndex].value - activeHistory[0].value) / activeHistory[0].value) * 100).toFixed(2))
    : activeStock.changePercent;

  // Filter research posts
  const filteredPosts = researchPosts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    post.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 md:px-12 py-24 min-h-screen"
    >
      <header className="mb-12">
        <span className="text-[10px] font-black text-electric-mint mb-2 block uppercase tracking-[0.4em]">FINANCIAL INTELLIGENCE HUB</span>
        <h1 className="font-sans tracking-tight font-semibold text-5xl md:text-7xl text-white italic mb-8 tracking-tight">Discover</h1>
        
        <div className="relative max-w-2xl">
          <span className="absolute left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted">search</span>
          <input 
            type="text" 
            placeholder="Search NEPSE counters, research papers, and policy guidelines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#161F30] border border-[#1F2A3F] rounded-lg-[32px] px-16 py-5 text-sm focus:border-club-green outline-none shadow-xl text-white placeholder:text-text-muted/50 transition-all"
          />
        </div>
      </header>

      {/* Grid Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
        
        {/* Graph Widget (Col-span 8) */}
        <section className="lg:col-span-8 bg-[#161F30] border border-[#1F2A3F] rounded-lg-2xl p-6 md:p-8 flex flex-col justify-between shadow-2xl relative">
          
          {/* Header Info */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-2xl font-black text-white font-mono tracking-tight">{activeStock.symbol}</span>
                <Badge variant="outline" className="text-[10px] font-bold text-text-muted uppercase bg-[#0B0F19] px-2 py-0.5 rounded-lg border border-[#1F2A3F]">
                  {activeStock.name}
                </Badge>
              </div>
              <p className="text-xs text-text-muted uppercase tracking-wider">{displayedDate}</p>
            </div>
            
            <div className="text-right">
              <div className="text-4xl font-black font-mono text-white tracking-tight">
                Rs. {displayedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div 
                className="text-sm font-bold font-mono inline-flex items-center gap-1 mt-1" 
                style={{ color: pricePercentChange >= 0 ? '#10B981' : '#F43F5E' }}
              >
                <span className="material-symbols-outlined text-xs">
                  {pricePercentChange >= 0 ? 'arrow_upward' : 'arrow_downward'}
                </span>
                <span>{pricePercentChange >= 0 ? '+' : ''}{pricePercentChange}%</span>
              </div>
            </div>
          </div>

          {/* Timeframe selector */}
          <Tabs defaultValue="1D" value={timeframe} onValueChange={setTimeframe} className="mb-6">
            <TabsList className="flex border-b border-[#1F2A3F] pb-4 gap-2 bg-transparent p-0 rounded-lg-none w-full justify-start h-auto">
              {['1D', '1W', '1M', '1Y', 'ALL'].map((tf) => (
                <TabsTrigger
                  key={tf}
                  value={tf}
                  className="px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all text-text-muted hover:text-white hover:bg-[#0B0F19]/50 data-[state=active]:bg-club-green data-[state=active]:text-white data-[state=active]:shadow-lg dark:text-text-muted dark:hover:text-white dark:data-[state=active]:bg-club-green dark:data-[state=active]:text-white h-auto"
                >
                  {tf}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Graph Container */}
          <div className="relative w-full h-[240px] bg-[#0B0F19]/60 rounded-lg border border-[#1F2A3F] p-4 flex items-center justify-center">
            {activeHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={activeHistory}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  onMouseMove={(state) => {
                    if (state && state.activeTooltipIndex !== undefined && state.activeTooltipIndex !== null) {
                      setHoverIndex(state.activeTooltipIndex);
                    }
                  }}
                  onMouseLeave={() => setHoverIndex(null)}
                >
                  <XAxis 
                    dataKey="date" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }} 
                  />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#161F30', 
                      borderColor: '#1F2A3F', 
                      borderRadius: '8px',
                      color: '#FFF',
                      fontSize: '12px',
                      fontFamily: 'sans-serif'
                    }} 
                    itemStyle={{ color: themeColor }}
                    labelStyle={{ color: '#94A3B8', fontWeight: 'bold' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={themeColor} 
                    strokeWidth={2.5}
                    dot={false} 
                    activeDot={{ r: 6, fill: '#FFFFFF', stroke: themeColor, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-text-muted italic text-xs">
                Market data stream offline...
              </div>
            )}
          </div>

          <div className="flex justify-between items-center text-[10px] text-text-muted mt-4 font-mono">
            <span>{activeHistory[0]?.date || ''}</span>
            <span>Simulated feed • 5s delayed</span>
            <span>{activeHistory[activeHistory.length - 1]?.date || ''}</span>
          </div>
        </section>

        {/* Live Counters / Stocks Watchlist (Col-span 4) */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-[#161F30] border border-[#1F2A3F] rounded-lg-2xl p-6 shadow-2xl">
            <h3 className="text-sm font-black uppercase tracking-widest text-text-muted mb-6 flex items-center justify-between">
              NEPSE Watchlist
              <span className="material-symbols-outlined text-club-green text-lg">monitoring</span>
            </h3>
            
            <div className="flex flex-col gap-3">
              {Object.keys(stocks).map((key) => {
                const s = stocks[key];
                const changeSign = s.change >= 0 ? '+' : '';
                const activeState = selectedStockKey === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedStockKey(key);
                      setHoverIndex(null);
                    }}
                    className={`w-full text-left p-4 rounded-lg border transition-all duration-300 flex justify-between items-center ${
                      activeState 
                        ? 'bg-[#0B0F19] border-club-green shadow-lg' 
                        : 'bg-[#161F30] border-[#1F2A3F] hover:border-text-muted/30 hover:bg-[#0B0F19]/25'
                    }`}
                  >
                    <div>
                      <h4 className="text-sm font-black font-mono text-white">{s.symbol}</h4>
                      <p className="text-[10px] text-text-muted font-sans line-clamp-1">{s.name}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-black font-mono text-white">
                        {s.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                      <p 
                        className="text-[10px] font-bold font-mono flex items-center justify-end gap-0.5 mt-0.5"
                        style={{ color: s.change >= 0 ? '#10B981' : '#F43F5E' }}
                      >
                        {changeSign}{s.changePercent}%
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick News Portal */}
          <div className="bg-[#161F30] border border-[#1F2A3F] rounded-lg-2xl p-6 shadow-2xl">
            <h3 className="text-sm font-black uppercase tracking-widest text-text-muted mb-6 flex items-center justify-between">
              Macro Intelligence
              <span className="material-symbols-outlined text-electric-mint text-lg">campaign</span>
            </h3>
            
            <div className="flex flex-col gap-6">
              {financialNews.map((news, i) => (
                <a 
                  key={i} 
                  href={news.url}
                  target={news.url !== '#' ? '_blank' : undefined}
                  rel="noreferrer"
                  className="group block border-b border-[#1F2A3F] last:border-0 pb-4 last:pb-0"
                >
                  <h4 className="text-sm font-semibold leading-relaxed text-white group-hover:text-club-green transition-colors mb-2">
                    {news.title}
                  </h4>
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-text-muted">
                    <span>{news.source}</span>
                    <span>{news.time}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Main Grid Bottom: Research & Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Research Papers (Col-span 8) */}
        <section className="lg:col-span-8 space-y-8">
          <div className="flex justify-between items-end border-b border-[#1F2A3F] pb-4">
            <h2 className="font-sans tracking-tight font-semibold text-3xl text-white italic tracking-tight">Featured Research Papers</h2>
            <Link to="/community" className="text-[10px] font-black text-club-green uppercase tracking-widest hover:text-white transition-colors">
              VIEW DISCOURSE FEED
            </Link>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {filteredPosts.map(post => (
              <div key={post.id} className="bg-[#161F30] p-8 rounded-lg-2xl border border-[#1F2A3F] shadow-xl hover:border-club-green/50 transition-all duration-300 group">
                <div className="flex gap-3 mb-4 items-center">
                  <Badge variant="outline" className="bg-club-green/10 text-club-green px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border border-club-green/20">
                    {post.category}
                  </Badge>
                  <Badge variant="outline" className="text-[9px] font-black text-text-muted uppercase tracking-widest bg-transparent border-transparent">
                    Academic Analysis
                  </Badge>
                </div>
                
                <h3 className="font-sans tracking-tight font-semibold text-2xl text-white italic mb-4 group-hover:text-club-green transition-colors leading-tight">
                  {post.title}
                </h3>
                
                <p className="text-sm text-text-muted leading-relaxed italic mb-6">
                  {post.abstract || post.content.substring(0, 160) + '...'}
                </p>
                
                <div className="flex items-center justify-between border-t border-[#1F2A3F] pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-club-green/20 border border-club-green/40 rounded-lg flex items-center justify-center text-white font-black text-[10px] uppercase">
                      {post.author[0]}
                    </div>
                    <span className="text-xs font-black text-white tracking-tight uppercase">{post.author}</span>
                  </div>
                  
                  {post.pdfUrl && (
                    <a 
                      href={post.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-text-muted hover:text-club-green transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      Download PDF
                    </a>
                  )}
                </div>
              </div>
            ))}

            {filteredPosts.length === 0 && (
              <div className="text-center py-12 bg-[#161F30] rounded-lg-2xl border border-[#1F2A3F] border-dashed">
                <p className="text-text-muted italic text-xs">No matching research articles or papers found.</p>
              </div>
            )}
          </div>
        </section>

        {/* Side panels (Col-span 4) */}
        <aside className="lg:col-span-4 space-y-8">
          
          {/* Policy Center links */}
          <div className="bg-[#161F30] border border-[#1F2A3F] rounded-lg-2xl p-6 shadow-2xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-text-muted mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-electric-mint text-lg">gavel</span>
              NRB Policy Center
            </h3>
            
            <p className="text-xs text-text-muted leading-relaxed mb-6">
              Review direct regulatory notifications, financial accessibility schemes, and capital market policies governed by the Nepal Rastra Bank.
            </p>
            
            <div className="flex flex-col gap-3">
              <a 
                href="https://www.nrb.org.np/financial-literacy/" 
                target="_blank" 
                rel="noreferrer" 
                className="w-full text-center py-4 bg-[#0B0F19] hover:bg-[#0B0F19]/50 border border-[#1F2A3F] hover:border-club-green text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
              >
                NRB Literacy Hub
              </a>
              
              <a 
                href="https://www.nrb.org.np/category/monetary-policy/" 
                target="_blank" 
                rel="noreferrer"
                className="w-full text-center py-4 bg-transparent border border-[#1F2A3F] hover:border-club-green text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
              >
                Monetary Policy Reports
              </a>
            </div>
          </div>

          {/* Leading Contributor Tags */}
          <div className="bg-[#161F30] border border-[#1F2A3F] rounded-lg-2xl p-6 shadow-2xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-text-muted mb-6">
              Trending Sectors
            </h3>
            
            <div className="flex flex-wrap gap-2">
              {['Banking', 'Hydropower', 'Microfinance', 'IPO Market', 'Mutual Funds', 'Inflation', 'Remittance'].map((sec) => (
                <span 
                  key={sec} 
                  className="px-3.5 py-2 bg-[#0B0F19] border border-[#1F2A3F] text-white rounded-lg text-[9px] font-bold uppercase tracking-wider cursor-pointer hover:border-club-green/50 transition-all"
                >
                  {sec}
                </span>
              ))}
            </div>
          </div>

        </aside>
      </div>
    </motion.main>
  );
}
