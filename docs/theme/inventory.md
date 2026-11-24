# Inventory — ordering-app-marketplace (phase 1)

Date: 2026-11-02 · Branch `feature/theming-native` · Code reading only (no simulator run).

Sources:

- Scripts (`.theme-audit/`, gitignored): `inventory.json/.csv`, `scales.md`, `components.md`,
  run on `src` excluding `src/@/` (logic submodule).
- Area reports (detail with `file:line`, values today, function and proposal):

| # | Area | Report |
|---|---|---|
| 1 | Theme today, providers, fonts, icons, shared primitives | [areas/1-global-primitives.md](areas/1-global-primitives.md) |
| 2 | Home, listings, search, map, offers, favorites | [areas/2-home-listings.md](areas/2-home-listings.md) |
| 3 | Business storefront, product, preorder, order types, upselling | [areas/3-business-product.md](areas/3-business-product.md) |
| 4 | Cart, checkout, multi-cart, wallets, cards, gift cards, loyalty, students | [areas/4-cart-checkout.md](areas/4-cart-checkout.md) |
| 5 | Orders, order details, reviews, messages, help, notifications | [areas/5-orders.md](areas/5-orders.md) |
| 6 | Auth, profile, addresses, languages, sessions, tutorial, network error | [areas/6-auth-account.md](areas/6-auth-account.md) |

Decisions taken before the inventory are in [decisions.md](decisions.md) (no v1 map, `maweja`
removed, phone only, no dark mode).

## 1. Starting metrics

| Metric | Value |
|---|---|
| Design literals (scripts) | 5 562 in 362 files |
| — space / size / font size / radius / font weight | 1 791 / 1 240 / 758 / 489 / 406 |
| — color / border / line height / shadow parts / opacity | 226 / 205 / 176 / 119 / 75 |
| Inline `style={{` | 1 031 |
| `StyleSheet.create` | 92 |
| Hard-coded `fontFamily` | 12 |
| `Platform.OS` / `Platform.select` | 165 |
| Files with `maweja` | 52 |
| Distinct colors / families | 53 / 35 |
| Catalog fit: radius / font size / border / space / icon / control height | 96 % / 91 % / 92 % / 73 % / 74 % / 56 % |
| Color keys read but not defined | ~10 (`danger5` ×30, `backgroundCard` ×11, `secundary`, `colorTextTutorial`, `safeAreaColor`, ProjectForm ×4…) |
| Screens | 45 registered (5 tabs, 32 home stack incl. `Home`, 7 root; `Home` counted once) + page files not registered (BusinessesListing, BusinessListingSearch, Checkout, ForgotPassword, Splash, SpinnerLoader, NotFound, ProjectForm, Promotions, Wallets); all covered by an area report. The script's "99" adds 51 page files and 48 navigator entries, which overlap |

## 2. The theme today

- `src/theme.json` holds tokens (`utils.tsize`, `typography`, `radius` l/m, `margins.horizontal`,
  `colors`), a dead `layouts` tree (a copy of another brand's web layout, lines 248–774, never
  read) and an `images` block overwritten by `TemplateApp.tsx:63`.
- The served theme is requested in `first_load` without `theme_version` (v1). The submodule's
  `createMergedTheme(isApp: true)` copies served keys at the root and **keeps the local colors**:
  merchant colors never reach the app. The app's `themeUtils.js:161-165` then swaps `active` →
  `primary` and `activeContrast` → `lightPrimary` when a served theme exists, so the app has two
  looks (green `active` without a served theme, black with one).
- The merge loses the category "all" image (`categoryAll` vs `all`) and writes
  `general.notNetwork` while NetworkError reads `general.noNetwork`.
- **Two providers:** the outer `ThemeProvider` has the local theme; `UpdatedThemeProvider` the
  merged one. The status bar, toast and cookie banner sit outside the inner one.
