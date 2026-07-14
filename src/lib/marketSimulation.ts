/**
 * Market Simulation Engine
 * 
 * Simulates realistic stock price movements using geometric Brownian motion.
 * Starts with live NEPSE prices and adds continuous fluctuations.
 * Runs 24/7 regardless of market hours.
 */

import { StockRow } from './nepseApi';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SimulatedStock {
  symbol: string;
  name: string;
  basePrice: number;        // Live price from NEPSE
  currentPrice: number;     // Simulated price
  open: number;
  high: number;
  low: number;
  previousClose: number;
  change: number;
  percentChange: number;
  volume: number;
  turnover: number;
  trades: number;
  sector: StockSector;
  volatility: number;       // 0.01-0.08 (1-8% daily)
  lastUpdate: number;
  priceHistory: number[];
  newsImpact: number;       // -0.05 to +0.05
}

export type StockSector = 
  | 'banking' 
  | 'hydropower' 
  | 'insurance' 
  | 'finance' 
  | 'manufacturing' 
  | 'hotel' 
  | 'tradings' 
  | 'development' 
  | 'others';

export interface MarketEvent {
  id: string;
  type: 'positive' | 'negative' | 'neutral';
  sectors: StockSector[];
  magnitude: number;        // 0.01-0.05 (1-5% impact)
  message: string;
  timestamp: number;
  expiresAt: number;
}

export interface SimulationState {
  stocks: Map<string, SimulatedStock>;
  events: MarketEvent[];
  lastGlobalUpdate: number;
  isInitialized: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const VOLATILITY_BY_SECTOR: Record<StockSector, { min: number; max: number }> = {
  banking: { min: 0.015, max: 0.03 },
  hydropower: { min: 0.03, max: 0.06 },
  insurance: { min: 0.02, max: 0.05 },
  finance: { min: 0.02, max: 0.04 },
  manufacturing: { min: 0.015, max: 0.035 },
  hotel: { min: 0.025, max: 0.055 },
  tradings: { min: 0.02, max: 0.045 },
  development: { min: 0.01, max: 0.025 },
  others: { min: 0.02, max: 0.04 },
};

const SECTOR_KEYWORDS: Record<StockSector, string[]> = {
  banking: ['bank', 'banki', 'nabil', 'nica', 'sbl', 'lumbini', 'kbl', 'nib', 'prabhu', 'citizen'],
  hydropower: ['hydro', 'power', 'energy', 'electric', 'hp', 'vhp'],
  insurance: ['insurance', 'life', 'general', 'assurance'],
  finance: ['finance', 'micro', 'laghu'],
  manufacturing: ['manufacture', 'cement', 'steel', 'food', 'beverage'],
  hotel: ['hotel', 'resort', 'hospitality'],
  tradings: ['trading', 'tradecentral', 'nepal-dol', 'nltc'],
  development: ['development', 'infrastructure'],
  others: ['others', 'invest', 'capital', 'merger'],
};

const MARKET_EVENTS: Omit<MarketEvent, 'id' | 'timestamp' | 'expiresAt'>[] = [
  { type: 'positive', sectors: ['banking'], magnitude: 0.02, message: 'NRB announces rate cut, boosting banking sector' },
  { type: 'negative', sectors: ['banking'], magnitude: 0.025, message: 'NPL ratios rise in commercial banks' },
  { type: 'positive', sectors: ['hydropower'], magnitude: 0.03, message: 'New PPA agreements signed for hydropower projects' },
  { type: 'negative', sectors: ['hydropower'], magnitude: 0.035, message: 'Monsoon shortfall affects hydropower generation' },
  { type: 'positive', sectors: ['insurance'], magnitude: 0.02, message: 'Insurance penetration increases in rural areas' },
  { type: 'neutral', sectors: ['banking', 'finance'], magnitude: 0.01, message: 'Monetary policy review scheduled next week' },
  { type: 'positive', sectors: ['manufacturing'], magnitude: 0.025, message: 'Government announces industrial stimulus package' },
  { type: 'negative', sectors: ['hotel'], magnitude: 0.03, message: 'Tourist arrivals decline due to global slowdown' },
  { type: 'positive', sectors: ['hotel'], magnitude: 0.03, message: 'Record tourist arrivals boost hospitality sector' },
  { type: 'neutral', sectors: ['tradings'], magnitude: 0.015, message: 'Trading volumes surge amid market volatility' },
  { type: 'positive', sectors: ['banking', 'finance', 'hydropower'], magnitude: 0.04, message: 'Market rally led by blue chips across sectors' },
  { type: 'negative', sectors: ['banking', 'finance', 'hydropower'], magnitude: 0.04, message: 'Market correction triggers broad selloff' },
];

// ── Utility Functions ─────────────────────────────────────────────────────────

/**
 * Box-Muller transform for generating Gaussian random numbers
 */
function gaussianRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Determine sector from stock symbol/name
 */
function determineSector(symbol: string, name: string): StockSector {
  const lowerSymbol = symbol.toLowerCase();
  const lowerName = name.toLowerCase();
  
  for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerSymbol.includes(keyword) || lowerName.includes(keyword)) {
        return sector as StockSector;
      }
    }
  }
  
  return 'others';
}

