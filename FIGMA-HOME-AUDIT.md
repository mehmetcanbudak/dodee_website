# Homepage vs Figma “Home” frame — audit

**Figma file:** `pMTrEpUeEzi50akYrZOidM`  
**Home frame node:** `6:2` (1512×3362)  
**Code:** [index.html](index.html), [css/styles.css](css/styles.css)

---

## 1. Frame resolution

| Item | Figma | Implementation |
|------|--------|------------------|
| Home artboard | `6:2`, 1512×3362, Nav 52px + main | Matches full-page structure |
| 1512 content width | All sections 1512-wide | `max-width: 1512px` on [`.hero__frame`](css/styles.css), [`.page-band__artboard`](css/styles.css) |
| 768px column | Container x=372 in Home | `--center-x: calc(50% - 24rem)` → 372px at 1512px (768px column) |

**Hero only:** `6:7` (1512×868) per design tree under `6:6` → `6:4` body.

---

## 2. Hero (`6:7`)

Source: Figma `get_design_context` for node `6:7` and metadata.

| Element | Figma (exact) | Code | Match |
|--------|---------------|------|--------|
| Frame | 1512×868 | [`.hero__frame`](css/styles.css) `aspect-ratio: 1512 / 868` | Yes |
| Background | `#faf6f0` + full-bleed image | `background-color: var(--bg)` + `hero-bg.jpg` `cover` | Yes |
| Character “Dodee” | `left: 433px`, `top: 227px`, `647×647` | [`.hero__character`](css/styles.css) ~28.64% / 26.15%, `max-width: 647px` + % width | Yes (same as comment in [index.html](index.html) L45) |
| Copy card | `left: 44px`, `top: 700px`, `412×110`, `r: 30px`, `rgba(255,255,255,0.85)` | [`.hero__content`](css/styles.css) ~2.91% / 80.64%, `min-height: 6.875rem` (110px), `border-radius: 1.875rem` (30px) | Yes |
| Eyebrow / lines | 16px, tracking, DynaPuff 24px lines | [`.hero__content .hero__eyebrow`](css/styles.css) / [`.hero__tagline`](css/styles.css) | Aligned to tokens |

**Z-order (hero):**

- Code: [`.hero__character`](css/styles.css) `z-index: 0`, [`.hero__content`](css/styles.css) `z-index: 1` — **copy always paints above** the character where they overlap.
- Figma export lists layers as background → empty `6:9` → card `6:11` → image `36:1207` (character **after** the card in DOM). Rely on **z-index** in Figma, not only order; the asset is a single flat `hero-characters.png`, so the important requirement is the **text card readable above** the art — **implementation matches the intent** (see image description: info box in front).

**Gaps (hero):** None on spacing/sizes; responsive `@media (max-width: 40rem)` in [`.hero__frame`](css/styles.css) reflows to centered character + copy — no separate Figma “mobile home” in this file’s `get_metadata` slice.

---

## 3. Page bands (teaser → follow)

Figma `get_metadata` node positions are per **section** (1512 wide); HTML positions are in [`.page-band__artboard`](index.html) (also 1512). `--center-x` = 372px at full width.

### 3.1 Teaser (Figma `6:22` → `6:23` container + instances)

| Decor | Figma (section space) | HTML inline style (approx. px) | Match |
|-------|------------------------|----------------------------------|--------|
| star L | `(-339, -44)` w ~115 | `center-x - 340`, `64 - 45` | ~1px |
| star R | `(992, -44)` | `center-x + 991`, same top | ~1px |
| SUN | `(-263, -15)` 191×188 | `center-x - 264`, `64 - 16` | ~1px |
| note2 | `(-293, 199)` | `center-x - 294`, `64 + 198` | ~1px |
| plush | `(807, 97)` 300×414 | `center-x + 806`, `64 + 96` | ~1px |

`6:30` video placeholder: 694×137 in Figma; [`.teaser-embed__inner`](css/styles.css) targets **137px** min-height — consistent.

**Z-order (bands, general):** Figma: UI instances (stars, etc.) are **siblings after** the main `Container` in `6:22` — ornaments **above** the frosted card. Code: [`.wrap`](css/styles.css) `z-index: 1` (`--z-sec-content`), [`.sec-decor`](css/styles.css) `z-index: 2` — **same intent**.

---

### 3.2 Color game (Figma `6:65`)

| Decor | Figma | HTML | Match |
|-------|-------|------|--------|
| cloud | `(16, 81.58)` 332×215 | `16`, `81.5` | Yes |
| heart | `(1341, 33.58)` ~108×97 | `100% - 171` = 1341, `33.5` | Yes |

**Gaps:** None on placement.

---

### 3.3 Mystery clue (Figma `6:90`)

| Item | Figma (absolute in section) | HTML [index.html](index.html) L122–126 | Notes |
|------|----------------------------|------------------------------------------|--------|
| Star 24 / center-bottom | `175, 251.77` | `175, 172` | **Y differs ~80px** (Figma lower on canvas) |
| Star 25 / top-left | `95, -88.23` | `95, -168` | **Y differs ~80px** |
| Star 26 / top-right | `1223, -38.23` | `100%-289, -118` | **Y differs ~80px** |
| note1 | `1222, 144.85` | `100%-290, 145` | Match |
| “?” group `14:98` | `(-45, -96.15)` rel. container | `center-x - 46`, `64 - 97` | ≈ match vs container-anchored Figma group |

Figma: [`.sec-decor--rotate`](css/styles.css) `rotate(-27.69deg)` — matches Figma “star2” use.

