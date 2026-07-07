import type { VercelRequest, VercelResponse } from '@vercel/node';

const MODELS = [
  'meta/llama-3.1-70b-instruct',
  'meta/llama-3.1-8b-instruct',
  'meta/llama-3.3-70b-instruct',
];

const SECTORS = [
  'Commercial Banks',
  'Development Banks',
  'Finance Companies',
  'Insurance Companies',
  'Microfinance Institutions',
  'Non-Bank Financial Institutions',
  'Hydropower Companies',
  'Manufacturing & Consumer Goods',
  'Hotels & Tourism',
  'Telecommunications',
];

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(204).json({});
  }

  if (req.method === 'GET') {
    req.method = 'POST';
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    res.setHeader(key, value);
  }

  try {
    const { allSectors, sector } = req.body as { allSectors?: boolean; sector?: string };

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'NVIDIA API key not configured.',
      });
    }

    const sectorsToResearch = allSectors ? SECTORS : [sector || SECTORS[0]];

    const allArticles: Array<{
      sector: string;
      title: string;
      summary: string;
      date: string;
      source: string;
      url: string;
    }> = [];

    for (const sec of sectorsToResearch) {
      const prompt = `Research and summarize the LATEST news about the "${sec}" sector in Nepal's stock market (NEPSE). Return a JSON array with 1 article. Each article must have:
- "title": concise headline
- "summary": 2-3 sentence summary
- "date": "Today"
- "source": news source (e.g., "NEPSE", "NRB", "Sharesansar")
- "url": "/news" (placeholder)

Focus on: NRB policy, NEPSE performance, dividends, listings, economic indicators.
Return ONLY a valid JSON array with no markdown.`;

      for (const model of MODELS) {
        try {
          const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.3,
              max_tokens: 1024,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || '[]';

            let parsed: any[];
            try {
              const jsonMatch = content.match(/\[[\s\S]*\]/);
              parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
            } catch {
              parsed = [];
            }

            if (parsed.length > 0) {
              allArticles.push({
                sector: sec,
                title: parsed[0].title || `Latest News: ${sec}`,
                summary: parsed[0].summary || '',
                date: parsed[0].date || 'Today',
                source: parsed[0].source || 'NVIDIA AI',
                url: parsed[0].url || '/news',
              });
            }
            break;
          }
        } catch (err) {
          console.warn(`Model ${model} failed for ${sec}, trying next...`);
        }
      }
    }

    return res.status(200).json({ articles: allArticles });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown backend error',
    });
  }
}
