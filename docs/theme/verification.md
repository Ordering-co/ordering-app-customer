# Phase 9: verification

Date: 2026-11-02. Branch `feature/theming-native`. Schema `marketplace_app` 1.0.0.

## 1. Automatic checks

| Check | Command | Result |
|---|---|---|
| Schema valid | `pnpm theme:validate` | valid |
| Compiled file up to date | `pnpm theme:verify` | up to date |
| No design literal (every category, sizes included) | `pnpm theme:guard` | 0 literals, no baseline; exceptions with reasons in `theme-exceptions.json` |
| Every key has a reader | `keys.mjs` | 44 reported, all read through a variable (`docs/theme/readers.md`) |
| Extreme themes resolved as the API serves them | `pnpm theme:extremes` | 16/16 (square, pill, light primary, dark surfaces, no shadows, larger text, the 10 fonts) |
| Types | `npx tsc --noEmit` | 293 errors, all from before the conversion (349 at its start), none in theme code |
| Lint | `pnpm lint:check` | 0 errors |
| Tests | `pnpm test` | 263 suites, 1047 tests pass |
| The engine resolves in release bundles | `react-native bundle --dev false` (android, ios) | both build |
| Publish dry run | `pnpm theme:publish:dry --required` | **not run**: CI runs it against production with the `THEME_PUBLISH_KEY_PRODUCTION` secret |

## 2. Tests added for this phase

- Every catalog font has its four weight files in `src/assets/fonts`, the Android assets and
  `Info.plist`, and paints by its file (h1 bold file, weights snap to the nearest file).
- Extreme themes complete and every helper paints; theme motion is off when the theme turns it
  off or the system reduces motion.
- `scripts/theme/extremes.mjs`: themes resolved with the schema (as api-core does), completed and
  converted; runs in CI.
- Old binaries (cut down to a previous version): not applicable yet, 1.0.0 is the first version.

## 3. On device

Android emulator (API 37, Pixel-size phone), debug build, local API (`development` project, a
real account). The local API serves no `marketplace_app` theme, so the defaults paint.

| Screen | Result |
|---|---|
| Welcome, language sheet, login, signup, country sheet | OK |
| Addresses, listing, storefront, product rows | OK after fixes (Powered By overlap, React.Fragment style error, lost weights, section title size) |
| Orders, order details, profile, cart, multi checkout | OK |
| A served theme (purple primary, pill radius, Playfair Display + Nunito, tinted background) | Everything follows it without a rebuild |
| System text at 200 % | Content capped at 1.3×; the tab bar was fixed (labels capped, bar grows) |

Findings recorded, not changed:

- **Identity radius `full`** makes large boxes (cards, order card) oval and crops their content,
  as on the web (CSS does the same with a 9999 radius on a near-square box). Proposal for the
  editor: limit the Identity radius to `xxl`, or cap boxes in the engine.
- Multi checkout: "Customer Details" and "Delivery address" titles come from their own components
  and differ from the section titles (they differed before the conversion too).
- Once, right after a cold start in debug, the tab bar did not answer taps while the listing
  loaded; not reproduced afterwards.

## 4. Not verified

- **iOS**: no Xcode on this machine. Fonts are linked in the project and `Info.plist` (tested),
  but nothing was seen on iOS.
- Small phone (SE size), tablet, landscape, right-to-left.
- Reduced motion on device (the system setting is followed in code and tested).
- **Offline launch**: the debug build loads its bundle from Metro, so a cold start without network
  needs a release build. Cutting the network while running kept the listing on screen (no
  offline screen appeared). The cache of a served theme could not be seen on device because the
  local API serves no theme for this product; it is covered by tests.
- The publish dry run (needs the CI secrets).
