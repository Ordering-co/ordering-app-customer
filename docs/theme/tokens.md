# Tokens — unified scales and colors (phase 3)

Date: 2026-11-02 · Status: **approved** (gate 3, 2026-11-02; see decisions.md).

Source: the scripts re-run **without the maweja files** (`.theme-audit/nomaweja/`), plus the
color keys the code reads (`theme.colors.*`, counted with `grep`, maweja excluded). All
values are pt. Tolerances are the skill's (space/radius/icon/height ±2, motion ±60 ms).
Token names are the engine's fixed catalog (schema-format.md §4.1): no new tokens.

## 1. Space

The code is built on a 5/10 rhythm, not the catalog's 4/8. Fitting the levels to it keeps
the look and covers more uses.

| Level | Catalog | **Proposed** | Absorbs (uses) |
|---|---|---|---|
| none | 0 | **0** | 0, 1 (hairline offsets) |
| xxs | 2 | **2** | 2, 3 |
| xs | 4 | **5** | 4, 5, 6, 7 |
| sm | 8 | **10** | 8, 10, 12 |
| md | 12 | **15** | 13–17 |
| lg | 16 | **20** | 18–22 (20 is the most used value: 371) |
| xl | 24 | **30** | 28–32 |
| xxl | 32 | **40** | 38–42 |
| xxxl | 48 | **50** | 48–52 |
| `layout.page_gutter` | — | **20** | `paddingHorizontal: 20` on screens, `margins.horizontal` |

Visible changes: 8 → 10 (87 uses) and 12 → 10 (76 uses), 3 → 2 (18), 4 → 5 (34), 14 → 15,
16 → 15 (74), 24/25/26 → between `lg` and `xl` (≈ 50 uses: each decided in phase 7 by purpose,
default `xl`). Values ≥ 60 (60, 70, 80, 100, 120, 140, 150, 180) are layout offsets (space for a
floating bar, a map, a header image), not rhythm: recorded as layout exceptions per call site.

Rhythm rules: between page blocks `space.xl` (30); between form fields `space.md` (15);
inside components, a component property aliased to a `space` level.

## 2. Radius

| Level | Catalog | **Proposed** | Absorbs |
|---|---|---|---|
| none | 0 | 0 | 0–2 |
| xs | 4 | **4** | 3–6 |
| sm | 8 | **8** | 7.6 (85 uses), 8, 9 |
| md | 10 | **10** | 10, 12 — the Identity radius (R1): buttons, inputs, cards, modals follow it |
| lg | 15 | **15** | 13–16 |
| xl | 20 | **20** | 18–22, 23–25 |
| xxl | 30 | **30** | 28–30 |
| full | 9999 | 9999 | 50, 44, half the height |

Visible changes: 7.6 → 8 (+0.4, invisible in practice), 12 → 10 (26 uses), 23–25 → 20 (17
uses: social buttons, listing chips, map card).

## 3. Border

`thin` = 1, `thick` = 2. `0.5` (7 uses, BusinessReservation and dividers) → `thin`
(1 pt; slightly heavier). 4/5/6/8/10 (map pin rings, a promotions ring, a listing ring) are
decorative rings: recorded exceptions, reviewed in phase 7.

## 4. Sizes

Control heights (`size`) — the button default is `md` (D1):

| Level | Catalog | **Proposed** | Absorbs |
|---|---|---|---|
| sm | 32 | **32** | 28–36 (chips, small buttons) |
| md | 40 | **44** | 40–46 (buttons, search bars) |
| lg | 48 | **50** | 48–52 (inputs on auth, Apple button) |
| xl | 56 | **60** | 54–64 (bottom bars, `OInput` 55) |

Visible changes: 40 → 44 (36 uses: they grow 4 pt), 30 → 32 (25), 35/36 → 32 (18), 55 → 60
(`OInput`, 6). The touch target of anything tappable is ≥ 44 by the primitives (`hitSlop`
when the visual box is smaller).

Icons (`icon`): **sm 16, md 20, lg 24** (catalog values; they match the code). 12 (17 uses:
chevrons, small markers) → `sm` (+4) or an exception per site; 28–35 (≈ 30 uses: mostly
images or icons inside round tiles) → `lg` or the tile's own size, decided in phase 7.

