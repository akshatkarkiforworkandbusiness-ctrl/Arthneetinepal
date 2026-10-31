# Arthneetinepal — Updated Executable Plan

**Date:** 2026-10-11
**Status:** Ready for execution
**Companion doc:** [`docs/research-financial-intelligence.md`](research-financial-intelligence.md) — full primary-source research (problems + solution landscape, ~40 citations)

---

## 0. Why the previous AI attempts failed (evidence, not opinion)

| Finding | Evidence |
|---|---|
| **5 of 6 AI providers were configured but never wired** | `.env`/`.env.example` declare Gemini, Groq, Cerebras, OpenRouter, Anthropic keys — **zero code references**. Only NVIDIA NIM has live code. `@google/generative-ai` is a dead dependency; git history shows *"remove broken AI tutor & market assistant"*. |
| **The one live AI path is dead in production** | Live probe 2026-10-11: `POST/GET /api/news` → **HTTP 500 `FUNCTION_INVOCATION_FAILED`**; `/api/leaderboard/snapshot` → **same 500** (a GET that should return 405 crashes instead → the functions crash before handler logic). |
| **The AI content design was fragile by construction** | `newsService.ts` scrapes JSON out of free-form LLM prose (`extractJsonArray`); prompts ask the model to invent article URLs (`"/nepse"` placeholders) — fabricated content by design. |
| **This is a documented industry-wide failure** | Best LLM on finance benchmarks: **46.8% accuracy** ([arXiv:2508.00828](https://arxiv.org/pdf/2508.00828v1)); LLM advice **increased portfolio risk on all 5 measured dimensions** ([PLOS ONE 2025](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0325459)); LLMs hallucinate on financials even for large public companies ([arXiv:2504.00042](https://arxiv.org/html/2504.00042v2)). Research §1.6. |
| **Even the non-AI data layer is single-threaded and partly broken** | `nepseapi.surajrimal.dev` (landing ticker fallback) returned **HTTP 522 after 20 s** live; several yonepse legacy paths now 404; the site's candlestick/"history" charts are generated with **`Math.random()`** (`ExplorePage.tsx:46–119`) — only the final candle is real. |

**Conclusion:** the failure was never "AI doesn't work for us" — it was *load-bearing single dependencies on flaky third parties, plus content designed to be invented instead of computed*. The fix below inverts both.

---

## 1. What people actually struggle with when getting financial intelligence

*(Full evidence + citations: `docs/research-financial-intelligence.md` §1)*

1. **Data is fragmented, paid, or non-existent centrally.** NEPSE has no public/personal API tier; an investor petitioned Parliament for open data (Sep 2026); historical data "cannot be obtained centrally". The working pattern in Nepal is *volunteer-published static JSON* (yonepse, ShareSansar scrapers) — exactly what we already use, but without redundancy.
2. **Trust — tip culture and fabricated analysis.** NEPSE publicly warns about "false stock tips… fabricated analyses"; SEBON notes investors fall back on "thumb rules or… friends"; ~NPR 15T reported lost to manipulation. **Users cannot tell computed facts from invented prose.** → Every output must carry *source + timestamp + arithmetic shown*.
3. **Literacy gap is large and measurable.** NRB survey (9,361 adults): **71.83% rely on family/friends** for financial needs; NEPSE investors average **63.83% financial literacy**; only 49% answer basic compound-interest questions. → Intelligence must *teach while it informs* (link insight → lesson), not just display numbers.
4. **Language asymmetry.** Regulatory docs are Nepali-only; analysis portals English-only; hybrid search queries are the norm. → Bilingual labeling of key terms (medium-term; templates make this cheap later).
5. **LLM-generated finance content is demonstrably untrustworthy** (see §0) — and users trust the *confident* wrong answers more. → AI is never load-bearing; never uncited; never advisory.
6. **Timeliness/infrastructure fragility.** Broker-halting ransomware, delayed feeds, dead APIs (our own 522/404/500 observations). → Tiered sources + last-known-good cache + honest "data as of" labels (the Simply Wall St pattern: explicit fallback chain, labelled staleness).
7. **Regulatory exposure.** SEBON plans licensing of investment advisers; publishing buy/sell calls without a licence is legally exposed. → Ship **descriptive, sourced analysis** ("here is what the data shows"), never recommendations.

**→ The executable solution:** a website whose intelligence is *computed from real structured data* (reliable by construction), *rendered from templates with citations* (trustworthy by construction), *fed by tiered cached sources* (available by construction), with LLMs demoted to an **optional, validated, non-blocking enrichment layer**.

---

## 2. Product principle (non-negotiable)

> **The site must render fully — every page, every insight, every chart — if every external API and every LLM is down.**
> Layer order: ① deterministic compute → ② cached/last-known-good data → ③ template narrative → ④ optional multi-provider LLM enrichment (validated, cited, skippable).

Audience: **balanced** — each intelligence feature doubles as a learning artifact (show the arithmetic, link the "why" to a Learn lesson), serving both NEPSE investors and students.

---

## 3. The plan — phases, tasks, acceptance criteria

Effort = solo dev + AI agent. Days are working days. Phases 0–1 are prerequisites; 2–4 can partially parallelize; 5 runs continuously; 6 is the ongoing gate.

### Phase 0 — Stop the bleeding (≈2 days) — *do first, ship immediately*

| # | Task | Files | Acceptance |
|---|---|---|---|
| 0.1 | **Diagnose & fix the production 500s.** Reproduce with `npx vercel dev` locally; read Vercel → Deployments → Functions → Logs. Most likely causes (in order): (a) production runs a **stale deployment** older than the lazy-init fix in `api/_lib/firebaseAdmin.ts`, (b) missing/malformed `FIREBASE_SERVICE_ACCOUNT_JSON` or `NVIDIA_API_KEY` in Vercel env, (c) ESM extensionless imports under `"type": "module"`. Redeploy current HEAD first (30 s, may fix it outright), then logs. | `api/news.ts`, `api/ai-news.ts`, `api/ai-digest.ts`, `api/leaderboard/snapshot.ts`, Vercel dashboard | `GET /api/news` → 405 JSON; `POST` without token → 401 JSON; **no** `FUNCTION_INVOCATION_FAILED` on any `/api/*` route |
| 0.2 | **Fix the landing ticker's dead fallback.** `nepseapi.surajrimal.dev` = 522. Drop it; use `yonepse /data/market/indices.json` as sole source + keep the existing simulated ticker as the *labelled* last resort ("sample data" badge). | `src/components/LandingPage.tsx:194` | Ticker shows real index values or a visibly-labelled sample; no 20 s hangs |
| 0.3 | **Fix the dev proxy self-loop.** `"dev": "vite --port=3000"` + `server.proxy['/api'] → localhost:3000` proxies to itself — API routes can never run locally. Document & script `npx vercel dev` (port 3000, proxies to Vercel dev functions) as the dev workflow. | `package.json`, `vite.config.ts`, `README.md` | `npm run dev:full` runs SPA + API locally |
| 0.4 | **Fix Firestore rules for bookmark & notification features** (currently under global deny → runtime permission-denied), and **close the admin escalation hole** (`match /admins/{userId} { allow create: if isSignedIn(); }` → `allow create: if false;`, seed admins via console/CLI). | `firestore.rules` | Bookmarks save/load; no self-service admin; `firebase deploy --only firestore:rules` passes |
| 0.5 | **Fix dead links surfaced to users.** `PlaybookHero.tsx:209,212` → `/dashboard` (404→`/`), `/explore` (404→`/`); AI article `url: "/news" | "/nepse"` placeholders → real routes (`/discover`, `/community?tab=news…`). | `PlaybookHero.tsx`, `api/ai-news.ts:75`, `newsService.ts:128` | `grep` shows no links to non-existent routes |
| 0.6 | **Stop showing users dev errors.** `ExplorePage.tsx:248` → *"check your API key"* leaks internals; replace with the neutral degraded-state message + data-health badge (built in 1.4). | `ExplorePage.tsx`, `NewsFeedPage.tsx` | No API-key text ever reaches the UI |

### Phase 1 — Real data foundation (≈4 days)

| # | Task | Files / endpoints | Acceptance |
|---|---|---|---|
| 1.1 | **Kill fabricated charts.** Replace `buildChartData` / `buildCandlestickData` (`Math.random()` history) with real series from yonepse `data/ltp/monthly/*.json` (daily `ltp, volume, turnover, trades` **2007→present**; ~100 KB/month) and `data/indices/monthly/*.json` (1997→present). Note: shards are close-only → render **line/area from real closes**; keep candlesticks only where real OHLC exists (current-day strip) or label derived bars honestly. Server-side combiner endpoint to avoid 12 parallel client fetches. | new `api/series.ts` (symbol+months → merged series, in-memory TTL cache), `ExplorePage.tsx` | Chart timeframes render real data with an "as of" stamp; zero `Math.random()` in any chart path |
| 1.2 | **Verify every yonepse path against the OpenAPI spec and migrate before 2026-11-18** (legacy paths already 404ing; folder paths canonical). Currently referenced: `data/nepse_data.json`, `data/market/{indices,top_stocks,summary,status}.json` — all live ✅. Add: `data/market/history.json` (daily turnover history), `data/company/*`, `data/ltp/*`, `data/floor_sheet/*`. | `src/lib/nepseApi.ts`, `api/trading/execute.ts`, `api/leaderboard/snapshot.ts` | Scripted URL health-check (Phase 6 CI) passes; no legacy-path references remain |
| 1.3 | **Tiered ingestion + last-known-good cache.** Primary: yonepse static JSON → Secondary: community scrapers ([ShareSansarScraper](https://github.com/OmitNomis/ShareSansarScraper), [Nepse-All-Scraper](https://github.com/SamirWagle/Nepse-All-Scraper) jsDelivr mirrors) → Tertiary: last-known-good payload persisted to Firestore (`meta/dataCache/{key}`) so **the site survives total upstream outage**. | `src/lib/nepseApi.ts`, `api/_lib/` | Kill yonepse in devtools → pages still render from tier 2/3 |
| 1.4 | **Data-health chip everywhere.** Every market/news panel shows `● live · as of 2082-… (NPT)` / `cached from …`, sourced from `updatedAt`/`status.last_checked`. (Simply Wall St honesty pattern — research §2.3.) | shared `<DataFreshness>` component | No market number renders without a timestamp |
| 1.5 | **Fundamentals slice for the screener.** `data/company/financials.json` is 5.6 MB (307 companies: `pe, eps, paid_up_capital, profit, net_worth_per_share` + report docs). Daily **GitHub Actions** job (public repo = free) slims it to `public/data/screener.json` (~100 KB) → pushed → Vercel auto-deploys. | `.github/workflows/build-screener.yml` (new) | `public/data/screener.json` < 150 KB, updated daily, with `generatedAt` |

### Phase 2 — Deterministic intelligence layer: the core product (≈8 days)

This replaces "AI analysis" with math that **cannot** hallucinate (research §2.1, convergence #1).

| # | Task | Details | Acceptance |
|---|---|---|---|
| 2.1 | **Indicator engine.** Add [`technicalindicators`](https://www.npmjs.com/package/technicalindicators) (MIT, TS): RSI(14), MACD(12,26,9), Bollinger(20,2), SMA/EMA crossovers, volume/turnover spikes, candlestick patterns. Pure functions over Phase-1 series; runs client-side after `api/series` fetch. | `src/lib/indicators.ts` (new) | Unit-tested: known input → known RSI/MACD output |
| 2.2 | **Stock screener** (`/discover` tab): filter/sort all NEPSE stocks by price, change, turnover, P/E, EPS, market cap, sector, dividend — real fields from `nepse_data.json` + `screener.json`. | `ExplorePage.tsx` or new `ScreenerPage` | Filters work offline against cached data |
| 2.3 | **Per-stock insight cards** ("Signal desk"): rule-branched, descriptive output — *"RSI(14) 62 — neutral-to-strong (no threshold crossed); price +3.1% vs 20-day mean; turnover 2.4× 30-day average; P/E 29.3 vs sector median …"* Each line shows the number **and links to the matching Learn lesson** (literacy gap fix, research §1.4). Explicit non-advisory footer. | `src/lib/insightRules.ts` (new), `src/components/insight/` | Every claim traceable to a displayed computation; no "buy/sell" wording |
| 2.4 | **Market overview page** (replace dead `/dashboard` target): NEPSE index real history, breadth (advancers/decliners from live data), turnover trend from `market/history.json`, sector performance from `sector_indices.json`, top activity from floor-sheet aggregates (2024→present). | new `MarketOverview` on `/discover` or `/dashboard` | Renders fully with all LLMs dead and yonepse on tier-3 cache |
| 2.5 | **Fundamentals detail panel:** per-company P/E, EPS, net worth/share, paid-up capital, profit trend + links to official report documents (`documents` URLs in financials data) + dividend/IPO history. | `api/fundamentals.ts` or direct static slice | Source document link present for every figure |

### Phase 3 — News & digest without an LLM: template NLG (≈4 days)

Kills the most visibly broken feature *permanently* (research §2.2, convergence #2 — AP/Wordsmith: 12× volume, fewer errors than humans).

| # | Task | Details | Acceptance |
|---|---|---|---|
| 3.1 | **Template engine for sector news + daily digest.** Input = computed facts only: sector index change (real), top/bottom movers, turnover share, official notices/dividends/IPOs from yonepse `notify/`, upcoming events. Branches: `up >2% | flat | down >2% | no data`. Output fills the existing `NewsArticle` shape. | `src/lib/nlg/` (new: templates + branch rules + tests), replaces NVIDIA logic in `api/ai-news.ts`, `api/ai-digest.ts`, `api/news.ts` | Snapshot tests; every article has `source` + `computedAt`; **zero** external API calls |
| 3.2 | **Real external headlines with real URLs.** Replace invented URLs: ingest official/first-party sources only — NEPSE notices (via yonepse `notify/`), NRB press releases RSS, ShareSansar/Merolagani headlines *(scrape = ToS risk: keep read-only, link-back, no republishing of full text)*. | `api/newsSources.ts` | Every headline has a working outbound URL |
| 3.3 | **Vercel Cron daily digest** (Hobby: 1 job/day, ±59 min, UTC — schedule `11:00 UTC` ≈ 16:45 NPT, post-close): writes digest + indicator snapshot to Firestore → client just reads. Intra-day freshness stays client-side (60 s poll already exists) — no cron needed for it. | `vercel.json` `"crons"`, `api/cron/digest.ts` | One batch/day; page never blocks on generation |
| 3.4 | **NewsFeedPage rework:** show digest by default, sector cards from templates, countdown to next cron run, drop the "cleanup job" hack in favor of TTL policy. | `NewsFeedPage.tsx`, `newsService.ts` | The hourly "AI research" UI now reflects the batch reality honestly |

### Phase 4 — Optional AI enrichment, done reliably (≈3 days)

Only after Phases 0–3. LLM is a garnish, never the meal (research §2.7–2.8, convergence #5).

| # | Task | Details | Acceptance |
|---|---|---|---|
| 4.1 | **Multi-provider chain:** Groq → Cerebras → OpenRouter `openrouter/free` → Gemini — OpenAI-compatible base URLs, 429 backoff, per-provider timeout, **JSON-schema validation; on any failure → fall back to Phase-3 template output automatically**. All keys server-side only. | `api/_lib/llmChain.ts` (new) | Chaos-test (kill each provider) → users still see template content; latency never blocks first paint |
| 4.2 | **Citation gate:** (Gemini grounding where available) — reject any LLM output lacking source links + timestamp; render `data as of` + non-advisory disclaimer on every AI-assisted block. | `api/_lib/llmChain.ts` | Uncited AI text cannot reach Firestore/UI |
| 4.3 | **Config & dependency hygiene:** delete all `VITE_*` AI keys from `.env.example`/`.env` (client-side AI keys = leaked secrets + attack surface); remove unused `@google/generative-ai` **or** use it properly server-side in the chain; fix `generate-quiz.mjs` (missing SDK) or delete it; remove the *"check your API key"* user-facing strings. | `.env*`, `package.json` | `grep -r "VITE_.*API_KEY"` returns nothing |
| 4.4 | **Ollama offline batch (optional, dev-time only):** script that uses your local Ollama to pre-generate Nepali/English prose variants + translations from **already-computed** JSON → reviewed → committed to Firestore. No runtime dependency (Ollama can't run on Vercel anyway — research §2.6). | `scripts/ollama-batch.ts` (new) | Used only by the owner; production never calls a model for facts |

### Phase 5 — Full cleanup & consolidation (≈4 days, runs alongside)

| # | Task | Details |
|---|---|---|
| 5.1 | **One deployment target: Vercel** (live: `arthneetinepal.vercel.app`, only target serving all 6 endpoints). Delete the diverged Cloudflare duplicate `functions/` (3 files, missing auth/rate-limits) + `wrangler.toml` + `.wrangler/` + `public/_headers` + `test-cors.js`; **close bot PR #1** ("Add Cloudflare Workers configuration"). Keep `firebase.json` for Firestore rules only; remove stale `.firebase/hosting.*` cache. Decide on `Dockerfile`/`nginx.conf`: no CI uses them → delete (recoverable from git). |
| 5.2 | **Delete debris:** `prodigy_full.html`, `prodigy_bundle.js`, `prodigy.css` (different site), `search.js`, `search.cjs` (unrelated GitHub-search snippets), `scrape.js` (competitor scraper), `test-nvidia.js`, `git_status.txt`, `git_version.txt` (0 bytes), empty/stale artifacts. |
| 5.3 | **SEO/host consolidation:** one canonical host everywhere — `index.html` og:url/canonical, `public/sitemap.xml` (still points at `ujjwaldhungana.github.io/Arthneti`), `Footer`, `api/_lib/cors.ts` allow-list (keep `web.app` + `vercel.app` only). Fix mojibake (Nepali tagline in `Footer.tsx`, titles in `index.html`, comments in `api/_lib/auth.ts`, `Dockerfile`). |
| 5.4 | **Trading systems — clarify, don't rip out:** keep server-authoritative `/trade` (real prices, master-exam gate, anti-cheat → leaderboard integrity) and **link it in nav** as "NEPSE Simulated Trading"; keep `/trade-game` as "Practice Arena (24/7)". Deduplicate the two `Portfolio` types afterward. Full merge deferred (live Firestore data). |
| 5.5 | **Notifications that work:** add a minimal writer (client-side on comment/like on *someone else's* post) + rules from 0.4 — or remove the `/notifications` page. Prefer write. |
| 5.6 | **Orphan purge + dead code:** remove the 11 unreferenced components (`PublicationsPage`, `TeamPage`, `About3DExperience`, `Hero3D*`, `NepalMap3D` chain, `ShinyText`, `ProblemToFeatureAnimation`…), duplicate `src/lib/utils.ts`, root shadcn scaffolding (`components/`, `lib/` at repo root), unused exports (`researchAllSectors`, `fetchNepseIndexFallback`, `AdminSetup`), dead deps (`@firebase/app-check` — either initialize it properly to protect Firestore writes or remove). |
| 5.7 | **README rewrite** (currently untouched AI-Studio boilerplate): architecture diagram, `vercel dev` workflow, env var inventory (server-side only), deploy/runbook, data-source tiers. |
| 5.8 | **Bundle diet (start, don't block):** 4 MB JS. Lazy-split `LearnPage` (229 KB), `CommunityPage`, `NewsFeedPage`; audit never-used heavy deps (`ogl`, `shadergradient`, `animejs`, duplicate `framer-motion`+`motion`); measure, then decide on `three`/R3F. Target: initial route < 500 KB gz. |

### Phase 6 — Quality gate (ongoing, from day 1)

- **Tests where wrongness hurts:** indicator math (golden vectors), NLG branch snapshots, `api/_lib` (rate limit, cache, auth failure modes), screener join. Start: `src/lib/indicators` + `src/lib/nlg` (Phase 2/3 require tests before merge).
- **CI:** GitHub Actions on PR: `npm run lint` (tsc) + `npm run build` + tests + **URL health-check** (the Phase-1 script; catches yonepse path rot before users do).
- **Security:** implement `security_spec.md` incrementally (currently a test plan with no tests); enable App Check if kept; audit `firestore.rules` after every change (0.4 is the first).
- **Adopt the repo's own convention:** `security_spec.md` at root, plans/research in `docs/`.

---

## 4. Sequencing & milestones

```
Week 1        Week 2          Week 3           Week 4          Week 5+
┌──────────┐  ┌────────────┐  ┌─────────────┐  ┌───────────┐  ┌─────────────────┐
│ Phase 0  │→ │ Phase 1    │→ │ Phase 2     │→ │ Phase 3   │→ │ Phase 4 (opt.)   │
│ stop the │  │ real data  │  │ indicators  │  │ template  │  │ Phase 5 cleanup  │
│ bleeding │  │ foundation │  │ screener    │  │ NLG+cron  │  │ Phase 6 tests/CI │
└──────────┘  └────────────┘  │ insights    │  └───────────┘  └─────────────────┘
                              └─────────────┘
```

- **M1 (48 h):** production `/api/*` healthy, ticker honest, rules fixed, dead links gone → *site stops embarrassing itself.*
- **M2 (Week 1–2):** real charts + freshness badges + redundancy → *site stops lying about data.*
- **M3 (Week 2–3):** screener + indicators + insight cards → *site finally delivers financial intelligence, with zero AI.*
- **M4 (Week 3–4):** template news/digest + cron → *the broken AI feature is replaced by something that cannot break.*
- **M5 (Week 4–5):** cleanup done, optional AI chain live, CI green → *maintainable base for whatever comes next.*

**Quick wins if time is short (highest value/effort ratio):** 0.1 → 1.1 → 3.1 → 1.4 → 0.4.

---

## 5. Success metrics

| Metric | Now (2026-10-11) | Target |
|---|---|---|
| `/api/*` endpoints returning 5xx | 2 of 2 probed | 0 |
| Chart history source | `Math.random()` | real yonepse series (2007→) |
| Features depending on a single third-party API | news, digest, ticker, trading, leaderboard | 0 (tiered + cached) |
| Prose published without source+timestamp | all AI articles | 0 |
| Client-bundle AI secrets | 5 `VITE_*` keys | 0 |
| Broken user-facing routes/links | ≥ 3 | 0 |
| Broken Firestore features (rules) | bookmarks, notifications | 0 |
| Tests / CI | 0 / none | indicators+NLG covered, CI on PR |

---

## 6. Risks & guardrails

| Risk | Mitigation |
|---|---|
| **SEBON advisory licensing** (research §1.7) | All outputs descriptive ("data shows"), no buy/sell calls; persistent non-advisory disclaimer; no "target price" language. |
| **yonepse legacy path removal (2026-11-18)** | Phase 1.2 migration + CI URL health-check before deadline; tier-2/tier-3 cache covers outages. |
| **Scraping ToS (ShareSansar/Merolagani)** | Headlines only + link-back, never full-text republish; official sources (NEPSE notices, NRB RSS) preferred. |
| **LLM model churn on free tiers** (Groq retired models Aug 2026) | Chain + schema validation + automatic template fallback; never load-bearing (Phase 4.1). |
| **Hobby-plan cron limits** (1/day, ±59 min) | Digest scheduled post-close, tolerant of drift; anything intra-day = client fetch + cache (already 60 s). |
| **Data accuracy of community feeds** | "Data as of" stamps + tier labels; never present third-party data as official NEPSE. |

---

## Appendix — Live probe log (2026-10-11, UTC)

| URL | Result |
|---|---|
| `arthneetinepal.vercel.app/` | 200 (SPA) |
| `arthneetinepal.vercel.app/api/news` | **500 `FUNCTION_INVOCATION_FAILED`** |
| `arthneetinepal.vercel.app/api/leaderboard/snapshot` | **500 `FUNCTION_INVOCATION_FAILED`** |
| `shubhamnpk.github.io/yonepse/data/nepse_data.json` | 200 (150 KB) |
| `…/data/market/{indices,top_stocks,summary,status}.json` | 200 ✅ |
| `…/data/market/history.json` | 200 (45 KB, daily turnover) |
| `…/data/ltp/monthly/2026-10.json` (+ manifest, 2007→) | 200 (106 KB) |
| `…/data/indices/monthly/*` (+ manifest, 1997→) | 200 |
| `…/data/company/financials.json` | 200 (5.6 MB, 307 companies: P/E, EPS…) |
| `…/data/floor_sheet/manifest.json` | 200 (daily, 2024-01-01→) |
| `…/data/status.json`, `…/data/summary.json`, `…/data/top_stocks.json` (legacy) | **404** (migrated to `market/`) |
| `nepseapi.surajrimal.dev/NepseIndex` | **522** (20 s timeout) |