/**
 * Get volatility for a sector
 */
function getVolatilityForSector(sector: StockSector): number {
  const { min, max } = VOLATILITY_BY_SECTOR[sector];
  return min + Math.random() * (max - min);
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// ── Simulation Engine ─────────────────────────────────────────────────────────

class MarketSimulationEngine {
  private state: SimulationState;
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private eventInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(stocks: StockRow[]) => void> = new Set();
  private stockListeners: Map<string, Set<(stock: SimulatedStock) => void>> = new Map();

  constructor() {
    this.state = {
      stocks: new Map(),
      events: [],
      lastGlobalUpdate: Date.now(),
      isInitialized: false,
    };
  }

  /**
   * Initialize simulation with live NEPSE data
   */
  initialize(liveStocks: StockRow[]): void {
    if (this.state.isInitialized) return;

    for (const stock of liveStocks) {
      const sector = determineSector(stock.symbol, stock.name);
      const volatility = getVolatilityForSector(sector);

      const simulated: SimulatedStock = {
        symbol: stock.symbol,
        name: stock.name,
        basePrice: stock.ltp,
        currentPrice: stock.ltp,
        open: stock.open || stock.ltp,
        high: stock.high || stock.ltp,
        low: stock.low || stock.ltp,
        previousClose: stock.close || stock.ltp,
        change: stock.change,
        percentChange: stock.percentChange,
        volume: stock.volume,
        turnover: stock.turnover,
        trades: stock.trades,
        sector,
        volatility,
        lastUpdate: Date.now(),
        priceHistory: [stock.ltp],
        newsImpact: 0,
      };

      this.state.stocks.set(stock.symbol, simulated);
    }

    this.state.isInitialized = true;
    this.startSimulation();
  }

  /**
   * Start the simulation loops
   */
  private startSimulation(): void {
    // Update prices every 2 seconds
    this.updateInterval = setInterval(() => {
      this.updateAllPrices();
      this.notifyListeners();
    }, 2000);

    // Generate market events every 30-60 seconds
    this.eventInterval = setInterval(() => {
      this.generateMarketEvent();
    }, 30000 + Math.random() * 30000);
  }

  /**
   * Stop the simulation
   */
  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    if (this.eventInterval) {
      clearInterval(this.eventInterval);
      this.eventInterval = null;
    }
  }

  /**
   * Update all stock prices
   */
  private updateAllPrices(): void {
    const now = Date.now();

    for (const [symbol, stock] of this.state.stocks) {
      this.updateSingleStock(stock, now);
    }

    // Decay event impacts
    this.state.events = this.state.events.filter(event => now < event.expiresAt);
    for (const stock of this.state.stocks.values()) {
      stock.newsImpact *= 0.95; // Decay by 5% each update
    }

    this.state.lastGlobalUpdate = now;
  }

  /**
   * Update a single stock's price
   */
  private updateSingleStock(stock: SimulatedStock, now: number): void {
    const dt = (now - stock.lastUpdate) / (1000 * 60 * 60 * 24); // Convert to days
    
    // Base drift (slight upward bias)
    const drift = 0.00005;
    
    // Random shock from geometric Brownian motion
    const randomShock = gaussianRandom();
    
    // Calculate price change
    const volatilityFactor = stock.volatility * Math.sqrt(Math.max(dt, 0.0001));
    const newsFactor = stock.newsImpact;
    const priceChange = stock.currentPrice * (
      drift * dt + 
      volatilityFactor * randomShock + 
      newsFactor * dt
    );
    
    // Apply price change with bounds
    let newPrice = stock.currentPrice + priceChange;
    
    // Price cannot go below 50% of base or above 200% of base
    const lowerBound = stock.basePrice * 0.5;
    const upperBound = stock.basePrice * 2.0;
    newPrice = Math.max(lowerBound, Math.min(upperBound, newPrice));
    
    // Update stock data
    stock.currentPrice = Math.round(newPrice * 100) / 100;
    stock.high = Math.max(stock.high, stock.currentPrice);
    stock.low = Math.min(stock.low, stock.currentPrice);
    stock.change = stock.currentPrice - stock.previousClose;
    stock.percentChange = stock.previousClose > 0 
      ? ((stock.currentPrice - stock.previousClose) / stock.previousClose) * 100 
      : 0;
    stock.lastUpdate = now;
    
    // Keep price history (last 100 points)
    stock.priceHistory.push(stock.currentPrice);
    if (stock.priceHistory.length > 100) {
      stock.priceHistory.shift();
    }

    // Simulate volume increase with price movement
    const priceMovement = Math.abs(stock.change) / stock.previousClose;
    if (priceMovement > 0.01) {
      stock.volume += Math.floor(Math.random() * 10000);
      stock.trades += Math.floor(Math.random() * 10);
    }
  }

  /**
   * Generate a random market event
   */
  private generateMarketEvent(): void {
    if (Math.random() > 0.3) return; // 30% chance to generate event
    
    const eventTemplate = MARKET_EVENTS[Math.floor(Math.random() * MARKET_EVENTS.length)];
    const now = Date.now();
    
    const event: MarketEvent = {
      ...eventTemplate,
      id: generateId(),
      timestamp: now,
      expiresAt: now + 60000 + Math.random() * 120000, // 1-3 minutes
    };

    // Apply event to affected stocks
    for (const sector of event.sectors) {
      for (const stock of this.state.stocks.values()) {
        if (stock.sector === sector) {
          stock.newsImpact += event.type === 'positive' ? event.magnitude : -event.magnitude;
        }
      }
    }

    this.state.events.push(event);
    
    // Keep only recent events
    if (this.state.events.length > 10) {
      this.state.events.shift();
    }
  }

  /**
   * Apply price impact for large orders
   */
  applyPriceImpact(symbol: string, quantity: number, side: 'buy' | 'sell'): void {
    const stock = this.state.stocks.get(symbol);
    if (!stock) return;

    // Calculate impact based on order size relative to volume
    const volumeRatio = quantity / Math.max(stock.volume, 1);
    const impact = Math.min(volumeRatio * 0.1, 0.05); // Max 5% impact

    if (side === 'buy') {
      stock.currentPrice *= (1 + impact);
    } else {
      stock.currentPrice *= (1 - impact);
    }

    // Update related metrics
    stock.change = stock.currentPrice - stock.previousClose;
    stock.percentChange = stock.previousClose > 0 
      ? ((stock.currentPrice - stock.previousClose) / stock.previousClose) * 100 
      : 0;
    
    // Increase volume
    stock.volume += quantity;
    stock.trades += 1;
  }

  /**
   * Get current price for a stock
   */
  getPrice(symbol: string): number | null {
    const stock = this.state.stocks.get(symbol);
    return stock ? stock.currentPrice : null;
  }

  /**
   * Get all simulated stocks as StockRow[]
   */
  getStocks(): StockRow[] {
    return Array.from(this.state.stocks.values()).map(stock => ({
      symbol: stock.symbol,
      name: stock.name,
      ltp: stock.currentPrice,
      change: stock.change,
      percentChange: stock.percentChange,
      open: stock.open,
      high: stock.high,
      low: stock.low,
      close: stock.previousClose,
      volume: stock.volume,
      turnover: stock.turnover,
      trades: stock.trades,
    }));
  }

  /**
   * Get a single simulated stock
   */
  getSimulatedStock(symbol: string): SimulatedStock | null {
    return this.state.stocks.get(symbol) || null;
  }

  /**
   * Get current market events
   */
  getEvents(): MarketEvent[] {
    return this.state.events.filter(e => Date.now() < e.expiresAt);
  }

  /**
   * Subscribe to stock updates
   */
  subscribe(callback: (stocks: StockRow[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Subscribe to a specific stock
   */
  subscribeToStock(symbol: string, callback: (stock: SimulatedStock) => void): () => void {
    if (!this.stockListeners.has(symbol)) {
      this.stockListeners.set(symbol, new Set());
    }
    this.stockListeners.get(symbol)!.add(callback);
    return () => {
      const listeners = this.stockListeners.get(symbol);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.stockListeners.delete(symbol);
        }
      }
    };
  }

  /**
   * Notify all listeners of price updates
   */
  private notifyListeners(): void {
    const stocks = this.getStocks();
    for (const callback of this.listeners) {
      callback(stocks);
    }
  }

  /**
   * Update base prices from live NEPSE data (refresh periodically)
   */
  updateBasePrices(liveStocks: StockRow[]): void {
    for (const liveStock of liveStocks) {
      const simulated = this.state.stocks.get(liveStock.symbol);
      if (simulated) {
        // Only update base price if difference is significant (>5%)
        const diff = Math.abs(liveStock.ltp - simulated.basePrice) / simulated.basePrice;
        if (diff > 0.05) {
          simulated.basePrice = liveStock.ltp;
          simulated.previousClose = liveStock.close || liveStock.ltp;
        }
      }
    }
  }
}

// ── Singleton Export ──────────────────────────────────────────────────────────

export const marketSimulation = new MarketSimulationEngine();

// ── Helper Functions ──────────────────────────────────────────────────────────

/**
 * Format simulated price with change indicator
 */
export function formatSimulatedPrice(stock: SimulatedStock): {
  price: string;
  change: string;
  changePercent: string;
  isUp: boolean;
} {
  return {
    price: `Rs. ${stock.currentPrice.toFixed(2)}`,
    change: `${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}`,
    changePercent: `${stock.change >= 0 ? '+' : ''}${stock.percentChange.toFixed(2)}%`,
    isUp: stock.change >= 0,
  };
}

/**
 * Get price trend from history
 */
export function getPriceTrend(priceHistory: number[]): 'up' | 'down' | 'sideways' {
  if (priceHistory.length < 2) return 'sideways';
  
  const recent = priceHistory.slice(-10);
  const first = recent[0];
  const last = recent[recent.length - 1];
  const change = (last - first) / first;
  
  if (change > 0.02) return 'up';
  if (change < -0.02) return 'down';
  return 'sideways';
}

/**
 * Calculate volatility from price history
 */
export function calculateHistoricalVolatility(priceHistory: number[]): number {
  if (priceHistory.length < 2) return 0;
  
  const returns: number[] = [];
  for (let i = 1; i < priceHistory.length; i++) {
    returns.push(Math.log(priceHistory[i] / priceHistory[i - 1]));
  }
  
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  
  return Math.sqrt(variance) * Math.sqrt(252); // Annualized volatility
}
