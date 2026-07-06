import { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../_lib/cors';
import { verifyUser } from '../_lib/auth';
import { adminDb, FieldValue } from '../_lib/firebaseAdmin';

interface TradeBody {
  symbol: string;
  side: 'buy' | 'sell';
  qty: number;
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

  const { symbol, side, qty } = req.body as TradeBody;

  if (!symbol || !side || !qty || qty <= 0 || !['buy', 'sell'].includes(side)) {
    return res.status(400).json({ error: 'Invalid request parameters' });
  }

  const upperSymbol = symbol.toUpperCase().trim();

  try {
    // 1. Check market status
    const statusRes = await fetch("https://shubhamnpk.github.io/yonepse/data/market/status.json");
    if (!statusRes.ok) throw new Error("Failed to fetch market status");
    const statusData = await statusRes.json() as any;
    if (!statusData.is_open) {
      return res.status(400).json({ error: "Market is closed. NEPSE trading is only open Sunday-Thursday, 11 AM - 3 PM NPT." });
    }

    // 2. Fetch stock data to get the price
    const stocksRes = await fetch("https://shubhamnpk.github.io/yonepse/data/nepse_data.json");
    if (!stocksRes.ok) throw new Error("Failed to fetch stock prices");
    const stocksData = await stocksRes.json() as any[];
    const stock = stocksData.find(s => s.symbol === upperSymbol);
    if (!stock || !stock.ltp) {
      return res.status(400).json({ error: `Stock symbol ${upperSymbol} not found or has no price data.` });
    }

    const price = Number(stock.ltp);
    const portfolioRef = adminDb.collection('portfolios').doc(uid);
    
    // Execute Firestore Transaction
    const result = await adminDb.runTransaction(async (transaction) => {
      const portfolioSnap = await transaction.get(portfolioRef);
      if (!portfolioSnap.exists) {
        throw new Error("Portfolio not initialized. Please complete the module to unlock trading.");
      }

      const portfolio = portfolioSnap.data() as any;
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      // Enforce daily trade limit (20 trades)
      let dailyTradesCount = portfolio.dailyTradesCount || 0;
      let lastTradeDay = portfolio.lastTradeDay || '';
      
      if (lastTradeDay === todayStr) {
        if (dailyTradesCount >= 20) {
          throw new Error("Daily limit reached. You can make a maximum of 20 trades per day.");
        }
        dailyTradesCount++;
      } else {
        lastTradeDay = todayStr;
        dailyTradesCount = 1;
      }

      // Enforce symbol cooldown (5 minutes)
      const tradesRef = portfolioRef.collection('trades');
      const recentTradesQuery = tradesRef
        .where('symbol', '==', upperSymbol)
        .orderBy('execAt', 'desc')
        .limit(1);
      
      const recentTradesSnap = await transaction.get(recentTradesQuery);
      if (!recentTradesSnap.empty) {
        const lastTrade = recentTradesSnap.docs[0].data();
        const lastTradeTime = lastTrade.execAt.toDate().getTime();
        if (now.getTime() - lastTradeTime < 5 * 60 * 1000) {
          throw new Error(`Cooldown active. Please wait 5 minutes between trades for the same symbol (${upperSymbol}).`);
        }
      }

      // Compute current holdings value to find Total Portfolio Value
      let totalHoldingsValue = 0;
      for (const [sym, pos] of Object.entries(portfolio.holdings as Record<string, { qty: number; avgCost: number }>)) {
        const hStock = stocksData.find(s => s.symbol === sym);
        const hPrice = hStock ? Number(hStock.ltp) : pos.avgCost;
        totalHoldingsValue += pos.qty * hPrice;
      }

      const totalPortfolioValue = portfolio.cash + totalHoldingsValue;

      // Process trade details
      let resultingCash = portfolio.cash;
      let resultingHoldingQty = 0;
      const holdings = { ...portfolio.holdings };

      if (side === 'buy') {
        const cost = price * qty;
        if (resultingCash < cost) {
          throw new Error(`Insufficient cash. Buying ${qty} shares of ${upperSymbol} requires NPR ${cost.toLocaleString()}, but you only have NPR ${resultingCash.toLocaleString()}.`);
        }

        // Enforce 25% single symbol cap
        const currentPos = holdings[upperSymbol] || { qty: 0, avgCost: 0 };
        const newQty = currentPos.qty + qty;
        const newPosValue = newQty * price;
        if (newPosValue > 0.25 * totalPortfolioValue) {
          throw new Error(`Position limit exceeded. You cannot allocate more than 25% of your total portfolio value (NPR ${(0.25 * totalPortfolioValue).toLocaleString()}) to a single stock.`);
        }

        const currentTotalCost = currentPos.qty * currentPos.avgCost;
        const newTotalCost = currentTotalCost + cost;
        const newAvgCost = newTotalCost / newQty;

        holdings[upperSymbol] = { qty: newQty, avgCost: newAvgCost };
        resultingCash -= cost;
        resultingHoldingQty = newQty;
      } else {
        const currentPos = holdings[upperSymbol];
        if (!currentPos || currentPos.qty < qty) {
          throw new Error(`Insufficient shares. You hold ${currentPos ? currentPos.qty : 0} shares of ${upperSymbol}.`);
        }

        const proceed = price * qty;
        const newQty = currentPos.qty - qty;
        
        if (newQty === 0) {
          delete holdings[upperSymbol];
        } else {
          holdings[upperSymbol] = { qty: newQty, avgCost: currentPos.avgCost };
        }
        
        resultingCash += proceed;
        resultingHoldingQty = newQty;
      }

      // Update Portfolio Document
      const updatedPortfolio = {
        ...portfolio,
        cash: resultingCash,
        holdings,
        lastTradeAt: FieldValue.serverTimestamp(),
        totalTrades: (portfolio.totalTrades || 0) + 1,
        dailyTradesCount,
        lastTradeDay
      };

      transaction.set(portfolioRef, updatedPortfolio);

      const tradeRef = tradesRef.doc();
      const tradeData = {
        symbol: upperSymbol,
        side,
        qty,
        execPrice: price,
        execAt: FieldValue.serverTimestamp(),
        resultingCash,
        resultingHoldingQty
      };

      transaction.set(tradeRef, tradeData);

      return { portfolio: updatedPortfolio, trade: { id: tradeRef.id, ...tradeData, execAt: now } };
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error executing trade:', error);
    return res.status(400).json({ error: error.message || 'Internal server error' });
  }
}
