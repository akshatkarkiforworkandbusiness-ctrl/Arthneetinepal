import { doc, getDoc, getDocs, runTransaction, collection, query, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Portfolio, STARTING_CASH_BALANCE, TradingFees, TRADING_FEE_RATES } from '../types/trading';
import type { Unsubscribe } from 'firebase/firestore';
import { marketSimulation } from './marketSimulation';

/**
 * Creates or retrieves a portfolio for the given user inside a Firestore transaction.
 * Idempotent under concurrent calls — safe for first-load and reconnect.
 */
export async function getOrCreatePortfolio(uid: string): Promise<Portfolio> {
  const portfolioRef = doc(db, 'portfolios', uid);
  try {
    return await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(portfolioRef);
      if (snap.exists()) {
        return snap.data() as Portfolio;
      }
      const newPortfolio: Portfolio = {
        cashBalance: STARTING_CASH_BALANCE,
        holdings: {},
        totalValue: STARTING_CASH_BALANCE,
        updatedAt: serverTimestamp(),
        // Initialize reward fields
        rewardBalance: 0,
        totalRewardsEarned: 0,
        completedLessons: [],
        totalPostsCreated: 0,
        totalLikesGiven: 0,
      };
      transaction.set(portfolioRef, newPortfolio);
      return newPortfolio;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `portfolios/${uid}`);
    throw error;
  }
}

/**
 * Subscribes to live portfolio updates via onSnapshot.
 * Returns an unsubscribe function.
 */
export function subscribeToPortfolio(uid: string, callback: (p: Portfolio) => void): Unsubscribe {
  const portfolioRef = doc(db, 'portfolios', uid);
  return onSnapshot(
    portfolioRef,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as Portfolio);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `portfolios/${uid}`, false);
    }
  );
}

/**
 * Calculate trading fees for a transaction
 */
