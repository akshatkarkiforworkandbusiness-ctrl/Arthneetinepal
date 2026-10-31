import { useEffect } from 'react';

/* Per-route <head> management.
 *
 * The app is a client-rendered SPA, so index.html ships one static title and
 * one static set of OG tags for every URL. Social scrapers (WhatsApp/Facebook
 * — how most Nepali users actually share links) never execute JavaScript, and
 * even Googlebot indexes the *prerendered* HTML we now emit via
 * scripts/prerender.mjs. Both of those pipelines read whatever this module
 * writes into <head>, which is why meta is set in exactly one place.
 *
 * No react-helmet: it has peer-dependency conflicts with React 19, and this is
 * ~100 lines of straightforward DOM work.
 */

export const SITE_URL = 'https://arthneetinepal.vercel.app';
export const SITE_NAME = 'Arthneeti';

export interface PageSeo {
  /** Full <title>. Include the site name — we do not append it automatically. */
  title: string;
  description: string;
  /** Canonical path (e.g. `/learn/demystifying-nepse`). Made absolute here. */
  path: string;
  /** Absolute URL or root-relative path to an og:image. */
  image?: string;
  type?: 'website' | 'article';
  /** Object or array of objects for <script type="application/ld+json">. */
  jsonLd?: unknown;
  /** `noindex` for pages that must stay out of search results. */
  noindex?: boolean;
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  // Match both attributes: index.html historically used property= for the
  // twitter:* tags, and a duplicate meta is worse than a normalized one.
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[name="${key}"], meta[property="${key}"]`
  );
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/** Store JSON-LD under a stable id so route changes replace, not accumulate. */
function setJsonLd(jsonLd: unknown) {
  const ID = 'arthneeti-page-jsonld';
  const existing = document.getElementById(ID);
  if (jsonLd === undefined || jsonLd === null) {
    existing?.remove();
    return;
  }
  let el = existing as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.id = ID;
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(jsonLd);
}

export function applyPageSeo({
  title,
  description,
  path,
  image,
  type = 'website',
  jsonLd,
  noindex,
}: PageSeo) {
  const url = `${SITE_URL}${path === '/' ? '/' : path}`;
  const imageUrl = image
    ? image.startsWith('http')
      ? image
      : `${SITE_URL}${image}`
    : `${SITE_URL}/financial_roadmap.png`;

  document.title = title;

  upsertMeta('name', 'description', description);
  upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
  upsertLink('canonical', url);

  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:url', url);
  upsertMeta('property', 'og:type', type);
  upsertMeta('property', 'og:image', imageUrl);
  upsertMeta('property', 'og:site_name', SITE_NAME);

  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', title);
  upsertMeta('name', 'twitter:description', description);
  upsertMeta('name', 'twitter:image', imageUrl);

  setJsonLd(jsonLd);
}

/**
 * Set <head> tags from a page component. Re-runs whenever any stringified
 * field changes, so passing a freshly-built object per render is fine.
 *
 * Effect ordering: components set their own meta *after* <RouteSeo> has
 * applied the route-level default (RouteSeo sits earlier in the tree), so a
 * dynamic page's real title always wins over the generic one.
 */
export function usePageSeo(seo: PageSeo) {
  const key = `${seo.title}|${seo.description}|${seo.path}|${seo.image ?? ''}|${seo.type ?? ''}|${seo.noindex ?? ''}|${seo.jsonLd ? JSON.stringify(seo.jsonLd) : ''}`;
  useSeoEffect(key, () => applyPageSeo(seo));
}

// Tiny internal hook so usePageSeo can diff on a stable string key instead of
// an object identity (which changes every render and would thrash the DOM).
function useSeoEffect(key: string, apply: () => void) {
  useEffect(apply, [key]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** First ~150 chars of plain text from post HTML, for meta descriptions. */
export function excerptFromHtml(html: string, max = 155): string {
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

/** Organization + WebSite schema, applied once on the homepage. */
export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/favicon.svg`,
      email: 'learnarthneeti@gmail.com',
      sameAs: ['https://instagram.com/ARTHN.EETI'],
    },
    {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      publisher: { '@type': 'Organization', name: SITE_NAME },
    },
  ],
};
