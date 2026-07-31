import type { VercelRequest, VercelResponse } from '@vercel/node';

const CEREBRAS_API_URL = 'https://api.cerebras.ai/v1/chat/completions';
const MODEL = 'llama-3.3-70b';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(204).json({});
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    res.setHeader(key, value);
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
      return res.status(response.status).json({
        error: errData.error?.message || `Cerebras API failed with status ${response.status}`,
      });
    }

    const data = await response.json() as any;
    return res.status(200).json(data);
  } catch (error) {
    console.error('[ai-tutor] Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