export function calculateTradingFees(
  side: 'buy' | 'sell',
  quantity: number,
  price: number,
  holding?: { avgCost: number; purchaseDate?: Date }
): TradingFees {
  const total = quantity * price;
  
  // Brokerage fee: 0.40% for orders <= 1 lakh, 1.50% for larger orders
  const brokerageRate = total <= TRADING_FEE_RATES.BROKERAGE_THRESHOLD 
    ? TRADING_FEE_RATES.BROKERAGE_MIN 
    : TRADING_FEE_RATES.BROKERAGE_MAX;
  const brokerage = total * brokerageRate;
  
  // SEBON fee: 0.015% (both buy and sell)
  const sebonFee = total * TRADING_FEE_RATES.SEBON_FEE;
  
  // Capital Gains Tax: only on sell side, only on profit
  let capitalGainsTax = 0;
  if (side === 'sell' && holding) {
    const profit = (price - holding.avgCost) * quantity;
    if (profit > 0) {
      // Determine holding period
      const holdingDays = holding.purchaseDate 
        ? Math.floor((Date.now() - holding.purchaseDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      
      const cgtRate = holdingDays > TRADING_FEE_RATES.CGT_THRESHOLD_DAYS 
        ? TRADING_FEE_RATES.CGT_LONG_TERM 
        : TRADING_FEE_RATES.CGT_SHORT_TERM;
      capitalGainsTax = profit * cgtRate;
    }
  }
  
  const totalFees = brokerage + sebonFee + capitalGainsTax;
  
  return {
    brokerage: Math.round(brokerage * 100) / 100,
    sebonFee: Math.round(sebonFee * 100) / 100,
    capitalGainsTax: Math.round(capitalGainsTax * 100) / 100,
    totalFees: Math.round(totalFees * 100) / 100,
  };
}

/**
 * Executes a buy or sell trade inside a Firestore transaction.
 * Uses simulated prices from market simulation engine.
 * Applies trading fees to all transactions.
 */
export async function executeTrade(
  uid: string,
  symbol: string,
  side: 'buy' | 'sell',
  quantity: number,
  price: number
): Promise<{ fees: TradingFees }> {
  const upperSymbol = symbol.toUpperCase();
  const portfolioRef = doc(db, 'portfolios', uid);

  try {
    return await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(portfolioRef);
      if (!snap.exists()) {
        throw new Error('Portfolio not found. Please refresh and try again.');
      }

      const portfolio = snap.data() as Portfolio;

      // Validate quantity
      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error('Quantity must be a positive whole number.');
      }

      // Get simulated price (use provided price as fallback)
      const simulatedPrice = marketSimulation.getPrice(upperSymbol) || price;

      // Calculate trading fees
      const existingHolding = portfolio.holdings[upperSymbol];
      const fees = calculateTradingFees(
        side,
        quantity,
        simulatedPrice,
        existingHolding ? { avgCost: existingHolding.avgCost } : undefined
      );

      // Calculate total cost including fees
      const subtotal = quantity * simulatedPrice;
      const totalCost = subtotal + fees.totalFees;

      if (side === 'buy') {
        if (totalCost > portfolio.cashBalance) {
          throw new Error(
            `Insufficient cash. Buying ${quantity} shares at Rs. ${simulatedPrice} costs Rs. ${subtotal.toLocaleString()} + Rs. ${fees.totalFees.toFixed(2)} fees = Rs. ${totalCost.toLocaleString()}, but you only have Rs. ${portfolio.cashBalance.toLocaleString()}.`
          );
        }

        // Deduct cash (including fees)
        const newCashBalance = portfolio.cashBalance - totalCost;

        // Update holdings — weighted average cost
        let newAvgCost: number;
        let newQuantity: number;
        if (existingHolding) {
          const existingTotal = existingHolding.quantity * existingHolding.avgCost;
          newQuantity = existingHolding.quantity + quantity;
          newAvgCost = (existingTotal + subtotal) / newQuantity;
        } else {
          newQuantity = quantity;
          newAvgCost = simulatedPrice;
        }

        const newHoldings = {
          ...portfolio.holdings,
          [upperSymbol]: { quantity: newQuantity, avgCost: newAvgCost },
        };

        // Recompute totalValue using simulated prices
        let holdingsValue = 0;
        for (const [sym, holding] of Object.entries(newHoldings)) {
          const effectivePrice = marketSimulation.getPrice(sym) || holding.avgCost;
          holdingsValue += holding.quantity * effectivePrice;
        }

        // Apply price impact for large orders
        marketSimulation.applyPriceImpact(upperSymbol, quantity, 'buy');

        transaction.update(portfolioRef, {
          cashBalance: newCashBalance,
          holdings: newHoldings,
          totalValue: newCashBalance + holdingsValue,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Sell
        if (!existingHolding || existingHolding.quantity < quantity) {
          const owned = existingHolding ? existingHolding.quantity : 0;
          throw new Error(
            `Insufficient shares. You own ${owned} share${owned === 1 ? '' : 's'} of ${upperSymbol} but tried to sell ${quantity}.`
          );
        }

        // Proceeds minus fees
        const proceeds = subtotal - fees.totalFees;
        const newCashBalance = portfolio.cashBalance + proceeds;
        const newQuantity = existingHolding.quantity - quantity;

        let newHoldings = { ...portfolio.holdings };
        if (newQuantity === 0) {
          delete newHoldings[upperSymbol];
        } else {
          newHoldings[upperSymbol] = { quantity: newQuantity, avgCost: existingHolding.avgCost };
        }

        // Recompute totalValue using simulated prices
        let holdingsValue = 0;
        for (const [sym, holding] of Object.entries(newHoldings)) {
          const effectivePrice = marketSimulation.getPrice(sym) || holding.avgCost;
          holdingsValue += holding.quantity * effectivePrice;
        }

        // Apply price impact for large orders
        marketSimulation.applyPriceImpact(upperSymbol, quantity, 'sell');

        transaction.update(portfolioRef, {
          cashBalance: newCashBalance,
          holdings: newHoldings,
          totalValue: newCashBalance + holdingsValue,
          updatedAt: serverTimestamp(),
        });
      }

      // Write trade record to subcollection (including fees breakdown)
      const tradesRef = collection(db, 'portfolios', uid, 'trades');
      const tradeRef = doc(tradesRef);
      transaction.set(tradeRef, {
        symbol: upperSymbol,
        side,
        quantity,
        price: simulatedPrice,
        total: subtotal,
        fees: fees,
        timestamp: serverTimestamp(),
      });

      return { fees };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `portfolios/${uid}/trades`);
    throw error;
  }
}

/**
 * Fetches the top N portfolios for the leaderboard.
 * Only returns users with publicPortfolio == true.
 *
 * Known limitation: totalValue is stale until next trade — no backend to
 * refresh. Acceptable for v1 at club scale.
 */
export async function getLeaderboard(
  limitCount = 20
): Promise<Array<{ uid: string; name: string; totalValue: number }>> {
  const portfoliosRef = collection(db, 'portfolios');
  const q = query(portfoliosRef, orderBy('totalValue', 'desc'), limit(limitCount));

  try {
    const snapshot = await getDocs(q);
    const results: Array<{ uid: string; name: string; totalValue: number }> = [];

    for (const docSnap of snapshot.docs) {
      const uid = docSnap.id;
      const data = docSnap.data();

      // Check publicPortfolio
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) continue;
      const userData = userSnap.data();
      if (!userData.publicPortfolio) continue;

      results.push({
        uid,
        name: userData.name || 'Anonymous',
        totalValue: data.totalValue || 0,
      });
    }

    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'portfolios', false);
    return [];
  }
}
