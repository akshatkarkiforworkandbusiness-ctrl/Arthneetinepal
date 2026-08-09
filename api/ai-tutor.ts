import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from './_lib/cors';
import { cached } from './_lib/cache';

const CEREBRAS_API_URL = 'https://api.cerebras.ai/v1/chat/completions';
const MODEL = 'llama-3.3-70b';

const CACHE_TTL_MS = 60_000; // 1 minute cache for identical prompts

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'CEREBRAS_API_KEY not configured on server' });
  }

  const { messages, temperature = 0.2, max_tokens = 2048 } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  try {
    // Build a cache key from the prompt content (skip streaming requests)
    const promptHash = JSON.stringify(messages.map((m: any) => m.content?.substring(0, 200)));
    const cacheKey = `tutor:${promptHash}:${temperature}:${max_tokens}`;

    const data = await cached(cacheKey, CACHE_TTL_MS, async () => {
      const response = await fetch(CEREBRAS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
          temperature,
          max_tokens,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({})) as any;
        throw new Error(errData.error?.message || `Cerebras API failed with status ${response.status}`);
      }

      return response.json();
    });

    return res.status(200).json(data);
  } catch (error) {
    console.error('[ai-tutor] Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
