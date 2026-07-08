import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  TrendingUp, TrendingDown, DollarSign, Briefcase, History,
  ArrowUpRight, ArrowDownRight, RefreshCw, Lock, AlertTriangle,
  Info, CheckCircle2, Search, BarChart3, Brain, Zap, Target,
  Shield, Clock, Award, ChevronRight, ChevronDown, X, AlertCircle,
  Newspaper, Lightbulb, GraduationCap, LineChart, PieChart, Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface EconomicEvent {
  id: string;
  title: string;
  description: string;
  category: 'monetary' | 'fiscal' | 'external' | 'corporate';
  impact: 'positive' | 'negative' | 'neutral';
  affectedSectors: string[];
  impactMagnitude: number;
  date: string;
}

interface StockData {
  symbol: string;
  name: string;
  sector: string;
  ltp: number;
  change: number;
  percentChange: number;
  pe: number;
  eps: number;
  bookValue: number;
  roe: number;
  marketCap: number;
  dividendYield: number;
  technicalScore: number;
  rsi: number;
  macd: number;
  support: number;
  resistance: number;
  trend: 'bullish' | 'bearish' | 'neutral';
}

interface Portfolio {
  cash: number;
  holdings: Record<string, { qty: number; avgCost: number; entryTime: number }>;
  startingCapital: number;
  tradeHistory: Trade[];
}

interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  qty: number;
  price: number;
  timestamp: number;
  eventContext?: string;
}

const ECONOMIC_EVENTS = [
  {
    id: 'nrb-rate-cut',
    title: 'NRB Cuts Policy Rate by 0.5%',
    description: 'Nepal Rastra Bank reduces the policy rate from 5.0% to 4.5% in a cautiously accommodative stance to boost economic recovery.',
    category: 'monetary' as const,
    impact: 'positive' as const,
    affectedSectors: ['banking', 'microfinance'],
    impactMagnitude: 6,
    date: '2026-01-15',
  },
  {
    id: 'budget-tax-relief',
    title: 'Budget Announces Capital Gains Tax Relief',
    description: 'The national budget restructures capital gains tax to 10% for holdings of one year or less and 7.5% for over one year.',
    category: 'fiscal' as const,
    impact: 'positive' as const,
    affectedSectors: ['banking', 'insurance'],
    impactMagnitude: 4,
    date: '2026-05-15',
  },
  {
    id: 'remittance-surge',
    title: 'Remittance Inflows Surge 41.2%',
    description: 'Foreign remittance inflows grow by 41.2% to Rs. 1916.90 billion in first 10 months of FY 2025/26, boosting foreign exchange reserves.',
    category: 'external' as const,
    impact: 'positive' as const,
    affectedSectors: ['banking', 'consumer'],
    impactMagnitude: 5,
    date: '2026-03-20',
  },
  {
    id: 'trade-deficit-widen',
    title: 'Trade Deficit Widens 14.9%',
    description: 'Nepal trade deficit increases to Rs. 1443.68 billion with export-to-import ratio at alarming 14.7%.',
    category: 'external' as const,
    impact: 'negative' as const,
    affectedSectors: ['manufacturing', 'hydropower'],
    impactMagnitude: -4,
    date: '2026-04-10',
  },
  {
    id: 'nfrs9-implementation',
    title: 'NFRS 9 Expected Credit Loss Reporting',
    description: 'Banks must shift to Effective Interest Rate method for recognizing interest income, impacting reported profits for risky loans.',
    category: 'corporate' as const,
    impact: 'negative' as const,
    affectedSectors: ['banking', 'finance'],
    impactMagnitude: -3,
    date: '2026-06-01',
  },
  {
    id: 'hydropower-ppa',
    title: 'New PPA Rates for Hydropower',
    description: 'Electricity Regulatory Commission introduces differentiated PPA rates for storage hydropower projects up to 100 MW.',
    category: 'fiscal' as const,
    impact: 'positive' as const,
    affectedSectors: ['hydropower'],
    impactMagnitude: 7,
    date: '2026-02-28',
  },
  {
    id: 'fif-grey-list',
    title: 'Nepal on FATF Grey List',
    description: 'Nepal placed on FATF grey list due to AML/CFT framework deficiencies, potentially deterring foreign investment.',
    category: 'external' as const,
    impact: 'negative' as const,
    affectedSectors: ['banking', 'insurance'],
    impactMagnitude: -5,
    date: '2026-01-20',
  },
  {
    id: 'inflation-drop',
    title: 'Inflation Drops to 1.7%',
    description: 'Year-on-year inflation drops sharply to 1.7% due to falling food prices, well below NRB 5% target.',
    category: 'monetary' as const,
    impact: 'positive' as const,
    affectedSectors: ['consumer', 'banking'],
    impactMagnitude: 4,
    date: '2026-03-10',
  },
  {
    id: 'digital-payments',
    title: 'National Payment Switch Launch',
    description: 'NRB operationalizes the National Payment Switch, enabling seamless inter-bank digital transactions.',
    category: 'corporate' as const,
    impact: 'positive' as const,
    affectedSectors: ['banking', 'microfinance'],
    impactMagnitude: 3,
    date: '2026-04-05',
  },
  {
    id: 'middle-east-conflict',
    title: 'Middle East Geopolitical Tensions',
    description: 'Rising tensions in Middle East threaten remittance inflows and could increase fuel prices.',
    category: 'external' as const,
    impact: 'negative' as const,
    affectedSectors: ['banking', 'consumer'],
    impactMagnitude: -6,
    date: '2026-05-20',
  },
];

