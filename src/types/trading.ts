export interface Holding {
  quantity: number;
  avgCost: number; // average price paid per share, NPR
}

export interface Portfolio {
  cashBalance: number; // NPR virtual currency
  holdings: Record<string, Holding>; // keyed by stock symbol
  totalValue: number; // cashBalance + sum(holding.quantity * lastKnownPrice), recomputed on every trade
  updatedAt: unknown; // Firestore Timestamp
}

export interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number; // NPR per share at execution
  total: number; // quantity * price
  timestamp: unknown; // Firestore Timestamp
}

export const STARTING_CASH_BALANCE = 1_000_000; // NPR, configurable — change here only
