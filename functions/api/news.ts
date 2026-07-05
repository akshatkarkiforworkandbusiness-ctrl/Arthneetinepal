interface Env {
  NVIDIA_API_KEY: string;
}

const MODELS = [
  'meta/llama-3.1-70b-instruct',
  'meta/llama-3.1-8b-instruct',
  'meta/llama-3.3-70b-instruct',
];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet({ request, env }: { request: Request, env: Env }) {
  return onRequestPost({ request, env });
}

export async function onRequestPost({ request, env }: { request: Request, env: Env }) {
  try {
    const body = await request.json() as { sector: string };
    const sector = body.sector;
    
    if (!sector) {
      return new Response(JSON.stringify({ error: "Sector is required" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }

    const apiKey = env.NVIDIA_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: "NVIDIA API key not configured. Please set NVIDIA_API_KEY in Cloudflare Pages > Settings > Environment variables." 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
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
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 4096,
          })
        });

        if (response.ok) {
          const data = await response.json();
          return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
          });
        }

        const errorBody = await response.text();
        lastError = new Error(`NVIDIA API error (${model}): ${response.status} ${response.statusText} - ${errorBody}`);
        console.warn(`Model ${model} failed, trying next...`, lastError.message);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(`Model ${model} failed with exception, trying next...`, lastError.message);
      }
    }

    return new Response(JSON.stringify({ 
      error: lastError?.message || 'All NVIDIA models failed. Please check your API key and try again later.' 
    }), { 
      status: 502,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown backend error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
  }
}
