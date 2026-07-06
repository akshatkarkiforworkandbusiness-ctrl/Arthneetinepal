import { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../_lib/cors';
import { verifyUser } from '../_lib/auth';
import { adminDb, FieldValue } from '../_lib/firebaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  // Enforce GET or POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verification: either Vercel Cron header, Admin user, or local development
  const isCron = req.headers['x-vercel-cron'] === 'true';
  const uid = await verifyUser(req);
  const isAdminUser = uid ? (await adminDb.collection('admins').doc(uid).get()).exists : false;
  const isDev = process.env.NODE_ENV === 'development' || !process.env.VERCEL;

  if (!isCron && !isAdminUser && !isDev) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 1. Fetch live stock prices
    const stocksRes = await fetch("https://shubhamnpk.github.io/yonepse/data/nepse_data.json");
    if (!stocksRes.ok) throw new Error("Failed to fetch stock prices");
    const stocksData = await stocksRes.json() as any[];

    // 2. Fetch all users for metadata mapping
    const usersSnap = await adminDb.collection('users').get();
    const userMap = new Map<string, { displayName: string; schoolId: string }>();
    usersSnap.forEach(doc => {
      const data = doc.data();
      userMap.set(doc.id, {
        displayName: data.name || 'Anonymous Scholar',
        schoolId: data.schoolId || ''
      });
    });

    const SCHOOL_NAMES: Record<string, string> = {
      'st-lawrence': 'St. Lawrence School',
      'kathmandu-valley': 'Kathmandu Valley Public School',
      'sos-disability': 'SOS Disability Center',
    };

    // 3. Fetch all portfolios
    const portfoliosSnap = await adminDb.collection('portfolios').get();
    const now = new Date();
    const seasonId = `${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`;
    const todayStr = now.toISOString().split('T')[0];

    interface RankedEntry {
      uid: string;
      displayName: string;
      portfolioValue: number;
      returnPercent: number;
      schoolId: string;
      schoolName: string;
    }

    const nationalEntries: RankedEntry[] = [];
    const schoolGroups = new Map<string, RankedEntry[]>();

    portfoliosSnap.forEach(docSnap => {
      const p = docSnap.data();
      const pUid = docSnap.id;
      const uMeta = userMap.get(pUid);

      if (!uMeta) return; // skip if user profile was deleted

      // Compute holdings value
      let holdingsValue = 0;
      for (const [sym, pos] of Object.entries(p.holdings as Record<string, { qty: number; avgCost: number }>)) {
        const stock = stocksData.find(s => s.symbol === sym);
        const ltp = stock ? Number(stock.ltp) : pos.avgCost;
        holdingsValue += pos.qty * ltp;
      }

      const totalValue = p.cash + holdingsValue;
      const returnPercent = ((totalValue - p.startingCapital) / p.startingCapital) * 100;

      const entry: RankedEntry = {
        uid: pUid,
        displayName: uMeta.displayName,
        portfolioValue: totalValue,
        returnPercent,
        schoolId: uMeta.schoolId || '',
        schoolName: SCHOOL_NAMES[uMeta.schoolId] || ''
      };

      nationalEntries.push(entry);

      if (uMeta.schoolId) {
        if (!schoolGroups.has(uMeta.schoolId)) {
          schoolGroups.set(uMeta.schoolId, []);
        }
        schoolGroups.get(uMeta.schoolId)!.push(entry);
      }
    });

    // Helper to rank entries
    const sortAndRank = (arr: RankedEntry[]) => {
      const sorted = [...arr].sort((a, b) => b.returnPercent - a.returnPercent);
      return sorted.map((entry, index) => ({
        uid: entry.uid,
        displayName: entry.displayName,
        portfolioValue: entry.portfolioValue,
        returnPercent: entry.returnPercent,
        schoolName: entry.schoolName,
        rank: index + 1
      }));
    };

    const batch = adminDb.batch();

    // 4. Save National snapshot (Season and Daily)
    const rankedNational = sortAndRank(nationalEntries);
    
    // Season long
    const nationalSeasonRef = adminDb.collection('leaderboards').doc(`${seasonId}_season`);
    batch.set(nationalSeasonRef, {
      period: 'season',
      scope: 'national',
      computedAt: FieldValue.serverTimestamp(),
      entries: rankedNational.slice(0, 100) // cap to top 100 for cost control
    });

    // Daily
    const nationalDailyRef = adminDb.collection('leaderboards').doc(`${seasonId}_daily-${todayStr}`);
    batch.set(nationalDailyRef, {
      period: 'daily',
      scope: 'national',
      computedAt: FieldValue.serverTimestamp(),
      entries: rankedNational.slice(0, 100)
    });

    // 5. Save School snapshots
    for (const [sId, group] of schoolGroups.entries()) {
      const rankedSchool = sortAndRank(group);

      // Season long
      const schoolSeasonRef = adminDb.collection('leaderboards').doc(`${sId}_season`);
      batch.set(schoolSeasonRef, {
        period: 'season',
        scope: sId,
        computedAt: FieldValue.serverTimestamp(),
        entries: rankedSchool.slice(0, 50)
      });

      // Daily
      const schoolDailyRef = adminDb.collection('leaderboards').doc(`${sId}_daily-${todayStr}`);
      batch.set(schoolDailyRef, {
        period: 'daily',
        scope: sId,
        computedAt: FieldValue.serverTimestamp(),
        entries: rankedSchool.slice(0, 50)
      });
    }

    await batch.commit();

    return res.status(200).json({ success: true, message: `Rankings calculated for ${nationalEntries.length} portfolios across ${schoolGroups.size} schools.` });
  } catch (error: any) {
    console.error('Error computing rankings snapshot:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
