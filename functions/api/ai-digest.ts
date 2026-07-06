interface Env {
  NVIDIA_API_KEY: string;
}

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

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  return onRequestPost(context);
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    const body = await request.json().catch(() => ({})) as { articles?: any[]; date?: string };
    const apiKey = env.NVIDIA_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({
        error: 'NVIDIA API key not configured.'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }

    const articles = body.articles || [];
    const date = body.date || new Date().toISOString().split('T')[0];

    if (articles.length === 0) {
      return new Response(JSON.stringify({
        error: 'No articles provided for digest generation.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }

    // Group articles by sector
    const bySector: Record<string, any[]> = {};
    for (const article of articles) {
      const sector = article.sector || 'General';
      if (!bySector[sector]) bySector[sector] = [];
      bySector[sector].push(article);
    }

    const sectorSummaries = Object.entries(bySector)
      .map(([sector, arts]) => {
        const highlights = arts.slice(0, 3).map((a: any) => `- ${a.title}: ${a.summary}`).join('\n');
        return `### ${sector}\n${highlights}`;
      })
      .join('\n\n');

    const prompt = `You are a senior financial analyst for Nepal's stock market (NEPSE).

Today is ${date}. Below are the hourly news articles collected throughout the day across all sectors:

${sectorSummaries}

Write a comprehensive Daily Market Digest article that:
1. Opens with a strong executive summary of today's market sentiment
2. Covers key developments in EACH sector mentioned above
3. Highlights cross-sector themes and correlations
4. Identifies the 2-3 most important stories of the day
5. Provides forward-looking implications for investors
6. Closes with a "What to Watch Tomorrow" section

Write in a professional, analytical tone suitable for university students and young investors.
Use clear headings, bullet points, and bold text for emphasis.
The article should be 800-1200 words.
Include "Information sourced from AI research across multiple Nepali financial news outlets" at the end.

Return ONLY the article content in HTML format (no markdown code blocks).`;

    for (const model of MODELS) {
      try {
        const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.4,
            max_tokens: 4096,
          })
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || '';
          return new Response(JSON.stringify({
            title: `Daily Market Digest - ${date}`,
            content,
            date,
            sectorsCovered: Object.keys(bySector),
            articleCount: articles.length,
            generatedAt: new Date().toISOString()
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
          });
        }
      } catch {
        // Try next model
      }
    }

    return new Response(JSON.stringify({ error: 'All AI models failed.' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
  }
}
