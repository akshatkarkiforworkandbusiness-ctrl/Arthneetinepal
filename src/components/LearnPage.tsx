import { motion } from 'motion/react';
import { useState } from 'react';

interface Guidebook {
  title: string;
  category: string;
  size: string;
  language: string;
  readingTime: string;
  description: string;
  htmlUrl: string;
  pdfUrl: string;
  chapters: string[];
}

export default function LearnPage() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const guidebooks: Guidebook[] = [
    {
      title: 'Stock Market Investing in Practice — A NEPSE Guide',
      category: 'Syllabus Guide',
      size: '833 KB (PDF)',
      language: 'English',
      readingTime: '2 hours',
      description: 'A ground-up practical guide to investing in the Nepal Stock Exchange (NEPSE). Specially tailored for students with no prior finance background, using real Nepalese companies (like NABIL and UPPER) and local market mechanics.',
      htmlUrl: '/nepse-investing-guide.html',
      pdfUrl: '/nepse-investing-guide.pdf',
      chapters: [
        'Module 1: Introduction to NEPSE & Market Infrastructure (SEBON, CDSC)',
        'Module 2: Shares, IPOs (ASBA/MeroShare) & Secondary Market Trading',
        'Module 3: Stock Charts & Technical Analysis (Candlesticks, Moving Averages, RSI)',
        'Module 4: Fundamental Stock Valuation (Balance Sheets, EPS, PE Ratios)',
        'Module 5: Portfolio Allocation & NEPSE-Specific Risk Management',
        'Module 6: Paper Trading Protocol & Watchlist Strategy'
      ]
    },
    {
      title: 'Financial Literacy Guide — Nepal (Rastra Bank Syllabus)',
      category: 'National Curriculum',
      size: '484 KB (PDF)',
      language: 'Nepali / English',
      readingTime: '1.5 hours',
      description: 'The official financial literacy curriculum aligned with Nepal Rastra Bank guidelines. Covers household financial planning, bank accounts, interest calculations, loan types, and digital banking safety directives.',
      htmlUrl: '/nepal_financial_literacy_curriculum.html',
      pdfUrl: '/nepal_financial_literacy_curriculum.pdf',
      chapters: [
        'Chapter 1: Money, Budgeting, and Financial Goal Planning',
        'Chapter 2: Financial Institutions & Banking Services in Nepal',
        'Chapter 3: Understanding Bank Deposits, Interest Rates & Inflation',
        'Chapter 4: Loan Types, Debt Management, and Credit Score Basics',
        'Chapter 5: Digital Banking (ConnectIPS, Mobile Banking) & Fraud Prevention',
        'Chapter 6: Central Banking Role & Nepal Rastra Bank Regulations'
      ]
    },
    {
      title: 'Arthneeti — Economic Research Guidebook',
      category: 'Research Guidebook',
      size: '948 KB (PDF)',
      language: 'English',
      readingTime: '3 hours',
      description: 'An advanced economics guidebook detailing study frameworks, macroeconomic indicators, national accounts, and monetary policy analytics. Designed for students seeking to conduct economic research papers.',
      htmlUrl: '/arthneeti-economics-guidebook.html',
      pdfUrl: '/arthneeti-economics-guidebook.pdf',
      chapters: [
        'Chapter 1: Macroeconomics Core: GDP, Inflation & Monetary Systems',
        'Chapter 2: Microeconomic Concepts: Consumer Choice, Supply & Demand',
        'Chapter 3: Central Banking Mechanics: Cash Reserve Ratio & SLR Policy',
        'Chapter 4: International Trade, Remittance, & Balance of Payments in Nepal',
        'Chapter 5: Designing Surveys, Field Research Methods & Data Analysis',
        'Chapter 6: Drafting Substantive Policy Reports and Economic Papers'
      ]
    }
  ];

  const filteredGuides = guidebooks.filter(guide => 
    guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guide.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guide.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-6 py-24 min-h-screen"
    >
      <header className="mb-16">
        <span className="text-[10px] font-black text-crimson mb-2 block uppercase tracking-[0.4em]">ARTHNEETI ACADEMY</span>
        <h1 className="font-display text-5xl md:text-7xl text-white italic mb-8 tracking-tight">Learn</h1>
        <p className="text-text-muted text-sm md:text-base max-w-2xl leading-relaxed mb-8">
          Access our ground-up curricular resources, official central bank syllabuses, and stock market checklists. Explore chapters online or download their official PDF forms.
        </p>

        <div className="relative max-w-xl">
          <span className="absolute left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted">search</span>
          <input 
            type="text" 
            placeholder="Search learning guidebooks and modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#161F30] border border-[#1F2A3F] rounded-[32px] px-16 py-5 text-sm focus:border-royal outline-none shadow-xl text-white placeholder:text-text-muted/50 transition-all"
          />
        </div>
      </header>

      {/* Guidebook Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-24">
        {filteredGuides.map((guide, idx) => {
          const isOpen = expandedIndex === idx;
          return (
            <motion.div
              key={idx}
              layout
              className="bg-[#161F30] border border-[#1F2A3F] rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group hover:border-royal/40 transition-all duration-300"
            >
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className="bg-royal/10 text-royal text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-royal/20">
                    {guide.category}
                  </span>
                  <span className="text-[9px] font-bold font-mono text-text-muted bg-[#0B0F19] px-2.5 py-1 rounded border border-[#1F2A3F]">
                    {guide.size}
                  </span>
                </div>

                <h3 className="font-display text-2xl text-white italic leading-tight mb-4 group-hover:text-royal transition-colors">
                  {guide.title}
                </h3>

                <p className="text-xs text-text-muted leading-relaxed mb-6">
                  {guide.description}
                </p>

                {/* Metadata Row */}
                <div className="flex gap-4 border-y border-[#1F2A3F] py-4 mb-6 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  <div>Lang: <span className="text-white">{guide.language}</span></div>
                  <div>Time: <span className="text-white">{guide.readingTime}</span></div>
                </div>

                {/* Collapsible Syllabus Index */}
                <div className="mb-8">
                  <button
                    onClick={() => setExpandedIndex(isOpen ? null : idx)}
                    className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-text-muted hover:text-white transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {isOpen ? 'expand_less' : 'expand_more'}
                    </span>
                    {isOpen ? 'Hide Syllabus Chapters' : 'View Syllabus Chapters'}
                  </button>

                  {isOpen && (
                    <motion.ul 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 space-y-3 pl-3 border-l border-royal/30"
                    >
                      {guide.chapters.map((chap, cIdx) => (
                        <li key={cIdx} className="text-xs text-text-muted leading-relaxed font-sans">
                          {chap}
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <a
                  href={guide.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-4 bg-crimson hover:bg-white hover:text-crimson text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  Download PDF Guide
                </a>

                <a
                  href={guide.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-4 bg-[#0B0F19] hover:bg-[#0B0F19]/50 border border-[#1F2A3F] hover:border-royal text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">menu_book</span>
                  Read Online (HTML)
                </a>
              </div>
            </motion.div>
          );
        })}

        {filteredGuides.length === 0 && (
          <div className="col-span-full text-center py-20 bg-[#161F30] rounded-3xl border border-[#1F2A3F] border-dashed">
            <p className="text-text-muted italic text-xs">No matching guides found. Try searching for "NEPSE", "NRB", or "Economics".</p>
          </div>
        )}
      </div>
    </motion.main>
  );
}
