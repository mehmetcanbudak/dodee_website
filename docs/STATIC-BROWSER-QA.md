# Static site browser verification

The site has no production JavaScript package dependencies. Browser QA uses the
pinned Playwright and axe-core development dependencies in the root lockfile.

```sh
npm ci
npm run browsers:install
npm run test:browser
BROWSER_TYPE=webkit npm run test:browser
BROWSER_TYPE=firefox npm run test:browser
```

The wrapper builds and starts an isolated local preview, then closes that preview.
For an already running preview, use `SITE_URL=http://127.0.0.1:8082 node scripts/check-static-browser.mjs`.
`PLAYWRIGHT_MODULE` and `AXE_MODULE` optionally select existing installations.

Defaults: bundled Chromium, all eight pages, widths 320, 390, 768, and 1440,
both normal and reduced motion. `BROWSER_TYPE` (`chromium`, `firefox`, `webkit`),
`BROWSER_CHANNEL` (for example `chrome`), `QA_WIDTHS`, `QA_MOTIONS`, and `QA_ROUTES`
(comma-separated page names without `.html`) can override these.
Use `QA_RUN_NAME` to keep a named run alongside the default `latest` results.
Use `QA_WIDTHS=320,390,768,1512` for the desktop design review reference size.

## Coverage

The audit saves JSON, screenshots, 200% text and WCAG text-spacing screenshots
under ignored `test-results/static-browser/<browser>/<run-name>/`. It checks:

- All route/width/motion combinations for document overflow and axe A/AA violations.
- Actual text bounds and vertically clipping ancestors at 200% root font size and
  with 1.5 line height, .12em letter spacing, .16em word spacing, and 2em paragraph spacing.
- Open mobile menu, selected episode filter, and correct/incorrect game feedback.
- No-JS navigation; collapsed-menu focus exclusion; Escape focus restoration;
  actual About-link navigation; breakpoint changes; episode visibility; color-game feedback.
- Live changes to reduced motion and no running decorative animations when reduced.
- Local fonts loading with the site's native CSP and no external typography requests.

The 320-pixel viewport also exercises the reflow width corresponding to a
1280-pixel desktop viewport at 400% page zoom. The separate root-font resize test
is a text enlargement test, not a claim that physical-device/browser zoom was operated.

## Contrast evidence

Axe cannot resolve every background image, translucent surface, or decorative
pseudo-element. These findings remain in `incomplete`; they are never silently
converted to automated axe passes.

At 390, 1440, and 1512 pixels in reduced motion, and in each interactive state, the script
also samples rendered backgrounds behind those text nodes. It temporarily suppresses
text paint with `-webkit-text-fill-color: transparent` while preserving text layout,
backgrounds, computed colors, and decorative artwork. A screenshot is decoded in a
browser canvas; every pixel in each text rectangle is compared with the computed
foreground color (including opacity). The lowest ratio must meet 4.5:1, or 3:1 for
large text. Results include the worst pixel and its location. This conservative
check exposed two actual low-contrast colors during the audit; both were corrected.

This is evidence for the tested rendered text and states, not a blanket WCAG
certificate. It does not audit text baked into images, every pointer hover/focus
combination, or third-party player UI.

## Boundaries

Axe injection uses a separate context that bypasses CSP. The interaction smoke
uses native CSP. The YouTube iframe is blocked only for deterministic accessibility
checks. Real playback is a separate network-dependent check: successful metadata
lookup or an iframe load alone is not proof of playback, captions, or keyboard operation.

Set `QA_MEDIA=1` for the optional real-network teaser check. It saves `media.json`
and a screenshot, activates playback with Enter, checks advancing video time,
inspects caption controls/tracks, and tests the player's keyboard pause. English
and Turkish play-button labels are supported. Missing captions are reported
separately from successful playback; third-party UI or regional/network changes
may require a manual follow-up.

Inspect screenshots and the JSON findings in addition to the exit status. Browser
emulation is not physical-device testing, VoiceOver/NVDA validation, Figma approval,
or proof of the deployed production version. A failed browser process launch is
an environment failure, not a site pass.

## Results recorded on 2026-09-30

The final site was served locally with the deployed CSP configuration, including
`font-src 'self'`. All eight routes were covered at 320, 390, 768, and 1512 pixels,
with both normal and reduced motion.

| Engine | Route/motion checks | Interactive axe states | Text size/spacing | Outcome |
| --- | ---: | ---: | --- | --- |
| Pinned Chromium, macOS | 64 | 4 | All 8 pages | Zero axe violations/overflow; native interaction smoke passed |
| Pinned WebKit, macOS | 64 | 4 | All 8 pages | Zero axe violations/overflow; native interaction smoke passed |
| Firefox 155, Linux ARM64 | 64 | 4 | All 8 pages | Full suite passed, including native fonts, navigation, and contrast |

Chromium and WebKit then repeated all eight routes at 390/1512 pixels and all four
interactive states after the final contrast and test-helper corrections; both runs
exited successfully. Each engine checked 259 incomplete-contrast text samples.
The lowest sampled small-text ratios were 4.60:1 in Chromium and 4.54:1 in WebKit;
all samples met their applicable thresholds. Axe's original incomplete findings
remain available alongside these measurements.

Three actual contrast failures found by the rendered-background check were fixed:
the streak numeral (4.42:1), archived campaign lead (4.15:1), and desktop follow
lead over the rainbow (4.29:1). The enlarged-text checks also prompted a wrapping
fix for the episode channel link and reading-width improvements. The real mobile
About-link test exposed a focus-event timing bug that was fixed in navigation.

