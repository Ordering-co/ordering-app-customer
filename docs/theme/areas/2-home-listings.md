# Area 2 — Home and listings

Phase 1 inventory, read-only. **Code reading only: no simulator was run**, so no
screenshot, painted size or state below has been checked on a device (see "Not verified").
Paths are relative to `src/ui/src/components/` unless they start with `src/`. The logic
submodule (`src/@/`) is excluded except where its merge decides what this area paints.

Scope: landing `Home` (signed out), `BusinessesListing` (Home tab, signed in), Browse tab
(`BusinessListingSearch`), `BusinessSearchMap`, Offers tab (`Promotions`), `CouponOffers`,
`Favorite`, and their children (`HeaderContent`, `OrderProgress`, `PageBanner`,
`HighestRatedBusinesses`, `BusinessTypeFilter`, `BusinessController` and its card
variants, `BusinessHeaderPlaceholder`, `FavoriteList`, filters, skeletons).
Only the `original` design is inventoried; the `maweja` code is listed under "To delete".

Area metrics (48 non-test files): 191 inline `style={{`, 10 `StyleSheet.create`
(all inside render: they see the theme but are rebuilt every render), 15 `Platform.OS`
branches, 9 `Dimensions.get`, 70 `size={N}` literals, 820 rows in
`.theme-audit/inventory.csv`. Raw colour literals: `#000` ×8 (iOS shadows),
`rgba(0,0,0,0.1)` ×3 (Android fake shadow border), `#e8e8e8`, `#DEE2E6`, `#F8F9FA`,
`#F0F0F0` (fallback), `rgba(0,0,0,0.28)`, `rgba(255,255,255,0.45)` (maweja).

---

## 0. Theme facts that change what this area paints

| Fact | Where | Effect here |
|---|---|---|
| When a served theme exists, the app merge sets `colors.active = colors.primary` and `colors.activeContrast = colors.lightPrimary` | `src/@/components/src/utils/themeUtils.js:161-165` (`createMergedTheme`, `isApp`) | Every `theme.colors.active` in this area (selected category, progress bar, filter chips, ETA text, map selection, coupon tab…) paints **`#000000`**, not the `#21BC9E` in `theme.json`; every `activeContrast` paints **`#F5F9FF`**, not `#D6FFF7`. The look without a served theme (green) and with one (black) differ. |
| The served theme is spread at the root (`...orderingTheme.theme`) | same file `:158` | This is how `business_listing_view`, `homepage_view`, `app_design` reach the components below. |
| Category images merge reads `theme.images.categories.categoryAll/categoryFood/…` | `themeUtils.js:61-66` | `TemplateApp.tsx:196-198` only defines `categories.all`. With a served theme and no served category image, `categories.all` becomes `undefined` and `food/groceries/alcohol/laundry` too → `BusinessTypeFilter` loses its fallback icon (`BusinessTypeFilter/index.tsx:82`). |

**Keys read in this area but not defined** (paint nothing / fall back to a literal):

| Key | Read at | Today |
|---|---|---|
| `colors.backgroundCard` | `OrderProgress/styles.tsx:7`, `OrderProgress/OrderCard.tsx:48` | undefined → `colors.white` fallback |
| `utils.radius.s` | `BusinessController/styles.tsx:108` | undefined → literal `4` (radius only has `l`=10, `m`=5) |
| `images.general.mapPin` | `BusinessSearchMap/index.tsx:135` | undefined → markers without a logo get no icon |
| `images.categories.<slug>` other than `all` | `BusinessTypeFilter/index.tsx:82` | undefined → `all` (and see merge bug above) |
| `images.dummies.businessHeader` | `BusinessController/index.tsx:99-102` | defined as `''` (`TemplateApp.tsx:201`) → always the placeholder |

**Served (v1) flags, images and switches read in this area — they stop applying** (decision: no v1 map):

| Path | Reader | Function |
|---|---|---|
| `homepage_view.components.homepage_header.components.image` | `Home/index.tsx:40` (and again via `general.homeHero` merge, `themeUtils.js:37`) | Landing background |
| `business_listing_view.components.highest_rated_business_block.hidden` | `BusinessesListing/Layout/Original/FlatListBusinessListHeader.tsx:47`, `HighestRatedBusinesses/index.tsx:130` (read twice) | Hide "Top business" |
| `business_listing_view.components.categories.hidden` | `FlatListBusinessListHeader.tsx:48` | Hide category row (listing only; Search and Map ignore it) |
| `business_listing_view.components.business.components.{fee,time,distance,favorite,offer,header}.hidden` | `BusinessController/index.tsx:93-98`, `BusinessController/BusinessSearchCard.tsx:80-85` | Hide pieces of the business card (the Search tab row `BusinessListingSearch/index.tsx:310-448` ignores all six) |
| `business_view.components.header.components.dummy_image` / `.logo.dummy_image` | merge `themeUtils.js:83-84` → `dummies.businessHeader/businessLogo` | Card header and logo fallbacks |
| `business_listing_view.components.not_found_source.components.image` | merge `themeUtils.js:39` → `general.notFound` | Not read by `NotFoundSource` in this area (it uses an Ionicon) |
| `app_design.components.layout.type` | `src/utils/appDesign.ts:16` via `Home/index.tsx:67`, `BusinessesListing/index.tsx:14` | `maweja` switch — to delete |
| Business types `image` (API data, not theme) | `BusinessTypeFilter/index.tsx:76,145` | Category icon |

---

## 1. Screens: root container and blocks in render order

