

const SECTORS = ['Banking', 'Hydropower', 'Microfinance', 'IPO Market', 'Mutual Funds', 'Inflation', 'Remittance'] as const;
export type Sector = typeof SECTORS[number];
export const TRENDING_SECTORS: Sector[] = [...SECTORS];
export const SECTOR_ICONS: Record<Sector, string> = {
  Banking: 'account_balance',
  Hydropower: 'bolt',
  Microfinance: 'handshake',
  'IPO Market': 'rocket_launch',
  'Mutual Funds': 'savings',
  Inflation: 'trending_up',
  Remittance: 'send_money',
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
  let articles: NewsArticle[] = [];
  try {
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    articles = JSON.parse(cleaned);
  } catch {
    articles = [{ title: `Latest ${sector} News`, summary: text.substring(0, 500), date: 'Today', source: 'NVIDIA AI' }];
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
