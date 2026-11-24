# Components — grouping by function (phase 2)

Date: 2026-11-02 · Status: D1–D4 decided (decisions.md); table awaiting the owner's approval (gate 2).

Inputs: [inventory.md](inventory.md), the area reports in [areas/](areas/), and the web
model `website-marketplace-theming/product.schema.json` (component names reused where the
function is the same, so the Dashboard editor speaks one vocabulary).

Rules applied: one function → one theme component → one code primitive; a variant stays
only when it changes structure, or differs in ≥ 2 properties outside tolerance and is used
in more than one place; everything else merges and its visible change is listed. `maweja`
is not a variant (deleted, decisions.md). Names follow `^[a-z0-9_]+$`.

Values (heights, radii, sizes, colors) are **not** decided here: they are phase 3. Where a
merge implies a value change, the column "Visible change" says which way it goes.

## 1. Primitives (owned by the main agent, converted first)

| Group today | Theme component | Code primitive | Axes kept | Merged / removed | Visible change |
|---|---|---|---|---|---|
| `OText` (884 uses), raw `<Text>` (10 files), `styled.Text` (29), `HeaderTitle` | — (typography tokens: `typography.<preset>`, color by role) | `OText` with `preset` + `color` role; family resolved to the weight's file | presets from phase 3 | `mTop/mBottom/…` margin props → spacing tokens; `'bold'`/`'normal'` → 700/400; 300 → 400 | System-font texts (buttons, tab bar, toast, sheet title, cookie banner, ~12 `styled.Text`) switch to the theme font; Android loses faux bold |
| `OButton` (110), `OIconButton`, `UIButton`, `SocialButton`, ~117 `styled.TouchableOpacity` acting as buttons, 5 place-order buttons | `button` | `OButton` (defaults in destructuring) + `IconButton` | `colors`: primary, secondary, danger, neutral, inverse · `appearances`: solid, outline, tonal, ghost · `sizes`: sm, md, lg · `shapes.icon` (square, round) · states pressed, disabled, loading | class map: `primary`/no class → solid primary; `secondary` → outline primary; `third` → ghost inverse; `fourth`+`alert` → tonal neutral; `active` → tonal primary; `mandatory` → tonal danger; unknown classes (`filters`, `classBtn`, `classBtn2`, `addressList`) resolved per call site; dead props (`imgRightSrc`, `bgColor`, `borderColor`) removed; `isDisabled`/`isLoading` wired | Height and radius unify to one `md` (see **D1**); disabled and loading states appear where they were ignored |
| `ModalCloseButton`, NavBar `BackArrow` (×2), floating icon buttons (×4), `SupportBubble` | `button` with `shapes.icon` | `IconButton` | — | 3 identical 30×30 boxes → one | None expected (same look) |
| Text links ("Forgot password", "View more", "See all") | `link` | `OLink` (new, thin over `OText` + `Pressable`) | `variants`: default, muted, danger | hand-made text touchables | Link color unifies |
| 9 vector-icon sets (~20 aliases), `OIcon` tinted PNGs | — (`icon.*` size tokens, color by role) | `Icon` wrapper (`name`, `size` level, `color` role) + `OImage` for pictures | — | `OIcon` split into icon vs image; `memo` bug fixed | `OIcon` default 18×16 → the theme's icon size (see **D3** for sets) |
| `OInput` (41), raw `TextInput` (8), `styled.TextInput` (3), `PhoneInputNumber` | `input` | `OInput` | `sizes`: md, code (OTP) · states focus, disabled, error · `slots.trailing_action` | baked `mb 20` removed; iOS shadow / Android 1 px border → one `shadow` level (runtime paints per platform) | Inputs unify height/radius (15 → scale); OTP boxes share one look |
| Field label + error text (3 color keys, several sizes) | `field` | `OField` (label, help, error) | — | error color → `danger` | Field errors turn red (today black: `danger5` undefined) |
| 3 OTP inputs | `input` size `code` | `OOtpInput` | — | 3 → 1 | Small (one box size) |
| 4 search inputs | `search_bar` (`inherits: input`) | `OSearchBar` | — | 4 → 1 | Search inputs share one look |
| `ODropDown` | `select` | `ODropDown` | — | chevron from `Icon` (today never shows) | Dropdown chevron appears |
| Checkbox / radio drawn with vector icons in one place and PNGs in another | `checkbox`, `radio` | `OCheckbox`, `ORadio` | states selected, disabled | PNG versions removed | Glyphs unify |
| Selectable cards/rows (2 in business, delivery options, order types) | `choice` | `OChoice` | `sizes`: sm, md · state selected | 5 selected styles in checkout → 1 | Selected style unifies |
| 2 quantity steppers (different icon sets) | `stepper` | `OStepper` | `sizes`: sm, md | 2 → 1 | Icons unify |
| Tabs: 3 business, 2 home, order tabs, login tabs | `tabs` | `OTabs` | `variants`: underline, pill | others merge into one of the two | Some tab bars change to the nearer variant |
| > 20 chip/pill styles (filters, categories, payment methods, tags, driver tips, address tags) | `chip` | `OChip` | `sizes`: sm, md · states selected, disabled | radius 8/15/30/50 → one | Pills unify radius and selected color |
| Counts, status labels, tags | `badge` | `OBadge` | `variants`: primary, neutral, success, warning, danger · `shapes.count` | — | See **D4** (order status) |
| Ribbon (3 styled versions, render copied 4×) | `ribbon` | `ORibbon` | — | 3 → 1 | Small |
| Favorite heart | `favorite` | `OFavorite` | — | — | None |
| Star ratings (summary) / review scales | `rating`, `rating_scale` | `ORating`, `ORatingScale` | `rating.sizes`: sm, md | — | None |
| `OToast` | `toast` | `OToast` (inside the theme provider) | `variants`: info, success, error | literal `#6ba4ff`/`#73bd24` → state colors; error = `primary` → `danger` | Error toast black → red (to approve in phase 3) |
| Notice boxes (3 components) | `alert` | `ONotice` | `variants`: info, success, warning, danger | 3 → 1; system `Alert.alert` stays out | Notices unify |
| `OModal` (38), raw `<Modal>` | `modal` | `OModal` | `slots.close` (icon button) | — | Modal header unifies |
| `OBottomPopup` (7), custom animated sheets, filter sheets | `sheet` | `OSheet` | `slots.close` | module-level `StyleSheet` → theme; raw `<Text>` title → `OText` | Sheet title gets theme font; `#ffffff` → surface |
| `ActivityIndicator` (13), overlay spinner | `spinner` | `OSpinner` | `sizes`: sm, lg | overlay library kept (third party), colored where it allows | Spinner colors unify |
| Skeletons (7 shapes home, 4 orders, 48 files) | `skeleton` | `OSkeleton` | — (color, radius global; sizes stay layout) | — | Skeleton color follows the theme |
| `NotFoundSource`, local empty wrappers | `empty_state` | `NotFoundSource` | `variants`: compact | — | None |
| Dividers 1 px, bands 2/4/5/8 px, 2 full-bleed gray | `divider` | `ODivider` | `variants`: item, section, band | 2/4/5 px → `section` or `band` | Band heights unify |
| Containers with bg/border/radius/shadow; 6 copies of one soft card shadow (radius 10/12/15); `CardAnimation` + `PressableScale` press | `card` | `OCard` (+ one press feedback) | `variants`: default · state pressed | 4 press behaviours → 1 (`pressed` from theme) | Card radius and press feedback unify |
| Progress bars (4 live, 1 dead SVG), free-delivery progress | `progress` | `OProgress` | `sizes`: sm, md | dead SVG bar removed | Bar color/height unify (`active` vs `primary` today) |
| Section titles (8 styles business, 5 sizes checkout) | `section_header` | `OSectionHeader` | `variants`: page | — | Titles unify size/weight |
| List rows: profile menu, saved cards (×3), wallets (×2), sessions, addresses, languages, help topics (4 row variants in account) | `list_row` | `OListRow` (leading icon, title, subtitle, trailing) | — | ~10 → 1 | Row height/padding unify |
| Profile photo | `avatar` | `OAvatar` | `sizes`: sm, md, lg | — | None |