### 1.1 Landing `Home` (signed out only) — `src/pages/Home.tsx` → `Home/index.tsx`
Mounted by `HomeNavigator.tsx` only when `!auth`. Root: `BackgroundImage`
(`ImageBackground`, cover, full screen) → `SafeContainer` (View, `space-between`). **No scroll.**
1. Language selector (`LanguageSelector`, `Home/index.tsx:88-90`) — hideable.
2. Title (3 OText runs, white, size computed from screen height and locale length, `Home/utils.tsx`) — hideable / text key.
3. Buttons: Log in (primary), Sign up (`secondary` + white border), Guest (`third`, only if `guest_checkout_enabled`). Hidden while `orderState.loading`.

### 1.2 Business listing (Home tab, signed in or guest) — `src/pages/BusinessesListing.tsx`
`BottomNavigator.tsx:142-145`: shown when `auth` (or account state) **and** an address is set; otherwise `AddressList`. Root: `SafeAreaViewWrapper pt disableScrollView` → `FlatList` (`FlatListBusinessListing.tsx:56-101`), **no `stickyHeaderIndices`**: everything scrolls. Pull to refresh. Mounted only after first load (`BusinessesListing/index.tsx:90`).

`ListHeaderComponent` (`FlatListBusinessListHeader.tsx`), in order:
1. `PoweredBy` (auth only, `:52`) — platform flag, untranslated literal "Powered By Orderingplus" (`PoweredBy/index.tsx:15`).
2. **Header row** (`HeaderContent.tsx:120-208`): address pin (tinted, warning colour when far away) + address text + caret → AddressList/AddressForm; cart button with badge.
3. Far-away popover (`HeaderContent.tsx:209-216`, `AddressAlertPopover.tsx`) — behaviour, black bubble.
4. **Order controls** (`HeaderContent.tsx:218-285`): order-type pill, moment pill (only if preorder enabled), map pill (→ `BusinessSearchMap`). Animated collapse (220 ms).
5. `ListWrapper` (padding 20, `backgroundLight`):
   a. **Order in progress** (`OrderProgress`) — skeleton / card / nothing.
   b. **Page banner** (`PageBanner position='app_business_listing'`) — skeleton / pager / nothing.
   c. **Top business** (`HighestRatedBusinesses`) — hidden when served flag, `businessId` or `franchiseId`.
   d. **Categories** (`BusinessTypeFilter`) — hidden when served flag or `businessId`; chips, or icon cards (1 or 2 rows) when any type has an image.
   e. "All business" title (`OText preset="sectionTitle"`) — hidden when a category is selected.
   f. Empty state (`NotFoundSource`).
6. `OModal` cities + `CitiesControl` — **unreachable** (its open button is commented out, `FlatListBusinessListHeader.tsx:90-102`).

Items: `BusinessController` (default card) in `View paddingHorizontal: 20`. `ListFooterComponent`: 8 card skeletons while loading. Overlays: review `OBottomPopup` + `ReviewTrigger` (config `show_reviews_popups_enabled`), `NotificationSetting`.

### 1.3 Browse tab — `src/pages/BusinessListingSearch.tsx` → `BusinessListingSearch/index.tsx`
Root: `SafeAreaViewWrapper pt disableScrollView` → fixed `HeaderContent` (title "Search" + cart; address and order controls hidden) → `FlatList` with fixed row heights (`getItemLayout`, `ROW_INFO_HEIGHT = 130` + carousel, rows `overflow: hidden`).
Header (`BusinessSearchHeader.tsx`): `SearchBar` → hint "Type at least 2 characters" → `BusinessTypeFilter` (chips/cards; ignores the `categories.hidden` flag) → filter chips + results count (`BusinessesFilters.tsx`, config `filter_search_options`) → skeletons / empty state.
Rows (`BusinessRow`, `:310-448`): logo + name + **rating twice** (`:368-375` and `:377-384`, same value) + closed / time / fee / distance, then horizontal product carousel (`SingleProductCard`, other area). Footer: pagination skeleton.

### 1.4 Map — `src/pages/BusinessSearchMap.tsx` → `BusinessSearchMap/index.tsx`
Root: `View flex 1` with absolute layers: map (`GoogleMap`, out of scope), header overlay (z 1000: back circle, `OInput`, recenter circle; filter chips; "Search this area"), `MapBottomSheet` (Animated, 72 % of window height, peek 172) listing `BusinessSearchCard`, empty state, filter `OBottomPopup`.

### 1.5 Offers tab — `src/pages/Promotions.tsx` → `Promotions/index.tsx`
`NavBar` + `SafeAreaViewWrapper disableScrollView` → `PromotionsContainer` → search `OInput` → loading skeletons (ScrollView) | empty / error `NotFoundSource` | offer cards (ScrollView, not virtualised) → offer detail `OModal` (hero image, value chip, coupon code, description, meta rows, businesses list).

### 1.6 Coupons — `src/pages/CouponOffers.tsx` → `CouponOffers/index.tsx` (from Cart/Checkout)
`NavBar` + wrapper → `ScreenContainer` → `FlatList`. Header: manual coupon (input + Apply, or applied-coupon card + Manage) → segmented tabs Available / Current → help text. Items `OfferCard`. Empty: custom `OfferState` (loading spinner, error + retry, empty). Page-level fallback: `NotFoundSource` "Cart not found". Errors and remove confirmations use `Alert.alert` (system, out of scope).

### 1.7 Favorite — `src/pages/Favorite.tsx` → `Favorite/index.tsx` → `FavoriteList/index.tsx`
`NavBar` + `SafeAreaViewWrapper` (**ScrollView**) → `Container` (margin-top 20) → `Forms/Tabs` (Businesses / Products / Orders) → `FavoriteList` `Container` (margin-top 20 again) → items mapped (not virtualised; manual "Load more items" `OButton`) / skeletons / `NotFoundSource`.

---

## Elements

