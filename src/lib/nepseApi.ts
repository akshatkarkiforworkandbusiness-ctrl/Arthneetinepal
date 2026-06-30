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

export interface TopStocks {
  top_gainers: { symbol: string; ltp: number; change: number; percentChange: number }[];
  top_losers: { symbol: string; ltp: number; change: number; percentChange: number }[];
  top_turnover: { symbol: string; turnover: number }[];
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

/* ── Public fetchers ─────────────────────────────────────────────── */

export async function fetchStocks(): Promise<StockRow[]> {
  const data = await cachedFetch<StockRow[]>('stocks', `${YONEPSE_BASE}/data/nepse_data.json`);
  return data ?? [];
}

export async function fetchIndices(): Promise<MarketIndex[]> {
  const data = await cachedFetch<MarketIndex[]>('indices', `${YONEPSE_BASE}/data/market/indices.json`);
  return data ?? [];
}

export async function fetchTopStocks(): Promise<TopStocks | null> {
  return cachedFetch<TopStocks>('top_stocks', `${YONEPSE_BASE}/data/market/top_stocks.json`);
}

export async function fetchMarketSummary(): Promise<MarketSummary | null> {
  return cachedFetch<MarketSummary>('summary', `${YONEPSE_BASE}/data/market/summary.json`);
}

export async function fetchMarketStatus(): Promise<MarketStatus | null> {
  return cachedFetch<MarketStatus>('status', `${YONEPSE_BASE}/data/market/status.json`);
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