## 5. Typography

Fonts: `font.heading` = `font.body` = **poppins**. Bundled weights 400/500/600/700, one file
per weight (decisions). `'bold'` → 700, `'normal'` → 400, 300 → 400.

| Style | Size | Line (ratio) | Weight | Today |
|---|---|---|---|---|
| h1 | 28 | 1.2 | 700 | 26–30 (6 uses) |
| h2 | 24 | 1.25 | 700 | 22–24 (16) |
| h3 | 20 | 1.3 | 700 | 20 (44): screen titles, modal titles |
| h4 | 18 | 1.3 | 600 | 18 (20) |
| body_lg | 16 | 1.4 | 400 | 16–17 (117); bold 16 keeps 700 by its own weight |
| body | 14 | 1.4 | 400 | 14–15 (202) |
| body_sm | 12 | 1.5 | 400 | 11–13 (297); `12/18` is the most common pair |
| caption | 10 | 1.3 | 400 | 10 (45), 8 (1) |
| label | 14 | 1.4 | 600 | 14 semibold/bold (15) |
| button | 14 | 1.2 | 600 | D1: button text 14 |

Notes:
- `display` is not used (the 60 pt rating number and the 40 pt verification number are
  component properties).
- Today most texts have **no** line height and take Poppins' natural metrics (~1.4–1.5). The
  ratios above keep that look; texts that will now get an explicit line height are a
  visible change to check on device.
- `utils.tsize` (xs 12 … xxxl 36) and `utils.typography` stay only as legacy keys derived from
  these styles until phase 8.
- Font scaling: `allowFontScaling` on, `maxFontSizeMultiplier` **1.3** on `OText` (one global
  rule). Search rows with fixed `getItemLayout` heights must then measure from the style.

## 6. Shadows

Today: one soft card shadow on iOS (`0 2 / radius 4 / 0.15`, ×21) with a **1 px
`rgba(0,0,0,.1)` border instead of a shadow on Android** (12 files), `elevation` 2–5 elsewhere,
`elevation: 99999` for stacking on the cookie banner.