| Screen / component | Element | file:line | Values today | Function | Proposal (component, token or key) |
|---|---|---|---|---|---|
| Home | Background | `Home/index.tsx:82-85`, `styles.tsx:4-7` | ImageBackground cover, full screen; source served URL or `general.homeHero` | Landing hero | image key `landing.hero` (asset ≤ 1–2 MB) |
| Home | Safe container | `Home/styles.tsx:9-16`, `index.tsx:86` | pt `insets.top \|\| 20`, pb `insets.bottom \|\| 10`, px `margins.horizontal` (20) | Page padding | `space.page_x`; use real insets, drop 20/10 fallbacks |
| Home | Title | `Home/index.tsx:91-106`, `utils.tsx:6-31` | white, size 56/48/32 by window height, ×0.62/0.78/0.9 by text length, min 28, lineHeight ×1.2, marginTop 80/60/40, bold runs, `paddingHorizontal: 4` inline | Display heading | `type.display` + `color.on_image`; size by token, keep length-based downscale as behaviour |
| Home | Buttons | `Home/index.tsx:110-133`, `:140-142` | `OButton` primary / secondary (+ `borderColor: white` inline) / third; `marginVertical: 5`; wrapper mb 20 | Auth CTAs | `button.primary/secondary/tertiary` variants; on-image secondary as a variant, not inline border |
| Listing | Address row | `HeaderContent.tsx:141-183`, `styles.tsx:37-42,84-89` | Pin 20 tinted `active` / `warning5`, mr 10; text bold 1 line; Ionicons caret 20 **no colour** (default black); row h 44, width 80 % | Address selector | component `address_bar`; `color.icon`, `color.warning` |
| Listing | Cart button | `HeaderContent.tsx:184-207`, `styles.tsx:44-82` | 40×40 r12 white; iOS shadow `#000` 0/2 0.15 r4, Android 1 px `rgba(0,0,0,0.1)`; FontAwesome5 basket 22, `primary` if items else `black`; badge 18 r9 `primary`, text 10/600 white | Cart entry | `icon_button` component + `shadow.sm` token; `badge` component |
| Listing / Search | Back arrow | `HeaderContent.tsx:121-129`, `styles.tsx:14-35` | 30×30 r10 white, same fake shadow; AntDesign left 18 black | Back | `icon_button` (same as cart, different size) |
| Search | Title | `HeaderContent.tsx:130-140` | `preset cardTitle`, centered, mx 16 inline | Screen title | `type.title`; should be `NavBar` like other pages |
| Listing | Order type / moment / map pills | `HeaderContent.tsx:238-281`, `styles.tsx:91-109` | r15, h45, bg `backgroundGray100`, px 20, widths 45/35/25/40/16 % by state; text `tsize.m - 1` (15) / `s` (14) w600; arrow_down 14 black; pin_map 20×20 | Order controls | `chip`/`select_pill` component, `radius.md`, `color.surface_muted`; no %-widths |
| Listing | Far-away popover | `AddressAlertPopover.tsx`, `styles.tsx:173-197` | bubble `black` r20 p15, text white centered; triangle 10 px, ml 30; mt -10 | Warning tooltip | `tooltip` component; `color.inverse_surface` |
| Listing | List gutter | `FlatListBusinessListing.tsx:63`, `FlatListBusinessListHeader.tsx:135-138`, `Footer.tsx:16-19` | literal 20 inline (not `margins.horizontal`) | Page gutter | `space.page_x` |
| Listing | `ListWrapper` bg | `Layout/Original/styles.tsx:117-119` | `backgroundLight` = `"white"` (named colour) | Surface | `color.background` |
| Listing | Section title "All business" | `FlatListBusinessListHeader.tsx:165-169` | `OText preset="sectionTitle"` (16/700/22) | Section heading | `type.section_title` |
| Listing | "Top business" title + subtitle | `HighestRatedBusinesses/index.tsx:56-59` | `tsize.l` (20), weight `ios ? '600' : 'bold'`; subtitle default OText | Section heading | same `type.section_title` as "All business" (today 20 vs 16) |
| Listing | Top business carousel | `HighestRatedBusinesses/index.tsx:55-94`, `styles.tsx:3-5` | wrapper p 20 0; gap 20; item width `window − 100`, px 5, `height: '100%'` | Carousel | `space.gap_carousel`; width as share token |
| Listing / Fav | Business card (default) | `BusinessController/index.tsx:229-399`, `styles.tsx` | wrapper minHeight 200; container mv 20; `CardAnimation` press | Business card | component `business_card` |
| Card | Header image | `BusinessController/index.tsx:256-278` | FastImage h = `window.height × 0.34 × 0.66` (0.6 top-rated), r30, cover | Card hero | `radius.xl`; aspect ratio instead of window height |
| Card | Ribbon | `BusinessController/index.tsx:235-254`, `styles.tsx:53-82` | abs top/right 0, bg API colour, px 8 py 1, max 180, r 7.6 or 50 by shape, border 1 `black`/`white` literal names; text 10/400 lh13 black/white by luminance | Ribbon (API data) | `badge.ribbon`; colours stay data |
| Card | Offer badge | `BusinessController/index.tsx:279-294`, `styles.tsx:84-93` | abs top 25 right 5, r50, bg `inputBorderColor`, p 3/8; text 10/400 `textThird` | Discount badge | `badge` variant `offer`; hideable piece |
| Card | Preorder badge | `BusinessController/index.tsx:295-306`, `styles.tsx:20-24,119-126` | abs top 50 right 5; bg **`#DEE2E6` literal** r50 h20 px8; text 10 `textThird` | State badge | `badge` variant `neutral` |
| Card | Logo | `BusinessController/index.tsx:309-320`, `styles.tsx:26-30` | `(window−40)×0.2` square, r15, cover; hidden on top-rated | Logo | `radius.lg`; fixed size token |
| Card | Name | `BusinessController/index.tsx:323-331` | 16/500, 1–2 lines, width 75/90 % | Card title | `type.card_title` (preset exists: 16/600 — differs) |
| Card | Rating | `:332-339`, `:352-359` | star PNG 14 tinted `star`; text default, ml 4 | Rating | `rating` piece; hideable |
| Card | Favourite | `:340-350` | `LottieAnimation` heart, `danger`, 18 | Toggle | hideable (flag `favorite`) |
| Card | Closed | `:361-364` | OText `colors.red` (`#D83520`) | State | `color.danger` (today `red` ≠ `danger` `#E63757`) |
| Card | Meta row | `:366-392`, `styles.tsx:41-46` | SimpleLineIcons clock 14 `textNormal`; delivery_fee PNG 14; gap 4 inline, row gap 20 | Time / fee / distance | `meta_row` piece, each hideable |
| Card fallback | Header placeholder | `BusinessHeaderPlaceholder/index.tsx`, `styles.tsx` | bg `businessHeaderPlaceholder`, r30 default, logo 50 % contain, or monogram size `h×0.32` w600 `backgroundGray300` | Image fallback | keep; `color.placeholder` |
| Listing | Order progress card | `OrderProgress/OrderCard.tsx`, `styles.tsx:3-61` | r12 border 1 `border`, p12, mt/mb 20; logo 48 r12 contain; "Order in progress" 12 `textGray`; name 16 bold (**fallback literal "Coffee Shop"**, `OrderCard.tsx:64`); button bg **`#e8e8e8`** p12/16 r20 text 13 bold; bar track h10 r5 `activeContrast`, fill `active`; status 12 `active`; ETA 11 | Active order | component `order_progress_card`; `color.surface_muted`; hideable section |
| Listing | Page banner | `PageBanner/index.tsx:35-76,195-257`, `styles.tsx:3-10` | h162, r30, width measured; wrapper margin `10 20 20` → **40 px gutter inside the 20 px ListWrapper**; autoplay 6 s; default pagination dots | Promo carousel | component `banner_carousel`; `radius.xl`; section hideable/movable |
| Listing | Categories chips | `BusinessTypeFilter/index.tsx:99-118`, `styles.tsx:10-31,67-79` | p 8/16 r20, mr 8; bg `activeContrast` selected / `backgroundGray200`; text 14, 600/500, `active` / `textNormal`; row extra px 16 | Filter chips | `chip` component (selected state) |
| Listing | Categories cards | `BusinessTypeFilter/index.tsx:120-164`, `styles.tsx:33-65` | card w65 minH96 r12 mr25, selected bg `activeContrast`; icon 56 (OIcon r30, wrapper r0); label 12, dynamic 8–12 by word length, bold if selected, `primary`/`textSecondary`; 2 rows when ≥10 types | Category tiles | `category_tile` component; font size from token, no 8 px |
| Search / Map | Category buttons | `BusinessTypeFilter/index.tsx:186-202` | `OButton` h32 class `active`/`fourth`, mr 8, padding 0 | Multi-select chips | same `chip` component |
| Search | Search bar | `BusinessSearchHeader.tsx:29-36` | `SearchBar`, input fontSize 12, h44 | Search | `search_input`; 12 px too small |
| Search | Hint | `BusinessSearchHeader.tsx:37-39` | 12 lh20 `textThird` ml5; says "2 characters" but code needs 3 (`index.tsx:236`) | Helper text | `type.caption` |
| Search | Filter chips | `BusinessesFilters.tsx:163-179`, `styles.tsx:99-110` | r50, py8 px15, mr10, bg/border `activeContrast`/`backgroundGray100`, Ionicons 16, text default `active`/`black` | Filter chips | `chip` |
| Search | Clear / results | `BusinessesFilters.tsx:164-187` | Clear bold `primary`; results 18 bold, mt 20 | Text button / heading | `button.link`; `type.section_title` |
| Search | Filter sheet | `BusinessesFilters.tsx:189-309` | `OBottomPopup`; sort rows mb7; brand item p8/12 r8; price buttons 40×40 r20 text 11; footer `OButton` + "Reset" text link bold | Filter sheet | `sheet` + `chip` + `button` |
| Search / Map | Max slider | `BusinessListingSearch/MaxSectionItem/index.tsx`, `styles.tsx` | track h4 **`#F8F9FA` literal**, fill `active`; labels bold `active`/`black`; title 16 bold | Range picker | `color.surface_muted`; `range_picker` |
| Search | Business row | `BusinessListingSearch/index.tsx:335-446` | `BContainer` padding forced 0 → **no side gutter**; logo `(w−40)×0.2` r15; name 16/500; closed `red`; clock 14; fee PNG 14 | Result row | reuse `business_card` row variant; honour hidden flags |
| Map | Circle buttons | `BusinessSearchMap/styles.tsx:44-52` | 46×46 r23 white, shadow iOS `#000` 0/2 .15 r5 / Android elevation 4 | Map controls | `icon_button` size lg + `shadow.md` |
| Map | Search field | `BusinessSearchMap/index.tsx:121-128,225-243` | `OInput` h46 r24 mh10 px18; search icon 16 / clear 16 | Search | `search_input` |
| Map | Filter chips | `BusinessSearchMap/styles.tsx:69-85` | h38 r19 white border `border`, px14 mr8, shadow; active bg `activeContrast` border `active`; text default | Filter chips | `chip` (same as Search, today different) |
| Map | Search this area | `BusinessSearchMap/index.tsx:288-295`, `styles.tsx:54-67` | white r22 py10 px18 shadow; Feather 15 + text 13/600 `primary` | Floating action | `button.floating` |
| Map | Bottom sheet | `MapBottomSheet.tsx`, `styles.tsx:126-169` | 72 % window, peek 172, top r24, shadow 0/-3 .12 r8 elev 12; grabber 44×5 r3 `backgroundGray200`; title 18 bold; selected card border 2 `active` bg `lightPrimary` r16; snap 280 ms | Sheet | `sheet` component; `motion.base` |
| Map | Search card | `BusinessController/BusinessSearchCard.tsx:132-269` | bottom border 1 `border`, mh10 mb20; name 16/500; rating text **coloured `star`**; dot `option_normal` 10 `disabled`; fee box py10 px20 bg `backgroundGray100` r20 mb10, labels 14/600, values `backgroundGray300`; **"Pickup" row shows `service_fee`**; `OButton` "Order Now" h55 | Map result card | `business_card` variant `compact_action` |
| Map | Filter sheet | `BusinessSearchMap/index.tsx:341-436` | price buttons class `active`/`alert` h27 r15 text 10 `active`/`disabled`; footer two `OButton` (primary / secondary no border) | Filter sheet | same as Search |
| Map | Empty | `BusinessSearchMap/styles.tsx:118-124` | mt 120, **h 500**, px 20 | Empty state | `empty_state` |
| Offers | Search input | `Promotions/index.tsx:146-155` | `OInput` + Ionicons pricetags 20 `primary` mr10 | Search | `search_input` |
| Offers | Offer card | `Promotions/index.tsx:185-215`, `styles.tsx:9-35` | r15 p20 mb20 white; iOS shadow / Android border; expires 12 `textSecondary`; name 18 bold; image 70×70 r15; dashed divider 1 `border`; `OButton` "View" class `active` h35 r8 text 14 | Offer card | `offer_card`; `shadow.sm` |
| Offers | Offer modal | `Promotions/index.tsx:220-340`, `styles.tsx:45-154` | image 115 r15; name 20 bold; value chip p8/14 r10 bg gray100 border `primary` text 14/700 `primary`; coupon box dashed **1.5 px** `primary`, code 22 bold letterSpacing 2; description 15/600 `primary` lh22, left border 4; meta rows label 12 / value 14/600 `colorPage` (`#333`); business row p20 r15 shadow, logo 45 r15, `OButton` w100 h35 r7.6 text 10 | Offer detail | `offer_detail`; `coupon_code` piece |
| Coupons | Compact button | `CouponOffers/styles.tsx:27-54` | min 44×92, r `radius.l`, bg `primary` / `dangerContrast`, opacity .5 disabled; text **raw `styled.Text`** 13/600 white | Button | **bypasses `OButton`** → `button.primary` size sm |
| Coupons | Tabs | `CouponOffers/styles.tsx:80-123` | track bg gray100 r10 p4; tab minH40 r5, active bg `backgroundPage` border; text raw 13/600; count pill 11/700 r10 | Segmented control | `segmented_control` (vs `Forms/Tabs` in Favorite) |
| Coupons | Offer card | `CouponOffers/OfferCard.tsx`, `styles.tsx:125-203` | border `border` r10 p14 gap12; rate box 48×44 `primary`; icon box `primaryContrast`; title 14/600; code 11/700 uppercase ls .8 `primary`; description 12 lh17; action minH38 r5 text 12/600 | Offer row | `offer_card` variant `compact`; all texts raw `styled.Text` |
| Coupons | States | `CouponOffers/index.tsx:227-271`, `styles.tsx:205-211` | ActivityIndicator `primary`; AntDesign 30 `danger`/`disabled`; 15/600 + 13 `textSecondary`; minH 220 | Empty / error / loading | `empty_state` (today `NotFoundSource` elsewhere) |
| Favorite | Tabs | `Favorite/index.tsx:29-36` | `Forms/Tabs`, selected bg `active` text white, unselected black | Tabs | `tabs` (primitive agent) |
| Favorite | Favourite card | `BusinessController/BusinessFavoriteCard.tsx:18-161` | r15 p15 border `border` mb20, shadow `#000` .08 r4 elev 3; name `tsize.l` bold; Ionicons heart 20 `danger`/`textSecondary`; star Ionicons 16 **`active`**; InfoText raw `styled.Text` `tsize.m` `textSecondary`; clock / truck icons 16/18; status 14; `OButton` class `alert` auto height py5 | Favourite business | `business_card` variant `list` |
| Favorite | Containers | `Favorite/styles.tsx:18-22`, `FavoriteList/styles.tsx:3-5` | mt 20 + mt 20 (double), px `margins.horizontal` | Spacing | single `space.section` |

