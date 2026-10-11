import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
// Static imports of the dependency-free helpers. These deliberately prove our
// own modules bundle correctly — relative *dynamic* imports are not traced by
// Vercel's builder, so they cannot be used as a probe (they 404 at runtime).
// None of these pull in firebase-admin, so importing them cannot crash us the
// way the handlers can.
import { cacheHas } from './_lib/cache';
import { checkRateLimit } from './_lib/rateLimit';
import { handleCors } from './_lib/cors';

/**
 * Diagnostic endpoint: /api/health
 *
 * All /api/* handlers returned FUNCTION_INVOCATION_FAILED before executing a
 * single line of handler code, i.e. the module graph itself failed to load. A
 * normal handler cannot report that — the crash kills it first — so this file
 * has no value imports of the suspect packages and loads everything else with
 * dynamic import() inside try/catch, turning a load failure into a string.
 *
 * Root cause found by the previous revision of this file:
 *   jwks-rsa@4.1.0 (CommonJS) does require('jose'), but jose@6 is ESM-only, so
 *   Node threw ERR_REQUIRE_ESM while loading firebase-admin/auth — which every
 *   handler reaches, killing all five endpoints.
 *
 * This revision verifies the fix by replaying that exact require() call.
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

  const probe = async (name: string, load: () => Promise<unknown>) => {
    try {
      await load();
      stages[name] = `ok (${Date.now() - started}ms)`;
    } catch (e) {
      const err = e as { constructor?: { name?: string }; message?: string };
      stages[name] = `FAIL ${err?.constructor?.name}: ${String(err?.message).slice(0, 400)}`;
    }
  };

  // 1. Baseline: if this fails the runtime itself is broken.
  await probe('0-node-builtin', () => import('node:crypto'));

  // 2. The firebase-admin entry points (the auth one pulls jwks-rsa -> jose).
  await probe('1-firebase-admin-app', () => import('firebase-admin/app'));
  await probe('2-firebase-admin-firestore', () => import('firebase-admin/firestore'));
  await probe('3-firebase-admin-auth', () => import('firebase-admin/auth')); // <-- root-cause stage
  await probe('4-jwks-rsa', () => import('jwks-rsa'));

  // 3. Replay jwks-rsa's own require('jose') from jwks-rsa's location — this is
  //    the exact call that used to throw, so it is the definitive fix check.
  const rootRequire = createRequire(import.meta.url);
  try {
    const req2 = createRequire(rootRequire.resolve('jwks-rsa/package.json'));
    const resolved = req2.resolve('jose');
    const version = JSON.parse(readFileSync(req2.resolve('jose/package.json'), 'utf8')).version as string;
    req2('jose');
    stages['5-require-jose-from-jwks-rsa'] = `ok -> v${version} (${resolved})`;
  } catch (e) {
    stages['5-require-jose-from-jwks-rsa'] = `FAIL: ${String((e as Error)?.message).slice(0, 300)}`;
  }

  // 4. Same test from our own location (reports the hoisted copy, if any).
  try {
    const req3 = createRequire(import.meta.url);
    const resolved = req3.resolve('jose');
    const version = JSON.parse(readFileSync(req3.resolve('jose/package.json'), 'utf8')).version as string;
    req3('jose');
    stages['6-require-jose-hoisted'] = `ok -> v${version} (${resolved})`;
  } catch (e) {
    stages['6-require-jose-hoisted'] = `FAIL: ${String((e as Error)?.message).slice(0, 300)}`;
  }

  // 5. Our own statically-imported helpers really did load and are callable.
  stages['7-local-helpers'] =
    `cacheHas=${typeof cacheHas === 'function'} ` +
    `checkRateLimit=${typeof checkRateLimit === 'function'} ` +
    `handleCors=${typeof handleCors === 'function'} ` +
    `probeCache=${cacheHas('health', 60_000)} ` +
    `probeRateLimit=${checkRateLimit('health', 5, 60_000)}`;

  let admin: Record<string, unknown> | string;
  try {
    const mod = (await import('./_lib/firebaseAdmin')) as {
      isFirebaseAdminReady(): boolean;
      getFirebaseAdminError(): string | null;
    };
    admin = { ready: mod.isFirebaseAdminReady(), error: mod.getFirebaseAdminError() };
  } catch (e) {
    admin = `threw: ${String((e as Error)?.message).slice(0, 300)}`;
  }

  const env: Record<string, 'set' | 'empty' | 'missing'> = {};
  for (const k of ENV_KEYS) {
    const v = process.env[k];
    env[k] = v === undefined ? 'missing' : v.length === 0 ? 'empty' : 'set';
  }

  const failed = Object.entries(stages).filter(
    ([name, v]) => String(v).startsWith('FAIL') && name !== '6-require-jose-hoisted'
  );
  // Stage 6 is informational only: it probes the *hoisted* jose (ESM-only, kept
  // for shadcn's MCP SDK). If require(esm) is disabled in the runtime it will
  // fail — which is the original bug's mechanism — but it is harmless now that
  // jwks-rsa carries its own CJS copy. So it never flips the health status.

  res.status(failed.length ? 503 : 200).json({
    ok: failed.length === 0,
    node: process.version,
    execArgv: process.execArgv,
    nodeOptions: process.env.NODE_OPTIONS ?? null,
    platform: `${process.platform}-${process.arch}`,
    uptimeMs: Date.now() - started,
    stages,
    firebaseAdmin: admin,
    env, // presence only — never echoes secret values
    echo: { hasBody: !!req.body, method: req.method },
  });
}
