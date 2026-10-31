import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { applyPageSeo, organizationJsonLd, type PageSeo } from '../lib/seo';

/* Route-level default <head> tags.
 *
 * Mounted once inside <Router>. Applies the moment the URL changes, before
 * the lazy page component even finishes loading — so crawlers and social
 * scrapers reading the prerendered snapshot always see the right title.
 *
 * Pages that own their own metadata (/learn/:lessonId and /post/:postId,
 * whose real titles live in data) are deliberately NOT listed here; those
 * call usePageSeo() themselves and override whatever this sets first.
 */

const DESCRIPTIONS = {
  home:
    "Empowering Nepal's next generation with student-led financial literacy, NEPSE stock market guides, fundamental stock valuation, and central banking policy analysis. Join the academy.",
  discover:
    "Read research posts, discussions and questions from Nepal's finance community — NEPSE stocks, banking, hydropower, IPOs and macroeconomics.",
  community:
    "Join Arthneeti's community — ask finance questions, share analysis, and discuss investing in Nepal with students and professionals.",
  newsFeed:
    'AI-assisted research summaries and a daily digest covering NEPSE sectors — banking, hydropower, microfinance, IPOs, mutual funds and inflation.',
  events:
    "Workshops, webinars and campus campaigns by Arthneeti — Nepal's student-led financial literacy movement.",
  aboutUs:
    "Arthneeti is Nepal's student-led movement for financial literacy, NEPSE education and economic intelligence. Meet the team and the mission.",
  tradeGame:
    'Practice NEPSE investing with NPR 1,000,000 in virtual money — real market data, simulated trades, zero risk.',
  leaderboard:
    "Top learners and traders on Arthneeti — see who leads Nepal's financial literacy community.",
  methodology:
    "How Arthneeti researches, sources and verifies its content — our methodology, accuracy rules, and what we deliberately don't do.",
  privacy:
    "Arthneeti's privacy policy — what we collect, how we use it, and your rights.",
  terms:
    "Terms governing your use of Arthneeti's platform, community and learning services.",
} as const;

const EXACT_ROUTES: Record<string, PageSeo> = {
  '/': {
    title:
      'Arthneeti — Financial Literacy, NEPSE Investing & Economic Intelligence in Nepal',
    description: DESCRIPTIONS.home,
    path: '/',
    jsonLd: organizationJsonLd,
  },
  '/discover': {
    title: 'Discover Research & Discussions | Arthneeti',
    description: DESCRIPTIONS.discover,
    path: '/discover',
  },
  '/community': {
    title: 'Community — Ask, Share & Discuss Finance in Nepal | Arthneeti',
    description: DESCRIPTIONS.community,
    path: '/community',
  },
  '/news-feed': {
    title: 'Market Research Feed — NEPSE Sector Analysis | Arthneeti',
    description: DESCRIPTIONS.newsFeed,
    path: '/news-feed',
  },
  '/events': {
    title: 'Events & Workshops | Arthneeti',
    description: DESCRIPTIONS.events,
    path: '/events',
  },
  '/about-us': {
    title: 'About Us — Nepal’s Student-Led Financial Literacy Movement | Arthneeti',
    description: DESCRIPTIONS.aboutUs,
    path: '/about-us',
  },
  '/trade-game': {
    title: 'NEPSE Trading Simulator — Trade with Virtual Money | Arthneeti',
    description: DESCRIPTIONS.tradeGame,
    path: '/trade-game',
  },
  '/leaderboard': {
    title: 'Leaderboard — Top Learners & Traders | Arthneeti',
    description: DESCRIPTIONS.leaderboard,
    path: '/leaderboard',
  },
  '/methodology': {
    title: 'Our Methodology — Sourcing, Accuracy & Corrections | Arthneeti',
    description: DESCRIPTIONS.methodology,
    path: '/methodology',
  },
  '/privacy-policy': {
    title: 'Privacy Policy | Arthneeti',
    description: DESCRIPTIONS.privacy,
    path: '/privacy-policy',
  },
  '/terms-of-service': {
    title: 'Terms of Service | Arthneeti',
    description: DESCRIPTIONS.terms,
    path: '/terms-of-service',
  },
};

/* Account-only pages: indexed nowhere (robots.txt agrees), so scrapers that
 * ignore robots.txt still get a noindex tag. */
function personalSeo(path: string, label: string): PageSeo {
  return {
    title: `${label} | Arthneeti`,
    description: 'Sign in to access this page on Arthneeti.',
    path,
    noindex: true,
  };
}

function resolve(pathname: string): PageSeo | null {
  const exact = EXACT_ROUTES[pathname];
  if (exact) return exact;

  if (pathname.startsWith('/profile')) return personalSeo(pathname, 'Profile');
  if (pathname.startsWith('/bookmarks')) return personalSeo(pathname, 'Bookmarks');
  if (pathname.startsWith('/notifications')) return personalSeo(pathname, 'Notifications');
  if (pathname.startsWith('/trade')) return personalSeo(pathname, 'Trading Terminal');
  if (pathname.startsWith('/certificate')) return personalSeo(pathname, 'Certificate');
  if (pathname.startsWith('/admin-setup')) return personalSeo(pathname, 'Admin Setup');

  // /learn/:lessonId and /post/:postId own their meta (data-driven titles).
  // Unknown paths: let the catch-all redirect to / sort it out.
  return null;
}

export default function RouteSeo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const seo = resolve(pathname);
    if (seo) applyPageSeo(seo);
  }, [pathname]);

  return null;
}