---

## Duplicates (same function, different implementation)

| Function | Implementations (file:line) | Visible differences |
|---|---|---|
| Business card | `BusinessController/index.tsx:229` (default), `BusinessListingSearch/index.tsx:310` (`BusinessRow`, copies the markup, imports `BusinessController/styles`), `BusinessController/BusinessSearchCard.tsx:132` (map), `BusinessController/BusinessFavoriteCard.tsx:63` (favourites), `BusinessController/BusinessSimpleCard.tsx` (orders area), `BusinessesListing/Layout/Maweja/BusinessCard.tsx` (delete), `BusinessFeaturedController/` (**dead**: only referenced from commented code `FlatListBusinessListHeader.tsx:104-133`) | 4 live layouts; hidden flags honoured only in 2; name 16/500 vs `tsize.l` bold vs `tsize.m+2` bold; closed `red` vs `danger`; Search row repeats the rating |
| Rating | `BusinessController/index.tsx:334`, `BusinessListingSearch/index.tsx:370,379`, `BusinessSearchCard.tsx:193`, `BusinessFavoriteCard.tsx:112` | PNG star tinted `star` + default text / text in `star` / Ionicons star in **`active`** + bold text |
| Time / fee icons | `SimpleLineIcons clock` + `delivery_fee` PNG (card, row) vs `Ionicons time-outline` + `MaterialCommunityIcons truck` (favourite) vs none (search card) | Three icon sets for one meta row |
| Favourite toggle | `LottieAnimation` (`BusinessController:341`, `BusinessSearchCard:178`) vs Ionicons heart (`BusinessFavoriteCard:101`) | Animated vs static |
| Max-value slider | `BusinessListingSearch/MaxSectionItem/` (used by Search **and** Map) vs `BusinessSearchMap/MaxSectionItem/` (**dead**, has a `Point`, mb 20 vs 10) | — |
| Filter bar + sheet | `BusinessListingSearch/BusinessesFilters.tsx` vs `BusinessSearchMap/index.tsx:248-436` | chips r50 gray no border vs r19 white bordered with shadow; price buttons 40×40 r20 `fourth` vs h27 r15 `alert`; price label `$` vs config currency; fee options 15/25/35 vs 1/2/5; distance km-only vs unit-aware; footer button+link vs two buttons; `BrandItem` styled twice (identical) |
| "WrapMomentOption" | `BusinessesListing/Layout/Original/styles.tsx:100` (gray pill h45 r15) vs `BusinessSearchMap/styles.tsx:69` (white chip h38 r19) | Same name, two components |
| Back / icon buttons | `HeaderContent` `BackArrow` 30 r10 & cart 40 r12 (fake shadow), map `CircleButton` 46 r23 (elevation), `NavBar` (other pages) | Sizes, radii, shadow systems |
| Search input | `SearchBar` font 12 h44 (Search), `OInput` h46 r24 (Map), `OInput` + pricetags icon (Offers), `OInput` r10 h44 (Coupons) | 4 looks |
| Chips | category chip (`BusinessTypeFilter/styles.tsx:10`), category `OButton` h32 (search mode), filter chip (`BusinessListingSearch/styles.tsx:99`), map chip (`BusinessSearchMap/styles.tsx:69`), order pill (`Layout/Original/styles.tsx:100`) | 5 chip implementations |
| Tabs | `Forms/Tabs` (Favorite) vs `OfferTabs` segmented (`CouponOffers/styles.tsx:80`); `Favorite/styles.tsx:3-16` `TabContainer`/`Tab` **dead** | Pill vs segmented |
| Empty state | `NotFoundSource` (listing, search, map, offers, favourites, coupons page) vs `OfferState` (`CouponOffers/styles.tsx:205`) | Icon sizes and text styles |
| Card shadow | iOS `#000` .15 r4 + Android 1 px border (`Layout/Original/styles.tsx:22-34,52-64`, `Promotions/styles.tsx:17-29,50-62`); elevation 3/4/12 (`BusinessFavoriteCard`, map `cardShadow`, sheet); border-only (`OrderProgress`, `CouponOffers`) | 3 shadow systems for "raised card" |
| Business-card skeleton | listing footer 180 r25 + 70 logo (`FlatListBusinessListFooter.tsx:24-38`), top-rated 150 r30 (`HighestRatedBusinesses:103-121`), search pagination (`BusinessListingSearch/index.tsx:40-55`), search loading (`BusinessesFilters.tsx:313-349`), map 80 logo (`BusinessCardSkeleton.tsx`), favourites (`FavoriteList:95-133`), `BusinessControllerSkeletons` (width 320, OrdersOption) | Each shaped differently; listing skeleton height 180 vs real header ≈150–190 by phone; map skeleton draws a logo the map card does not have |
| Section heading | "All business" `sectionTitle` 16/700; "Top business" 20 / 600-bold by platform; results 18 bold; sheet title 18 bold | 3 sizes for one role |

