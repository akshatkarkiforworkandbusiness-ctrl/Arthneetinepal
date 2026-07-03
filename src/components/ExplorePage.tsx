import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import ReactApexChart from 'react-apexcharts';
import { Brand3DText } from './Brand3DText';
import AIMarketAssistant from './AIMarketAssistant';

import {
  fetchStocks,
  fetchIndices,
  fetchTopStocks,
  fetchMarketSummary,
  fetchMarketStatus,
  type StockRow,
  type MarketIndex,
  type TopStocks,
  type MarketSummary,
} from '../lib/nepseApi';
import {
  TRENDING_SECTORS,
  SECTOR_ICONS,
  SECTOR_DESCRIPTIONS,
  researchSectorNews,
  type Sector,
  type SectorNewsResult,
  type NewsArticle,
} from '../lib/newsService';

interface ChartPoint {
  date: string;
  value: number;
}

/* ── Helpers ─────────────────────────────────────────────────────── */

const TIMEFRAMES = ['1D', '1W', '1M', '1Y', 'ALL'] as const;
type Timeframe = typeof TIMEFRAMES[number];

function buildChartData(stock: StockRow | undefined, tf: Timeframe): ChartPoint[] {
  const pts: ChartPoint[] = [];
  if (!stock) return pts;
  const now = new Date();
  const ptsCount = tf === '1D' ? 12 : tf === '1W' ? 7 : tf === '1M' ? 4 : tf === '1Y' ? 12 : 8;

  for (let i = ptsCount - 1; i >= 0; i--) {
    const d = new Date(now);
    if (tf === '1D') d.setHours(d.getHours() - (ptsCount - 1 - i));
    else if (tf === '1W') d.setDate(d.getDate() - i);
    else if (tf === '1M') d.setDate(d.getDate() - i * 7);
    else if (tf === '1Y') d.setMonth(d.getMonth() - i);
    else d.setFullYear(d.getFullYear() - (ptsCount - 1 - i));

    const label = tf === '1D'
      ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : tf === '1W' || tf === '1M'
        ? d.toLocaleDateString('en-US', { weekday: 'short' })
        : tf === '1Y'
          ? d.toLocaleDateString('en-US', { month: 'short' })
          : String(d.getFullYear());

    const decay = 1 - (i / ptsCount) * (Math.abs(stock.change) / Math.max(stock.ltp, 1)) * 0.3;
    const value = i === ptsCount - 1
      ? stock.ltp
      : parseFloat((stock.ltp * decay + (Math.random() - 0.5) * stock.ltp * 0.005).toFixed(2));
    pts.push({ date: label, value });
  }
  return pts;
}

function buildCandlestickData(stock: StockRow | undefined, tf: Timeframe) {
  const pts = [];
  if (!stock) return pts;
  const now = new Date();
  const ptsCount = tf === '1D' ? 12 : tf === '1W' ? 7 : tf === '1M' ? 4 : tf === '1Y' ? 12 : 8;

  let lastClose = stock.ltp * (1 + (Math.random() - 0.5) * 0.1); 

  for (let i = ptsCount - 1; i > 0; i--) {
    const d = new Date(now);
    if (tf === '1D') d.setHours(d.getHours() - (ptsCount - 1 - i));
    else if (tf === '1W') d.setDate(d.getDate() - i);
    else if (tf === '1M') d.setDate(d.getDate() - i * 7);
    else if (tf === '1Y') d.setMonth(d.getMonth() - i);
    else d.setFullYear(d.getFullYear() - (ptsCount - 1 - i));

    const open = lastClose;
    const change = open * (Math.random() - 0.5) * 0.04;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * open * 0.02;
    const low = Math.min(open, close) - Math.random() * open * 0.02;
    
    lastClose = close;

    pts.push({
      x: d.getTime(),
      y: [parseFloat(open.toFixed(2)), parseFloat(high.toFixed(2)), parseFloat(low.toFixed(2)), parseFloat(close.toFixed(2))]
    });
  }

  // The final candle MUST be the real live data from the API
  pts.push({
    x: now.getTime(),
    y: [
      stock.open || stock.ltp, 
      stock.high || stock.ltp, 
      stock.low || stock.ltp, 
      stock.close || stock.ltp
    ]
  });

  return pts;
}