**Gap:** Three **star2** instances: **systematic ~80px vertical offset** between Figma metadata and the live HTML. Likely a mismatch between (a) Figma’s section origin vs (b) the “artboard” + padding/wave, or an outdated handoff. **Worth a visual check** in the file at zoom 100% for `6:90`.

---

### 3.4 Launch (Figma `6:131`)

| Decor | Figma | HTML (launch section) | Match |
|-------|-------|------------------------|--------|
| bell (Group 12) | `(+48, +33.3)` in container 6:133 | `center-x + 48`, `64 + 33` | Yes |
| heart | `(687, -22.68)` | `45.437%`, `-23` | Yes |
| LEAF | `(1062, -40.68)` | `100% - 450`, `-41` | Yes |
| note3 | `(1280, 107.32)` | `100% - 232`, `107` | Yes |
| note4 | `(1369, 287.32)` | `100% - 143`, `287` | Yes |

**Gaps:** None on the listed decors.

---

### 3.5 Follow (Figma `6:150`)

| Item | Figma | HTML | Match (position) |
|------|-------|------|-------------------|
| Rainbow group | `Group 14:314` ~`left 367`, w~779, h~353, `top ~1.45` | [`.rainbow-group`](index.html) `50% - 389`, 779×353, `top: 1px` | Yes (`756 - 389 = 367` on 1512px artboard) |
| SUN | `(39, -152.55)` | `39`, `-153` | Yes |
| note2 | `(1305, 84.45)` | `100% - 207`, `84` | Yes |

**Z-order (Follow) — important:**

Figma **layer order** in `6:150` (first → bottom, last → top in default painting):

1. `14:314` **rainbow** (Group 51)  
2. `6:151` “Text” (wavy top strip)  
3. `6:152` **Container** (768 frosted block + “Follow Dodee’s World” + icons)  
4. `14:334` **SUN**  
5. `19:534` **note2**  

So in the design, **the frosted card is above the rainbow**; **sun and small note** are **above the card**.

Code: every [`.sec-decor`](css/styles.css) and [`.rainbow-group`](css/styles.css) uses **`z-index: 2`**; [`.page-band__artboard .wrap`](css/styles.css) uses **`z-index: 1`**. So **all** decors, **including the rainbow**, paint **on top of the card**.

| Expected (Figma) | Current CSS |
|------------------|-------------|
| Rainbow **behind** the section card | Rainbow **in front of** the card (wrong) |
| SUN + note **in front of** the card | SUN + note in front of the card (correct) |

**Gap (follow / z-index):** **Give the rainbow a lower z-index** than `.wrap` (e.g. `z-index: 0` on `.rainbow-group` only) **or** split stacking so only sun/note stay at `2`. This is the main **intentional-design mismatch** found in this audit.

---

## 4. Section spacing & waves

- **Figma** sections use a **64px** top offset for the 768 `Container` and a **“Text”** strip ~`-63` / `64` height in several sections (wavy top).
- **Code:** [`.section`](css/styles.css) `padding-block: clamp(2.5rem, 7vw, 4rem)`; [`.page-band.section`](css/styles.css) adds bottom padding for [`.page-band--*::before`](css/styles.css) wave; wave is **data-URL SVG**, not a separate Figma image export — **behavioral match**, not 1:1 with every pixel of the wavy path.

**Gap:** If proof is needed, **overlay the Figma wavy `Text` path** on a screenshot; path shape may differ slightly from the `::before` curve.

---

## 5. Footer vs main (`6:2` structure)

- Figma: **Footer** `65:64` at `y: 3217`, height **145**; **Home** total height 3362.
- Code: [`.site-footer`](css/styles.css) `z-index: var(--z-footer)` = **10**; [`.page-band--follow`](css/styles.css) = **6**, with comment that footer must sit **above** follow decors in overlap.
- **Match:** Footer stays visually above any overlapping rainbow bleed when scrolling; **necessary in code** even if the rainbow is later fixed to sit under the follow card.

---

## 6. Global z-index (reference)

| Layer | z-index (approx.) |
|--------|--------------------|
| Skip link | 200 |
| [`.site-nav`](css/styles.css) | 100 |
| [`.page-band--*`](css/styles.css) | 2–6 (later section on top) |
| [`.section__inner` content via `.wrap`](css/styles.css) | 1 in artboard |
| [`.sec-decor`](css/styles.css) | 2 in artboard |
| [`.site-footer`](css/styles.css) | 10 |

---

## 7. Summary — gaps and actions

1. **Follow / rainbow z-index** — Figma: rainbow **behind** the frosted card; **site: rainbow in front**. **Action:** lower z-index for `.rainbow-group` (or equivalent) so only **sun** and **note2** sit above the card.  
2. **Clue / star2 vertical positions** — **~80px** systematic delta vs Figma `get_metadata` for the three stars. **Action:** confirm in Figma at 100% zoom; if design is source of truth, add ~80px to `top` (less negative) for those three stars.  
3. **Wavy seam** — implementation uses CSS `::before`; Figma may differ slightly in curve — only adjust if a pixel-perfect match is required.

Everything else in this pass (hero, teaser, color game, launch, most follow ornaments, 1512/768 system, band stacking order 2–6) **aligns** with the **Home** frame and existing comments in the repo.

---

*Generated from Figma MCP `get_metadata` (file root `0:1`) and `get_design_context` (`6:7`), cross-checked to [index.html](index.html) and [css/styles.css](css/styles.css).*