---

## Blocks and pieces

| Page | Block or piece | Hideable? Movable? | Why |
|---|---|---|---|
| Landing | Language selector | Hideable | Single-language projects |
| Landing | Title | Hideable; text keys | Brand copy |
| Landing | Guest button | Hideable (config already gates it) | `guest_checkout_enabled` stays a config, not theme |
| Listing | Header (address + cart) | Not hideable (navigation); cart piece hideable? no | Address is required to list |
| Listing | Order controls: type / moment / map | Each piece hideable | Moment already gated by preorder config; map pill is optional |
| Listing | Order in progress | Hideable, movable | Independent block in the header fragment |
| Listing | Page banner | Hideable, movable | Data-driven, already disappears when empty |
| Listing | Top business | Hideable (v1 flag today), movable | Independent block |
| Listing | Categories | Hideable (v1 flag today), movable | Independent block; Search should honour the same key |
| Listing | "All business" title | Hideable | Pure heading |
| Listing | Business list | Not hideable | It is the page |
| Listing | Powered by | Not a theme key | Platform/plan flag |
| Card | header image, logo, rating, favourite, offer, ribbon, time, fee, distance, preorder | Each hideable (6 have v1 flags today) | Same key must drive default, search row and map card |
| Search | Hint text, categories, filter bar, results count | Hideable | Optional aids |
| Search | Product carousel per row | Hideable | Optional, heavy |
| Map | "Search this area", recenter | Hideable | Optional controls |
| Offers | Search input | Hideable | Optional |
| Offers | Offer image, dashed divider | Hideable pieces | Decorative |
| Coupons | Manual section / tabs | Not hideable (function) | Core flow |
| Favorite | Products / Orders tabs | Hideable per tab | Projects may only favourite businesses |

