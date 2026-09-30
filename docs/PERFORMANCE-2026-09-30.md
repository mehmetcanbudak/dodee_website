# Performance and reproducible QA — 2026-09-30

**Final deployed homepage result:** three unblocked mobile runs scored 99, with median LCP 1.958 seconds, TBT 0 ms and CLS 0. All unchanged budgets pass after the click-to-load video fix. The earlier media failure and all samples are preserved below.

The static production site and the independent React alternative have separate QA packages and CI workflows. Both pin Playwright 1.63.0, axe-core 4.13.0 and Lighthouse 13.5.0. Node 24 is recommended (minimum 22.19). Workflow runners use Ubuntu 24.04, and uploads retain screenshots, browser reports, Lighthouse HTML/JSON and server logs for 14 days.

## Reproduce

Run `npm ci`, then `npm run browsers:install` in the repository being checked. `npm run test:browser` builds the site, starts an isolated local preview, runs the browser suite and stops that preview. Select `BROWSER_TYPE=firefox` for the static site or `BROWSER_ENGINE=firefox` for React; `webkit` is also supported. Linux CI installs OS dependencies with `npx playwright install --with-deps <browser>`.

`npm run perf` builds and measures the home and parent-guide pages three times each with cold browser sessions. The checked-in budget requires median score ≥85, LCP ≤3 seconds, TBT ≤300 ms, CLS ≤0.1 and transferred bytes ≤1.5 MB. `QA_PERF_ROUTES`, `QA_PERF_RUNS` and `QA_PERF_OUTPUT` select the routes, run count and evidence directory. The tool reports failures; it does not silently change the budget.

These are mobile lab measurements with Lighthouse default simulated Slow 4G/CPU throttling, not field Core Web Vitals or a physical-device test. The static runner and its CI performance job now allow all provider resources by default. `QA_PERF_INCLUDE_MEDIA=0` explicitly blocks YouTube for historical core-site comparisons; `QA_PERF_INCLUDE_MEDIA=1` explicitly enables the normal unblocked mode. The React runner retains its original default exclusion and uses `QA_PERF_INCLUDE_MEDIA=1` to allow providers. JSON records the mode and observed YouTube transfer. These measurements cover initial navigation without scripted video activation; clicking Play is verified separately. All modes retain the same budget.

