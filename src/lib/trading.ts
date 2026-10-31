import { doc, getDoc, getDocs, runTransaction, collection, query, orderBy, limit, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
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
        startingCapital: STARTING_CASH_BALANCE,
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
 *
 * The callback receives `null` when the document does not exist yet. The old
 * version simply never called back in that case, so a fresh user's UI sat on
 * its loading state forever with no error.
 */
export function subscribeToPortfolio(
  uid: string,
  callback: (p: Portfolio | null) => void
): Unsubscribe {
  const portfolioRef = doc(db, 'portfolios', uid);
  return onSnapshot(
    portfolioRef,
    (snap) => {
      callback(snap.exists() ? (snap.data() as Portfolio) : null);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `portfolios/${uid}`);
      callback(null);
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
  holding?: { avgCost: number; firstBuyAt?: number; purchaseDate?: Date }
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
      // Holding period — prefer the persisted firstBuyAt; fall back to the
      // legacy Date field, then to "just bought" (short-term rate).
      const boughtAt = holding.firstBuyAt
        ?? holding.purchaseDate?.getTime();
      const holdingDays = boughtAt
        ? Math.floor((Date.now() - boughtAt) / (1000 * 60 * 60 * 24))
        : 0;

      const cgtRate = holdingDays > TRADING_FEE_RATES.CGT_THRESHOLD_DAYS 
        ? TRADING_FEE_RATES.CGT_LONG_TERM 
        : TRADING_FEE_RATES.CGT_SHORT_TERM;
      capitalGainsTax = profit * cgtRate;
    }
  }
  
  const r = (n: number) => Math.round(n * 100) / 100;

  const brokerageRounded = r(brokerage);
  const sebonRounded = r(sebonFee);
  const cgtRounded = r(capitalGainsTax);

  // Sum the *rounded* parts. Summing first and rounding once let the displayed
  // breakdown differ from the charged total by a rupee in either direction.
  return {
    brokerage: brokerageRounded,
    sebonFee: sebonRounded,
    capitalGainsTax: cgtRounded,
    totalFees: r(brokerageRounded + sebonRounded + cgtRounded),
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
        existingHolding
          ? { avgCost: existingHolding.avgCost, firstBuyAt: existingHolding.firstBuyAt }
          : undefined
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

        // Update holdings — weighted average cost. firstBuyAt is stamped only
        // when the position is opened, so the CGT holding period measures from
        // the original purchase even across top-ups.
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
          [upperSymbol]: {
            quantity: newQuantity,
            avgCost: newAvgCost,
            firstBuyAt: existingHolding?.firstBuyAt ?? Date.now(),
          },
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
 * Fetches the top N portfolios for the in-game leaderboard.
 *
 * Reads the `leaderboards` snapshot written by /api/leaderboard/snapshot,
 * NOT the `portfolios` collection directly. The old implementation queried
 * `portfolios` with a bare orderBy, but that rule is
 *   `isOwner(userId) || (isSignedIn() && get(users/$(userId)).publicPortfolio)`
 * — a per-document `get()` Firestore cannot prove for an arbitrary list
 * result, so the query was always rejected with permission-denied and the
 * catch returned [] silently. `leaderboards` is `allow read: if true`.
 */
export async function getLeaderboard(
  limitCount = 20
): Promise<Array<{ uid: string; name: string; totalValue: number }>> {
  try {
    const q = query(
      collection(db, 'leaderboards'),
      where('scope', '==', 'national'),
      where('period', '==', 'season'),
      orderBy('computedAt', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];

    const entries = (snapshot.docs[0].data().entries ?? []) as Array<{
      uid: string;
      displayName?: string;
      portfolioValue?: number;
    }>;

    return entries
      .filter((e) => typeof e?.uid === 'string')
      .slice(0, limitCount)
      .map((e) => ({
        uid: e.uid,
        name: e.displayName || 'Anonymous',
        totalValue: Number(e.portfolioValue) || 0,
      }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'leaderboards', false);
    return [];
  }
}