The listing has **no sticky headers** and its blocks live in one `ListHeaderComponent`
fragment, so hiding or reordering them does not break indices. The Search screen's fixed
row heights (`getItemLayout`, rows `overflow: hidden`) will clip if a theme raises font
sizes or line heights: row height must derive from the theme or `getItemLayout` must go.

---

## Images

| Key or source | file:line | Painted box | Fit | Fallback | alt |
|---|---|---|---|---|---|
| `general.homeHero` (`assets/images/home-hero.png`) or served `homepage_view…image` | `Home/index.tsx:40,83` | full screen | cover | bundled PNG | none |
| — file size | `src/assets/images/home-hero.png` | **1760×3824, 12.1 MB** | | | huge for a phone background |
| Business header (API) | `BusinessController/index.tsx:258-269` | (w−40) × `h×0.34×0.66` (≈150 on SE, ≈190 on 6.1″) | cover, r30 | `BusinessHeaderPlaceholder` | none |
| Business logo (API) | `BusinessController/index.tsx:311-318`, `BusinessListingSearch/index.tsx:347-354` | (w−40)×0.2 square (≈70) | cover, r15 | none (hidden) | none |
| Order logo (API) | `OrderProgress/OrderCard.tsx:52-56` | 48×48 r12 | contain | `dummies.businessLogo` (`store.png` 512²) | none |
| Banner slide (API) | `PageBanner/index.tsx:146-155` | measured width × 162 | cover, r30 | none; skeleton while loading | none |
| Category icon (API `type.image`) | `BusinessTypeFilter/index.tsx:144-150` | 56×56, OIcon r30, wrapper r0 | OIcon default | `images.categories[slug] ?? all` (`category-all.png` 230²) — lost with served theme | none |
| `general.pin` | `HeaderContent.tsx:145-150` | 20 wide | tinted | — | none |
| `general.arrow_down` | `HeaderContent.tsx:246-250` | 14 | tinted black | — | — |
| `general.pin_map` | `HeaderContent.tsx:275-279` | 20×20 | untinted | — | no label on the map pill |
| `general.star` | card / row / search card | 14 | tinted `star` | — | — |
| `general.delivery_fee` (38×38 PNG) | `BusinessController/index.tsx:381`, search row, search card | 14×14 | untinted | — | — |
| `general.option_normal` | `BusinessSearchCard.tsx:198-204` | 10×10 tinted `disabled` | | | used as a dot separator |
| `general.label`, `general.search`, `general.close` | `BusinessSearchMap/index.tsx:251,242`; popups | 15 / 16 | tinted | | |
| `general.mapPin` | `BusinessSearchMap/index.tsx:135` | marker | | **undefined** | |
| Offer image (API) | `Promotions/index.tsx:197-203` | 70×70 r15 | default (cover) | none | none; requests `h_1024` for a 70 px box |
| Offer modal image (API) | `Promotions/index.tsx:228-234` | 115×115 r15 | default | none | `h_1024` |
| Offer business logo (API) | `Promotions/index.tsx:317-324` | 45×45 r15 | cover | none | `h_250` |

