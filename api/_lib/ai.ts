/**
 * Multi-provider LLM client shared by the serverless AI routes.
 *
 * Why a chain exists at all: the models this app originally targeted were
 * retired by NVIDIA (HTTP 410 Gone), and the only chat model left enabled on
 * this account answers in well over a minute and frequently times out. Groq
 * answers in under two seconds. Providers are therefore tried fastest-first,
 * and any provider whose API key is not configured is skipped entirely.
 *
 * Every call is bounded by a total wall-clock budget so the route can answer
 * with a useful error instead of being killed by the platform.
 */

export interface AiCompletion {
  content: string;
  provider: string;
  model: string;
  ms: number;
}

interface ProviderSpec {
  readonly provider: string;
  readonly envKey: string;
  readonly url: string;
  /** Tried in order; the first model to answer successfully wins. */
  readonly models: readonly string[];
  /** Per-model timeout. */
  readonly attemptTimeoutMs: number;
}

const CHAIN: readonly ProviderSpec[] = [
  {
    provider: 'groq',
    envKey: 'GROQ_API_KEY',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    models: ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b'],
    attemptTimeoutMs: 10_000,
  },
  {
    provider: 'gemini',
    envKey: 'GEMINI_API_KEY',
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    models: ['gemini-3.1-flash-lite'],
    attemptTimeoutMs: 15_000,
  },
  {
    provider: 'nvidia',
    envKey: 'NVIDIA_API_KEY',
    url: 'https://integrate.api.nvidia.com/v1/chat/completions',
    models: ['deepseek-ai/deepseek-v4.1-flash', 'moonshotai/kimi-k3'],
    attemptTimeoutMs: 25_000,
  },
];

/** Total wall-clock budget for one completion, across every provider. */
const TOTAL_BUDGET_MS = 45_000;

export class AiUnavailableError extends Error {
  readonly attempts: readonly string[];

  constructor(message: string, attempts: readonly string[]) {
    super(message);
    this.name = 'AiUnavailableError';
    this.attempts = attempts;
  }
}

/** Providers that have an API key configured in this deployment. */
export function configuredProviders(): string[] {
  return CHAIN.filter((p) => Boolean(process.env[p.envKey])).map((p) => p.provider);
}

/**
 * Request one completion, walking the provider chain until one answers.
 * @throws {AiUnavailableError} when no configured provider produced output.
 */
export async function complete(
  prompt: string,
  options: {
    maxTokens: number;
    /**
     * Optional shape check applied to the raw completion text. Returning false
     * marks the attempt as failed and lets the chain continue, so a model that
     * answers in prose instead of JSON never reaches the caller or the cache.
     */
    validate?: (content: string) => boolean;
  },
): Promise<AiCompletion> {
  const deadline = Date.now() + TOTAL_BUDGET_MS;
  const attempts: string[] = [];
  const providers = CHAIN.filter((p) => Boolean(process.env[p.envKey]));

  if (providers.length === 0) {
    throw new AiUnavailableError(
      'No AI provider is configured. Set at least GROQ_API_KEY.',
      attempts,
    );
  }

  for (const spec of providers) {
    const apiKey = process.env[spec.envKey] as string;

    for (const model of spec.models) {
      const budget = Math.min(spec.attemptTimeoutMs, deadline - Date.now());
      if (budget <= 0) {
        attempts.push(`${spec.provider}/${model} skipped: time budget exhausted`);
        break;
      }

      const started = Date.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), budget);

      try {
        const response = await fetch(spec.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: options.maxTokens,
          }),
          signal: controller.signal,
        });

        const text = await response.text();

        if (!response.ok) {
          let detail = text.slice(0, 120);
          try {
            const parsed = JSON.parse(text) as { error?: { message?: string }; detail?: string };
            detail = parsed.error?.message || parsed.detail || detail;
          } catch {
            /* keep the raw snippet */
          }
          attempts.push(`${spec.provider}/${model} HTTP ${response.status}: ${String(detail).replace(/\s+/g, ' ').slice(0, 90)}`);
          continue;
        }

        const payload = JSON.parse(text) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const content = payload.choices?.[0]?.message?.content;

        if (typeof content !== 'string' || content.trim().length === 0) {
          attempts.push(`${spec.provider}/${model} returned an empty response`);
          continue;
        }

        if (options.validate && !options.validate(content)) {
          attempts.push(`${spec.provider}/${model} returned content in an unexpected shape`);
          continue;
        }

        return {
          content,
          provider: spec.provider,
          model,
          ms: Date.now() - started,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const timedOut = /abort/i.test(message) ? 'timed out' : message;
        attempts.push(`${spec.provider}/${model} ${timedOut}`);
      } finally {
        clearTimeout(timer);
      }
    }
  }

  const configured = providers.map((p) => p.provider).join(', ');
  throw new AiUnavailableError(
    `All AI providers failed (configured: ${configured}). Please try again later.`,
    attempts,
  );
}

const FENCE_PATTERN = /^\s*```(?:json)?\s*/i;
const CLOSING_FENCE_PATTERN = /\s*```\s*$/i;

function stripFences(content: string): string {
  return content.replace(FENCE_PATTERN, '').replace(CLOSING_FENCE_PATTERN, '').trim();
}

/**
 * Pull a JSON array out of a model response, tolerating code fences and any
 * surrounding prose. Returns null when nothing parseable is found.
 */
export function extractJsonArray<T = unknown>(content: string): T[] | null {
  const cleaned = stripFences(content);
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : null;
  } catch {
    return null;
  }
}

/**
 * Pull a JSON object out of a model response. Returns null when nothing
 * parseable is found.
 */
export function extractJsonObject<T = Record<string, unknown>>(content: string): T | null {
  const cleaned = stripFences(content);
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as T;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}
