# Research: Financial Intelligence — Problems & Reliable Delivery Approaches

**Scope:** Primary-source research for Arthneetinepal (NEPSE / Nepal retail investors + general retail/students/SME owners).
**Prepared:** 2026-10-11
**Method:** Web research against official docs, first-party pages, regulator/central-bank publications, peer-reviewed papers, news reports and user forums. Anything not verified is flagged with **⚠ UNVERIFIED**.

---

## 1. Problem Evidence

### 1.1 Data fragmentation and access is the #1 structural complaint — including at the regulator level

| Claim | Source | Type |
|---|---|---|
| NEPSE has paid API tiers but **no personal/public tier**, so hobbyists and small builders are locked out | [NEPSE should provide its API to the general public — r/NepalStock](https://www.reddit.com/r/NepalStock/comments/rmy20c/nepse_should_provide_its_api_to_the_general_public/) | Reddit forum (2021) |
| Historical NEPSE data (long-run LTP, bonuses, rights, merger ratios) "**cannot be obtained centrally**"; the answer is "visit NEPSE and SEBON yourself" or scrape | [Need help getting historical NEPSE data — r/Nepal](https://www.reddit.com/r/Nepal/comments/1knr7yo/need_help_getting_historical_nepse_data/) | Reddit forum (2025) |
| Developers must reverse-engineer NEPSE's WASM auth + intermediate CA cert just to read public prices; multiple projects state NEPSE "**does not provide an official public API**" and may break at any time | [rajeevpaudel/nepse-api](https://github.com/rajeevpaudel/nepse-api), [dipalkatuwal/nepseman-api](https://github.com/dipalkatuwal/nepseman-api), [nepse-api-helper (npm)](https://registry.npmjs.org/nepse-api-helper) | First-party GitHub/npm READMEs |
| An investor petitioned Nepal's Parliament Finance Committee for "**free API access**" and "**no monopoly on capital market data**," alleging a private company controls NEPSE's own NOTS trading system | [Ratopati: Independent investor demands open API access](https://english.ratopati.com/story/81613/allegations-that-private-companies-control-nepses-online-system-demand-for-free-api-access) | News (2026-09-30) |
| NEPSE's market feed is a delayed WebSocket "10–15 secs late," not live; users ask "Why don't NEPSE provide live data feeds?" | [Why dont nepse provide live data feeds — r/NepalStock](https://www.reddit.com/r/NepalStock/comments/1v8uucv/why_dont_nepse_provide_live_data_feeds_kasialai/) | Reddit forum |
| Practical inference: the working pattern for Nepal is **static JSON published on GitHub Pages by volunteers**, not an official feed | [Shubhamnpk/yonepse](https://github.com/Shubhamnpk/yonepse) (OpenAPI spec + hourly cron), [OmitNomis/ShareSansarScraper](https://github.com/OmitNomis/ShareSansarScraper), [SamirWagle/Nepse-All-Scraper](https://github.com/SamirWagle/Nepse-All-Scraper) | First-party project docs |

**Our own live observation (primary):** during this research, `https://nepseapi.surajrimal.dev/` returned **HTTP 522 (Cloudflare origin timeout)**. That host is the "free hosted NEPSE API" most local projects point at. ⚠ Single-point-in-time observation — not a sustained uptime measurement.

### 1.2 Infrastructure instability directly erodes trust and locks up money

- **[Recurring tech failures rattle Nepal's stock market](https://kathmandupost.com/money/2026/09/22/recurring-tech-failures-rattle-nepal-s-stock-market)** (Kathmandu Post, news): a ransomware attack at Data Hub — used by **72 of 90 broker firms** — halted trading; >NPR 4.5 trillion in assets exposed; "responsibility is shifted from one place to another… investors and brokers are always the ones who suffer."
- **[Nepal's stock market has a bigger problem than a ransomware attack](https://english.nepalnews.com/s/explainers/nepals-stock-market-has-a-bigger-problem-than-a-ransomware-attack-everything-you-need-to-know/)** (NepalNews explainer): recurring complaints — NEPSE's monopoly, limited market-depth visibility so retail "cannot see enough of the order book," and single-vendor infrastructure concentration.
- **SEBON's own handbook** notes the market modernised technologically but that "low level of understanding and awareness in securities markets continues to be a cause of concern." — [SEBON, Investors' Handbook on Securities Markets and Commodity Derivatives Markets (PDF)](https://sebon.gov.np/uploads/uploads/8vjyqESdkGGheki88AA5NS2yremG1FMX8VpMw0ZO.pdf), official regulator publication.

### 1.3 Tip culture, manipulation and misinformation are documented and systemic

- **Official:** NEPSE issued a public notice warning about "misleading and unverified information… false stock tips, company recommendations, fabricated analyses, and fake advertisements" on social media, and told investors **not to rely on unofficial sources**. — [NEPSE warns investors against fake information](https://nepsetrading.com/news/nepse-warns-investors-against-fake-information) (reproduction of NEPSE press release, 2025-08-18). ⚠ Reproduced by a third party; original NEPSE press-release URL not fetched directly.
- **Regulator:** SEBON has warned that the Securities Act 2063 forbids any individual or group from "manipulating the market by suggesting which scrips to buy or sell," and that only accredited persons may publish market opinions. — [Biznessvue, How to Read (and Distrust) Broker Tips on NEPSE](https://www.biznessvue.com/broker-tips-research-nepse/) (secondary analysis citing SEBON/Nepal News, 2021). ⚠ Secondary source; the SEBON statement itself was not fetched.
- **Regulator's own diagnosis:** "Investors and even students tend to use thumb rules or seek advice from friends, market intermediaries and relatives, which are often poor approximations compared to those that follow from a scientific analysis." — [SEBON Investors' Handbook (PDF)](https://sebon.gov.np/uploads/uploads/8vjyqESdkGGheki88AA5NS2yremG1FMX8VpMw0ZO.pdf), official.
- **Scale of harm:** ~7.2 million people in Nepal's stock market; ~NPR 15 trillion reported lost over a two-year window via manipulative practice; >26% of listed companies loss-making yet priced high. — [NepalNews: The great betrayal of Nepali stock investors](https://english.nepalnews.com/s/explainers/the-great-betrayal-of-nepali-stock-investors-everything-you-need-to-know-about-share-market-manipulation-and-investing-in-nepal/), news explainer (2025-02-20).
- **Mechanics:** coordinated wash/circular trading through multiple demat+TMS accounts, thin-float cornering, and social hype timed to orchestrator exits. — [The Annapurna Express: Fixing the flaws in NEPSE](https://theannapurnaexpress.com/story/55470/), news (2025-06-26).
- **Paid Telegram/Facebook tip groups** as exit liquidity; penalty ceilings as low as NPR 1 lakh / 1 year under Sections 94–96 of the Securities Act. — [Kharchapatra: NEPSE pump-and-dump & Telegram tips](https://kharchapatra.com/blog/nepse-pump-and-dump-telegram-tips-nepal), analysis (2026-06).
- **Retail self-recognition:** "stocks pumped to the moon with fake hype, only for the big guys to dump on retail… We hold the bag… because we're divided, misinformed, and reactive." — [Retail Investors in Nepal — It's Time to Wake Up, r/NepalStock](https://www.reddit.com/r/NepalStock/comments/1lwil0w/retail_investors_in_nepal_its_time_to_wake_up/), forum.
- **Social-media-driven herd behaviour** among young first-time investors, uncredentialed influencers on TikTok/YouTube/Facebook. — [Nepal Economic Forum: Are Retail Investors Ignoring Risk in Nepal's Bull Market?](https://nepaleconomicforum.org/are-retail-investors-ignoring-risk-in-nepals-bull-market/), think-tank commentary (2025-07).

### 1.4 Financial literacy is measurable, moderate, and correlated with outcomes

- **NRB national baseline survey** (9,361 adults, all 77 districts, OECD/INFE 2022 methodology): "wide variation in the level of financial literacy among age groups, income level, economic sectors, occupations, across provinces and districts"; **71.83% of adults still rely on family and friends** for saving/borrowing needs; only ~two-thirds aware of ≥5 financial products. — [NRB Baseline Survey on Financial Literacy in Nepal (PDF)](https://www.nrb.org.np/contents/uploads/2022/12/Baseline-Survey-on-Financial-Literacy-in-Nepal-including-Financial-Inclusion-Indicators.pdf), **official central-bank survey**.
- **NEPSE investors specifically:** average financial-literacy knowledge score **63.83% (5.74/9)** — "moderate level"; significant positive correlation between literacy and investment decisions. — [Bhandari (2023), University of Gloucestershire DBA thesis](https://eprints.glos.ac.uk/15103/), academic.
- **429 NEPSE retail investors, SEM:** financial knowledge, behaviour and skill significantly drive investment decisions; *attitude* does not. — [OCEM Journal of Management, Technology & Social Sciences 3(2)](https://www.nepjol.info/index.php/ocemjmtss/article/view/67857), peer-reviewed (2024).
- **420 Kathmandu investors (TU Journal):** only **49.29% correctly answered compound-interest questions**, 62.62% inflation, 66.19% time value of money; literacy variables explain 41.5% of variance in market participation. — [Financial Literacy and Individual Investors' Stock Market Participation in Nepal, Tribhuvan University Journal 37(2)](https://exa.ai/library/publication/y5mtcrl7cc6), peer-reviewed (2022). ⚠ Accessed via a third-party mirror; original DOI is `10.3126/tuj.v37i02.51653`.
- **Digital financial literacy** (358 Nepali investors) significantly predicts investment behaviour, R² = 0.589. — [Joshi & Rawat, KMC Journal 6(2)](https://www.nepjol.info/index.php/kmcj/article/view/68889), peer-reviewed (2024).

### 1.5 Language and access barriers are asymmetric — and they cut both ways

- **English → Nepali gap:** "the majority of essential regulatory documents, including licensing policies and directives, are published **exclusively in Nepali**," a barrier for foreign investors/partners; conversely, most quality market analysis portals publish in English only.
- **Digital divide:** household internet access 79.3% in Kathmandu Valley vs **17.4% in rural areas and 14% in Karnali**; rural/semi-urban populations lack financial *and* digital literacy, breeding "skepticism and a preference for traditional, tangible transaction methods."
- **Search behaviour:** hybrid English / Romanised-Nepali / Nepali-script queries are the norm. — all three from [Gurkha Technology: Nepal Fintech Digital Marketing Research](https://gurkhatech.com/nepal-fintech-digital-marketing-research/), industry research report (2025-10). ⚠ Vendor-published research; underlying Nepal Living Standard Survey figures not fetched directly.
- **SME owner pain:** "40% [of MSMEs] report access to finance as a major constraint," and MSMEs are "the least digitally integrated." — same source; corroborated directionally by [Heifer/SAFAL, Impact Investment Landscape in Nepal (PDF)](https://andeglobal.org/wp-content/uploads/2025/02/Impact-Investment-Landscape-in-Nepal-by-Heifer-and-SAFAL-Partners.pdf) (NGO/industry report) which cites "limited access to reliable market data," "lack of investor confidence" and "low access to financial services, poor understanding, and a relative lack of trust."

### 1.6 LLM-generated financial content is demonstrably untrustworthy — this is not just our experience

| Finding | Source | Type |
|---|---|---|
| Best model on 537 expert-authored finance research tasks hit only **46.8% accuracy at $3.79/query**; "no model surpassed 50%… considerable advancement is needed before these systems can reliably operate autonomously in high-stakes financial environments" | [Finance Agent Benchmark, arXiv:2508.00828](https://arxiv.org/pdf/2508.00828v1) | Peer-track preprint |
| LLMs "hallucinate for larger companies, especially for data from more recent years"; Llama-3-70B-Chat answered 1995 revenue correctly for only 6.32% of companies despite public data existing; hallucination and accuracy co-occur in the same cells | [Where Large Language Models Fall Short on Financial Knowledge, arXiv:2504.00042](https://arxiv.org/html/2504.00042v2) | Academic preprint (197k questions) |
| LLM investment advice **increased portfolio risk on all five measured dimensions** (geographic cluster, sector cluster, trend-chasing, active allocation, expense); debiasing prompts only partially helped; advice was "communicated very convincingly" with disclaimers in >95% of cases | [Biased echoes, PLOS ONE (2025)](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0325459) | **Peer-reviewed journal** |
| Systematic **product bias**: mean Gini 0.93 (investment amount) across 567,000 samples, 7 LLMs; stock recs most biased; persists after debiasing prompting | [Exposing Product Bias in LLM Investment Recommendation, arXiv:2503.08750](https://arxiv.org/pdf/2503.08750v1.pdf) | Academic preprint |
| Users reported *higher* satisfaction and trust with extroverted LLM personas **even when those agents gave worse advice**; failed preference elicitation had a *negative* effect on investor decision quality | [Are Generative AI Agents Effective Personalized Financial Advisors?, arXiv:2504.05862](https://arxiv.org/html/2504.05862) | Lab study, 64 participants |
| First benchmark for LLM financial decision-making agents; 13 LLMs evaluated | [InvestorBench, ACL 2025](https://aclanthology.org/2025.acl-long.126/) | **Peer-reviewed (ACL)** |

**Our own code confirms the failure mode:** `src/lib/newsService.ts` extracts a JSON array out of raw model text (`extractJsonArray`, stripping code fences and trailing commas), and `api/news.ts`, `api/ai-news.ts`, `api/ai-digest.ts` all hard-code a single upstream `https://integrate.api.nvidia.com/v1/chat/completions`. One flaky provider = three broken features, and a parser that must survive free-form prose.

### 1.7 Timeliness / regulatory context to respect

- NEPSE trading hours **Sun–Thu 11:00–15:00 NPT**; `live_market()` / `market_depth()` only return data in that window — [nepseman-api (PyPI)](https://pypi.org/project/nepseman-api/).
- SEBON's FY 2083/84 policy announces "zero tolerance" for insider trading/manipulation/misleading social-media promotion, plus planned **licensing of investment advisers, finfluencer scrutiny and an automated surveillance system** — i.e. publishing buy/sell calls without a SEBON licence is legally exposed. — [Biznessvue](https://www.biznessvue.com/broker-tips-research-nepse/), ⚠ secondary, and the article itself states these are **stated plans, not operating systems**.
- Practical implication: Arthneetinepal should publish **descriptive, sourced, non-advisory analysis** ("here is what the data shows") rather than recommendations.

---

## 2. Solution Landscape

**Reliability scale:** ★★★★★ deterministic/no network · ★★★★☆ stable network w/ cache · ★★★☆☆ single third-party, degradable · ★★☆☆☆ free-tier rate-limited · ★☆☆☆☆ single flaky paid API (what we have now).

### 2.1 Deterministic technical-analysis indicators (client/server)

| | |
|---|---|
| **Reliability** | ★★★★★ — pure math on arrays; no network, no model, no hallucination possible |
| **Cost** | Free, MIT/LGPL |
| **Effort** | Low (1–3 days): data in → indicators out |

- **[technicalindicators (npm)](https://www.npmjs.com/package/technicalindicators)** — TypeScript, MIT, ~29.9K weekly downloads. Ships RSI, MACD, Bollinger Bands, SMA/EMA/WMA, ATR, ADX, OBV, MFI, Stochastic, VWAP, Ichimoku, PSAR, ROC, KST, TRIX + **33 candlestick patterns** (Doji, Engulfing, Morning Star…). Static `calculate()` or streaming `nextValue()` — both APIs fit our tick/history shapes. Official: [github.com/anandanand84/technicalindicators](https://github.com/anandanand84/technicalindicators).
- **[fast-technical-indicators (npm)](https://www.npmjs.com/package/fast-technical-indicators)** — claims **100% API-compatible drop-in**, zero dependencies, 1.4–9.6× faster on the indicators we'd use. ⚠ Benchmarks are the package's own claims; verify before relying on them.
- **[Tulip Indicators](https://tulipindicators.org/list)** — ANSI C, **no dependencies, LGPL, 104 indicators** (`rsi`, `macd`, `bbands`, `stoch`, `mfi`, `obv`, `psar`, `adx`, `crossover`…), runtime enumeration via `ti_indicators[]`, bindings for many languages. Good if we ever move indicator math to a worker or a Cloudflare/edge build. Official: [github.com/TulipCharts/tulipindicators](https://github.com/TulipCharts/tulipindicators).
- **TA-Lib** (Python/C) — **⚠ UNVERIFIED in this pass** (official page not fetched); verify license and build requirements before adopting.
- **Design note:** indicators are *inputs to prose*, not prose. The value to users is "RSI(14) = 62, MACD histogram flipped positive on 2082-…, price is 3.1% above the 20-day mean" — all reproducible numbers.

### 2.2 Structured-data → template content generation (NLG without an LLM)

| | |
|---|---|
| **Reliability** | ★★★★★ — output is arithmetic + chosen phrasing; can only be "wrong" if the input data is wrong |
| **Cost** | Free |
| **Effort** | Medium (3–7 days): template library + branch rules + unit tests |

- **Proven at scale:** The Associated Press used Automated Insights' **Wordsmith** to go from ~300 to **4,400 earnings stories per quarter (12×)** from Zacks data, with **"far fewer errors than their manual counterparts."** — [AP: Automated earnings stories multiply](https://www.ap.org/the-definitive-source/announcements/automated-earnings-stories-multiply/) (first-party AP) and [AP: A leap forward in quarterly earnings stories](https://www.ap.org/the-definitive-source/announcements/a-leap-forward-in-quarterly-earnings-stories/) (first-party AP).
- **Mechanics:** rule-based templates + structured input file + editorial style rules; ~2 months of human-in-the-loop error tuning before full automation. — [Emerj case study of the AP deployment](https://emerj.com/news-organization-leverages-ai-generate-automated-narratives-big-data/) (secondary, but describes the first-party config process).
- **Why it beats our current design:** our `NewsArticle { title, summary, date, source, url }` shape is exactly the NLG output contract. We can fill it from computed market facts + scraped headlines without ever calling a model.

### 2.3 How real products structure their intelligence layer so it degrades gracefully

- **Simply Wall St** open-sources its **entire analysis model** — 30 binary checks across 5 axes → snowflake. Crucially it has an explicit **method fallback chain**: analyst consensus estimates → weighted linear regression on historical series → ROE-convergence method → and where a valuation input is missing, "**If data is unavailable, we fall back to using the DDM**." Their model refresh runs "every 6 hours, for 68 industries." — [SimplyWallSt/Company-Analysis-Model (GitHub, official)](https://github.com/simplywallst/company-analysis-model), [MODEL.markdown](https://github.com/SimplyWallSt/Company-Analysis-Model/blob/master/MODEL.markdown), [sept_2017_model_updates.markdown](https://github.com/SimplyWallSt/Company-Analysis-Model/blob/master/sept_2017_model_updates.markdown).
- **Simply Wall St's data layer is one licensed vendor**, normalised, EOD (not real-time), and reports "can take anywhere from a few hours to a day to represent any new results" — honest staleness labelling. — [Analysis and Financial Data Sources (first-party)](https://simplywall.st/analysis-and-financial-data-sources), [Where do you source financial data? (first-party support)](https://support.simplywall.st/hc/en-us/articles/8908651462543-Where-do-you-source-financial-data).
- **Finnhub** exposes a **free REST tier** with per-endpoint gating (fundamentals free; `news-sentiment`, `company profile`, `financial statements` marked *Premium*) — the standard freemium shape: prices cheap/free, "intelligence" paid. — [Finnhub API docs (first-party)](https://finnhub.io/docs/api). ⚠ No NEPSE coverage; relevant only as a pattern. **Koyfin / TIKR / Stock Analysis** — **⚠ UNVERIFIED** (first-party pages not fetched in this pass).
- **Pattern to copy:** deterministic core → explicit fallback chain → labelled staleness → *then* optional enrichment. Never a single upstream dependency (our current `integrate.api.nvidia.com` is the anti-pattern).

### 2.4 Scheduled batch generation instead of on-demand calls

| | |
|---|---|
| **Reliability** | ★★★★☆ (GitHub Actions) / ★★★★☆ (Vercel Cron, within its constraints) |
| **Cost** | Free |
| **Effort** | Low–Medium |

- **Vercel Cron (first-party):** available on **all plans, 100 cron jobs per project** — but **Hobby = once per day only** and scheduling precision is **±59 minutes**; Pro = per-minute. Timezone is always UTC. Cron only runs on **production** deployments. Functions: Hobby max duration **300s**, 2GB/1vCPU. — [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs), [Usage & Pricing for Cron Jobs](https://vercel.com/docs/cron-jobs/usage-and-pricing), [Vercel Functions Limits](https://vercel.com/docs/functions/limitations), [Vercel Hobby Plan](https://vercel.com/docs/plans/hobby).
- **Implication:** one *daily* batch (e.g. post-close market digest at 11:00 UTC ≈ 16:45 NPT) is fully supported on the free tier; **intra-day auto-refresh is not** — that must be client-side fetch + cache, or GitHub Actions.
- **GitHub Actions cron** is the pattern every working Nepali pipeline uses: yonepse (hourly, Mon–Fri 11–16 NPT), [ShareSansarScraper](https://github.com/OmitNomis/ShareSansarScraper) (daily 17:00 NPT → commits JSON to GitHub Pages), [Nepse-All-Scraper](https://github.com/SamirWagle/Nepse-All-Scraper) (weekdays 18:45 NPT, free public JSON API + jsDelivr CDN mirror), [nepse-rss](https://github.com/jarp0l/nepse-rss) (daily RSS from SQLite). Cost: zero. Failure mode: job goes green-no-op on holidays.

### 2.5 NEPSE data pipelines (RSS / static JSON / official)

| Source | Reliability | Cost | Notes |
|---|---|---|---|
| **[yonepse static JSON API](https://github.com/Shubhamnpk/yonepse)** (`shubhamnpk.github.io/yonepse`) | ★★★★☆ | Free | Published **OpenAPI spec**; prices, indices, sector indices, top movers, summary, **monthly/daily LTP shards**, brokers, company profiles + financials, proposed dividends, notices, disclosures. Updated hourly Mon–Fri 11–16 NPT via GitHub Actions from the **NEPSE official API + Merolagani + ShareSansar**. ⚠ Endpoint migration: folder-based paths canonical, legacy paths removed after **2026-11-18** — we must migrate. **Already our primary source** (`api/trading/execute.ts`, `api/leaderboard/snapshot.ts`). |
| **[ShareSansar](https://www.sharesansar.com/)** / **[Merolagani](https://merolagani.com/)** | ★★★☆☆ | Free (scrape) | Best sources for news, IPO/dividend notices, floorsheet. Scraped by multiple community pipelines; no official feed. ⚠ Terms-of-service and layout-rot risk. |
| **nepseapi.surajrimal.dev** (REST/WS/MCP) | ★☆☆☆☆ in this check | Free | Returned **HTTP 522** when fetched today. README itself warns NEPSE's own SSL chain is broken and the client disables verification. |
| **nepseman-api** (Railway-hosted) | ★★☆☆☆ | Free | First-party README: "Data accuracy is not guaranteed. **Do not use in production trading systems**"; auto-bypasses SSL verification. |
| **NEPSE official (NOTS) API** | ★★☆☆☆ | Paid tiers, no personal tier | Reverse-engineered WASM auth required; subject to change without notice. |

**Takeaway:** treat *every* NEPSE source as tiered-and-redundant, cache last-known-good payloads, and render data **with its timestamp**.

### 2.6 Local LLMs via Ollama

| | |
|---|---|
| **Reliability** | ★★★★★ for *availability* (no network dependency) · ★★☆☆☆ for *quality* on small models |
| **Cost** | Free (electricity + hardware) |
| **Effort** | Medium–High; **cannot run on Vercel** — needs a user machine or a small always-on box |

- **First-party requirements:** Windows 10 22H2+, no admin rights needed, API at `http://localhost:11434`; ≥4GB for the binary plus model storage. "You should have at least **8 GB of RAM to run 7B models, 16 GB for 13B, 32 GB for 33B**." Default context = 4096 tokens; default context by VRAM: <24 GiB → 4k, 24–48 → 32k, ≥48 → 256k. — [Ollama FAQ](https://docs.ollama.com/faq), [Ollama on Windows](https://docs.ollama.com/windows), [Ollama Context length](https://docs.ollama.com/context-length), [Ollama Quickstart model table](https://ollama.readthedocs.io/en/quickstart/).
- **Realistic small-hardware choices:** `llama3.2:1b` (1.3GB), `llama3.2` 3B (2.0GB), `gemma3:1b` (815MB), `phi4-mini` 3.8B (2.5GB), `gemma3:4b` (3.3GB) — all comfortable on a 8–16GB laptop; 7–8B (`llama3.1` 4.7GB, `granite3.3` 4.9GB) need ~8GB free.
- **Honest read:** Ollama solves *availability*, not *trustworthiness*. A 3B model summarising NEPSE numbers is exactly where the hallucination literature applies. Use local models only for **formatting/translation of already-computed structured data**, never for arithmetic or advice. Also note Ollama cannot be invoked from a Vercel serverless function — it would be an *optional user-side* feature ("run your own assistant offline"), not the site's backbone.

### 2.7 Free/freemium LLM APIs with fallbacks

| Provider | Reliability | Cost | Evidence |
|---|---|---|---|
| **Groq** | ★★☆☆☆ | Free, no CC | Official rate limits: e.g. `openai/gpt-oss-120b` **30 RPM, 1K RPD, 8K TPM, 200K TPD**; `llama-3.3-70b-versatile` and `llama-3.1-8b-instant` were **retired 2026-08-16** (model churn is itself a reliability risk). — [Groq Rate Limits](https://console.groq.com/docs/rate-limits), [Groq Models](https://console.groq.com/docs/models.md) |
| **Cerebras** | ★★☆☆☆ | Trial: 5 RPM, 30K TPM, **1M tokens/day** on 2 models; $5 credit needs a payment method and expires in 30 days | [Cerebras Inference Pricing](https://www.cerebras.ai/pricing) (first-party) |
| **OpenRouter free router** (`openrouter/free`) | ★★☆☆☆ | $0; **auto-failover across providers**; own free tier 20 RPM / 50 req-day (1,000/day with a $10 top-up) | [OpenRouter Free Models Router](https://openrouter.ai/openrouter/free), [Free LLM API comparison](https://openrouter.ai/blog/tutorials/free-llm-apis-compared/) |
| **Google AI Studio (Gemini)** | ★★☆☆☆ | Free, 5–15 RPM, 20–1,500 RPD; **grounding + inline citations** | [Grounding with Google Search (first-party)](https://ai.google.dev/gemini-api/docs/google-search) |
| **NVIDIA NIM** (current) | ★☆☆☆☆ | Free-ish | Our three API routes depend on it alone — this is the documented failure. |

**Key first-party capability if we keep any LLM step:** Gemini's grounding returns `groundingChunks` + `groundingSupports` mapping text spans to source URLs — i.e. **machine-checkable citations we can render inline**. — [Gemini API: Grounding with Google Search](https://ai.google.dev/gemini-api/docs/google-search), [Vertex AI GroundingMetadata reference](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/reference/rest/v1/GroundingMetadata).

### 2.8 RAG with citations

- **Grounding/annotation pattern (first-party):** attach retrieved chunks, require inline `url_citation` / `groundingSupports` spans, and **reject any answer lacking citations**. This is a validation gate, not a hope. — [Gemini Grounding docs](https://ai.google.dev/gemini-api/docs/google-search) (as above).
- **For NEPSE specifically the corpus is small and structured** (notices, disclosures, dividend proposals, financial reports from yonepse's `/data/notify/*` and `/data/company/*`). A BM25/keyword retrieval over that JSON + template rendering gets us most of the benefit of "RAG" with **zero model calls** — retrieval quality is what matters; generation can be templates.
- **Reality check:** even with search + EDGAR tools, best-in-class agents scored 46.8%. — [Finance Agent Benchmark, arXiv:2508.00828](https://arxiv.org/pdf/2508.00828v1). RAG narrows the hallucination surface; it does not eliminate it.

---

## 3. Convergence — Top 5 Highest-Leverage Reliable Approaches for Arthneetinepal

Ranked by *(user value) × (reliability) ÷ (effort)*, given: React SPA + Vercel serverless + Firestore, existing yonepse dependency, broken `api/news.ts` / `api/ai-news.ts` / `api/ai-digest.ts`, Hobby-plan constraints.

### #1 — Deterministic indicator engine in the client (replaces "AI analysis")
Compute RSI(14), MACD(12,26,9), Bollinger(20,2), SMA/EMA crossovers, volume/turnover spikes and candlestick patterns with **`technicalindicators`** over yonepse's `/data/ltp/monthly/*` and `/data/nepse_data.json`. Render as **numbers + neutral labels** ("RSI 62 — neutral-to-strong; no threshold crossed"), never as advice.
*Why:* ★★★★★ reliability, ~$0, works offline, directly serves the literacy gap documented by NRB (71.83% rely on friends/family) and the 63.83% literacy finding — a tool that *shows its arithmetic* is itself the educational artefact. Also immunises us from SEBON's advisory-licensing exposure by staying descriptive.

### #2 — Template + numbers NLG for sector news and the daily digest (fixes the broken AI news, permanently)
Replace the NVIDIA call in `api/news.ts` with a **rule-based narrative layer**: computed sector index change, top/bottom mover, turnover share, upcoming IPO/dividend events from `/data/notify/*` and `/data/proposed_dividend/*`, plus **scraped ShareSansar/Merolagani headlines with their URLs**. Templates have explicit branches ("up >2%", "flat", "down >2%", "no data") — the AP/Wordsmith model.
*Why:* output can't hallucinate a price; it ships with a citation (source headline) and a timestamp by construction; AP proved 12× volume with *fewer* errors than human copy. Effort: one template file + tests. This is the single highest-ROI fix for our most visibly broken feature.

### #3 — Scheduled batch generation + static/last-known-good caching (kills on-demand flakiness)
One **Vercel Cron** job per day (Hobby supports exactly this: 100 jobs, once/day, ±59 min, UTC — so schedule post-close, not at an exact bell) writes the digest/indicator snapshot to Firestore and/or a static JSON blob; GitHub Actions cron handles anything needing >5 min or a real browser. Client fetches are cached with an explicit **"as of <date NPT>"** badge, mirroring Simply Wall St's honest staleness language.
*Why:* turns N on-demand LLM/network calls per user into 1 call per day per feature; every failure becomes a *stale-but-labelled* page instead of an error. Combined with #1/#2 it means **the site renders fully even if every external API is down**.

### #4 — Tiered NEPSE data ingestion with health checks and graceful degradation
Formalise: **primary** yonepse static JSON (already integrated) → **secondary** ShareSansar/Merolagani-derived community JSON ([ShareSansarScraper](https://github.com/OmitNomis/ShareSansarScraper), [Nepse-All-Scraper](https://github.com/SamirWagle/Nepse-All-Scraper) jsDelivr CSVs, [yonepse](https://github.com/Shubhamnpk/yonepse) alternatives) → **tertiary** last-known-good cache. Surface a per-page data-health chip ("live / 2h stale / cached from 2082-…"), and **migrate off yonepse legacy endpoint paths before 2026-11-18**.
*Why:* 522s and SSL-bypassing scrapers are the norm here; single-source dependencies are what broke our AI features. Graceful degradation — the thing Simply Wall St encodes as a method fallback chain — is cheaper than any uptime we could buy.

### #5 — Optional, cited LLM enrichment behind a multi-provider chain (strictly last, never load-bearing)
If we reintroduce prose beyond templates: a provider chain **Groq → Cerebras → OpenRouter `openrouter/free` → Gemini**, OpenAI-compatible base URLs, exponential backoff on 429, **JSON-schema validation with automatic fallback to the #2 template output**, and (on Gemini) **grounding citations rendered inline**. No LLM output ever reaches the page uncited, unstamped, or unvalidated; no page waits on an LLM to render.
*Why:* free tiers are real but rate-limited and their model lists churn (Groq retired two models in Aug 2026). Chaining them converts "flaky" into "degradable". Given the PLOS ONE finding that confident-but-worse LLM advice *increases* user trust and portfolio risk, every item must carry: **source links, computed timestamp, "data as of", and a non-advisory disclaimer** — which is also the right posture under SEBON's stated plan to license investment advice.

---

### Appendix: explicitly unverified in this pass
- **TA-Lib** license/build requirements.
- **Koyfin, TIKR, Stock Analysis** intelligence-layer architecture (first-party pages not fetched).
- The **original NEPSE press release** URL (used a third-party reproduction) and the **original SEBON 2021 statement** (used secondary citation).
- **Nepal Living Standard Survey** internet-access figures (quoted via Gurkha Technology's report).
- **Sustained uptime** of any NEPSE third-party API (only a single 522 observation on `nepseapi.surajrimal.dev`).
- **fast-technical-indicators** benchmark claims (self-reported).
