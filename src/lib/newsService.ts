

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
  const key = import.meta.env.VITE_NVIDIA_API_KEY || import.meta.env.NVIDIA_API_KEY;
  if (!key) throw new Error('NVIDIA API key not configured. Set VITE_NVIDIA_API_KEY in .env');
  return key;
}

export async function researchSectorNews(sector: Sector): Promise<SectorNewsResult> {
  const apiKey = getApiKey();

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

  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'meta/llama-3.1-70b-instruct',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 4096,
    })
  });

  if (!response.ok) {
    throw new Error(`NVIDIA API error: ${response.status} ${response.statusText}`);
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