- **Fonts:** Poppins Thin/Light/Regular/Medium/SemiBold/Bold bundled. Text uses
  `'Poppins-Regular'` + `fontWeight` (faux bold on Android); `'Poppins'` (7 uses) does not exist
  on Android; buttons, tab bar, toast, sheet title, cookie banner and ~12 raw `styled.Text` use
  the system font. Thin/Light are never named in code (weight 300 used twice).
- **Icons:** 9 vector-icon sets under ~20 import names, plus tinted PNGs; checkbox/radio drawn
  with icons in one place and PNGs in another.
- **React 19 ignores `defaultProps`:** `OButton` gets no class in 81/110 uses; `OIcon` paints
  18×16 instead of 26×26. `OButton`'s built-in look (60 high, radius 30) is mostly overridden;
  the common real button is 44 high, radius 7.6. Call sites pass props it ignores
  (`isDisabled`, `isLoading`, `imgRightSrc`, `bgColor`, `borderColor`) → no loading/disabled
  state on those buttons.

## 3. Served v1 keys that stop applying (no v1 map)

About 60 `…components.….hidden` flags (`business_listing_view`, `business_view`, `checkout`,
`orders`, `confirmation`, `profile`, `bar_menu`, `address`), the `app_design` layout switch,
and images (header logo, home hero, splash per density, offline image), plus the input text
color. Several are already dead today (read but never applied: 7 in `BusinessBasicInformation`,
3 in orders). `business_view…cart…discount.hidden` hides discount rows while the total still
counts them: it must **not** come back as a visibility key. Full lists with readers are in each
area report; phase 4 decides which become v2 visibility keys.

## 4. Patterns across areas (input for phase 2)

| Pattern | Copies found | Areas |
|---|---|---|
| Buttons (hand-made touchables, place-order bars, floating icon buttons) | `OButton` 7 classes + 4 unknown; 5 place-order bars; 4 floating icon buttons | all |
| Chips / pills / choice chips | ≥ 20 styles (5 home, 6 business, 5 checkout, 4 auth) with radius 8/15/30/50 | 2,3,4,6 |
| Business card | 4 layouts (default, search row, map card, favorite) — only 2 honor hide flags | 2 |
| Product card / product row | 2 systems, 3 photo fallbacks | 3 |
| Order card | 4 (two named `SingleOrderCard`) | 5 |
| Progress bar | 4 live + 1 dead SVG (`#E31837`/`#016491`) | 5 |
| Bill rows / totals | 4 copies with different sizes and lines | 4,5 |
| Section titles | 8 styles in business, 5 sizes in checkout | 3,4 |
| Separators | 1 px lines, 2/4/5/8 px bands, 2 full-bleed gray | 3,4,5 |
| Tabs | 3 styles in business, 2 in home, order tabs | 2,3,5 |
| Inputs / search inputs | 5 radii in checkout, 4 search looks | 2,4,6 |
| OTP input, countdown, verification modal | 3 each | 6 |
| Quantity stepper | 2 with different icon sets | 3 |
| Ribbon | 3 styled versions, render copied 4× | 2,3 |
| Card shadow | 3 shadow systems; 6 copies of one soft card shadow (radius 10/12/15) | 2,6 |
| Skeletons | 7 (home) + 4 (orders) shapes | 2,5 |
| Alerts / notices | 3 components | 6 |
| Review screens | 3 near-identical | 5 |
| Chat UI | 2 copies | 5 |
| Filters bar and sheet | 2 with inconsistent values (fees, currency, units) | 2 |
| Saved-card rows / wallet rows / payment chips | 3 / 2 / 2 | 4 |
| Field error text | 3 color keys (one undefined), several sizes | 6 |

Radius 7.6 appears in ≥ 27 places; radii in use go 4 → 50 with ~13 distinct values.

## 5. Screens: containers, candidate sections, layout constraints

Candidate sections per screen are in the area reports. Constraints found:

- **Business storefront:** the sticky category bar's index is hard-coded
  (`(professionals ? 3 : 2) + (freeDelivery ? 1 : 0)`, `BusinessProductsListing/index.tsx:632`)
  and the scroll-spy uses fixed offsets: sections above the bar cannot be hidden or moved until
  the index is computed from the visible sections (phase 6).