Icons: Ionicons, FontAwesome5, AntDesign, SimpleLineIcons, Feather, MaterialCommunityIcons
(six sets in one area) plus tinted PNGs via `OIcon`. Several Ionicons have no colour
(`HeaderContent.tsx:179` caret) and paint the library default.

---

## Off the scale or without a token

| Value | Where | Why it does not fit |
|---|---|---|
| `#e8e8e8` | `OrderProgress/styles.tsx:34` | No token (nearest `backgroundGray200` `#E9ECEF`) |
| `#DEE2E6` | `BusinessController/styles.tsx:120` | Equals `inputBorderColor` but written literally |
| `#F8F9FA` | `BusinessListingSearch/MaxSectionItem/styles.tsx:10` | Equals `backgroundGray100`, literal |
| `#F0F0F0` | `BusinessController/styles.tsx:111` | Fallback, never seen |
| `#000` shadows, `rgba(0,0,0,0.1)` borders | `Layout/Original/styles.tsx`, `Promotions/styles.tsx`, `BusinessSearchMap/styles.tsx`, `BusinessFavoriteCard.tsx` | Shadow tokens missing |
| `'black'` / `'white'` names | `BusinessController/styles.tsx:75,80`; `theme.json` `backgroundLight: "white"`, `btnFont: "black"` | Named colours in theme |
| `colors.red` vs `colors.danger` | "Closed" in card/row vs favourites/simple card | Two reds for one state |
| radius 7.6, 9, 12, 15, 18, 19, 20, 22, 23, 24, 25, 30, 50 | throughout | Scale has only `l`=10, `m`=5 |
| font 8–12 dynamic, 10, 11, 13, 15, 22; Home 28–56 computed | `BusinessTypeFilter:126-129`, badges, coupons, offers, `Home/utils.tsx` | Off `tsize` (12/14/16/20/25/30/36) |
| `tsize.m - 1` (15), `tsize.m + 2` (18) | `HeaderContent.tsx:243`, `BusinessSimpleCard.tsx:55` | Arithmetic on tokens |
| letter-spacing 2, 0.8 | `Promotions:269`, `CouponOffers/styles.tsx:169` | No tracking token |
| border 1.5 px dashed | `Promotions/styles.tsx:103` | Off border scale |
| widths as % of window (`w−100`, `w×0.2`, `h×0.34`, sheet `h×0.72`) | HighestRated, BusinessController, map | Sizes from screen, not tokens |
| weight `ios ? '600' : 'bold'` | `HighestRatedBusinesses:56` | Platform font branch (faux bold on Android) |
| gutter 14, 16, 0 | map header, chip row, search rows | Page gutter is 20 elsewhere |
| motion 220 / 280 ms, autoplay 6 s | `HeaderContent:61`, `MapBottomSheet:17`, `PageBanner:226` | No motion token |

