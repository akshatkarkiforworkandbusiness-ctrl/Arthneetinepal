import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../_lib/cors.js';
import { verifyUser } from '../_lib/auth.js';
import { adminDb, FieldValue, hasFirebaseAdminCredentials } from '../_lib/firebaseAdmin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const uid = await verifyUser(req);
  if (!uid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  /* Unlike verifyUser (token checks only), unlocking reads/writes Firestore
   * through the Admin SDK, which needs a service account. Fail fast with an
   * actionable message rather than an opaque 500 from inside the transaction. */
  if (!hasFirebaseAdminCredentials()) {
    return res.status(503).json({
      error: 'Trading is temporarily unavailable. Please try again later.',
    });
  }

  try {
    // 1. Fetch user progress
    const progressRef = adminDb.collection('users').doc(uid).collection('progress').doc('lessons');
    const progressSnap = await progressRef.get();
    
    if (!progressSnap.exists) {
      return res.status(400).json({ error: 'Learning progress not found. Please complete some lessons first.' });
    }

    const progressData = progressSnap.data() || {};
    const masterExamScores = progressData.masterExamScores || {};

    // 2. Check if investing-markets is completed
    const hasUnlocked = masterExamScores['investing-markets'] >= 80;
    if (!hasUnlocked) {
      return res.status(400).json({ error: 'You must complete the Investing & Markets module exam with 80%+ to unlock trading.' });
    }

    // 3. Fetch user profile to get schoolId
    const userRef = adminDb.collection('users').doc(uid);
    const userSnap = await userRef.get();
    const userData = userSnap.data() || {};
    const schoolId = userData.schoolId || null;

    // 4. Compute dynamic seasonId
    const now = new Date();
    const seasonId = `${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`;

    // 5. Check if portfolio already exists.
    //
    // Done inside a transaction: the old version read the portfolio, computed
    // new balances in memory, then wrote absolute values back — so a trade
    // committing in between had its cash silently overwritten.
    const portfolioRef = adminDb.collection('portfolios').doc(uid);

    let portfolio: any;

    portfolio = await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(portfolioRef);

      if (!snap.exists) {
        // First-time initialization.
        let startingCapital = 1000000;
        const appliedBonuses: string[] = [];

        if (masterExamScores['financial-literacy'] >= 80) {
          startingCapital += 100000;
          appliedBonuses.push('financial-literacy');
        }
        if (masterExamScores['economics-research'] >= 80) {
          startingCapital += 100000;
          appliedBonuses.push('economics-research');
        }

        const created: any = {
          // Canonical schema — matches src/types/trading.ts and the
          // PORTFOLIO_KEYS allowlist in firestore.rules.
          cashBalance: startingCapital,
          holdings: {},
          totalValue: startingCapital,
          updatedAt: FieldValue.serverTimestamp(),
          startingCapital,
          seasonId,
          rewardBalance: 0,
          totalRewardsEarned: 0,
          completedLessons: [],
          totalPostsCreated: 0,
          totalLikesGiven: 0,
          // Server-managed trading state.
          dailyTradesCount: 0,
          lastTradeDay: '',
          appliedBonuses,
        };
        if (schoolId) created.schoolId = schoolId;

        tx.set(portfolioRef, created);
        return created;
      }

      // Portfolio already exists — apply any unclaimed capital bonuses, and
      // migrate documents written by older server code that used `cash` and
      // `{ qty, avgCost }` holdings instead of `cashBalance` / `{ quantity }`.
      const data: any = { ...snap.data() };
      const patch: any = {};
      const deletes: string[] = [];

      // ---- legacy field migration ----
      if (typeof data.cashBalance !== 'number') {
        const migratedCash = typeof data.cash === 'number' ? data.cash : 1000000;
        data.cashBalance = migratedCash;
        patch.cashBalance = migratedCash;
        deletes.push('cash');
      }
      if (data.holdings) {
        const migratedHoldings: Record<string, any> = {};
        let changed = false;
        for (const [sym, pos] of Object.entries<any>(data.holdings)) {
          if (pos && typeof pos.quantity !== 'number' && typeof pos.qty === 'number') {
            migratedHoldings[sym] = { quantity: pos.qty, avgCost: Number(pos.avgCost) || 0 };
            changed = true;
          } else {
            migratedHoldings[sym] = pos;
          }
        }
        if (changed) {
          data.holdings = migratedHoldings;
          patch.holdings = migratedHoldings;
        }
      }
      if (typeof data.startingCapital !== 'number') {
        data.startingCapital = data.cashBalance ?? 1000000;
        patch.startingCapital = data.startingCapital;
      }
      if (typeof data.totalValue !== 'number') {
        data.totalValue = data.cashBalance;
        patch.totalValue = data.cashBalance;
      }
      if (data.appliedBonuses === undefined) {
        data.appliedBonuses = [];
        patch.appliedBonuses = [];
      }

      // ---- unclaimed exam bonuses ----
      const appliedBonuses: string[] = data.appliedBonuses;
      let dirty = deletes.length > 0 || Object.keys(patch).length > 0;

      for (const mod of ['financial-literacy', 'economics-research']) {
        if (masterExamScores[mod] >= 80 && !appliedBonuses.includes(mod)) {
          data.cashBalance += 100000;
          data.startingCapital += 100000;
          appliedBonuses.push(mod);
          patch.cashBalance = data.cashBalance;
          patch.startingCapital = data.startingCapital;
          dirty = true;
        }
      }

      if (dirty) {
        patch.appliedBonuses = appliedBonuses;
        patch.updatedAt = FieldValue.serverTimestamp();
        for (const key of deletes) patch[key] = FieldValue.delete();
        tx.update(portfolioRef, patch);
      }

      return { ...data, ...patch, appliedBonuses };
    });

    return res.status(200).json({ portfolio });
  } catch (error: any) {
    console.error('Error unlocking portfolio:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
