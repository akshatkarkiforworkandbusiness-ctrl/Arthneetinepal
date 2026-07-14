/**
 * Reward System
 * 
 * Manages rewards for user activities:
 * - Complete lesson quiz: NPR 5,000
 * - Make a post: NPR 1,000
 * - Daily login: NPR 500
 * - Like a post: NPR 100
 * - Comment on post: NPR 200
 * - Share trade recap: NPR 500
 */

import { doc, getDoc, updateDoc, increment, serverTimestamp, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Portfolio, REWARD_AMOUNTS } from '../types/trading';

// ── Types ─────────────────────────────────────────────────────────────────────

export type RewardType = 
  | 'lesson_quiz'
  | 'post_created'
  | 'daily_login'
  | 'like_given'
  | 'comment_made'
  | 'trade_recap_share';

export interface RewardRecord {
  id: string;
  userId: string;
  type: RewardType;
  amount: number;
  description: string;
  createdAt: unknown;
}

export interface RewardClaim {
  id: string;
  userId: string;
  amount: number;
  claimedAt: unknown;
}

// ── Reward Amounts Map ────────────────────────────────────────────────────────

const REWARD_AMOUNT_MAP: Record<RewardType, number> = {
  lesson_quiz: REWARD_AMOUNTS.LESSON_QUIZ,
  post_created: REWARD_AMOUNTS.POST_CREATED,
  daily_login: REWARD_AMOUNTS.DAILY_LOGIN,
  like_given: REWARD_AMOUNTS.LIKE_GIVEN,
  comment_made: REWARD_AMOUNTS.COMMENT_MADE,
  trade_recap_share: REWARD_AMOUNTS.TRADE_RECAP_SHARE,
};

const REWARD_DESCRIPTIONS: Record<RewardType, string> = {
  lesson_quiz: 'Completed a lesson quiz',
  post_created: 'Created a new post',
  daily_login: 'Daily login bonus',
  like_given: 'Liked a post',
  comment_made: 'Commented on a post',
  trade_recap_share: 'Shared a trade recap',
};

// ── Helper Functions ──────────────────────────────────────────────────────────

/**
 * Get today's date as YYYY-MM-DD string
 */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Check if user has already claimed a specific reward type today
 */
