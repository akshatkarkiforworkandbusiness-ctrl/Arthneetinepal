import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from './_lib/cors';
import { cached } from './_lib/cache';

const MODELS = [
  'meta/llama-3.1-70b-instruct',
  'meta/llama-3.1-8b-instruct',
  'meta/llama-3.3-70b-instruct',
];

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sector } = req.body as { sector: string };

    if (!sector) {
      return res.status(400).json({ error: 'Sector is required' });
    }

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'NVIDIA API key not configured. Please set NVIDIA_API_KEY in Vercel project settings > Environment Variables.',
      });
    }

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

    const cacheKey = `sector-news:${sector}`;
    const data = await cached(cacheKey, CACHE_TTL_MS, async () => {
      // Try all models in parallel, take first success
      const modelResults = await Promise.allSettled(
        MODELS.map(async (model) => {
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
              max_tokens: 4096,
            }),
          });

          if (!response.ok) {
            const errText = await response.text().catch(() => '');
            throw new Error(`NVIDIA ${model}: ${response.status} - ${errText}`);
          }

          return response.json();
        })
      );

      // Return first successful result
      for (const result of modelResults) {
        if (result.status === 'fulfilled') return result.value;
      }

      // All models failed
      throw new Error('All NVIDIA models failed. Please check your API key and try again later.');
    });

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown backend error',
    });
  }
}
