import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Check, BookOpen, Download, Award } from 'lucide-react';
import CertificateModal from './CertificateModal';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import LessonCommentSection from './LessonCommentSection';
import LessonQuiz from './LessonQuiz';
import AILessonAssistant from './AILessonAssistant';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FAQ {
  question: string;
  answer: string;
  topic: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

interface Lesson {
  id: string;
  title: string;
  desc: string;
  duration: string;
  tag: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  videoUrl: string;
  thumbnail: string;
  chapters: string[];
  faqs?: FAQ[];
  quiz?: QuizQuestion[];
  resources?: { title: string; size: string; url: string }[];
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

export const LESSONS: Lesson[] = [
  {
    id: 'demystifying-nepse',
    level: 'Beginner',
    title: 'Demystifying NEPSE',
    desc: 'A fast, clear walkthrough of how Nepal\'s stock market actually works — from SEBON and CDSC to IPO lotteries, settlement cycles, and why diversification matters.',
    duration: '8:00',
    tag: 'Stock Market',
    videoUrl: 'https://www.youtube.com/embed/qB4y1O3Nq3M',
    thumbnail: 'https://img.youtube.com/vi/qB4y1O3Nq3M/hqdefault.jpg',
    resources: [
      { title: 'NEPSE Beginner Cheat Sheet', size: '245 KB PDF', url: '#' },
      { title: 'Demat Opening Checklist', size: '1.2 MB PDF', url: '#' }
    ],
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
    quiz: [
      {
        question: 'Which organization acts as the regulatory body (the "police") of Nepal\'s capital market?',
        options: ['NEPSE', 'SEBON', 'CDSC', 'Nepal Rastra Bank'],
        correctIndex: 1
      },
      {
        question: 'What is the purpose of the ASBA system during an IPO application?',
        options: ['To immediately deduct the money from your account', 'To block the application money in your account while it continues to earn interest', 'To guarantee you will receive shares', 'To transfer your shares to the secondary market'],
        correctIndex: 1
      },
      {
        question: 'If you buy shares in NEPSE\'s secondary market on Sunday, when will they arrive in your Demat account under the T+3 settlement cycle?',
        options: ['Sunday', 'Monday', 'Wednesday', 'Thursday'],
        correctIndex: 2
      },
      {
        question: 'How do bonus shares affect your total wealth immediately after they are issued?',
        options: ['They double your wealth', 'They decrease your wealth because the share price drops', 'Your total wealth stays exactly the same', 'They only increase your wealth if you sell them immediately'],
        correctIndex: 2
      },
      {
        question: 'Why is sector diversification recommended in NEPSE?',
        options: ['To avoid taxes', 'To concentrate all your risk in commercial banking', 'To protect your portfolio in case one specific sector underperforms', 'Because SEBON requires it'],
        correctIndex: 2
      }
    ]
  },
  {
    id: 'budgeting-emergency-fund',
    level: 'Beginner',
    title: 'Budgeting, Saving & Building Financial Resilience',
    desc: 'The 50/30/20 rule, compound interest vs inflation, SMART financial goals, responsible borrowing, and how NRB policy reaches your personal wallet.',
    duration: '9:30',
    tag: 'Financial Literacy',
    videoUrl: 'https://www.youtube.com/embed/REFRRa9CtS4',
    thumbnail: 'https://img.youtube.com/vi/REFRRa9CtS4/hqdefault.jpg',
    resources: [
      { title: '50/30/20 Budgeting Excel Template', size: '45 KB XLSX', url: '#' }
    ],
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
    quiz: [
      {
        question: 'Under the 50/30/20 budgeting rule, how should you divide your after-tax income?',
        options: ['50% to savings, 30% to wants, 20% to needs', '50% to needs, 30% to wants, 20% to savings and debt repayment', '50% to investments, 30% to housing, 20% to entertainment', '50% to needs, 30% to savings, 20% to wants'],
        correctIndex: 1
      },
      {
        question: 'What is the primary difference between compound interest and inflation?',
        options: ['Compound interest decreases your wealth over time, while inflation increases it.', 'Compound interest only applies to bank loans, while inflation applies to groceries.', 'Compound interest exponentially grows your money, while inflation slowly decreases its purchasing power.', 'They are exactly the same concept applied to different currencies.'],
        correctIndex: 2
      },
      {
        question: 'When setting a SMART financial goal, what does the "M" stand for?',
        options: ['Meaningful (It must be important to you)', 'Measurable (You must be able to track your exact progress)', 'Manageable (It must be easy to achieve)', 'Monetary (It must involve cash)'],
        correctIndex: 1
      },
      {
        question: 'What role does Nepal\'s Credit Information Bureau (CIB) play when you apply for a loan?',
        options: ['It provides the actual money for the loan.', 'It determines the national interest rate for all banks.', 'It maintains a record of your borrowing history to help banks assess how risky it is to lend to you.', 'It forgives your debt if you cannot pay your EMI on time.'],
        correctIndex: 2
      },
      {
        question: 'How do Nepal Rastra Bank (NRB) policy decisions typically affect your personal wallet?',
        options: ['They directly control how much your employer pays you.', 'They dictate the exact prices of vegetables in local markets.', 'They influence the interest rates you earn on deposits and pay on loans.', 'They determine how much tax you pay on your income.'],
        correctIndex: 2
      }
    ]
  },
  {
    id: 'monetary-policy-2026',
    level: 'Advanced',
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
    quiz: [
      {
        question: 'Why did the Nepal Rastra Bank (NRB) adopt a "cautiously accommodative" monetary stance?',
        options: ['To slow down the economy', 'To make it easier and cheaper to borrow money to support economic recovery', 'To restrict credit to the private sector', 'To increase inflation'],
        correctIndex: 1
      },
      {
        question: 'What is the "liquidity-credit paradox" currently observed in Nepal?',
        options: ['Banks have no money, but businesses want to borrow', 'Banks have plenty of liquidity and low rates, but businesses are still not borrowing', 'Borrowing is high, but liquidity is low', 'Interest rates are high, causing a credit boom'],
        correctIndex: 1
      },
      {
        question: 'Why is the Nepali Rupee pegged to the Indian Rupee?',
        options: ['To make Nepali exports more expensive', 'To act as a nominal anchor and import price stability from India', 'To allow Nepal to have completely independent monetary policy', 'Because Nepal conducts all its trade with China'],
        correctIndex: 1
      },
      {
        question: 'How does NFRS 9 change how banks report their income on risky (Stage 3) loans?',
        options: ['They must recognize all interest immediately', 'They can no longer charge interest', 'They will only recognize interest on a strict cash basis when actually received', 'They must forgive the loans'],
        correctIndex: 2
      },
      {
        question: 'How is the NRB helping businesses that face unforeseen hardships, like earthquake-affected areas?',
        options: ['By paying off their debts completely', 'By allowing banks to restructure or reschedule their existing loans', 'By seizing their assets immediately', 'By increasing their interest rates'],
        correctIndex: 1
      }
    ]
  },
  {
    id: 'ssa-reality',
    level: 'Advanced',
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
    quiz: [
      {
        question: 'What is the primary characteristic of Nepal\'s Social Security Allowance (SSA)?',
        options: ['It is a contributory pension only for government workers', 'It is a constitutionally guaranteed, non-contributory cash transfer program', 'It is a loan that must be repaid', 'It is a private insurance scheme'],
        correctIndex: 1
      },
      {
        question: 'When the SSA was first introduced in 1994/95, what was the monthly allowance amount?',
        options: ['Rs. 100', 'Rs. 500', 'Rs. 1,000', 'Rs. 4,000'],
        correctIndex: 0
      },
      {
        question: 'According to beneficiaries, what is the primary expenditure for the SSA funds?',
        options: ['Entertainment and travel', 'Healthcare and medicines', 'Starting a business', 'Paying off bank loans'],
        correctIndex: 1
      },
      {
        question: 'What is one of the biggest administrative challenges facing the SSA program?',
        options: ['Too many people contributing to the fund', 'The program is too small to matter', 'Ghost names where allowances are distributed to individuals who have died or migrated', 'Beneficiaries refusing to accept the money'],
        correctIndex: 2
      },
      {
        question: 'Why are economic experts worried about the long-term financial sustainability of the SSA?',
        options: ['The program only costs NPR 1 billion', 'Lowering the eligibility age combined with an aging population rapidly increases the financial burden', 'The government is ending the program next year', 'There are too few elderly citizens'],
        correctIndex: 1
      }
    ]
  },
  {
    id: 'modern-finance-intro',
    level: 'Advanced',
    title: 'Introduction to Modern Finance & Quantitative Trading',
    desc: 'An overview of core financial products, market operations, trading types, and how advanced mathematics has transformed the industry over the last 30 years.',
    duration: '22:00',
    tag: 'Investing & Markets',
    videoUrl: 'https://www.youtube.com/embed/P56591aoV90',
    thumbnail: 'https://img.youtube.com/vi/P56591aoV90/hqdefault.jpg',
    chapters: [
      'Core Financial Products (Stocks, Bonds, and Derivatives)',
      'How Markets Operate (Primary vs. Secondary & Exchanges vs. OTC)',
      'The Players: Market Makers vs. Brokers',
      'The Three Main Types of Trading',
      'The Transformation of Finance Through Mathematics',
    ],
    faqs: [
      {
        topic: 'Financial Literacy',
        question: 'What is the main purpose of this course and what will I learn?',
        answer: 'The goal of the course is to provide a "sampling menu" of how mathematics is applied in modern finance, helping students decide if they want to pursue a career in the industry. It combines foundational math lectures with practical examples taught by industry practitioners from firms like Morgan Stanley.',
      },
      {
        topic: 'Financial Literacy',
        question: 'What kind of mathematical foundation do I need for quantitative finance?',
        answer: 'To understand the financial models used by practitioners, students need a strong mathematical foundation in subjects like linear algebra, probability, statistics, and stochastic calculus.',
      },
      {
        topic: 'Financial Literacy',
        question: 'Has finance always been a highly mathematical field?',
        answer: 'No, quantitative finance is a relatively new field. Over the last 30 years, the industry has rapidly transformed from relying on under-educated "gut traders" to hiring professionals with advanced degrees in mathematics and computer science.',
      },
      {
        topic: 'Financial Literacy',
        question: 'What is the difference between a primary market and a secondary market?',
        answer: 'When a private company wants to raise capital by issuing stock to the public for the first time, it goes through an Initial Public Offering (IPO) in the primary market. Once those shares are officially listed on an exchange and begin trading among investors, that trading takes place in the secondary market.',
      },
      {
        topic: 'Financial Literacy',
        question: 'How does a broker differ from a market maker (or dealer)?',
        answer: 'A broker acts as a matchmaker, connecting buyers with sellers for a commission without taking on principal financial risk. A market maker or dealer steps in to provide liquidity by quoting a price to buy (the bid) and a price to sell (the offer), taking the other side of your trade and assuming the financial risk themselves.',
      },
      {
        topic: 'Financial Literacy',
        question: 'What are the main ways advanced mathematics is used in modern finance?',
        answer: 'Mathematics is primarily used in three core areas: building pricing models for complex derivative products (which often involves solving differential equations), managing portfolio risk management, and developing sophisticated trading strategies.',
      },
      {
        topic: 'Financial Literacy',
        question: 'What are "the Greeks" and why are they important?',
        answer: '"The Greeks" are mathematical parameters used in risk management to measure a portfolio\'s sensitivity to various market changes. For example, Delta measures sensitivity to the underlying asset\'s price, Gamma measures curvature or convexity, Theta measures time decay, and Vega (sometimes called Kappa at certain firms) measures sensitivity to volatility.',
      },
      {
        topic: 'Financial Literacy',
        question: 'What does "arbitrage" mean in trading?',
        answer: 'Arbitrage is a proprietary trading strategy where a trader looks for mispriced relationships between different assets or markets. If a deterministic or mathematical relationship between prices temporarily breaks down, an arbitrageur attempts to profit from that discrepancy.',
      },
      {
        topic: 'Financial Literacy',
        question: 'Why do investors often hold onto losing stocks instead of cutting their losses?',
        answer: 'Due to a human behavioral tendency known as risk aversion, people naturally dislike locking in a guaranteed loss. Even if closing the position is mathematically the smarter choice with a better expected value, many traders will hold onto a losing trade hoping it will bounce back, which highlights the importance of strict risk management discipline.',
      },
      {
        topic: 'Financial Literacy',
        question: 'What kind of real-world projects do quantitative finance interns work on?',
        answer: 'Interns often tackle highly technical, data-driven problems. For example, previous students have worked on finding the optimal shift size for calculating numerical derivatives (like Delta) in noisy Monte Carlo simulations, and using Kalman filters to better predict currency exchange rates for electronic trading platforms.',
      },
    ],
    quiz: [
      {
        question: 'How has the finance industry fundamentally transformed over the last 30 years?',
        options: ['It has become entirely unregulated', 'It relies less on math and more on gut feeling', 'It has heavily integrated advanced mathematics and computer science', 'It stopped trading derivative products'],
        correctIndex: 2
      },
      {
        question: 'What is the key difference between a broker and a market maker?',
        options: ['A broker takes on financial risk, while a market maker does not', 'A broker acts as a matchmaker for a commission, while a market maker takes the other side of the trade and assumes risk', 'They are exactly the same thing', 'A broker only works in the primary market'],
        correctIndex: 1
      },
      {
        question: 'In risk management, what does Delta measure?',
        options: ['Sensitivity to the underlying asset\'s price', 'Time decay', 'Sensitivity to volatility', 'Curvature or convexity'],
        correctIndex: 0
      },
      {
        question: 'What is an arbitrage strategy?',
        options: ['Buying and holding a stock for 10 years', 'Profiting from a broken deterministic or mathematical pricing relationship between assets', 'Taking wild guesses on market direction', 'Only trading during IPOs'],
        correctIndex: 1
      },
      {
        question: 'Why do traders often struggle to cut their losses on a bad trade?',
        options: ['Because The Greeks prevent them from selling', 'Due to human risk aversion and a reluctance to lock in a guaranteed loss', 'Because the secondary market does not allow selling at a loss', 'Because holding a losing trade always guarantees a profit eventually'],
        correctIndex: 1
      }
    ]
  },
  {
    id: 'financial-literacy-youth',
    level: 'Beginner',
    title: 'Financial Literacy & Personal Wealth Management in Nepal',
    desc: 'Learn about budgeting with the 50/30/20 rule, building an emergency fund, calculating savings interest, and smart borrowing strategies for youth in Nepal.',
    duration: '15:00',
    tag: 'Financial Literacy',
    videoUrl: 'https://www.youtube.com/embed/axpx1CYe8JI',
    thumbnail: 'https://img.youtube.com/vi/axpx1CYe8JI/hqdefault.jpg',
    chapters: [
      'Budgeting with the 50/30/20 Rule',
      'Building a 3-6 Month Emergency Fund',
      'Calculating Savings Account Interest',
      'Financial Goal Setting for Youth',
      'Smart Borrowing and Income Pathways',
    ],
    faqs: [
      {
        topic: 'Financial Literacy',
        question: 'How should I divide my monthly income or allowance to manage my money better?',
        answer: 'A highly recommended method is the 50/30/20 rule. Under this budgeting framework, you allocate 50% of your income for essential needs (such as rent, groceries, and school fees), 30% for discretionary wants (like eating out or entertainment), and 20% toward savings and investments.',
      },
      {
        topic: 'Financial Literacy',
        question: 'What is the exact difference between a "need" and a "want"?',
        answer: 'Needs are basic requirements that must be met for your daily survival and living, such as food, clothing, and shelter. Wants are things that are nice to have but are not strictly required, such as going to the movies or buying designer jeans. Understanding this difference is a core part of financial planning, as cutting down on "wants" is the easiest way to increase your savings.',
      },
      {
        topic: 'Financial Literacy',
        question: 'How much money should I save for emergencies?',
        answer: 'Financial experts recommend building an emergency fund large enough to cover 3 to 6 months of your basic living expenses. This fund acts as a safety net to protect you from taking out high-interest loans during unpredictable events, such as a medical emergency or a sudden job loss.',
      },
      {
        topic: 'Financial Literacy',
        question: 'Where is the best place to keep my emergency fund?',
        answer: 'Your emergency fund should be kept in a safe place where you can access the cash easily when needed. A standard savings account is a great starting point for liquidity. As your fund grows, you can use Fixed Deposit (FD) laddering—splitting your money into multiple short-term FDs (like 3-month and 6-month terms) so you earn a higher interest rate while ensuring some money frequently becomes available.',
      },
      {
        topic: 'Financial Literacy',
        question: 'How is interest actually calculated on my savings account in Nepal?',
        answer: 'Unlike older methods that only paid interest on your lowest monthly balance, Nepali banks now calculate savings interest based on your daily closing balance. The formula is: (day\'s closing balance × annual rate) ÷ 365. This means every single rupee earns interest for the exact number of days it sits in your account, and the bank totals these daily slices to credit to your account, usually on a quarterly basis.',
      },
      {
        topic: 'Financial Literacy',
        question: 'Will I lose my interest if my savings account drops below the minimum balance?',
        answer: 'No, you do not lose your earned interest. Because interest is calculated daily, the days you maintained a higher balance still earn their full interest. However, dropping below the minimum balance may trigger a separate flat non-maintenance fee charged by the bank. To avoid this, you can look into zero-balance or student accounts.',
      },
      {
        topic: 'Financial Literacy',
        question: 'Do I have to pay taxes on the interest I earn from my savings?',
        answer: 'Yes. In Nepal, banks automatically deduct a 6% Tax Deducted at Source (TDS) on interest paid to individuals. This is considered a final tax, meaning the interest figure you see deposited into your account is the net amount after taxes have already been taken out.',
      },
      {
        topic: 'Financial Literacy',
        question: 'What makes a loan "good" versus "bad"?',
        answer: 'A good loan is borrowed money used for productive investment, such as starting a business, purchasing equipment, or paying for education, which will generate future income to help you repay the debt. A bad loan is borrowing money to pay for everyday consumption, temporary wants, or emergencies, because these do not generate new revenue and can trap you in a cycle of debt.',
      },
      {
        topic: 'Financial Literacy',
        question: 'As a youth, should I aim for wage-employment (a job) or self-employment (starting a business)?',
        answer: 'Both pathways have distinct advantages and disadvantages depending on your skills and personality. Wage-employment offers a fixed, regular income, opportunities to learn from a boss, and less stress at the end of the day, but it gives you less control over your schedule and decisions. Self-employment allows you to be your own boss, set your own hours, and follow your passions, but it requires initial capital, involves carrying the stress of the business\'s success, and your income can fluctuate heavily.',
      },
      {
        topic: 'Financial Literacy',
        question: 'What is insurance and why do I need it?',
        answer: 'Insurance is a financial protection measure against unpredictable risks (like illness, accidents, or natural disasters). By paying a small, regular fee called a premium, you join a pooled fund managed by an insurance company. If an unfortunate event occurs, the insurance company pays you a benefit (financial compensation) to help cover the losses, ensuring that a single crisis doesn\'t destroy your long-term savings or plunge your family into debt.',
      },
    ],
    quiz: [
      {
        question: 'Under the 50/30/20 rule, what does the 30% represent?',
        options: ['Needs', 'Savings', 'Discretionary wants', 'Taxes'],
        correctIndex: 2
      },
      {
        question: 'How many months of basic living expenses should an emergency fund ideally cover?',
        options: ['1 month', '3 to 6 months', '1 to 2 years', '10 years'],
        correctIndex: 1
      },
      {
        question: 'How is interest currently calculated on savings accounts by Nepali banks?',
        options: ['Based on the lowest balance of the month', 'Based on the daily closing balance', 'Based on the balance on the first day of the year', 'It is a fixed flat fee regardless of balance'],
        correctIndex: 1
      },
      {
        question: 'What defines a "good" loan?',
        options: ['Borrowing money to buy the latest smartphone', 'Borrowing money to pay for a luxury vacation', 'Borrowing money for productive investment that generates future income', 'Borrowing money to pay off another bad loan'],
        correctIndex: 2
      },
      {
        question: 'What is the primary purpose of insurance?',
        options: ['To get rich quickly', 'To provide financial protection against unpredictable risks and crises', 'To earn a high interest rate', 'To avoid paying taxes'],
        correctIndex: 1
      }
    ]
  },
  {
    id: 'digital-payments-security',
    level: 'Beginner',
    title: 'Digital Payments & Cyber Security in Nepal',
    desc: 'An overview of Nepal\'s digital payment ecosystem, cybersecurity threats, and how to protect yourself against financial fraud and cybercrimes.',
    duration: '15:00',
    tag: 'Financial Literacy',
    videoUrl: 'https://www.youtube.com/embed/WkVeC2MSNKA',
    thumbnail: 'https://img.youtube.com/vi/WkVeC2MSNKA/hqdefault.jpg',
    chapters: [
      'Expansion and Innovation in the Digital Payment Ecosystem',
      'Escalating Cybersecurity Threats and the Need for User Vigilance',
      'Development of Comprehensive National Cyber Security Frameworks',
      'Institutional Cyber Resilience and Strict Risk Management',
      'Combating Financial Crimes and Enhancing AML/CFT Compliance',
    ],
    faqs: [
      {
        topic: 'Financial Literacy',
        question: 'What are the key innovations currently driving Nepal\'s digital payment ecosystem?',
        answer: 'Nepal is advancing its digital payment infrastructure through initiatives like the National Payment Switch (NPS), the domestically routed NEPALPAY Card, and connectIPS tokenization. Furthermore, the Nepal Rastra Bank (NRB) is developing a Wholesale Central Bank Digital Currency (wCBDC) and promoting fintech solutions through an established Digital Finance Innovation Hub.',
      },
      {
        topic: 'Financial Literacy',
        question: 'How does tokenization improve the safety of digital transactions for consumers?',
        answer: 'Tokenization secures digital payments by replacing sensitive bank account details with a unique digital token. This allows users to perform one-time or recurring transactions through an e-mandate without repeatedly exposing their actual financial information, significantly minimizing the risk of data theft.',
      },
      {
        topic: 'Financial Literacy',
        question: 'What are the main cybersecurity threats targeting Nepali digital payment users?',
        answer: 'The rapid adoption of digital wallets and mobile banking has inevitably attracted cybercriminals, leading to increased incidents of phishing, fraud, data breaches, and unauthorized access. Scammers frequently use fraudulent links or impersonate bank officials to trick users into revealing their One-Time Passwords (OTPs), PINs, and personal data.',
      },
      {
        topic: 'Financial Literacy',
        question: 'What are the most effective ways for users to protect their online financial transactions?',
        answer: 'Users are strongly advised to use complex and unique passwords, enable Two-Factor or Multi-Factor Authentication (2FA/MFA), and use biometric logins such as fingerprint or facial recognition. Additionally, they must never share OTPs or PINs, avoid using unsecured public Wi-Fi for payments, and remain highly vigilant against suspicious messages and phishing attempts.',
      },
      {
        topic: 'Financial Literacy',
        question: 'What are the primary objectives of the National Cyber Security Policy, 2023?',
        answer: 'The policy\'s long-term vision is to build a secure and resilient cyberspace in Nepal. It aims to protect critical national infrastructure, enhance cyber security research and human resource capacity, improve the reliability of digital services, and establish the National Cyber Security Center to act as a 24/7 contact agency for threat response.',
      },
      {
        topic: 'Financial Literacy',
        question: 'How does the Electronic Transactions Act, 2008 support digital security?',
        answer: 'The Act provides the foundational legal framework for electronic transactions by granting legal recognition to electronic records and digital signatures. It is designed to make electronic communication reliable and secure while establishing legal provisions to control unauthorized access and the illegal alteration of electronic records.',
      },
      {
        topic: 'Financial Literacy',
        question: 'What does the NRB\'s Cyber Resilience Guidelines mandate for financial institutions?',
        answer: 'The guidelines require institutions to adopt a "resilience by design" approach, implement robust protective controls (like defense-in-depth), and ensure they can safely resume critical operations within two hours of a disruptive event. Institutions must also utilize continuous monitoring and multi-layered detection systems to identify anomalous activities and contain cyber threats swiftly.',
      },
      {
        topic: 'Financial Literacy',
        question: 'What is PCI DSS certification, and why is it important for the payment industry?',
        answer: 'The Payment Card Industry Data Security Standard (PCI DSS) is a globally recognized compliance scheme designed to secure credit and debit card transactions against data theft and fraud. Fonepay recently became Nepal\'s first payment service to achieve this certification, setting a high standard and inspiring other payment gateways to prioritize institutional data security.',
      },
      {
        topic: 'Financial Literacy',
        question: 'Why was Nepal placed on the FATF "grey list," and what does it entail?',
        answer: 'Nepal was placed on the Financial Action Task Force (FATF) "grey list" due to strategic deficiencies in its Anti-Money Laundering (AML) and Counter-Terrorist Financing (CFT) frameworks. Being on this list means the country is under increased international monitoring and must implement strict action plans to address these shortcomings, which could otherwise deter foreign investment and impact cross-border transactions.',
      },
      {
        topic: 'Financial Literacy',
        question: 'How are payment systems in Nepal regulated to combat money laundering and financial fraud?',
        answer: 'Payment service providers must implement stringent measures, including comprehensive customer due diligence (CDD), continuous transaction monitoring, and the reporting of large or suspicious activities to the Financial Information Unit (FIU). The NRB also highly encourages companies to integrate Artificial Intelligence (AI) and machine learning into their risk management systems for real-time fraud detection.',
      },
    ],
    quiz: [
      {
        question: 'What is the purpose of tokenization in digital payments?',
        options: ['To convert cash into physical tokens', 'To replace sensitive bank details with a unique digital token for security', 'To create a new cryptocurrency', 'To eliminate the need for passwords'],
        correctIndex: 1
      },
      {
        question: 'Which of the following is strongly advised to protect your online financial transactions?',
        options: ['Using the same password for all accounts', 'Sharing your OTP with bank officials over the phone', 'Enabling Two-Factor or Multi-Factor Authentication (2FA/MFA)', 'Using public Wi-Fi for all banking activities'],
        correctIndex: 2
      },
      {
        question: 'What does the National Cyber Security Policy (2023) aim to establish?',
        options: ['A ban on all digital wallets', 'A National Cyber Security Center for 24/7 threat response', 'A physical token system for all citizens', 'A new physical currency'],
        correctIndex: 1
      },
      {
        question: 'What does PCI DSS certification signify for a payment service provider?',
        options: ['That the provider is free to use', 'That the provider is globally recognized for securing credit and debit card transactions against data theft', 'That the provider only operates in Nepal', 'That the provider is immune to all cyber attacks'],
        correctIndex: 1
      },
      {
        question: 'Why was Nepal placed on the FATF "grey list"?',
        options: ['Due to high inflation', 'Due to strategic deficiencies in Anti-Money Laundering (AML) and Counter-Terrorist Financing (CFT) frameworks', 'Because its digital payment adoption was too fast', 'Because it banned cryptocurrency'],
        correctIndex: 1
      }
    ]
  },
  {
    id: 'nepse-fundamental-analysis',
    level: 'Beginner',
    title: 'Fundamental Analysis & Banking Stocks in NEPSE',
    desc: 'Learn how to analyze core financial statements, understand EPS and P/E ratios, and evaluate banking stocks in the Nepal Stock Exchange.',
    duration: '15:00',
    tag: 'Stock Market',
    videoUrl: 'https://www.youtube.com/embed/rDXDy7_Lclw',
    thumbnail: 'https://img.youtube.com/vi/rDXDy7_Lclw/hqdefault.jpg',
    chapters: [
      'The Role of Core Financial Statements',
      'Earnings Per Share (EPS) and the "Annualized" Trap',
      'Price-to-Earnings (P/E) Ratio and Sector Comparisons',
      'Book Value (Net Worth Per Share) and the Rs 100 Par Value',
      'The Current Undervaluation of the Banking Sector',
    ],
    faqs: [
      {
        topic: 'Stock Market',
        question: 'What are the essential financial statements used for fundamental analysis in NEPSE?',
        answer: 'The core financial statements include the Balance Sheet (Statement of Financial Position), which highlights a company\'s assets, liabilities, and net worth; the Income Statement (Statement of Profit or Loss), which reveals revenue and profit trends; and the Cash Flow Statement, which shows liquidity and operational stability. The Nepal Rastra Bank (NRB) mandates a comprehensive and standardized format for these statements for "A" class Commercial Banks to ensure full transparency.',
      },
      {
        topic: 'Stock Market',
        question: 'What is Earnings Per Share (EPS) and how is it calculated?',
        answer: 'EPS represents the net profit behind a single share of a company. It is calculated by dividing the company\'s net profit by the total number of its outstanding shares. EPS is a fundamental indicator of how much profit each share generates.',
      },
      {
        topic: 'Stock Market',
        question: 'Why should investors be cautious of "annualized" EPS in quarterly reports?',
        answer: 'In NEPSE, companies publish unaudited quarterly results where EPS is often "annualized," meaning the earnings from a single quarter are scaled up to estimate a full twelve months. Investors must be careful because a single unusually strong quarter can artificially inflate the annualized figure, making the company look cheaper than it actually is when the final audited year-end results are released.',
      },
      {
        topic: 'Stock Market',
        question: 'What does the Price-to-Earnings (P/E) ratio tell investors?',
        answer: 'The P/E ratio indicates how much you are paying for every rupee a company earns. It is calculated by dividing the current share price by the EPS. A high P/E ratio generally means the market expects strong future growth and is willing to pay a premium, while a low P/E might mean the market is skeptical or the stock is undervalued.',
      },
      {
        topic: 'Stock Market',
        question: 'Can I compare the P/E ratio of a commercial bank with a microfinance company?',
        answer: 'No, you should always compare P/E ratios within the same sector. Different sectors have completely different "normal" ranges. For example, NEPSE commercial banks typically trade at lower P/E ratios (roughly 10-18), whereas sectors like microfinance or hydropower often trade at much higher multiples of 15-30 or more.',
      },
      {
        topic: 'Stock Market',
        question: 'What is Book Value (Net Worth Per Share) and how does it relate to the Rs 100 par value?',
        answer: 'Book value per share is the accounting value left for shareholders after all debts are paid, calculated by dividing shareholders\' equity by the number of shares. In Nepal, shares have a standard par value of Rs 100. If a company\'s net worth per share is Rs 200, it means the company has accumulated Rs 100 of reserves and retained earnings above its original par value.',
      },
      {
        topic: 'Stock Market',
        question: 'How is the Price-to-Book (P/B) ratio used to evaluate banks?',
        answer: 'The P/B ratio measures how much investors are willing to pay relative to the company\'s net worth. A P/B ratio below 1 can signal that a stock is undervalued, while a normal range for NEPSE banks is typically between 1 and 3 times their book value.',
      },
      {
        topic: 'Stock Market',
        question: 'What is the current valuation of the NEPSE market versus the commercial banking sector?',
        answer: 'As of late October 2025, the overall NEPSE market is trading at highly elevated valuations, with an average P/E ratio of 38.32 and a P/B ratio of 2.78. Conversely, the commercial banking sector remains significantly undervalued, boasting a moderate P/E of roughly 15.80 and a P/B of 1.51, making it one of the most viable opportunities for long-term value investors.',
      },
      {
        topic: 'Stock Market',
        question: 'What is the difference between a Trailing P/E and a Forward P/E?',
        answer: 'The Trailing P/E ratio uses actual past earnings data from the last 12 months, providing a clear picture of historical performance. The Forward P/E ratio uses projected expected earnings for the next 12 months. While Forward P/E offers insights into future growth expectations, it is more speculative as it relies on estimates.',
      },
      {
        topic: 'Stock Market',
        question: 'Does a low P/E ratio always mean a stock is a good investment?',
        answer: 'No, a low P/E ratio does not automatically make a stock a "must buy". While it might suggest a stock is cheap or undervalued, it can also mean that the company has fundamental problems, is facing challenges, or that the market is losing confidence in its future prospects. It is crucial to investigate why the P/E is low before investing.',
      },
    ],
    quiz: [
      {
        question: 'Which core financial statement highlights a company\'s assets, liabilities, and net worth?',
        options: ['The Income Statement', 'The Cash Flow Statement', 'The Balance Sheet', 'The Dividend Report'],
        correctIndex: 2
      },
      {
        question: 'Why should investors be cautious of "annualized" EPS in unaudited quarterly reports?',
        options: ['Because a single strong quarter can artificially inflate the estimated twelve-month figure', 'Because annualized EPS is always lower than actual EPS', 'Because it includes taxes that haven\'t been paid', 'Because it is illegal to use annualized EPS'],
        correctIndex: 0
      },
      {
        question: 'What does a high Price-to-Earnings (P/E) ratio generally suggest about a stock?',
        options: ['The company is bankrupt', 'The market expects strong future growth and is willing to pay a premium', 'The stock is deeply undervalued', 'The company pays the highest dividends'],
        correctIndex: 1
      },
      {
        question: 'When comparing P/E ratios, what is the best practice?',
        options: ['Compare any two companies regardless of industry', 'Compare a commercial bank directly with a microfinance company', 'Only compare P/E ratios within the same sector', 'Always look for the highest P/E ratio across the entire market'],
        correctIndex: 2
      },
      {
        question: 'What is the standard par value of shares in Nepal?',
        options: ['Rs. 10', 'Rs. 100', 'Rs. 1,000', 'Rs. 50'],
        correctIndex: 1
      }
    ]
  },
  {
    id: 'technical-analysis-intro',
    level: 'Beginner',
    title: 'Technical Analysis & Chart Patterns',
    desc: 'Master the basics of technical analysis including support/resistance, candlestick patterns, major chart patterns, RSI, MACD, and Bollinger Bands.',
    duration: '15:00',
    tag: 'Technical Analysis',
    videoUrl: 'https://www.youtube.com/embed/Zpw7GEU0vYg',
    thumbnail: 'https://img.youtube.com/vi/Zpw7GEU0vYg/hqdefault.jpg',
    chapters: [
      'Support and Resistance',
      'Candlestick Patterns',
      'Major Chart Patterns (Reversals and Continuations)',
      'The Relative Strength Index (RSI)',
      'MACD and Bollinger Bands (Momentum and Volatility)',
    ],
    faqs: [
      {
        topic: 'Technical Analysis',
        question: 'What exactly are support and resistance levels?',
        answer: 'Support is a price area on a chart where buying pressure historically steps in to prevent an asset from falling further, essentially acting as a floor. Conversely, resistance is a price level where selling pressure usually emerges, stopping the price from rising higher and acting as a ceiling. Interestingly, when a support level is broken, it often flips to become the new resistance level, and a broken resistance level frequently becomes future support.',
      },
      {
        topic: 'Technical Analysis',
        question: 'What do candlestick charts show that line charts do not?',
        answer: 'While standard line charts only show one data point (the closing price), candlestick charts provide five key pieces of information for a given period: the open, the close, the high of the day, the low of the day, and the direction of the price movement. This provides a much clearer window into market psychology.',
      },
      {
        topic: 'Technical Analysis',
        question: 'How do traders use candlestick patterns like the "hammer" or "shooting star"?',
        answer: 'Candlestick patterns act as "entry triggers" that tell traders whether buyers or sellers are momentarily in control. For example, a hammer candle (which has a long lower wick) indicates that sellers pushed the price down, but buyers eventually overwhelmed them to push the price back up, signaling a bullish reversal. On the other hand, a shooting star shows that buyers pushed the price high, but sellers took control to push it back down, acting as a bearish reversal signal.',
      },
      {
        topic: 'Technical Analysis',
        question: 'What does a "Head and Shoulders" pattern indicate?',
        answer: 'The Head and Shoulders pattern is considered one of the most reliable indicators that a current uptrend is reversing into a downtrend. It consists of three peaks: a large central peak (the head) flanked by two slightly lower peaks (the shoulders), all sitting on a support line known as the "neckline".',
      },
      {
        topic: 'Technical Analysis',
        question: 'How can I identify Double Top and Double Bottom patterns?',
        answer: 'A double top pattern resembles the letter \'M\'; it forms when a price hits a high point twice with a moderate drop in between, signaling a bearish reversal (prices are likely to fall). A double bottom resembles the letter \'W\'; it forms when a price hits a low point twice with a moderate rise in between, signaling a bullish reversal (prices are likely to rise).',
      },
      {
        topic: 'Technical Analysis',
        question: 'What is a continuation pattern?',
        answer: 'While reversal patterns (like Double Tops) indicate a trend is changing direction, continuation patterns signal a temporary consolidation or pause in the middle of a trend before the original trend resumes. Common examples of continuation patterns include rectangles, triangles, flags, and pennants.',
      },
      {
        topic: 'Technical Analysis',
        question: 'How does the Relative Strength Index (RSI) work?',
        answer: 'The RSI is a momentum oscillator that measures the speed and magnitude of price movements on a scale from 0 to 100, acting like a speedometer for the market. Typically, a reading above 70 indicates that an asset may be "overbought" or overvalued, while a reading below 30 suggests it may be "oversold" or undervalued.',
      },
      {
        topic: 'Technical Analysis',
        question: 'What is RSI divergence?',
        answer: 'RSI divergence occurs when the price of an asset and the RSI momentum indicator move in opposite directions. For example, if an asset\'s price continues to drop to lower lows, but the RSI begins trending upward (a bullish divergence), it can be a strong signal that the market trend is about to reverse.',
      },
      {
        topic: 'Technical Analysis',
        question: 'What does the MACD indicator tell traders?',
        answer: 'The Moving Average Convergence Divergence (MACD) tracks trend momentum by subtracting a 26-period exponential moving average (EMA) from a 12-period EMA. A 9-period EMA (the "signal line") is then plotted on top of the MACD; when the MACD line crosses its signal line, traders often use it as a trigger to buy or sell.',
      },
      {
        topic: 'Technical Analysis',
        question: 'How are Bollinger Bands used to track volatility?',
        answer: 'Bollinger Bands consist of a simple moving average (the middle band) and two standard deviations acting as the upper and lower bands. The bands contract during periods of low volatility—a phase known as a "squeeze"—and expand when volatility increases. Traders use this squeeze to anticipate when a major, volatile price breakout is about to happen.',
      },
    ],
    quiz: [
      {
        question: 'What happens when a "support" level on a stock chart is broken?',
        options: ['It disappears completely', 'It often flips to become the new resistance level', 'The stock immediately doubles in price', 'Trading on the stock is halted forever'],
        correctIndex: 1
      },
      {
        question: 'What extra information does a candlestick chart provide compared to a standard line chart?',
        options: ['Only the closing price', 'The open, close, high, low, and direction of movement', 'The company\'s net profit', 'The names of the buyers and sellers'],
        correctIndex: 1
      },
      {
        question: 'What does a "Head and Shoulders" pattern typically indicate?',
        options: ['A current uptrend is reversing into a downtrend', 'A stock is about to pay a massive dividend', 'A current downtrend is accelerating', 'The stock price will remain completely flat'],
        correctIndex: 0
      },
      {
        question: 'What does a reading above 70 on the Relative Strength Index (RSI) generally suggest?',
        options: ['The asset is oversold and undervalued', 'The asset may be overbought or overvalued', 'The asset has zero momentum', 'The company is about to go bankrupt'],
        correctIndex: 1
      },
      {
        question: 'What phase is indicated when Bollinger Bands contract tightly together?',
        options: ['A highly volatile breakout', 'A squeeze indicating a period of low volatility before a potential breakout', 'A confirmed downtrend', 'A massive sell-off'],
        correctIndex: 1
      }
    ]
  },
  {
    id: 'ipo-vs-secondary-market',
    level: 'Beginner',
    title: 'IPO vs Secondary Market',
    desc: 'Understand the core differences between the primary (IPO) market and the secondary market, including risk levels, investment requirements, and profit potential.',
    duration: '15:00',
    tag: 'Stock Market',
    videoUrl: 'https://www.youtube.com/embed/VZiZwDl9RaI',
    thumbnail: 'https://img.youtube.com/vi/VZiZwDl9RaI/hqdefault.jpg',
    chapters: [
      'Definitions and Market Basics',
      'Risk Levels and Emotional Stress',
      'Investment Requirements and Allotment Guarantees',
      'Profit Potential and Wealth Building',
      'Required Knowledge and Strategy',
    ],
    faqs: [
      {
        topic: 'Stock Market',
        question: 'What is the core difference between the IPO and secondary markets?',
        answer: 'An IPO is the primary market where a private company sells its shares to the public for the first time at a fixed price. The secondary market is where these shares are traded daily, with prices fluctuating based on supply and demand.',
      },
      {
        topic: 'Stock Market',
        question: 'Why are IPOs considered a low-risk entry point into the stock market?',
        answer: 'IPOs are low-risk because the price is fixed and the investment amount is usually very small, meaning there is minimal emotional stress or fear of sudden, large losses.',
      },
      {
        topic: 'Stock Market',
        question: 'Is getting shares guaranteed when applying for an IPO?',
        answer: 'No, because of high demand, getting shares in an IPO is not guaranteed and relies on a lottery system. In contrast, in the secondary market, your purchase is guaranteed as you buy available shares at the current market price.',
      },
      {
        topic: 'Stock Market',
        question: 'Where is long-term wealth primarily built: IPOs or the secondary market?',
        answer: 'The secondary market is where long-term wealth is built. While IPOs offer excellent short-term listing gains, buying quality blue-chip stocks during market corrections and holding them for years offers much larger compounding profits and dividend returns.',
      },
      {
        topic: 'Stock Market',
        question: 'Do I need advanced financial knowledge to apply for an IPO?',
        answer: 'No, IPOs are highly beginner-friendly and require virtually no fundamental or technical analysis. However, succeeding in the secondary market requires an intermediate to advanced level of financial knowledge to read financial statements and identify strong companies.',
      },
    ],
    quiz: [
      {
        question: 'What is the core difference between the primary market (IPO) and the secondary market?',
        options: ['IPOs are for buying bonds, secondary is for stocks', 'The IPO market is where shares are sold to the public for the first time at a fixed price, while the secondary market involves daily trading with fluctuating prices', 'The secondary market is only for institutional investors', 'IPOs have high risk while the secondary market has low risk'],
        correctIndex: 1
      },
      {
        question: 'Why are IPOs generally considered a low-risk entry point?',
        options: ['Because the government guarantees you will make a profit', 'Because the price is fixed and the required investment amount is usually very small', 'Because IPO shares can never be sold', 'Because companies issuing IPOs never fail'],
        correctIndex: 1
      },
      {
        question: 'Is getting shares guaranteed when you apply for an IPO in Nepal?',
        options: ['Yes, if you apply early enough', 'Yes, everyone who applies gets shares', 'No, due to high demand it relies on a lottery system', 'Yes, if you pay a premium fee'],
        correctIndex: 2
      },
      {
        question: 'Where is long-term wealth primarily built?',
        options: ['Exclusively through IPO lotteries', 'By buying quality stocks in the secondary market and holding them for compounding growth', 'By avoiding the stock market entirely', 'By selling IPO shares on the first day'],
        correctIndex: 1
      },
      {
        question: 'Which market requires more advanced financial knowledge to succeed?',
        options: ['The primary market (IPO)', 'The secondary market', 'Neither requires any knowledge', 'They require exactly the same amount of knowledge'],
        correctIndex: 1
      }
    ]
  },
  {
    id: 'navigating-taxes-nepal',
    level: 'Beginner',
    title: 'Navigating Taxes in Nepal',
    desc: 'Understanding Income Tax slabs, PAN vs. VAT, Tax Deducted at Source (TDS), and legal tax-saving strategies.',
    duration: '15:00',
    tag: 'Financial Literacy',
    videoUrl: 'https://www.youtube.com/embed/ZJX6dVp-ybA',
    thumbnail: 'https://img.youtube.com/vi/ZJX6dVp-ybA/maxresdefault.jpg',
    chapters: [
      'Progressive Income Tax Slabs and Rates',
      'Legal Tax Exemptions and Deductions',
      'VAT Registration Thresholds and Input Credits',
      'The Tax Deducted at Source (TDS) Framework',
      'Tax Filing Deadlines and Compliance Penalties',
    ],
    faqs: [
      {
        topic: 'Financial Literacy',
        question: 'Do I need a PAN card to do a part-time job or freelance work?',
        answer: 'Yes. A Permanent Account Number (PAN) is mandatory for anyone involved in income-generating activities in Nepal. Employers cannot legally route your salary into a bank account without a PAN-linked payroll record. You can register for a personal PAN online for free.',
      },
      {
        topic: 'Financial Literacy',
        question: 'Do I have to file a tax return for my part-time job?',
        answer: 'Most salaried individuals do not need to file a tax return. If you work for a single employer, earn an annual salary of up to Rs. 40 lakh, and your employer correctly deducts your Tax Deducted at Source (TDS), you are exempt from filing. However, if you have multiple part-time jobs in the same year or earn freelance side-income, filing a tax return becomes mandatory.',
      },
      {
        topic: 'Financial Literacy',
        question: 'The bank deducted 6% tax from the interest on my student savings account. Can I get a refund since my income is low?',
        answer: 'No. The 6% TDS deducted by banks on interest from deposits is classified as a final withholding tax. This means it permanently settles your tax liability for that specific income. You cannot report it on a tax return or claim it back, regardless of which tax slab you fall into.',
      },
      {
        topic: 'Financial Literacy',
        question: 'I earn money from foreign clients on platforms like Upwork. How is this taxed?',
        answer: 'Foreign-currency inward remittances for digital exports are subject to a 5% withholding tax by the bank. For individuals, this 5% is treated as a final tax. While filing a tax return specifically for this income is technically optional, doing so creates a paper trail that can act as a helpful "insurance policy" against future tax queries.',
      },
      {
        topic: 'Financial Literacy',
        question: 'I work as a local freelancer/consultant. What tax rate applies to my payments?',
        answer: 'If you provide services locally and issue a PAN bill (meaning you are not VAT registered), your client is legally required to deduct a 15% TDS from your fee. Fortunately, this is an adjustable withholding tax, which acts as a provisional prepayment. If the total tax withheld exceeds your actual final tax bill for the year, you can claim a refund when you file your annual return.',
      },
      {
        topic: 'Financial Literacy',
        question: 'Can I get a VAT refund for a laptop I bought for my studies?',
        answer: 'No. Value Added Tax (VAT) is a 13% consumption tax that is ultimately borne by the end consumer. Only VAT-registered businesses can claim an "input tax credit" to recover the VAT they paid on purchases made strictly for business purposes.',
      },
      {
        topic: 'Financial Literacy',
        question: 'How do I know if my freelance business needs to register for VAT instead of just PAN?',
        answer: 'VAT registration becomes mandatory if your annual turnover from providing services exceeds Rs. 30 lakh. If your service income is below this threshold, you can operate with just a PAN. However, some small businesses opt to register for VAT voluntarily to claim input tax credits or because corporate clients prefer dealing with VAT-registered suppliers.',
      },
      {
        topic: 'Financial Literacy',
        question: 'I invested my savings in the stock market. Are my dividends taxed?',
        answer: 'Yes. Dividends distributed by Nepali companies are subject to a 5% TDS. Just like bank interest, this 5% deduction is a final tax for individual shareholders and cannot be reclaimed.',
      },
      {
        topic: 'Financial Literacy',
        question: 'What are legal ways for me to reduce my taxable income?',
        answer: 'If you earn enough to pay income tax, you can legally reduce your taxable income by claiming the following deductions: Up to Rs. 40,000 a year for life insurance premiums. Up to Rs. 20,000 a year for health insurance. A medical tax credit of 15% of your approved medical costs, capped at Rs. 750. Contributions to approved pension or retirement funds (like the Social Security Fund or Citizen Investment Trust) can be deducted up to Rs. 500,000 or one-third of your assessable income, whichever is lower.',
      },
      {
        topic: 'Financial Literacy',
        question: 'What happens if I am required to file a tax return but I do it late?',
        answer: 'The standard deadline to file your personal tax return is mid-October (the end of Ashoj). If you file late, the penalty is the higher of 1.5% per year of your assessable income (calculated monthly) or Rs. 1,000 per month of delay. In addition to this fee, you will also be charged a 15% per annum interest rate on any unpaid tax you owe.',
      },
    ],
    quiz: [
      {
        question: 'What is the maximum marginal income tax rate for taxable income exceeding Rs. 50,00,000 in Nepal?',
        options: ['20%', '30%', '36%', '39%'],
        correctIndex: 3
      },
      {
        question: 'Which of the following is an example of a "Final TDS" that permanently settles your tax liability and cannot be refunded?',
        options: ['1.5% for VAT-registered service providers', '15% for non-VAT consulting fees', '6% deduction on bank interest', 'Salary withholding'],
        correctIndex: 2
      },
      {
        question: 'Is it mandatory for a salaried employee to file a tax return if they work for a single employer, earn under Rs. 40 lakh, and have TDS correctly deducted?',
        options: ['Yes, filing is always mandatory', 'No, they are exempt from filing', 'Only if they are married', 'Only if they want a refund'],
        correctIndex: 1
      },
      {
        question: 'What is the penalty for filing a tax return late in Nepal?',
        options: ['A flat fee of Rs. 5,000', '15% of the total tax owed per month', 'The higher of 1.5% per year of assessable income or Rs. 1,000 per month', 'Immediate confiscation of assets'],
        correctIndex: 2
      }
    ]
  },
  {
    id: 'retirement-social-security',
    level: 'Beginner',
    title: 'Retirement & Social Security in Nepal',
    desc: 'How the Citizen Investment Trust (CIT), Employees Provident Fund (EPF), and Social Security Fund (SSF) work, and why starting early matters.',
    duration: '15:00',
    tag: 'Financial Literacy',
    videoUrl: 'https://www.youtube.com/embed/KFGgvgBV4JQ',
    thumbnail: 'https://img.youtube.com/vi/KFGgvgBV4JQ/maxresdefault.jpg',
    chapters: [
      'The Unique Purpose of Each Scheme',
      'Different Contribution Structures',
      'Payouts: Lump Sum vs. Monthly Pension',
      'Comprehensive Insurance and Risk Coverage',
      'Tax Benefits, Loans, and Liquidity',
    ],
    faqs: [
      {
        topic: 'Financial Literacy',
        question: 'I’m a student doing freelance or part-time work. Can I still join a retirement fund?',
        answer: 'Yes, you can! While the Employees Provident Fund (EPF) and Social Security Fund (SSF) are primarily for formal employees, the Citizen Investment Trust (CIT) offers the "Nagarik Pension Yojana" (Citizen Pension Scheme), which is completely voluntary and open to everyone, including freelancers, self-employed individuals, and workers in the informal sector.',
      },
      {
        topic: 'Financial Literacy',
        question: 'I don\'t have a large income right now. What is the minimum amount I need to start saving?',
        answer: 'You don\'t need a lot of money to begin. Under the CIT\'s voluntary Citizen Pension Scheme, you can start contributing with as little as NPR 500 per month. You also have the flexibility to make payments on a monthly, quarterly, or yearly schedule that suits your student budget.',
      },
      {
        topic: 'Financial Literacy',
        question: 'Why should I bother starting a savings plan now while I\'m still studying?',
        answer: 'Starting early allows you to take advantage of the "power of compounding," where the interest you earn generates even more interest over time. For example, if you start saving Rs 5,000 a month at age 25, your money could grow to approximately Rs 95 lakh by age 58, whereas starting at age 35 would yield less than half that amount.',
      },
      {
        topic: 'Financial Literacy',
        question: 'Can I use the money in these funds to pay for my higher education later?',
        answer: 'Yes, both CIT and SSF offer loan facilities that can help fund your education. CIT members can take out an educational loan against their savings at an 8.50% interest rate. If you are working and enrolled in the SSF, you can take out substantial loans for education after you have made regular contributions for three years.',
      },
      {
        topic: 'Financial Literacy',
        question: 'I plan to study or work abroad after graduation. What happens to my savings?',
        answer: 'If you go abroad for studies or foreign employment, you can open or continue to contribute voluntarily to a CIT account to ensure your investments keep growing in Nepal. While you are overseas, participation in mandatory workplace schemes like SSF is not required, but keeping a CIT account active is a great way to build wealth back home.',
      },
      {
        topic: 'Financial Literacy',
        question: 'What is the difference between EPF, CIT, and SSF in simple terms?',
        answer: 'EPF is a traditional, stable savings fund that automatically deducts money from your paycheck and gives you a guaranteed lump sum when you retire. SSF acts like a combined insurance policy and pension plan, offering active protection for medical emergencies, workplace accidents, and a lifetime monthly pension. CIT is a wealth-building investment trust with flexible schemes, allowing you to invest in capital markets and mutual funds for higher potential returns.',
      },
      {
        topic: 'Financial Literacy',
        question: 'When I get a formal job after graduation, which fund will my employer enroll me in?',
        answer: 'It depends on the type of organization you join. If you work for the government or a public enterprise, you will likely be enrolled in the EPF. However, if you join a private sector company, it is legally mandatory for your employer to register you under the SSF.',
      },
      {
        topic: 'Financial Literacy',
        question: 'How much of my salary will be deducted once I start working?',
        answer: 'For EPF, a fixed 10% of your basic salary is deducted, and your employer matches it with another 10%. For SSF, 11% is deducted from your gross salary, and your employer is required to add an additional 20%.',
      },
      {
        topic: 'Financial Literacy',
        question: 'Will I be able to track my savings from my phone?',
        answer: 'Yes, managing these funds has become highly digitized. For example, you can log into the EPF portal via your mobile browser or computer using your user ID and password. From the online dashboard, you can check your balance, view statements, apply for special loans, and even repay loans using mobile banking or digital wallets.',
      },
      {
        topic: 'Financial Literacy',
        question: 'Can I take my money out whenever I want to buy things?',
        answer: 'No, these funds are designed for long-term security, so you cannot withdraw the money freely for casual spending. EPF allows partial withdrawals and special loans under specific conditions, locking the rest until retirement. SSF heavily restricts early withdrawals for your main pension fund, though it provides immediate medical and accident coverage during your working years. CIT withdrawal rules depend entirely on the specific scheme you are enrolled in.',
      },
    ],
    quiz: [
      {
        question: 'What is the required total contribution for the Social Security Fund (SSF)?',
        options: ['10% from employee, 10% from employer', '11% from employee, 20% from employer', '5% from employee, 5% from employer', 'Voluntary starting at Rs 500'],
        correctIndex: 1
      },
      {
        question: 'Which fund is completely voluntary and open to everyone, including students and freelancers?',
        options: ['Employees Provident Fund (EPF)', 'Social Security Fund (SSF)', 'Citizen Investment Trust (CIT)', 'Nepal Rastra Bank (NRB)'],
        correctIndex: 2
      },
      {
        question: 'How does the Employees Provident Fund (EPF) pay out your money when you retire?',
        options: ['As a lifetime monthly pension', 'As a single lump sum of your entire accumulated balance', 'In yearly installments', 'It cannot be withdrawn until age 80'],
        correctIndex: 1
      },
      {
        question: 'If you join a private sector company after graduation, which fund is your employer legally mandated to register you under?',
        options: ['Citizen Investment Trust (CIT)', 'Employees Provident Fund (EPF)', 'Social Security Fund (SSF)', 'None of the above'],
        correctIndex: 2
      }
    ]
  },
  {
    id: 'insurance-101',
    level: 'Beginner',
    title: 'Insurance 101 in Nepal',
    desc: 'Decoding life vs. non-life insurance, term policies, and health insurance in the Nepali context.',
    duration: '14:00',
    tag: 'Financial Literacy',
    videoUrl: 'https://www.youtube.com/embed/O7jCy4OzSSA',
    thumbnail: 'https://img.youtube.com/vi/O7jCy4OzSSA/maxresdefault.jpg',
    chapters: [
      'Distinctions Between Life, Health, and Non-Life Insurance',
      'The Term vs. Endowment Life Insurance Dilemma',
      'Navigating Health Insurance Claims and Rejections',
      'The Legal and Regulatory Framework (Insurance Act 2079)',
      'Tax Benefits of Insurance',
    ],
    faqs: [
      {
        topic: 'Financial Literacy',
        question: 'As a student on a tight budget, what is the most affordable health insurance I can get?',
        answer: 'The most affordable entry point for health insurance in Nepal is the Sahara Health Insurance, launched through eSewa. It starts at a premium of just Rs 1,399 per year, offers sum-insured tiers up to Rs 6 lakh, allows cashless treatments at 26 hospitals, and can be purchased instantly via the eSewa app.',
      },
      {
        topic: 'Financial Literacy',
        question: 'I am planning to study abroad. Are there any specific taxes or fees I should know about?',
        answer: 'Yes. When you take out a foreign exchange facility from a bank to go abroad for higher education, a 3% education service fee is collected. Additionally, there is a 5% advance tax applied to the payment of registration, educational, or exam fees to foreign colleges and universities.',
      },
      {
        topic: 'Financial Literacy',
        question: 'I ride a scooter to college. Do I really have to get it insured, and how much does it cost?',
        answer: 'Yes, third-party motor insurance is mandatory under Nepal\'s law to legally operate a vehicle on public roads. It protects you financially if you cause injury or damage to others. For a motorcycle or scooter below 150 cc, the annual premium is very affordable, ranging from Rs 1,700 to Rs 2,200, and it can easily be renewed online.',
      },
      {
        topic: 'Financial Literacy',
        question: 'I want to start life insurance early, but my income is low. Which type of policy should I choose?',
        answer: 'Term insurance is the best and cheapest choice for young people on a tight budget. It provides pure protection without an expensive savings component, making the premiums significantly lower—often 3 to 5 times cheaper than endowment plans.',
      },
      {
        topic: 'Financial Literacy',
        question: 'My parents enrolled our family in the government Health Insurance Board (HIB) scheme. Is that enough?',
        answer: 'While the government HIB scheme is a good safety net, it is currently facing a massive financial crisis and owes hospitals around Rs 18 billion. Because of this, over 50 hospitals nationwide have suspended cashless services for HIB patients. It is highly recommended to have a private health insurance policy of at least Rs 5 lakh as your primary coverage to avoid out-of-pocket emergencies.',
      },
      {
        topic: 'Financial Literacy',
        question: 'If I buy health insurance and just need a quick check-up at the hospital, will my insurance pay for it?',
        answer: 'Usually, no. The biggest rule to remember is that standard Nepali health policies require a minimum 24-hour inpatient admission to trigger coverage. Pure Outpatient Department (OPD) visits and same-day discharges are generally not covered unless you have specifically purchased an extra OPD rider.',
      },
      {
        topic: 'Financial Literacy',
        question: 'Are there insurance plans that can help pay for my younger siblings\' future university fees?',
        answer: 'Yes, insurers offer "Child Insurance Plans" (a type of endowment insurance) that are specifically designed to turn regular premiums into a guaranteed lump sum for future milestones. For example, plans like the SuryaJyoti Naulo Baal Jeevan Beema focus on education savings and offer parent protection features to secure a child\'s future.',
      },
      {
        topic: 'Financial Literacy',
        question: 'What happens if I hide a pre-existing medical condition when buying health insurance?',
        answer: 'Non-disclosure of a Pre-Existing Disease (PED) is the single most common reason insurance claims are rejected in Nepal. If you are admitted to the hospital and your medical file shows your condition predates your policy, your claim will be entirely denied. Always disclose your medical history fully when buying a policy.',
      },
      {
        topic: 'Financial Literacy',
        question: 'How long does an insurance company legally take to pay a health claim?',
        answer: 'Under Section 123 of the Insurance Act 2079, insurance companies are legally mandated to settle valid health claims within 30 days of receiving complete documentation. If they delay without a legitimate reason, you can escalate the issue to the Nepal Insurance Authority (NIA).',
      },
      {
        topic: 'Financial Literacy',
        question: 'I am studying IT and want to launch a digital startup after graduation. Are there tax benefits for new businesses?',
        answer: 'Yes! To encourage innovation, the government provides a 100% income tax exemption for the first 5 years of operation for startup businesses based on innovative knowledge, skills, or technology with an annual turnover of up to Rs 100 million. Additionally, information technology industries that provide direct employment to 100 or more Nepalese citizens receive a 10% tax concession.',
      },
    ],
    quiz: [
      {
        question: 'What is the main difference between Term Insurance and Endowment Life Insurance?',
        options: ['Term insurance provides pure protection at a low cost without returns, while endowment combines protection with a savings component and guaranteed returns.', 'Term insurance is mandatory by law, while endowment is voluntary.', 'Term insurance only covers health, while endowment covers life.', 'Term insurance is 3 to 5 times more expensive than endowment insurance.'],
        correctIndex: 0
      },
      {
        question: 'Under standard Nepali health insurance policies, what is the "24-Hour Rule"?',
        options: ['You must pay your premium within 24 hours', 'The insurance company must pay your claim within 24 hours', 'You must be admitted to the hospital for a minimum of 24 hours to trigger coverage', 'You can only visit the hospital once every 24 hours'],
        correctIndex: 2
      },
      {
        question: 'What is the single most common reason insurance claims are completely rejected in Nepal?',
        options: ['The hospital was too expensive', 'Non-disclosure of a Pre-Existing Disease (PED) when buying the policy', 'Filing the claim on a weekend', 'Not having a government job'],
        correctIndex: 1
      },
      {
        question: 'Under the Insurance Act 2079, how long do insurance companies legally have to settle valid health claims after receiving complete documentation?',
        options: ['7 days', '14 days', '30 days', '90 days'],
        correctIndex: 2
      }
    ]
  },
  {
    id: 'mutual-funds-sips',
    level: 'Beginner',
    title: 'Mutual Funds & SIPs',
    desc: 'A deep dive into Systematic Investment Plans, open-ended vs. close-ended mutual funds, and passive wealth building in NEPSE.',
    duration: '15:00',
    tag: 'Stock Market',
    videoUrl: 'https://www.youtube.com/embed/m3lTigksnQA',
    thumbnail: 'https://img.youtube.com/vi/m3lTigksnQA/maxresdefault.jpg',
    chapters: [
      'The Basics of Mutual Funds',
      'Systematic Investment Plans (SIPs) & The Power of Compounding',
      'Rupee Cost Averaging',
      'Open-Ended vs. Closed-Ended Funds',
      'Net Asset Value (NAV) and Returns',
    ],
    faqs: [
      {
        topic: 'Stock Market',
        question: 'What exactly is a Mutual Fund and a SIP?',
        answer: 'A mutual fund pools money from multiple investors to invest in a diversified portfolio of assets like stocks and bonds, managed by professional fund managers. A Systematic Investment Plan (SIP) is simply a method of investing in an open-ended mutual fund where you commit to investing a fixed sum of money at regular intervals, such as monthly.',
      },
      {
        topic: 'Stock Market',
        question: 'How much money do I need to start a SIP?',
        answer: 'As a student, you do not need a lot of capital to start. In Nepal, you can begin investing in a SIP with as little as NPR 1,000 per month. This low entry barrier makes it highly accessible for students on a tight budget.',
      },
      {
        topic: 'Stock Market',
        question: 'What is the difference between open-ended and closed-ended mutual funds?',
        answer: 'Open-ended funds do not have a fixed maturity date. You can buy or sell units directly from the fund manager at any time based on the current Net Asset Value (NAV), making them highly liquid and flexible. Closed-ended funds issue a fixed number of units with a set maturity period, typically between 3 to 7 years. You cannot redeem them early directly from the fund; instead, they are traded on the secondary market (NEPSE), where their market price might differ from their actual NAV.',
      },
      {
        topic: 'Stock Market',
        question: 'What is Net Asset Value (NAV)?',
        answer: 'NAV represents the per-unit market value of a mutual fund. It is calculated at the end of each day by taking the total value of the fund\'s assets, subtracting any liabilities, and dividing that by the total number of outstanding units. When you buy or sell open-ended mutual fund units, you do so at the NAV price.',
      },
      {
        topic: 'Stock Market',
        question: 'What happens if I miss my monthly SIP payment?',
        answer: 'SIPs are very flexible. If you miss a monthly installment, your SIP will not be canceled. You simply miss investing for that particular month and can continue your payments the following month. You also have the option to pause, amend, or cancel your SIP entirely at your convenience.',
      },
      {
        topic: 'Stock Market',
        question: 'How do I actually earn money from my mutual fund?',
        answer: 'You generate returns in two main ways: capital appreciation (when the NAV of your fund units increases over time) and dividends (profits the mutual fund distributes to investors annually from interest or stock gains). You can also enroll in a dividend reinvestment plan to automatically purchase more units instead of taking cash, helping your money grow faster.',
      },
      {
        topic: 'Stock Market',
        question: 'Why should I invest in a SIP instead of saving my money in a bank?',
        answer: 'SIPs establish investment discipline and offer Rupee Cost Averaging, meaning your fixed monthly investment buys more units when market prices are low and fewer when prices are high, lowering your average cost per unit over time. Furthermore, by reinvesting your returns, you benefit from the power of compounding, which allows your wealth to snowball over a long-term horizon.',
      },
      {
        topic: 'Stock Market',
        question: 'Are mutual funds risk-free?',
        answer: 'No, mutual funds are subject to market risks, and the value of your investments can fluctuate based on market conditions. You are also exposed to liquidity risks (especially with closed-ended funds that rely on secondary market trading volumes) and management risks, as returns depend heavily on the fund manager\'s decisions and expertise.',
      },
      {
        topic: 'Stock Market',
        question: 'Do I have to pay taxes on my mutual fund earnings in Nepal?',
        answer: 'Yes, mutual fund returns are subject to taxation. For individual investors, the mutual fund company will deduct a 5% withholding tax on any dividends you receive. If you sell your units for a profit, you also pay Capital Gains Tax: 5% if you held the units for more than a year, and 7.5% if you held them for less than a year.',
      },
      {
        topic: 'Stock Market',
        question: 'Who regulates mutual funds to make sure my money is protected?',
        answer: 'The mutual fund industry in Nepal is strictly regulated by the Securities Board of Nepal (SEBON). SEBON provides the legal framework, requires fund managers to submit frequent performance reports, and enforces rules to ensure transparency, integrity, and investor protection.',
      }
    ],
    quiz: [
      {
        question: 'What is a Systematic Investment Plan (SIP)?',
        options: ['A strategy to invest a fixed amount of money at regular intervals into a mutual fund', 'A government pension scheme', 'A mandatory tax on investments', 'A type of closed-ended fund'],
        correctIndex: 0
      },
      {
        question: 'How does Rupee Cost Averaging help you as an investor?',
        options: ['It eliminates the need to pay taxes on your investments', 'You naturally purchase more units when prices are low and fewer units when prices are high, lowering your average cost per unit', 'It guarantees a 20% return on investment every year', 'It ensures you always buy at the absolute lowest price possible'],
        correctIndex: 1
      },
      {
        question: 'What is the main difference between Open-Ended and Closed-Ended Mutual Funds?',
        options: ['Open-ended funds are for government employees only, while closed-ended funds are for the private sector', 'Open-ended funds have high liquidity and no fixed maturity, while closed-ended funds have a set maturity period and trade on the secondary market', 'Open-ended funds never lose money', 'Closed-ended funds can be withdrawn directly from the fund manager at any time'],
        correctIndex: 1
      },
      {
        question: 'If you hold mutual fund units for more than a year in Nepal, what is the Capital Gains Tax rate when you sell them for a profit?',
        options: ['0%', '5%', '7.5%', '13%'],
        correctIndex: 1
      }
    ]
  },
  {
    id: 'portfolio-risk-management',
    level: 'Intermediate',
    title: 'Portfolio Construction & Risk Management',
    desc: 'How to balance a portfolio across commercial banks, hydropower, and microfinance to minimize sector risk in NEPSE.',
    duration: '16:00',
    tag: 'Stock Market',
    videoUrl: 'https://www.youtube.com/embed/mwuj_4jnAiY',
    thumbnail: 'https://img.youtube.com/vi/mwuj_4jnAiY/maxresdefault.jpg',
    chapters: [
      'Optimum Portfolio Construction Using Sharpe\'s Single Index Model',
      'Sector Allocation and Rotation (Banking vs. Hydropower)',
      'Managing Systemic Risk and Stock Volatility',
      'Credit Portfolio Management in Microfinance Institutions',
      'Individual Risk Management and Emotional Discipline',
    ],
    faqs: [
      {
        topic: 'Stock Market',
        question: 'What makes up an optimal portfolio in the Nepal Stock Exchange (NEPSE)?',
        answer: 'Based on an empirical study utilizing Sharpe\'s Single Index Model, an optimal portfolio in NEPSE consists of five specific sectors: non-life insurance, hydropower, finance, microfinance, and development banks. To balance risk and return, the model suggests allocating the highest proportion of investment to the finance sector (36.6%) and the lowest to development banks (11%).',
      },
      {
        topic: 'Stock Market',
        question: 'Should commercial banks be included in a high-return portfolio?',
        answer: 'Surprisingly, commercial banks did not qualify for the mathematically optimal portfolio in recent Single Index Model studies, as their excess return to beta ratio fell below the required cut-off value. However, the commercial banking sector has very low unsystematic risk, making it an excellent choice for risk-averse investors prioritizing stability and reliable dividends over aggressive growth.',
      },
      {
        topic: 'Stock Market',
        question: 'How do the banking and hydropower sectors differ for investors?',
        answer: 'Banking and hydropower serve entirely different purposes in a Nepalese portfolio. Banks are the backbone of the market, offering stability, large market capitalization, and a history of regular dividends, though they are highly sensitive to liquidity crunches. Conversely, hydropower is heavily retail-driven and speculative, offering high momentum and short-term trading opportunities fueled by IPO excitement.',
      },
      {
        topic: 'Stock Market',
        question: 'What financial factors determine systemic risk in Nepalese companies?',
        answer: 'Research on NEPSE-listed companies indicates that a firm\'s size and profitability are positively associated with systemic risk, meaning larger and more profitable firms can sometimes be more sensitive to market-wide movements. On the other hand, consistent dividend payments are negatively related to systemic risk, making dividend-paying stocks a safer bet. Factors like leverage, liquidity, and operating efficiency do not significantly impact systemic risk in Nepal\'s market.',
      },
      {
        topic: 'Stock Market',
        question: 'How does a microfinance company\'s profitability affect its stock price volatility?',
        answer: 'A microfinance institution\'s ability to generate profits has a significant stabilizing effect on its share price. Higher Return on Equity (ROE) and Return on Assets (ROA) are shown to decrease stock price volatility. However, an increase in the Book Value Per Share (BVPS) has a considerable positive impact on volatility, meaning higher BVPS can lead to larger price fluctuations.',
      },
      {
        topic: 'Stock Market',
        question: 'Why is Credit Portfolio Management (CPM) so crucial for Microfinance Institutions (MFIs)?',
        answer: 'CPM is a critical survival mechanism for MFIs because outstanding microloans make up nearly 90% of their total assets. Implementing strong CPM practices—such as loan portfolio diversification, scientific interest rates, credit monitoring, and capital optimization—directly reduces credit risk and loan delinquency, ensuring the institution\'s long-term financial sustainability.',
      },
      {
        topic: 'Stock Market',
        question: 'Can foreign investors easily invest in the Nepal Stock Exchange?',
        answer: 'While Nepal\'s legal framework recognizes foreign investment in listed securities in theory, practical secondary market access for ordinary foreign portfolio investors is currently restricted. Non-resident portfolio investments are generally limited to the private equity and venture capital space, meaning NEPSE is currently better suited for approved, strategic Foreign Direct Investment (FDI) transactions rather than everyday international trading.',
      },
      {
        topic: 'Stock Market',
        question: 'Why is the NEPSE index so heavily influenced by the banking sector?',
        answer: 'The NEPSE index is highly sensitive to the banking sector because banks, financial institutions, and insurance companies collectively make up 51.7% of the market\'s total capitalization. The commercial banking sector alone accounts for over one-third (approx. 38%) of the market\'s total share, meaning any price movement in bank stocks heavily sways the overall index.',
      },
      {
        topic: 'Stock Market',
        question: 'What are the best risk management strategies for individual Nepalese investors?',
        answer: 'Individual investors can protect their capital by diversifying their portfolios across different sectors (e.g., mixing stable banking stocks with manufacturing or hydropower) and setting clear investment goals. Additionally, using stop-loss orders to limit downside risk, controlling position sizes, investing only what one can afford to lose, and maintaining emotional discipline during market volatility are essential practices.',
      },
      {
        topic: 'Stock Market',
        question: 'How is the Nepalese government supporting investments in the hydropower sector?',
        answer: 'To combat rising construction costs and high interest rates that deter investment, Nepal\'s Electricity Regulatory Commission has introduced differentiated Power Purchase Agreement (PPA) rates for storage hydropower projects. Projects up to 100 MW are now capped at higher rates (NPR 14.80 per kWh in winter and NPR 8.45 in the monsoon), and rates for larger projects will be determined based on actual total project costs.',
      }
    ],
    quiz: [
      {
        question: 'According to recent studies using Sharpe\'s Single Index Model on NEPSE, which sector is surprisingly NOT included in the mathematically optimal high-return portfolio?',
        options: ['Non-life insurance', 'Commercial banks', 'Hydropower', 'Microfinance'],
        correctIndex: 1
      },
      {
        question: 'Which of the following financial factors in Nepalese companies has been shown to be negatively related to systemic risk, making the stock a safer bet?',
        options: ['Large firm size', 'Consistent dividend payments', 'High leverage (debt)', 'Low liquidity'],
        correctIndex: 1
      },
      {
        question: 'Why is Credit Portfolio Management (CPM) considered a critical survival mechanism for Microfinance Institutions (MFIs)?',
        options: ['Because outstanding microloans make up nearly 90% of their total assets', 'Because it allows them to invest in foreign stocks', 'Because it guarantees a 100% tax exemption from the government', 'Because they are legally required to manage the portfolios of individual retail investors'],
        correctIndex: 0
      },
      {
        question: 'Why is the NEPSE index so heavily influenced by the banking sector?',
        options: ['Because banks are the only companies allowed to trade on NEPSE', 'Because banks, financial institutions, and insurance companies collectively make up over 50% of the market\'s total capitalization', 'Because foreign investors exclusively buy banking stocks', 'Because the government sets the share prices for all banks daily'],
        correctIndex: 1
      }
    ]
  },
  {
    id: 'behavioral-finance',
    level: 'Advanced',
    title: 'Behavioral Finance: The Psychology of Trading',
    desc: 'The psychology of trading — FOMO, panic selling, and how to control emotions during a NEPSE bear market.',
    duration: '18:00',
    tag: 'Stock Market',
    videoUrl: 'https://www.youtube.com/embed/ahHg5Xup1j4',
    thumbnail: 'https://img.youtube.com/vi/ahHg5Xup1j4/maxresdefault.jpg',
    chapters: [
      'Herding Behavior in the NEPSE',
      'The Dual Forces of Fear and Greed',
      'FOMO and Overconfidence Biases',
      'The Role of Neuroplasticity and Financial Literacy',
      'Mindfulness and Emotional Regulation',
    ],
    faqs: [
      {
        topic: 'Stock Market',
        question: 'What is Behavioral Finance, and why is it particularly relevant to the Nepal Stock Exchange (NEPSE)?',
        answer: 'Behavioral finance is a field that combines cognitive psychology with traditional financial theories to explain why investors often make irrational decisions rather than logical ones based strictly on a company\'s fundamentals. It is highly relevant to NEPSE because Nepal\'s stock market is heavily retail-dominated, meaning daily price fluctuations are largely driven by investor emotions—such as panic selling or FOMO—rather than algorithms or institutional strategies.',
      },
      {
        topic: 'Stock Market',
        question: 'What is "Herding Behavior," and what causes it in the Nepalese stock market?',
        answer: 'Herding behavior occurs when investors ignore their own independent analysis and blindly copy the actions of a larger crowd, finding comfort in numbers. In NEPSE, this phenomenon is often triggered by hasty decision-making, social influence, and rumors. For instance, retail investors might heavily purchase hydropower stocks simply because "everyone else is buying," creating a self-fulfilling loop of market volatility.',
      },
      {
        topic: 'Stock Market',
        question: 'How do the dual forces of "Fear" and "Greed" impact stock prices?',
        answer: 'Fear and greed are intense emotional forces that can cause stock prices to completely disconnect from a company\'s actual valuation. Greed can irrationally inflate stock valuations and push them into continuous upper circuits, while fear induces panic selling, dragging fundamentally strong companies (like solid banks) below their book value and hitting lower circuits.',
      },
      {
        topic: 'Stock Market',
        question: 'What does FOMO mean in trading, and how can it be avoided?',
        answer: 'FOMO, or the Fear Of Missing Out, is an anxiety-driven emotion that prompts investors to make impulsive, unplanned trades because they are terrified of missing a profitable opportunity. It is commonly triggered by volatile markets, social media hype, recent winning streaks, and rumors. Students can avoid FOMO by investing with a pre-defined plan, taking social media advice with skepticism, keeping a trading journal to track triggers, and never investing money they cannot afford to lose.',
      },
      {
        topic: 'Stock Market',
        question: 'What are the most common cognitive biases that cause investors to lose money?',
        answer: 'Research identifies several major biases that negatively impact financial returns: Overconfidence Bias (overestimating own knowledge and taking excessive risks), Loss Aversion (feeling the pain of a loss 2.5 times more intensely than a gain, causing irrational holding), and Representativeness Bias (making decisions based on stereotypes or short-term trends rather than fundamental analysis).',
      },
      {
        topic: 'Stock Market',
        question: 'What is the "Disposition Effect"?',
        answer: 'The disposition effect is a behavioral bias where investors sell their winning stocks too quickly to lock in gains, but hold onto their losing stocks for too long. This is heavily linked to "regret aversion," where the investor tries to avoid the psychological pain of accepting a financial loss, irrationally hoping the stock will eventually recover.',
      },
      {
        topic: 'Stock Market',
        question: 'How does "Neuroplasticity" apply to investing and financial literacy?',
        answer: 'Neuroplasticity refers to an individual\'s cognitive ability to adapt, learn from past experiences, and modify their decision-making patterns over time. In Nepal\'s capital market, having high financial literacy and strong cognitive awareness directly enhances an investor\'s neuroplasticity. Furthermore, an investor\'s risk absorption capacity acts as a crucial bridge, allowing them to translate their financial knowledge into flexible, adaptive investment behavior during market downturns.',
      },
      {
        topic: 'Stock Market',
        question: 'Can Technical Analysis actually work in an emotionally driven market like NEPSE?',
        answer: 'Yes, technical analysis works effectively in retail-heavy markets like NEPSE because price charts reflect the collective emotional state and decisions of the market participants. Standard tools like the RSI (Relative Strength Index), MACD, and moving averages help filter out noise. However, on NEPSE, technical analysis is most powerful when combined with broker flow data (floorsheets) to confirm if a breakout is genuinely backed by institutional accumulation or if it is just a retail trap.',
      },
      {
        topic: 'Stock Market',
        question: 'What does it mean for a trader\'s emotions to run "too hot" or "too cold"?',
        answer: 'A trader\'s emotional state can be visualized as a thermometer. Running "too hot" means the trader is acting out of greed, excitement, anger, panic, or overconfidence, which leads to impulsive mistakes. Conversely, running "too cold" means the trader is overly relaxed, blasé, or unprepared for the trading day. The goal is to regulate emotions to stay in the "sweet spot" or the "zone" of optimal focus and preparation.',
      },
      {
        topic: 'Stock Market',
        question: 'How can mindfulness practices improve my trading performance?',
        answer: 'Mindfulness practices help traders maintain their emotional "sweet spot" and avoid impulsive reactions in a high-pressure market. Pre-trading: Setting clear daily intentions and using 5–10 minutes of meditation can build focus. During trading: Using the 4-7-8 breathing technique during stressful moments, taking tech-free breaks, and mentally labeling emotions (e.g., "I\'m feeling greedy") can drastically reduce anxiety. Post-trading: Journaling successes and mistakes without self-criticism, alongside practicing gratitude, helps disconnect from the market and reinforces positive behavior.',
      }
    ],
    quiz: [
      {
        question: 'What causes "Herding Behavior" in the Nepalese stock market?',
        options: ['Strict regulations enforced by SEBON', 'Investors ignoring independent analysis and blindly copying the actions of a larger crowd due to social influence and rumors', 'A sudden increase in corporate dividends', 'Algorithms programmed by institutional investors'],
        correctIndex: 1
      },
      {
        question: 'How does FOMO (Fear Of Missing Out) typically affect an investor\'s decision-making?',
        options: ['It makes them highly cautious and unwilling to trade', 'It prompts them to make impulsive, unplanned trades because they are terrified of missing a profitable opportunity', 'It forces them to only buy government bonds', 'It encourages them to do deep fundamental analysis before buying'],
        correctIndex: 1
      },
      {
        question: 'What is the "Disposition Effect" in behavioral finance?',
        options: ['Selling winning stocks too quickly to lock in gains, but holding onto losing stocks for too long', 'Selling losing stocks immediately and holding winning stocks forever', 'The tendency to only invest in companies with a high disposition of cash', 'The refusal to ever sell a stock, regardless of its performance'],
        correctIndex: 0
      },
      {
        question: 'According to the video, what does it mean for a trader\'s emotions to run "too hot"?',
        options: ['The trader is highly focused and perfectly prepared for the day', 'The trader is overly relaxed and blasé about the market', 'The trader is acting out of greed, excitement, anger, panic, or overconfidence, leading to impulsive mistakes', 'The trader has made a continuous streak of profitable trades'],
        correctIndex: 2
      }
    ]
  },
  {
    id: 'national-budget-fiscal-policy',
    level: 'Advanced',
    title: 'The National Budget (Fiscal Policy)',
    desc: 'How the government raises revenue, allocates spending, and how the annual budget directly impacts businesses and the stock market.',
    duration: '22:00',
    tag: 'Policy & Economics',
    videoUrl: 'https://www.youtube.com/embed/Gj1BnbOZkj0',
    thumbnail: 'https://img.youtube.com/vi/Gj1BnbOZkj0/maxresdefault.jpg',
    chapters: [
      'Ambitious FY 2026/27 Budget Goals and Structural Reforms',
      'Major Personal Income and Capital Gains Tax Relief',
      'The "Efficiency Gap" in Provincial Fiscal Federalism',
      'Accountability Deficits and Audit Irregularities',
      'Stagnant Growth Amidst Strong External Reserves (World Bank Update)',
    ],
    faqs: [
      {
        topic: 'Policy & Economics',
        question: 'What are the government\'s main economic targets for FY 2026/27, and are they realistic?',
        answer: 'The government has set an ambitious target to achieve a 7% economic growth rate and contain inflation within 6%. However, recent data from the World Bank suggests these targets may be difficult to reach; the World Bank projects a much lower growth rate of 2.3% for FY26 due to weak agricultural performance and social unrest.',
      },
      {
        topic: 'Policy & Economics',
        question: 'How does the new budget plan to integrate Artificial Intelligence (AI) into Nepal\'s economy?',
        answer: 'The budget heavily prioritizes technological innovation, planning to establish the country\'s first \'Sovereign AI Compute Center\' in Syuchatar, Kathmandu. The government aims to leverage Nepal\'s clean hydropower to provide subsidized compute capacity to AI entrepreneurs and startups, and plans to invite 15 internationally recognized Nepali researchers to return home through a prestigious AI fellowship.',
      },
      {
        topic: 'Policy & Economics',
        question: 'How will the new personal income tax changes affect the middle class?',
        answer: 'To expand the middle class and provide financial relief, the government has doubled the personal income tax exemption threshold to NPR 1 million. Furthermore, the highest marginal personal income tax rate has been drastically reduced from 39% to 29%.',
      },
      {
        topic: 'Policy & Economics',
        question: 'What are the specific changes to the capital gains tax for stock market investors?',
        answer: 'The capital gains tax on listed securities has been restructured to 10% for holdings of one year or less, and 7.5% for holdings exceeding one year. Importantly, the government has arranged for this to be treated as a final withholding tax.',
      },
      {
        topic: 'Policy & Economics',
        question: 'What is the "efficiency gap" in Nepal\'s provincial fiscal federalism?',
        answer: 'The "efficiency gap" refers to the persistent under-absorption of capital budgets by provincial governments. It highlights that the core constraint holding back subnational development is no longer a lack of funds from the federal government, but rather a weak execution capacity that leaves development funds idle.',
      },
      {
        topic: 'Policy & Economics',
        question: 'Why do provincial governments struggle to spend their allocated capital budgets?',
        answer: 'Provinces struggle to execute capital spending due to systemic issues like delays in procurement, land acquisition problems, and weak project preparedness. In infrastructure-poor provinces like Sudurpashchim, these issues are worsened by geographic remoteness, weaker market connectivity, and limited technical capacity within provincial agencies.',
      },
      {
        topic: 'Policy & Economics',
        question: 'Which province has the highest rate of financial irregularities, and what causes this?',
        answer: 'Madhesh Province has the highest irregularity ratio at 2.53% of its audited spending, and carries the largest outstanding stock of unsettled advances at NPR 9.2 billion. This accountability deficit is driven by a lack of financial transparency, poor public disclosure of contracts, and a failure to properly allocate local revenue like vehicle taxes.',
      },
      {
        topic: 'Policy & Economics',
        question: 'What caused the sharp drop in Nepal\'s inflation rate recently?',
        answer: 'Inflation dropped sharply to 1.7% primarily due to falling food prices. This decline was driven by cheaper vegetables, spices, pulses, and cereal grains, which resulted from favorable harvests and base effects from the first half of the previous fiscal year.',
      },
      {
        topic: 'Policy & Economics',
        question: 'What is driving Nepal\'s strong external sector and record-high foreign exchange reserves?',
        answer: 'Nepal\'s external sector has strengthened significantly, with the current account surplus widening to a record high of 6.7% of GDP. This massive surplus, which has boosted foreign exchange reserves to cover 18.1 months of imports, is heavily driven by international remittance inflows.',
      },
      {
        topic: 'Policy & Economics',
        question: 'How might the conflict in the Middle East negatively impact Nepal\'s economy?',
        answer: 'The World Bank warns that the Middle East conflict poses severe downside risks across three main channels: it could disrupt remittance inflows (as the region accounts for about 40% of Nepali migrant workers\' remittances), cause energy and fuel costs to rise since Nepal relies entirely on imported petroleum, and negatively affect tourist arrivals due to higher aviation fuel prices and global uncertainty.',
      }
    ],
    quiz: [
      {
        question: 'What is the government\'s ambitious economic growth target for FY 2026/27 as stated in the new budget?',
        options: ['2.3%', '7%', '10%', '6%'],
        correctIndex: 1
      },
      {
        question: 'What is the new personal income tax exemption threshold introduced in the FY 2026/27 budget?',
        options: ['NPR 500,000', 'NPR 1 million', 'NPR 2 million', 'NPR 700,000'],
        correctIndex: 1
      },
      {
        question: 'What does the "efficiency gap" in Nepal\'s provincial fiscal federalism refer to?',
        options: ['The inability of the federal government to collect taxes', 'The persistent under-absorption of capital budgets by provincial governments due to weak execution capacity', 'The high rate of inflation caused by food prices', 'The lack of foreign direct investment in the banking sector'],
        correctIndex: 1
      },
      {
        question: 'What is heavily driving Nepal\'s record-high foreign exchange reserves and current account surplus?',
        options: ['Massive exports of agricultural goods', 'International remittance inflows', 'High foreign direct investment in AI startups', 'Significant tourism revenue from Europe'],
        correctIndex: 1
      }
    ]
  },
  {
    id: 'remittance-economy',
    level: 'Advanced',
    title: 'The Remittance Economy',
    desc: 'Analyzing Nepal\'s heavy reliance on foreign employment, its impact on foreign exchange reserves, and the Dutch Disease phenomenon.',
    duration: '20:00',
    tag: 'Policy & Economics',
    videoUrl: 'https://www.youtube.com/embed/E9ajY0yKzew',
    thumbnail: 'https://img.youtube.com/vi/E9ajY0yKzew/maxresdefault.jpg',
    chapters: [
      'The "Dutch Disease" Risk and Export Stagnation',
      'Remittance Volatility and Social Vulnerability',
      'The Vicious Cycle of Labor Export and Food Import',
      'Misallocation of Credit and Real Estate Bubbles',
      'Macroeconomic Vulnerability to External Shocks',
    ],
    faqs: [
      {
        topic: 'Policy & Economics',
        question: 'What is the "Dutch Disease," and is Nepal currently suffering from it?',
        answer: 'The "Dutch Disease" occurs when a large influx of foreign currency (like remittances) causes a country\'s real exchange rate to appreciate, making its exports more expensive and less competitive, which ultimately shrinks its domestic manufacturing sector. Studies show mixed evidence for Nepal. Some macroeconomic models indicate Nepal exhibits clear symptoms of Dutch Disease, as massive remittances have coincided with a declining ratio of manufacturing to services. However, other researchers argue that Nepal\'s main issue isn\'t classic Dutch Disease, but rather a failure of domestic institutions to convert remittance savings into productive, exportable capacity.',
      },
      {
        topic: 'Policy & Economics',
        question: 'How does the volatility of remittance inflows impact students, particularly girls?',
        answer: 'Because remittances fund approximately 40% of private educational expenses in Nepal, fluctuations in these inflows hit students extremely hard. Girls are disproportionately affected during economic downturns. Research shows that during periods of high remittance volatility, girls\' secondary school enrollment can drop by up to 21%. Families often prioritize immediate consumption needs over long-term social investments, which threatens to reverse decades of progress in gender equity.',
      },
      {
        topic: 'Policy & Economics',
        question: 'Why is Nepal trapped in a "vicious cycle" of exporting labor and importing food?',
        answer: 'Due to limited domestic employment opportunities, a massive portion of Nepal\'s youth migrates abroad for work. This creates a severe labor shortage in the agricultural sector, leaving farmland barren and reducing domestic food production. Consequently, Nepal is forced to rely heavily on imported food to meet its domestic needs, using the very remittances earned by its exported labor to pay for it.',
      },
      {
        topic: 'Policy & Economics',
        question: 'Why are real estate prices in the Kathmandu Valley inflating so rapidly?',
        answer: 'A massive portion of remittances and bank loans are channeled into the real estate sector rather than productive industries because real estate is perceived as a safe, high-return investment. This surge of liquidity has fueled artificial real estate bubbles in Kathmandu, inflating land prices up to 20-fold over 15 years. This deprives the manufacturing and entrepreneurial sectors of much-needed capital.',
      },
      {
        topic: 'Policy & Economics',
        question: 'How do global events, such as conflicts in the Middle East, pose a threat to Nepal\'s economy?',
        answer: 'The Middle East is a critical destination for Nepali migrant workers, accounting for roughly 40% of the country\'s remittance inflows. Geopolitical conflicts in this region pose severe risks because they can disrupt remittance channels, increase global fuel prices (Nepal imports 100% of its refined petroleum), and severely impact aviation connectivity and international tourism, threatening Nepal\'s overall macroeconomic stability.',
      },
      {
        topic: 'Policy & Economics',
        question: 'What role do Nepal\'s banks play in the country\'s widening trade deficit?',
        answer: 'Instead of funding productive manufacturing, banks direct a significant portion of their credit (over 20%) to wholesale and retail sectors, which primarily fuels the import of foreign goods. Econometric studies reveal that a 1% increase in bank credit to the private sector actually increases Nepal\'s trade deficit by about 0.5% because the loans boost domestic consumption rather than domestic production.',
      },
      {
        topic: 'Policy & Economics',
        question: 'Do remittances help improve Nepal\'s export performance?',
        answer: 'No, remittances largely fail to boost export performance. Studies show that remittances have a strong positive impact on imports but an insignificant effect on exports. Because funds are predominantly absorbed by household consumption and non-tradable sectors (like real estate), they do not translate into technology, skills, or exportable capacity.',
      },
      {
        topic: 'Policy & Economics',
        question: 'Are rural and urban areas in Nepal equally vulnerable to fluctuations in remittances?',
        answer: 'No, rural areas are significantly more vulnerable. Specifically, the Far-Western and Mid-Western rural regions experience educational, healthcare, and community development impacts that are more than twice as severe as those in major urban centers when remittance inflows become unstable.',
      },
      {
        topic: 'Policy & Economics',
        question: 'What is the current macroeconomic condition of Nepal regarding inflation and GDP growth?',
        answer: 'In the first half of FY26, inflation dropped sharply to 1.7%, primarily driven by falling food prices. However, economic growth has remained stagnant. Real GDP growth is projected to be sluggish at 2.3% for FY26, and inflation is expected to rise to 4.3% due to global uncertainties and external shocks.',
      },
      {
        topic: 'Policy & Economics',
        question: 'What policies could help Nepal overcome its over-dependence on remittances and imports?',
        answer: 'Experts suggest Nepal needs a comprehensive shift from simply formalizing remittance flows to actively channeling these funds into productive investments. Key policy recommendations include: Issuing targeted "Remittance Bonds" to fund infrastructure, requiring banks to prioritize loans to the manufacturing and agricultural sectors, and establishing an Emergency Educational Protection Fund to ensure students, especially girls, do not drop out when remittance income fluctuates.',
      }
    ],
    quiz: [
      {
        question: 'What does the "Dutch Disease" refer to in the context of Nepal\'s economy?',
        options: ['An excessive influx of foreign currency causing domestic productive sectors to decline', 'A rapid increase in agricultural exports to European countries', 'A situation where a country completely stops importing goods', 'A viral outbreak affecting the agricultural workforce'],
        correctIndex: 0
      },
      {
        question: 'How does the volatility of remittance inflows disproportionately impact education in Nepal?',
        options: ['It causes a massive increase in private university tuitions', 'It forces the government to close public schools', 'It leads to a significant decline in girls\' secondary school enrollment as families prioritize immediate consumption', 'It primarily affects boys\' primary education in urban centers'],
        correctIndex: 2
      },
      {
        question: 'Why is Nepal described as being trapped in a "vicious cycle" regarding labor and food?',
        options: ['The government exports food and imports foreign labor', 'It exports its young workforce, which shrinks domestic agriculture, forcing the country to use those earned remittances to import food', 'It imports raw materials to manufacture food for export', 'It refuses to allow citizens to work abroad, causing a food surplus'],
        correctIndex: 1
      },
      {
        question: 'In Nepal, what is a major negative consequence of banks directing significant credit towards the wholesale and retail sectors instead of manufacturing?',
        options: ['It creates a massive surplus of domestic goods that cannot be sold', 'It fuels the import of foreign goods and actually increases the trade deficit', 'It immediately solves the issue of youth unemployment', 'It causes real estate prices to drop drastically'],
        correctIndex: 1
      }
    ]
  },
  {
    id: 'trade-deficit-hydropower',
    level: 'Advanced',
    title: 'Trade Deficit & Hydropower Export',
    desc: 'Understanding Nepal\'s import-heavy economy and the future economic potential of exporting electricity to India and Bangladesh.',
    duration: '25:00',
    tag: 'Policy & Economics',
    videoUrl: 'https://www.youtube.com/embed/SSrsr3fRpkc',
    thumbnail: 'https://img.youtube.com/vi/SSrsr3fRpkc/maxresdefault.jpg',
    chapters: [
      'The Burden of a Massive Trade Deficit and Macroeconomic Imbalance',
      'Foreign Direct Investment (FDI) as a Catalyst for Growth',
      'Hydropower as the Ultimate Economic Backbone',
      'Strategic Regional Energy Trade Agreements',
      'Environmental Challenges and the 10-Year Energy Strategy',
    ],
    faqs: [
      {
        topic: 'Policy & Economics',
        question: 'What is the current status of Nepal\'s trade deficit, and why is it a major concern?',
        answer: 'Nepal is currently experiencing a massive and growing trade deficit, meaning the value of its imports far exceeds its exports. For the first ten months of Fiscal Year 2025/26, the total trade deficit increased by 14.9% to reach Rs. 1443.68 billion. The export-to-import ratio stood at an alarming 14.7%. This is a major concern because it forces Nepal to deplete its foreign exchange reserves to pay for imports, slows down real GDP growth, and increases inflationary pressures on the domestic economy.',
      },
      {
        topic: 'Policy & Economics',
        question: 'What are the primary causes of Nepal\'s high trade deficit?',
        answer: 'Several structural and economic factors contribute to the deficit. Nepal\'s landlocked geography prevents direct sea route access, leading to expensive freight and transportation costs. Other significant causes include low domestic productivity, a scarcity of resources and skilled manpower, high production costs due to imported raw materials, and ongoing political instability. Consequently, the country relies heavily on importing goods from India and China.',
      },
      {
        topic: 'Policy & Economics',
        question: 'How does Nepal manage to finance its massive trade deficit?',
        answer: 'Nepal primarily finances its trade deficit through foreign remittances sent by Nepalese citizens working abroad. In the first ten months of FY 2025/26, remittance inflows grew by 41.2% to Rs. 1916.90 billion. While this vital income helps stabilize the economy and reduce poverty, it also ironically fuels the trade deficit; higher disposable income increases the purchasing power of the population, which leads to a greater demand for imported consumer goods.',
      },
      {
        topic: 'Policy & Economics',
        question: 'How is Nepal trying to attract Foreign Direct Investment (FDI)?',
        answer: 'To offset its economic vulnerabilities and fund large projects, Nepal has implemented several investment-friendly policies. The country allows 100% foreign ownership in numerous sectors, guarantees that foreign-invested industries will not be nationalized, and permits full repatriation of profits and dividends. The government has also launched an "Automatic Route" system, allowing investors in specific sectors (like energy, tourism, and IT) with capital up to NPR 500 million to receive instant FDI approvals online.',
      },
      {
        topic: 'Policy & Economics',
        question: 'Why is hydropower considered the "game changer" for Nepal\'s economy?',
        answer: 'Nepal is home to thousands of rivers with an economically feasible hydropower potential of roughly 42,000 to 43,000 Megawatts (MW). Currently, only about 3,269 MW (or 7.8%) of this capacity is operational. Fully developing this sector is viewed as an economic game changer because it would provide clean energy for low-carbon industrialization, substitute the need for costly imported fossil fuels, and generate substantial foreign exchange revenue through electricity exports, directly addressing the trade deficit.',
      },
      {
        topic: 'Policy & Economics',
        question: 'Who are Nepal\'s main energy trading partners, and how much is it earning?',
        answer: 'Nepal currently exports electricity to India and Bangladesh. In the first five months of FY 2025/26 alone, Nepal earned over Rs. 18.26 billion by exporting approximately 2.714 billion units of electricity. Furthermore, Nepal recently signed a landmark 25-year long-term power trade agreement with India, aiming to export 10,000 MW of electricity to India over the next decade.',
      },
      {
        topic: 'Policy & Economics',
        question: 'How does Nepal export electricity to Bangladesh without a shared border?',
        answer: 'Because Nepal and Bangladesh do not share a physical border, a historic tripartite agreement was signed on October 3, 2024, involving India. This pact allows Nepal to export 40 MW of electricity to Bangladesh using India\'s existing transmission grid. The power travels from Nepal to India via the Dhalkebar-Muzaffarpur transmission line, and then crosses from India to Bangladesh via the Baharampur-Bheramara line.',
      },
      {
        topic: 'Policy & Economics',
        question: 'What major infrastructure and financial challenges does Nepal\'s hydropower sector face?',
        answer: 'The sector is constrained by severe transmission grid limitations; Nepal currently has only 6,507 circuit km of transmission lines against a requirement of over 17,000 km by 2035. Projects also face prolonged permitting processes, land acquisition disputes, and high-cost debt financing from domestic banks. Additionally, because 83% of Nepal\'s projects are "run-of-river" (relying on natural river flow), the country produces surplus electricity during the rainy season but faces energy deficits and relies on imports during dry winters.',
      },
      {
        topic: 'Policy & Economics',
        question: 'How is climate change threatening Nepal\'s energy ambitions?',
        answer: 'Climate change induces severe weather events, such as erratic monsoons, massive floods, and Glacial Lake Outburst Floods (GLOFs), which actively damage critical energy infrastructure. For instance, recent unprecedented rainfall washed away multiple hydropower sites and transmission lines, disrupting about 1,000 to 1,100 MW of power generation. Increased sediment and abrasive sand loads in the rivers also reduce turbine efficiency and drive up maintenance costs.',
      },
      {
        topic: 'Policy & Economics',
        question: 'What are the goals of Nepal\'s "10-Year Energy Strategy"?',
        answer: 'The government\'s "Energy Consumption Growth and Export Strategy (2083)" aims to establish Nepal as South Asia\'s clean energy hub by the year 2035. The ambitious targets include reaching a total electricity production of 28,500 MW, boosting domestic per capita consumption to 1,500 units, and achieving an export capacity of 15,000 MW. To fix the seasonal energy imbalances, the strategy heavily prioritizes the construction of large reservoir-based and pumped storage projects.',
      }
    ],
    quiz: [
      {
        question: 'What is the primary way Nepal currently finances its massive trade deficit?',
        options: ['By exporting manufactured goods to Europe', 'Through foreign remittances sent by Nepalese citizens working abroad', 'By taking large loans from the World Bank', 'Through massive foreign direct investment in the tourism sector'],
        correctIndex: 1
      },
      {
        question: 'Why is hydropower considered the "game changer" for Nepal\'s economy?',
        options: ['Because it is the only industry allowed by the government', 'It would provide clean energy, substitute costly imported fossil fuels, and generate substantial revenue through electricity exports', 'Because it requires zero initial investment to build', 'It completely eliminates the need for foreign remittances'],
        correctIndex: 1
      },
      {
        question: 'How is Nepal able to export electricity to Bangladesh despite not sharing a physical border?',
        options: ['By using high-capacity underwater cables', 'Through a historic tripartite agreement allowing Nepal to use India\'s existing cross-border transmission grid', 'By transporting batteries via cargo flights', 'Nepal actually does share a direct border with Bangladesh'],
        correctIndex: 1
      },
      {
        question: 'Why does Nepal sometimes face energy deficits and rely on imports during dry winters, despite its hydropower potential?',
        options: ['Because 83% of Nepal\'s projects are "run-of-river" and rely on natural river flow, which drops in winter', 'Because the government shuts down power plants in winter to save money', 'Because all electricity is automatically exported to India during winter', 'Because snow completely covers all solar panels during winter'],
        correctIndex: 0
      }
    ]
  }
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

interface Module {
  id: string;
  title: string;
  description: string;
  lessonIds: string[];
  guideIds: string[];
}

const MODULES: Module[] = [
  {
    id: 'financial-literacy',
    title: 'Financial Literacy',
    description: 'Personal finance fundamentals — budgeting, saving, and understanding how NRB policy affects your wallet.',
    lessonIds: ['budgeting-emergency-fund', 'financial-literacy-youth', 'digital-payments-security', 'navigating-taxes-nepal', 'retirement-social-security', 'insurance-101'],
    guideIds: ['financial-literacy'],
  },
  {
    id: 'investing-markets',
    title: 'Investing & Markets',
    description: 'How NEPSE works, how to read it, and how to start investing in Nepal\'s stock market.',
    lessonIds: ['demystifying-nepse', 'nepse-fundamental-analysis', 'technical-analysis-intro', 'ipo-vs-secondary-market', 'modern-finance-intro', 'mutual-funds-sips', 'portfolio-risk-management', 'behavioral-finance'],
    guideIds: ['nepse-guide'],
  },
  {
    id: 'economics-research',
    title: 'Economics & Research',
    description: 'Macroeconomics, monetary policy, and original Arthneeti research on Nepal\'s economy.',
    lessonIds: ['monetary-policy-2026', 'ssa-reality', 'national-budget-fiscal-policy', 'remittance-economy', 'trade-deficit-hydropower'],
    guideIds: ['economics-guidebook'],
  },
];

// Flattened FAQ list — pulled from all lessons that have FAQs attached.
// New lessons with a `faqs` array automatically show up here too.
const FAQS: FAQ[] = LESSONS.flatMap(lesson => lesson.faqs || []);

export const LEVEL_COLORS: Record<string, string> = {
  'Beginner': 'bg-mint-action/10 text-mint-action border-mint-action/20',
  'Intermediate': 'bg-amber-400/10 text-amber-500 border-amber-400/20',
  'Advanced': 'bg-coral-flame/10 text-coral-flame border-coral-flame/20',
};

const TAG_COLORS: Record<string, string> = {
  'Stock Market':       'bg-mint-action/10 text-mint-action border-mint-action/20',
  'Policy & Economics': 'bg-cobalt-blue/10 text-cobalt-blue border-cobalt-blue/20',
  'Technical Analysis': 'bg-amber-400/10 text-amber-500 border-amber-400/20',
  'Financial Literacy': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  'Research':           'bg-coral-flame/10 text-coral-flame border-coral-flame/20',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function LearnPage() {
  const { user } = useAuth();
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [certificateModule, setCertificateModule] = useState<string | null>(null);
  const [certificateModuleId, setCertificateModuleId] = useState<string | null>(null);
  const [masterExamModule, setMasterExamModule] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson>(
    LESSONS.find(l => l.id === lessonId) ?? LESSONS[0]
  );
  const [isPlaying, setIsPlaying]       = useState(!!lessonId);
  const [completed, setCompleted]       = useState<Set<string>>(new Set());
  const [quizScores, setQuizScores]     = useState<Record<string, number>>({});
  const [masterExamScores, setMasterExamScores] = useState<Record<string, number>>({});
  const [badges, setBadges] = useState<Set<string>>(new Set());
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq]   = useState<number | null>(null);
  const [expandedLessonFaq, setExpandedLessonFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery]   = useState('');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);

  // ── Load completed lessons from Firestore ──────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const snap = await getDoc(doc(db, 'users', user.uid, 'progress', 'lessons'));
      if (snap.exists()) {
        const data = snap.data();
        setCompleted(new Set(data.completed || []));
        setQuizScores(data.quizScores || {});
        setMasterExamScores(data.masterExamScores || {});
        setBadges(new Set(data.badges || []));
      }
    };
    fetch();
  }, [user]);

  const submitQuiz = async (lessonId: string, scorePercent: number) => {
    const newQuizScores = { ...quizScores, [lessonId]: scorePercent };
    setQuizScores(newQuizScores);
    
    // Check for "Quiz Whiz" badge (100% on 3 different quizzes)
    const newBadges = new Set(badges);
    if (!newBadges.has('Quiz Whiz')) {
      const perfectScores = Object.values(newQuizScores).filter(s => s === 100).length;
      if (perfectScores >= 3 || (scorePercent === 100 && perfectScores === 2)) {
        newBadges.add('Quiz Whiz');
      }
    }
    
    if (scorePercent < 60) {
      if (user) {
        await setDoc(doc(db, 'users', user.uid, 'progress', 'lessons'), { quizScores: newQuizScores, updatedAt: serverTimestamp() }, { merge: true });
      }
      return;
    }

    const next = new Set(completed);
    next.add(lessonId);
    setCompleted(next);

    if (!newBadges.has('First Steps') && next.size >= 1) {
      newBadges.add('First Steps');
    }
    
    setBadges(newBadges);

    if (user) {
      await setDoc(
        doc(db, 'users', user.uid, 'progress', 'lessons'),
        {
          completed: Array.from(next),
          quizScores: newQuizScores,
          badges: Array.from(newBadges),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  };

  const submitMasterExam = async (moduleId: string, scorePercent: number) => {
    const newMasterScores = { ...masterExamScores, [moduleId]: scorePercent };
    setMasterExamScores(newMasterScores);
    setMasterExamModule(null);

    if (scorePercent >= 80) {
      const newBadges = new Set(badges);
      if (moduleId === 'financial-literacy' && !newBadges.has('Financial Literacy Master')) newBadges.add('Financial Literacy Master');
      if (moduleId === 'investing-markets' && !newBadges.has('Market Maestro')) newBadges.add('Market Maestro');
      
      setBadges(newBadges);
      
      if (user) {
        await setDoc(doc(db, 'users', user.uid, 'progress', 'lessons'), {
          masterExamScores: newMasterScores,
          badges: Array.from(newBadges),
          updatedAt: serverTimestamp()
        }, { merge: true });

        // Save public certificate doc for shareable link
        const mod = MODULES.find(m => m.id === moduleId);
        const modTitle = mod ? mod.title : moduleId;
        await setDoc(doc(db, 'certificates', `${user.uid}_${moduleId}`), {
          uid: user.uid,
          name: profile?.name || user.displayName || 'Arthneeti Scholar',
          moduleId,
          moduleTitle: modTitle,
          score: scorePercent,
          completedAt: serverTimestamp(),
          topPerformer: false
        });
      }
      
      const mod = MODULES.find(m => m.id === moduleId);
      if (mod) {
        setCertificateModule(mod.title);
        setCertificateModuleId(mod.id);
      }
    }
  };

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
    setIsAssistantOpen(false); // Close AI assistant when switching lessons
    navigate(`/learn/${lesson.id}`, { replace: true });
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
  <main className="py-32 px-6 min-h-screen bg-white">
    <div className="max-w-7xl mx-auto space-y-8">

      {/* Page Header */}
      <div className="mb-16">
        <p className="text-[10px] font-bold uppercase tracking-widest text-mint-action mb-4">Arthneeti Academy</p>
        <h1 className="text-5xl md:text-7xl font-display text-brandwood leading-[0.90] mb-6">
          Learn Economics.<br />Understand Nepal.
        </h1>
        <p className="text-text-muted font-sans max-w-xl">
          Structured lessons, written guides, and research — built for Nepali students who want to understand markets, policy, and money.
        </p>
      </div>

      {/* Active Lesson Player — shown when a lesson is playing */}
      {isPlaying && (
        <div ref={playerRef} className="bg-white border border-blush-mist rounded-3xl overflow-hidden mb-16 shadow-warm-lift">
          
          {/* Video */}
          <div className="aspect-video w-full">
            <iframe
              src={activeLesson.videoUrl}
              title={activeLesson.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          <div className="p-10 space-y-8">
            {/* Lesson Meta */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-[9px] font-bold uppercase tracking-widest border-transparent px-3 py-1 rounded-lg ${
                    activeLesson.level === 'Beginner' ? 'bg-mint-action/10 text-mint-action' :
                    activeLesson.level === 'Intermediate' ? 'bg-amber-400/10 text-amber-500' :
                    'bg-coral-flame/10 text-coral-flame'
                  }`}>
                    {activeLesson.level}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted">{activeLesson.duration}</span>
                </div>
                <h2 className="text-3xl font-display text-brandwood">{activeLesson.title}</h2>
                <p className="text-text-muted font-sans mt-2 max-w-2xl">{activeLesson.desc}</p>
              </div>

              {/* Actions: Mark Complete & Ask AI */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setIsAssistantOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all bg-gradient-to-r from-coral-flame to-brandwood text-white shadow-warm-float hover:opacity-90"
                >
                  <span className="material-symbols-outlined text-[16px]">psychology</span>
                  Ask AI Tutor
                </button>
                {user && (!activeLesson.quiz || activeLesson.quiz.length === 0) && (
                  <button
                    onClick={() => markComplete(activeLesson.id)}
                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shrink-0 ${
                      completed.has(activeLesson.id)
                        ? 'bg-mint-action/10 text-mint-action border border-mint-action/30'
                        : 'bg-white text-text-muted border border-blush-mist hover:border-mint-action/30 hover:text-mint-action'
                    }`}
                  >
                    {completed.has(activeLesson.id) ? '✓ Completed' : 'Mark Complete'}
                  </button>
                )}
              </div>
            </div>

            {/* Chapters */}
            {activeLesson.chapters.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">What's covered</p>
                <div className="space-y-2">
                  {activeLesson.chapters.map((chapter, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <span className="text-[9px] font-bold text-mint-action mt-0.5 shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-sm text-brandwood font-sans">{chapter}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resources */}
            {activeLesson.resources && activeLesson.resources.length > 0 && (
              <div className="border-t border-blush-mist pt-8 mt-8">
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">Downloads & Resources</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeLesson.resources.map((resource, i) => (
                    <a key={i} href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white border border-blush-mist rounded-2xl hover:border-mint-action/50 hover:bg-sunset-fade transition-all group shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sunset-fade flex items-center justify-center text-text-muted group-hover:text-mint-action transition-colors">
                          <Download size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-brandwood group-hover:text-mint-action transition-colors">{resource.title}</p>
                          <p className="text-xs text-text-muted font-sans">{resource.size}</p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Inline FAQs */}
            {user && activeLesson.quiz && activeLesson.quiz.length > 0 && (
              <LessonQuiz
                lessonId={activeLesson.id}
                questions={activeLesson.quiz}
                passed={completed.has(activeLesson.id)}
                existingScore={quizScores[activeLesson.id]}
                onSubmit={submitQuiz}
              />
            )}

            {activeLesson.faqs && activeLesson.faqs.length > 0 && (
              <div className="border-t border-blush-mist pt-8">
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-6">
                  Frequently Asked Questions
                </p>
                <div className="space-y-4">
                  {activeLesson.faqs.map((faq, i) => (
                    <div key={i} className="bg-white border border-blush-mist rounded-2xl p-6 shadow-sm">
                      <h4 className="text-sm font-bold text-brandwood mb-3">{faq.question}</h4>
                      <p className="text-text-muted font-sans text-sm leading-relaxed">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lesson Discussion */}
            <LessonCommentSection lessonId={activeLesson.id} />
          </div>
        </div>
      )}

      {/* Module Sections */}
      {MODULES.map((module) => {
        const moduleLessons = module.lessonIds
          .map(id => LESSONS.find(l => l.id === id))
          .filter((l): l is Lesson => l !== undefined);

        const completedInModule = moduleLessons.filter(l => completed.has(l.id)).length;
        const moduleGuides = GUIDES.filter(g => module.guideIds.includes(g.id));

        return (
          <section key={module.id} className="space-y-6">
            
            {/* Module Header */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="border-b border-blush-mist pb-6"
            >
              <h2 className="text-2xl font-display text-brandwood mb-2">{module.title}</h2>
              <p className="text-text-muted font-sans text-sm">{module.description}</p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-text-muted">
                  <span>{completedInModule} / {moduleLessons.length} complete</span>
                  <span>{Math.round((completedInModule / moduleLessons.length) * 100) || 0}%</span>
                </div>
                <div className="h-1.5 bg-sunset-fade rounded-full overflow-hidden border border-blush-mist">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(completedInModule / moduleLessons.length) * 100 || 0}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.2, type: 'spring' }}
                    className="h-full bg-mint-action"
                  />
                </div>
              </div>
              
              {/* Certificate & Master Exam Unlock */}
              {completedInModule === moduleLessons.length && moduleLessons.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', bounce: 0.5 }}
                  className="mt-6 bg-sunset-fade border border-blush-mist p-4 rounded-2xl flex items-center justify-between flex-wrap gap-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-2xl border border-blush-mist shadow-warm-lift">
                      <Award size={20} className="text-coral-flame" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brandwood">Module Completed!</p>
                      <p className="text-xs text-text-muted">
                        {masterExamScores[module.id] >= 80 
                          ? `You passed the Master Exam with ${masterExamScores[module.id]}%.` 
                          : `Unlock your certificate by passing the Master Exam.`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {(!masterExamScores[module.id] || masterExamScores[module.id] < 80) && (
                      <button
                        onClick={() => setMasterExamModule(module.id)}
                        className="px-4 py-2 bg-coral-flame text-white text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-[0_4px_15px_rgba(247,59,32,0.3)] hover:opacity-90 transition-all"
                      >
                        Take Master Exam
                      </button>
                    )}
                    {masterExamScores[module.id] >= 80 && (
                      <button
                        onClick={() => setCertificateModule(module.title)}
                        className="px-4 py-2 bg-white text-coral-flame border border-blush-mist text-[10px] font-bold uppercase tracking-widest rounded-xl hover:border-coral-flame/50 hover:bg-sunset-fade transition-all"
                      >
                        View Certificate
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Lesson Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {moduleLessons.map((lesson, index) => {
                return (
                  <button
                    key={lesson.id}
                    onClick={() => playLesson(lesson)}
                    className={`text-left bg-white border rounded-3xl overflow-hidden transition-all group hover:border-mint-action/50 shadow-warm-lift hover:shadow-warm-float ${
                      activeLesson.id === lesson.id && isPlaying
                        ? 'border-mint-action/50 bg-sunset-fade'
                        : 'border-blush-mist'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={lesson.thumbnail}
                        alt={lesson.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-brandwood/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.div 
                          whileHover={{ scale: 1.2 }}
                          className="w-12 h-12 rounded-2xl bg-white backdrop-blur flex items-center justify-center shadow-warm-lift"
                        >
                          <Play size={20} className="text-mint-action ml-1" />
                        </motion.div>
                      </div>
                      {completed.has(lesson.id) && (
                        <div className="absolute top-3 right-3 bg-mint-action rounded-2xl p-1.5 shadow-warm-lift border border-white">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur rounded-xl px-2 py-1 shadow-sm border border-blush-mist">
                        <span className="text-[9px] font-bold text-brandwood">{index + 1}</span>
                      </div>
                    </div>

                    {/* Lesson Info */}
                    <div className="p-6 space-y-3">
                      <div className="flex items-center gap-3">
                        <span className={`inline-block text-[9px] font-bold uppercase tracking-widest border-transparent px-2 py-0.5 rounded-lg ${
                          lesson.level === 'Beginner' ? 'bg-mint-action/10 text-mint-action' :
                          lesson.level === 'Intermediate' ? 'bg-amber-400/10 text-amber-500' :
                          'bg-coral-flame/10 text-coral-flame'
                        }`}>
                          {lesson.level}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted">{lesson.duration}</span>
                      </div>
                      <h3 className="text-base font-bold leading-snug transition-colors text-brandwood group-hover:text-coral-flame font-display">
                        {lesson.title}
                      </h3>
                      <p className="text-text-muted font-sans text-xs line-clamp-2">{lesson.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Written Guides — bottom of module */}
            {moduleGuides.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Written Guide</p>
                {moduleGuides.map((guide, idx) => (
                  <motion.div 
                    key={guide.id} 
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, type: 'spring' }}
                    className="bg-white border border-blush-mist rounded-3xl p-6 hover:border-mint-action/50 transition-all shadow-warm-lift"
                  >
                    <div className="flex items-start justify-between gap-6 flex-wrap">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="inline-block text-[9px] font-bold uppercase tracking-widest bg-sunset-fade text-brandwood border border-blush-mist px-2 py-0.5 rounded-lg">
                            {guide.category}
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted">{guide.readingTime}</span>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted">{guide.language}</span>
                        </div>
                        <h3 className="text-base font-bold text-brandwood">{guide.title}</h3>
                        <p className="text-text-muted font-sans text-sm">{guide.description}</p>

                        {/* Chapters */}
                        <div className="pt-2 space-y-1">
                          {guide.chapters.map((chapter, i) => (
                            <div key={i} className="flex items-start gap-3">
                              <span className="text-[9px] font-bold text-mint-action mt-0.5 shrink-0">
                                {String(i + 1).padStart(2, '0')}
                              </span>
                              <span className="text-xs text-brandwood font-sans">{chapter}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-3 shrink-0">
                        
                          <motion.a href={guide.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center justify-center gap-2 px-5 py-3 bg-mint-action/10 text-mint-action border border-mint-action/30 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-mint-action hover:text-white transition-all shadow-sm"
                        >
                          <BookOpen size={14} /> Read Online
                        </motion.a>
                        
                          <motion.a href={guide.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center justify-center gap-2 px-5 py-3 bg-white text-text-muted border border-blush-mist rounded-xl text-[10px] font-bold uppercase tracking-widest hover:text-brandwood hover:border-coral-flame transition-all shadow-sm"
                        >
                          <Download size={14} /> Download PDF
                        </motion.a>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>

    {/* Modals & Assistants */}
     <CertificateModal 
      isOpen={!!certificateModule} 
      onClose={() => {
        setCertificateModule(null);
        setCertificateModuleId(null);
      }} 
      moduleTitle={certificateModule || ''} 
      moduleId={certificateModuleId || ''}
    />
    
    <AILessonAssistant 
      isOpen={isAssistantOpen}
      onClose={() => setIsAssistantOpen(false)}
      lessonTitle={activeLesson.title}
      lessonSummary={activeLesson.desc + " " + activeLesson.chapters.join(", ")}
      lessonFaqs={activeLesson.faqs}
      lessonQuizzes={activeLesson.quiz}
      lessonTag={activeLesson.tag}
    />
  </main>
);
}