async function hasClaimedToday(uid: string, type: RewardType): Promise<boolean> {
  if (type !== 'daily_login') return false;
  
  const today = getTodayString();
  const rewardsRef = collection(db, 'rewards');
  const q = query(
    rewardsRef,
    where('userId', '==', uid),
    where('type', '==', type),
    where('date', '==', today)
  );
  
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

/**
 * Check if user has already claimed a reward for a specific entity
 */
async function hasClaimedForEntity(uid: string, type: RewardType, entityId: string): Promise<boolean> {
  const rewardsRef = collection(db, 'rewards');
  const q = query(
    rewardsRef,
    where('userId', '==', uid),
    where('type', '==', type),
    where('entityId', '==', entityId)
  );
  
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

// ── Core Reward Functions ─────────────────────────────────────────────────────

/**
 * Award a reward to a user
 */
export async function awardReward(
  uid: string,
  type: RewardType,
  entityId?: string
): Promise<{ success: boolean; amount: number; message: string }> {
  try {
    // Check for duplicate claims
    if (type === 'daily_login') {
      const alreadyClaimed = await hasClaimedToday(uid, type);
      if (alreadyClaimed) {
        return { success: false, amount: 0, message: 'Daily login already claimed today' };
      }
    }
    
    if (entityId) {
      const alreadyClaimed = await hasClaimedForEntity(uid, type, entityId);
      if (alreadyClaimed) {
        return { success: false, amount: 0, message: 'Reward already claimed for this item' };
      }
    }

    const amount = REWARD_AMOUNT_MAP[type];
    const description = REWARD_DESCRIPTIONS[type];
    const today = getTodayString();

    // Add reward record
    const rewardsRef = collection(db, 'rewards');
    await addDoc(rewardsRef, {
      userId: uid,
      type,
      amount,
      description,
      date: today,
      entityId: entityId || null,
      createdAt: serverTimestamp(),
    });

    // Update portfolio reward balance
    const portfolioRef = doc(db, 'portfolios', uid);
    const portfolioSnap = await getDoc(portfolioRef);
    
    if (portfolioSnap.exists()) {
      await updateDoc(portfolioRef, {
        rewardBalance: increment(amount),
        totalRewardsEarned: increment(amount),
        updatedAt: serverTimestamp(),
      });
    }

    return { 
      success: true, 
      amount, 
      message: `Earned NPR ${amount.toLocaleString()} for ${description.toLowerCase()}` 
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `rewards`);
    return { success: false, amount: 0, message: 'Failed to award reward' };
  }
}

/**
 * Claim accumulated rewards (transfer to cash balance)
 */
export async function claimRewards(uid: string): Promise<{ success: boolean; amount: number; message: string }> {
  try {
    const portfolioRef = doc(db, 'portfolios', uid);
    const portfolioSnap = await getDoc(portfolioRef);
    
    if (!portfolioSnap.exists()) {
      return { success: false, amount: 0, message: 'Portfolio not found' };
    }

    const portfolio = portfolioSnap.data() as Portfolio;
    const rewardBalance = portfolio.rewardBalance || 0;

    if (rewardBalance <= 0) {
      return { success: false, amount: 0, message: 'No rewards to claim' };
    }

    // Transfer rewards to cash balance
    await updateDoc(portfolioRef, {
      cashBalance: increment(rewardBalance),
      rewardBalance: 0,
      updatedAt: serverTimestamp(),
    });

    // Record the claim
    const claimsRef = collection(db, 'rewardClaims');
    await addDoc(claimsRef, {
      userId: uid,
      amount: rewardBalance,
      claimedAt: serverTimestamp(),
    });

    return { 
      success: true, 
      amount: rewardBalance, 
      message: `Claimed NPR ${rewardBalance.toLocaleString()} rewards to your cash balance` 
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `portfolios/${uid}`);
    return { success: false, amount: 0, message: 'Failed to claim rewards' };
  }
}

/**
 * Get user's reward history
 */
export async function getRewardHistory(uid: string, limitCount = 20): Promise<RewardRecord[]> {
  try {
    const rewardsRef = collection(db, 'rewards');
    const q = query(
      rewardsRef,
      where('userId', '==', uid),
      // orderBy('createdAt', 'desc'), // Would need composite index
      // limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    const rewards: RewardRecord[] = [];
    
    snapshot.forEach(doc => {
      rewards.push({ id: doc.id, ...doc.data() } as RewardRecord);
    });
    
    // Sort by date (newest first) since we can't use orderBy without index
    rewards.sort((a, b) => {
      const aTime = (a.createdAt as any)?.toDate?.() || new Date(0);
      const bTime = (b.createdAt as any)?.toDate?.() || new Date(0);
      return bTime - aTime;
    });
    
    return rewards.slice(0, limitCount);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'rewards', false);
    return [];
  }
}

/**
 * Get user's reward summary
 */
export async function getRewardSummary(uid: string): Promise<{
  totalEarned: number;
  currentBalance: number;
  pendingRewards: number;
  recentRewards: RewardRecord[];
}> {
  try {
    const portfolioRef = doc(db, 'portfolios', uid);
    const portfolioSnap = await getDoc(portfolioRef);
    
    if (!portfolioSnap.exists()) {
      return { totalEarned: 0, currentBalance: 0, pendingRewards: 0, recentRewards: [] };
    }

    const portfolio = portfolioSnap.data() as Portfolio;
    const recentRewards = await getRewardHistory(uid, 5);

    return {
      totalEarned: portfolio.totalRewardsEarned || 0,
      currentBalance: portfolio.cashBalance || 0,
      pendingRewards: portfolio.rewardBalance || 0,
      recentRewards,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `portfolios/${uid}`, false);
    return { totalEarned: 0, currentBalance: 0, pendingRewards: 0, recentRewards: [] };
  }
}

// ── Convenience Functions for Common Rewards ──────────────────────────────────

/**
 * Award daily login reward
 */
export async function awardDailyLogin(uid: string) {
  return awardReward(uid, 'daily_login');
}

/**
 * Award lesson completion reward
 */
export async function awardLessonCompletion(uid: string, lessonId: string) {
  return awardReward(uid, 'lesson_quiz', lessonId);
}

/**
 * Award post creation reward
 */
export async function awardPostCreation(uid: string, postId: string) {
  return awardReward(uid, 'post_created', postId);
}

/**
 * Award like reward
 */
export async function awardLike(uid: string, postId: string) {
  return awardReward(uid, 'like_given', postId);
}

/**
 * Award comment reward
 */
export async function awardComment(uid: string, commentId: string) {
  return awardReward(uid, 'comment_made', commentId);
}

/**
 * Award trade recap share reward
 */
export async function awardTradeRecapShare(uid: string, postId: string) {
  return awardReward(uid, 'trade_recap_share', postId);
}

/**
 * Check and update lesson completion status
 */
export async function markLessonComplete(uid: string, lessonId: string): Promise<boolean> {
  try {
    const portfolioRef = doc(db, 'portfolios', uid);
    const portfolioSnap = await getDoc(portfolioRef);
    
    if (!portfolioSnap.exists()) return false;
    
    const portfolio = portfolioSnap.data() as Portfolio;
    const completedLessons = portfolio.completedLessons || [];
    
    // Check if already completed
    if (completedLessons.includes(lessonId)) {
      return false; // Already completed
    }
    
    // Mark as completed
    await updateDoc(portfolioRef, {
      completedLessons: [...completedLessons, lessonId],
      updatedAt: serverTimestamp(),
    });
    
    return true; // Newly completed
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `portfolios/${uid}`);
    return false;
  }
}

/**
 * Increment post count
 */
export async function incrementPostCount(uid: string): Promise<void> {
  try {
    const portfolioRef = doc(db, 'portfolios', uid);
    await updateDoc(portfolioRef, {
      totalPostsCreated: increment(1),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `portfolios/${uid}`);
  }
}

/**
 * Increment likes given count
 */
export async function incrementLikesGiven(uid: string): Promise<void> {
  try {
    const portfolioRef = doc(db, 'portfolios', uid);
    await updateDoc(portfolioRef, {
      totalLikesGiven: increment(1),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `portfolios/${uid}`);
  }
}
