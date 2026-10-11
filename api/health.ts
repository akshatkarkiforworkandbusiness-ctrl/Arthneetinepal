import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Diagnostic endpoint: /api/health
 *
 * Every /api/* handler returned FUNCTION_INVOCATION_FAILED before executing any
 * handler code, so the module graph fails to load. A normal handler cannot
 * report that — the crash kills it first — so this file is built to survive it:
 *
 *   - it has NO value imports at all (only `import type`, which the compiler
 *     erases), because a top-level import is exactly the thing that kills a
 *     module. Two earlier revisions of this file died that way, so everything
 *     below is loaded with dynamic import() inside try/catch.
 *
 * The output answers, in one request: which files actually exist inside the
 * deployed function, which of our modules can be loaded, whether jwks-rsa can
 * require('jose') (the upstream bug behind every handler 500), and which
 * server-side env vars are set (presence only — never values).
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
  const listings: Record<string, string> = {};
  const safe = <T>(v: T): string => {
    try { return JSON.stringify(v); } catch { return String(v); }
  };

  const probe = async (name: string, load: () => Promise<unknown>) => {
    try {
      await load();
      stages[name] = `ok (${Date.now() - started}ms)`;
    } catch (e) {
      const err = e as { constructor?: { name?: string }; message?: string };
      stages[name] = `FAIL ${err?.constructor?.name}: ${String(err?.message).slice(0, 400)}`;
    }
  };

  // 1. What is actually inside the deployed function bundle?
  let fs: typeof import('node:fs') | null = null;
  await probe('0-node-fs', async () => { fs = await import('node:fs'); });
  if (fs) {
    const list = (dir: string) => {
      try { return (fs as typeof import('node:fs')).readdirSync(dir).sort().join(', '); }
      catch (e) { return `THROWS: ${String((e as Error).message).slice(0, 120)}`; }
    };
    listings['/var/task'] = list('/var/task');
    listings['/var/task/api'] = list('/var/task/api');
    listings['/var/task/api/_lib'] = list('/var/task/api/_lib');
    listings['/var/task/api/leaderboard'] = list('/var/task/api/leaderboard');
    listings['/var/task/api/trading'] = list('/var/task/api/trading');
    listings['/var/task/node_modules (j*)'] = list('/var/task/node_modules')
      .split(', ').filter((f) => /^(jose|jwks-rsa)/.test(f)).join(', ') || '(none)';
    listings['/var/task/node_modules/jwks-rsa/node_modules'] = list('/var/task/node_modules/jwks-rsa/node_modules');
  }

  // 2. Our own modules — both extensionless and with an explicit .js, so we can
  //    tell "file is missing" apart from "ESM extension resolution failed".
  // 2. Our own modules — extensionless AND with an explicit .js. The
  //    extensionless pair is deliberate: it is the resolution mode that fails
  //    in production (Node's ESM loader never resolves extensionless
  //    specifiers, and Vercel emits ESM), which is why every handler 500'd
  //    even though the files were present. Both are excluded from the health
  //    verdict below; they measure the platform, not our code.
  await probe('1-local-cors-extless', () => import('./_lib/cors'));
  await probe('2-local-cors-dot-js', () => import('./_lib/cors.js'));
  await probe('3-local-rateLimit-dot-js', () => import('./_lib/rateLimit.js'));
  await probe('4-local-firebaseAdmin-dot-js', () => import('./_lib/firebaseAdmin.js'));

  // 3. A real handler, loaded the way the platform loads it. Whatever this
  //    reports is precisely why /api/news etc. 500.
  await probe('5-real-handler-news-extless', () => import('./news'));
  await probe('6-real-handler-news-dot-js', () => import('./news.js'));

  // 4. firebase-admin entry points (auth pulls jwks-rsa -> jose).
  await probe('7-firebase-admin-app', () => import('firebase-admin/app'));
  await probe('8-firebase-admin-firestore', () => import('firebase-admin/firestore'));
  await probe('9-firebase-admin-auth', () => import('firebase-admin/auth'));

  // 5. Replay jwks-rsa's own require('jose') from jwks-rsa's location: the exact
  //    call that threw ERR_REQUIRE_ESM, so the definitive check of the override.
  const mod = await import('node:module');
  const { createRequire } = mod;
  const rootRequire = createRequire(`${process.cwd().replace(/[\\/]+$/, '')}/health-probe.cjs`);
  const versionOf = (p: string) => {
    try { return (JSON.parse((fs as typeof import('node:fs')).readFileSync(p, 'utf8')) as { version: string }).version; }
    catch { return '?'; }
  };
  try {
    const jwksRequire = createRequire(rootRequire.resolve('jwks-rsa/package.json'));
    const resolved = jwksRequire.resolve('jose');
    const version = versionOf(jwksRequire.resolve('jose/package.json'));
    jwksRequire('jose');
    stages['10-require-jose-from-jwks-rsa'] = `ok v${version} (${resolved})`;
  } catch (e) {
    stages['10-require-jose-from-jwks-rsa'] = `FAIL: ${String((e as Error)?.message).slice(0, 300)}`;
  }

  // 6. Informational: the hoisted jose (ESM-only, kept for shadcn's MCP SDK).
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
    const m = (await import('./_lib/firebaseAdmin.js')) as {
      isFirebaseAdminReady(): boolean;
      getFirebaseAdminError(): string | null;
    };
    admin = { ready: m.isFirebaseAdminReady(), error: m.getFirebaseAdminError() };
  } catch (e) {
    admin = `threw: ${String((e as Error)?.message).slice(0, 300)}`;
  }

  const env: Record<string, 'set' | 'empty' | 'missing'> = {};
  for (const k of ENV_KEYS) {
    const v = process.env[k];
    env[k] = v === undefined ? 'missing' : v.length === 0 ? 'empty' : 'set';
  }

  // The extensionless stages and the informational hoisted-jose probe never
  // flip the verdict: they measure platform resolution rules, not our code.
  const informational = new Set(['1-local-cors-extless', '5-real-handler-news-extless']);
  const failed = Object.entries(stages).filter(
    ([name, v]) => String(v).startsWith('FAIL') && !informational.has(name)
  );

  // Production serves a *redacted* report: it keeps what monitoring actually
  // needs — is every module loadable, is the admin SDK configured — without
  // publishing the runtime's flags, the bundle layout or absolute paths. The
  // full detail (which is what diagnosed both outages) is only served outside
  // production, where it can't hand an attacker a fingerprint of the runtime.
  const isProd = process.env.VERCEL_ENV === 'production' || process.env.VERCEL === '1';
  const scrub = (v: unknown): unknown => {
    if (typeof v !== 'string') return v;
    return v.replace(/(?:\/var\/task|[A-Za-z]:\\)[^\s)'"`]*/g, (m) => m.split(/[\\/]/).pop() || m);
  };
  const scrubStages = Object.fromEntries(
    Object.entries(stages).map(([k, v]) => [k, scrub(v)])
  );

  const body: Record<string, unknown> = isProd
    ? {
        ok: failed.length === 0,
        node: process.version.replace(/\.\d+$/, '.x'),
        platform: `${process.platform}-${process.arch}`,
        uptimeMs: Date.now() - started,
        stages: scrubStages,
        joseHoisted: scrub(hoisted),
        firebaseAdmin: admin,
        env,
      }
    : {
        ok: failed.length === 0,
        node: process.version,
        cwd: process.cwd(),
        execArgv: process.execArgv,
        nodeOptions: process.env.NODE_OPTIONS ?? null,
        platform: `${process.platform}-${process.arch}`,
        uptimeMs: Date.now() - started,
        listings,
        stages,
        joseHoisted: hoisted,
        firebaseAdmin: admin,
        env,
        echo: { hasBody: !!req.body, method: req.method, safe: safe(process.versions) },
      };

  res.status(failed.length ? 503 : 200).json(body);
}
