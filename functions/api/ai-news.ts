interface Env {
  NVIDIA_API_KEY: string;
}

const MODELS = [
  'meta/llama-3.1-70b-instruct',
  'meta/llama-3.1-8b-instruct',
  'meta/llama-3.3-70b-instruct',
];

const SECTORS = ['Banking', 'Hydropower', 'Microfinance', 'IPO Market', 'Mutual Funds', 'Inflation', 'Remittance'];

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  return onRequestPost(context);
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    const body = await request.json().catch(() => ({})) as { sector?: string; allSectors?: boolean };
    const apiKey = env.NVIDIA_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({
        error: 'NVIDIA API key not configured.'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }

    const sectorsToResearch = body.allSectors ? SECTORS : (body.sector ? [body.sector] : SECTORS);

    const results = await Promise.allSettled(
      sectorsToResearch.map(sector => researchSector(apiKey, sector))
    );

    const articles = results
      .filter((r): r is PromiseFulfilledResult<{ sector: string; articles: any[] }> => r.status === 'fulfilled')
      .flatMap(r => r.value.articles.map(a => ({ ...a, sector: r.value.sector })));

    return new Response(JSON.stringify({ articles, generatedAt: new Date().toISOString() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
  }
}

async function researchSector(apiKey: string, sector: string): Promise<{ sector: string; articles: any[] }> {
  const prompt = `You are a financial news researcher for Nepal's stock market (NEPSE).
Research and summarize the LATEST news about the "${sector}" sector in Nepal.
Return a JSON array of 3-5 recent news articles. Each article must have:
- "title": concise headline
- "summary": 2-3 sentence summary of key developments
- "date": approximate date (use "Today", "Yesterday", or "This week")
- "source": where this news might be found (e.g., "NEPSE", "NRB", "Sharesansar", "Bizmandu")

Focus on:
- Recent policy changes from Nepal Rastra Bank (NRB) affecting this sector
- NEPSE performance of stocks in this sector
- New listings, mergers, acquisitions, or dividends
- Government budget announcements impacting this sector
- Economic indicators relevant to this sector

Return ONLY a valid JSON array with no markdown formatting or code blocks.

Example:
[{"title":"NRB eases margin lending rules for banks","summary":"Nepal Rastra Bank has relaxed margin lending norms for commercial banks...","date":"Today","source":"Sharesansar"}]
`;

  for (const model of MODELS) {
    try {
      const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 4096,
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '[]';
        let articles: any[] = [];
        try {
          const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
          articles = JSON.parse(cleaned);
        } catch {
          articles = [{ title: `Latest ${sector} News`, summary: text.substring(0, 500), date: 'Today', source: 'NVIDIA AI' }];
        }
        return { sector, articles };
      }
    } catch {
      // Try next model
    }
  }

  return { sector, articles: [] };
}