const INITIAL_STOCKS: StockData[] = [
  { symbol: 'NABIL', name: 'Nabil Bank Ltd', sector: 'banking', ltp: 850, change: 12, percentChange: 1.43, pe: 14.2, eps: 59.86, bookValue: 180, roe: 18.5, marketCap: 42500, dividendYield: 3.2, technicalScore: 65, rsi: 58, macd: 2.3, support: 820, resistance: 880, trend: 'bullish' },
  { symbol: 'NICA', name: 'Nepal Investment Bank', sector: 'banking', ltp: 420, change: -5, percentChange: -1.18, pe: 12.8, eps: 32.81, bookValue: 155, roe: 16.2, marketCap: 31500, dividendYield: 3.8, technicalScore: 42, rsi: 45, macd: -0.8, support: 405, resistance: 440, trend: 'neutral' },
  { symbol: 'SBL', name: 'Siddhartha Bank Ltd', sector: 'banking', ltp: 380, change: 8, percentChange: 2.15, pe: 11.5, eps: 33.04, bookValue: 140, roe: 17.8, marketCap: 28000, dividendYield: 4.1, technicalScore: 72, rsi: 62, macd: 1.5, support: 365, resistance: 395, trend: 'bullish' },
  { symbol: 'NHB', name: 'Nepal Hydroelectric', sector: 'hydropower', ltp: 520, change: 25, percentChange: 5.05, pe: 28.5, eps: 18.25, bookValue: 120, roe: 8.5, marketCap: 18000, dividendYield: 1.2, technicalScore: 85, rsi: 72, macd: 4.2, support: 480, resistance: 550, trend: 'bullish' },
  { symbol: 'AKPL', name: 'Arun Valley Hydropower', sector: 'hydropower', ltp: 340, change: -15, percentChange: -4.23, pe: 35.2, eps: 9.66, bookValue: 95, roe: 6.2, marketCap: 12000, dividendYield: 0.8, technicalScore: 25, rsi: 28, macd: -3.1, support: 325, resistance: 370, trend: 'bearish' },
  { symbol: 'CHL', name: 'Chilime Hydropower', sector: 'hydropower', ltp: 680, change: 18, percentChange: 2.72, pe: 22.8, eps: 29.82, bookValue: 165, roe: 12.5, marketCap: 22000, dividendYield: 2.1, technicalScore: 58, rsi: 55, macd: 1.8, support: 650, resistance: 700, trend: 'neutral' },
  { symbol: 'NIFRA', name: 'Nepal Insurance Authority', sector: 'insurance', ltp: 290, change: 5, percentChange: 1.75, pe: 15.8, eps: 18.35, bookValue: 110, roe: 14.2, marketCap: 15000, dividendYield: 2.8, technicalScore: 55, rsi: 52, macd: 0.9, support: 275, resistance: 305, trend: 'neutral' },
  { symbol: 'NIL', name: 'Nepal Insurance Ltd', sector: 'insurance', ltp: 450, change: -8, percentChange: -1.75, pe: 18.2, eps: 24.73, bookValue: 135, roe: 11.8, marketCap: 20000, dividendYield: 2.2, technicalScore: 38, rsi: 40, macd: -1.2, support: 435, resistance: 470, trend: 'bearish' },
  { symbol: 'GMFBS', name: 'Garima Microfinance', sector: 'microfinance', ltp: 1850, change: 45, percentChange: 2.49, pe: 22.5, eps: 82.22, bookValue: 280, roe: 22.5, marketCap: 8500, dividendYield: 1.8, technicalScore: 78, rsi: 65, macd: 3.5, support: 1780, resistance: 1920, trend: 'bullish' },
  { symbol: 'RMFBS', name: 'Rural Microfinance', sector: 'microfinance', ltp: 1420, change: -30, percentChange: -2.07, pe: 25.8, eps: 55.04, bookValue: 220, roe: 18.2, marketCap: 6200, dividendYield: 1.5, technicalScore: 35, rsi: 35, macd: -2.8, support: 1380, resistance: 1480, trend: 'bearish' },
  { symbol: 'UPPER', name: 'Upper Tamakoshi', sector: 'hydropower', ltp: 280, change: 12, percentChange: 4.48, pe: 42.5, eps: 6.59, bookValue: 85, roe: 5.8, marketCap: 25000, dividendYield: 0.5, technicalScore: 68, rsi: 68, macd: 2.8, support: 260, resistance: 295, trend: 'bullish' },
  { symbol: 'NBL', name: 'Nepal Bank Ltd', sector: 'banking', ltp: 520, change: 10, percentChange: 1.96, pe: 13.5, eps: 38.52, bookValue: 165, roe: 15.8, marketCap: 45000, dividendYield: 3.5, technicalScore: 62, rsi: 56, macd: 1.2, support: 500, resistance: 545, trend: 'bullish' },
];

const ECONOMIC_QUIZ: { question: string; options: string[]; correctIndex: number; explanation: string }[] = [
  {
    question: 'If NRB cuts the policy rate, which sector is MOST likely to benefit?',
    options: ['Hydropower', 'Banking & Microfinance', 'Insurance', 'Manufacturing'],
    correctIndex: 1,
    explanation: 'Lower policy rates reduce borrowing costs, directly benefiting banks and microfinance institutions that lend money.',
  },
  {
    question: 'A widening trade deficit typically puts downward pressure on which currency?',
    options: ['Indian Rupee', 'US Dollar', 'Nepali Rupee', 'Chinese Yuan'],
    correctIndex: 2,
    explanation: 'A widening trade deficit means more imports than exports, increasing demand for foreign currency and weakening the Nepali Rupee.',
  },
  {
    question: 'When remittance inflows surge, which sectors benefit the most?',
    options: ['Hydropower only', 'Banking and Consumer', 'Manufacturing', 'Insurance only'],
    correctIndex: 1,
    explanation: 'Higher remittances increase deposits in banks and boost consumer spending power, benefiting banking and consumer sectors.',
  },
  {
    question: 'What is the primary impact of NFRS 9 implementation on bank stocks?',
    options: ['Stocks double immediately', 'Reported profits may decrease due to higher expected credit loss provisions', 'No impact on stock prices', 'Banks stop lending completely'],
    correctIndex: 1,
    explanation: 'NFRS 9 requires banks to recognize expected credit losses earlier, which can reduce reported profits in the short term.',
  },
  {
    question: 'How does inflation at 1.7% (below NRB target of 5%) affect the stock market?',
    options: ['Negative for all stocks', 'Generally positive as it allows continued monetary easing', 'No effect', 'Only positive for gold'],
    correctIndex: 1,
    explanation: 'Low inflation gives NRB room to keep rates low or cut them further, which is generally supportive of stock valuations.',
  },
];

const FUNDAMENTAL_QUIZ: { question: string; options: string[]; correctIndex: number; explanation: string }[] = [
  {
    question: 'A stock with P/E ratio of 11.5 in the banking sector is likely:',
    options: ['Overvalued', 'Undervalued relative to peers', 'About to go bankrupt', 'A guaranteed buy'],
    correctIndex: 1,
    explanation: 'A P/E of 11.5 is lower than the sector average of ~14, suggesting the stock may be undervalued relative to peers.',
  },
  {
    question: 'Which metric shows how efficiently a bank generates profit from shareholders equity?',
    options: ['P/E Ratio', 'EPS', 'ROE (Return on Equity)', 'Market Cap'],
    correctIndex: 2,
    explanation: 'ROE measures how efficiently a company generates profit from shareholders equity - higher is better.',
  },
  {
    question: 'If a stock trades below its Book Value (P/B < 1), it means:',
    options: ['The company is bankrupt', 'The market values it below its accounting net worth', 'It has no future', 'It must be sold immediately'],
    correctIndex: 1,
    explanation: 'Trading below book value means the market values the company at less than its accounting net worth, potentially indicating undervaluation.',
  },
  {
    question: 'A high dividend yield in a banking stock typically indicates:',
    options: ['The company is about to fail', 'Good income potential for value investors', 'The stock price is too high', 'Zero risk investment'],
    correctIndex: 1,
    explanation: 'A high dividend yield means the stock pays good dividends relative to its price, attractive for income-focused investors.',
  },
  {
    question: 'When comparing P/E ratios, you should:',
    options: ['Compare any two companies', 'Only compare within the same sector', 'Always pick the highest P/E', 'Ignore P/E completely'],
    correctIndex: 1,
    explanation: 'Different sectors have different normal P/E ranges. Banks typically have lower P/E than hydropower or microfinance.',
  },
];

