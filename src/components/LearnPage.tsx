import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FAQ {
  question: string;
  answer: string;
  topic: string;
}

interface Lesson {
  id: string;
  title: string;
  desc: string;
  duration: string;
  tag: string;
  videoUrl: string;
  thumbnail: string;
  chapters: string[];
  faqs?: FAQ[];
}

interface Guide {
  id: string;
  title: string;
  category: string;
  language: string;
  readingTime: string;
  description: string;
  htmlUrl: string;
  pdfUrl: string;
  chapters: string[];
}

// ─── Data ────────────────────────────────────────────────────────────────────

const LESSONS: Lesson[] = [
  {
    id: 'demystifying-nepse',
    title: 'Demystifying NEPSE',
    desc: 'A fast, clear walkthrough of how Nepal\'s stock market actually works — from SEBON and CDSC to IPO lotteries, settlement cycles, and why diversification matters.',
    duration: '8:00',
    tag: 'Stock Market',
    videoUrl: 'https://www.youtube.com/embed/QZuAJB-sPEQ',
    thumbnail: 'https://img.youtube.com/vi/QZuAJB-sPEQ/hqdefault.jpg',
    chapters: [
      'Core infrastructure: SEBON, NEPSE, and CDSC explained',
      'Primary markets, IPOs, and the ASBA application system',
      'Secondary market trading mechanics and the T+3 settlement cycle',
      'Bonus shares vs right shares — what actually changes your wealth',
      'Sector concentration risk: banking, hydropower, and why diversification matters',
    ],
    faqs: [
      {
        topic: 'Stock Market',
        question: 'What exactly is NEPSE, and how does it work?',
        answer: 'NEPSE (Nepal Stock Exchange) is the country\'s sole stock exchange, acting as the centralized electronic marketplace where buyers and sellers trade shares of public companies. It is regulated by the Securities Board of Nepal (SEBON), which acts as the capital market police by approving IPOs and licensing brokers.',
      },
      {
        topic: 'Stock Market',
        question: 'What is the difference between the primary market and the secondary market?',
        answer: 'The primary market is where a company issues shares to the general public for the very first time through an Initial Public Offering (IPO). The secondary market is where those shares are continuously traded between investors after the IPO has been completed and the company is listed on the exchange.',
      },
      {
        topic: 'Stock Market',
        question: 'What do I need to start investing in Nepal?',
        answer: 'You need three specific accounts: a Demat Account (a digital account opened via CDSC to securely hold your shares electronically), a MeroShare Account (an online portal linked to your Demat account used to apply for IPOs and track your portfolio), and a Broker Account (a trading account with a SEBON-licensed stockbroker, giving you access to NEPSE\'s secondary market).',
      },
      {
        topic: 'Stock Market',
        question: 'What is ASBA and why do I need a CRN number?',
        answer: 'ASBA (Application Supported by Blocked Amount) is a system used during IPO applications where your bank simply "blocks" the application money in your account instead of deducting it. Your money continues to earn interest and is only deducted if you win the IPO lottery. To use this system, your bank verifies your Demat account and gives you a C-ASBA Registration Number (CRN), required to submit your IPO application.',
      },
      {
        topic: 'Stock Market',
        question: 'I keep hearing about "Bonus Shares" and "Right Shares". What are they?',
        answer: 'Bonus shares are extra shares given to you for free instead of a cash dividend. When bonus shares are issued, the share price proportionally adjusts downward (e.g., halving in a 1:1 bonus), meaning your total wealth stays exactly the same. Right shares are an offer to existing shareholders to buy new shares at a steep discount, usually at the standard face value of NPR 100, even if the current market price is much higher.',
      },
      {
        topic: 'Stock Market',
        question: 'What are the trading hours and how long does it take to get my shares?',
        answer: 'NEPSE\'s secondary market is open Sunday to Thursday, between 11:00 AM and 3:00 PM. Nepal uses a T+3 settlement cycle — if you purchase shares today, they will officially arrive in your Demat account exactly 3 working days later.',
      },
      {
        topic: 'Stock Market',
        question: 'What are the main costs and taxes involved in trading?',
        answer: 'You pay a brokerage fee ranging from 0.40% to 1.50% depending on transaction size. You also pay Capital Gains Tax (CGT) on profits: 5% if you hold shares for more than a year, and 7.5% if you sell within a year. There is also a 5% tax deducted at the source on any dividends you receive.',
      },
      {
        topic: 'Stock Market',
        question: 'What are the safest or most popular sectors to invest in on NEPSE?',
        answer: 'Commercial Banking is the most dominant sector, making up about 50% of total market capitalization, and is heavily influenced by Nepal Rastra Bank\'s monetary policies. Hydropower is another major sector, driven by long-term energy demand and Power Purchase Agreements. It\'s risky to put all your money in one sector — true safety comes from diversifying your portfolio across multiple sectors.',
      },
      {
        topic: 'Stock Market',
        question: 'How do I know if a company is good to invest in?',
        answer: 'Look at fundamental financial metrics like Earnings Per Share (EPS) — how much profit the company makes per share, the Price-to-Earnings (P/E) Ratio — how much you\'re paying for each rupee of profit, and Return on Equity (ROE) — how efficiently the company generates profit. For banks specifically, the Non-Performing Loan (NPL) Ratio is critical, as a high NPL means too many of the bank\'s loans are going bad.',
      },
      {
        topic: 'Stock Market',
        question: 'What is a "Circuit Breaker" and how does it protect the market?',
        answer: 'A circuit breaker is an automatic trading halt designed to stop extreme panic or euphoria. For individual stocks, NEPSE enforces a daily price band where a stock cannot rise or fall more than 10% in a single session. For the overall market, if the NEPSE index moves ±5% in the first two hours of trading, the market pauses for 15 minutes — and if it hits a ±8% swing at any point, the entire market closes for the rest of the day.',
      },
    ],
  },
  {
    id: 'nrb-monetary-policy',
    title: 'Nepal Rastra Bank Monetary Policy & NEPSE Impact',
    desc: 'Deep-dive into bank interest rates, liquidity constraints, credit-to-deposit ratios, and how NRB policy decisions move the NEPSE index.',
    duration: '19:40',
    tag: 'Policy & Economics',
    videoUrl: 'https://www.youtube.com/embed/vOenP8oQ_oI',
    thumbnail: 'https://img.youtube.com/vi/vOenP8oQ_oI/hqdefault.jpg',
    chapters: [
      'What is monetary policy and why it matters for investors',
      'Cash Reserve Ratio (CRR) and Statutory Liquidity Ratio (SLR)',
      'How bank rate adjustments affect loan availability',
      'Credit-to-Deposit (CD) ratio and market liquidity',
      'Reading the NRB monetary policy report',
    ],
  },
  {
    id: 'technical-analysis',
    title: 'Stock Selection & Technical Analysis for Beginners',
    desc: 'Learn to read candlestick charts, identify support and resistance levels, and use moving averages to find stock entry points on NEPSE.',
    duration: '18:02',
    tag: 'Technical Analysis',
    videoUrl: 'https://www.youtube.com/embed/q6g4V52u1O8',
    thumbnail: 'https://img.youtube.com/vi/q6g4V52u1O8/hqdefault.jpg',
    chapters: [
      'Candlestick basics: bullish vs bearish patterns',
      'Support, resistance, and trend lines',
      'Simple Moving Averages (SMA) and EMA crossovers',
      'RSI: identifying overbought and oversold conditions',
      'Building a basic NEPSE watchlist strategy',
    ],
  },
  {
    id: 'budgeting-emergency-fund',
    title: 'Budgeting, Saving & Building Financial Resilience',
    desc: 'The 50/30/20 rule, compound interest vs inflation, SMART financial goals, responsible borrowing, and how NRB policy reaches your personal wallet.',
    duration: '9:30',
    tag: 'Financial Literacy',
    videoUrl: 'https://www.youtube.com/embed/REFRRa9CtS4',
    thumbnail: 'https://img.youtube.com/vi/REFRRa9CtS4/hqdefault.jpg',
    chapters: [
      'The 50/30/20 budgeting rule and building an emergency fund',
      'Compound interest vs inflation — the two forces shaping your wealth',
      'Calculating net worth and setting SMART financial goals',
      'Responsible borrowing, EMIs, and Nepal\'s Credit Information Bureau (CIB)',
      'How NRB policy decisions and deposit insurance affect your money',
    ],
    faqs: [
      {
        topic: 'Financial Literacy',
        question: 'What is the 50/30/20 budgeting rule, and how can it be applied in Nepal?',
        answer: 'The 50/30/20 rule recommends allocating 50% of your income to needs (rent, food, transport), 30% to wants (eating out, entertainment), and 20% to savings and investments. For example, on a Rs. 40,000 monthly income in Kathmandu, that\'s Rs. 20,000 on essentials, Rs. 12,000 on lifestyle, and Rs. 8,000 saved. In high-cost areas you might adjust to 60/20/20 — the key is consistency, not the exact ratio.',
      },
      {
        topic: 'Financial Literacy',
        question: 'What is the difference between simple and compound interest?',
        answer: 'Simple interest is calculated only on your original principal amount. Compound interest is calculated on the principal plus all interest already earned, so it grows exponentially over time. Rs. 1,00,000 at 8% simple interest over 10 years grows to Rs. 1,80,000 — the same amount at compound interest grows to Rs. 2,15,892.',
      },
      {
        topic: 'Financial Literacy',
        question: 'How do I set SMART financial goals?',
        answer: 'Vague goals like "I want to save money" usually fail. SMART goals are Specific, Measurable, Achievable, Relevant, and Time-bound. For example: "I want to save Rs. 2,40,000 in 24 months for a motorcycle by depositing Rs. 10,000 per month in a fixed deposit at 9% interest."',
      },
      {
        topic: 'Financial Literacy',
        question: 'Why is an emergency fund so important, and how much should it be?',
        answer: 'An emergency fund protects you from unexpected crises like job loss or medical emergencies without forcing you to sell long-term investments. Your target should be 3 to 6 months of essential living expenses, kept in a separate, easily accessible savings account.',
      },
      {
        topic: 'Financial Literacy',
        question: 'How does inflation affect my savings hidden at home?',
        answer: 'Inflation is a "silent tax" that reduces the purchasing power of your money over time. Keeping large amounts of cash hidden at home is financially harmful in the long run because it loses value. To protect your wealth, your money needs to earn a return higher than Nepal\'s inflation rate — known as the "real return."',
      },
      {
        topic: 'Financial Literacy',
        question: 'What is a Systematic Investment Plan (SIP) and why does it work?',
        answer: 'A SIP involves investing a fixed amount every month — into mutual funds, for example — regardless of market conditions. This uses rupee-cost averaging: you automatically buy more units when prices are low and fewer when prices are high, lowering your average cost over time while leveraging compounding for long-term wealth.',
      },
      {
        topic: 'Financial Literacy',
        question: 'What is Net Worth and why does it matter more than income?',
        answer: 'Net Worth is your Total Assets (what you own) minus your Total Liabilities (what you owe). It\'s the true scorecard of financial health — a high-earning person with massive debt can have a lower net worth than a modest earner with no debt and steady savings. Tracking and growing net worth matters more than focusing on monthly salary alone.',
      },
      {
        topic: 'Financial Literacy',
        question: 'How does my borrowing history affect my future in Nepal?',
        answer: 'Nepal\'s Credit Information Bureau (CIB) tracks your borrowing history. Missing loan payments or defaulting builds a poor credit record, making it harder and more expensive to borrow from banks in the future. Build a positive history by borrowing only what you can afford and paying on time.',
      },
      {
        topic: 'Financial Literacy',
        question: 'How do decisions made by Nepal Rastra Bank (NRB) affect my wallet?',
        answer: 'NRB is Nepal\'s central bank and sets monetary policy. When NRB raises the Policy Rate (the benchmark interest rate), commercial banks typically raise the rates they charge on loans (increasing your EMIs) and the rates they pay on deposits. Watching NRB policy helps you anticipate whether borrowing will get cheaper or more expensive.',
      },
      {
        topic: 'Financial Literacy',
        question: 'Are my bank deposits safe if a bank fails in Nepal?',
        answer: 'Yes, up to a limit. Deposits up to Rs. 5,00,000 per depositor per licensed commercial bank are insured by the Deposit and Credit Guarantee Corporation (DCGC). This protection does not fully apply to unregulated schemes or cooperatives, which is why keeping large sums in cooperatives carries higher risk.',
      },
    ],
  },
  {
    id: 'monetary-policy-2026',
    title: 'Monetary Policy 2026: NRB\'s Cautiously Accommodative Stance',
    desc: 'Why NRB cut rates while credit demand stays subdued, the currency peg and the Impossible Trinity, NFRS 9 reporting changes, and the push toward digital banking.',
    duration: '10:15',
    tag: 'Policy & Economics',
    videoUrl: 'https://www.youtube.com/embed/DL6voss9Cuc',
    thumbnail: 'https://img.youtube.com/vi/DL6voss9Cuc/hqdefault.jpg',
    chapters: [
      'The "cautiously accommodative" stance — why NRB cut the policy rate to 4.5%',
      'The currency peg, the Indian Rupee, and the Impossible Trinity',
      'The liquidity-credit paradox: why low rates haven\'t spurred borrowing',
      'Working capital loan reforms and restructuring for struggling businesses',
      'NFRS 9, Expected Credit Loss, and Nepal\'s shift to a Central Bank Digital Currency',
    ],
    faqs: [
      {
        topic: 'Policy & Economics',
        question: 'What is the current monetary policy stance of the Nepal Rastra Bank (NRB) and why?',
        answer: 'NRB has adopted a "cautiously accommodative" stance — making it easier and cheaper to borrow money to support economic recovery and expand credit to the private sector. This is possible now because the macroeconomic environment is favorable, with low inflation and highly comfortable foreign exchange reserves.',
      },
      {
        topic: 'Policy & Economics',
        question: 'How has the NRB changed key interest rates to help the economy?',
        answer: 'The bank rate (upper limit of the interest rate corridor) was reduced from 6.5% to 6.0%, and the policy rate was lowered from 5.0% to 4.5%. The deposit collection rate (lower bound) was reduced to 2.75%. These reductions lower the cost of borrowing for both businesses and the government.',
      },
      {
        topic: 'Policy & Economics',
        question: 'If banks have plenty of liquidity and interest rates are low, why aren\'t businesses borrowing more?',
        answer: 'This is a major paradox in the current Nepali economy. Despite excess liquidity and policy easing, private sector credit demand remains heavily subdued — driven by a broader economic slowdown over the past two years that weakened business confidence and slowed capital formation. Lower borrowing costs alone haven\'t been enough to spark widespread investment.',
      },
      {
        topic: 'Policy & Economics',
        question: 'Why are Nepal\'s foreign exchange reserves currently so high?',
        answer: 'Reserves have surged to cover approximately 14.7 months of merchandise and services imports, primarily driven by elevated remittance inflows, an increase in tourist arrivals, and a slight rebound in exports.',
      },
      {
        topic: 'Policy & Economics',
        question: 'Why is the Nepali Rupee pegged to the Indian Rupee, and could Nepal un-peg it?',
        answer: 'The peg acts as a "nominal anchor," effectively importing price stability and monetary discipline from India. Due to the "Impossible Trinity," Nepal sacrifices independent monetary policy in exchange for exchange rate stability and financial openness with India. Un-pegging now is risky since Nepal\'s economy is consumption-driven, relies heavily on remittances over exports, and conducts nearly 70% of its trade with India.',
      },
      {
        topic: 'Policy & Economics',
        question: 'What is inflation like in Nepal right now, and what is NRB\'s target?',
        answer: 'Inflation has dropped to 2.72% year-on-year, well below NRB\'s target of around 5.0%. This decline is due to improved domestic agricultural production, a smooth supply chain, stabilized international crude oil prices, and declining inflation in neighboring India.',
      },
      {
        topic: 'Policy & Economics',
        question: 'What is NFRS 9, and how will it change how Nepali banks report their income?',
        answer: 'NFRS 9 (Nepal Financial Reporting Standards 9) introduces a new way for banks to recognize interest income based on the Expected Credit Loss (ECL) model. Over a three-year transition ending FY 2083/84 (2026/27), banks must shift to the Effective Interest Rate (EIR) method. For highly risky or non-performing loans (Stage 3), banks will only recognize interest on a strict cash basis, giving a more conservative and realistic view of a bank\'s health.',
      },
      {
        topic: 'Policy & Economics',
        question: 'How is the NRB helping struggling businesses manage their debts?',
        answer: 'NRB revised its working capital loan guidelines, moving away from 3–10 year term loans toward periodic loans based on cash-flow analysis. For borrowers facing unforeseen hardships — such as earthquake-affected areas or highway-displaced businesses — NRB allows banks to restructure or reschedule existing loans, provided the borrower repays at least 10% of accrued interest.',
      },
      {
        topic: 'Policy & Economics',
        question: 'What is an Asset Management Company (AMC) and why does Nepal need one?',
        answer: 'An AMC is a specialized institution created to manage and resolve bad debts. NRB is drafting laws to establish one to handle rising non-performing loans (NPLs) and non-banking assets — NPLs rose to 5.24% amid the recent slowdown. An AMC would clear these distressed assets from banks\' balance sheets, freeing up capital to lend to healthy businesses.',
      },
      {
        topic: 'Policy & Economics',
        question: 'Is Nepal moving towards modern digital banking and digital currencies?',
        answer: 'Yes. NRB has established a digital finance innovation hub and is preparing infrastructure to fully operationalize the National Payment Switch. The government and NRB are also creating frameworks for branchless "Neobanks," and NRB has prepared a study report on a Central Bank Digital Currency (CBDC), currently under discussion.',
      },
    ],
  },
  {
    id: 'ssa-reality',
    title: 'SSA and Its Reality: Nepal\'s Social Security Allowance',
    desc: 'How Nepal\'s constitutionally guaranteed cash transfer program actually reaches — and sometimes fails — its 3.8 million beneficiaries. Based on original Arthneeti research.',
    duration: '9:45',
    tag: 'Research',
    videoUrl: 'https://www.youtube.com/embed/pJdnY0Hx1kI',
    thumbnail: 'https://img.youtube.com/vi/pJdnY0Hx1kI/hqdefault.jpg',
    chapters: [
      'Evolution of SSA: from a 1994/95 flat pension to a NPR 109 billion program',
      'Socio-economic impact — dignity, decision-making power, and consumption smoothing',
      'Structural bottlenecks: ghost names, informal sector exclusion, rural delivery gaps',
      'Demographic pressure and the question of long-term financial sustainability',
      'Reform pathways: Integrated Social Registry, NID linkage, and agent banking',
    ],
    faqs: [
      {
        topic: 'Research',
        question: 'What is Nepal\'s Social Security Allowance (SSA) and who are its main beneficiaries?',
        answer: 'The SSA is a constitutionally guaranteed, non-contributory cash transfer program aimed at protecting vulnerable populations. Primary beneficiaries include senior citizens, single women/widows, persons with disabilities, endangered ethnicities, and children from marginalized communities.',
      },
      {
        topic: 'Research',
        question: 'When did the SSA program begin, and how did it start?',
        answer: 'The program was first introduced in the mid-1990s (1994/95) as a universal flat pension of Rs. 100 per month for elderly citizens aged 75 and above. Over the years it has expanded to include other vulnerable groups, and the age thresholds have been lowered.',
      },
      {
        topic: 'Research',
        question: 'What is the current age eligibility for the old-age allowance?',
        answer: 'The general age threshold has fluctuated, recently set at 68 years (lowered from 70). As a measure of social equity, the threshold is lower — 60 years — for Dalits and citizens living in the remote Karnali zone.',
      },
      {
        topic: 'Research',
        question: 'How much financial support do beneficiaries receive?',
        answer: 'The allowance started at Rs. 100 and was later raised to Rs. 500 per month. Currently, eligible elderly citizens receive NPR 4,000 monthly, while Dalits and Karnali residents aged 60–68 receive NPR 2,600 monthly. Fully disabled individuals and endangered ethnicities also receive specific monthly transfers depending on classification.',
      },
      {
        topic: 'Research',
        question: 'How does the SSA impact the daily lives and dignity of beneficiaries?',
        answer: 'The allowance plays a critical role in consumption smoothing and reducing financial dependency on family members. Beneficiaries report that receiving it increases their self-respect, boosts their involvement in household decision-making, and allows greater participation in social and religious activities.',
      },
      {
        topic: 'Research',
        question: 'What do beneficiaries primarily spend their allowance on?',
        answer: 'A vast majority use their allowance to meet essential personal and household needs. The top expenditures are healthcare and medicines (79%), food (58%), tea/snacks (52%), and clothing (49%). Some beneficiaries also use the funds to support family members, such as grandchildren.',
      },
      {
        topic: 'Research',
        question: 'What are the biggest administrative challenges and "leakages" in the SSA program?',
        answer: 'The program suffers from severe delivery inconsistencies and fragmented institutional coordination. A major issue is "ghost names" — allowances distributed to individuals who have already died or migrated, due to poor record-updating and delayed vital registration. Rural beneficiaries also often face lengthy, physically demanding travel times to collect their funds.',
      },
      {
        topic: 'Research',
        question: 'Are workers in the informal economy covered by this social security system?',
        answer: 'A significant coverage gap exists for the informal sector. Although informal workers make up over 84% to 96% of Nepal\'s total labor force, they are largely excluded from the purview of formal social security benefits.',
      },
      {
        topic: 'Research',
        question: 'Why are economic experts worried about the financial sustainability of the SSA?',
        answer: 'The financial burden is growing rapidly — estimated at NPR 109 billion (about 5.5% of the federal budget) for FY 2025/2026. Experts warn that lowering the eligibility age to 68, combined with a growing aging population and increased life expectancy, makes the current non-contributory distribution model financially unsustainable without careful reform.',
      },
      {
        topic: 'Research',
        question: 'What modern reforms are being proposed to fix the delivery and efficiency of the SSA?',
        answer: 'The government is transitioning toward digital solutions like the Integrated Social Registry (ISR) linked to the National Identity (NID) system to overcome geographic barriers and eliminate fraud. Policymakers are also expanding agent banking and home delivery models to transfer funds electronically and directly to disabled and remote beneficiaries without requiring travel.',
      },
    ],
  },
];

