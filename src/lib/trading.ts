import { doc, getDoc, getDocs, runTransaction, collection, query, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Portfolio, STARTING_CASH_BALANCE } from '../types/trading';
import type { Unsubscribe } from 'firebase/firestore';

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
 * Executes a buy or sell trade inside a Firestore transaction.
 *
 * Known limitation: totalValue is only accurate as of each user's last trade
 * for stocks they hold, not live market price, because there's no backend to
 * refresh it. This is an acceptable v1 simplification for a club-scale project.
 */
export async function executeTrade(
  uid: string,
  symbol: string,
  side: 'buy' | 'sell',
  quantity: number,
  price: number
): Promise<void> {
  const upperSymbol = symbol.toUpperCase();
  const portfolioRef = doc(db, 'portfolios', uid);

  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(portfolioRef);
      if (!snap.exists()) {
        throw new Error('Portfolio not found. Please refresh and try again.');
      }

      const portfolio = snap.data() as Portfolio;

      // Validate quantity
      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error('Quantity must be a positive whole number.');
      }

      if (side === 'buy') {
        const cost = quantity * price;
        if (cost > portfolio.cashBalance) {
          throw new Error(
            `Insufficient cash. Buying ${quantity} shares at Rs. ${price} costs Rs. ${cost.toLocaleString()}, but you only have Rs. ${portfolio.cashBalance.toLocaleString()}.`
          );
        }

        // Deduct cash
        const newCashBalance = portfolio.cashBalance - cost;

        // Update holdings — weighted average cost
        const existing = portfolio.holdings[upperSymbol];
        let newAvgCost: number;
        let newQuantity: number;
        if (existing) {
          const existingTotal = existing.quantity * existing.avgCost;
          newQuantity = existing.quantity + quantity;
          newAvgCost = (existingTotal + cost) / newQuantity;
        } else {
          newQuantity = quantity;
          newAvgCost = price;
        }

        const newHoldings = {
          ...portfolio.holdings,
          [upperSymbol]: { quantity: newQuantity, avgCost: newAvgCost },
        };

        // Recompute totalValue using trade price for this symbol
        // Known limitation: uses trade price, not live market price for held stocks
        let holdingsValue = 0;
        for (const [sym, holding] of Object.entries(newHoldings)) {
          const effectivePrice = sym === upperSymbol ? price : holding.avgCost;
          holdingsValue += holding.quantity * effectivePrice;
        }

        transaction.update(portfolioRef, {
          cashBalance: newCashBalance,
          holdings: newHoldings,
          totalValue: newCashBalance + holdingsValue,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Sell
        const existing = portfolio.holdings[upperSymbol];
        if (!existing || existing.quantity < quantity) {
          const owned = existing ? existing.quantity : 0;
          throw new Error(
            `Insufficient shares. You own ${owned} share${owned === 1 ? '' : 's'} of ${upperSymbol} but tried to sell ${quantity}.`
          );
        }

        const proceeds = quantity * price;
        const newCashBalance = portfolio.cashBalance + proceeds;
        const newQuantity = existing.quantity - quantity;

        let newHoldings = { ...portfolio.holdings };
        if (newQuantity === 0) {
          delete newHoldings[upperSymbol];
        } else {
          newHoldings[upperSymbol] = { quantity: newQuantity, avgCost: existing.avgCost };
        }

        // Recompute totalValue
        let holdingsValue = 0;
        for (const [sym, holding] of Object.entries(newHoldings)) {
          const effectivePrice = sym === upperSymbol ? price : holding.avgCost;
          holdingsValue += holding.quantity * effectivePrice;
        }

        transaction.update(portfolioRef, {
          cashBalance: newCashBalance,
          holdings: newHoldings,
          totalValue: newCashBalance + holdingsValue,
          updatedAt: serverTimestamp(),
        });
      }

      // Write trade record to subcollection
      const tradesRef = collection(db, 'portfolios', uid, 'trades');
      const tradeRef = doc(tradesRef);
      transaction.set(tradeRef, {
        symbol: upperSymbol,
        side,
        quantity,
        price,
        total: quantity * price,
        timestamp: serverTimestamp(),
      });
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