const TECHNICAL_QUIZ: { question: string; options: string[]; correctIndex: number; explanation: string }[] = [
  {
    question: 'An RSI above 70 typically indicates:',
    options: ['Oversold - good time to buy', 'Overbought - potential pullback ahead', 'Normal trading range', 'Market crash imminent'],
    correctIndex: 1,
    explanation: 'RSI above 70 suggests the stock may be overbought and could experience a price pullback or correction.',
  },
  {
    question: 'When a stock price approaches its support level, traders typically:',
    options: ['Sell immediately', 'Watch for a bounce or breakdown', 'Ignore it', 'Buy blindly'],
    correctIndex: 1,
    explanation: 'Support levels are where buying interest historically emerges. Traders watch for either a bounce (buy signal) or breakdown (sell signal).',
  },
  {
    question: 'A bullish MACD crossover (MACD crossing above signal line) suggests:',
    options: ['Sell immediately', 'Momentum is turning positive', 'The stock is worthless', 'No change expected'],
    correctIndex: 1,
    explanation: 'A bullish MACD crossover indicates positive momentum is building, often used as a buy signal.',
  },
  {
    question: 'If a stock is in a bullish trend and approaching resistance at Rs. 880, the best strategy is:',
    options: ['Buy at market price immediately', 'Wait for a breakout above Rs. 880 with volume', 'Short sell', 'Sell all holdings'],
    correctIndex: 1,
    explanation: 'Buying at resistance is risky. A breakout above resistance with volume confirms the trend continuation.',
  },
  {
    question: 'Bollinger Bands squeezing (contracting) indicates:',
    options: ['Market is closed', 'A period of low volatility before a potential breakout', 'Stock will go to zero', 'Nothing important'],
    correctIndex: 1,
    explanation: 'When Bollinger Bands contract, it signals a squeeze - low volatility often precedes a large directional move.',
  },
];

function applyEconomicEvent(stocks: StockData[], event: typeof ECONOMIC_EVENTS[0]): StockData[] {
  return stocks.map(stock => {
    const isAffected = event.affectedSectors.includes(stock.sector) || event.affectedSectors.includes('all');
    if (!isAffected) return stock;

    const factor = event.impactMagnitude * (0.008 + Math.random() * 0.012);
    const priceChange = stock.ltp * (factor / 100);
    const newLtp = Math.max(50, Math.round(stock.ltp + priceChange));

    const newChange = Math.round(newLtp - stock.ltp);
    const newPctChange = stock.ltp > 0 ? parseFloat(((newChange / stock.ltp) * 100).toFixed(2)) : 0;

    const newRsi = Math.max(10, Math.min(90, stock.rsi + factor * 2));
    const newTrend: StockData['trend'] = newRsi > 65 ? 'bullish' : newRsi < 35 ? 'bearish' : 'neutral';

    return {
      ...stock,
      ltp: newLtp,
      change: newChange,
      percentChange: newPctChange,
      rsi: parseFloat(newRsi.toFixed(1)),
      technicalScore: Math.max(-100, Math.min(100, stock.technicalScore + factor * 5)),
      trend: newTrend,
    };
  });
}

function simulatePriceMovement(stocks: StockData[]): StockData[] {
  return stocks.map(stock => {
    const volatility = stock.trend === 'bullish' ? 0.005 : stock.trend === 'bearish' ? 0.008 : 0.003;
    const drift = stock.trend === 'bullish' ? 0.001 : stock.trend === 'bearish' ? -0.001 : 0;
    const noise = (Math.random() - 0.5) * 2 * volatility;
    const priceChange = stock.ltp * (drift + noise);
    const newLtp = Math.max(50, Math.round(stock.ltp + priceChange));
    const newChange = newLtp - stock.ltp;
    const newPctChange = stock.ltp > 0 ? parseFloat(((newChange / stock.ltp) * 100).toFixed(2)) : 0;

    const newRsi = Math.max(10, Math.min(90, stock.rsi + (noise * 50)));
    const newMacd = stock.macd + noise * 20;

    return {
      ...stock,
      ltp: newLtp,
      change: newChange,
      percentChange: newPctChange,
      rsi: parseFloat(newRsi.toFixed(1)),
      macd: parseFloat(newMacd.toFixed(2)),
      technicalScore: Math.max(-100, Math.min(100, stock.technicalScore + noise * 100)),
      trend: newRsi > 65 ? 'bullish' : newRsi < 35 ? 'bearish' : 'neutral',
    };
  });
}