- **Business listing:** all blocks in one `ListHeaderComponent` fragment, no sticky headers: safe
  to hide and move. Search rows use fixed `getItemLayout` heights (larger fonts will clip).
- **Checkout:** `CheckoutSectionOrder` lives in a maweja file but drives the original checkout;
  inline it before deleting. Not hideable: address, payments, bill, errors, place-order bar;
  driver tips, coupon and comments only when the server field is not required; customer block
  only for signed-in users.
- **Login / Signup / Forgot** also render inline in five bottom tabs.
- Nested scroll views: Signup, ProfileForm, AddressList, Sessions, MyStudents, Languages, Help,
  HelpOptions, Notifications. OrderDetails ends with ~300 pt of empty scroll.
- Hand-made platform insets (`ios ? 35 : 10` style) in headers and bottom bars; MultiCheckout's
  bar has 0 bottom padding on phones without a home indicator.

## 6. Images

- `home-hero.png` 1760×3824, 12.1 MB; six tutorial slides 18 MB together. Now JPEG (`home-hero.jpg` 1288×2800 and the slides, 3.5 MB together; `docs/PERFORMANCE.md`).
- Four API images requested smaller than painted (business logo, product card, tags,
  description); product page and upselling photos load the original.
- Keys read but missing: `images.general.mapPin`, `theme.images.drop_down` (wrong path: the
  dropdown arrow never shows), category "all" with a served theme.
- 14 `images.order.status*` PNGs are bundled and never painted. Gift cards at prices other than
  5/10/25/50/100 show the $5 image. Sessions' empty state shows the listing "not found" image.

## 7. Maweja (to delete)

52 files: `Home/layouts/Maweja`, `OrderDetails/layouts/Maweja` and branches in OrderDetails,
Signup (`embedded`), UserFormDetails/UserDetails (`mawejaCheckout`), checkout and listings.
Each report lists the lines. Two behaviors are tied to it: guest checkout is blocked under
maweja (flattening re-enables it for those apps) and the original checkout's section order lives
in a maweja file.

## 8. Bugs found that are not theming

Tracked here so they are not mixed into the conversion; each needs its own issue/decision.

- Routes that do not exist: `MessageDetails` (MultiOrdersDetails), `Wallets` (`Checkout:466`);
  `BusinessPreorder`, `Splash`, `SpinnerLoader`, `NotFound` registered or present but never
  reached.
- Storefront product search, nearby businesses strip and search overlay are commented out.
- Option validation errors invisible (`bgcolor` vs `bgColor`; `color` on a View).
- Special-comment placeholder white on white; add-to-cart button without text for a signed-in
  user without address; social icons never get `business`.
- `hide_business_contact_customer_app` applies only in Checkout and MultiOrdersDetails.
- Chat quick messages fall back to "Lorem ipsum 1–4"; ReviewDriver's title says "Review
  Product"; Notifications blank when either of two profile flags is set.
- Search hint says 2 characters, code needs 3; the map card's pickup row shows `service_fee`;
  order card falls back to the literal "Coffee Shop"; untranslated "Powered By Orderingplus" and
  "No languages available.".
- CashWallet and LoyaltyPoints blank while loading; Add card button never disables.
- **Square uses a hard-coded test URL and location ID.**
- Dead code: `OrderHistory`, `DynamicProgressBar`, `LastOrder`, `BusinessFeaturedController`,
  `MomentSelector`, `BusinessMenuList`, the cities modal, ~30+ unused styled exports.

## 9. Not verified

- Nothing was run on iOS or Android: no screenshots, no painted sizes measured, NavBar height
  and safe-area behavior read from code only.
- `node_modules` is not installed: whether Metro resolves `styled-components` and
  `styled-components/native` to one context was not checked.
- Sticky category bar behavior when a business has no categories (inferred from code).
- Deep links outside `src/` that might reach `BusinessPreorder`.
- Conditional states were inventoried by reading branches (signed in/out, empty, loading,
  error, order types); none was seen on a device.
