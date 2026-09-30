# Design acceptance evidence — September 30, 2026

Status: **local visual review completed; exact Home parity and owner acceptance remain unconfirmed**. No design file or application styling was changed for this review.

## Reference availability

The historical [homepage audit](../FIGMA-HOME-AUDIT.md) identifies Figma file `pMTrEpUeEzi50akYrZOidM`, Home node `6:2`, with a 1512 × 3362 composition. A fresh read of that exact reference returned **“The provided node ID was not found in the file”** from both `get_design_context` and `get_screenshot`.

- Design-context diagnostic: `19f4ff10-3eb0-48fe-ac9e-6b5f249a70cc`.
- Screenshot diagnostic: `8ddbe6c0-06d1-46d5-a7e1-c4150bd8721a`; error code `INVALID_ARGUMENT`.
- File access itself works. `get_metadata` listed one top-level page, `222:264` **Design System**. Its subtree contains navigation, footer, buttons, inputs, social icons, a section, a section card, and a wave divider. It does not contain a Home composition or a mobile Home composition.

Read-only design-context responses with screenshots were successfully obtained for [desktop navigation `229:264`](https://www.figma.com/design/pMTrEpUeEzi50akYrZOidM?node-id=229-264), [open mobile navigation `431:2`](https://www.figma.com/design/pMTrEpUeEzi50akYrZOidM?node-id=431-2), [wave divider `343:4`](https://www.figma.com/design/pMTrEpUeEzi50akYrZOidM?node-id=343-4), and [section `236:264`](https://www.figma.com/design/pMTrEpUeEzi50akYrZOidM?node-id=236-264). These establish current component examples, not an approved replacement homepage.

The exact limitation is a missing recorded Home node, not a proven permissions failure. A current approved Home URL or owner-supplied export is needed to complete a full-frame comparison. No Figma owner signoff was obtained or inferred.

## Static homepage: current evidence

Reviewed `index.html`, `css/styles.css`, and the local Chromium screenshots at `test-results/static-browser/chromium/final/index-1440.png` and `index-390.png`. Those screenshots are the completed first audit's evidence and precede the subsequent content cleanup. The deterministic accessibility run blocked YouTube; its empty player rectangle is not evidence of a production playback failure.

| Area | Observed implementation and comparison | Acceptance boundary |
| --- | --- | --- |
| Brand and navigation | The static edition uses DynaPuff/Nunito, the supplied Dodee logo, the four primary navigation destinations and Watch Free. These agree with the available desktop/mobile navigation components at a content and styling level. | Full geometry was not compared against a current approved Home composition. |
| Hero | Artwork preserves its aspect ratio and remains clear of the copy in the reviewed desktop/mobile screenshots. Current CSS makes the hero viewport-relative, with a 1512px maximum inner frame and responsive repositioning. | The historical claim that `.hero__frame` uses `aspect-ratio:1512/868` is no longer true. Matching a fixed 868px reference at every viewport is not an implemented guarantee. |
| Follow rainbow | `.page-band--follow .rainbow-group` now has `z-index:0`, below the content card's layer `3`. The screenshot shows the rainbow through and behind the translucent card. | The historical “rainbow in front of the card” source defect is resolved. Exact placement requires the missing composition. |
| Other ornaments | Decorative art uses layer `2`, while cards use layer `3`. All band ornaments are hidden at widths up to 1024px. | These are deliberate readability/accessibility changes following observed content obstruction. Do not restore the historical foreground ornament layers or mobile clutter merely to match the old prose audit. Their visual adaptation needs owner acceptance. |
| Clue stars | Inline positions now read `top:-88px`, `252px`, and `-38px`, approximately matching the historical Figma coordinates. The lower star also retains `translateY(-1.5rem)`; artboard lift and rotation affect its final visible position. | The former systematic 80px source offset is no longer present. Source coordinates alone do not prove exact rendered alignment; the missing Home reference prevents a definitive overlay. |
| Wavy seams | Live component `343:4` is 1512 × 100 and shows a broad wave. Current CSS uses a 40–64px seam and a different, higher-frequency SVG path; the screenshot visibly has shallower seams. | This is a confirmed difference from the available component example, not proof that the current Home violates an approved composition. Resolve by accepting the adaptation or supplying the intended Home/wave asset. |
| Section cards | The live generic component uses a 720px card within a 1512px band. Current Home uses a 768px content column; the historical Home audit also recorded 768px. Both use rounded, light cards over colored bands. | The generic component does not establish that Home should be changed to 720px. Confirm intended component usage before changing layout. |
| Mobile composition | The reviewed 390px page keeps content and controls inside their cards; typography wraps, the hero uses a centered character, and decoration is removed from interaction areas. | There is an available mobile navigation component, but no approved mobile Home composition. Usability, physical-device acceptance and visual owner acceptance remain separate from this local review. |

## React edition: supplied design consistency

Reviewed `sites/dodee-next/app/page.tsx`, `app/globals.css`, shared components, and `test-results/react-browser/chromium-final/home-1440.png` / `home-390.png`. This is a separate supplied design with Fraunces/DM Sans, a cream background, an inset rounded hero, side-by-side desktop games, and a mint parent-preview section. It does not implement the available Figma static-site component system, and it should not be silently restyled to do so.

The reviewed screenshots show readable hero copy above the artwork, intact image proportions, a consistent rounded-card treatment, an explicit Watch action, single-column mobile content, and clear preview-only wording. On mobile, the tall hero means substantial scrolling before the next section; whether that supports the intended watch journey is a usability question, not an established defect. The desktop/mobile screenshots are local visual evidence, not a full Figma overlay, accessibility certification, or owner approval. Later content changes require a fresh final capture before publication acceptance.

## How to close this acceptance item

1. Identify which edition is intended for production and record its source revision and content state.
2. Supply a current approved desktop Home node/export and, if exact mobile parity is required, a mobile composition. Confirm whether the surviving Design System components are normative for that edition.
3. Capture the chosen edition at the reference's exact viewport width and height, with loaded fonts, images, intended motion state and content; retain the screenshot, viewport, browser, URL and revision together.
4. Compare hero geometry, wave shape/height, card widths and padding, ornament layers/positions, navigation states, and mobile adaptations. Separate intentional accessibility/content changes from unintended differences; get approval for the former and fix the latter.
5. Record the reviewer, date, accepted edition/revision, and any accepted deviations. Leave this item open until that evidence exists.

Representative parent/caregiver validation is prepared separately in [USABILITY-ACCEPTANCE.md](USABILITY-ACCEPTANCE.md). No real-user sessions have been run for this review.