**Bypasses of shared primitives** (for the primitives agent): raw `styled.Text` in
`CouponOffers/styles.tsx:48,104,112,148,159,165,173,197` and
`BusinessFavoriteCard.tsx:44` (no theme font family); hand-made buttons
`CompactButton`, `OfferAction`, `CategoryItemContainer`, `FilterButton`, both
`WrapMomentOption`s, `SearchAreaButton`, `CircleButton`, `BackArrow`,
`WrapperCartIcon`, `GoToOrdersButton` (a View inside a TouchableOpacity); `OButton` with
inline size overrides in 8 places; Search screen title drawn by `HeaderContent` instead of
`NavBar`.

---

## Signed in / out, order types, states

- Signed out: only the landing; the tab bar is `display: none` (`BottomNavigator.tsx:45`); Offers/Browse tabs fall back to Login/Signup/Forgot. Favourite toggles on cards navigate to `Login` when `!auth`.
- Guest: a guest user from `guest_token` reaches the listing; `isGuestUser` changes the address target (AddressForm instead of AddressList).
- Order type: time shows `delivery_time` for types 1 and 7, `pickup_time` otherwise; fee only for 1/7; Search and Map filter buttons depend on type 1/2. Order type pill text from `getTypesText`.
- Loading: listing (8 card skeletons; order progress, banner, top business, categories own skeletons), search, map, offers, favourites; coupons use a spinner.
- Empty: `NotFoundSource` everywhere except coupons. Error: offers and coupons show errors; listing/search/map show nothing on error.
- Closed business: "Closed" text; preorder badge when `preorder_status_enabled`; tap goes to MomentOption or shows a toast.

---

## To delete (`maweja`)

- `Home/layouts/Maweja/` (`index.tsx`, `styles.tsx`, `MawejaLogin.tsx`); branch `Home/index.tsx:13,67-79`.
- `BusinessesListing/Layout/Maweja/` (`index.tsx`, `BusinessCard.tsx`, `HomeHeader.tsx`, `styles.tsx`, `__tests__/HomeHeader.test.tsx`); switch `BusinessesListing/index.tsx:6-7,13-14`.
- `FlatListBusinessListing.tsx:9,13,30-54,104-121` (status-bar/notch logic, sticky `HomeHeader`); `FlatListBusinessListHeader.tsx:7,54-64,137,166`; `FlatListBusinessListFooter.tsx:19`.
- `BusinessController/index.tsx:26,179-227`.
- `BusinessTypeFilter/index.tsx:29,34,106-112,135,143,147-149,206-211`; `BusinessTypeFilter/styles.tsx:3,11,17-20,28,35-36,46-56`.
- `HighestRatedBusinesses/index.tsx:57,64,72-73` (`layout` prop).
- `PageBanner/index.tsx:23,26,38-39,129-137,175-179,209,228-253` (captions, arrows, custom dots).
- `src/utils/appDesign.ts` + its test once every area drops it; `src/utils/themeBrandColor.ts` is used by maweja and by `FlatListBusinessListing.tsx:35` (maweja-only path) and other areas — check before deleting.
- Maweja cases in `Home/__tests__/Home.test.tsx`, `BusinessesListing/__tests__/BusinessesListing.test.tsx`, `BusinessController/__tests__/BusinessController.test.tsx`.

Other dead code in the area: `BusinessFeaturedController/`, `BusinessSearchMap/MaxSectionItem/`,
`Favorite/styles.tsx` `TabContainer`/`Tab`, cities `OModal` (no opener), styles
`HeaderWrapper`, `FeaturedWrapper`, `FarAwayMessage`, `PreorderInput`, `OTabs`, `OTab`,
`OrderTypesContainer`, `BusinessLogosContainer` (`Layout/Original/styles.tsx`),
`Promotions/styles.tsx` `AvailableBusinesses`, `ValueOfOffer`; `BusinessListingSearch/styles.tsx`
unused exports (`ProductsList`, `BusinessInfo`, `BusinessInfoItem`, `SingleBusinessContainer`,
`TagsContainer`, `BusinessTypesContainer`, its own `BusinessLogo`).

Behaviour bugs noticed (not theme, report upstream): Search row prints the rating twice;
search hint says 2 characters but search needs 3; map card "Pickup" row shows
`service_fee`; `OrderCard` shows "Coffee Shop" when the name is missing;
`Promotions` filter crashes on an offer without `name`; listing far-away check runs
twice (`Layout/Original/index.tsx:93-110` and `HeaderContent.tsx:99-116`).

---

## Not verified

No simulator was run; everything above is from reading the code.
- Real painted sizes on iPhone SE vs a 6.7″ phone (card header uses window height; banner width; Home title scaling).
- Whether the top-rated card overflows: its footer width uses `(w−40)×0.8` inside a `w−110` slot (`BusinessController/index.tsx:321`, `HighestRatedBusinesses:72`).
- Whether Search rows really sit flush to the screen edge (`BContainer` padding forced to 0, `BusinessListingSearch/index.tsx:335`).
- The banner's double gutter (40 px) on device.
- Android rendering of the hand-made shadows (1 px border) vs iOS shadows.
- Text clipping in Search rows with larger fonts (fixed `getItemLayout` heights).
- The runtime colour swap (`active` → `primary`) with the production served theme, and the lost category fallback icon.
- `LanguageSelector`, `NotFoundSource`, `OBottomPopup`, `OModal`, `SearchBar`, `OInput`, `Forms/Tabs`, `SingleProductCard`, `SingleOrderCard`, `GoogleMap` internals (other areas).
- Whether `PoweredBy` is ever shown in production (`usePoweredByOrdering`).
