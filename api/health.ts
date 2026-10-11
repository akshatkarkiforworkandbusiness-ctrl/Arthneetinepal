import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Diagnostic endpoint: /api/health
 *
 * Every other /api/* handler crashed with FUNCTION_INVOCATION_FAILED before
 * executing a single line of handler code, which means the failure happens
 * while the module graph is being loaded. A normal handler cannot report that
 * (the crash kills it first), so this file deliberately has NO value imports at
 * the top level — only `import type`, which the compiler erases. Everything
 * else is loaded with a dynamic import inside try/catch, so a module that
 * fails to link is reported as a string instead of taking the process down.
 *
 * It answers three questions in one request:
 *   1. Which Node runtime is Vercel actually using?
 *   2. Which specific module fails to load (and with what error)?
 *   3. Which server-side env vars are set? (names only — never values)
 */

const ENV_KEYS = [
  'FIREBASE_SERVICE_ACCOUNT_JSON',
  'NVIDIA_API_KEY',
  'CEREBRAS_API_KEY',
  'GEMINI_API_KEY',
  'GROQ_API_KEY',
  'OPENROUTER_API_KEY',
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  const started = Date.now();
  const stages: Record<string, string> = {};

  const probe = async (name: string, spec: string, load: () => Promise<unknown>) => {
    try {
      await load();
      stages[name] = `ok (${Date.now() - started}ms)`;
    } catch (e) {
      const err = e as { constructor?: { name?: string }; message?: string };
      stages[name] = `FAIL ${err?.constructor?.name}: ${String(err?.message).slice(0, 400)}`;
    }
  };

  // 1. Baseline: if even this fails, the runtime itself is broken.
  await probe('0-node-builtin', 'node:crypto', () => import('node:crypto'));

  // 2. The firebase-admin packages — the prime suspect (engines: ">=22").
  await probe('1-firebase-admin-app', 'firebase-admin/app', () => import('firebase-admin/app'));
  await probe('2-firebase-admin-firestore', 'firebase-admin/firestore', () => import('firebase-admin/firestore'));
  await probe('3-firebase-admin-auth', 'firebase-admin/auth', () => import('firebase-admin/auth'));

  // 3. Our own shared modules, in the order the real handlers load them.
  await probe('4-cors', './_lib/cors', () => import('./_lib/cors'));
  await probe('5-rateLimit', './_lib/rateLimit', () => import('./_lib/rateLimit'));
  await probe('6-cache', './_lib/cache', () => import('./_lib/cache'));
  await probe('7-firebaseAdmin', './_lib/firebaseAdmin', () => import('./_lib/firebaseAdmin'));
  await probe('8-auth', './_lib/auth', () => import('./_lib/auth'));

  // 4. A full real handler module (news.ts pulls cors + auth + cache + rateLimit).
  await probe('9-handler-news', './news', () => import('./news'));

  // 5. If firebaseAdmin loaded, report whether it initialised — this is what
  //    distinguishes "module won't load" from "env var missing".
  let admin: Record<string, unknown> | string = 'skipped (module did not load)';
  try {
    const mod = (await import('./_lib/firebaseAdmin')) as {
      isFirebaseAdminReady(): boolean;
      getFirebaseAdminError(): string | null;
    };
    admin = {
      ready: mod.isFirebaseAdminReady(),
      error: mod.getFirebaseAdminError(),
    };
  } catch (e) {
    admin = `threw: ${String((e as Error)?.message).slice(0, 300)}`;
  }

  const env: Record<string, 'set' | 'empty' | 'missing'> = {};
  for (const k of ENV_KEYS) {
    const v = process.env[k];
    env[k] = v === undefined ? 'missing' : v.length === 0 ? 'empty' : 'set';
  }

  const failed = Object.entries(stages).filter(([, v]) => v.startsWith('FAIL'));

  res.status(failed.length ? 503 : 200).json({
    ok: failed.length === 0,
    node: process.version,
    platform: `${process.platform}-${process.arch}`,
    uptimeMs: Date.now() - started,
    stages,
    firebaseAdmin: admin,
    env,
    // never echoes secret values — presence only
    echo: { hasBody: !!req.body, method: req.method },
  });
}
