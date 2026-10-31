import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../_lib/cors.js';
import { verifyUser } from '../_lib/auth.js';
import { adminDb, FieldValue, hasFirebaseAdminCredentials } from '../_lib/firebaseAdmin.js';
import { cached } from '../_lib/cache.js';

interface TradeBody {
  symbol: string;
  side: 'buy' | 'sell';
  qty: number;
}

const STOCK_CACHE_TTL_MS = 30_000; // 30 seconds
const STATUS_CACHE_TTL_MS = 60_000; // 1 minute
const MAX_DAILY_TRADES = 20;
const SYMBOL_COOLDOWN_MS = 5 * 60 * 1000;
const MAX_POSITION_FRACTION = 0.25;

/** Mirrors TRADING_FEE_RATES in src/types/trading.ts. */
const FEE_RATES = {
  BROKERAGE_MIN: 0.004,
  BROKERAGE_MAX: 0.015,
  BROKERAGE_THRESHOLD: 100_000,
  SEBON_FEE: 0.00015,
  CGT_SHORT_TERM: 0.075,
} as const;

/** Thrown for problems that are the caller's fault → surfaced as HTTP 400. */
class TradeRejected extends Error {}

/** Rounds to 2dp, matching the client's calculateTradingFees(). */
const r2 = (n: number) => Math.round(n * 100) / 100;

function calculateFees(side: 'buy' | 'sell', quantity: number, price: number, avgCost = 0) {
  const total = quantity * price;
  const brokerageRate = total <= FEE_RATES.BROKERAGE_THRESHOLD
    ? FEE_RATES.BROKERAGE_MIN
    : FEE_RATES.BROKERAGE_MAX;

  const brokerage = total * brokerageRate;
  const sebonFee = total * FEE_RATES.SEBON_FEE;

  let capitalGainsTax = 0;
  if (side === 'sell') {
    const profit = (price - avgCost) * quantity;
    if (profit > 0) capitalGainsTax = profit * FEE_RATES.CGT_SHORT_TERM;
  }

  const b = r2(brokerage);
  const s = r2(sebonFee);
  const c = r2(capitalGainsTax);

  // Sum the *rounded* parts so the breakdown on screen adds up to the total.
  return { brokerage: b, sebonFee: s, capitalGainsTax: c, totalFees: r2(b + s + c) };
}

async function fetchStockData(): Promise<any[]> {
  return cached('nepse:stocks', STOCK_CACHE_TTL_MS, async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch('https://shubhamnpk.github.io/yonepse/data/nepse_data.json', { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`Failed to fetch stock prices: ${res.status}`);
    return res.json();
  });
}

