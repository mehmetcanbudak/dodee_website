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

At 390 and 1512 pixels in reduced motion, and in each interactive state, the script
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
