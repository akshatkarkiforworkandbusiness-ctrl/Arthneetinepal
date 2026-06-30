const YONEPSE_BASE = 'https://shubhamnpk.github.io/yonepse';
const NEPSE_API_BASE = 'https://nepseapi.surajrimal.dev';

const TIMEOUT_MS = 8000;
const CACHE_TTL_MS = 30_000;

interface CacheEntry<T> { data: T; ts: number; }
const cache = new Map<string, CacheEntry<unknown>>();

async function fetchWithTimeout(url: string, timeout = TIMEOUT_MS): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function cachedFetch<T>(key: string, url: string): Promise<T | null> {
  const hit = cache.get(key) as CacheEntry<T> | undefined;
  if (hit && Date.now() - hit.ts < CACHE_TTL_MS) return hit.data;

  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`${res.status}`);
    const data = (await res.json()) as T;
    cache.set(key, { data, ts: Date.now() });
    return data;
  } catch {
    return null;
  }
}

/* ── YONEPSE endpoints ───────────────────────────────────────────── */

export interface StockRow {
  symbol: string;
  name: string;
  ltp: number;
  change: number;
  percentChange: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  turnover: number;
  trades: number;
  sector?: string;
}

export interface MarketIndex {
  index: string;
  close: number;
  change: number;
  percentChange: number;
}

export interface TopStock {
  symbol: string;
  ltp: number;
  change: number;
  percentChange: number;
}

export interface TopStocks {
  top_gainers: TopStock[];
  top_losers: TopStock[];
  top_turnover: { symbol: string; turnover: number }[];
}

interface RawTopStock {
  symbol: string;
  ltp: number;
  pointChange: number;
  percentageChange: number;
}

interface RawTopStocks {
  top_gainer?: RawTopStock[];
  top_loser?: RawTopStock[];
  top_turnover?: { symbol: string; turnover: number }[];
}

export interface MarketSummary {
  total_turnover: number;
  total_shares: number;
  total_transactions: number;
  total_scrips: number;
}

export interface MarketStatus {
  market_open: boolean;
  market_message?: string;
}

/* ── Raw API types ───────────────────────────────────────────────── */

interface RawStock {
  symbol: string;
  name: string;
  ltp: number;
  previous_close: number;
  change: number;
  percent_change: number;
  high: number;
  low: number;
  volume: number | null;
  turnover: number | null;
  trades: number | null;
}

interface RawIndex {
  index: string;
  close: number;
  currentValue: number;
  change: number;
  perChange: number;
}

/* ── Mappers ─────────────────────────────────────────────────────── */

function mapStock(raw: RawStock): StockRow | null {
  if (!raw.symbol || raw.ltp == null) return null;
  return {
    symbol: raw.symbol,
    name: raw.name ?? raw.symbol,
    ltp: Number(raw.ltp) || 0,
    change: Number(raw.change) || 0,
    percentChange: Number(raw.percent_change) || 0,
    open: Number(raw.previous_close) || 0,
    high: Number(raw.high) || 0,
    low: Number(raw.low) || 0,
    close: Number(raw.previous_close) || 0,
    volume: Number(raw.volume) || 0,
    turnover: Number(raw.turnover) || 0,
    trades: Number(raw.trades) || 0,
  };
}

function mapIndex(raw: RawIndex): MarketIndex | null {
  if (!raw.index) return null;
  return {
    index: raw.index,
    close: Number(raw.close ?? raw.currentValue) || 0,
    change: Number(raw.change) || 0,
    percentChange: Number(raw.perChange) || 0,
  };
}

/* ── Public fetchers ─────────────────────────────────────────────── */

export async function fetchStocks(): Promise<StockRow[]> {
  const raw = await cachedFetch<RawStock[]>('stocks', `${YONEPSE_BASE}/data/nepse_data.json`);
  if (!raw) return [];
  return raw.map(mapStock).filter(Boolean) as StockRow[];
}

export async function fetchIndices(): Promise<MarketIndex[]> {
  const raw = await cachedFetch<RawIndex[]>('indices', `${YONEPSE_BASE}/data/market/indices.json`);
  if (!raw) return [];
  return raw.map(mapIndex).filter(Boolean) as MarketIndex[];
}

export async function fetchTopStocks(): Promise<TopStocks | null> {
  const raw = await cachedFetch<RawTopStocks>('top_stocks', `${YONEPSE_BASE}/data/market/top_stocks.json`);
  if (!raw) return null;
  return {
    top_gainers: (raw.top_gainer ?? []).map(s => ({ symbol: s.symbol, ltp: s.ltp, change: s.pointChange, percentChange: s.percentageChange })),
    top_losers: (raw.top_loser ?? []).map(s => ({ symbol: s.symbol, ltp: s.ltp, change: s.pointChange, percentChange: s.percentageChange })),
    top_turnover: raw.top_turnover ?? [],
  };
}

interface RawSummaryItem {
  detail: string;
  value: number;
}

interface RawStatus {
  is_open: boolean;
  last_checked?: string;
}

export async function fetchMarketSummary(): Promise<MarketSummary | null> {
  const raw = await cachedFetch<RawSummaryItem[]>('summary', `${YONEPSE_BASE}/data/market/summary.json`);
  if (!raw || !Array.isArray(raw)) return null;
  const get = (key: string) => raw.find(r => r.detail.includes(key))?.value ?? 0;
  return {
    total_turnover: get('Turnover'),
    total_shares: get('Shares'),
    total_transactions: get('Transactions'),
    total_scrips: get('Scrips'),
  };
}

export async function fetchMarketStatus(): Promise<MarketStatus | null> {
  const raw = await cachedFetch<RawStatus>('status', `${YONEPSE_BASE}/data/market/status.json`);
  if (!raw) return null;
  return {
    market_open: raw.is_open ?? false,
    market_message: raw.last_checked,
  };
}

/* ── Fallback: NepseAPI-Unofficial ───────────────────────────────── */

export async function fetchNepseIndexFallback(): Promise<{ value: number; change: number; percentChange: number } | null> {
  try {
    const res = await fetchWithTimeout(`${NEPSE_API_BASE}/NepseIndex`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      value: parseFloat(data.currentValue ?? data.value ?? 0),
      change: parseFloat(data.change ?? 0),
      percentChange: parseFloat(data.perChange ?? data.percentageChange ?? 0),
    };
  } catch {
    return null;
  }
}