async function fetchMarketStatus(): Promise<any> {
  return cached('nepse:status', STATUS_CACHE_TTL_MS, async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch('https://shubhamnpk.github.io/yonepse/data/market/status.json', { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`Failed to fetch market status: ${res.status}`);
    return res.json();
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const uid = await verifyUser(req);
  if (!uid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Trading writes to Firestore through the Admin SDK, which needs a service
  // account. Without one this would throw deep inside the transaction and come
  // back as an opaque 500 — fail fast with something actionable instead.
  if (!hasFirebaseAdminCredentials()) {
    return res.status(503).json({
      error: 'Trading is temporarily unavailable. Please try again later.',
    });
  }

  // `req.body` is undefined when the request has no JSON body; destructuring
  // it directly throws before the try/catch and returns a bare 500.
  const { symbol, side, qty } = (req.body ?? {}) as Partial<TradeBody>;

  // Strict validation. The old checks let `qty: "5"` through (string comparison
  // coerces), which then concatenated into holdings and produced NaN average
  // costs, and let fractional shares through for a market that trades integers.
  if (typeof symbol !== 'string' || !symbol.trim()) {
    return res.status(400).json({ error: 'A valid stock symbol is required.' });
  }
  if (side !== 'buy' && side !== 'sell') {
    return res.status(400).json({ error: 'Side must be "buy" or "sell".' });
  }
  if (!Number.isInteger(qty) || qty < 1 || qty > 10_000) {
    return res.status(400).json({ error: 'Quantity must be a whole number between 1 and 10,000.' });
  }

  const upperSymbol = symbol.toUpperCase().trim();

  try {
    // 1. Check market status (cached)
    const statusData = await fetchMarketStatus();
    if (!statusData.is_open) {
      return res.status(400).json({ error: 'Market is closed. NEPSE trading is only open Sunday-Thursday, 11 AM - 3 PM NPT.' });
    }

    // 2. Fetch stock data (cached)
    const stocksData = await fetchStockData();
    const stock = stocksData.find((s: any) => s.symbol === upperSymbol);
    if (!stock || !stock.ltp) {
      return res.status(400).json({ error: `Stock symbol ${upperSymbol} not found or has no price data.` });
    }

    const price = Number(stock.ltp);
    // A malformed feed value would otherwise flow into the balance as NaN,
    // which Firestore stores happily and which permanently bricks the
    // portfolio: every later `cash < cost` comparison returns false.
    if (!Number.isFinite(price) || price <= 0) {
      return res.status(502).json({ error: 'The price feed returned invalid data. Please try again shortly.' });
    }

    const portfolioRef = adminDb.collection('portfolios').doc(uid);

    const result = await adminDb.runTransaction(async (transaction: any) => {
      const portfolioSnap = await transaction.get(portfolioRef);
      if (!portfolioSnap.exists) {
        throw new TradeRejected('Portfolio not initialized. Please complete the module to unlock trading.');
      }

      const portfolio = portfolioSnap.data() as any;
      const now = new Date();
      // NEPSE's trading day rolls over at midnight NPT (UTC+5:45), not UTC.
      const todayStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kathmandu',
        year: 'numeric', month: '2-digit', day: '2-digit',
      }).format(now);

      // Daily trade limit
      let dailyTradesCount = portfolio.dailyTradesCount || 0;
      let lastTradeDay = portfolio.lastTradeDay || '';
      if (lastTradeDay === todayStr) {
        if (dailyTradesCount >= MAX_DAILY_TRADES) {
          throw new TradeRejected(`Daily limit reached. You can make a maximum of ${MAX_DAILY_TRADES} trades per day.`);
        }
        dailyTradesCount++;
      } else {
        lastTradeDay = todayStr;
        dailyTradesCount = 1;
      }

      // Per-symbol cooldown. Tracked on the portfolio doc rather than queried
      // out of the trades subcollection — that query needed a composite index
      // (symbol ASC, execAt DESC) which was never deployed, so it failed every
      // single trade with FAILED_PRECONDITION.
      const lastTradeBySymbol: Record<string, number> = { ...(portfolio.lastTradeBySymbol || {}) };
      const lastAt = lastTradeBySymbol[upperSymbol];
      if (typeof lastAt === 'number' && now.getTime() - lastAt < SYMBOL_COOLDOWN_MS) {
        const waitSec = Math.ceil((SYMBOL_COOLDOWN_MS - (now.getTime() - lastAt)) / 1000);
        throw new TradeRejected(`Cooldown active. Please wait ${waitSec}s between trades for ${upperSymbol}.`);
      }

      // Canonical field names. Older server code wrote `cash` and
      // `{ qty, avgCost }`; the client and firestore.rules use `cashBalance`
      // and `{ quantity, avgCost }`. Read both so pre-migration docs still work.
      const cash: number = Number.isFinite(portfolio.cashBalance)
        ? portfolio.cashBalance
        : (Number.isFinite(portfolio.cash) ? portfolio.cash : 0);

      const holdings: Record<string, { quantity: number; avgCost: number }> = {};
      for (const [sym, pos] of Object.entries<any>(portfolio.holdings || {})) {
        if (!pos || typeof pos !== 'object') continue;
        const q = Number.isFinite(pos.quantity) ? pos.quantity : Number(pos.qty);
        if (!Number.isFinite(q) || q <= 0) continue;
        holdings[sym] = { quantity: q, avgCost: Number(pos.avgCost) || 0 };
      }

      let totalHoldingsValue = 0;
      for (const [sym, pos] of Object.entries(holdings)) {
        const hStock = stocksData.find((s: any) => s.symbol === sym);
        const hPrice = hStock && Number.isFinite(Number(hStock.ltp)) ? Number(hStock.ltp) : pos.avgCost;
        totalHoldingsValue += pos.quantity * hPrice;
      }

      const totalPortfolioValue = cash + totalHoldingsValue;

      let resultingCash = cash;
      const avgCostBefore = holdings[upperSymbol]?.avgCost ?? 0;

      if (side === 'buy') {
        const cost = price * qty;
        if (resultingCash < cost) {
          throw new TradeRejected(`Insufficient cash. Buying ${qty} shares of ${upperSymbol} requires NPR ${cost.toLocaleString()}, but you only have NPR ${resultingCash.toLocaleString()}.`);
        }

        const current = holdings[upperSymbol] || { quantity: 0, avgCost: 0 };
        const newQty = current.quantity + qty;
        if (newQty * price > MAX_POSITION_FRACTION * totalPortfolioValue) {
          throw new TradeRejected(`Position limit exceeded. You cannot allocate more than 25% of your total portfolio value (NPR ${(MAX_POSITION_FRACTION * totalPortfolioValue).toLocaleString()}) to a single stock.`);
        }

        const newTotalCost = current.quantity * current.avgCost + cost;
        holdings[upperSymbol] = { quantity: newQty, avgCost: newTotalCost / newQty };
        resultingCash -= cost;
      } else {
        const current = holdings[upperSymbol];
        if (!current || current.quantity < qty) {
          throw new TradeRejected(`Insufficient shares. You hold ${current ? current.quantity : 0} shares of ${upperSymbol}.`);
        }
        const newQty = current.quantity - qty;
        if (newQty === 0) delete holdings[upperSymbol];
        else holdings[upperSymbol] = { quantity: newQty, avgCost: current.avgCost };
        resultingCash += price * qty;
      }

      if (!Number.isFinite(resultingCash)) {
        throw new TradeRejected('Trade produced an invalid balance. Please contact support.');
      }

      const fees = calculateFees(side, qty, price, avgCostBefore);
      const nowMs = now.getTime();

      lastTradeBySymbol[upperSymbol] = nowMs;

      // Cash and holdings move in opposite directions by the same notional, so
      // total value is unchanged apart from the fees just charged.
      const resultingHoldingsValue = side === 'buy'
        ? totalHoldingsValue + price * qty
        : totalHoldingsValue - price * qty;

      const updatedPortfolio = {
        ...portfolio,
        cashBalance: resultingCash,
        holdings,
        totalValue: resultingCash + resultingHoldingsValue,
        updatedAt: FieldValue.serverTimestamp(),
        lastTradeAt: FieldValue.serverTimestamp(),
        totalTrades: (portfolio.totalTrades || 0) + 1,
        dailyTradesCount,
        lastTradeDay,
        lastTradeBySymbol,
      };
      delete updatedPortfolio.cash; // drop the legacy key as we migrate

      transaction.set(portfolioRef, updatedPortfolio);

      const tradeRef = portfolioRef.collection('trades').doc();
      const nowTs = FieldValue.serverTimestamp();
      // Written in the client's Trade shape so `orderBy('timestamp')` in
      // TradingPage/TradingGamePage actually returns these documents.
      const tradeData: any = {
        symbol: upperSymbol,
        side,
        quantity: qty,
        price,
        total: r2(price * qty),
        fees,
        timestamp: nowTs,
        // Retained for older readers.
        qty,
        execPrice: price,
        execAt: nowTs,
        resultingCash,
        resultingHoldingQty: holdings[upperSymbol]?.quantity ?? 0,
      };

      transaction.set(tradeRef, tradeData);

      // Never serialize FieldValue sentinels back to the client — JSON.stringify
      // turns them into `{}`. Build the response explicitly.
      return {
        portfolio: {
          ...updatedPortfolio,
          updatedAt: null,
          lastTradeAt: null,
          cashBalance: resultingCash,
        },
        trade: { id: tradeRef.id, ...tradeData, timestamp: now, execAt: now },
      };
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error executing trade:', error);
    // Business rejections are the user's problem; everything else is ours and
    // must not leak SDK internals (project ids, index links, retry tokens).
    if (error instanceof TradeRejected) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Could not execute the trade. Please try again.' });
  }
}