export default function TradingGamePage() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();

  const [gameStarted, setGameStarted] = useState(false);
  const [stocks, setStocks] = useState<StockData[]>(INITIAL_STOCKS);
  const [portfolio, setPortfolio] = useState<Portfolio>({
    cash: 1000000,
    holdings: {},
    startingCapital: 1000000,
    tradeHistory: [],
  });

  const [currentEvent, setCurrentEvent] = useState<typeof ECONOMIC_EVENTS[0] | null>(null);
  const [eventIndex, setEventIndex] = useState(0);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventImpactApplied, setEventImpactApplied] = useState(false);

  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [orderQty, setOrderQty] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [tradingLoading, setTradingLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'market' | 'quiz' | 'portfolio'>('market');
  const [quizModule, setQuizModule] = useState<'economic' | 'fundamental' | 'technical'>('economic');
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState({ economic: 0, fundamental: 0, technical: 0 });
  const [quizCompleted, setQuizCompleted] = useState({ economic: false, fundamental: false, technical: false });

  const [showStockDetail, setShowStockDetail] = useState<string | null>(null);

  const getQuizQuestions = useCallback(() => {
    switch (quizModule) {
      case 'economic': return ECONOMIC_QUIZ;
      case 'fundamental': return FUNDAMENTAL_QUIZ;
      case 'technical': return TECHNICAL_QUIZ;
    }
  }, [quizModule]);

  const currentQuiz = getQuizQuestions();
  const totalQuizScore = quizScore.economic + quizScore.fundamental + quizScore.technical;
  const maxQuizScore = ECONOMIC_QUIZ.length + FUNDAMENTAL_QUIZ.length + TECHNICAL_QUIZ.length;

  const holdingsValue = useMemo(() => {
    return Object.entries(portfolio.holdings).reduce((acc, [sym, pos]) => {
      const stock = stocks.find(s => s.symbol === sym);
      const price = stock ? stock.ltp : pos.avgCost;
      return acc + (pos.qty * price);
    }, 0);
  }, [portfolio.holdings, stocks]);

  const totalPortfolioValue = portfolio.cash + holdingsValue;
  const totalReturn = ((totalPortfolioValue - portfolio.startingCapital) / portfolio.startingCapital) * 100;
  const unrealizedPL = useMemo(() => {
    return Object.entries(portfolio.holdings).reduce((acc, [sym, pos]) => {
      const stock = stocks.find(s => s.symbol === sym);
      const price = stock ? stock.ltp : pos.avgCost;
      return acc + (pos.qty * (price - pos.avgCost));
    }, 0);
  }, [portfolio.holdings, stocks]);

  const selectedStock = stocks.find(s => s.symbol === selectedSymbol);
  const currentPrice = selectedStock ? selectedStock.ltp : 0;
  const estTotal = currentPrice * orderQty;
  const upperSymbol = selectedSymbol.toUpperCase();

  const filteredStocks = searchQuery.trim() === ''
    ? stocks.slice(0, 8)
    : stocks.filter(s => s.symbol.includes(searchQuery.toUpperCase()) || s.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 8);

  const handleStartGame = () => {
    setGameStarted(true);
    triggerEvent(0);
  };

  const triggerEvent = (idx: number) => {
    if (idx < ECONOMIC_EVENTS.length) {
      const event = ECONOMIC_EVENTS[idx];
      setCurrentEvent(event);
      setShowEventModal(true);
      setEventImpactApplied(false);
    }
  };

  const handleApplyEvent = () => {
    if (!currentEvent) return;
    setStocks(prev => applyEconomicEvent(prev, currentEvent));
    setEventImpactApplied(true);
    setShowEventModal(false);
    toast.success(`Market impact applied: ${currentEvent.title}`);
  };

  const handleDismissEvent = () => {
    setShowEventModal(false);
    setEventImpactApplied(true);
  };

  const handleNextEvent = () => {
    const nextIdx = eventIndex + 1;
    setEventIndex(nextIdx);
    if (nextIdx < ECONOMIC_EVENTS.length) {
      setStocks(prev => simulatePriceMovement(prev));
      triggerEvent(nextIdx);
    } else {
      setStocks(prev => simulatePriceMovement(prev));
      toast.info('All economic events have been processed. Continue trading!');
    }
  };

  const handleQuizAnswer = (answerIndex: number) => {
    if (quizAnswered !== null) return;
    setQuizAnswered(answerIndex);
    const isCorrect = answerIndex === currentQuiz[quizIndex].correctIndex;
    if (isCorrect) {
      setQuizScore(prev => ({ ...prev, [quizModule]: prev[quizModule] + 1 }));
      toast.success('Correct! ' + currentQuiz[quizIndex].explanation);
    } else {
      toast.error('Incorrect. ' + currentQuiz[quizIndex].explanation);
    }
  };

  const handleQuizNext = () => {
    if (quizIndex < currentQuiz.length - 1) {
      setQuizIndex(quizIndex + 1);
      setQuizAnswered(null);
    } else {
      setQuizCompleted(prev => ({ ...prev, [quizModule]: true }));
      toast.info(`Quiz completed! Score: ${quizScore[quizModule]}/${currentQuiz.length}`);
      setQuizIndex(0);
      setQuizAnswered(null);
      if (quizModule === 'economic') setQuizModule('fundamental');
      else if (quizModule === 'fundamental') setQuizModule('technical');
    }
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSymbol || orderQty <= 0) {
      toast.error('Please enter a valid stock and quantity.');
      return;
    }

    setTradingLoading(true);
    try {
      if (orderSide === 'buy') {
        const cost = currentPrice * orderQty;
        if (cost > portfolio.cash) {
          toast.error('Insufficient cash for this trade.');
          setTradingLoading(false);
          return;
        }
        if (cost > 0.25 * totalPortfolioValue) {
          toast.error('Position exceeds 25% portfolio cap.');
          setTradingLoading(false);
          return;
        }

        const existing = portfolio.holdings[upperSymbol];
        const newQty = (existing ? existing.qty : 0) + orderQty;
        const newAvgCost = existing
          ? ((existing.qty * existing.avgCost) + cost) / newQty
          : currentPrice;

        setPortfolio(prev => ({
          ...prev,
          cash: prev.cash - cost,
          holdings: {
            ...prev.holdings,
            [upperSymbol]: { qty: newQty, avgCost: newAvgCost, entryTime: Date.now() },
          },
          tradeHistory: [
            { id: Date.now().toString(), symbol: upperSymbol, side: 'buy', qty: orderQty, price: currentPrice, timestamp: Date.now(), eventContext: currentEvent?.title },
            ...prev.tradeHistory,
          ],
        }));
        toast.success(`Bought ${orderQty} ${upperSymbol} at Rs. ${currentPrice}`);
      } else {
        const existing = portfolio.holdings[upperSymbol];
        if (!existing || existing.qty < orderQty) {
          toast.error('Insufficient shares to sell.');
          setTradingLoading(false);
          return;
        }

        const proceeds = currentPrice * orderQty;
        const newQty = existing.qty - orderQty;
        const newHoldings = { ...portfolio.holdings };
        if (newQty === 0) delete newHoldings[upperSymbol];
        else newHoldings[upperSymbol] = { ...existing, qty: newQty };

        setPortfolio(prev => ({
          ...prev,
          cash: prev.cash + proceeds,
          holdings: newHoldings,
          tradeHistory: [
            { id: Date.now().toString(), symbol: upperSymbol, side: 'sell', qty: orderQty, price: currentPrice, timestamp: Date.now(), eventContext: currentEvent?.title },
            ...prev.tradeHistory,
          ],
        }));
        toast.success(`Sold ${orderQty} ${upperSymbol} at Rs. ${currentPrice}`);
      }

      setOrderQty(1);
      setSelectedSymbol('');
      setSearchQuery('');
    } catch (err) {
      toast.error('Trade failed.');
    } finally {
      setTradingLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#090a0b] flex items-center justify-center text-white">
        <RefreshCw className="animate-spin text-[#dc143c] mr-3" size={32} />
        <span className="font-bold tracking-widest text-sm uppercase">Loading...</span>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-[#090a0b] flex items-center justify-center p-6 text-white">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full bg-white/[0.02] border border-white/[0.06] rounded-3xl p-10 backdrop-blur-md shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-[#dc143c]/10 border border-[#dc143c]/20 text-[#dc143c] rounded-full flex items-center justify-center mx-auto mb-6">
              <BarChart3 size={40} />
            </div>
            <h1 className="text-4xl font-display font-medium text-white tracking-tight mb-4">Arthneeti Trading Simulator</h1>
            <p className="text-[#9f9fa0] text-sm leading-relaxed max-w-lg mx-auto">
              Master the art of trading by combining economic analysis, fundamental stock analysis, and technical chart reading.
              Your success depends on excelling in all three modules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-[#003893]/10 border border-[#003893]/20 rounded-2xl p-6 text-center">
              <Newspaper className="text-[#3b82f6] mx-auto mb-3" size={28} />
              <h3 className="text-white font-bold text-sm mb-2">Economic Events</h3>
              <p className="text-[#9f9fa0] text-xs">Real Nepal economic events that impact stock sectors differently</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center">
              <Brain className="text-green-500 mx-auto mb-3" size={28} />
              <h3 className="text-white font-bold text-sm mb-2">Fundamental Analysis</h3>
              <p className="text-[#9f9fa0] text-xs">Pick stocks using P/E, EPS, Book Value, and ROE metrics</p>
            </div>
            <div className="bg-amber-400/10 border border-amber-400/20 rounded-2xl p-6 text-center">
              <LineChart className="text-amber-500 mx-auto mb-3" size={28} />
              <h3 className="text-white font-bold text-sm mb-2">Technical Analysis</h3>
              <p className="text-[#9f9fa0] text-xs">Time your trades using RSI, MACD, Support/Resistance levels</p>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 mb-8">
            <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
              <Shield size={16} className="text-[#3b82f6]" /> Game Rules
            </h4>
            <ul className="space-y-2 text-xs text-[#9f9fa0]">
              <li className="flex items-start gap-2"><span className="text-[#3b82f6]">1.</span> Start with NPR 1,000,000 virtual cash</li>
              <li className="flex items-start gap-2"><span className="text-[#3b82f6]">2.</span> Economic events will affect different sectors - analyze the impact before trading</li>
              <li className="flex items-start gap-2"><span className="text-[#3b82f6]">3.</span> Use fundamental analysis to pick undervalued stocks (low P/E, high ROE)</li>
              <li className="flex items-start gap-2"><span className="text-[#3b82f6]">4.</span> Use technical analysis to time your entry and exit (RSI, MACD, support/resistance)</li>
              <li className="flex items-start gap-2"><span className="text-[#3b82f6]">5.</span> Answer knowledge quizzes to boost your understanding and score</li>
              <li className="flex items-start gap-2"><span className="text-[#3b82f6]">6.</span> Max 25% allocation per stock, 5-minute cooldown between same-symbol trades</li>
            </ul>
          </div>

          <button onClick={handleStartGame}
            className="w-full py-4 bg-[#dc143c] hover:bg-[#b01030] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors shadow-lg shadow-[#dc143c]/20 flex justify-center items-center gap-2">
            <Zap size={16} /> Start Trading Game
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090a0b] py-24 px-6 md:px-12 text-white">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Sign-in banner */}
        {!user && (
          <div className="bg-amber-400/10 border border-amber-400/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-400/20 rounded-full flex items-center justify-center">
                <Lock size={20} className="text-amber-400" />
              </div>
              <div>
                <p className="text-amber-200 font-bold text-sm">Playing as Guest</p>
                <p className="text-amber-200/60 text-xs">Sign in to save your progress and compete on the leaderboard</p>
              </div>
            </div>
            <Link to="/" className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black font-bold text-[10px] uppercase tracking-widest rounded-xl transition-colors">
              Sign In
            </Link>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-display font-medium text-white tracking-tight">Trading Simulator</h1>
            <p className="text-[#9f9fa0] text-sm mt-1">Master economics, fundamentals, and technicals to succeed.</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleNextEvent} disabled={eventIndex >= ECONOMIC_EVENTS.length}
              className="px-4 py-2 bg-[#003893] hover:bg-[#002f80] disabled:bg-white/5 disabled:text-[#9f9fa0] text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2">
              <Newspaper size={14} /> Next Event ({eventIndex}/{ECONOMIC_EVENTS.length})
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#9f9fa0] block mb-1">Portfolio Value</span>
            <span className="text-xl font-mono font-bold text-white">NPR {totalPortfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            <div className="flex items-center gap-1 mt-1">
              {totalReturn >= 0
                ? <span className="text-xs font-bold text-green-500 flex items-center gap-0.5"><TrendingUp size={12} />+{totalReturn.toFixed(2)}%</span>
                : <span className="text-xs font-bold text-[#dc143c] flex items-center gap-0.5"><TrendingDown size={12} />{totalReturn.toFixed(2)}%</span>
              }
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#9f9fa0] block mb-1">Cash</span>
            <span className="text-xl font-mono font-bold text-white">NPR {portfolio.cash.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#9f9fa0] block mb-1">Holdings</span>
            <span className="text-xl font-mono font-bold text-white">NPR {holdingsValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#9f9fa0] block mb-1">Unrealized P&L</span>
            <span className={`text-xl font-mono font-bold ${unrealizedPL >= 0 ? 'text-green-500' : 'text-[#dc143c]'}`}>
              {unrealizedPL >= 0 ? '+' : ''}{unrealizedPL.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#9f9fa0] block mb-1">Knowledge Score</span>
            <span className="text-xl font-mono font-bold text-[#3b82f6]">{totalQuizScore}/{maxQuizScore}</span>
            <div className="w-full bg-white/10 rounded-full h-1.5 mt-2">
              <div className="bg-[#3b82f6] h-1.5 rounded-full transition-all" style={{ width: `${(totalQuizScore / maxQuizScore) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Active Event Banner */}
        {currentEvent && eventImpactApplied && (
          <div className={`rounded-2xl p-4 flex items-center gap-4 ${currentEvent.impact === 'positive' ? 'bg-green-500/10 border border-green-500/20' : 'bg-[#dc143c]/10 border border-[#dc143c]/20'}`}>
            <Zap size={20} className={currentEvent.impact === 'positive' ? 'text-green-500' : 'text-[#dc143c]'} />
            <div className="flex-1">
              <span className="text-xs font-bold text-white">{currentEvent.title}</span>
              <span className="text-[10px] text-[#9f9fa0] ml-2">Affects: {currentEvent.affectedSectors.join(', ')}</span>
            </div>
            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${currentEvent.impact === 'positive' ? 'bg-green-500/20 text-green-500' : 'bg-[#dc143c]/20 text-[#dc143c]'}`}>
              {currentEvent.impact === 'positive' ? 'BULLISH' : 'BEARISH'}
            </span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex bg-white/[0.02] border border-white/[0.06] rounded-2xl p-1">
          {[
            { id: 'market' as const, label: 'Market', icon: BarChart3 },
            { id: 'quiz' as const, label: 'Knowledge Quiz', icon: GraduationCap },
            { id: 'portfolio' as const, label: 'Portfolio', icon: Briefcase },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === tab.id ? 'bg-[#dc143c] text-white shadow-lg shadow-[#dc143c]/20' : 'text-[#9f9fa0] hover:text-white'
              }`}>
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Market Tab */}
        {activeTab === 'market' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Stock List */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-white/[0.06] flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="text-[#3b82f6]" size={20} />
                    <h2 className="text-lg font-bold font-sans">NEPSE Stocks</h2>
                  </div>
                  <button onClick={() => setStocks(prev => simulatePriceMovement(prev))}
                    className="p-2 hover:bg-white/5 rounded-xl transition-colors text-[#9f9fa0] hover:text-white">
                    <RefreshCw size={14} />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-[10px] font-black uppercase tracking-widest text-[#9f9fa0]/60">
                        <th className="py-3 px-4">Symbol</th>
                        <th className="py-3 px-4 text-right">LTP</th>
                        <th className="py-3 px-4 text-right">Change</th>
                        <th className="py-3 px-4 text-right">P/E</th>
                        <th className="py-3 px-4 text-right">RSI</th>
                        <th className="py-3 px-4 text-center">Trend</th>
                        <th className="py-3 px-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {stocks.map(stock => (
                        <tr key={stock.symbol} className="border-b border-white/[0.04] hover:bg-white/[0.01] transition-colors font-mono text-xs">
                          <td className="py-3 px-4">
                            <span className="font-bold text-white block">{stock.symbol}</span>
                            <span className="text-[10px] text-[#9f9fa0] block">{stock.sector}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-white">Rs. {stock.ltp}</td>
                          <td className="py-3 px-4 text-right">
                            <span className={`font-bold ${stock.change >= 0 ? 'text-green-500' : 'text-[#dc143c]'}`}>
                              {stock.change >= 0 ? '+' : ''}{stock.percentChange}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-[#9f9fa0]">{stock.pe}x</td>
                          <td className="py-3 px-4 text-right">
                            <span className={`font-bold ${stock.rsi > 70 ? 'text-[#dc143c]' : stock.rsi < 30 ? 'text-green-500' : 'text-[#9f9fa0]'}`}>
                              {stock.rsi}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                              stock.trend === 'bullish' ? 'bg-green-500/10 text-green-500' :
                              stock.trend === 'bearish' ? 'bg-[#dc143c]/10 text-[#dc143c]' :
                              'bg-white/5 text-[#9f9fa0]'
                            }`}>
                              {stock.trend}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button onClick={() => setShowStockDetail(showStockDetail === stock.symbol ? null : stock.symbol)}
                              className="px-2 py-1 bg-[#003893]/10 hover:bg-[#003893] text-[#3b82f6] hover:text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition-all">
                              Detail
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Expanded Stock Detail */}
              <AnimatePresence>
                {showStockDetail && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="bg-white/[0.02] border border-white/[0.06] rounded-3xl overflow-hidden shadow-xl">
                    {(() => {
                      const stock = stocks.find(s => s.symbol === showStockDetail);
                      if (!stock) return null;
                      return (
                        <div className="p-6">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">{stock.symbol} - {stock.name}</h3>
                            <button onClick={() => setShowStockDetail(null)} className="text-[#9f9fa0] hover:text-white"><X size={16} /></button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white/[0.03] rounded-xl p-4">
                              <span className="text-[10px] text-[#9f9fa0] uppercase">EPS</span>
                              <span className="text-lg font-mono font-bold text-white block">Rs. {stock.eps}</span>
                            </div>
                            <div className="bg-white/[0.03] rounded-xl p-4">
                              <span className="text-[10px] text-[#9f9fa0] uppercase">Book Value</span>
                              <span className="text-lg font-mono font-bold text-white block">Rs. {stock.bookValue}</span>
                            </div>
                            <div className="bg-white/[0.03] rounded-xl p-4">
                              <span className="text-[10px] text-[#9f9fa0] uppercase">ROE</span>
                              <span className="text-lg font-mono font-bold text-white block">{stock.roe}%</span>
                            </div>
                            <div className="bg-white/[0.03] rounded-xl p-4">
                              <span className="text-[10px] text-[#9f9fa0] uppercase">Div Yield</span>
                              <span className="text-lg font-mono font-bold text-white block">{stock.dividendYield}%</span>
                            </div>
                            <div className="bg-white/[0.03] rounded-xl p-4">
                              <span className="text-[10px] text-[#9f9fa0] uppercase">Support</span>
                              <span className="text-lg font-mono font-bold text-green-500 block">Rs. {stock.support}</span>
                            </div>
                            <div className="bg-white/[0.03] rounded-xl p-4">
                              <span className="text-[10px] text-[#9f9fa0] uppercase">Resistance</span>
                              <span className="text-lg font-mono font-bold text-[#dc143c] block">Rs. {stock.resistance}</span>
                            </div>
                            <div className="bg-white/[0.03] rounded-xl p-4">
                              <span className="text-[10px] text-[#9f9fa0] uppercase">MACD</span>
                              <span className={`text-lg font-mono font-bold block ${stock.macd >= 0 ? 'text-green-500' : 'text-[#dc143c]'}`}>{stock.macd}</span>
                            </div>
                            <div className="bg-white/[0.03] rounded-xl p-4">
                              <span className="text-[10px] text-[#9f9fa0] uppercase">Tech Score</span>
                              <span className={`text-lg font-mono font-bold block ${stock.technicalScore >= 50 ? 'text-green-500' : stock.technicalScore >= 0 ? 'text-[#9f9fa0]' : 'text-[#dc143c]'}`}>{stock.technicalScore}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Order Ticket */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-6 shadow-xl">
                <h2 className="text-lg font-bold font-sans mb-4 flex items-center gap-2">
                  <ArrowUpRight className="text-green-500" size={20} /> Order Ticket
                </h2>
                <form onSubmit={handleOrderSubmit} className="space-y-4">
                  <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                    <button type="button" onClick={() => setOrderSide('buy')}
                      className={`flex-1 py-2.5 text-center text-xs font-black uppercase tracking-wider rounded-lg transition-all ${orderSide === 'buy' ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'text-[#9f9fa0] hover:text-white'}`}>
                      Buy
                    </button>
                    <button type="button" onClick={() => setOrderSide('sell')}
                      className={`flex-1 py-2.5 text-center text-xs font-black uppercase tracking-wider rounded-lg transition-all ${orderSide === 'sell' ? 'bg-[#dc143c] text-white shadow-lg shadow-[#dc143c]/20' : 'text-[#9f9fa0] hover:text-white'}`}>
                      Sell
                    </button>
                  </div>

                  <div className="relative">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#9f9fa0]/60 mb-1 block">Stock Symbol</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9f9fa0]" size={14} />
                      <input type="text" placeholder="e.g. NABIL" value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                        onFocus={() => setShowDropdown(true)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-3 outline-none focus:border-[#3b82f6] text-sm transition-colors font-bold uppercase tracking-wider" />
                    </div>
                    {showDropdown && (
                      <div className="absolute z-30 left-0 right-0 mt-2 bg-[#0f1011] border border-white/10 rounded-xl overflow-hidden shadow-2xl max-h-48 overflow-y-auto">
                        {filteredStocks.map(stock => (
                          <button key={stock.symbol} type="button"
                            onClick={() => { setSelectedSymbol(stock.symbol); setSearchQuery(stock.symbol); setShowDropdown(false); }}
                            className="w-full p-3 text-left hover:bg-white/5 border-b border-white/[0.04] transition-colors flex items-center justify-between">
                            <div>
                              <span className="font-mono font-bold text-white text-xs block">{stock.symbol}</span>
                              <span className="text-[10px] text-[#9f9fa0] block">{stock.name}</span>
                            </div>
                            <span className="font-mono font-bold text-white text-xs">Rs. {stock.ltp}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedSymbol && selectedStock && (
                    <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#9f9fa0] block">Price</span>
                        <span className="text-lg font-mono font-bold text-white">Rs. {currentPrice}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#9f9fa0] block">Change</span>
                        <span className={`text-sm font-mono font-bold ${selectedStock.change >= 0 ? 'text-green-500' : 'text-[#dc143c]'}`}>
                          {selectedStock.change >= 0 ? '+' : ''}{selectedStock.percentChange}%
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#9f9fa0]/60 mb-1 block">Quantity</label>
                    <input type="number" min="1" value={orderQty}
                      onChange={(e) => setOrderQty(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-[#3b82f6] text-lg font-mono font-bold text-white" />
                  </div>

                  {selectedSymbol && (
                    <div className="p-4 bg-white/[0.01] border border-white/[0.04] rounded-xl space-y-2 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#9f9fa0]">Subtotal:</span>
                        <span className="text-white">NPR {(currentPrice * orderQty).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                      {orderSide === 'buy' && estTotal > portfolio.cash && (
                        <div className="p-2 bg-[#dc143c]/10 border border-[#dc143c]/20 text-[#dc143c] rounded-lg flex items-start gap-2 text-[10px]">
                          <AlertTriangle className="shrink-0 mt-0.5" size={12} />
                          <span>Insufficient cash</span>
                        </div>
                      )}
                      {orderSide === 'buy' && estTotal > 0.25 * totalPortfolioValue && (
                        <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-lg flex items-start gap-2 text-[10px]">
                          <AlertTriangle className="shrink-0 mt-0.5" size={12} />
                          <span>Exceeds 25% cap</span>
                        </div>
                      )}
                    </div>
                  )}

                  <button type="submit" disabled={tradingLoading || !selectedSymbol || orderQty <= 0}
                    className={`w-full py-3 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 ${
                      orderSide === 'buy' ? 'bg-green-500 hover:bg-green-600 shadow-green-500/10' : 'bg-[#dc143c] hover:bg-[#b01030] shadow-[#dc143c]/10'
                    } disabled:opacity-30`}>
                    {tradingLoading ? <RefreshCw className="animate-spin" size={14} /> : `Execute ${orderSide.toUpperCase()}`}
                  </button>
                </form>
              </div>

              {/* Rules */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Trading Rules</h4>
                <ul className="space-y-2 text-[10px] text-[#9f9fa0] leading-relaxed">
                  <li className="flex items-start gap-2"><span className="text-[#3b82f6]">*</span><span>25% position cap per stock</span></li>
                  <li className="flex items-start gap-2"><span className="text-[#3b82f6]">*</span><span>5-minute cooldown between same-symbol trades</span></li>
                  <li className="flex items-start gap-2"><span className="text-[#3b82f6]">*</span><span>Answer quizzes to boost your knowledge score</span></li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Quiz Tab */}
        {activeTab === 'quiz' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Quiz Module Selector */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'economic' as const, label: 'Economic Events', icon: Newspaper, color: 'blue', score: quizScore.economic, total: ECONOMIC_QUIZ.length, done: quizCompleted.economic },
                { id: 'fundamental' as const, label: 'Fundamentals', icon: Brain, color: 'green', score: quizScore.fundamental, total: FUNDAMENTAL_QUIZ.length, done: quizCompleted.fundamental },
                { id: 'technical' as const, label: 'Technicals', icon: LineChart, color: 'amber', score: quizScore.technical, total: TECHNICAL_QUIZ.length, done: quizCompleted.technical },
              ].map(mod => (
                <button key={mod.id} onClick={() => { setQuizModule(mod.id); setQuizIndex(0); setQuizAnswered(null); }}
                  className={`p-4 rounded-2xl border transition-all text-left ${
                    activeTab === 'quiz' && quizModule === mod.id
                      ? mod.color === 'blue' ? 'bg-[#003893]/20 border-[#003893]/40' : mod.color === 'green' ? 'bg-green-500/20 border-green-500/40' : 'bg-amber-400/20 border-amber-400/40'
                      : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                  }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <mod.icon size={18} className={mod.color === 'blue' ? 'text-[#3b82f6]' : mod.color === 'green' ? 'text-green-500' : 'text-amber-500'} />
                    <span className="text-sm font-bold text-white">{mod.label}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#9f9fa0]">{mod.score}/{mod.total}</span>
                    {mod.done && <CheckCircle2 size={14} className="text-green-500" />}
                  </div>
                </button>
              ))}
            </div>

            {/* Quiz Card */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-8 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs text-[#9f9fa0] uppercase tracking-wider">
                  Question {quizIndex + 1} of {currentQuiz.length}
                </span>
                <span className={`text-xs font-black uppercase px-2 py-1 rounded ${
                  quizModule === 'economic' ? 'bg-[#003893]/20 text-[#3b82f6]' :
                  quizModule === 'fundamental' ? 'bg-green-500/20 text-green-500' :
                  'bg-amber-400/20 text-amber-500'
                }`}>
                  {quizModule} Module
                </span>
              </div>

              <h3 className="text-lg font-bold text-white mb-6">{currentQuiz[quizIndex].question}</h3>

              <div className="space-y-3 mb-6">
                {currentQuiz[quizIndex].options.map((option, idx) => (
                  <button key={idx} onClick={() => handleQuizAnswer(idx)} disabled={quizAnswered !== null}
                    className={`w-full p-4 rounded-xl text-left transition-all border ${
                      quizAnswered === null
                        ? 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/20'
                        : idx === currentQuiz[quizIndex].correctIndex
                          ? 'bg-green-500/10 border-green-500/30 text-green-500'
                          : idx === quizAnswered
                            ? 'bg-[#dc143c]/10 border-[#dc143c]/30 text-[#dc143c]'
                            : 'bg-white/[0.02] border-white/[0.06] opacity-40'
                    }`}>
                    <span className="text-sm font-bold">{option}</span>
                  </button>
                ))}
              </div>

              {quizAnswered !== null && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl mb-4">
                  <div className="flex items-start gap-2">
                    <Lightbulb size={16} className="text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-[#9f9fa0] leading-relaxed">{currentQuiz[quizIndex].explanation}</p>
                  </div>
                </motion.div>
              )}

              {quizAnswered !== null && (
                <button onClick={handleQuizNext}
                  className="w-full py-3 bg-[#dc143c] hover:bg-[#b01030] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors flex justify-center items-center gap-2">
                  {quizIndex < currentQuiz.length - 1 ? 'Next Question' : 'Complete Module'}
                  <ChevronRight size={14} />
                </button>
              )}
            </div>

            {/* Knowledge Insights */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
              <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Award size={16} className="text-[#3b82f6]" /> Knowledge-Based Trading Bonuses
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-[#9f9fa0]">
                <div className="p-3 bg-white/[0.03] rounded-xl">
                  <span className="text-[#3b82f6] font-bold block mb-1">Economic Events</span>
                  Understanding how NRB policy, budget, and external shocks affect sectors helps you predict which stocks will move.
                </div>
                <div className="p-3 bg-white/[0.03] rounded-xl">
                  <span className="text-green-500 font-bold block mb-1">Fundamental Analysis</span>
                  Picking stocks with low P/E, high ROE, and strong book value relative to price gives you an edge in stock selection.
                </div>
                <div className="p-3 bg-white/[0.03] rounded-xl">
                  <span className="text-amber-500 font-bold block mb-1">Technical Analysis</span>
                  Using RSI, MACD, and support/resistance levels helps you time entries and exits for maximum profit.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            {/* Holdings Table */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-white/[0.06] flex items-center gap-3">
                <Briefcase className="text-[#3b82f6]" size={20} />
                <h2 className="text-lg font-bold font-sans">Active Positions</h2>
              </div>
              {Object.keys(portfolio.holdings).length === 0 ? (
                <div className="p-12 text-center text-[#9f9fa0]">
                  <Briefcase className="mx-auto mb-3 text-[#9f9fa0]/40" size={40} />
                  <p className="text-sm">No positions yet. Start trading!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-[10px] font-black uppercase tracking-widest text-[#9f9fa0]/60">
                        <th className="py-3 px-4">Symbol</th>
                        <th className="py-3 px-4 text-right">Shares</th>
                        <th className="py-3 px-4 text-right">Avg Cost</th>
                        <th className="py-3 px-4 text-right">Current</th>
                        <th className="py-3 px-4 text-right">P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(portfolio.holdings).map(([sym, pos]) => {
                        const stock = stocks.find(s => s.symbol === sym);
                        const ltp = stock ? stock.ltp : pos.avgCost;
                        const pl = pos.qty * (ltp - pos.avgCost);
                        const plPct = pos.avgCost > 0 ? ((ltp - pos.avgCost) / pos.avgCost) * 100 : 0;
                        return (
                          <tr key={sym} className="border-b border-white/[0.04] hover:bg-white/[0.01] transition-colors font-mono text-xs">
                            <td className="py-3 px-4 font-bold text-white">{sym}</td>
                            <td className="py-3 px-4 text-right text-white">{pos.qty}</td>
                            <td className="py-3 px-4 text-right text-[#9f9fa0]">Rs. {pos.avgCost.toFixed(2)}</td>
                            <td className="py-3 px-4 text-right text-white">Rs. {ltp}</td>
                            <td className={`py-3 px-4 text-right font-bold ${pl >= 0 ? 'text-green-500' : 'text-[#dc143c]'}`}>
                              {pl >= 0 ? '+' : ''}{pl.toFixed(0)} ({plPct.toFixed(2)}%)
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Trade History */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-white/[0.06] flex items-center gap-3">
                <History className="text-[#3b82f6]" size={20} />
                <h2 className="text-lg font-bold font-sans">Trade History</h2>
              </div>
              {portfolio.tradeHistory.length === 0 ? (
                <div className="p-8 text-center text-[#9f9fa0] text-sm">No trades yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-[10px] font-black uppercase tracking-widest text-[#9f9fa0]/60">
                        <th className="py-3 px-4">Symbol</th>
                        <th className="py-3 px-4">Side</th>
                        <th className="py-3 px-4 text-right">Qty</th>
                        <th className="py-3 px-4 text-right">Price</th>
                        <th className="py-3 px-4">Context</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolio.tradeHistory.slice(0, 20).map(trade => (
                        <tr key={trade.id} className="border-b border-white/[0.04] font-mono text-xs">
                          <td className="py-3 px-4 font-bold text-white">{trade.symbol}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${trade.side === 'buy' ? 'bg-green-500/10 text-green-500' : 'bg-[#dc143c]/10 text-[#dc143c]'}`}>
                              {trade.side}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-white">{trade.qty}</td>
                          <td className="py-3 px-4 text-right text-[#9f9fa0]">Rs. {trade.price}</td>
                          <td className="py-3 px-4 text-[10px] text-[#9f9fa0] max-w-[200px] truncate">{trade.eventContext || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Performance Summary */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
              <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Target size={16} className="text-[#3b82f6]" /> Performance Summary
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <span className="text-[10px] text-[#9f9fa0] uppercase block">Total Trades</span>
                  <span className="text-lg font-mono font-bold text-white">{portfolio.tradeHistory.length}</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-[#9f9fa0] uppercase block">Buy Trades</span>
                  <span className="text-lg font-mono font-bold text-green-500">{portfolio.tradeHistory.filter(t => t.side === 'buy').length}</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-[#9f9fa0] uppercase block">Sell Trades</span>
                  <span className="text-lg font-mono font-bold text-[#dc143c]">{portfolio.tradeHistory.filter(t => t.side === 'sell').length}</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-[#9f9fa0] uppercase block">Events Traded</span>
                  <span className="text-lg font-mono font-bold text-[#3b82f6]">{eventIndex}/{ECONOMIC_EVENTS.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Economic Event Modal */}
        <AnimatePresence>
          {showEventModal && currentEvent && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="max-w-lg w-full bg-[#0f1011] border border-white/10 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-start justify-between mb-6">
                  <div className={`p-3 rounded-2xl ${currentEvent.impact === 'positive' ? 'bg-green-500/10' : 'bg-[#dc143c]/10'}`}>
                    <Newspaper size={24} className={currentEvent.impact === 'positive' ? 'text-green-500' : 'text-[#dc143c]'} />
                  </div>
                  <button onClick={handleDismissEvent} className="text-[#9f9fa0] hover:text-white"><X size={20} /></button>
                </div>

                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded mb-3 inline-block ${
                  currentEvent.category === 'monetary' ? 'bg-[#003893]/20 text-[#3b82f6]' :
                  currentEvent.category === 'fiscal' ? 'bg-green-500/20 text-green-500' :
                  currentEvent.category === 'external' ? 'bg-amber-400/20 text-amber-500' :
                  'bg-purple-500/20 text-purple-500'
                }`}>
                  {currentEvent.category}
                </span>

                <h2 className="text-2xl font-display font-medium text-white tracking-tight mb-3">{currentEvent.title}</h2>
                <p className="text-[#9f9fa0] text-sm leading-relaxed mb-6">{currentEvent.description}</p>

                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={14} className="text-[#3b82f6]" />
                    <span className="text-xs font-bold text-white">Market Impact Analysis</span>
                  </div>
                  <div className="text-xs text-[#9f9fa0] space-y-1">
                    <p><span className="text-white font-bold">Affected Sectors:</span> {currentEvent.affectedSectors.join(', ')}</p>
                    <p><span className="text-white font-bold">Impact Direction:</span> <span className={currentEvent.impact === 'positive' ? 'text-green-500' : 'text-[#dc143c]'}>{currentEvent.impact.toUpperCase()}</span></p>
                    <p><span className="text-white font-bold">Magnitude:</span> {currentEvent.impactMagnitude > 0 ? '+' : ''}{currentEvent.impactMagnitude}</p>
                  </div>
                </div>

                <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-2">
                    <Lightbulb size={14} className="text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-amber-400/80 leading-relaxed">
                      <span className="font-bold">Trading Tip:</span> Before trading, think about which stocks in the affected sectors are fundamentally strong (check P/E, ROE) and technically well-positioned (check RSI, support levels). Knowledge of all three modules helps you make the best decision.
                    </p>
                  </div>
                </div>

                <button onClick={handleApplyEvent}
                  className="w-full py-4 bg-[#dc143c] hover:bg-[#b01030] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors shadow-lg shadow-[#dc143c]/20 flex justify-center items-center gap-2">
                  <Zap size={14} /> Apply Market Impact
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
