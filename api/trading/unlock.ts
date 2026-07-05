import { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../_lib/cors';
import { verifyUser } from '../_lib/auth';
import { adminDb, FieldValue } from '../_lib/firebaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const uid = await verifyUser(req);
  if (!uid) {
    return res.status(401).json({ error: 'Unauthorized' });
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

    // 5. Check if portfolio already exists
    const portfolioRef = adminDb.collection('portfolios').doc(uid);
    const portfolioSnap = await portfolioRef.get();

    let portfolio: any;
    
    if (!portfolioSnap.exists) {
      // First-time initialization
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

      portfolio = {
        uid,
        cash: startingCapital,
        startingCapital,
        holdings: {},
        seasonId,
        createdAt: FieldValue.serverTimestamp(),
        lastTradeAt: null,
        totalTrades: 0,
        appliedBonuses
      };
      if (schoolId) portfolio.schoolId = schoolId;

      await portfolioRef.set(portfolio);
    } else {
      // Portfolio already exists, check for missing capital bonuses
      portfolio = portfolioSnap.data();
      const appliedBonuses = portfolio.appliedBonuses || [];
      let updated = false;

      if (masterExamScores['financial-literacy'] >= 80 && !appliedBonuses.includes('financial-literacy')) {
        portfolio.cash += 100000;
        portfolio.startingCapital += 100000;
        appliedBonuses.push('financial-literacy');
        updated = true;
      }
      if (masterExamScores['economics-research'] >= 80 && !appliedBonuses.includes('economics-research')) {
        portfolio.cash += 100000;
        portfolio.startingCapital += 100000;
        appliedBonuses.push('economics-research');
        updated = true;
      }

      if (updated) {
        portfolio.appliedBonuses = appliedBonuses;
        await portfolioRef.update({
          cash: portfolio.cash,
          startingCapital: portfolio.startingCapital,
          appliedBonuses
        });
      }
    }

    return res.status(200).json({ portfolio });
  } catch (error: any) {
    console.error('Error unlocking portfolio:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
