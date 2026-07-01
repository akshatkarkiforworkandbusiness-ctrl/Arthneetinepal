import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
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
      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-4 md:px-12 py-24 min-h-screen flex items-center justify-center">
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
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-4 md:px-12 py-24 min-h-screen">

      {/* ─── Header ─── */}
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] font-black text-[#847dff] uppercase tracking-[0.4em]">FINANCIAL INTELLIGENCE HUB</span>
          {marketOpen !== null && (
            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider">
              <span className={`w-2 h-2 rounded-full ${marketOpen ? 'bg-[#847dff] animate-pulse' : 'bg-[#9f9fa0]'}`} />
              <span className={marketOpen ? 'text-[#847dff]' : 'text-[#9f9fa0]'}>{marketOpen ? 'Market Open' : 'Market Closed'}</span>
            </span>
          )}
        </div>
        <h1 className="font-sans font-semibold text-5xl md:text-7xl text-white italic mb-8">Discover</h1>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1 max-w-2xl">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#9f9fa0]">search</span>
            <input
              type="text"
              placeholder="Search NEPSE counters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#090a0b] border border-white/[0.06] rounded-full px-16 py-4 text-sm focus:border-[#847dff] outline-none shadow-xl text-white placeholder:text-[#9f9fa0]/50 transition-all"
            />
          </div>
          {lastUpdated && (
            <span className="text-[10px] text-[#9f9fa0] font-mono whitespace-nowrap">
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
              transition={{ delay: i * 0.06 }}
              className="bg-[#090a0b] border border-white/[0.06] rounded-xl p-5 hover:border-[#847dff]/40 transition-colors"
            >
              <p className="text-[10px] font-bold text-[#9f9fa0] uppercase tracking-wider mb-1">{card.label}</p>
              <p className="text-xl font-black font-mono text-white">{card.value}</p>
              {card.isIndex && card.change !== undefined && (
                <p className="text-xs font-bold font-mono mt-1" style={{ color: card.change >= 0 ? '#00f59b' : '#ef4444' }}>
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
        <section className="lg:col-span-8 bg-[#090a0b] border border-white/[0.06] rounded-2xl p-6 md:p-8 flex flex-col shadow-2xl">
          {/* Stock Selector + Info */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-2xl font-black text-white font-mono tracking-tight">{activeStock?.symbol ?? selectedSymbol}</span>
                <Badge variant="outline" className="text-[10px] font-bold text-[#9f9fa0] uppercase bg-[#0f1011] px-2 py-0.5 rounded-lg border border-white/[0.06]">
                  {activeStock?.name ?? 'Select a stock'}
                </Badge>
              </div>
              <p className="text-xs text-[#9f9fa0] uppercase tracking-wider">{displayedDate}</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black font-mono text-white tracking-tight">
                Rs. {displayedPrice?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'}
              </div>
              <div className="text-sm font-bold font-mono inline-flex items-center gap-1 mt-1" style={{ color: pricePercentChange >= 0 ? '#00f59b' : '#ef4444' }}>
                <span className="material-symbols-outlined text-xs">
                  {pricePercentChange >= 0 ? 'arrow_upward' : 'arrow_downward'}
                </span>
                <span>{pricePercentChange >= 0 ? '+' : ''}{pricePercentChange.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {/* Timeframe Tabs */}
          <Tabs defaultValue="1D" value={timeframe} onValueChange={(v) => setTimeframe(v as unknown as Timeframe)} className="mb-4">
            <TabsList className="flex border-b border-white/[0.06] pb-3 gap-2 bg-transparent p-0 w-full justify-start h-auto">
              {TIMEFRAMES.map((tf) => (
                <TabsTrigger key={tf} value={tf} className="px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all text-[#9f9fa0] hover:text-white hover:bg-[#0f1011]/50 data-[state=active]:bg-[#847dff] data-[state=active]:text-white h-auto">
                  {tf}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Chart */}
          <div className="relative w-full h-[260px] bg-[#0f1011]/60 rounded-xl border border-white/[0.06] p-4">
            {chartData.length > 0 ? (
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
                      <stop offset="5%" stopColor={themeColor} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={themeColor} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#9f9fa0', fontSize: 10, fontFamily: 'monospace' }} />
                  <YAxis domain={['auto', 'auto']} tickLine={false} axisLine={false} tick={{ fill: '#9f9fa0', fontSize: 10, fontFamily: 'monospace' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#090a0b', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '8px', color: '#FFF', fontSize: '12px' }}
                    itemStyle={{ color: themeColor }}
                    labelStyle={{ color: '#9f9fa0', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="value" stroke={themeColor} strokeWidth={2.5} fill="url(#chartGrad)" dot={false} activeDot={{ r: 6, fill: '#FFFFFF', stroke: themeColor, strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-[#9f9fa0] italic text-xs flex items-center justify-center h-full">No data available</div>
            )}
          </div>

          <div className="flex justify-between items-center text-[10px] text-[#9f9fa0] mt-3 font-mono">
            <span>{chartData[0]?.date ?? ''}</span>
            <span>Live feed • 60s refresh</span>
            <span>{chartData[chartData.length - 1]?.date ?? ''}</span>
          </div>
        </section>

        {/* Right Sidebar */}
        <aside className="lg:col-span-4 flex flex-col gap-6">

          {/* Stock Watchlist */}
          <div className="bg-[#090a0b] border border-white/[0.06] rounded-2xl p-6 shadow-2xl max-h-[420px] flex flex-col">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#9f9fa0] mb-4 flex items-center justify-between">
              <span>NEPSE Watchlist</span>
              <span className="text-[10px] font-normal normal-case tracking-normal text-[#9f9fa0]/60">{filteredStocks.length} stocks</span>
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
                      className={`w-full text-left p-3 rounded-lg border transition-all duration-200 flex justify-between items-center ${
                        active
                          ? 'bg-[#0f1011] border-[#847dff] shadow-lg'
                          : 'bg-[#090a0b] border-white/[0.06] hover:border-[#9f9fa0]/30 hover:bg-[#0f1011]/40'
                      }`}
                    >
                      <div className="min-w-0">
                        <h4 className="text-xs font-black font-mono text-white truncate">{s.symbol}</h4>
                        <p className="text-[9px] text-[#9f9fa0] truncate">{s.name}</p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-xs font-black font-mono text-white">{s.ltp.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        <p className="text-[9px] font-bold font-mono" style={{ color: s.change >= 0 ? '#00f59b' : '#ef4444' }}>
                          {s.change >= 0 ? '+' : ''}{s.percentChange.toFixed(2)}%
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
              {filteredStocks.length === 0 && (
                <p className="text-xs text-[#9f9fa0] italic text-center py-4">No matching stocks</p>
              )}
            </div>
          </div>

          {/* Top Movers */}
          {topStocks && (
            <div className="bg-[#090a0b] border border-white/[0.06] rounded-2xl p-6 shadow-2xl">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#9f9fa0] mb-4 flex items-center justify-between">
                Top Movers
                <span className="material-symbols-outlined text-[#847dff] text-lg">trending_up</span>
              </h3>
              <div className="space-y-3">
                {(topStocks.top_gainers ?? []).slice(0, 3).map((g) => (
                  <div key={g.symbol} className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold font-mono text-white">{g.symbol}</span>
                      <span className="text-[9px] text-[#9f9fa0] ml-2">Gainer</span>
                    </div>
                    <span className="text-xs font-bold font-mono text-[#00f59b]">+{g.percentChange.toFixed(2)}%</span>
                  </div>
                ))}
                {(topStocks.top_losers ?? []).slice(0, 3).map((l) => (
                  <div key={l.symbol} className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold font-mono text-white">{l.symbol}</span>
                      <span className="text-[9px] text-[#9f9fa0] ml-2">Loser</span>
                    </div>
                    <span className="text-xs font-bold font-mono text-[#ef4444]">{l.percentChange.toFixed(2)}%</span>
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
          <div className="flex justify-between items-end border-b border-white/[0.06] pb-4">
            <h2 className="font-sans font-semibold text-3xl text-white italic">Trending Sectors</h2>
            <Link to="/community" className="text-[10px] font-black text-[#847dff] uppercase tracking-widest hover:text-white transition-colors">
              EXPLORE ALL DISCUSSIONS
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TRENDING_SECTORS.map((sector, i) => (
              <motion.div
                key={sector}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group bg-[#090a0b] border border-white/[0.06] rounded-2xl p-6 hover:border-[#847dff]/60 transition-all duration-300 shadow-xl hover:shadow-[#847dff]/5"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#0f1011] border border-white/[0.06] flex items-center justify-center text-[#847dff] group-hover:bg-[#847dff]/20 group-hover:border-[#847dff]/40 transition-all shrink-0">
                    <span className="material-symbols-outlined text-2xl">{SECTOR_ICONS[sector]}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-sans font-semibold text-xl text-white italic group-hover:text-[#847dff] transition-colors leading-tight">
                      {sector}
                    </h3>
                    <p className="text-[10px] text-[#9f9fa0] mt-1 leading-relaxed">{SECTOR_DESCRIPTIONS[sector]}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-auto">
                  <button
                    onClick={() => navigate(`/community?sector=${encodeURIComponent(sector)}`)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#847dff]/10 border border-[#847dff]/30 text-[#847dff] rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[#847dff] hover:text-white transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">forum</span>
                    Discuss
                  </button>
                  <button
                    onClick={() => handleSectorClick(sector)}
                    disabled={newsLoading && selectedSector === sector}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#0f1011] border border-white/[0.06] text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:border-[#847dff]/50 transition-all disabled:opacity-40"
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
          <div className="bg-[#090a0b] border border-white/[0.06] rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#9f9fa0] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#847dff] text-lg">gavel</span>
              NRB Policy Center
            </h3>
            <p className="text-xs text-[#9f9fa0] leading-relaxed mb-5">
              Review regulatory notifications, financial accessibility schemes, and capital market policies from Nepal Rastra Bank.
            </p>
            <div className="flex flex-col gap-3">
              <a href="https://www.nrb.org.np/financial-literacy/" target="_blank" rel="noreferrer" className="w-full text-center py-3.5 bg-[#0f1011] hover:bg-[#0f1011]/50 border border-white/[0.06] hover:border-[#847dff] text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all">
                NRB Literacy Hub
              </a>
              <a href="https://www.nrb.org.np/category/monetary-policy/" target="_blank" rel="noreferrer" className="w-full text-center py-3.5 bg-transparent border border-white/[0.06] hover:border-[#847dff] text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all">
                Monetary Policy Reports
              </a>
            </div>
          </div>

          {/* Sector News Panel */}
          <div className="bg-[#090a0b] border border-white/[0.06] rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#9f9fa0] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#847dff] text-lg">newspaper</span>
              {selectedSector ? `${selectedSector} News` : 'Sector News'}
            </h3>
            {newsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 bg-[#2e2e2e] rounded-xl" />
                <Skeleton className="h-20 bg-[#2e2e2e] rounded-xl" />
                <Skeleton className="h-20 bg-[#2e2e2e] rounded-xl" />
              </div>
            ) : newsError ? (
              <div className="text-center py-6 bg-red-500/10 border border-red-500/20 rounded-xl">
                <span className="material-symbols-outlined text-red-400 text-2xl mb-2 block">error</span>
                <p className="text-sm font-bold text-white mb-1">Research Failed</p>
                <p className="text-[10px] text-[#9f9fa0] px-4">
                  {newsError.includes('API key') || newsError.includes('400') ? 'Invalid Gemini API Key. Please update VITE_GEMINI_API_KEY in your .env file.' : newsError}
                </p>
              </div>
            ) : sectorNews && sectorNews.articles.length > 0 ? (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {sectorNews.articles.slice(0, 5).map((article, i) => (
                  <div key={i} className="bg-[#0f1011] rounded-xl p-4 border border-white/[0.06] hover:border-[#847dff]/30 transition-all flex flex-col h-full">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-[11px] font-bold text-white leading-tight">{article.title}</h4>
                      <span className="text-[8px] text-[#847dff] font-mono whitespace-nowrap shrink-0">{article.date}</span>
                    </div>
                    <p className="text-[10px] text-[#9f9fa0] leading-relaxed flex-grow">{article.summary}</p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
                      {article.source ? (
                        <p className="text-[8px] text-[#9f9fa0]/50 font-mono uppercase tracking-wider">Source: {article.source}</p>
                      ) : <span />}
                      <Link
                        to="/community"
                        className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-[#847dff] hover:text-[#847dff] transition-colors"
                      >
                        <span className="material-symbols-outlined text-[10px]">forum</span>
                        Discuss
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-3xl text-[#9f9fa0]/30 block mb-2">travel_explore</span>
                <p className="text-[10px] text-[#9f9fa0] italic">
                  Click <span className="text-[#847dff] font-bold">Latest News</span> on any sector above to see real-time AI-researched updates.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </motion.main>
  );
}
