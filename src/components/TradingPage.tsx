import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { 
  TrendingUp, TrendingDown, DollarSign, Briefcase, History, 
  ArrowUpRight, ArrowDownRight, RefreshCw, Lock, AlertTriangle, Info, CheckCircle2, Search
} from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, collection, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { fetchStocks, StockRow } from '../lib/nepseApi';
import { unlockPortfolio, executeTrade, Portfolio, Trade } from '../lib/tradingApi';

export default function TradingPage() {
  const { user, profile, updateProfile, loading: authLoading, handleJoinAction } = useAuth();
  
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stocks, setStocks] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tradingLoading, setTradingLoading] = useState(false);
  const [loadingStocks, setLoadingStocks] = useState(true);
  
  // Order ticket state
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [orderQty, setOrderQty] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 1. Fetch/listen to user portfolio & trades
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const portfolioRef = doc(db, 'portfolios', user.uid);
    const unsubPortfolio = onSnapshot(portfolioRef, (snap) => {
      if (snap.exists()) {
        setPortfolio(snap.data() as Portfolio);
      } else {
        setPortfolio(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error loading portfolio:", error);
      setLoading(false);
    });

    const tradesQuery = query(
      collection(db, 'portfolios', user.uid, 'trades'),
      orderBy('execAt', 'desc'),
      limit(10)
    );
    const unsubTrades = onSnapshot(tradesQuery, (snap) => {
      setTrades(snap.docs.map(d => ({ id: d.id, ...d.data() } as Trade)));
    }, (error) => {
      console.error("Error loading trades:", error);
    });

    return () => {
      unsubPortfolio();
      unsubTrades();
    };
  }, [user]);

  // 2. Fetch live stock list
  const getStocks = async () => {
    setIsRefreshing(true);
    setLoadingStocks(true);
    try {
      const data = await fetchStocks();
      setStocks(data);
    } catch (error) {
      console.error("Failed to load stocks:", error);
      toast.error("Failed to fetch live NEPSE prices.");
    } finally {
      setLoadingStocks(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    getStocks();
  }, []);

  const handleUnlock = async () => {
    if (!user) return;
    setTradingLoading(true);
    try {
      await unlockPortfolio();
      toast.success("Virtual Portfolio initialized successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to initialize portfolio.");
    } finally {
      setTradingLoading(false);
    }
  };

  const handleShareTrade = async (trade: Trade) => {
    if (!user || !profile) return;
    try {
      const sharePromise = addDoc(collection(db, 'posts'), {
        title: `Trade Recap: ${profile.name} ${trade.side === 'buy' ? 'bought' : 'sold'} ${trade.symbol}`,
        type: 'trade-recap',
        author: profile.name,
        authorId: user.uid,
        category: 'Finance',
        likes: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
        content: `I just executed a <strong>${trade.side}</strong> order for <strong>${trade.qty} shares</strong> of <strong>${trade.symbol}</strong> at <strong>Rs. ${trade.execPrice}</strong> in my virtual portfolio!<br/>Current portfolio value: Rs. ${totalPortfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
      });

      toast.promise(sharePromise, {
        loading: 'Sharing trade to community feed...',
        success: 'Trade shared successfully!',
        error: 'Failed to share trade.'
      });
    } catch (error) {
      console.error("Error sharing trade:", error);
    }
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSymbol || orderQty <= 0) {
      toast.error("Please enter a valid stock and quantity.");
      return;
    }
    
    setTradingLoading(true);
    try {
      const { trade } = await executeTrade(selectedSymbol, orderSide, orderQty);
      toast.success(`Trade Executed: ${trade.side.toUpperCase()} ${trade.qty} ${trade.symbol} at Rs. ${trade.execPrice}`);
      setOrderQty(1);
      setSelectedSymbol('');
      setSearchQuery('');
    } catch (error: any) {
      toast.error(error.message || "Trade failed to execute.");
    } finally {
      setTradingLoading(false);
    }
  };

  // Calculations
  const selectedStock = stocks.find(s => s.symbol === selectedSymbol);
  const currentPrice = selectedStock ? selectedStock.ltp : 0;
  const estTotal = currentPrice * orderQty;

  const holdingsValue = portfolio ? Object.entries(portfolio.holdings).reduce((acc, [sym, pos]) => {
    const liveStock = stocks.find(s => s.symbol === sym);
    const livePrice = liveStock ? liveStock.ltp : pos.avgCost;
    return acc + (pos.qty * livePrice);
  }, 0) : 0;

  const totalPortfolioValue = portfolio ? (portfolio.cash + holdingsValue) : 0;
  const totalCost = portfolio ? Object.values(portfolio.holdings).reduce((acc, pos) => acc + (pos.qty * pos.avgCost), 0) : 0;
  const unrealizedPL = holdingsValue - totalCost;
  const totalReturn = portfolio ? ((totalPortfolioValue - portfolio.startingCapital) / portfolio.startingCapital) * 100 : 0;
  const hasAppliedFL = portfolio?.appliedBonuses?.includes('financial-literacy');
  const hasAppliedER = portfolio?.appliedBonuses?.includes('economics-research');

  const upperSymbol = selectedSymbol.toUpperCase();

  // Filter stocks for dropdown
  const filteredStocks = searchQuery.trim() === ''
    ? stocks.slice(0, 10)
    : stocks.filter(s => s.symbol.includes(searchQuery.toUpperCase()) || s.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 8);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#090a0b] flex items-center justify-center text-white">
        <RefreshCw className="animate-spin text-[#dc143c] mr-3" size={32} />
        <span className="font-bold tracking-widest text-sm uppercase">Loading...</span>
      </div>
    );
  }

  // DASHBOARD STATE - Always show the page
  return (
    <div className="min-h-screen bg-[#090a0b] py-24 px-6 md:px-12 text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Auth Banner - Show if not logged in */}
        {!user && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#003893]/20 border border-[#003893]/40 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#003893]/30 rounded-2xl text-[#3b82f6] shrink-0">
                <Info size={24} />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Sign in to start trading!</h3>
                <p className="text-[#9f9fa0] text-sm mt-0.5">
                  Create a free account to get NPR 1,000,000 virtual capital and trade live NEPSE stocks risk-free.
                </p>
              </div>
            </div>
            <button 
              onClick={handleJoinAction}
              className="px-6 py-3 bg-[#dc143c] hover:bg-[#b01030] text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shrink-0"
            >
              Sign Up Free
            </button>
          </motion.div>
        )}

        {/* Portfolio Init Banner - Show if logged in but no portfolio */}
        {user && !portfolio && !loading && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border border-green-500/30 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-500/20 rounded-2xl text-green-500 shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Ready to trade!</h3>
                <p className="text-[#9f9fa0] text-sm mt-0.5">
                  Initialize your virtual portfolio with <strong className="text-white">NPR 1,000,000</strong> starting capital.
                </p>
              </div>
            </div>
            <button 
              onClick={handleUnlock}
              disabled={tradingLoading}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-green-500/20 flex items-center gap-2 shrink-0 disabled:opacity-50"
            >
              {tradingLoading ? <RefreshCw className="animate-spin" size={14} /> : null}
              {tradingLoading ? 'Initializing...' : 'Start Trading'}
            </button>
          </motion.div>
        )}

        {/* Header Summary */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-display font-medium text-white tracking-tight">Virtual Trading League</h1>
            <p className="text-[#9f9fa0] text-sm mt-1">Paper trade live NEPSE stocks risk-free.</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 self-stretch md:self-auto">
            <span className="text-xs text-[#9f9fa0] font-medium">Public Portfolio Visibility:</span>
            <button
              onClick={() => {
                const newVal = !profile?.publicPortfolio;
                updateProfile({ name: profile?.name || '', topics: profile?.topics || [], publicPortfolio: newVal });
                toast.success(newVal ? "Your portfolio is now public!" : "Your portfolio is now private.");
              }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors ${
                profile?.publicPortfolio 
                  ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                  : 'bg-white/5 text-[#9f9fa0] border border-white/10'
              }`}
            >
              {profile?.publicPortfolio ? "Public" : "Private (Only You)"}
            </button>
          </div>
        </div>

        {/* Dynamic Bonus Banner */}
        {(!hasAppliedFL || !hasAppliedER) && (
          <div className="bg-[#003893]/20 border border-[#003893]/40 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#003893]/30 rounded-2xl text-[#3b82f6] shrink-0">
                <Info size={24} />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Boost Your Capital!</h3>
                <p className="text-[#9f9fa0] text-sm mt-0.5">
                  Complete the exam for **Financial Literacy** or **Economic Research** with 80%+ to unlock a **+10% starting capital bonus (+NPR 100,000 each)**!
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {!hasAppliedFL && (
                <a href="/learn/financial-literacy" className="px-5 py-3 bg-[#003893] hover:bg-[#002f80] text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">
                  FL Exam (+10%)
                </a>
              )}
              {!hasAppliedER && (
                <a href="/learn/economics-research" className="px-5 py-3 bg-[#003893] hover:bg-[#002f80] text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">
                  ER Exam (+10%)
                </a>
              )}
            </div>
          </div>
        )}

        {/* Stats Grid - Only show when portfolio exists */}
        {portfolio && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Total Value */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#3b82f6]/5 rounded-bl-full pointer-events-none" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#9f9fa0] block mb-2">Total Portfolio Value</span>
            <span className="text-3xl font-mono font-bold text-white">NPR {totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <div className="flex items-center gap-1.5 mt-3">
              {totalReturn >= 0 ? (
                <span className="inline-flex items-center gap-0.5 text-xs font-bold text-green-500">
                  <TrendingUp size={14} /> +{totalReturn.toFixed(2)}%
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 text-xs font-bold text-[#dc143c]">
                  <TrendingDown size={14} /> {totalReturn.toFixed(2)}%
                </span>
              )}
              <span className="text-[10px] text-[#9f9fa0] uppercase tracking-wider">Returns</span>
            </div>
          </div>

          {/* Cash Balance */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-8 relative overflow-hidden">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#9f9fa0] block mb-2">Virtual Cash Balance</span>
            <span className="text-3xl font-mono font-bold text-white">NPR {portfolio.cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <p className="text-[10px] text-[#9f9fa0] uppercase tracking-wider mt-3">Available for buy trades</p>
          </div>

          {/* Holdings Value */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-8 relative overflow-hidden">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#9f9fa0] block mb-2">Holdings Value (MTM)</span>
            <span className="text-3xl font-mono font-bold text-white">NPR {holdingsValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <p className="text-[10px] text-[#9f9fa0] uppercase tracking-wider mt-3">Marked to live market prices</p>
          </div>

          {/* Unrealized P&L */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-8 relative overflow-hidden">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#9f9fa0] block mb-2">Unrealized P&L</span>
            <span className={`text-3xl font-mono font-bold ${unrealizedPL >= 0 ? 'text-green-500' : 'text-[#dc143c]'}`}>
              {unrealizedPL >= 0 ? '+' : ''}{unrealizedPL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[10px] text-[#9f9fa0] uppercase tracking-wider">Across {Object.keys(portfolio.holdings).length} symbols</span>
            </div>
          </div>
        </div>
        )}

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Holdings */}
          <div className="lg:col-span-8 space-y-8">
            {portfolio ? (
            <>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl overflow-hidden shadow-xl">
              <div className="p-8 border-b border-white/[0.06] flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Briefcase className="text-[#3b82f6]" size={20} />
                  <h2 className="text-xl font-bold font-sans">Active Positions</h2>
                </div>
                <button 
                  onClick={getStocks} 
                  disabled={isRefreshing}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors text-[#9f9fa0] hover:text-white"
                >
                  <RefreshCw className={isRefreshing ? "animate-spin" : ""} size={16} />
                </button>
              </div>

              {Object.keys(portfolio.holdings).length === 0 ? (
                <div className="p-16 text-center text-[#9f9fa0]">
                  <Briefcase className="mx-auto mb-4 text-[#9f9fa0]/40 animate-bounce" size={48} />
                  <p className="text-sm">You do not hold any shares yet.</p>
                  <p className="text-xs mt-1 text-[#9f9fa0]/60">Use the Order Ticket on the right to place a trade.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-[10px] font-black uppercase tracking-widest text-[#9f9fa0]/60">
                        <th className="py-4 px-6">Symbol</th>
                        <th className="py-4 px-6 text-right">Shares</th>
                        <th className="py-4 px-6 text-right">Avg Cost</th>
                        <th className="py-4 px-6 text-right">Live LTP</th>
                        <th className="py-4 px-6 text-right">Market Value</th>
                        <th className="py-4 px-6 text-right">Unrealized P&L</th>
                        <th className="py-4 px-6"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(portfolio.holdings).map(([sym, pos]) => {
                        const stock = stocks.find(s => s.symbol === sym);
                        const ltp = stock ? stock.ltp : pos.avgCost;
                        const change = stock ? stock.change : 0;
                        
                        const mktVal = pos.qty * ltp;
                        const costBasis = pos.qty * pos.avgCost;
                        const pl = mktVal - costBasis;
                        const plPct = (pl / costBasis) * 100;

                        return (
                          <tr key={sym} className="border-b border-white/[0.04] hover:bg-white/[0.01] transition-colors font-mono">
                            <td className="py-5 px-6 font-bold text-white">
                              {sym}
                              {stock && (
                                <span className={`text-[9px] font-black uppercase ml-2 px-1.5 py-0.5 rounded ${
                                  change >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-[#dc143c]/10 text-[#dc143c]'
                                }`}>
                                  {change >= 0 ? '+' : ''}{change}
                                </span>
                              )}
                            </td>
                            <td className="py-5 px-6 text-right font-bold text-white">{pos.qty}</td>
                            <td className="py-5 px-6 text-right text-[#9f9fa0]">Rs. {pos.avgCost.toFixed(2)}</td>
                            <td className="py-5 px-6 text-right text-[#9f9fa0]">Rs. {ltp.toFixed(2)}</td>
                            <td className="py-5 px-6 text-right font-bold text-white">Rs. {mktVal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                            <td className={`py-5 px-6 text-right font-bold ${pl >= 0 ? 'text-green-500' : 'text-[#dc143c]'}`}>
                              {pl >= 0 ? '+' : ''}{pl.toFixed(2)}
                              <span className="text-[10px] block font-medium">({plPct.toFixed(2)}%)</span>
                            </td>
                            <td className="py-5 px-6 text-center">
                              <button 
                                onClick={() => {
                                  setOrderSide('sell');
                                  setSelectedSymbol(sym);
                                  setSearchQuery(sym);
                                  setOrderQty(pos.qty);
                                }}
                                className="px-3 py-1.5 bg-[#dc143c]/10 hover:bg-[#dc143c] hover:text-white text-[#dc143c] font-black text-[9px] uppercase tracking-wider rounded-lg transition-all"
                              >
                                Sell
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* History Table */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl overflow-hidden shadow-xl">
              <div className="p-8 border-b border-white/[0.06] flex items-center gap-3">
                <History className="text-[#3b82f6]" size={20} />
                <h2 className="text-xl font-bold font-sans">Recent Transactions</h2>
              </div>
              {trades.length === 0 ? (
                <div className="p-12 text-center text-[#9f9fa0] text-sm">
                  No trades recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-[10px] font-black uppercase tracking-widest text-[#9f9fa0]/60">
                        <th className="py-4 px-6">Execution Date</th>
                        <th className="py-4 px-6">Symbol</th>
                        <th className="py-4 px-6">Type</th>
                        <th className="py-4 px-6 text-right">Shares</th>
                        <th className="py-4 px-6 text-right">Price</th>
                        <th className="py-4 px-6 text-right">Cash Left</th>
                        <th className="py-4 px-6"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades.map((trade) => {
                        const date = trade.execAt?.toDate ? trade.execAt.toDate() : new Date(trade.execAt);
                        return (
                          <tr key={trade.id} className="border-b border-white/[0.04] hover:bg-white/[0.01] transition-colors font-mono text-xs">
                            <td className="py-4 px-6 text-[#9f9fa0]">{date.toLocaleString()}</td>
                            <td className="py-4 px-6 font-bold text-white">{trade.symbol}</td>
                            <td className="py-4 px-6">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                trade.side === 'buy' ? 'bg-green-500/10 text-green-500' : 'bg-[#dc143c]/10 text-[#dc143c]'
                              }`}>
                                {trade.side}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right font-bold text-white">{trade.qty}</td>
                            <td className="py-4 px-6 text-right text-[#9f9fa0]">Rs. {trade.execPrice.toFixed(2)}</td>
                            <td className="py-4 px-6 text-right text-[#9f9fa0]">Rs. {trade.resultingCash.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                            <td className="py-4 px-6 text-center">
                              <button 
                                onClick={() => handleShareTrade(trade)}
                                className="px-3 py-1.5 bg-[#003893]/10 hover:bg-[#003893] text-[#3b82f6] hover:text-white font-black text-[9px] uppercase tracking-wider rounded-lg transition-all"
                              >
                                Share
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            </>
            ) : (
              /* No portfolio placeholder */
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-12 text-center">
                <Briefcase className="mx-auto mb-4 text-[#9f9fa0]/20" size={48} />
                <h3 className="text-lg font-bold text-white mb-2">Your Portfolio</h3>
                <p className="text-sm text-[#9f9fa0]">
                  {user ? 'Initialize your portfolio to start trading virtual stocks.' : 'Sign in to start trading virtual stocks.'}
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Order Ticket */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Order Ticket */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-8 shadow-xl">
              <h2 className="text-xl font-bold font-sans mb-6 flex items-center gap-2">
                <ArrowUpRight className="text-green-500" size={20} />
                Order Ticket
              </h2>

              {!user ? (
                /* Not logged in prompt */
                <div className="text-center py-6">
                  <Lock className="mx-auto mb-4 text-[#9f9fa0]/40" size={32} />
                  <p className="text-sm text-[#9f9fa0] mb-4">Sign in to start trading</p>
                  <button 
                    onClick={handleJoinAction}
                    className="w-full py-3 bg-[#dc143c] hover:bg-[#b01030] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors"
                  >
                    Sign Up Free
                  </button>
                </div>
              ) : !portfolio ? (
                /* No portfolio prompt */
                <div className="text-center py-6">
                  <CheckCircle2 className="mx-auto mb-4 text-green-500/40" size={32} />
                  <p className="text-sm text-[#9f9fa0] mb-4">Initialize your portfolio to start trading</p>
                  <button 
                    onClick={handleUnlock}
                    disabled={tradingLoading}
                    className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {tradingLoading ? <RefreshCw className="animate-spin" size={14} /> : null}
                    {tradingLoading ? 'Initializing...' : 'Start Trading'}
                  </button>
                </div>
              ) : (
                /* Full order form */
                <form onSubmit={handleOrderSubmit} className="space-y-6">
                
                {/* Buy/Sell selector */}
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setOrderSide('buy')}
                    className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                      orderSide === 'buy' 
                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' 
                        : 'text-[#9f9fa0] hover:text-white'
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderSide('sell')}
                    className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                      orderSide === 'sell' 
                        ? 'bg-[#dc143c] text-white shadow-lg shadow-[#dc143c]/20' 
                        : 'text-[#9f9fa0] hover:text-white'
                    }`}
                  >
                    Sell
                  </button>
                </div>

                {/* Stock Search Dropdown */}
                <div className="relative">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#9f9fa0]/60 mb-2 block">Search Stock Symbol</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9f9fa0]" size={16} />
                    <input 
                      type="text"
                      placeholder="e.g. NABIL, NICA, AHPC"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-[#3b82f6] text-sm transition-colors font-bold uppercase tracking-wider"
                    />
                  </div>

                  {showDropdown && (
                    <div className="absolute z-30 left-0 right-0 mt-2 bg-[#0f1011] border border-white/10 rounded-xl overflow-hidden shadow-2xl max-h-60 overflow-y-auto">
                      {loadingStocks ? (
                        <div className="p-4 text-center text-xs text-[#9f9fa0] flex items-center justify-center gap-2">
                          <RefreshCw className="animate-spin" size={12} /> Loading stock list...
                        </div>
                      ) : filteredStocks.length === 0 ? (
                        <div className="p-4 text-center text-xs text-[#9f9fa0]">
                          No stocks matching "{searchQuery}"
                        </div>
                      ) : (
                        filteredStocks.map((stock) => (
                          <button
                            type="button"
                            key={stock.symbol}
                            onClick={() => {
                              setSelectedSymbol(stock.symbol);
                              setSearchQuery(stock.symbol);
                              setShowDropdown(false);
                            }}
                            className="w-full p-4 text-left hover:bg-white/5 border-b border-white/[0.04] transition-colors flex items-center justify-between"
                          >
                            <div>
                              <span className="font-mono font-bold text-white text-sm block">{stock.symbol}</span>
                              <span className="text-[10px] text-[#9f9fa0] block truncate max-w-[200px]">{stock.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-bold text-white text-sm block">Rs. {stock.ltp}</span>
                              <span className={`font-mono text-[10px] font-bold ${stock.change >= 0 ? 'text-green-500' : 'text-[#dc143c]'}`}>
                                {stock.change >= 0 ? '+' : ''}{stock.percentChange}%
                              </span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Stock Info panel */}
                {selectedSymbol && selectedStock && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-black uppercase text-[#9f9fa0] block">Last Traded Price</span>
                      <span className="text-xl font-mono font-bold text-white mt-1 block">Rs. {currentPrice.toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black uppercase text-[#9f9fa0] block">Daily Change</span>
                      <span className={`text-md font-mono font-bold block mt-1 ${selectedStock.change >= 0 ? 'text-green-500' : 'text-[#dc143c]'}`}>
                        {selectedStock.change >= 0 ? '+' : ''}{selectedStock.change} ({selectedStock.percentChange}%)
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Quantity */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#9f9fa0]/60 mb-2 block">Shares Quantity</label>
                  <input 
                    type="number"
                    min="1"
                    value={orderQty}
                    onChange={(e) => setOrderQty(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-[#3b82f6] text-lg font-mono font-bold text-white"
                  />
                </div>

                {/* Estimated Cost */}
                {selectedSymbol && (
                  <div className="p-6 bg-white/[0.01] border border-white/[0.04] rounded-2xl space-y-3 font-mono">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#9f9fa0]">Subtotal:</span>
                      <span className="text-white">Rs. {(currentPrice * orderQty).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-xs border-t border-white/[0.04] pt-3 font-bold">
                      <span className="text-white uppercase tracking-wider">Estimated Total:</span>
                      <span className="text-white text-sm">Rs. {estTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                    
                    {/* Error Alerts */}
                    {orderSide === 'buy' && estTotal > portfolio.cash && (
                      <div className="p-3 bg-[#dc143c]/10 border border-[#dc143c]/20 text-[#dc143c] rounded-xl flex items-start gap-2 text-[10px] font-sans">
                        <AlertTriangle className="shrink-0 mt-0.5" size={14} />
                        <span>Insufficient Cash! This trade exceeds your available cash balance.</span>
                      </div>
                    )}
                    {orderSide === 'buy' && estTotal > 0.25 * totalPortfolioValue && (
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-xl flex items-start gap-2 text-[10px] font-sans">
                        <AlertTriangle className="shrink-0 mt-0.5" size={14} />
                        <span>Anti-Cheat Alert: Exceeds 25% single-stock cap (Max. allocation: Rs. {(0.25 * totalPortfolioValue).toLocaleString(undefined, { maximumFractionDigits: 0 })}).</span>
                      </div>
                    )}
                    {orderSide === 'sell' && (!portfolio.holdings[upperSymbol] || portfolio.holdings[upperSymbol].qty < orderQty) && (
                      <div className="p-3 bg-[#dc143c]/10 border border-[#dc143c]/20 text-[#dc143c] rounded-xl flex items-start gap-2 text-[10px] font-sans">
                        <AlertTriangle className="shrink-0 mt-0.5" size={14} />
                        <span>Insufficient Shares! You only own {portfolio.holdings[upperSymbol]?.qty || 0} shares of {upperSymbol}.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={
                    tradingLoading || 
                    !selectedSymbol || 
                    (orderSide === 'buy' && (estTotal > portfolio.cash || estTotal > 0.25 * totalPortfolioValue)) ||
                    (orderSide === 'sell' && (!portfolio.holdings[upperSymbol] || portfolio.holdings[upperSymbol].qty < orderQty))
                  }
                  className={`w-full py-4 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 ${
                    orderSide === 'buy' 
                      ? 'bg-green-500 hover:bg-green-600 shadow-green-500/10 disabled:bg-green-500/30' 
                      : 'bg-[#dc143c] hover:bg-[#b01030] shadow-[#dc143c]/10 disabled:bg-[#dc143c]/30'
                  }`}
                >
                  {tradingLoading ? <RefreshCw className="animate-spin" size={16} /> : `Execute ${orderSide.toUpperCase()} Order`}
                </button>
              </form>
              )}
            </div>
            
            {/* Rules Quick Info */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-6 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">League Guidelines</h4>
              <ul className="space-y-2.5 text-xs text-[#9f9fa0] leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-[#3b82f6]">•</span>
                  <span>**25% Position Cap**: You cannot hold more than 25% of your total portfolio value in a single stock.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#3b82f6]">•</span>
                  <span>**5-Min Cooldown**: You must wait 5 minutes between trades of the same symbol.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#3b82f6]">•</span>
                  <span>**20 Trades / Day**: Maximum of 20 transaction tickets allowed per user daily.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
