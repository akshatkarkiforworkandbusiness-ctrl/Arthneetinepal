import { Building2, Zap, Handshake, Rocket, PiggyBank, TrendingUp, Send } from 'lucide-react';
import type { ComponentType } from 'react';

const SECTORS = ['Banking', 'Hydropower', 'Microfinance', 'IPO Market', 'Mutual Funds', 'Inflation', 'Remittance'] as const;
export type Sector = typeof SECTORS[number];
export const TRENDING_SECTORS: Sector[] = [...SECTORS];
export const SECTOR_ICONS: Record<Sector, ComponentType<{ size?: number; className?: string }>> = {
  Banking: Building2,
  Hydropower: Zap,
  Microfinance: Handshake,
  'IPO Market': Rocket,
  'Mutual Funds': PiggyBank,
  Inflation: TrendingUp,
  Remittance: Send,
};
export const SECTOR_DESCRIPTIONS: Record<Sector, string> = {
  Banking: 'Commercial banks, development banks, and finance companies',
  Hydropower: 'Hydropower projects and energy sector companies',
  Microfinance: 'Microfinance institutions and small-lending organizations',
  'IPO Market': 'Initial public offerings, FPOs, and new listings',
  'Mutual Funds': 'Mutual fund schemes and collective investment vehicles',
  Inflation: 'Consumer price trends, monetary policy, and purchasing power',
  Remittance: 'Remittance inflows, foreign employment, and dollarization',
};

export interface NewsArticle {
  title: string;
  summary: string;
  date: string;
  source?: string;
  url?: string;
}

export interface SectorNewsResult {
  sector: Sector;
  articles: NewsArticle[];
  generatedAt: string;
}

export interface NewsPostResult {
  postId: string;
  isNew: boolean;
  sector: Sector;
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Robustly extract a JSON array from AI response text.
 * Handles markdown code fences, trailing commas, and nested content.
 */
function extractJsonArray(text: string): any[] {
  // Strip markdown code fences
  let cleaned = text
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  // Try direct parse first
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === 'object' && parsed !== null) return [parsed];
  } catch { /* continue */ }

  // Extract JSON array using regex
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      // Fix trailing commas before closing bracket
      const fixed = arrayMatch[0].replace(/,\s*([\]}])/g, '$1');
      const parsed = JSON.parse(fixed);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* continue */ }
  }

  // Try to extract individual JSON objects
  const objectMatches = cleaned.match(/\{[^{}]*\}/g);
  if (objectMatches && objectMatches.length > 0) {
    const results: any[] = [];
    for (const objStr of objectMatches) {
      try {
        const fixed = objStr.replace(/,\s*([}])/g, '$1');
        const parsed = JSON.parse(fixed);
        results.push(parsed);
      } catch { /* skip invalid objects */ }
    }
    if (results.length > 0) return results;
  }

  return [];
}

export async function researchSectorNews(sector: Sector): Promise<SectorNewsResult> {
  const response = await fetch('/api/news', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sector })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Backend error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '[]';
  
  let articles: NewsArticle[] = extractJsonArray(text);

  // Validate articles have required fields
  articles = articles
    .filter(a => a && typeof a === 'object' && (a.title || a.summary))
    .map(a => ({
      title: a.title || `Latest ${sector} News`,
      summary: a.summary || 'No summary available.',
      date: a.date || 'Today',
      source: a.source || 'NVIDIA AI',
      url: a.url || '/news',
    }));

  // If no valid articles, create a fallback
  if (articles.length === 0) {
    articles = [{
      title: `Latest ${sector} News`,
      summary: text.substring(0, 500) || 'News data temporarily unavailable.',
      date: 'Today',
      source: 'NVIDIA AI',
    }];
  }

  return {
    sector,
    articles,
    generatedAt: new Date().toISOString(),
  };
}

export async function researchAllSectors(): Promise<SectorNewsResult[]> {
  const results = await Promise.allSettled(
    SECTORS.map(sector => researchSectorNews(sector))
  );
  return results
    .filter((r): r is PromiseFulfilledResult<SectorNewsResult> => r.status === 'fulfilled')
    .map(r => r.value);
}
