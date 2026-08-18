import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from './_lib/cors';
import { verifyUser } from './_lib/auth';
import { cached } from './_lib/cache';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';
const CACHE_TTL_MS = 30_000;
const MAX_TOKENS_CAP = 2048;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const uid = await verifyUser(req);
  if (!uid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY not configured on server' });
  }

  const { messages, temperature = 0.2, max_tokens = 2048 } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const cappedTokens = Math.min(Math.max(1, Number(max_tokens) || 2048), MAX_TOKENS_CAP);

  try {
    const promptHash = JSON.stringify(messages.slice(-4).map((m: any) => (m.content || '').substring(0, 200)));
    const cacheKey = `market-tutor:${uid}:${promptHash}:${temperature}`;

    const data = await cached(cacheKey, CACHE_TTL_MS, async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
          temperature,
          max_tokens: cappedTokens,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({})) as any;
        throw new Error(errData.error?.message || `Groq API failed with status ${response.status}`);
      }

      return response.json();
    });

    return res.status(200).json(data);
  } catch (error) {
    console.error('[market-tutor] Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
