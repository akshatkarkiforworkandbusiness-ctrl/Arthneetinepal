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
  if (req.method === 'OPTIONS') {
    return res.status(204).json({});
  }

  if (req.method === 'GET') {
    req.method = 'POST';
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    res.setHeader(key, value);
  }

  try {
    const { articles, date } = req.body as {
      articles: Array<{ title: string; summary: string; sector: string; source: string }>;
      date: string;
    };

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'NVIDIA API key not configured.',
      });
    }

    const articleList = articles.map((a, i) => `${i + 1}. [${a.sector}] ${a.title}: ${a.summary?.substring(0, 200)}`).join('\n');

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
        });

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
