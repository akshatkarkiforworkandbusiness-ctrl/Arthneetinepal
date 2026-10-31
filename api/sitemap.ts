import type { VercelRequest, VercelResponse } from '@vercel/node';
import { LESSONS } from '../src/data/lessonsData';

/* Dynamic sitemap — replaces the frozen public/sitemap.xml (frozen at
 * 2026-10-11, missing every lesson and post).
 *
 * Serves three groups:
 *   1. Static routes (hand-tuned priorities/changefreq).
 *   2. All 27 curriculum lessons, imported straight from lessonsData so a
 *      new lesson appears in the sitemap the day it ships — no second list
 *      to forget.
 *   3. Recent community/research posts, fetched live from Firestore's
 *      public REST API (firestore.rules allows unauthenticated reads on
 *      posts). Hourly AI-scenario posts are excluded — thin, near-duplicate
 *      content dilutes a sitemap and can hurt crawling.
 *
 * Failure posture: if Firestore is unreachable or the API key is missing,
 * we still return the static + lesson URLs. A partial sitemap that builds
 * beats a 500 that Search Console flags.
 *
 * Wired via vercel.json: { "source": "/sitemap.xml", "destination": "/api/sitemap" }.
 * public/sitemap.xml must stay deleted — the filesystem beats rewrites.
 */

const SITE_URL = 'https://arthneetinepal.vercel.app';

interface StaticRoute {
  path: string;
  changefreq: string;
  priority: string;
}

const STATIC_ROUTES: StaticRoute[] = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/discover', changefreq: 'daily', priority: '0.9' },
  { path: '/learn', changefreq: 'weekly', priority: '0.9' },
  { path: '/community', changefreq: 'daily', priority: '0.8' },
  { path: '/news-feed', changefreq: 'daily', priority: '0.8' },
  { path: '/events', changefreq: 'weekly', priority: '0.7' },
  { path: '/trade', changefreq: 'weekly', priority: '0.7' },
  { path: '/trade-game', changefreq: 'weekly', priority: '0.7' },
  { path: '/leaderboard', changefreq: 'daily', priority: '0.6' },
  { path: '/about-us', changefreq: 'monthly', priority: '0.6' },
  { path: '/methodology', changefreq: 'monthly', priority: '0.5' },
  { path: '/privacy-policy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms-of-service', changefreq: 'yearly', priority: '0.3' },
];

/** Firestore REST list → recent post URLs, or [] on any failure. */
async function fetchPostUrls(): Promise<Array<{ loc: string; lastmod: string }>> {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  const apiKey = process.env.VITE_FIREBASE_API_KEY;
  if (!projectId || !apiKey) return [];

  const url =
    `https://firestore.googleapis.com/v1/projects/${projectId}` +
    `/databases/(default)/documents/posts` +
    `?pageSize=200&orderBy=createdAt%20DESC&key=${apiKey}` +
    `&mask.fieldPaths=createdAt&mask.fieldPaths=updatedAt` +
    `&mask.fieldPaths=hourlyPost&mask.fieldPaths=isDailyNews`;

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Firestore list failed: ${res.status}`);
  const data = (await res.json()) as {
    documents?: Array<{
      name: string;
      fields?: Record<string, { timestampValue?: string; booleanValue?: boolean }>;
    }>;
  };

  const today = new Date().toISOString().slice(0, 10);
  return (data.documents ?? [])
    .filter((doc) => {
      const f = doc.fields ?? {};
      // Skip AI-generated hourly scenarios and the daily digest — thin content.
      if (f.hourlyPost?.booleanValue === true) return false;
      if (f.isDailyNews?.booleanValue === true) return false;
      return true;
    })
    .map((doc) => {
      const postId = doc.name.split('/').pop();
      const updated = doc.fields?.updatedAt?.timestampValue || doc.fields?.createdAt?.timestampValue;
      const lastmod = updated ? updated.slice(0, 10) : today;
      return { loc: `${SITE_URL}/post/${postId}`, lastmod };
    });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const today = new Date().toISOString().slice(0, 10);
  const entries: string[] = [];

  for (const route of STATIC_ROUTES) {
    entries.push(
      `  <url>\n` +
        `    <loc>${escapeXml(SITE_URL + route.path)}</loc>\n` +
        `    <lastmod>${today}</lastmod>\n` +
        `    <changefreq>${route.changefreq}</changefreq>\n` +
        `    <priority>${route.priority}</priority>\n` +
        `  </url>`
    );
  }

  for (const lesson of LESSONS) {
    entries.push(
      `  <url>\n` +
        `    <loc>${escapeXml(`${SITE_URL}/learn/${lesson.id}`)}</loc>\n` +
        `    <lastmod>${today}</lastmod>\n` +
        `    <changefreq>monthly</changefreq>\n` +
        `    <priority>0.8</priority>\n` +
        `  </url>`
    );
  }

  let postCount = 0;
  try {
    const posts = await fetchPostUrls();
    postCount = posts.length;
    for (const post of posts) {
      entries.push(
        `  <url>\n` +
          `    <loc>${escapeXml(post.loc)}</loc>\n` +
          `    <lastmod>${post.lastmod}</lastmod>\n` +
          `    <changefreq>monthly</changefreq>\n` +
          `    <priority>0.6</priority>\n` +
          `  </url>`
      );
    }
  } catch (error) {
    // Static + lesson URLs below are still worth serving.
    console.warn('[sitemap] post listing failed:', error);
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries.join('\n') +
    `\n</urlset>\n`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader(
    'Cache-Control',
    'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'
  );
  console.info(
    `[sitemap] served ${STATIC_ROUTES.length} static + ${LESSONS.length} lessons + ${postCount} posts`
  );
  return res.status(200).send(xml);
}