For production, run `QA_PERF_ROUTES=/,/for-parents.html node scripts/performance.mjs https://dodee-website.vercel.app`. This connects directly to the deployed origin. Local static previews negotiate gzip for text assets. The React performance wrapper adds a streaming gzip proxy because Miniflare serves uncompressed text; this models expected CDN compression, and is explicitly labeled in the summary. It does not establish a deployed Cloudflare result. [Vercel CDN documentation](https://vercel.com/docs/how-vercel-cdn-works), [Cloudflare compression documentation](https://developers.cloudflare.com/speed/optimization/content/compression/).

## Static local core-site results before the video facade

The pre-facade three-run core-site summary is retained in [static-local-2026-09-30.json](performance/static-local-2026-09-30.json). Full Lighthouse reports remain in `test-results/performance/local-lab/` and hosted CI artifacts.

| Route | Median score | Median LCP | Median TBT | Median CLS |
| --- | ---: | ---: | ---: | ---: |
| Home | 98 | 2.330 s | 0 ms | 0.000 |
| Parent guide | 100 | 1.784 s | 0 ms | 0.000 |

Measured fixes:

- Navigation initializes synchronously after the header, before page content is parsed. The original mobile navigation transition caused CLS 0.197; the corrected diagnostic and final runs have CLS below 0.001.
- DynaPuff and Nunito are self-hosted, preloaded and licensed in `assets/fonts/`. Dodee's own page styles no longer request Google Fonts; the third-party YouTube player may load its own fonts. Original font files and OFL license texts are preserved.
- Responsive hero WebP variants are 49,720 bytes at 640 pixels and 88,812 bytes at 960 pixels. The 102,922-byte 1500-pixel variant and original PNG remain for larger displays/source preservation. Matching responsive preload and picture source sizes avoid downloading the full image for the mobile lab viewport.
- The local preview now negotiates gzip text compression, matching the kind of transport optimization normally provided by the production CDN. Earlier uncompressed preview scores are not directly comparable with these final compressed measurements.

`npm run assets:images` regenerates the committed responsive derivatives from the preserved PNG using Sharp 0.35.5. It is an optional authoring command; deployment builds do not need Sharp or any QA package.

## React local results

The uncompressed Worker preview baseline is retained separately in the independent React repository at `docs/performance/raw-worker-local-2026-09-30.json`, with full reports in `test-results/performance/raw-worker-preview/`. It measured median scores 72/78 and LCP 5.965/4.521 seconds (home/parent guide), with CLS and TBT zero. It transferred about 995/708 KB because local Miniflare did not compress text. These failures are preserved, not relabeled as deployment results.

The final three-run simulated-CDN summary is retained in the React repository at `docs/performance/simulated-cdn-local-2026-09-30.json`. It passes every unchanged budget. Source revision: db5cdface504a844706b6ebcd221bf8d6cfb6bc1. This is a local Worker preview behind the documented gzip proxy, **not a deployed React result**.

| Route | Median score | Median LCP | Median TBT | Median CLS | Median transferred bytes |
| --- | ---: | ---: | ---: | ---: | ---: |
| Home | 94 | 2.952 s | 0 ms | 0.000 | 362,069 |
| Parent guide | 96 | 2.565 s | 0 ms | 0.000 | 245,204 |

Home LCP samples were 2.968, 2.952 and 2.949 seconds. The preceding complete batch failed with a 3.021-second median (2.954/3.021/3.028); its summary remains in `docs/performance/near-miss-local-2026-09-30.json` and full reports in `test-results/performance/near-miss-640-hero/`. The passing result is a new complete batch after a source change, not a selected individual run. The 48 ms median margin is small; the same CI budget remains in place for future changes.

Measured React image fixes retain all original artwork: media-qualified cloud preloads deliver a 27,804-byte 1600-pixel background on narrow screens and a 47,382-byte 2400-pixel background on larger screens, replacing the 121,422-byte 4000-pixel delivery cost. The teaser has 480/800-pixel derivatives (45,032/100,000 bytes versus the 162,806-byte original). Corrected character `sizes` hints match the CSS layout; the mobile lab viewport now chooses the 36,554-byte 512-pixel candidate rather than the 49,720-byte 640-pixel one. Rendered dimensions, layout and original artwork are preserved. `npm run assets:images` rebuilds these assets.

## Static production baseline before the video facade

Measured directly at <https://dodee-website.vercel.app> after deployment `dpl_Bnmo92eyze1rzJHquVbTe2qxK7RT`, using three separate cold browser sessions per route. The production CDN cache state is not controlled. The [complete summary](performance/static-deployed-2026-09-30.json) retains every sample; full reports are in `test-results/performance/deployed-lab/`.

| Route | Median score | Median LCP | Median TBT | Median CLS |
| --- | ---: | ---: | ---: | ---: |
| Home | 98 | 2.267 s | 0 ms | 0.000 |
| Parent guide | 100 | 1.473 s | 0 ms | 0.000 |

All core-site budgets passed. Home LCP samples were 2.264/2.271/2.267 seconds; parent-guide samples were 1.395/1.473/1.473 seconds. These core-site measurements explicitly exclude YouTube startup; they are not scores for the page with all third-party resources enabled.

A separate [pre-facade full-media production observation](performance/static-deployed-full-media-before-facade-2026-09-30.json), with no blocked provider hosts or resources, scored 88 with LCP 2.096 seconds, TBT 422.5 ms, CLS 0.000063 and 1,484,008 transferred bytes. **It failed the unchanged 300 ms TBT budget.** YouTube-host resources alone transferred 1,009,434 bytes, and Lighthouse attributed most script evaluation to the embedded player. This is one lab observation, not a repeated median or field result. The failure is retained in `test-results/performance/deployed-full-media-before-facade/`; the successful core-site measurements do not erase it.

## Final unblocked production result

Release `2a0091d7227a62e676296438f5a4bd0ede3267f0` (facade source `ff748288`) was verified through successful GitHub production deployment `6767567153`, with immutable deployment URL <https://dodee-website-a65txfj1t-mehmetcan-budaks-projects.vercel.app>. The public alias's index, privacy page, stylesheet and media script matched the expected source bytes. Release/CI identity is retained in [release-ci-2026-09-30.json](deployment/release-ci-2026-09-30.json).

The [final production summary](performance/static-deployed-full-media-2026-09-30.json) records three new cold mobile runs against <https://dodee-website.vercel.app>, with **no blocked provider hosts or resources**:

| Route | Median score | Median LCP | Median TBT | Median CLS | Median transferred bytes |
| --- | ---: | ---: | ---: | ---: | ---: |
| Home, unblocked initial navigation | 99 | 1.958 s | 0 ms | 0.000 | 381,900 |

All unchanged budgets pass. Individual LCP values were 1.966/1.958/1.956 seconds, with score 99 and TBT 0 in every run. YouTube-host transfer was zero because the actual product now waits for Play before creating the iframe; the benchmark did not block the provider. Full reports are preserved in `test-results/performance/deployed-full-media/`.

Separate production browser checks confirmed zero third-party requests before activation, one Enter starting real playback, and keyboard pause working afterward. Lighthouse measures initial navigation without scripted playback activation; it does not claim that the external player has no cost after the user starts it. The earlier 422.5 ms TBT failure remains preserved as the measured reason for this change. The parent guide was unchanged, so its earlier three-run production result is retained rather than rerun.

No physical-device, assistive-technology, real-user or field Core Web Vitals claim follows from these automated lab checks.