const GUIDES: Guide[] = [
  {
    id: 'nepse-guide',
    title: 'Stock Market Investing in Practice',
    category: 'Syllabus Guide',
    language: 'English',
    readingTime: '2 hrs',
    description: 'A ground-up practical guide to investing in NEPSE. Uses real Nepali companies and local market mechanics. Built for students with no prior finance background.',
    htmlUrl: '/nepse-investing-guide.html',
    pdfUrl: '/nepse-investing-guide.pdf',
    chapters: [
      'Introduction to NEPSE & Market Infrastructure',
      'Shares, IPOs & Secondary Market Trading',
      'Stock Charts & Technical Analysis',
      'Fundamental Stock Valuation',
      'Portfolio Allocation & Risk Management',
      'Paper Trading Protocol & Watchlist Strategy',
    ],
  },
  {
    id: 'financial-literacy',
    title: 'Financial Literacy — Nepal (NRB Syllabus)',
    category: 'National Curriculum',
    language: 'Nepali / English',
    readingTime: '1.5 hrs',
    description: 'Official financial literacy curriculum aligned with Nepal Rastra Bank guidelines. Covers household budgeting, banking, loans, and digital payment safety.',
    htmlUrl: '/nepal_financial_literacy_curriculum.html',
    pdfUrl: '/nepal_financial_literacy_curriculum.pdf',
    chapters: [
      'Money, Budgeting & Financial Goal Planning',
      'Financial Institutions & Banking Services in Nepal',
      'Bank Deposits, Interest Rates & Inflation',
      'Loan Types, Debt Management & Credit Basics',
      'Digital Banking & Fraud Prevention',
      'Central Banking Role & NRB Regulations',
    ],
  },
  {
    id: 'economics-guidebook',
    title: 'Arthneeti — Economic Research Guidebook',
    category: 'Research Guidebook',
    language: 'English',
    readingTime: '3 hrs',
    description: 'Advanced economics guidebook for students conducting economic research. Covers macroeconomic indicators, national accounts, and monetary policy analytics.',
    htmlUrl: '/arthneeti-economics-guidebook.html',
    pdfUrl: '/arthneeti-economics-guidebook.pdf',
    chapters: [
      'Macroeconomics Core: GDP, Inflation & Monetary Systems',
      'Microeconomic Concepts: Supply, Demand & Consumer Choice',
      'Central Banking Mechanics: CRR & SLR Policy',
      'International Trade, Remittances & Balance of Payments',
      'Designing Surveys & Field Research Methods',
      'Drafting Policy Reports & Economic Papers',
    ],
  },
];

