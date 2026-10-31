#!/usr/bin/env node
/* Prerender public routes into static HTML.
 *
 * Why: this app is a client-rendered SPA. Social scrapers (WhatsApp/Facebook —
 * how links actually spread in Nepal) never run JavaScript, so without this
 * script every shared link shows one generic preview. Running the real app in
 * headless Chrome and saving the DOM gives crawlers the true title, meta
 * description, og: tags and body text per route (the tags themselves are set
 * by src/lib/seo.ts / RouteSeo).
 *
 * Output layout (Vercel filesystem beats rewrites, so these win over the
 * SPA catch-all):
 *   dist/index.html    ← prerendered homepage (overwrites the build shell)
 *   dist/shell.html    ← pristine copy of the build shell, kept as the
 *                        catch-all rewrite target so unknown routes still
 *                        boot the SPA instead of flashing homepage content
 *   dist/<route>/index.html   ← one file per public route / lesson / post
 *
 * Resilience rules (this runs inside `npm run build`, i.e. on every deploy):
 *   1. shell.html is copied FIRST, before any browser work — a Chrome failure
 *      must never leave the catch-all pointing at a missing file.
 *   2. Any individual page failure is logged and skipped.
 *   3. Total failure exits 0 with a loud warning: a deploy without prerendered
 *      pages is the status quo, a failed deploy is a outage.
 *
 * Skip list: auth-gated routes (profile, bookmarks, notifications, trade,
 * certificate, admin-setup) render sign-in walls for anonymous visitors and
 * are excluded from the sitemap too.
 */

import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.env.PRERENDER_PORT || 4173);
const ORIGIN = `http://localhost:${PORT}`;

/* Hard cap on the whole run — a wedged page must not hang the deploy. */
const OVERALL_TIMEOUT_MS = 12 * 60 * 1000;
const PAGE_TIMEOUT_MS = 45 * 1000;
const CONCURRENCY = 4;

const STATIC_ROUTES = [
  '/discover',
  '/community',
  '/news-feed',
  '/events',
  '/about-us',
  '/learn',
  '/trade-game',
  '/leaderboard',
  '/methodology',
  '/privacy-policy',
  '/terms-of-service',
];

const log = (msg) => console.log(`[prerender] ${msg}`);
const warn = (msg) => console.warn(`[prerender] WARNING: ${msg}`);

/* Load .env for local runs. On Vercel the build environment injects vars
 * into process.env directly, so this is a no-op there — but locally only
 * Vite reads .env, and this script needs the Firebase keys to list posts. */