## 2. App shell

| Group today | Theme component | Code primitive | Axes kept | Merged / removed | Visible change |
|---|---|---|---|---|---|
| `NavBar` (35), `HeaderTitle`, local headers, listing `BackArrow` | `header` | `NavBar` | `slots.back` (icon button), logo image key | `height 50` + padding contradiction, hand-made insets → safe-area inset | Header height becomes explicit (to measure on device) |
| Bottom tab bar | `bottom_nav` (the web's name) | `BottomNavigator` tab bar | — (active/inactive colors, icon size, label preset) | `black` @ 0.6 inactive → role color | Tab label gets theme font |
| `FloatingBottomContainer`, 5 place-order bars, view-order footer | `bottom_bar` | `OBottomBar` (safe-area inset) | `slots.action` (button lg) | hand-made `ios 20 / android 10` insets | MultiCheckout gets bottom padding on phones without home indicator |
| `SafeAreaViewWrapper`, `Container`, `SafeAreaContainer`, page `SafeAreaView` (6) | — (layout, `space.page_x` token) | `SafeAreaViewWrapper` | — | 4 → 1 | `Container`'s `ios 0 / android 20` padding unifies |
| Cookie consent | `cookie_banner` | `CookieConsentBanner` (inside the provider) | — | `bottom: 90` → tab bar height + inset | Banner gets theme font |
| Network error | `connection_status` | `NetworkError` | `slots.button` | — | None |
| Status bar | — (style derived from `color.background`) | `CustomStatusBar` (inside the provider) | — | — | None |

## 3. Feature components (`inherits: card` where they are boxes)

| Group today | Theme component | Variants kept | Merged / removed | Visible change |
|---|---|---|---|---|
| Business card: default, search row, map card, favorite card | `business_card` | `default` (vertical, header image) · `compact` (row: search, map) — see **D2** | favorite card → `default`; search row's duplicated rating removed; only 2 of 4 honor visibility today → all 4 will | Favorite and map cards adopt the shared look |
| Product card / row (2 systems, 3 photo fallbacks) | `product_card` | `default` | 2 → 1, one photo fallback | Product rows unify |
| Order card (4, two named `SingleOrderCard`), home "order in progress" | `order_card` | `default` · `compact` (home strip) | 4 → 2 layouts | Order cards unify |
| Promotions / coupon cards | `offer_card` | — | raw `styled.Text` → `OText` | Theme font on coupons |
| Home hero, page banner | `home_hero`, `banner` | — | — | None |
| Business types / categories on home | `business_types` (`slots.pill` → chip) | — | 5 home chip styles → `chip` | Category pills unify |
| Filters bar + sheet (search vs map, inconsistent values) | `filters` (`slots.chip`, uses `sheet`, `slider`) | — | 2 → 1; values unified (behavior fix, tracked separately) | Map filters look like search filters |
| Max slider (2 copies, one dead) | `slider` | — | 2 → 1 | None |
| Storefront header, info, action chips, social | `business_header` | — | business name shown twice → once | Small |
| Sticky category bar | `category_tabs` (`scope.tabs`) | — | — | None |
| Product options, ingredients, required/halves | `product_option` (`scope`: choice, checkbox, radio, stepper, chip, badge) | — | 2 selectable cards → `choice` | Option validation becomes visible |
| Bill rows (4 copies) | `bill` | — | 4 → 1 | Totals unify size/line |
| Cart, multi cart | `cart` (`slots.clear`) | — | — | None |
| Checkout, multi checkout | `checkout` | `multi` | `CheckoutSectionOrder` inlined out of the maweja file | None |
| Driver tips | `driver_tips` (chips) | — | — | Tip pills unify |
| Wallet balance / transactions, loyalty, cash wallet (byte-identical styles) | `wallet_balance`, `wallet_transaction` | — | CashWallet + LoyaltyPoints → one implementation | None |
| Gift cards | `gift_card` | — | — | None |
| Order details, multi-order details | `order_details` (`slots`: help, review, reorder) | — | — | None |
| Order status progress + driver | `order_tracking` (progress, badge) | — | 4 progress bars → `progress` | See **D4** |
| Review order / products / driver (3 near-identical) | `review_form` (`rating_scale`, chips, input) | — | 3 → 1 | Review screens unify |
| Chat (2 copies) | `chat_bubble` (`slots.send`) | — | 2 → 1 | None |
| Login, signup, forgot, verification, complete profile | `auth_form` (`slots`: submit, social, resend · `scope`: button, input, field, link, tabs, timer) | — | 3 reCAPTCHA rows → 1; 3 countdowns → `timer`; 3 verification modal hosts → 1 | None |
| Countdown | `timer` | — | 3 → 1 | None |
| Introductory tutorial | `tutorial` | — | hand-made buttons → `button` | Tutorial buttons get theme radius |
| Profile / account menu | `account_page` (list rows, avatar) | — | — | None |
| Student selector / checkout student details (school vertical) | `student_selector` | — | raw `styled.Text` → `OText` | Theme font |

## 4. Removed (dead or unused)

`OTextarea`, `OIconText`, `OKeyButton`, `OToggle`, `OAlertOriginal` (confirm the alias import
first), `DynamicProgressBar`, `OrderHistory`, `LastOrder`, `BusinessFeaturedController`,
`MomentSelector`, `BusinessMenuList`, the unreachable cities modal, the dead SVG progress bar,
the dead map slider, the dead saved-card row, and ~30 unused styled exports. Every
`maweja` folder and branch (52 files).

## 5. Decisions for the owner

| # | Topic | Options | Recommendation |
|---|---|---|---|
| D1 | Button default (`button.md`) | (a) the real common look: 44 high, radius ≈ 8, text 14 · (b) `OButton`'s built-in 60 high, radius 30, text 16 | (a): 52 call sites already override to it; the sites that keep the built-in look shrink |
| D2 | Business card | (a) `default` + `compact` (row for search and map) · (b) one layout everywhere | (a): the row is a different structure used in two places |
| D3 | Icon sets | (a) one `Icon` wrapper now, keep the 9 sets; reduce later · (b) reduce to 2 sets (Ionicons + MaterialCommunityIcons) during phase 7 | (b): the glyph change is small and halves the work of a later pass; list of replaced glyphs goes to review |
| D4 | Order status colors | (a) `badge` variants by status: pending/active → primary, completed → success, rejected/cancelled → danger · (b) keep one color for every status | (a): today cancelled orders look active |

## 6. Not verified

- Counts and look come from code reading (area reports); no screen was seen on a device.
- Which of the ~117 hand-made touchables are buttons and which are rows/cards is decided per
  call site in phase 7; the counts above are the scripts' candidates.
- `OAlertOriginal` imported under the `OAlert` alias: to confirm before deleting.

## 4. Primitives added after phase 7 (the web comparison and the full review)

| Primitive | Where | Reads | Replaces |
|---|---|---|---|
| `SectionTitle` | `shared/SectionTitle.tsx` | `section_header` (title, color, description, `margin_bottom`, `align`); a component's own title look through `text`/`color` | page section titles with their own preset and margin (help, profile, multi-order details, order it again, featured items, upselling, the listing) |
| `Skeleton` (`Placeholder`, `PlaceholderLine`, `PlaceholderMedia`) | `shared/Skeleton.tsx` | `skeleton.base.color` unless a screen passes one | an own placeholder library (the former third-party one drew its own grey) |
| `BusinessLogo` | `shared/BusinessLogo.tsx` | the host's size, radius, background and shadow; `placeholder.business_logo` on no URL or a failed one | a shadow set on the image itself |
| `PayMethodIcon`, `payBrandMark` | `PayMethodIcon/` | vector `cash-outline` / `card-outline`, bundled brand marks | three copies of `getPayIcon` and the cash/card PNGs |
| `RewardsBanner` | `RewardsBanner/` | `banner.variants.rewards`, `rating`, `wallet_balance.cash_icon_color` | the checkout's loyalty card (now points and cashback, as the web) |
| `suggestionLook` | `AddressForm/suggestionLook.ts` | `menu` (box, items), `list_row.divider` and subtitle color | three looks of address suggestions |
| `WalletBalance` icon, `WALLET_ICONS` | `CashWallet/WalletBalance.tsx` | `wallet_balance.icon_size`, `cash_icon_color`, `points_icon_color` | the wallet PNGs |
| `Tabs` group and slot | `Forms/Tabs.tsx` | the group's `slots.<slot>` (size, variant) and `scope.tabs` | a fixed variant per screen |
| `date_strip` days | `MomentOption`, `BusinessReservation` | `components.date_strip` | `choice` cards with a radio |
| `ModalCloseButton` / any `OButton` icon | `shared/OButton.tsx` | the button size's `icon_size` and the variant's ink for an `Icon` without its own | icons sized and colored by hand |

### Icons: one glyph per function (the web's)

| Function | Glyph (`set`) |
|---|---|
| Back | `arrow-back` (ion) · chevrons only to open (`chevron-down`) or go forward (`chevron-forward`) |
| Close / clear | `close` / `close-circle` (ion) |
| Edit / delete | `pencil-outline` (mci) / `trash` filled where the web's is filled (cart, addresses), `trash-outline` for saved cards (ion) |
| Add / remove (steppers) | `add` / `remove` (ion) |
| Radio | `radio-button-on` / `radio-button-off` (ion) |
| Chat / call | `chatbubble-ellipses-outline` / `call-outline` (ion) |
| Current location / map pin | `locate` / `location-outline` (`location-sharp` in the header) (ion) |
| Delivery, curbside, drive thru | `truck-delivery-outline`, `truck-outline`, `car-side` (mci) · pickup `bag-outline`, eat in `storefront-outline` (ion) |
| Address tags | `home`, `briefcase`, `heart-outline`, `pricetag` (ion) |
| Wallets | cash `coins` (fa5), points `heart` (ion) |
| Favorite | `heart` / `heart-outline` (ion) |
| Pizza halves | `circle-half-full` (mci, mirrored for the right half), `circle` for the whole |

