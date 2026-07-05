import type { VercelRequest, VercelResponse } from '@vercel/node';

const MODELS = [
  'meta/llama-3.1-70b-instruct',
  'meta/llama-3.1-8b-instruct',
  'meta/llama-3.3-70b-instruct',
];

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).json({});
  }

  // Allow GET to behave like POST
  if (req.method === 'GET') {
    req.method = 'POST';
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set CORS headers
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    res.setHeader(key, value);
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

    let lastError: Error | null = null;

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
            max_tokens: 4096,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return res.status(200).json(data);
        }

        const errorBody = await response.text();
        lastError = new Error(`NVIDIA API error (${model}): ${response.status} ${response.statusText} - ${errorBody}`);
        console.warn(`Model ${model} failed, trying next...`, lastError.message);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(`Model ${model} failed with exception, trying next...`, lastError.message);
      }
    }

    return res.status(502).json({
      error: lastError?.message || 'All NVIDIA models failed. Please check your API key and try again later.',
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown backend error',
    });
  }
}