// Flattened FAQ list — pulled from all lessons that have FAQs attached.
// New lessons with a `faqs` array automatically show up here too.
const FAQS: FAQ[] = LESSONS.flatMap(lesson => lesson.faqs || []);

const TAG_COLORS: Record<string, string> = {
  'Stock Market':       'bg-royal/10 text-royal border-royal/20',
  'Policy & Economics': 'bg-crimson/10 text-crimson border-crimson/20',
  'Technical Analysis': 'bg-green-light/10 text-green-light border-green-light/20',
  'Financial Literacy': 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  'Research':           'bg-violet-400/10 text-violet-400 border-violet-400/20',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function LearnPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'videos' | 'guides' | 'faqs'>('videos');
  const [activeLesson, setActiveLesson] = useState<Lesson>(LESSONS[0]);
  const [isPlaying, setIsPlaying]       = useState(false);
  const [completed, setCompleted]       = useState<Set<string>>(new Set());
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq]   = useState<number | null>(null);
  const [expandedLessonFaq, setExpandedLessonFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery]   = useState('');
  const playerRef = useRef<HTMLDivElement>(null);

  // ── Load completed lessons from Firestore ──────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const snap = await getDoc(doc(db, 'users', user.uid, 'progress', 'lessons'));
      if (snap.exists()) {
        setCompleted(new Set(snap.data().completed || []));
      }
    };
    fetch();
  }, [user]);

  // ── Mark lesson complete ───────────────────────────────────────────────────
  const markComplete = async (lessonId: string) => {
    const next = new Set(completed);
    if (next.has(lessonId)) {
      next.delete(lessonId);
    } else {
      next.add(lessonId);
    }
    setCompleted(next);
    if (user) {
      await setDoc(
        doc(db, 'users', user.uid, 'progress', 'lessons'),
        { completed: Array.from(next), updatedAt: serverTimestamp() },
        { merge: true }
      );
    }
  };

  // ── Play a lesson ──────────────────────────────────────────────────────────
  const playLesson = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setIsPlaying(true);
    setExpandedLessonFaq(null);
    setTimeout(() => {
      playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const filteredLessons = LESSONS.filter(l =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGuides = GUIDES.filter(g =>
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFaqs = FAQS.filter(f =>
    f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const progress = LESSONS.length > 0
    ? Math.round((completed.size / LESSONS.length) * 100)
    : 0;

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#0B0F19]"
    >
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 pt-28 pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <span className="text-[10px] font-black text-crimson mb-3 block uppercase tracking-[0.4em]">
              ARTHNEETI ACADEMY
            </span>
            <h1 className="font-display text-5xl md:text-7xl text-white italic mb-4 tracking-tight">
              Learn
            </h1>
            <p className="text-text-muted text-sm max-w-lg leading-relaxed">
              Video lessons, written guides, and research resources — all built around Nepal's economy, NEPSE, and NRB policy.
            </p>
          </div>

          {/* Progress pill — only for logged-in users */}
          {user && (
            <div className="bg-[#161F30] border border-[#1F2A3F] rounded-2xl px-6 py-5 min-w-[200px]">
              <span className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-3">
                Your Progress
              </span>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-3xl font-black font-mono text-white">{progress}%</span>
                <span className="text-[10px] text-text-muted mb-1">
                  {completed.size}/{LESSONS.length} lessons
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#0B0F19] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-royal rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Tabs + Search ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          <div className="flex bg-[#161F30] border border-[#1F2A3F] rounded-xl p-1 self-start">
            {(['videos', 'guides', 'faqs'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSearchQuery(''); }}
                className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-royal text-white shadow-md'
                    : 'text-text-muted hover:text-white'
                }`}
              >
                {tab === 'videos' ? 'Video Lessons' : tab === 'guides' ? 'Written Guides' : 'FAQ'}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-md">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder={activeTab === 'videos' ? 'Search lessons...' : activeTab === 'guides' ? 'Search guides...' : 'Search questions...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#161F30] border border-[#1F2A3F] rounded-xl pl-10 pr-4 py-3 text-sm focus:border-royal outline-none text-white placeholder:text-text-muted/50 transition-all"
            />
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        <AnimatePresence mode="wait">

          {/* ════════════════════════════════════════════════════════════════════
              VIDEO LESSONS TAB
          ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'videos' && (
            <motion.div
              key="videos"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {/* ── Video Player ────────────────────────────────────────────── */}
              <div ref={playerRef} className="mb-10">
                <div className="bg-[#161F30] border border-[#1F2A3F] rounded-3xl overflow-hidden">
                  {/* Player area */}
                  <div className="relative aspect-video bg-[#0B0F19]">
                    {isPlaying ? (
                      <iframe
                        key={activeLesson.videoUrl}
                        src={`${activeLesson.videoUrl}?autoplay=1&rel=0&modestbranding=1`}
                        title={activeLesson.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center group cursor-pointer" onClick={() => setIsPlaying(true)}>
                        <img
                          src={activeLesson.thumbnail}
                          alt={activeLesson.title}
                          className="absolute inset-0 w-full h-full object-cover opacity-60"
                        />
                        <div className="relative z-10 w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-royal/80 transition-all duration-300">
                          <span className="material-symbols-outlined text-white text-4xl ml-1">play_arrow</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Player footer */}
                  <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${TAG_COLORS[activeLesson.tag] || 'bg-royal/10 text-royal border-royal/20'} inline-block mb-2`}>
                        {activeLesson.tag}
                      </span>
                      <h2 className="font-display text-xl md:text-2xl text-white italic leading-tight">
                        {activeLesson.title}
                      </h2>
                      <p className="text-text-muted text-xs mt-1">{activeLesson.duration}</p>
                    </div>
                    <button
                      onClick={() => markComplete(activeLesson.id)}
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 cursor-pointer ${
                        completed.has(activeLesson.id)
                          ? 'bg-green-light/10 border border-green-light/30 text-green-light'
                          : 'bg-[#0B0F19] border border-[#1F2A3F] text-text-muted hover:border-green-light hover:text-green-light'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {completed.has(activeLesson.id) ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      {completed.has(activeLesson.id) ? 'Completed' : 'Mark Complete'}
                    </button>
                  </div>
                </div>

                {/* Chapters for active lesson */}
                {activeLesson.chapters.length > 0 && (
                  <div className="mt-4 bg-[#161F30] border border-[#1F2A3F] rounded-2xl p-6">
                    <span className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-4">
                      What's covered
                    </span>
                    <ul className="space-y-2.5">
                      {activeLesson.chapters.map((ch, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-text-muted">
                          <span className="text-[10px] font-black font-mono text-royal mt-0.5 shrink-0">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          {ch}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* FAQ for active lesson, if attached */}
                {activeLesson.faqs && activeLesson.faqs.length > 0 && (
                  <div className="mt-4 bg-[#161F30] border border-[#1F2A3F] rounded-2xl p-6">
                    <span className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-4">
                      Frequently Asked Questions
                    </span>
                    <div className="space-y-2">
                      {activeLesson.faqs.map((faq, i) => {
                        const isOpen = expandedLessonFaq === i;
                        return (
                          <div
                            key={i}
                            className={`border rounded-xl overflow-hidden transition-colors ${
                              isOpen ? 'border-royal/40 bg-[#0B0F19]' : 'border-[#1F2A3F]'
                            }`}
                          >
                            <button
                              onClick={() => setExpandedLessonFaq(isOpen ? null : i)}
                              className="w-full flex items-center justify-between gap-3 p-4 text-left cursor-pointer"
                            >
                              <span className="text-xs font-bold text-white leading-snug">
                                {faq.question}
                              </span>
                              <span className={`material-symbols-outlined text-text-muted text-base shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                                expand_more
                              </span>
                            </button>
                            <AnimatePresence>
                              {isOpen && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <p className="px-4 pb-4 text-xs text-text-muted leading-relaxed">
                                    {faq.answer}
                                  </p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Lesson cards ────────────────────────────────────────────── */}
              <div className="mb-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">
                  All Lessons — {filteredLessons.length} available
                </span>
              </div>

              {filteredLessons.length === 0 ? (
                <div className="text-center py-16 bg-[#161F30] rounded-2xl border border-dashed border-[#1F2A3F]">
                  <p className="text-text-muted text-sm italic">No lessons match "{searchQuery}"</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {filteredLessons.map((lesson, i) => {
                    const isActive = activeLesson.id === lesson.id;
                    const isDone   = completed.has(lesson.id);
                    return (
                      <motion.div
                        key={lesson.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        onClick={() => playLesson(lesson)}
                        className={`group cursor-pointer bg-[#161F30] border rounded-2xl overflow-hidden transition-all duration-300 ${
                          isActive
                            ? 'border-royal shadow-lg shadow-royal/10'
                            : 'border-[#1F2A3F] hover:border-royal/40'
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="relative aspect-video overflow-hidden bg-[#0B0F19]">
                          <img
                            src={lesson.thumbnail}
                            alt={lesson.title}
                            className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
                          />
                          {/* Play overlay */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-royal/80 transition-all">
                              <span className="material-symbols-outlined text-white text-xl ml-0.5">play_arrow</span>
                            </div>
                          </div>
                          {/* Duration badge */}
                          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded">
                            {lesson.duration}
                          </span>
                          {/* Completed badge */}
                          {isDone && (
                            <span className="absolute top-2 left-2 bg-green-light text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded flex items-center gap-1">
                              <span className="material-symbols-outlined text-[10px]">check</span>
                              Done
                            </span>
                          )}
                          {/* Active indicator */}
                          {isActive && (
                            <span className="absolute top-2 right-2 bg-royal text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded">
                              Playing
                            </span>
                          )}
                        </div>

                        {/* Card body */}
                        <div className="p-4">
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border inline-block mb-2 ${TAG_COLORS[lesson.tag] || 'bg-royal/10 text-royal border-royal/20'}`}>
                            {lesson.tag}
                          </span>
                          <h3 className="text-sm font-bold text-white leading-snug group-hover:text-royal transition-colors">
                            {lesson.title}
                          </h3>
                          <p className="text-[11px] text-text-muted mt-1.5 leading-relaxed line-clamp-2">
                            {lesson.desc}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Login nudge for non-logged-in users */}
              {!user && (
                <div className="mt-8 bg-[#161F30] border border-[#1F2A3F] rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <span className="material-symbols-outlined text-royal text-3xl shrink-0">account_circle</span>
                  <div>
                    <p className="text-white text-sm font-bold mb-0.5">Track your learning progress</p>
                    <p className="text-text-muted text-xs">Create a free account to mark lessons complete and track what you've covered.</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              WRITTEN GUIDES TAB
          ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'guides' && (
            <motion.div
              key="guides"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {filteredGuides.length === 0 ? (
                <div className="col-span-full text-center py-16 bg-[#161F30] rounded-2xl border border-dashed border-[#1F2A3F]">
                  <p className="text-text-muted text-sm italic">No guides match "{searchQuery}"</p>
                </div>
              ) : (
                filteredGuides.map((guide, i) => {
                  const isOpen = expandedGuide === guide.id;
                  return (
                    <motion.div
                      key={guide.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="bg-[#161F30] border border-[#1F2A3F] rounded-3xl p-8 flex flex-col justify-between hover:border-royal/40 transition-all duration-300 group"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex justify-between items-start mb-6">
                          <span className="bg-royal/10 text-royal text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-royal/20">
                            {guide.category}
                          </span>
                          <span className="text-[9px] font-mono text-text-muted bg-[#0B0F19] px-2.5 py-1 rounded border border-[#1F2A3F]">
                            {guide.readingTime}
                          </span>
                        </div>

                        <h3 className="font-display text-xl text-white italic leading-tight mb-3 group-hover:text-royal transition-colors">
                          {guide.title}
                        </h3>

                        <p className="text-xs text-text-muted leading-relaxed mb-5">
                          {guide.description}
                        </p>

                        <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider border-t border-[#1F2A3F] pt-4 mb-5">
                          Lang: <span className="text-white">{guide.language}</span>
                        </div>

                        {/* Collapsible chapters */}
                        <div className="mb-6">
                          <button
                            onClick={() => setExpandedGuide(isOpen ? null : guide.id)}
                            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-text-muted hover:text-white transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">
                              {isOpen ? 'expand_less' : 'expand_more'}
                            </span>
                            {isOpen ? 'Hide chapters' : 'View chapters'}
                          </button>

                          <AnimatePresence>
                            {isOpen && (
                              <motion.ul
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 space-y-2.5 pl-3 border-l border-royal/30 overflow-hidden"
                              >
                                {guide.chapters.map((ch, ci) => (
                                  <li key={ci} className="flex items-start gap-2 text-xs text-text-muted">
                                    <span className="text-[9px] font-black font-mono text-royal shrink-0 mt-0.5">
                                      {String(ci + 1).padStart(2, '0')}
                                    </span>
                                    {ch}
                                  </li>
                                ))}
                              </motion.ul>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-3 mt-auto">
                        <a
                          href={guide.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-3.5 bg-royal hover:bg-white hover:text-royal text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                          <span className="material-symbols-outlined text-sm">menu_book</span>
                          Read Online
                        </a>
                        <a
                          href={guide.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-3.5 bg-[#0B0F19] hover:bg-[#0B0F19]/50 border border-[#1F2A3F] hover:border-royal text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm">download</span>
                          Download PDF
                        </a>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              FAQ TAB
          ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'faqs' && (
            <motion.div
              key="faqs"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="max-w-3xl"
            >
              <div className="mb-6">
                <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">
                  {filteredFaqs.length} Question{filteredFaqs.length !== 1 ? 's' : ''} Answered
                </span>
              </div>

              {filteredFaqs.length === 0 ? (
                <div className="text-center py-16 bg-[#161F30] rounded-2xl border border-dashed border-[#1F2A3F]">
                  <p className="text-text-muted text-sm italic">No questions match "{searchQuery}"</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFaqs.map((faq, i) => {
                    const isOpen = expandedFaq === i;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className={`bg-[#161F30] border rounded-2xl overflow-hidden transition-colors ${
                          isOpen ? 'border-royal/50' : 'border-[#1F2A3F]'
                        }`}
                      >
                        <button
                          onClick={() => setExpandedFaq(isOpen ? null : i)}
                          className="w-full flex items-center justify-between gap-4 p-5 text-left cursor-pointer"
                        >
                          <div className="flex items-start gap-3 flex-1">
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border shrink-0 mt-0.5 ${TAG_COLORS[faq.topic] || 'bg-royal/10 text-royal border-royal/20'}`}>
                              {faq.topic}
                            </span>
                            <span className="text-sm font-bold text-white leading-snug">
                              {faq.question}
                            </span>
                          </div>
                          <span className={`material-symbols-outlined text-text-muted shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                            expand_more
                          </span>
                        </button>

                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <p className="px-5 pb-5 text-xs text-text-muted leading-relaxed border-t border-[#1F2A3F] pt-4 mx-5">
                                {faq.answer}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.main>
  );
}