Evidence directories:

- `test-results/static-browser/{chromium,webkit}/completion-final/`: 64-route/motion
  matrix, interaction and text evidence before the last contrast correction.
- `test-results/static-browser/{chromium,webkit}/completion-contrast/`: final successful
  16-route plus 4-state contrast regressions, text checks, and native interaction smoke.
- `test-results/linux-firefox-final/static-browser/firefox/linux-final/`: successful
  final Linux Firefox matrix and all additional checks.

The final desktop/mobile visual references are the Chromium
`completion-contrast/index-1512-reduce.png` and `index-390-reduce.png`. The earlier
reduced-motion desktop image in `completion-final` had a screenshot paint artifact
after the temporary contrast probe; it is superseded. Normal visual captures now
happen before that probe. A WebKit test-helper false positive from still-painted
link underlines was also corrected without changing link appearance in the site.

The macOS Firefox process failed before site navigation, both with the prior
runtime and pinned runtime/profile alternatives. The official Playwright Linux
container supplied the successful Firefox result; this does not claim macOS
Firefox or physical-device acceptance.

### Real teaser result

`test-results/static-browser/chromium/completion-final/media.json` records real
playback and keyboard pause under native security headers. A further keyboard
caption probe is saved in `test-results/static-browser/media-caption-key.json`
and its screenshot: Enter started playback, video advanced to 4.40 seconds of
81.62 seconds, and `k` paused it at 10.41 seconds. Pressing `c` changed captions to
On and selected the provider's English automatic track. YouTube reported
`is_servable: false`; no caption segments rendered during the observation.

Therefore playback and keyboard activation/pause are verified. Caption delivery,
transcript accuracy, and a publisher-reviewed caption track remain unverified;
metadata or a selected CC toggle must not be described as successful captioning.
No VoiceOver, NVDA, physical-device, or manual audio-description acceptance is claimed.

### Production smoke

The focused check against `https://dodee-website.vercel.app` at 18:06 UTC on
2026-09-30 passed. The actual mobile About link navigated successfully; both local
font families loaded under the deployed CSP; episode filters showed 1, 2, and 3
cards; incorrect and correct color-game feedback worked; no page errors occurred.
The response included the expected CSP, frame denial, MIME protection, referrer,
permissions, and HTTPS transport headers.

The real YouTube player started with Enter and advanced to 2.02 seconds of
81.62 seconds; `k` paused it at 7.05 seconds. English automatic-caption metadata
was present, but no caption segments rendered. This run's `c` toggle ended Off,
so it provides no additional evidence of successful caption delivery. The caption
limitation above remains open.

Evidence is saved in `test-results/static-browser/production-smoke/smoke.json`
and `media.png`; the screenshot was visually inspected. This focused deployed
check supplements the complete hosted browser suites; it does not repeat them.
A durable summary is saved at
`docs/deployment/production-browser-2026-09-30.json`.

### Click-to-load player follow-up

The homepage now uses a local artwork preview and a native Play button. It makes
no third-party requests before activation, including preconnects. Enter or Space
loads the privacy-enhanced player and moves focus to its frame; the direct teaser
link stays available, including without JavaScript. The reserved 16:9 box keeps
the same dimensions when the preview is replaced. Privacy copy describes this
on-demand loading behavior.

The focused Chromium and WebKit runs in
`test-results/static-browser/{chromium,webkit}/facade/` both passed: the homepage
at 390/1512 pixels; five interactive axe states including the focused Play button;
rendered-text contrast; 200% text and text spacing; no-JavaScript fallback; zero
initial third-party requests; and keyboard activation, frame focus, and unchanged
preview dimensions. The enlarged-text check caught a clipped two-word visible
label during development; the final button shows Play and retains the accessible
name “Play teaser,” with padding that fits enlarged text.

Both engines also played the real teaser after a single Enter on the facade,
without an additional provider Play action, and paused with `k`. Caption metadata
was present but its control was unavailable during the probe, so caption delivery
remains unverified. See each run's `media.json` for the distinct network playback
result.

The final `teaser-390-reduce.png` and `teaser-1512-reduce.png` screenshots in the
Chromium `facade` directory were visually inspected: artwork, visible Play label,
provider notice, and direct video link are legible with no clipping. Full-page
screenshots are saved alongside them. These local results supersede the earlier
eager-iframe behavior; the production smoke above predates this follow-up.

### Final deployed facade check

At 18:54 UTC on 2026-09-30, after release of merged source
`2a0091d7227a62e676296438f5a4bd0ede3267f0`, the focused production check passed
against the public alias. The preview made zero third-party requests and contained
no iframe before activation. A single Enter loaded the player, transferred focus
to its frame, and preserved the preview's dimensions. Real playback advanced to
2.00 seconds of 81.62 seconds, then `k` paused it at 7.02 seconds.

Mobile About navigation, local fonts under the deployed CSP, filter counts,
color-game feedback, and security headers passed again, with no page errors.
English automatic-caption metadata remained available but no caption segments
rendered; the probe ended with CC Off. Caption delivery and quality remain
unverified.

The visually inspected production screenshot and raw report are
`test-results/static-browser/production-facade/media.png` and `smoke.json`.
The durable `docs/deployment/production-browser-2026-09-30.json` now records this
final check and identifies the earlier smoke as superseded. No application source
was changed during this production verification.