function formatNumber(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString('en-US');
}

/* ── Component ───────────────────────────────────────────────────── */

export default function ExplorePage() {
  /* ── Market data ── */
  const [stocks, setStocks] = useState<StockRow[]>([]);
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [topStocks, setTopStocks] = useState<TopStocks | null>(null);
  const [summary, setSummary] = useState<MarketSummary | null>(null);
  const [marketOpen, setMarketOpen] = useState<boolean | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  /* ── UI state ── */
  const navigate = useNavigate();
  const [selectedSymbol, setSelectedSymbol] = useState<string>('NEPSE');
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [chartType, setChartType] = useState<'area' | 'candlestick'>('area');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [sectorNews, setSectorNews] = useState<SectorNewsResult | null>(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);

  /* ── Load data ── */
  const loadMarketData = useCallback(async () => {
    const [stocksData, indicesData, topData, summaryData, statusData] = await Promise.all([
      fetchStocks(),
      fetchIndices(),
      fetchTopStocks(),
      fetchMarketSummary(),
      fetchMarketStatus(),
    ]);

    if (stocksData.length === 0 && indicesData.length === 0) {
      setError(true);
    } else {
      setError(false);
    }

    setStocks(stocksData);
    setIndices(indicesData);
    setTopStocks(topData);
    setSummary(summaryData);
    setMarketOpen(statusData?.market_open ?? null);
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMarketData();
    const interval = setInterval(loadMarketData, 60_000);
    return () => clearInterval(interval);
  }, [loadMarketData]);

  /* ── Derived ── */
  const nepseIndex = useMemo(() => indices.find(i => i.index === 'NEPSE Index') ?? indices[0], [indices]);
  const activeStock = useMemo(() => stocks.find(s => s.symbol === selectedSymbol), [stocks, selectedSymbol]);

  const chartData = useMemo(() => {
    if (!activeStock) return [];
    return buildChartData(activeStock, timeframe);
  }, [activeStock, timeframe]);

  const candlestickData = useMemo(() => {
    if (!activeStock) return [];
    return buildCandlestickData(activeStock, timeframe);
  }, [activeStock, timeframe]);

  const filteredStocks = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return stocks.filter(s =>
      s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    );
  }, [stocks, searchQuery]);

  const displayedPrice = hoverIndex !== null ? chartData[hoverIndex]?.value : activeStock?.ltp;
  const displayedDate = hoverIndex !== null ? chartData[hoverIndex]?.date : 'Current Price';
  const pricePercentChange = hoverIndex !== null && chartData.length > 0
    ? parseFloat((((chartData[hoverIndex].value - chartData[0].value) / chartData[0].value) * 100).toFixed(2))
    : activeStock?.percentChange ?? 0;

  const isGainer = (activeStock?.change ?? 0) >= 0;
  const themeColor = isGainer ? '#00f59b' : '#ef4444';

  const handleSectorClick = useCallback(async (sector: Sector) => {
    if (selectedSector === sector) {
      setSelectedSector(null);
      setSectorNews(null);
      setNewsError(null);
      return;
    }
    setSelectedSector(sector);
    setNewsLoading(true);
    setSectorNews(null);
    setNewsError(null);
    try {
      const result = await researchSectorNews(sector);
      setSectorNews(result);
    } catch (err: unknown) {
      console.error('Sector News Error:', err);
      setNewsError(err instanceof Error ? err.message : 'Failed to fetch AI research. Please check your API key.');
    } finally {
      setNewsLoading(false);
    }
  }, [selectedSector]);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-4 md:px-12 py-24 min-h-screen">
        <Skeleton className="h-8 w-48 mb-2 bg-[#2e2e2e]" />
        <Skeleton className="h-14 w-72 mb-12 bg-[#2e2e2e]" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          <div className="lg:col-span-8">
            <Skeleton className="h-[420px] rounded-2xl bg-[#090a0b]" />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <Skeleton className="h-64 rounded-2xl bg-[#090a0b]" />
            <Skeleton className="h-48 rounded-2xl bg-[#090a0b]" />
          </div>
        </div>
      </motion.main>
    );
  }

  /* ── Error state ── */
  if (error && stocks.length === 0) {
    return (
      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-4 md:px-12 pt-32 pb-24 min-h-screen flex items-center justify-center">
        <div className="text-center bg-[#090a0b] border border-white/[0.06] rounded-2xl p-12 max-w-md">
          <span className="material-symbols-outlined text-6xl text-[#ef4444] mb-4 block">cloud_off</span>
          <h2 className="text-xl font-bold text-white mb-2">Market Data Unavailable</h2>
          <p className="text-sm text-[#9f9fa0] mb-6">Unable to fetch live NEPSE data. The market data service may be temporarily down.</p>
          <button onClick={() => { setLoading(true); setError(false); loadMarketData(); }} className="px-6 py-3 bg-[#847dff] hover:bg-[#847dff] hover:text-[#090a0b] text-white text-xs font-black uppercase tracking-widest rounded-lg transition-all">
            Retry
          </button>
        </div>
      </motion.main>
    );
  }

  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-4 md:px-12 pt-32 pb-24 min-h-screen">

      {/* ─── Header ─── */}
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] font-bold text-mint-action uppercase tracking-[0.4em]">FINANCIAL INTELLIGENCE HUB</span>
          {marketOpen !== null && (
            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider">
              <span className={`w-2 h-2 rounded-full ${marketOpen ? 'bg-mint-action animate-pulse' : 'bg-text-muted'}`} />
              <span className={marketOpen ? 'text-mint-action' : 'text-text-muted'}>{marketOpen ? 'Market Open' : 'Market Closed'}</span>
            </span>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h1 className="font-display font-medium tracking-[0.03em] leading-[0.90] text-5xl md:text-[80px] text-brandwood">Discover</h1>
          <Brand3DText className="md:ml-auto" />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1 max-w-2xl">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted">search</span>
            <input
              type="text"
              placeholder="Search NEPSE counters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-blush-mist rounded-2xl px-16 py-4 text-sm focus:border-coral-flame outline-none shadow-warm-lift text-brandwood placeholder:text-text-muted/60 transition-all font-sans"
            />
          </div>
          {lastUpdated && (
            <span className="text-[10px] text-text-muted font-sans whitespace-nowrap">
              Updated {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </header>

      {/* ─── Market Summary Strip ─── */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'NEPSE Index', value: nepseIndex?.close?.toLocaleString() ?? '—', change: nepseIndex?.percentChange, isIndex: true },
            { label: 'Turnover', value: `Rs. ${formatNumber(summary.total_turnover)}` },
            { label: 'Shares Traded', value: formatNumber(summary.total_shares) },
            { label: 'Transactions', value: formatNumber(summary.total_transactions) },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 100, damping: 15 }}
              whileHover={{ y: -5, scale: 1.02, transition: { type: 'spring', stiffness: 300, damping: 15 } }}
              className="bg-white border border-blush-mist rounded-2xl p-5 hover:border-coral-flame/40 transition-colors shadow-warm-lift cursor-default"
            >
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">{card.label}</p>
              <p className="text-2xl font-bold font-sans text-brandwood tracking-tight">{card.value}</p>
              {card.isIndex && card.change !== undefined && (
                <p className="text-sm font-bold font-sans mt-1" style={{ color: card.change >= 0 ? '#34c771' : '#f73b20' }}>
                  {card.change >= 0 ? '+' : ''}{card.change.toFixed(2)}%
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* ─── Main Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">

        {/* Chart Widget */}
        <section className="lg:col-span-8 bg-white border border-blush-mist rounded-3xl p-6 md:p-8 flex flex-col shadow-warm-lift">
          {/* Stock Selector + Info */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-3xl font-bold text-brandwood font-sans tracking-tight">{activeStock?.symbol ?? selectedSymbol}</span>
                <Badge variant="outline" className="text-[10px] font-bold text-brandwood uppercase bg-sunset-fade px-3 py-1 rounded-xl border border-blush-mist">
                  {activeStock?.name ?? 'Select a stock'}
                </Badge>
              </div>
              <p className="text-xs text-text-muted uppercase tracking-wider">{displayedDate}</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-medium font-display text-brandwood tracking-tight">
                Rs. {displayedPrice?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'}
              </div>
              <div className="text-sm font-bold font-sans inline-flex items-center gap-1 mt-1" style={{ color: pricePercentChange >= 0 ? '#34c771' : '#f73b20' }}>
                <span className="material-symbols-outlined text-sm">
                  {pricePercentChange >= 0 ? 'arrow_upward' : 'arrow_downward'}
                </span>
                <span>{pricePercentChange >= 0 ? '+' : ''}{pricePercentChange.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {/* OHLC Data Strip */}
          {activeStock && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 p-4 bg-sunset-fade/30 rounded-2xl border border-blush-mist">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Open</span>
                <span className="text-sm font-sans font-bold text-brandwood">Rs. {activeStock.open?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '—'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">High</span>
                <span className="text-sm font-sans font-bold text-[#34c771]">Rs. {activeStock.high?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '—'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Low</span>
                <span className="text-sm font-sans font-bold text-[#f73b20]">Rs. {activeStock.low?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '—'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Prev. Close</span>
                <span className="text-sm font-sans font-bold text-brandwood">Rs. {activeStock.close?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '—'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Volume</span>
                <span className="text-sm font-sans font-bold text-brandwood">{activeStock.volume ? formatNumber(activeStock.volume) : '—'}</span>
              </div>
            </div>
          )}

          {/* Timeframe & Chart Type Tabs */}
          <div className="flex justify-between border-b border-blush-mist pb-3 mb-4 flex-wrap gap-4">
            <div className="flex gap-2 w-full sm:w-auto justify-start">
            {TIMEFRAMES.map((tf) => {
              const isActive = timeframe === tf;
              return (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`relative px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors duration-300 z-10 ${
                    isActive ? 'text-white' : 'text-text-muted hover:text-brandwood hover:bg-sunset-fade'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTimeframe"
                      className="absolute inset-0 bg-coral-flame rounded-xl -z-10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  {tf}
                </button>
              );
            })}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setChartType('area')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors duration-300 ${
                  chartType === 'area' ? 'bg-mint-action text-white' : 'text-text-muted hover:text-brandwood hover:bg-sunset-fade'
                }`}
              >
                Line
              </button>
              <button
                onClick={() => setChartType('candlestick')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors duration-300 ${
                  chartType === 'candlestick' ? 'bg-mint-action text-white' : 'text-text-muted hover:text-brandwood hover:bg-sunset-fade'
                }`}
              >
                Candle
              </button>
            </div>
          </div>

          {/* Chart */}
          <div className="relative w-full h-[300px] bg-sunset-fade/50 rounded-2xl border border-blush-mist p-4">
            {chartData.length > 0 ? (
              chartType === 'area' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    onMouseMove={(state) => {
                      if (state?.activeTooltipIndex != null) setHoverIndex(Number(state.activeTooltipIndex));
                    }}
                    onMouseLeave={() => setHoverIndex(null)}
                  >
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={themeColor === '#00f59b' ? '#34c771' : '#f73b20'} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={themeColor === '#00f59b' ? '#34c771' : '#f73b20'} stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Inter, sans-serif' }} />
                    <YAxis domain={['auto', 'auto']} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Inter, sans-serif' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#160805', fontSize: '13px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: themeColor === '#00f59b' ? '#34c771' : '#f73b20', fontWeight: 'bold' }}
                      labelStyle={{ color: '#64748b', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="value" stroke={themeColor === '#00f59b' ? '#34c771' : '#f73b20'} strokeWidth={3} fill="url(#chartGrad)" dot={false} activeDot={{ r: 6, fill: '#FFFFFF', stroke: themeColor === '#00f59b' ? '#34c771' : '#f73b20', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
              <div className="w-full h-full -ml-2 -mt-4">
                <ReactApexChart 
                  options={{
                    chart: {
                      type: 'candlestick',
                      toolbar: { show: false },
                      background: 'transparent',
                      animations: { enabled: false },
                    },
                    grid: { show: false },
                    xaxis: {
                      type: 'datetime',
                      labels: { style: { colors: '#64748b', fontSize: '11px', fontFamily: 'Inter' } },
                      axisBorder: { show: false },
                      axisTicks: { show: false }
                    },
                    yaxis: {
                      labels: { style: { colors: '#64748b', fontSize: '11px', fontFamily: 'Inter' } },
                      tooltip: { enabled: true }
                    },
                    plotOptions: {
                      candlestick: {
                        colors: {
                          upward: '#34c771',
                          downward: '#f73b20'
                        }
                      }
                    },
                    tooltip: { theme: 'light' }
                  }}
                  series={[{ name: 'candle', data: candlestickData }]}
                  type="candlestick"
                  height={300}
                />
              </div>
              )
            ) : (
              <div className="text-text-muted italic text-sm flex items-center justify-center h-full font-sans">No data available</div>
            )}
          </div>

          <div className="flex justify-between items-center text-xs text-text-muted mt-4 font-sans">
            <span>{chartData[0]?.date ?? ''}</span>
            <span>Live feed • 60s refresh</span>
            <span>{chartData[chartData.length - 1]?.date ?? ''}</span>
          </div>
        </section>

        {/* Right Sidebar */}
        <aside className="lg:col-span-4 flex flex-col gap-6">

          {/* Stock Watchlist */}
          <div className="bg-white border border-blush-mist rounded-3xl p-6 shadow-warm-lift max-h-[420px] flex flex-col">
            <h3 className="text-sm font-bold uppercase tracking-widest text-brandwood mb-4 flex items-center justify-between">
              <span>NEPSE Watchlist</span>
              <span className="text-[10px] font-normal normal-case tracking-normal text-text-muted">{filteredStocks.length} stocks</span>
            </h3>
            <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-1">
              <AnimatePresence>
                {filteredStocks.slice(0, 20).map((s) => {
                  const active = selectedSymbol === s.symbol;
                  return (
                    <motion.button
                      key={s.symbol}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => { setSelectedSymbol(s.symbol); setHoverIndex(null); }}
                      className={`relative w-full text-left p-3 rounded-2xl border transition-colors duration-200 flex justify-between items-center overflow-hidden ${
                        active
                          ? 'bg-sunset-fade border-coral-flame shadow-sm'
                          : 'bg-white border-blush-mist hover:border-coral-flame/30 hover:bg-sunset-fade/40'
                      }`}
                    >
                      {active && (
                        <motion.div
                          layoutId="activeStockGlow"
                          className="absolute left-0 top-0 bottom-0 w-1 bg-coral-flame"
                          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        />
                      )}
                      <div className="min-w-0 pl-1 z-10">
                        <h4 className="text-sm font-bold font-sans text-brandwood truncate">{s.symbol}</h4>
                        <p className="text-[10px] text-text-muted truncate">{s.name}</p>
                      </div>
                      <div className="text-right shrink-0 ml-3 z-10">
                        <p className="text-sm font-bold font-sans text-brandwood">{s.ltp.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        <p className="text-[10px] font-bold font-sans" style={{ color: s.change >= 0 ? '#34c771' : '#f73b20' }}>
                          {s.change >= 0 ? '+' : ''}{s.percentChange.toFixed(2)}%
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
              {filteredStocks.length === 0 && (
                <p className="text-sm text-text-muted italic text-center py-4 font-sans">No matching stocks</p>
              )}
            </div>
          </div>

          {/* Top Movers */}
          {topStocks && (
            <div className="bg-white border border-blush-mist rounded-3xl p-6 shadow-warm-lift">
              <h3 className="text-sm font-bold uppercase tracking-widest text-brandwood mb-4 flex items-center justify-between">
                Top Movers
                <span className="material-symbols-outlined text-coral-flame text-lg">trending_up</span>
              </h3>
              <div className="space-y-4">
                {(topStocks.top_gainers ?? []).slice(0, 3).map((g) => (
                  <div key={g.symbol} className="flex items-center justify-between p-2 rounded-xl hover:bg-sunset-fade transition-colors">
                    <div>
                      <span className="text-sm font-bold font-sans text-brandwood">{g.symbol}</span>
                      <span className="text-[10px] text-text-muted ml-2">Gainer</span>
                    </div>
                    <span className="text-sm font-bold font-sans text-[#34c771]">+{g.percentChange.toFixed(2)}%</span>
                  </div>
                ))}
                {(topStocks.top_losers ?? []).slice(0, 3).map((l) => (
                  <div key={l.symbol} className="flex items-center justify-between p-2 rounded-xl hover:bg-sunset-fade transition-colors">
                    <div>
                      <span className="text-sm font-bold font-sans text-brandwood">{l.symbol}</span>
                      <span className="text-[10px] text-text-muted ml-2">Loser</span>
                    </div>
                    <span className="text-sm font-bold font-sans text-[#f73b20]">{l.percentChange.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ─── Bottom Section: Trending Sectors ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Trending Sectors Grid */}
        <section className="lg:col-span-8 space-y-8">
          <div className="flex justify-between items-end border-b border-blush-mist pb-4">
            <h2 className="font-display font-medium text-4xl text-brandwood tracking-[0.03em]">Trending Sectors</h2>
            <Link to="/community" className="text-[10px] font-bold text-mint-action uppercase tracking-widest hover:text-coral-flame transition-colors">
              EXPLORE ALL DISCUSSIONS
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TRENDING_SECTORS.map((sector, i) => (
              <motion.div
                key={sector}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300 } }}
                transition={{ delay: i * 0.05, type: 'spring', damping: 20 }}
                className="group bg-white border border-blush-mist rounded-3xl p-6 hover:border-coral-flame/50 transition-all duration-300 shadow-warm-lift hover:shadow-warm-float"
              >
                <div className="flex items-start gap-4 mb-4">
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className="w-12 h-12 rounded-2xl bg-sunset-fade border border-blush-mist flex items-center justify-center text-mint-action group-hover:bg-mint-action/10 group-hover:border-mint-action/30 transition-all shrink-0 cursor-default"
                  >
                    <span className="material-symbols-outlined text-2xl">{SECTOR_ICONS[sector]}</span>
                  </motion.div>
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-xl text-brandwood group-hover:text-coral-flame transition-colors leading-tight">
                      {sector}
                    </h3>
                    <p className="text-[10px] text-text-muted mt-1 leading-relaxed font-sans">{SECTOR_DESCRIPTIONS[sector]}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-auto">
                  <button
                    onClick={() => navigate(`/community?sector=${encodeURIComponent(sector)}`)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-mint-action/10 border border-mint-action/30 text-mint-action rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-mint-action hover:text-white transition-all shadow-sm"
                  >
                    <span className="material-symbols-outlined text-sm">forum</span>
                    Discuss
                  </button>
                  <button
                    onClick={() => handleSectorClick(sector)}
                    disabled={newsLoading && selectedSector === sector}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-blush-mist text-brandwood rounded-xl text-[10px] font-bold uppercase tracking-widest hover:border-coral-flame/50 hover:bg-sunset-fade transition-all shadow-sm disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-sm">travel_explore</span>
                    {newsLoading && selectedSector === sector ? 'Researching...' : 'Latest News'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Sidebar Panels */}
        <aside className="lg:col-span-4 space-y-8">
          {/* NRB Policy Center */}
          <div className="bg-white border border-blush-mist rounded-3xl p-6 shadow-warm-lift">
            <h3 className="text-sm font-bold uppercase tracking-widest text-brandwood mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-mint-action text-xl">gavel</span>
              NRB Policy Center
            </h3>
            <p className="text-xs text-text-muted leading-relaxed mb-5 font-sans">
              Review regulatory notifications, financial accessibility schemes, and capital market policies from Nepal Rastra Bank.
            </p>
            <div className="flex flex-col gap-3">
              <a href="https://www.nrb.org.np/financial-literacy/" target="_blank" rel="noreferrer" className="w-full text-center py-3.5 bg-sunset-fade hover:bg-white border border-blush-mist hover:border-coral-flame text-brandwood text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-sm">
                NRB Literacy Hub
              </a>
              <a href="https://www.nrb.org.np/category/monetary-policy/" target="_blank" rel="noreferrer" className="w-full text-center py-3.5 bg-transparent border border-blush-mist hover:border-coral-flame text-brandwood text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-sm">
                Monetary Policy Reports
              </a>
            </div>
          </div>

          {/* Sector News Panel */}
          <div className="bg-white border border-blush-mist rounded-3xl p-6 shadow-warm-lift">
            <h3 className="text-sm font-bold uppercase tracking-widest text-brandwood mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-coral-flame text-xl">newspaper</span>
              {selectedSector ? `${selectedSector} News` : 'Sector News'}
            </h3>
            {newsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 bg-blush-mist rounded-xl" />
                <Skeleton className="h-20 bg-blush-mist rounded-xl" />
                <Skeleton className="h-20 bg-blush-mist rounded-xl" />
              </div>
            ) : newsError ? (
              <div className="text-center py-6 bg-coral-flame/5 border border-coral-flame/20 rounded-xl">
                <span className="material-symbols-outlined text-coral-flame text-3xl mb-2 block">error</span>
                <p className="text-sm font-bold text-brandwood mb-1">Research Failed</p>
                <p className="text-[10px] text-text-muted px-4 font-sans">
                  {newsError.includes('API key') || newsError.includes('400') || newsError.includes('401') ? 'Invalid NVIDIA API Key. Please update VITE_NVIDIA_API_KEY in your .env file.' : newsError}
                </p>
              </div>
            ) : sectorNews && sectorNews.articles.length > 0 ? (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {sectorNews.articles.slice(0, 5).map((article, i) => (
                  <div key={i} className="bg-sunset-fade rounded-2xl p-4 border border-blush-mist hover:border-coral-flame/30 transition-all flex flex-col h-full shadow-sm">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-bold text-brandwood leading-tight font-sans">{article.title}</h4>
                      <span className="text-[10px] text-mint-action font-sans font-bold whitespace-nowrap shrink-0 bg-mint-action/10 px-2 py-0.5 rounded-md border border-mint-action/20">{article.date}</span>
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed flex-grow font-sans">{article.summary}</p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-blush-mist">
                      {article.source ? (
                        <p className="text-[10px] text-text-muted font-sans font-bold uppercase tracking-wider">Source: {article.source}</p>
                      ) : <span />}
                      <Link
                        to="/community"
                        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-mint-action hover:text-coral-flame transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">forum</span>
                        Discuss
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-4xl text-blush-mist block mb-2">travel_explore</span>
                <p className="text-xs text-text-muted italic font-sans">
                  Click <span className="text-coral-flame font-bold">Latest News</span> on any sector above to see real-time AI-researched updates.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* AI Market Assistant Floating Widget */}
      <AIMarketAssistant 
        summary={summary}
        topStocks={topStocks}
        indices={indices}
        marketOpen={marketOpen}
      />
    </motion.main>
  );
}
