import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from './_lib/cors.js';
import { verifyUser } from './_lib/auth.js';
import { cached } from './_lib/cache.js';
import { checkRateLimit } from './_lib/rateLimit.js';
import { complete, configuredProviders, extractJsonArray } from './_lib/ai.js';

const VALID_SECTORS = ['Banking', 'Hydropower', 'Microfinance', 'IPO Market', 'Mutual Funds', 'Inflation', 'Remittance'];
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

  const rateKey = `news:${uid}`;
  if (!checkRateLimit(rateKey, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
  }

  try {
    const { sector } = (req.body || {}) as { sector: string };

    if (!sector || typeof sector !== 'string' || !VALID_SECTORS.includes(sector.trim())) {
      return res.status(400).json({ error: `Invalid sector. Must be one of: ${VALID_SECTORS.join(', ')}` });
    }

    const sanitizedSector = sector.trim();

    if (configuredProviders().length === 0) {
      return res.status(500).json({
        error: 'No AI provider is configured. Set GROQ_API_KEY in the project environment.',
      });
    }

    const prompt = `You are a financial educator writing study material about Nepal's stock market (NEPSE).
Write 3 short, realistic EXAMPLE scenarios about the "${sanitizedSector}" sector. These illustrate how the sector behaves; they are not live reporting.

Rules:
- Describe typical developments such as a policy review, a dividend announcement, a new listing or a merger.
- Do not invent specific figures, percentages, company profits or exact dates.
- Use relative dates only: "Today", "Yesterday" or "This week".

Return ONLY a JSON array, no markdown, no commentary. Each item:
{"title":"...","summary":"one or two sentences","date":"Today","source":"NEPSE|NRB|Sharesansar|Bizmandu","url":"/news"}

Example:
[{"title":"NRB reviews margin lending norms","summary":"Nepal Rastra Bank periodically reviews how far banks may lend against shares, which shifts trading liquidity.","date":"Today","source":"NRB","url":"/news"}]
`;

    const cacheKey = `sector-news:${sector}`;
    const data = await cached(cacheKey, CACHE_TTL_MS, async () => {
      const result = await complete(prompt, {
        maxTokens: 700,
        // A model that answers in prose instead of JSON must not reach the cache.
        validate: (content) => (extractJsonArray(content)?.length ?? 0) > 0,
      });

      // The client reads the OpenAI response shape, so keep that contract.
      return {
        choices: [{ message: { content: result.content } }],
        _meta: { provider: result.provider, model: result.model, ms: result.ms },
      };
    });

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown backend error',
    });
  }
}
