export interface Holding {
  quantity: number;
  avgCost: number; // average price paid per share, NPR
}

export interface TradingFees {
  brokerage: number;      // 0.40% - 1.50% based on transaction size
  sebonFee: number;       // 0.015%
  capitalGainsTax: number; // 5% (>1yr) or 7.5% (<1yr) on profit only
  totalFees: number;
}

export interface Portfolio {
  cashBalance: number; // NPR virtual currency
  holdings: Record<string, Holding>; // keyed by stock symbol
  totalValue: number; // cashBalance + sum(holding.quantity * lastKnownPrice), recomputed on every trade
  updatedAt: unknown; // Firestore Timestamp
  // Reward fields
  rewardBalance: number;      // Accumulated rewards pending claim
  totalRewardsEarned: number; // Lifetime rewards earned
  lastLoginDate?: string;     // YYYY-MM-DD for daily login tracking
  completedLessons: string[]; // Array of lesson IDs completed
  totalPostsCreated: number;  // Total posts created
  totalLikesGiven: number;    // Total likes given
}

export interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number; // NPR per share at execution
  total: number; // quantity * price
  fees: TradingFees; // Breakdown of trading fees
  timestamp: unknown; // Firestore Timestamp
}

export const STARTING_CASH_BALANCE = 1_000_000; // NPR, configurable — change here only

export const REWARD_AMOUNTS = {
  LESSON_QUIZ: 5000,    // Complete a lesson quiz
  POST_CREATED: 1000,   // Create a post
  DAILY_LOGIN: 500,     // Daily login bonus
  LIKE_GIVEN: 100,      // Like a post
  COMMENT_MADE: 200,    // Comment on a post
  TRADE_RECAP_SHARE: 500, // Share a trade recap
} as const;

export const TRADING_FEE_RATES = {
  BROKERAGE_MIN: 0.004,    // 0.40%
  BROKERAGE_MAX: 0.015,    // 1.50%
  BROKERAGE_THRESHOLD: 100000, // Rs. 1 lakh - threshold for fee rate
  SEBON_FEE: 0.00015,      // 0.015%
  CGT_SHORT_TERM: 0.075,   // 7.5% (<1yr)
  CGT_LONG_TERM: 0.05,     // 5% (>1yr)
  CGT_THRESHOLD_DAYS: 365,  // 1 year threshold
} as const;