async function loadEnv() {
  try {
    const raw = await readFile(path.join(ROOT, '.env'), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const [, key, value] = match;
      if (process.env[key] !== undefined) continue; // real env wins
      process.env[key] = value.replace(/^['"]|['"]$/g, '');
    }
  } catch {
    /* no .env — fine */
  }
}

/* Lesson slugs straight from the source of truth. lessonsData.ts is TS, so we
 * parse it rather than import (keeps this script dependency-free). The pattern
 * matches top-level lesson ids only — quiz/FAQ objects carry no id field. */
async function lessonIds() {
  const src = await readFile(path.join(ROOT, 'src', 'data', 'lessonsData.ts'), 'utf8');
  const ids = [...src.matchAll(/^\s{4}id: '([a-z0-9-]+)',\s*$/gm)].map((m) => m[1]);
  const unique = [...new Set(ids)];
  if (unique.length < 20) {
    warn(`only parsed ${unique.length} lesson ids — lesson pages will be partially prerendered`);
  }
  return unique;
}

/* Recent post ids via Firestore's public REST API (rules allow unauthenticated
 * reads). Same exclusions as api/sitemap.ts. Returns [] on any failure — post
 * pages simply stay dynamic. */
async function recentPostIds() {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  const apiKey = process.env.VITE_FIREBASE_API_KEY;
  if (!projectId || !apiKey) {
    warn('VITE_FIREBASE_PROJECT_ID / VITE_FIREBASE_API_KEY not set — skipping post prerender');
    return [];
  }
  const url =
    `https://firestore.googleapis.com/v1/projects/${projectId}` +
    `/databases/(default)/documents/posts` +
    `?pageSize=60&orderBy=createdAt%20DESC&key=${apiKey}` +
    `&mask.fieldPaths=hourlyPost&mask.fieldPaths=isDailyNews`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Firestore list failed: ${res.status}`);
  const data = await res.json();
  return (data.documents ?? [])
    .filter((doc) => {
      const f = doc.fields ?? {};
      return f.hourlyPost?.booleanValue !== true && f.isDailyNews?.booleanValue !== true;
    })
    .map((doc) => doc.name.split('/').pop())
    .filter(Boolean)
    .slice(0, 40);
}

/* Tiny static server over dist with SPA fallback — same precedence as Vercel:
 * real files win, everything else falls back to the shell. */
function serveDist() {
  const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.mjs': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain',
    '.woff2': 'font/woff2',
    '.pdf': 'application/pdf',
  };

  const server = createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, ORIGIN).pathname);
      const candidates = [
        path.join(DIST, pathname),
        path.join(DIST, pathname, 'index.html'),
        pathname.endsWith('/') ? null : path.join(DIST, `${pathname}.html`),
      ].filter(Boolean);

      let body = null;
      let type = 'text/html; charset=utf-8';
      for (const candidate of candidates) {
        // Path-traversal guard.
        if (!candidate.startsWith(DIST)) continue;
        try {
          await stat(candidate);
          body = await readFile(candidate);
          type = MIME[path.extname(candidate)] ?? 'application/octet-stream';
          break;
        } catch {
          /* try next */
        }
      }
      if (!body) {
        body = await readFile(path.join(DIST, 'shell.html'));
      }
      res.writeHead(200, { 'Content-Type': type });
      res.end(body);
    } catch (err) {
      res.writeHead(500);
      res.end(String(err));
    }
  });

  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

async function prerender() {
  if (!existsSync(path.join(DIST, 'index.html'))) {
    warn('dist/index.html missing — run `vite build` first. Nothing to do.');
    return;
  }

  /* Step 1 (must not be skippable): preserve the pristine SPA shell. The
   * vercel.json catch-all rewrites to /shell.html, so unknown routes depend
   * on this file existing even if everything below fails.
   *
   * Only a FRESH build's index.html is pristine (empty #root). A standalone
   * re-run of this script finds dist/index.html already containing last
   * run's prerendered homepage — copying that would poison the fallback and
   * flash homepage content on every unknown route. So: refresh shell.html
   * only when index.html is pristine; otherwise keep an existing good shell. */
  const indexPath = path.join(DIST, 'index.html');
  const shellPath = path.join(DIST, 'shell.html');
  const indexHtml = await readFile(indexPath, 'utf8');
  const shellExists = existsSync(shellPath);
  const shellHtml = shellExists ? await readFile(shellPath, 'utf8') : '';
  const pristine = (html) => /<div id="root"><\/div>/.test(html);

  if (pristine(indexHtml)) {
    await writeFile(shellPath, indexHtml, 'utf8');
  } else if (!pristine(shellHtml)) {
    warn('index.html is prerendered and shell.html is missing or poisoned.');
    warn('run `vite build` to regenerate a clean shell — keeping existing shell.html for now.');
    if (!shellExists) {
      // No fallback at all would break every unknown route; use the build's
      // index.html as a last resort rather than 404ing.
      await writeFile(shellPath, indexHtml, 'utf8');
    }
  }

  const [puppeteer, lessons, posts] = await Promise.all([
    import('puppeteer'),
    lessonIds(),
    recentPostIds().catch((err) => {
      warn(`post listing failed (${err.message}) — continuing without post pages`);
      return [];
    }),
  ]);

  const routes = [
    '/', // homepage overwrites dist/index.html; shell.html holds the fallback
    ...STATIC_ROUTES,
    ...lessons.map((id) => `/learn/${id}`),
    ...posts.map((id) => `/post/${id}`),
  ];

  const server = await serveDist();
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--hide-scrollbars',
        '--mute-audio',
      ],
    });
  } catch (err) {
    server.close();
    warn(`could not launch Chrome (${err.message}).`);
    warn('Deploy continues WITHOUT prerendered pages. SPA behaviour is unchanged.');
    return;
  }

  log(`rendering ${routes.length} routes (${lessons.length} lessons, ${posts.length} posts)`);

  let ok = 0;
  let failed = 0;

  const renderPage = async (page, route) => {
    const url = `${ORIGIN}${route}`;
    try {
      // Skip the cinematic intro overlay — it's per-user state, not content.
      await page.evaluateOnNewDocument(() => {
        try {
          localStorage.setItem('arthneeti-intro-seen', 'true');
        } catch {
          /* private mode etc. */
        }
      });

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT_MS });

      /* Wait for #main-content to hold real text. That div only exists after
       * React mounts, and it only has text after the page body renders — by
       * which point RouteSeo/usePageSeo have already written the <head> tags
       * (effects run before the settle delay below). Note: the homepage keeps
       * the shell's exact <title>, so a title-based check would false-negative
       * there; #main-content is the reliable signal on every route.
       *
       * Some pages (discover, community, news-feed) sit in a skeleton state
       * until an external feed or Firestore answers. If that data never
       * arrives at build time we still capture: the <head> meta is already
       * correct, and a skeleton body paints identically to the SPA shell for
       * users. Capture-with-meta beats no-capture. */
      await page
        .waitForFunction(
          () => (document.querySelector('#main-content')?.textContent || '').trim().length > 100,
          { timeout: 12_000 }
        )
        .catch(() => {
          /* skeleton capture — meta tags are still correct */
        });

      /* Scroll through the page so whileInView sections finish their entrance
       * animation. Without this, below-the-fold content is serialized at
       * opacity: 0 and crawlers see an (almost) empty body. */
      await page.evaluate(async () => {
        const step = Math.max(window.innerHeight * 0.8, 400);
        for (let y = 0; y < document.body.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 60));
        }
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 120));
      });

      // Brief settle so Firestore-fed post bodies land in the snapshot.
      await new Promise((r) => setTimeout(r, 400));

      const html = await page.content();
      const outFile =
        route === '/'
          ? path.join(DIST, 'index.html')
          : path.join(DIST, ...route.split('/').filter(Boolean), 'index.html');
      await mkdir(path.dirname(outFile), { recursive: true });
      await writeFile(outFile, html, 'utf8');
      ok++;
      log(`  ✓ ${route} (${(html.length / 1024).toFixed(0)} kB)`);
    } catch (err) {
      failed++;
      warn(`  ✗ ${route}: ${err.message.split('\n')[0]}`);
    }
  };

  try {
    /* Small pool: one shared browser, N tabs. Keeps the run ~4x faster than
     * serial without hammering Firestore. */
    const queue = [...routes];
    const workers = Array.from({ length: CONCURRENCY }, async () => {
      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(PAGE_TIMEOUT_MS);
      // Desktop UA: some embeds behave differently for headless mobile UAs.
      await page.setUserAgent(
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
      );
      try {
        while (queue.length) {
          const route = queue.shift();
          if (!route) break;
          await renderPage(page, route);
        }
      } finally {
        await page.close().catch(() => {});
      }
    });
    await Promise.all(workers);
  } finally {
    await browser.close().catch(() => {});
    server.close();
  }

  log(`done: ${ok} rendered, ${failed} failed, shell.html preserved`);
}

/* Never fail the build over prerendering. */
const hardStop = setTimeout(() => {
  warn(`timed out after ${OVERALL_TIMEOUT_MS / 60000}min — aborting (shell.html already saved)`);
  process.exit(0);
}, OVERALL_TIMEOUT_MS);
hardStop.unref();

try {
  await loadEnv();
  await prerender();
} catch (err) {
  warn(`fatal: ${err?.message ?? err}`);
  warn('Deploy continues WITHOUT prerendered pages.');
}
process.exit(0);
