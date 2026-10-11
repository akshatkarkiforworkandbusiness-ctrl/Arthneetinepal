import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
// Static imports of the dependency-free helpers. These prove our own modules
// load correctly. NO `import.meta` anywhere in this file: Vercel compiles these
// functions to CommonJS, where `import.meta` is a parse error that kills the
// whole module before a single line runs (that exact mistake made this endpoint
// return FUNCTION_INVOCATION_FAILED in the previous commit).
import { cacheHas } from './_lib/cache';
import { checkRateLimit } from './_lib/rateLimit';
import { handleCors } from './_lib/cors';

/**
 * Diagnostic endpoint: /api/health
 *
 * Every /api/* handler returned FUNCTION_INVOCATION_FAILED before executing any
 * handler code, i.e. the module graph failed to load. A normal handler cannot
 * report that — the crash kills it first — so this file keeps its own import
 * graph trivially safe and loads everything else behind try/catch, turning a
 * load failure into a reported string.
 *
 * Known upstream bug (reported by the previous revision of this file):
 *   jwks-rsa@4.1.0 (CommonJS) does require('jose'), but jose@6 is ESM-only, so
 *   Node throws ERR_REQUIRE_ESM while loading firebase-admin/auth — reached by
 *   every handler via _lib/auth -> _lib/firebaseAdmin.
 * The jose override pinned in package.json fixes that; stages 5-7 verify it.
 */

const ENV_KEYS = [
  'FIREBASE_SERVICE_ACCOUNT_JSON',
  'NVIDIA_API_KEY',
  'CEREBRAS_API_KEY',
  'GEMINI_API_KEY',
  'GROQ_API_KEY',
  'OPENROUTER_API_KEY',
];

// A CJS require rooted at the deployment root (/var/task in production). Works
// with or without an import.meta, and uses CommonJS extension resolution.
const rootRequire = createRequire(`${process.cwd().replace(/[\\/]+$/, '')}/health-probe.cjs`);

const versionOf = (pkgPath: string) => {
  try {
    return (JSON.parse(readFileSync(pkgPath, 'utf8')) as { version: string }).version;
  } catch {
    return '?';
  }
};

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

  // 2. Our own shared modules, loaded the same way the handlers load them.
  await probe('1-local-_lib-cors', () => Promise.resolve(rootRequire('./api/_lib/cors')));
  await probe('2-local-_lib-rateLimit', () => Promise.resolve(rootRequire('./api/_lib/rateLimit')));
  await probe('3-local-_lib-firebaseAdmin', () => Promise.resolve(rootRequire('./api/_lib/firebaseAdmin')));

  // 3. Load a real handler exactly as the platform does. This is the decisive
  //    test: whatever it throws is precisely why /api/news etc. 500.
  await probe('4-real-handler-news', () => Promise.resolve(rootRequire('./api/news')));

  // 4. The firebase-admin entry points (auth pulls jwks-rsa -> jose).
  await probe('5-firebase-admin-app', () => import('firebase-admin/app'));
  await probe('6-firebase-admin-firestore', () => import('firebase-admin/firestore'));
  await probe('7-firebase-admin-auth', () => import('firebase-admin/auth'));
  await probe('8-jwks-rsa', () => import('jwks-rsa'));

  // 5. Replay jwks-rsa's own require('jose') from jwks-rsa's location — the
  //    exact call that threw ERR_REQUIRE_ESM, so the definitive fix check.
  try {
    const jwksRequire = createRequire(rootRequire.resolve('jwks-rsa/package.json'));
    const resolved = jwksRequire.resolve('jose');
    const version = versionOf(jwksRequire.resolve('jose/package.json'));
    jwksRequire('jose');
    stages['9-require-jose-from-jwks-rsa'] = `ok v${version} (${resolved})`;
  } catch (e) {
    stages['9-require-jose-from-jwks-rsa'] = `FAIL: ${String((e as Error)?.message).slice(0, 300)}`;
  }

  // 6. Informational only: the hoisted jose (ESM-only, kept for shadcn's MCP
  //    SDK). May fail wherever require(esm) is unavailable — that is the
  //    original bug's mechanism — but it is harmless now jwks-rsa has its own
  //    CJS copy, so it never flips the health status.
  let hoisted = 'skipped';
  try {
    const resolved = rootRequire.resolve('jose');
    const version = versionOf(rootRequire.resolve('jose/package.json'));
    rootRequire('jose');
    hoisted = `ok v${version} (${resolved})`;
  } catch (e) {
    hoisted = `FAIL (informational): ${String((e as Error)?.message).slice(0, 200)}`;
  }

  let admin: Record<string, unknown> | string;
  try {
    const mod = rootRequire('./api/_lib/firebaseAdmin') as {
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

  const failed = Object.entries(stages).filter(([, v]) => String(v).startsWith('FAIL'));

  res.status(failed.length ? 503 : 200).json({
    ok: failed.length === 0,
    node: process.version,
    cwd: process.cwd(),
    execArgv: process.execArgv,
    nodeOptions: process.env.NODE_OPTIONS ?? null,
    platform: `${process.platform}-${process.arch}`,
    uptimeMs: Date.now() - started,
    stages,
    joseHoisted: hoisted,
    firebaseAdmin: admin,
    env, // presence only — never echoes secret values
    helpers: {
      cacheHas: typeof cacheHas === 'function',
      checkRateLimit: typeof checkRateLimit === 'function',
      handleCors: typeof handleCors === 'function',
      cacheProbe: cacheHas('health', 60_000),
      rateLimitProbe: checkRateLimit('health', 5, 60_000),
    },
    echo: { hasBody: !!req.body, method: req.method },
  });
}
