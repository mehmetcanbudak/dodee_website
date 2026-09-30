# Linux Firefox verification — 2026-09-30

This records a completed local Linux Firefox check of the static baseline before
the later click-to-load YouTube facade, and an incomplete React verification
attempt. It is separate evidence from hosted GitHub Actions, production deployment,
physical devices, and assistive-technology testing. The current static facade and
final React build are not covered by the completed run recorded here.

## Runtime and isolation

- Docker Desktop server: 29.8.1, Linux arm64.
- Official image: `mcr.microsoft.com/playwright:v1.63.0-noble`.
- Image digest: `sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27`.
- Node.js inside the image: 24.20.0; Playwright: 1.63.0; Firefox: 155.0;
  axe-core: 4.13.0.
- Disposable `--rm` containers, with 1 GiB shared memory. Only the four QA scripts,
  a small TCP-proxy runner, and the installed `playwright`, `playwright-core`, and
  `axe-core` JavaScript packages were copied into a task-owned temporary directory
  and mounted read-only. No host credentials or application source were mounted.
- A separate results directory was mounted writable. Existing unrelated containers
  and images were left alone.

The application servers remained on macOS. Two container-local TCP proxies mapped
`127.0.0.1:8080` to `host.docker.internal:8082` (static), and `127.0.0.1:4173` to
`host.docker.internal:4173` (React). TCP forwarding preserved the original localhost
Host header, so the React preview's allowed-host protections remained unchanged.

## Results

| Check | Result |
| --- | --- |
| Static pages: eight routes, four widths, normal and reduced motion | 64 combinations passed; zero axe violations or horizontal overflow |
| Static interactive accessibility | Four states passed: open menu, selected filter, incorrect answer, correct answer |
| Static rendered contrast | 259 text samples passed their applicable contrast threshold |
| Static text customization | All eight routes passed 200% text and WCAG text-spacing checks |
| Static native-CSP functionality | Local fonts, actual mobile About navigation, Escape/focus restoration, filters, game, no-JS fallback, breakpoint changes and dynamic motion preference passed |
| Current static click-to-load video facade | Not covered by this earlier baseline; requires current-build browser evidence |
| Final React Firefox browser suites | Unverified: Linux runtime became unavailable and the fresh macOS Firefox fallback failed before page creation |

The complete static baseline suite exited 0 in 115.1 seconds. Its native-CSP context
used the preview headers from that run; axe injection used a separate diagnostic
context with CSP bypass. The site's own typography was verified on the videos page
before the later homepage visit loaded the independent YouTube frame. That eager
frame has since been replaced by a click-to-load facade; the evidence above must
not be presented as verification of that later change.

## Commands and evidence

The container runner was configured with the following commands, using
`PLAYWRIGHT_BROWSERS_PATH=/ms-playwright`,
`PLAYWRIGHT_MODULE=/qa/node_modules/playwright/index.mjs`, and
`AXE_MODULE=/qa/node_modules/axe-core/axe.min.js`:

```sh
BROWSER_TYPE=firefox SITE_URL=http://127.0.0.1:8080 QA_RUN_NAME=linux-final \
  node /qa/static/scripts/check-static-browser.mjs
BROWSER_ENGINE=firefox BROWSER_RESULTS=/results/react/smoke \
  node /qa/react/tests/browser-smoke.mjs http://127.0.0.1:4173
BROWSER_ENGINE=firefox A11Y_RESULTS=/results/react/axe \
  node /qa/react/tests/browser-a11y.mjs http://127.0.0.1:4173
BROWSER_ENGINE=firefox ACCESSIBILITY_RESULTS=/results/react/accessibility \
node /qa/react/tests/browser-accessibility.mjs http://127.0.0.1:4173
```

The static command completed successfully. The superseded initial React smoke run
completed with 51 of 53 functional checks passing; its axe run was interrupted and
its accessibility/reflow command was not reached. No complete React suite ran
against the final application changes. The three React commands above remain the
required rerun: 53 smoke checks, 23 axe audits, and 35 accessibility/reflow checks.

Container invocation used `docker run --rm --shm-size=1g`, the pinned image above,
the read-only input mount at `/qa`, the writable evidence mount at `/results`, and
`node /qa/run.mjs static` or `node /qa/run.mjs react`.

Local evidence is retained under the ignored `test-results/linux-firefox-final/`:

- `input-manifest.json`: SHA-256 identities of the exact copied QA scripts.
- `run.mjs`: the proxy and sequential-command runner used for this check.
- `static-summary.json`, `static-full.log`, and
  `static-browser/firefox/linux-final/audit.json`: runtime, headers, command exit
  status, assertions, pixel samples, and adjacent screenshots.
- `font-probe.json`: both first-party font requests returned 200 and both font
  families were loaded in Firefox.
- `nav-source-proof.json`: tested static build matched the navigation source.
- `initial/`: the superseded first attempt, retained rather than overwritten.

The fresh macOS fallback evidence is in
`test-results/firefox-macos-final/preflight.json` and `profile-root.txt`.

## Final environment boundary

After the successful Linux static run, the Docker API socket at
`~/.docker/run/docker.sock` disappeared. A subsequent React container invocation
and a read-only `docker version` check failed because the socket was absent.
`docker desktop status` did not return a usable readiness result. The requested
read-only desktop UI check was interrupted and supplied no state, so this report
does not infer whether Docker displayed a dialog or was still starting. Shared
Docker services were not restarted, reset, or otherwise changed, and unrelated
containers and images were left untouched.

One bounded macOS fallback was then attempted with freshly downloaded Firefox
155.0, Playwright build 1543, under `/private/tmp/dodee-playwright`, Node.js 24.21.0
on arm64, and a newly created task-only `TMPDIR`. The unsandboxed launch had a
20-second timeout and exited immediately with `Could not find profile folder`.
No page was created. No further macOS retries were made.

Final React Firefox acceptance therefore remains explicitly open until a usable
Linux runtime or hosted CI can execute the current build. Earlier 51/53 smoke
results are superseded evidence, not a pass for the final React implementation.

## Issues exposed and verification limits

The first static attempt reached every route and interactive accessibility state,
then revealed a test portability issue: Firefox returns quoted font-family names.
Both fonts were actually loaded. The current test normalizes those quotes. The
rendered-background probe also hides underline paint, avoiding false 1:1 samples
against the text's own decoration.

The first React attempt reproduced the narrow-homepage overflow subsequently fixed
by explicitly constraining the teaser width. Firefox also reported canceled
speculative GET requests containing `_rsc` as `NS_BINDING_ABORTED`; the smoke test
now classifies that exact cancellation alongside the existing Chromium/WebKit
equivalents. Other failed requests remain failures.

These checks do not certify full WCAG compliance, screen-reader operation, physical
devices, browser-menu zoom, provider media captions, or hosted-CI success. Text
enlargement and viewport reflow are explicitly simulated. Third-party playback is
covered by a separate network-dependent test, not by this run.
