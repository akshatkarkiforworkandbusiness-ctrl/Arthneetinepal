import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  TrendingUp, TrendingDown, Briefcase, History,
  ArrowUpRight, RefreshCw, Lock, AlertTriangle,
  Search, BarChart3, Trophy, Gift, Wallet
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { fetchStocks, StockRow } from '../lib/nepseApi';
import { getOrCreatePortfolio, subscribeToPortfolio, executeTrade, getLeaderboard, calculateTradingFees } from '../lib/trading';
import { marketSimulation } from '../lib/marketSimulation';
import { claimRewards, awardDailyLogin } from '../lib/rewards';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import type { Portfolio, Trade, TradingFees } from '../types/trading';

export default function TradingGamePage() {
  const { user, profile, loading: authLoading, handleJoinAction } = useAuth();

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stocks, setStocks] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tradingLoading, setTradingLoading] = useState(false);
  const [loadingStocks, setLoadingStocks] = useState(true);
  const [leaderboard, setLeaderboard] = useState<Array<{ uid: string; name: string; totalValue: number }>>([]);

  // Order ticket state
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [orderQty, setOrderQty] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [estimatedFees, setEstimatedFees] = useState<TradingFees | null>(null);
  const [isClaimingRewards, setIsClaimingRewards] = useState(false);

  // Load portfolio
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let unsubPortfolio: (() => void) | null = null;

    const init = async () => {
      try {
        const p = await getOrCreatePortfolio(user.uid);
        setPortfolio(p);
        setLoading(false);

        unsubPortfolio = subscribeToPortfolio(user.uid, (updated) => {
          setPortfolio(updated);
        });
      } catch {
        setLoading(false);
      }
    };
    init();

    return () => {
      if (unsubPortfolio) unsubPortfolio();
    };
  }, [user]);

  // Load trades
  useEffect(() => {
    if (!user) return;

    const tradesRef = collection(db, 'portfolios', user.uid, 'trades');
    const q = query(tradesRef, orderBy('timestamp', 'desc'), limit(50));
    const unsubTrades = onSnapshot(q, (snap) => {
      setTrades(snap.docs.map(d => ({ id: d.id, ...d.data() } as Trade)));
    });

    return () => unsubTrades();
  }, [user]);

  // Fetch stocks and initialize simulation
  const getStocks = useCallback(async () => {
    setIsRefreshing(true);
    setLoadingStocks(true);
    try {
      const data = await fetchStocks();
      setStocks(data);
      
      // Initialize market simulation if not already done
      if (!marketSimulation['state']?.isInitialized) {
        marketSimulation.initialize(data);
      } else {
        // Update base prices from live data
        marketSimulation.updateBasePrices(data);
      }
    } catch {
      toast.error('Failed to fetch live NEPSE prices.');
    } finally {
      setLoadingStocks(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    getStocks();
    
    // Subscribe to simulated price updates
    const unsubscribe = marketSimulation.subscribe((simulatedStocks) => {
      setStocks(simulatedStocks);
    });
    
    return () => unsubscribe();
  }, [getStocks]);
  
  // Award daily login on first load
  useEffect(() => {
    if (user) {
      awardDailyLogin(user.uid).then(result => {
        if (result.success) {
          toast.success(result.message);
        }
      });
    }
  }, [user]);

  // Fetch leaderboard
  useEffect(() => {
    getLeaderboard(20).then(setLeaderboard);
  }, []);

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedSymbol || orderQty <= 0) {
      toast.error('Please enter a valid stock and quantity.');
      return;
    }

    setTradingLoading(true);
    try {
      const { fees } = await executeTrade(user.uid, selectedSymbol, orderSide, orderQty, currentPrice);
      toast.success(
        orderSide === 'buy'
          ? `Bought ${orderQty} ${selectedSymbol.toUpperCase()} at Rs. ${currentPrice} (Fees: Rs. ${fees.totalFees.toFixed(2)})`
          : `Sold ${orderQty} ${selectedSymbol.toUpperCase()} at Rs. ${currentPrice} (Fees: Rs. ${fees.totalFees.toFixed(2)})`
      );
      setOrderQty(1);
      setSelectedSymbol('');
      setSearchQuery('');
      setEstimatedFees(null);
    } catch (error: any) {
      toast.error(error.message || 'Trade failed.');
    } finally {
      setTradingLoading(false);
    }
  };

  // Calculations
  const selectedStock = stocks.find(s => s.symbol === selectedSymbol);
  const currentPrice = selectedStock ? selectedStock.ltp : 0;
  const estSubtotal = currentPrice * orderQty;

  // Calculate estimated fees when selection changes
  useEffect(() => {
    if (selectedSymbol && orderQty > 0 && currentPrice > 0) {
      const existingHolding = portfolio?.holdings[selectedSymbol.toUpperCase()];
      const fees = calculateTradingFees(
        orderSide,
        orderQty,
        currentPrice,
        existingHolding ? { avgCost: existingHolding.avgCost } : undefined
      );
      setEstimatedFees(fees);
    } else {
      setEstimatedFees(null);
    }
  }, [selectedSymbol, orderQty, currentPrice, orderSide, portfolio?.holdings]);

  const holdingsValue = useMemo(() => {
    if (!portfolio) return 0;
    return Object.entries(portfolio.holdings).reduce((acc, [sym, pos]) => {
      // Use simulated price for valuation
      const simulatedPrice = marketSimulation.getPrice(sym);
      const liveStock = stocks.find(s => s.symbol === sym);
      const livePrice = simulatedPrice || (liveStock ? liveStock.ltp : pos.avgCost);
      return acc + (pos.quantity * livePrice);
    }, 0);
  }, [portfolio?.holdings, stocks]);

  const totalPortfolioValue = portfolio ? portfolio.cashBalance + holdingsValue : 0;
  const totalCost = useMemo(() => {
    if (!portfolio) return 0;
    return Object.values(portfolio.holdings).reduce((acc, pos) => acc + (pos.quantity * pos.avgCost), 0);
  }, [portfolio?.holdings]);
  const unrealizedPL = holdingsValue - totalCost;
  const totalReturn = portfolio && portfolio.cashBalance + totalCost > 0
    ? ((totalPortfolioValue - (portfolio.cashBalance + totalCost)) / (portfolio.cashBalance + totalCost)) * 100
    : 0;

  // Handle claim rewards
  const handleClaimRewards = async () => {
    if (!user) return;
    setIsClaimingRewards(true);
    try {
      const result = await claimRewards(user.uid);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error('Failed to claim rewards');
    } finally {
      setIsClaimingRewards(false);
    }
  };

  const upperSymbol = selectedSymbol.toUpperCase();

  const filteredStocks = searchQuery.trim() === ''
    ? stocks.slice(0, 10)
    : stocks.filter(s =>
        s.symbol.includes(searchQuery.toUpperCase()) ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8);

  // Auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-white">
        <RefreshCw className="animate-spin text-[#00875a] mr-3" size={32} />
        <span className="font-bold tracking-widest text-sm uppercase">Loading...</span>
      </div>
    );
  }

  // Not signed in — gate behind auth
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-6 text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[#161F30] border border-[#1F2A3F] rounded-3xl p-10 text-center"
        >
          <div className="w-20 h-20 bg-[#00875a]/10 border border-[#00875a]/20 text-[#00875a] rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={40} />
          </div>
          <h1 className="text-3xl font-display font-medium text-white tracking-tight mb-4">
            Trading Game
          </h1>
          <p className="text-[#9f9fa0] text-sm leading-relaxed mb-8">
            Sign in to get NPR 1,000,000 virtual capital and trade live NEPSE stocks risk-free.
          </p>
          <button
            onClick={handleJoinAction}
            className="w-full py-4 bg-[#00875a] hover:bg-[#006d48] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors shadow-lg shadow-[#00875a]/20"
          >
            Sign In to Start Trading
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] py-24 px-6 md:px-12 text-white">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-display font-medium text-white tracking-tight">Trading Game</h1>
            <p className="text-[#9f9fa0] text-sm mt-1">Paper trade live NEPSE stocks risk-free.</p>
          </div>
          <button
            onClick={getStocks}
            disabled={isRefreshing}
            className="px-4 py-2 bg-[#161F30] hover:bg-[#1F2A3F] text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 border border-[#1F2A3F]"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Prices'}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-[#161F30] border border-[#1F2A3F] rounded-2xl p-5">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#9f9fa0] block mb-1">
              Portfolio Value
            </span>
            <span className="text-xl font-mono font-bold text-white">
              NPR {totalPortfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <div className="flex items-center gap-1 mt-1">
              {totalReturn >= 0 ? (
                <span className="text-xs font-bold text-[#00f59b] flex items-center gap-0.5">
                  <TrendingUp size={12} />+{totalReturn.toFixed(2)}%
                </span>
              ) : (
                <span className="text-xs font-bold text-[#ef4444] flex items-center gap-0.5">
                  <TrendingDown size={12} />{totalReturn.toFixed(2)}%
                </span>
              )}
            </div>
          </div>
          <div className="bg-[#161F30] border border-[#1F2A3F] rounded-2xl p-5">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#9f9fa0] block mb-1">
              Cash Balance
            </span>
            <span className="text-xl font-mono font-bold text-white">
              NPR {portfolio?.cashBalance.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? '—'}
            </span>
          </div>
          <div className="bg-[#161F30] border border-[#1F2A3F] rounded-2xl p-5">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#9f9fa0] block mb-1">
              Holdings Value
            </span>
            <span className="text-xl font-mono font-bold text-white">
              NPR {holdingsValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="bg-[#161F30] border border-[#1F2A3F] rounded-2xl p-5">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#9f9fa0] block mb-1">
              Unrealized P/L
            </span>
            <span className={`text-xl font-mono font-bold ${unrealizedPL >= 0 ? 'text-[#00f59b]' : 'text-[#ef4444]'}`}>
              {unrealizedPL >= 0 ? '+' : ''}{unrealizedPL.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="bg-[#161F30] border border-[#1F2A3F] rounded-2xl p-5 relative">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#9f9fa0] block mb-1">
              Reward Balance
            </span>
            <span className="text-xl font-mono font-bold text-[#fbbf24]">
              NPR {portfolio?.rewardBalance?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? '0'}
            </span>
            {portfolio && portfolio.rewardBalance > 0 && (
              <button
                onClick={handleClaimRewards}
                disabled={isClaimingRewards}
                className="mt-2 px-3 py-1 bg-[#fbbf24]/10 hover:bg-[#fbbf24] text-[#fbbf24] hover:text-[#0B0F19] text-[9px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1"
              >
                {isClaimingRewards ? <RefreshCw className="animate-spin" size={10} /> : <Gift size={10} />}
                Claim
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Watchlist + Holdings */}
          <div className="lg:col-span-8 space-y-6">

            {/* Live Watchlist */}
            <div className="bg-[#161F30] border border-[#1F2A3F] rounded-3xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-[#1F2A3F] flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <BarChart3 className="text-[#00875a]" size={20} />
                  <h2 className="text-lg font-bold font-sans">NEPSE Live Watchlist</h2>
                </div>
                <button
                  onClick={getStocks}
                  disabled={isRefreshing}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors text-[#9f9fa0] hover:text-white"
                >
                  <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                </button>
              </div>
              {loadingStocks ? (
                <div className="p-12 text-center text-[#9f9fa0]">
                  <RefreshCw className="animate-spin mx-auto mb-3" size={24} />
                  <p className="text-sm">Loading stock prices...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#1F2A3F] text-[10px] font-black uppercase tracking-widest text-[#9f9fa0]/60">
                        <th className="py-3 px-4">Symbol</th>
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4 text-right">LTP</th>
                        <th className="py-3 px-4 text-right">Change</th>
                        <th className="py-3 px-4 text-right">Volume</th>
                        <th className="py-3 px-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {stocks.slice(0, 20).map(stock => (
                        <tr key={stock.symbol} className="border-b border-[#1F2A3F]/50 hover:bg-white/[0.02] transition-colors font-mono text-xs">
                          <td className="py-3 px-4 font-bold text-white">{stock.symbol}</td>
                          <td className="py-3 px-4 text-[#9f9fa0] truncate max-w-[150px]">{stock.name}</td>
                          <td className="py-3 px-4 text-right font-bold text-white">Rs. {stock.ltp}</td>
                          <td className="py-3 px-4 text-right">
                            <span className={`font-bold ${stock.change >= 0 ? 'text-[#00f59b]' : 'text-[#ef4444]'}`}>
                              {stock.change >= 0 ? '+' : ''}{stock.percentChange}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-[#9f9fa0]">
                            {stock.volume.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => {
                                setOrderSide('buy');
                                setSelectedSymbol(stock.symbol);
                                setSearchQuery(stock.symbol);
                                setShowDropdown(false);
                              }}
                              className="px-2 py-1 bg-[#00875a]/10 hover:bg-[#00875a] text-[#00875a] hover:text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition-all"
                            >
                              Buy
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Holdings Table */}
            {portfolio && Object.keys(portfolio.holdings).length > 0 && (
              <div className="bg-[#161F30] border border-[#1F2A3F] rounded-3xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-[#1F2A3F] flex items-center gap-3">
                  <Briefcase className="text-[#00875a]" size={20} />
                  <h2 className="text-lg font-bold font-sans">Your Holdings</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#1F2A3F] text-[10px] font-black uppercase tracking-widest text-[#9f9fa0]/60">
                        <th className="py-3 px-4">Symbol</th>
                        <th className="py-3 px-4 text-right">Shares</th>
                        <th className="py-3 px-4 text-right">Avg Cost</th>
                        <th className="py-3 px-4 text-right">Current</th>
                        <th className="py-3 px-4 text-right">P&L</th>
                        <th className="py-3 px-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(portfolio.holdings).map(([sym, pos]) => {
                        const stock = stocks.find(s => s.symbol === sym);
                        const ltp = stock ? stock.ltp : pos.avgCost;
                        const pl = pos.quantity * (ltp - pos.avgCost);
                        const plPct = pos.avgCost > 0 ? ((ltp - pos.avgCost) / pos.avgCost) * 100 : 0;
                        return (
                          <tr key={sym} className="border-b border-[#1F2A3F]/50 hover:bg-white/[0.02] transition-colors font-mono text-xs">
                            <td className="py-3 px-4 font-bold text-white">{sym}</td>
                            <td className="py-3 px-4 text-right text-white">{pos.quantity}</td>
                            <td className="py-3 px-4 text-right text-[#9f9fa0]">Rs. {pos.avgCost.toFixed(2)}</td>
                            <td className="py-3 px-4 text-right text-white">Rs. {ltp}</td>
                            <td className={`py-3 px-4 text-right font-bold ${pl >= 0 ? 'text-[#00f59b]' : 'text-[#ef4444]'}`}>
                              {pl >= 0 ? '+' : ''}{pl.toFixed(0)} ({plPct.toFixed(2)}%)
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => {
                                  setOrderSide('sell');
                                  setSelectedSymbol(sym);
                                  setSearchQuery(sym);
                                  setOrderQty(pos.quantity);
                                }}
                                className="px-2 py-1 bg-[#ef4444]/10 hover:bg-[#ef4444] text-[#ef4444] hover:text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition-all"
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
              </div>
            )}

            {/* Trade History */}
            {trades.length > 0 && (
              <div className="bg-[#161F30] border border-[#1F2A3F] rounded-3xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-[#1F2A3F] flex items-center gap-3">
                  <History className="text-[#00875a]" size={20} />
                  <h2 className="text-lg font-bold font-sans">Trade History</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#1F2A3F] text-[10px] font-black uppercase tracking-widest text-[#9f9fa0]/60">
                        <th className="py-3 px-4">Symbol</th>
                        <th className="py-3 px-4">Side</th>
                        <th className="py-3 px-4 text-right">Qty</th>
                        <th className="py-3 px-4 text-right">Price</th>
                        <th className="py-3 px-4 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades.map(trade => (
                        <tr key={trade.id} className="border-b border-[#1F2A3F]/50 font-mono text-xs">
                          <td className="py-3 px-4 font-bold text-white">{trade.symbol}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                              trade.side === 'buy' ? 'bg-[#00875a]/10 text-[#00875a]' : 'bg-[#ef4444]/10 text-[#ef4444]'
                            }`}>
                              {trade.side}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-white">{trade.quantity}</td>
                          <td className="py-3 px-4 text-right text-[#9f9fa0]">Rs. {trade.price}</td>
                          <td className="py-3 px-4 text-right text-white">Rs. {trade.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Order Ticket + Leaderboard */}
          <div className="lg:col-span-4 space-y-6">

            {/* Order Ticket */}
            <div className="bg-[#161F30] border border-[#1F2A3F] rounded-3xl p-6 shadow-xl">
              <h2 className="text-lg font-bold font-sans mb-4 flex items-center gap-2">
                <ArrowUpRight className="text-[#00875a]" size={20} /> Order Ticket
              </h2>

              <form onSubmit={handleOrderSubmit} className="space-y-4">
                {/* Buy/Sell */}
                <div className="flex bg-[#0B0F19] p-1 rounded-xl border border-[#1F2A3F]">
                  <button
                    type="button"
                    onClick={() => setOrderSide('buy')}
                    className={`flex-1 py-2.5 text-center text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                      orderSide === 'buy'
                        ? 'bg-[#00875a] text-white shadow-lg shadow-[#00875a]/20'
                        : 'text-[#9f9fa0] hover:text-white'
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderSide('sell')}
                    className={`flex-1 py-2.5 text-center text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                      orderSide === 'sell'
                        ? 'bg-[#ef4444] text-white shadow-lg shadow-[#ef4444]/20'
                        : 'text-[#9f9fa0] hover:text-white'
                    }`}
                  >
                    Sell
                  </button>
                </div>

                {/* Stock Search */}
                <div className="relative">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#9f9fa0]/60 mb-1 block">
                    Stock Symbol
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9f9fa0]" size={14} />
                    <input
                      type="text"
                      placeholder="e.g. NABIL"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                      onFocus={() => setShowDropdown(true)}
                      className="w-full bg-[#0B0F19] border border-[#1F2A3F] rounded-xl py-2.5 pl-10 pr-3 outline-none focus:border-[#00875a] text-sm transition-colors font-bold uppercase tracking-wider text-white"
                    />
                  </div>
                  {showDropdown && (
                    <div className="absolute z-30 left-0 right-0 mt-2 bg-[#0B0F19] border border-[#1F2A3F] rounded-xl overflow-hidden shadow-2xl max-h-48 overflow-y-auto">
                      {loadingStocks ? (
                        <div className="p-3 text-center text-xs text-[#9f9fa0]">Loading...</div>
                      ) : filteredStocks.length === 0 ? (
                        <div className="p-3 text-center text-xs text-[#9f9fa0]">No stocks found</div>
                      ) : (
                        filteredStocks.map(stock => (
                          <button
                            key={stock.symbol}
                            type="button"
                            onClick={() => {
                              setSelectedSymbol(stock.symbol);
                              setSearchQuery(stock.symbol);
                              setShowDropdown(false);
                            }}
                            className="w-full p-3 text-left hover:bg-white/5 border-b border-[#1F2A3F]/50 transition-colors flex items-center justify-between"
                          >
                            <div>
                              <span className="font-mono font-bold text-white text-xs block">{stock.symbol}</span>
                              <span className="text-[10px] text-[#9f9fa0] block">{stock.name}</span>
                            </div>
                            <span className="font-mono font-bold text-white text-xs">Rs. {stock.ltp}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Selected stock info */}
                {selectedSymbol && selectedStock && (
                  <div className="p-3 bg-[#0B0F19] border border-[#1F2A3F] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#9f9fa0] block">Price</span>
                      <span className="text-lg font-mono font-bold text-white">Rs. {currentPrice}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#9f9fa0] block">Change</span>
                      <span className={`text-sm font-mono font-bold ${selectedStock.change >= 0 ? 'text-[#00f59b]' : 'text-[#ef4444]'}`}>
                        {selectedStock.change >= 0 ? '+' : ''}{selectedStock.percentChange}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#9f9fa0]/60 mb-1 block">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={orderQty}
                    onChange={(e) => setOrderQty(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-[#0B0F19] border border-[#1F2A3F] rounded-xl p-3 outline-none focus:border-[#00875a] text-lg font-mono font-bold text-white"
                  />
                </div>

                {/* Order summary */}
                {selectedSymbol && (
                  <div className="p-3 bg-[#0B0F19]/50 border border-[#1F2A3F] rounded-xl space-y-2 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#9f9fa0]">Subtotal:</span>
                      <span className="text-white">NPR {estSubtotal.toLocaleString()}</span>
                    </div>
                    {estimatedFees && (
                      <>
                        <div className="flex justify-between text-[#9f9fa0]">
                          <span>Brokerage (0.40%):</span>
                          <span>Rs. {estimatedFees.brokerage.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[#9f9fa0]">
                          <span>SEBON Fee (0.015%):</span>
                          <span>Rs. {estimatedFees.sebonFee.toFixed(2)}</span>
                        </div>
                        {estimatedFees.capitalGainsTax > 0 && (
                          <div className="flex justify-between text-[#9f9fa0]">
                            <span>Capital Gains Tax:</span>
                            <span>Rs. {estimatedFees.capitalGainsTax.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="border-t border-[#1F2A3F] pt-2 flex justify-between font-bold">
                          <span className="text-white">Total Cost:</span>
                          <span className="text-white">NPR {(estSubtotal + estimatedFees.totalFees).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                        </div>
                      </>
                    )}
                    {orderSide === 'buy' && estSubtotal > (portfolio?.cashBalance ?? 0) && (
                      <div className="p-2 bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] rounded-lg flex items-start gap-2 text-[10px]">
                        <AlertTriangle className="shrink-0 mt-0.5" size={12} />
                        <span>Insufficient cash</span>
                      </div>
                    )}
                    {orderSide === 'sell' && (
                      (!portfolio?.holdings[upperSymbol] || (portfolio?.holdings[upperSymbol]?.quantity ?? 0) < orderQty)
                    ) && (
                      <div className="p-2 bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] rounded-lg flex items-start gap-2 text-[10px]">
                        <AlertTriangle className="shrink-0 mt-0.5" size={12} />
                        <span>Insufficient shares</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={
                    tradingLoading ||
                    !selectedSymbol ||
                    orderQty <= 0 ||
                    (orderSide === 'buy' && estimatedFees && (estSubtotal + estimatedFees.totalFees) > (portfolio?.cashBalance ?? 0)) ||
                    (orderSide === 'sell' && (!portfolio?.holdings[upperSymbol] || (portfolio?.holdings[upperSymbol]?.quantity ?? 0) < orderQty))
                  }
                  className={`w-full py-3 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 disabled:opacity-30 ${
                    orderSide === 'buy'
                      ? 'bg-[#00875a] hover:bg-[#006d48] shadow-[#00875a]/10'
                      : 'bg-[#ef4444] hover:bg-[#dc2626] shadow-[#ef4444]/10'
                  }`}
                >
                  {tradingLoading ? <RefreshCw className="animate-spin" size={14} /> : `Execute ${orderSide.toUpperCase()}`}
                </button>
              </form>
            </div>

            {/* Market Events */}
            <div className="bg-[#161F30] border border-[#1F2A3F] rounded-3xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-[#1F2A3F] flex items-center gap-3">
                <TrendingUp className="text-[#fbbf24]" size={20} />
                <h2 className="text-lg font-bold font-sans">Market Events</h2>
              </div>
              {marketSimulation.getEvents().length === 0 ? (
                <div className="p-6 text-center text-[#9f9fa0] text-xs">
                  No active market events
                </div>
              ) : (
                <div className="divide-y divide-[#1F2A3F]/50">
                  {marketSimulation.getEvents().slice(0, 3).map((event) => (
                    <div key={event.id} className="px-6 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${
                          event.type === 'positive' ? 'bg-[#00f59b]' :
                          event.type === 'negative' ? 'bg-[#ef4444]' :
                          'bg-[#9f9fa0]'
                        }`} />
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#9f9fa0]">
                          {event.sectors.join(', ')}
                        </span>
                      </div>
                      <p className="text-xs text-white leading-relaxed">
                        {event.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Leaderboard */}
            <div className="bg-[#161F30] border border-[#1F2A3F] rounded-3xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-[#1F2A3F] flex items-center gap-3">
                <Trophy className="text-[#00875a]" size={20} />
                <h2 className="text-lg font-bold font-sans">Leaderboard</h2>
              </div>
              {leaderboard.length === 0 ? (
                <div className="p-8 text-center text-[#9f9fa0] text-sm">
                  No public portfolios yet.
                </div>
              ) : (
                <div className="divide-y divide-[#1F2A3F]/50">
                  {leaderboard.slice(0, 10).map((entry, i) => (
                    <div key={entry.uid} className="px-6 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                          i === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                          i === 1 ? 'bg-gray-400/20 text-gray-400' :
                          i === 2 ? 'bg-orange-500/20 text-orange-500' :
                          'bg-white/5 text-[#9f9fa0]'
                        }`}>
                          {i + 1}
                        </span>
                        <span className="text-sm text-white font-medium truncate max-w-[120px]">
                          {entry.name}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-[#9f9fa0]">
                        NPR {entry.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
