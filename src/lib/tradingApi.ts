import { auth } from './firebase';

const getAuthHeaders = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  const token = await user.getIdToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export interface Portfolio {
  uid: string;
  cash: number;
  startingCapital: number;
  holdings: Record<string, { qty: number; avgCost: number }>;
  schoolId?: string;
  seasonId: string;
  createdAt: any;
  lastTradeAt: any;
  totalTrades: number;
  appliedBonuses: string[];
}

export interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  qty: number;
  execPrice: number;
  execAt: any;
  resultingCash: number;
  resultingHoldingQty: number;
}

export async function unlockPortfolio(): Promise<{ portfolio: Portfolio }> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/trading/unlock', {
    method: 'POST',
    headers,
  });
  if (!res.ok) {
    let errorMessage = 'Failed to unlock trading portfolio';
    try {
      const errorData = await res.json() as any;
      errorMessage = errorData.error || errorMessage;
    } catch {
      // Response body is not JSON
    }
    throw new Error(errorMessage);
  }
  return res.json();
}

export async function executeTrade(symbol: string, side: 'buy' | 'sell', qty: number): Promise<{ portfolio: Portfolio; trade: Trade }> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/trading/execute', {
    method: 'POST',
    headers,
    body: JSON.stringify({ symbol, side, qty }),
  });
  if (!res.ok) {
    let errorMessage = 'Failed to execute trade';
    try {
      const errorData = await res.json() as any;
      errorMessage = errorData.error || errorMessage;
    } catch {
      // Response body is not JSON
    }
    throw new Error(errorMessage);
  }
  return res.json();
}
