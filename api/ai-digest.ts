import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from './_lib/cors';
import { verifyUser } from './_lib/auth';
import { checkRateLimit } from './_lib/rateLimit';

const MODELS = [
  'meta/llama-3.1-70b-instruct',
  'meta/llama-3.1-8b-instruct',
  'meta/llama-3.3-70b-instruct',
];

const RATE_LIMIT_MAX = 3;
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

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'NVIDIA API key not configured.',
      });
    }

    const articleList = articles.slice(0, 20).map((a, i) => `${i + 1}. [${(a.sector || '').substring(0, 50)}] ${(a.title || '').substring(0, 100)}: ${(a.summary || '').substring(0, 200)}`).join('\n');

    const prompt = `Generate a comprehensive daily financial digest for Nepal's stock market (NEPSE) for ${date}.

Today's articles:
${articleList || 'No articles available today.'}

Create a digest with:
1. "title": "Daily Market Digest - ${date}"
2. "content": HTML-formatted digest with sections:
   - Key Highlights (3-5 bullet points)
   - Sector Performance Summary
   - Market Outlook
   - Notable Developments

Use HTML tags like <h3>, <p>, <ul>, <li>, <strong> for formatting.
Return ONLY a JSON object: {"title": "...", "content": "..."}`;

    for (const model of MODELS) {
      try {
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
            max_tokens: 2048,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || '{}';

          let parsed: { title: string; content: string };
          try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
          } catch {
            parsed = {
              title: `Daily Market Digest - ${date}`,
              content: `<h3>Market Summary</h3><p>${content}</p>`,
            };
          }

          return res.status(200).json(parsed);
        }
      } catch (err) {
        console.warn(`Model ${model} failed, trying next...`);
      }
    }

    return res.status(502).json({ error: 'All models failed' });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown backend error',
    });
  }
}