| Level | x / y | blur | opacity (#000) | elevation | Today |
|---|---|---|---|---|---|
| none | — | — | — | — | — |
| sm | 0 / 1 | 4 | 0.10 | 1 | bottom wrapper (`0 -1 3 #00000010`), light cards |
| md | 0 / 2 | 8 | 0.10 | 3 | the soft card shadow (radius 4 ≈ blur 8) |
| lg | 0 / 4 | 12 | 0.15 | 6 | cookie banner (`0 4 10 .25`) |
| xl | 0 / 8 | 24 | 0.20 | 12 | modals and sheets |

Values are the web's (S2). Cards: `border` (default none) and `shadow` (default `sm`) are independent properties that follow the Identity knobs `border_style.width` (default none) and `shadow_style.size` (default sm); Android paints `elevation`, iOS the shadow. Visible change: iOS card shadow opacity .15 → .10; Android cards lose the 1 px border and get elevation. `elevation: 99999` → `zIndex` (not a shadow). Shadow color is part of the token.

## 7. Colors

Catalog colors the app uses (33). **Values are the web schema's defaults (C1, 2026-11-02)**; the right column lists the legacy keys and today's values they replace; `*_pressed`, `*_subtle`, `on_*` and
`*_text` are derived by the engine unless a value is given.

| Token | Value | Legacy keys it replaces (reads) |
|---|---|---|
| primary | #1E72E3 | `primary` (199), `secundaryContrast` |
| on_primary | #FFFFFF | `white` as text on primary |
| primary_subtle | derived | `primaryContrast` (6), `lightPrimary` (4) |
| secondary | #EFEFEF | `active` (88) |
| secondary_subtle | derived | — ; `activeContrast` (21) → `primary_subtle` |
| background | #FFFFFF | `backgroundPage` (46), `safeAreaColor` (undefined, 1) |
| surface | #FFFFFF | `white` as fill (most of 204), `backgroundLight`, `backgroundCard` (undefined, 11), `inputSignup` (undefined) |
| surface_alt | #F8F9FA | `backgroundGray100` (90), `inputChat`, `inputDisabled` #F7F7F7, `whiteGray` #F7F6F3, `businessHeaderPlaceholder` #EEF1F4 |
| overlay | #000000 at 0.4 (`alpha: true`) | sheet backdrop `#000000AA` |
| on_overlay | #FFFFFF | text over photos (tutorial, hero) |
| inverse_surface | #000000 | `backgroundDark` (7) |
| on_inverse | #FFFFFF | — |
| text | #000000 | `textNormal` (144), `textGray`, `colorPage` #333, `dusk`, `inputTextColor` (undefined), `black` as text |
| text_muted | #616161 | `textSecondary` (97), `textThird` #748194 (13), `backArrow`, `mediumGray`, `backgroundGray300` as text (19), `arrowColor` (undefined), placeholders |
| text_disabled | #B1BCCC | `disabled` as text, literal #B1BCCC |
| border | #E9ECEF | `border` (108), `backgroundGray200` (54) as line, `alert`, `inputBorderColor` #DEE2E6, `backgroundGray400` #CED4DA |
| border_strong | #909090 | `lightGray` (30), control borders |
| disabled | #CBCBCB | `disabled` (64) as fill, `secondaryContrast`, `backgroundGray` #CCCCCC |
| success | #00884F | `success500` (8), `green` #0CAD63, `success` #90C68E, `green500` (undefined) |
| success_subtle / on_success / success_text | derived | — |
| warning | #FFC700 | `warning5`, `editColor` #F2BB40 |
| warning_subtle | derived | `warning1` |
| on_warning / warning_text | derived | — |
| danger | #DA3453 | `danger` (25), `error` #C90800 (28), `red` #D83520, `cancelColor` #D81212, `danger5` (undefined, 30) |
| danger_subtle | derived | `dangerContrast` |
| on_danger / danger_text | derived | `danger5` and `error` as text → `danger_text` |
| info | #1E72E3 | toast info `#6BA4FF`, `skyBlue` (non-maweja uses) |
| on_info / info_subtle | derived | — |
| rating | #FFC917 | `star` (11) |
| favorite | #E63757 | heart (today `danger`) |

Mapping rules for phase 7: `white` and `black` (336 reads) are mapped **by role** at each site
(fill → `surface`, text on primary → `on_primary`, text → `text`, dark fill →
`inverse_surface`, line → `border_strong`). `clear`/`transparent` is not a color (exception).

Visible changes:
- **Palette (C1):** primary black → blue #1E72E3 (buttons, selection, tabs, links, progress, chat bubble); text #344050 → #000000; muted #858585 → #616161; inverse #484848 → #000000; overlay 0.67 → 0.4; disabled #D8D8D8 → #CBCBCB; success #00D27A → #00884F; danger #E63757 → #DA3453.
- `error` #C90800, `red` and `cancelColor` → `danger` #E63757 (slightly lighter red);
  `danger_text` derived for legibility.
- `textThird` #748194 → `text_muted` #858585 (very close gray).
- `success` #90C68E (pale) and `green` #0CAD63 → #00D27A.
- Texts reading `danger5`, `backgroundCard`, `arrowColor`, `colorTextTutorial`… that paint
  nothing or black today get their role's color (error texts and borders turn red).
- Toast: info #6BA4FF → `info`, success #73BD24 → `success`, **error black → `danger`**.
- Unselected tab text `disabled` #D8D8D8 → `text_muted` (more legible).

Literals that stay as exceptions (`theme-exceptions.json`): WhatsApp bubble `#25D366`
(third-party brand), social login buttons (Google/Apple/Facebook brand), Stripe/Square/
WebView payment UI, map styles. The language pill `#003B2C` and the dead SVG progress
(`#E31837`/`#016491`) are **not** exceptions: the pill becomes `primary`, the SVG is deleted.

## 8. Motion, opacity, z-index

- Motion: **fast 120, base 200, slow 300**, easing ease_out (the web's) (navigation 200–250 → base, toast fade 300 →
  base/slow, 350 → slow). Reduced motion respected by the runtime.
- Opacity: **pressed 0.85** (the web's; today 0.7 ×21, 0.8 ×12, RN default 0.2), **disabled 0.5**, **scrim 0.4** (sheet backdrop, = `overlay`; today 0.67).
- `PressableScale`'s 0.97 scale is a property of `card` press feedback, not a token.
- z-index is not themed: the 15 values collapse into a small app constant (layers: base,
  sticky, overlay, toast) as code, not schema.

## 9. Decisions for the owner

| # | Topic | Options | Recommendation |
|---|---|---|---|
| C1 | Which look the defaults reproduce | (a) the bare `theme.json` look: `active` stays green #21BC9E → `secondary` · (b) the look apps have today with a served theme: `active` → `primary` black, `activeContrast` → `primary_subtle` | (b) if production apps all receive a served theme today (then they already look black); (a) otherwise |
| S1 | Space scale | (a) fitted 0/2/5/10/15/20/30/40/50 · (b) catalog 0/2/4/8/12/16/24/32/48 | (a): reproduces the 5/10 rhythm |
| S2 | Android shadows | (a) real `elevation` from the shadow token (Android cards get a shadow instead of today's 1 px border) · (b) keep the 1 px border on Android | (a): one token, both platforms; the border trick is a platform hack |
| S3 | Control `md` height 44 | 36 uses at 40 grow to 44 | Accept (D1 already chose 44) |

## 10. Comparison with the web schema (`website-marketplace-theming/product.schema.json` 1.0.0)

| Topic | Web | App proposal | Note |
|---|---|---|---|
| Colors: roles | selection/brand = `primary`; `secondary` = neutral gray (#EFEFEF, on #000) for secondary buttons; `*_subtle`, `*_pressed`, `*_text`, button `ink` derived (`mix 0.12`, `shade -0.07`, `legible 4.5`/`5.5`) | same model | `active` → `primary` (like the web); `activeContrast` → `primary_subtle` |
| Colors: values | primary #1E72E3, text #000, text_muted #616161, border_strong #909090 (≥ 3:1), success #00884F, danger #DA3453, info #1E72E3, rating #FFC917, disabled #CBCBCB, overlay rgba(0,0,0,.4) | today's app values (primary #000, text #344050, muted #858585, border_strong #D2D2D2…) | see **C1** |
| Card border and shadow | `card.base.border` (`$type: border`, default `null` = none, `follows: border`) and `card.base.shadow` (default `{shadow.sm}`, `follows: shadow`), independent; Identity `border_style.width` = none, `shadow_style.size` = sm | same model | both optional and independent per component, plus the global Identity knobs |
| Shadow levels | sm 0/1/4 .10 e1 · md 0/2/8 .10 e3 · lg 0/4/12 .15 e6 · xl 0/8/24 .20 e12 | sm 0/1/3 .10 e1 · md 0/2/8 .15 e3 · lg 0/4/20 .25 e8 · xl 0/8/32 .25 e16 | see **S2** |
| Identity radius | `border_style.radius` = md: every box follows one level | app boxes differ today (buttons 8, cards 10–15, inputs 15) | default `null` ("each element's own") to reproduce the look |
| Motion | 120/200/300, easing ease_out | 120/250/350 | app's are within ±60 of the web's |
| Opacity | disabled 0.5, pressed 0.85 | disabled 0.5, pressed 0.7 | |
| Typography | display…caption, button; no body_sm; poppins not default (montserrat/archivo) | adds body_sm 12 and caption 10; poppins | the app's 10 pt texts need a level |
| Platforms | `mobile_web` | none (phone only) | |
| Visibility / images / pages | 198 dotted keys (`header.logo`…), 40 images, 26 pages with sections | phase 4 | reuse the web's names where the piece is the same |

## 11. Not verified

- Line heights: today's natural Poppins metrics were not measured on device; ratios are from
  the theme.json presets and the explicit pairs (`12/18`, `16/24`).
- Role assignment of `white`/`black` per site is deferred to phase 7 (by hand).
- Whether every production app receives a served theme today (C1) — not checked in the API.
