import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from './_lib/cors.js';
import { verifyUser } from './_lib/auth.js';
import { cached } from './_lib/cache.js';
import { checkRateLimit } from './_lib/rateLimit.js';
import { complete, configuredProviders, extractJsonArray } from './_lib/ai.js';

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

    if (configuredProviders().length === 0) {
      return res.status(500).json({
        error: 'No AI provider is configured. Set GROQ_API_KEY in the project environment.',
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
      /* The fallback lives OUTSIDE cached(). It used to be returned from the
       * cached function itself, so a single transient provider failure stored
       * the "temporarily unavailable" placeholder under the same key as real
       * news — and served it as a genuine article for the whole TTL. Throwing
       * means nothing gets cached and the next request retries for real. */
      let article: {
        sector: string; title: string; summary: string;
        date: string; source: string; url: string;
      };

      try {
        article = await cached(cacheKey, CACHE_TTL_MS, async () => {
          const prompt = `You are a financial educator writing study material about Nepal's stock market (NEPSE).
Write 1 short, realistic EXAMPLE scenario about the "${sec}" sector. It illustrates how the sector behaves; it is not live reporting.
Do not invent specific figures, percentages, company profits or exact dates. Use "Today" for the date.

Return ONLY a JSON array, no markdown:
[{"title":"...","summary":"one or two sentences","date":"Today","source":"NEPSE|NRB|Sharesansar","url":"/news"}]`;

          const result = await complete(prompt, {
            maxTokens: 300,
            validate: (content) => (extractJsonArray(content)?.length ?? 0) > 0,
          });

          const parsed =
            extractJsonArray<{ title?: string; summary?: string; date?: string; source?: string; url?: string }>(
              result.content,
            ) ?? [];
          const first = parsed[0] ?? {};

          return {
            sector: sec,
            title: first.title || `Latest News: ${sec}`,
            summary: first.summary || '',
            date: first.date || 'Today',
            source: first.source || 'Arthneeti',
            url: first.url || '/news',
          };
        });
      } catch {
        // Every provider failed. Keep the feed usable instead of failing the
        // whole batch — but do not let this become the cached value.
        article = {
          sector: sec,
          title: `Latest ${sec} Sector Update`,
          summary: 'News data temporarily unavailable. Please check back later.',
          date: 'Today',
          source: 'Arthneeti',
          url: '/news',
        };
      }

      return article;
    });

    const allArticles = await Promise.all(sectorPromises);
    return res.status(200).json({ articles: allArticles });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown backend error',
    });
  }
}
