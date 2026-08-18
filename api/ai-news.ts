import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from './_lib/cors';
import { verifyUser } from './_lib/auth';
import { cached } from './_lib/cache';
import { checkRateLimit } from './_lib/rateLimit';

const MODELS = [
  'meta/llama-3.1-70b-instruct',
  'meta/llama-3.1-8b-instruct',
  'meta/llama-3.3-70b-instruct',
];

const VALID_SECTORS = [
  'Banking',
  'Hydropower',
  'Microfinance',
  'IPO Market',
  'Mutual Funds',
  'Inflation',
  'Remittance',
];

const CACHE_TTL_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const uid = await verifyUser(req);
  if (!uid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const rateKey = `ai-news:${uid}`;
  if (!checkRateLimit(rateKey, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
  }

  try {
    const { allSectors, sector } = (req.body || {}) as { allSectors?: boolean; sector?: string };

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'NVIDIA API key not configured. Set NVIDIA_API_KEY in Vercel project settings.',
      });
    }

    // Validate sector against allowlist to prevent prompt injection
    let sectorsToResearch: string[];
    if (allSectors) {
      sectorsToResearch = VALID_SECTORS;
    } else {
      const requestedSector = typeof sector === 'string' ? sector.trim() : '';
      if (!requestedSector || !VALID_SECTORS.includes(requestedSector)) {
        return res.status(400).json({ error: `Invalid sector. Must be one of: ${VALID_SECTORS.join(', ')}` });
      }
      sectorsToResearch = [requestedSector];
    }

    // Research all sectors in parallel
    const sectorPromises = sectorsToResearch.map(async (sec) => {
      const cacheKey = `news:${sec}`;
      return cached(cacheKey, CACHE_TTL_MS, async () => {
        const prompt = `Research and summarize the LATEST news about the "${sec}" sector in Nepal's stock market (NEPSE). Return a JSON array with 1 article. Each article must have:
- "title": concise headline
- "summary": 2-3 sentence summary
- "date": "Today"
- "source": news source (e.g., "NEPSE", "NRB", "Sharesansar")
- "url": "/news" (placeholder)

Focus on: NRB policy, NEPSE performance, dividends, listings, economic indicators.
Return ONLY a valid JSON array with no markdown.`;

        // Try all models in parallel, take first success
        const modelResults = await Promise.allSettled(
          MODELS.map(async (model) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

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
              signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
              const errText = await response.text().catch(() => '');
              throw new Error(`NVIDIA ${model}: ${response.status} - ${errText}`);
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || '[]';

            let parsed: any[];
            try {
              // Strip markdown code fences and extract JSON array
              const cleaned = content
                .replace(/```json\s*/g, '')
                .replace(/```\s*/g, '')
                .trim();
              const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
              parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(cleaned);
            } catch {
              parsed = [];
            }

            if (parsed.length === 0) throw new Error('Empty parsed result');

            return {
              sector: sec,
              title: parsed[0].title || `Latest News: ${sec}`,
              summary: parsed[0].summary || '',
              date: parsed[0].date || 'Today',
              source: parsed[0].source || 'NVIDIA AI',
              url: parsed[0].url || '/news',
            };
          })
        );

        // Return first successful result
        for (const result of modelResults) {
          if (result.status === 'fulfilled') return result.value;
        }
        // All models failed — return a fallback article
        return {
          sector: sec,
          title: `Latest ${sec} Sector Update`,
          summary: 'News data temporarily unavailable. Please check back later.',
          date: 'Today',
          source: 'Arthneeti',
          url: '/news',
        };
      });
    });

    const allArticles = await Promise.all(sectorPromises);
    return res.status(200).json({ articles: allArticles });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown backend error',
    });
  }
}
