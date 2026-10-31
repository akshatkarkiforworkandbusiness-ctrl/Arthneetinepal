import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from './_lib/cors.js';
import { verifyUser } from './_lib/auth.js';
import { checkRateLimit } from './_lib/rateLimit.js';
import { complete, configuredProviders, extractJsonObject } from './_lib/ai.js';

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60_000;

/** Plain-text fields: escape HTML so nothing can break out of its context. */
function sanitizeDigestText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .slice(0, 300);
}

/** Tags the prompt asks the model for. Everything else is dropped. */
const ALLOWED_DIGEST_TAGS = new Set([
  'h3', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'br', 'span',
]);

function sanitizeDigestHtml(html: string): string {
  return html
    // Kill script/style/iframe wholesale, contents included.
    .replace(/<(script|style|iframe|object|embed|link|meta)[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(script|style|iframe|object|embed|link|meta)[^>]*\/?>/gi, '')
    // Event handlers and JS-bearing URL schemes.
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src|action)\s*=\s*(["'])?\s*javascript:[^"'>\s]*\2?/gi, '')
    // Any tag outside the allowlist — drop the tag, keep the inner text.
    .replace(/<\/?([a-z0-9]+)((?:\s+[^<>]*?)?)\s*\/?>/gi, (match, tag: string) =>
      ALLOWED_DIGEST_TAGS.has(tag.toLowerCase()) ? match : ''
    )
    .slice(0, 20_000);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const uid = await verifyUser(req);
  if (!uid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const rateKey = `ai-digest:${uid}`;
  if (!checkRateLimit(rateKey, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
  }

  try {
    const { articles, date } = (req.body || {}) as {
      articles: Array<{ title: string; summary: string; sector: string; source: string }>;
      date: string;
    };

    if (!Array.isArray(articles)) {
      return res.status(400).json({ error: 'articles must be an array' });
    }

    /* `date` was interpolated straight into the prompt in two places and into
     * the returned title. A crafted value could steer the model's output
     * (prompt injection) and its text ends up rendered as HTML in the digest.
     * Only accept the exact shape the client actually sends. */
    const digestDate =
      typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
        ? date
        : new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Kathmandu',
            year: 'numeric', month: '2-digit', day: '2-digit',
          }).format(new Date());

    if (configuredProviders().length === 0) {
      return res.status(500).json({
        error: 'No AI provider is configured. Set GROQ_API_KEY in the project environment.',
      });
    }

    const articleList = articles.slice(0, 20).map((a, i) => `${i + 1}. [${String((a?.sector || '')).substring(0, 50)}] ${String((a?.title || '')).substring(0, 100)}: ${String((a?.summary || '')).substring(0, 200)}`).join('\n');

    const prompt = `Generate a comprehensive daily financial digest for Nepal's stock market (NEPSE) for ${digestDate}.

Today's articles:
${articleList || 'No articles available today.'}

Create a digest with:
1. "title": "Daily Market Digest - ${digestDate}"
2. "content": HTML-formatted digest with sections:
   - Key Highlights (3-5 bullet points)
   - Sector Performance Summary
   - Market Outlook
   - Notable Developments

Use HTML tags like <h3>, <p>, <ul>, <li>, <strong> for formatting.
Return ONLY a JSON object: {"title": "...", "content": "..."}`;

    let parsed: { title?: string; content?: string } | null = null;

    try {
      const result = await complete(prompt, {
        maxTokens: 2048,
        validate: (content) => extractJsonObject(content) !== null,
      });
      parsed = extractJsonObject<{ title?: string; content?: string }>(result.content);
    } catch {
      parsed = null;
    }

    if (parsed?.title && parsed.content) {
      /* The client renders this with dangerouslySetInnerHTML, and the model is
       * primed with attacker-influenceable article text. Strip anything that
       * isn't one of the formatting tags the prompt asks for, so a crafted
       * article title can't smuggle <script> or event handlers into a stored,
       * widely-rendered document. */
      return res.status(200).json({
        title: sanitizeDigestText(parsed.title),
        content: sanitizeDigestHtml(parsed.content),
      });
    }

    return res.status(502).json({ error: 'All AI providers failed. Please try again later.' });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown backend error',
    });
  }
}
