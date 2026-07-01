import { GoogleGenAI } from '@google/genai';

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

function getApiKey(): string {
  const key = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
  if (!key) throw new Error('Gemini API key not configured. Set VITE_GEMINI_API_KEY in .env');
  return key;
}

export async function researchSectorNews(sector: Sector): Promise<SectorNewsResult> {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a financial news researcher for Nepal's stock market (NEPSE). 
Research and summarize the LATEST news about the "${sector}" sector in Nepal.
Return a JSON array of recent news articles. Each article must have:
- "title": concise headline
- "summary": 2-3 sentence summary of key developments
- "date": approximate date (use "Today", "Yesterday", or "This week")
- "source": where this news might be found (e.g., "NEPSE", "NRB", "Sharesansar", "Bizmandu")
- "url": a likely URL path (optional, use "/nepse" or "/news" as placeholder)

Focus on:
- Recent policy changes from Nepal Rastra Bank (NRB) affecting this sector
- NEPSE performance of stocks in this sector
- New listings, mergers, acquisitions, or dividends
- Government budget announcements impacting this sector
- Economic indicators relevant to this sector

Return ONLY a valid JSON array with no markdown formatting or code blocks.

Example:
[{"title":"NRB eases margin lending rules for banks","summary":"Nepal Rastra Bank has relaxed margin lending norms for commercial banks...","date":"Today","source":"Sharesansar","url":"/news/nrb-margin-lending"}]
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
      temperature: 0.3,
      maxOutputTokens: 4096,
    },
  });

  const text = response.text || '[]';
  let articles: NewsArticle[] = [];
  try {
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    articles = JSON.parse(cleaned);
  } catch {
    articles = [{ title: `Latest ${sector} News`, summary: text.substring(0, 500), date: 'Today', source: 'Gemini AI' }];
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
