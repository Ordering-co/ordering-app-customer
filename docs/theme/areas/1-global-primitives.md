# Area 1 — Global / infra + shared primitives

Scope: `src/theme.json`, `src/TemplateApp.tsx`, `src/contexts/UpdatedThemeProvider/`, `src/ui/src/context/Theme/`,
`src/ui/src/components/shared/*`, `src/layouts/SafeAreaViewWrapper.tsx`, `src/ui/src/layouts/*`, `NavBar`,
`src/navigators/BottomNavigator.tsx`, `OToast`, `AlertProvider`, `CookieConsentBanner`, `SupportBubble`, fonts, icons,
skeletons, platform branches. Only the `original` path; `maweja` is listed as "to delete". Code reading only.
The submodule (`src/@/`) is read only to note which served-theme keys it requests.

Literal locations come from `.theme-audit/` (inventory.csv, scales.md, components.md); this report adds what the
scripts cannot see.

---

## 0. The theme today (how it is built and what survives)

### 0.1 Sources and providers

| Piece | file:line | What it does |
|---|---|---|
| Local theme | `src/theme.json` | `utils` (l.2: `tsize` xs12…xxxl36, `typography` 5 presets, `radius` l10/m5, `margins.horizontal` 20, `zi`), `colors` (l.32, 56 keys), `images` (l.98, **dead**: overwritten), `layouts` (l.248–774, **dead**: never read) |
| Image manifest | `src/TemplateApp.tsx:63` | `theme.images = {…}` replaces the whole `images` block of theme.json with `require()`s (adds `neighborhood`, `spoon_fork`, `location_pin`, `search_icon`, `label` that theme.json does not list) |
| Outer provider | `src/TemplateApp.tsx:374` → `src/ui/src/context/Theme/index.tsx:2,15` | `ThemeProvider` from **`styled-components`** (web entry) with the **local, unmerged** theme, plus a private `ThemeContext` (`useTheme` from `@ui`, 0 readers outside `ui/index.tsx`) |
| Inner provider | `src/TemplateApp.tsx:384` → `src/contexts/UpdatedThemeProvider/index.tsx:2,9` | `ThemeProvider` from **`styled-components/native`** with `createMergedTheme(theme, orderingTheme, { isApp: true })` |
| Mounted **outside** the inner provider | `TemplateApp.tsx:373` `CustomStatusBar` (reads local `theme.colors.backgroundPage` directly), `:391` `CookieConsentBanner`, `:392` `OToast` | See the local theme only (no served keys, `active` = `#21BC9E` instead of primary) |
| Readers | 208 files import `useTheme` from `styled-components/native`; 1 from `styled-components` (`src/ui/src/components/LottieAnimation/index.tsx:5`) | — |

### 0.2 How the served theme is fetched and merged (submodule, read only)

- `src/@/components/src/contexts/OptimizationLoadContext/index.js:42` — `GET {root}/frontends/first_load` (header `X-App-X: app_id`), because `src/config.json` `useOptimizeLoad: true`. Its `result.theme` feeds the theme context.
- `src/@/components/src/contexts/OrderingThemeContext/index.js:93` — fallback `GET {root}/theme`. Neither request sends a `theme_version` → the app gets the **v1** theme today.
- `noValidateColors` is passed (`TemplateApp.tsx:376`) → served color strings are not validated.
- `src/@/components/src/utils/themeUtils.js:153` `createMergedTheme` with `isApp: true`:
  - `{...theme, ...served}` → every served root key (`business_view`, `orders`, `general`, `ios`, `android`, …) lands **at the theme root**, which is where the code reads (never under `layouts`).
  - `colors`: **local colors kept**; only `active ← primary` and `activeContrast ← lightPrimary`. Merchant colors (`my_products.components.theme_settings.components.style.primary_btn_color`, `primary_link_color`, `background_page`) are **ignored by the app** (they only apply on web).
  - `images`: `general.homeHero ← homepage_view…homepage_header.image`, `general.notFound`, `general.emptyActiveOrders/emptyPastOrders`, `general.notNetwork` (app key is `noNetwork`: mismatch), `general.businessHero/businessSignUpHero/driverSignUpHero` (app never reads them), `logos.logotype ← header.components.logo.components.image` (isApp), `dummies.businessHeader/businessLogo/product ← business_view…dummy_image`, `categories.*`, `deliveryTypes.*`.
  - **Bug:** `getMergedCategoryImages` sets `categories.all = served.all.image || theme.images.categories.categoryAll` — the app's key is `categories.all`, not `categoryAll` → as soon as any served theme arrives, the bundled "all" category image becomes `undefined` (`BusinessTypeFilter/index.tsx:82` fallback). Same shape for `deliveryTypes` (the app defines none).
- Submodule controllers also read the served theme directly: `src/@/components/src/components/BusinessList/index.js:74` and `BusinessSearchList/index.js:51` → `business_listing_view.components.cities.hidden`.

### 0.3 Color keys read but not defined (undefined today → paint nothing / fallback)

| Key | Uses | Example readers |
|---|---|---|
| `danger5` | 30 | `PhoneInputNumber/index.tsx:58,197,206`, `ServiceForm/index.tsx:367,407,447`, `LottieAnimation/index.tsx:81,95`, login/sign-up error borders/texts |
| `backgroundCard` | 11 | `OrderDetails/Bill.tsx:132`, `Checkout/index.tsx:642,754` (+ maweja styles) |
| `secundary` (typo) | 3 | `BusinessItemAccordion/index.tsx:62`, `Cart/index.tsx:470,471` |
| `arrowColor`, `inputSignup`, `inputTextColor`, `transparent` | 2/1/1/1 | `ProjectForm/index.tsx:90,93,105,106,133` |
| `colorTextTutorial` | 2 | `pages/IntroductoryTutorial.tsx:86,99` |
| `green500` | 1 | `OrderDetails/DynamicProgressBar.tsx:65` |
| `safeAreaColor` | 1 | `ProductOption/styles.tsx:22` |

Other keys read but not defined: `utils.radius.s` (`BusinessController/styles.tsx:108`, falls back to 4);
`theme.images.drop_down` (`shared/ODropDown.tsx:119` — real key is `images.general.drop_down` → the dropdown chevron
never renders); `images.general.credomatic`, `general.stripecheckout` (`ui/src/utils/index.tsx:1066,1071`),
`general.mapPin` (`BusinessSearchMap/index.tsx:135`).

### 0.4 Defined but never read

- Colors: `secondary`, `third`, `borderColor`, `disabledContrast`, `paleGray`, `btnFont`, `darkText` (theme.json l.33–92).
- `theme.json` `images` (l.98–247) and `layouts` (l.248–774) entirely (the `layouts` tree is a PF Chang's web copy: koala URLs, `pfchangs` layout types).
- Images (TemplateApp manifest): all `tabs.*` (tab bar uses Ionicons), `backgrounds.business_list_header`, `dummies.driverPhoto`/`customerPhoto` (remote cloudinary URLs), and ~32 `general.*` keys with no direct reader: `appointment menu lunch arrow_up arrow_left map marker camera support mail menulogout tag_home tag_building tag_heart chevron_left info minus plus half_l half_f half_r language ic_help enter attach help giftCardImage spoon_fork location_pin search_icon` (confirm: some may be reached dynamically, e.g. `general[\`giftCard${price}\`]` at `GiftCard/PurchaseGiftCard/index.tsx:76`).
- `utils.typography` presets: only 7 files pass `preset=` (`cardTitle`×4, `sectionTitle`×3, `body`×2) and `NavBar/index.tsx:33` reads two sizes. `utils.zi.xl` never read.

### 0.5 What the served (v1) theme drives today — stops applying under the "no v1 map" decision

| Served path | Reader file:line | Effect today |
|---|---|---|
| `app_design.components.layout.type` | `src/utils/appDesign.ts:16` | original/maweja switch (to delete) |
| `general.components.inputs.color` | `shared/OInput.tsx:161-162` | input text color |
| `general.components.favicon.components.image`, `my_products.components.images.components.logo.components.image` | `src/utils/logoSource.ts:37,38` | compact logo mark |
| `header.components.logo.components.image` | merge → `images.logos.logotype`; read `NavBar/index.tsx:78`, `pages/Splash.tsx:52` | header/splash logo |
| `homepage_view.components.homepage_header.components.image` | `Home/index.tsx:40` (+ merge `general.homeHero`) | home hero |
| `no_internet.components.image` | `NetworkError/index.tsx:19` | offline image |
| `ios.components.(any|portrait|landscape)…image`, `android.components.(portrait|landscape).dimensions.(idpi|xhdpi|xxhdpi|xxxhdpi).image` | `pages/Splash.tsx:18-46` | JS splash image by width |
| `order_types_config.type{N}.name` | `OrderTypeSelector/index.tsx:33` | order-type labels (text) |
| `business_listing_view.components.business.components.{fee,time,distance,favorite,offer,header}.hidden` | `BusinessController/index.tsx:93-98`, `BusinessSearchCard.tsx:80-85` | business card pieces |
| `business_listing_view.components.{highest_rated_business_block,categories}.hidden` | `BusinessesListing/Layout/Original/FlatListBusinessListHeader.tsx:47,48`, `HighestRatedBusinesses/index.tsx:130` | listing blocks |
| `business_listing_view.components.cities.hidden` | submodule `BusinessList/index.js:74`, `BusinessSearchList/index.js:51` | city filter |
| `business_view.components.header.hidden`, `.header.components.reviews.hidden`, `.header.components.business.components.{logo,fee,time,reviews,distance,business_info,city}.hidden` | `BusinessBasicInformation/index.tsx:60-68`, `BusinessProductsListing/index.tsx:106` | store header |
| `business_view.components.near_business.hidden`, `.style.backgroundColor` | `BusinessProductsListing/index.tsx:107,108` | block + page background |
| `business_view.components.information.components.{location,schedule,videos,images,address}.hidden` | `BusinessInformation/index.tsx:46-50` | info sheet |
| `business_view.components.products.components.product.components.{description,image,favorite,dummy}.hidden` | `SingleProductCard/index.tsx:50,53,54`, `ProductItemAccordion/index.tsx:50` | product card |
| `business_view.components.cart.components.discount.hidden`; `[viewString].components.cart.components.products.image.hidden` | `Cart/index.tsx:93`, `SingleProductCard/index.tsx:52` (viewString=`business_view`, `Cart/index.tsx:292`) | cart |
| `checkout.components.customer.hidden`, `checkout.components.cart.components.product.components.comments.hidden` | `Checkout/index.tsx:214`, `ProductItemAccordion/index.tsx:51` | checkout |
| `confirmation.components.order.components.progress.hidden`, `confirmation.components.driver.components.{name,phone,messages}.hidden` | `OrderDetails/index.tsx:165-168` | order details |
| `orders.components.{business_logo,date,business_name,order_number,review_order_button,reorder_button,favorite,order_status}.hidden` | `SingleOrderCard/index.tsx:171-178`, `OrderDetails/index.tsx:169` | order card |
| `orders.components.{products_tab,business_tab}.hidden` | `MyOrders/index.tsx:30,31` | tabs |
| `profile.components.{wallet,languages,notification_settings,promotions}.hidden` | `UserProfile/index.tsx:70,74,75`, `Notifications/index.tsx:36,37` | profile menu |
| `bar_menu.components.{messages,help,sessions,wallet}.hidden` | `UserProfile/index.tsx:71-73`, `Wallets/index.tsx:79` | profile menu |
| `address.components.{map,icons,<field>}.hidden` | `AddressForm/index.tsx:198,199,540` | address form |
| `rtl` (boolean) | `PaymentOptions/styles.tsx:28`, `DriverTips/styles.tsx:53`, `MultiCartsPaymethodsAndWallets/styles.tsx:21`, `PaymentOptionStripe/styles.tsx:55` | RTL tweaks (never set by any provider — dead) |
| `defaultLanguages.*` | `MultiOrdersDetails/index.tsx:293,294` | fallback text (never defined) |
| Images via merge | `general.notFound`, `emptyActiveOrders`, `emptyPastOrders`, `dummies.businessHeader/businessLogo/product`, `categories.*` | empty states and dummies |

---

## Elements

| Screen / component | Element | file:line | Values today | Function | Proposal (component, token or key) |
|---|---|---|---|---|---|
| OText (884 uses / 162 files) | text primitive | `shared/OText.tsx:23-45,67-77` | `font-family: 'Poppins-Regular'` fixed + `font-weight` from prop → one family + weight = **faux bold on Android**; default size 14, color `'black'` literal; margins `mTop/mBottom/mLeft/mRight`, `hasBottom` = 10 on 3 sides; `isWrap` → `flex: weight ? 1 : 0` | all text | `Text` component with `variant` (role) → `typography.<role>` {family, size, weight, line ratio}; family resolved to the weight's file (`Poppins-SemiBold`…); color default `colors.text`; drop margin props in favor of spacing tokens |
| OText weights in use | — | 170×700, 100×400, 96×600, 37×500, 3×300 (`CartContent/index.tsx:334`, `ForgotPasswordForm/index.tsx:128`); string forms `'bold'`×124, `'normal'`×6 | — | Map `bold`→700, `normal`→400; 300 → 400 (Light file dropped) |
| OText sizes | — | see scales.md font_size | — | Fit to `typography` scale; `utils.tsize` (xs12/s14/m16/l20/xl25/xxl30/xxxl36) becomes legacy-derived |
| OButton (110 uses / 67 files) | button | `shared/OButton.tsx:29-91,93-141` | radius 30 (or `style.borderRadius`), `border-width: 2`, `min-height: 60`, padding 5/10; text 16/600, system font (no fontFamily); classes `primary` (black/black, text white), `secondary` (white/black), `third` (transparent/white), `fourth` (gray200), `active` (activeContrast, text active), `mandatory` (dangerContrast/danger), `alert` (alert/alertText), default (primary, text white) | primary/secondary CTA | `Button` with variants `primary`/`secondary`/`ghost`/`danger`/`neutral` + sizes; radius/height/text from tokens |
| OButton defaults | | `shared/OButton.tsx:197-202` | `defaultProps` **ignored (React 19)**: `class` undefined in 81/110 call sites → default branch (`colors.primary` bg); `activeOpacity` undefined → RN default 0.2 (meant 0.5) | — | Defaults in the destructuring |
| OButton call-site overrides | | 52 `style`, 28 `textStyle` | `borderRadius: 7.6`×18, `15`×7, `8`×3, `30`×3; `height: 44`×7, `40`×4; `fontSize 14`×12, `12`×9, `10`×5; unsupported props passed and ignored: `imgRightSrc`×14, `bgColor`×4, `borderColor`×4; unknown classes `filters`, `classBtn`, `classBtn2`, `addressList` (fall to default) | — | Real default = 44 h / ~8 radius / 14 text: make that `button.md`; delete dead props |
| OButton states | | `:146-169` | disabled: separate non-touchable View, bg `alert` `#E9ECEF`, text `disabled` `#D8D8D8` (low contrast); loading: spinner `colors[white|black]`, still touchable-less; pressed: opacity only | — | `button.<variant>.disabled` / `pressed` tokens; check contrast |
| OInput (41 / 27 files) | text field | `shared/OInput.tsx:43-85` | radius 15, bg white, h 55, pad 20/5, **mb 20 baked in**, iOS shadow `#000 0 2 4 .15` / Android 1px `rgba(0,0,0,.1)` border; focus border 1px `primary`; text 16, color `textNormal` or served `general.components.inputs.color`; placeholder `backgroundGray300`; icon 16×20 tinted `#959595` (defaultProps ignored → undefined → icon untinted) | text input | `Input` component: height/radius/border/focus tokens; shadow by platform absorbed by runtime; remove baked margin |
| OTextarea (0 uses) | textarea | `shared/OTextarea.tsx` | styled component created inside render | — | Delete (unused) |
| ODropDown (8 / 5 files) | select | `shared/ODropDown.tsx:24-64,119` | radius 10, pad 15, primary or white/lightGray; text 16 system font; `z-index 9999`, `top: 54`; chevron source `theme.images.drop_down` → **undefined** | select | `Select` component; chevron as icon |
| OIcon (85 / 53 files) | image / tinted PNG | `shared/OIcon.tsx:7-58` | `tint-color: colors.primary` in styled default, overridden by `tintColor: props.color` (undefined → untinted); default size **18×16** inline (defaultProps 26×26 ignored); `memo` compares only `color`+`src` (size/style changes don't re-render) | icons from PNG + remote images | Split: `Icon` (vector, size token) vs `Image` (fit, radius); `memo` fix |
| OIconButton (2 uses / 1 file) | pill button with icon | `shared/OIconButton.tsx:5-24,61-98` | h 40, radius h/2, border white; disabled `backgroundDark #484848`; text 16 system font | — | Fold into `Button` (icon slot) |
| OIconText, OKeyButton, OToggle, OAlertOriginal | — | `shared/OIconText.tsx`, `OKeyButton.tsx`, `OToggle.tsx`, `OAlertOriginal.tsx` | 0 JSX uses (OAlertOriginal is imported as `OAlert` alias in a few files — confirm) | — | Delete unused; OToggle defaults `#4cd137`/`#ecf0f1` |
| OModal (38 / 29 files) | full-screen modal | `shared/OModal.tsx:36-57`, `shared/styles.tsx:5-45` | `animationType slide`, title 20 bold, subtitle 14, close = 30×30 radius 10 white box w/ iOS shadow / Android border, AntDesign `close` 26 `textNormal`, `CenteredView` pl 20 mt 20; content in `SafeAreaViewWrapper pt` | modal | `Modal` component (header, close button tokens) |
| OBottomPopup (7 / 7 files) | bottom sheet | `shared/OBottomPopup.tsx:67-163` | backdrop `#000000AA`, sheet top radius 20, bg `#ffffff` literal, title 20 bold **raw `<Text>`** (system font), close icon `#000` literal, handle bar 50×5 `colors.border`; `StyleSheet.create` at module level; KAV `keyboardVerticalOffset 30` | sheet | `Sheet` component: `overlay`, `surface`, `radius.sheet`, handle tokens |
| OToast | toast | `shared/OToast.tsx:50-93` | Info `#6ba4ff`, Success `#73bd24` literals, Error = `colors.primary` (black); radius 16, pad 16, text 14 `#fff` raw `<Text>`; fade 300 ms; `bottom: (insets.bottom||20)+20`; `zIndex 9999999999`; mounted **outside** the inner provider | feedback | `Toast` with `info/success/error` → `colors.info/success/danger` + `on_*`; error should not be primary |
| Alert / OAlert / OAlertOriginal | system alert | `providers/AlertProvider.tsx:25`, `shared/OAlert.tsx:23`, `shared/OAlertOriginal.tsx:29` | `Alert.alert` (native, not themable); OAlert also `Vibration.vibrate(100)` | confirm | Out of scope (decisions: system alerts left out) |
| HeaderTitle (14 / 3 files) | screen title | `shared/HeaderTitle.tsx:11-19` | 20, weight `ios ? '600' : 'bold'`, `marginTop android 50 / ios 30` (hand-made inset), ph 20, `textTransform: capitalize` | title | `typography.screenTitle` + safe-area inset; one header component with NavBar |
| NavBar (35 / 35 files) | top bar | `NavBar/index.tsx:29-90`, `NavBar/styles.tsx:6-55` | `height: 50` **plus** `paddingTop insets.top+24`, `paddingBottom 24` (height < padding — Yoga grows it; verify); title bold (no family → system? it is OText, so Poppins-Regular + bold) 20 / 16 with subtitle, color `black`; subtitle 14 `disabled #D8D8D8`; back = 30×30 radius 10 white box with shadow/border, AntDesign `left` 18; no title → logo `FastImage` h 25 contain from `images.logos.logotype` | header | `Header` component: height, padding, title role, back button = `IconButton`; logo key |
| BottomNavigator | tab bar | `src/navigators/BottomNavigator.tsx:34-90` | bg `backgroundPage`, `height 60 + insets.bottom`, pt 10, Android pb `insets.bottom+10`; hidden when signed out (`display none`); Ionicons 19 (`home-outline`, `pricetags-outline` rotated 270, `search-outline`, `bag-outline`, `person-circle-outline`); active `colors.active` (= primary after merge), inactive `black` at opacity 0.6; label `tsize.s` 14, system font | primary nav | `TabBar` component: `tab_bar.background/active/inactive`, icon size token, label role; 5 tabs as `screens` |
| SafeAreaViewWrapper (39 / 38 files) | screen root | `src/layouts/SafeAreaViewWrapper.tsx:52-99` | SafeAreaView edges left/right only; bg `backgroundPage` (or `props.backgroundColor`); `pt`/`pb` add insets; wraps everything in a `ScrollView` unless `disableScrollView`; KAV iOS `padding`, Android offset 20 + manual keyboard spacer | screen container | Keep as layout primitive; bg `colors.background`; one inset policy |
| Container | screen root (alt) | `src/ui/src/layouts/Container.tsx:6-31` | ScrollView, padding `ios 0 20 / android 20 20` (platform branch), `paddingTop insets.top` | screen container | Merge with SafeAreaViewWrapper; `space.page_x` |
| FloatingBottomContainer | sticky footer | `src/ui/src/layouts/FloatingBottomContainer.tsx:4-30` | width = `Dimensions.get('window').width` **at import**; pad 10, `padding-bottom ios 20 / android 10` (hand-made inset); border-top 1 `backgroundGray200`; bg `#FFF` literal; z 1000 | bottom CTA bar | `BottomBar` with inset + `colors.surface` |
| SafeAreaContainer | | `src/ui/src/layouts/SafeAreaContainer.tsx:4` | bg `backgroundPage` | — | Confirm usage; merge |
| CookieConsentBanner | consent card | `CookieConsentBanner/styles.tsx:3-63` | absolute `bottom 90` (fixed, assumes tab bar), l/r 10, pad 24, radius 12, bg `primary` (fallback `#2C7BE5`), text `primaryContrast #E9F2FE` 14/22, Accept bg primaryContrast text primary 14/600, shadow `#000 0 4 10 .25`, `elevation 99999`; system font; outside the inner provider | consent | `Banner` component; bottom = tab bar height + inset; colors `primary`/`on_primary` |
| SupportBubble | FAB | `SupportBubble/styles.tsx:4-17`, `index.tsx:54,63` | `bottom insets.bottom + 88`, right `margins.horizontal`, bg `primary` or WhatsApp `#25D366`; icon 28 white; z `zi.xxl` | support | Keep brand green literal (third-party brand); size/position tokens |
| StatusBar | system | `TemplateApp.tsx:344-352,373`; `BusinessesListing/Layout/Original/FlatListBusinessListing.tsx:39-43`; `OBottomPopup.tsx:74`; `pages/IntroductoryTutorial.tsx:200` | `dark-content`, bg = local `backgroundPage` (Android); listing toggles light/dark on scroll with `notchColor` | — | `status_bar.style` derived from `colors.background` luminance |
| Skeletons | placeholders | 48 files `shared/Skeleton` (`Placeholder`×67, `PlaceholderLine`×183, `Fade`×70) | library default color (#efefef-ish, not themed); line heights 20/15/10/18/70, widths % | loading | `Skeleton` component with `colors.skeleton` + radius; keep sizes per screen |
| Spinners | loaders | `LoadingOverlay` (14 files, `pages/SpinnerLoader.tsx`); `ActivityIndicator` 13 uses: `colors.primary`×5, `active`×2, `white`, `#000` | loading | `colors.primary` / `on_primary`; overlay spinner is third-party (white default) |
| PressableScale | press feedback | `shared/PressableScale.tsx:16-37` | spring to 0.97, speed 50, bounciness 4/0, pressed opacity 0.82 | card press | `motion.press` token (scale, opacity) |
| CardAnimation (5 / 4 files) | press feedback | `shared/CardAnimation.tsx:20-41` | pressed: elevation 2, shadow `#888` opacity .8 radius 0; radius 12; activeOpacity 0.8; `StyleSheet.create` in render | card press | Same as PressableScale → one `pressed` style |
| Navigation transitions | motion | `src/navigators/HomeNavigator.tsx:192-193` | open 250 ms, close 200 ms (Cart) | — | `motion.base` |
| OToggle animation | motion | `shared/OToggle.tsx:107-111` | 300 ms (via ignored defaultProps → `undefined`) | — | Unused component |

## Duplicates (same function, different implementation)

| Function | Implementations (file:line) | Visible differences |
|---|---|---|
| Primary button | `OButton` (`shared/OButton.tsx`), `OIconButton` (`shared/OIconButton.tsx`), `UIButton`/`SocialButton` (`src/ui/src/Forms/UIButton.tsx`, `Forms/styles.tsx:36`), 117 hand-made `styled.TouchableOpacity` + 4 `Pressable` (components.md "button") incl. `CookieConsentBanner/styles.tsx:42,46`, `SupportBubble/styles.tsx:7`, `IntroductoryTutorial.tsx:133-175` | radius 30 vs 20 vs 8 vs 7.6; h 60 vs 44 vs 40; system font vs Poppins |
| Close / back square button | `shared/styles.tsx:5` `ModalCloseButton`, `NavBar/styles.tsx:23` `BackArrow` (identical 30×30 r10 white + shadow), plus `BusinessesListing/Layout/Original/styles.tsx:14` `BackArrow` | Same look copied 3× → one `IconButton` |
| iOS-shadow / Android-1px-border card trick | `androidBorderColor = 'rgba(0,0,0,0.1)'` in 12 files (`shared/styles.tsx:4`, `OInput.tsx:8`, `NavBar/styles.tsx:4`, `PhoneInputNumber`, `OrderDetails`, `ProductForm`, `UserFormDetails`, `Sessions`, `ProductOption`, `AddressList`, `UserProfile`, `BusinessesListing/Original`) | iOS shadow vs Android border → `shadow.sm` + runtime |
| Text | `OText`; raw `<Text>` in 10 files (`OToast`, `OBottomPopup`, `OToggle`, `UIButton`, `ServiceForm`, `ProfessionalProfile`, `BusinessReservation`, `LegacyPlacesInput`, `OrderDetails/styles.tsx` (SVG), `IntroductoryTutorial`); 29 `styled.Text` (incl. OButton, OIconButton, ODropDown, OIconText, CookieConsentBanner) | Raw/styled Text has no fontFamily → **system font**, not Poppins |
| Text input | `OInput`; raw `TextInput` in 8 files (`SearchBar`, `LoginForm`, `SignupForm`, `VerifyPhone`, `UserVerification`, `ProductForm`, `BusinessSearchMap`, `PaymentOptionCard`, `LegacyPlacesInput`); 3 `styled.TextInput`; `PhoneInputNumber` | Different heights/radius/borders |
| Modal / sheet | `OModal` (slide, full screen), `OBottomPopup` (fade, sheet), raw `<Modal>` in `pages`/components (`IntroductoryTutorial` etc.), third-party Stripe/Intercom | Different headers/close buttons |
| Screen container | `SafeAreaViewWrapper`, `Container`, `SafeAreaContainer`, page-level `SafeAreaView` (6) | Different insets and paddings (`ios 0 / android 20`) |
| Title | `NavBar` title, `HeaderTitle`, `OModal` title (20 bold), `OBottomPopup` title (20 bold raw Text) | Weight `600` iOS vs `bold`; font family differs |
| Press feedback | `PressableScale` (scale .97 / .82), `CardAnimation` (elevation + shadow), `TouchableOpacity` default .2, OButton `activeOpacity` (undefined) | Four behaviours |
| Spinner | `ActivityIndicator` (13), `LoadingOverlay` (14 files) | Colors primary/active/white/#000 |

## Blocks and pieces

| Page | Block or piece | Hideable? Movable? | Why |
|---|---|---|---|
| Global | Bottom tab bar (5 tabs: Home, Offers, Browse, Orders, Profile) | Tabs hideable individually (except Home/Profile); not movable | Product nav; Offers/Browse optional per merchant |
| Global | SupportBubble | Hideable | Driven by support channel config today |
| Global | CookieConsentBanner | Not a theme toggle (server config `cookie_consent_enabled`) | Legal |
| Global | Toast | No | Feedback |
| Global | NavBar logo (no-title mode) | Image key, not hideable | Brand |
| Global | Splash (JS) image | Image key (served `ios`/`android` per-density today) | Native splash cannot change at runtime (lesson 13) |

## Images

| Key or source | file:line | Painted box | Fit | Fallback | alt |
|---|---|---|---|---|---|
| `images.logos.logotype` (bundled `logotype.png`; served `header.components.logo.components.image`) | `TemplateApp.tsx:65`; `NavBar/index.tsx:76-80`; `pages/Splash.tsx:52`; `utils/logoSource.ts:32,40` | NavBar 100%×25; Splash `styles.logo` | contain | — | none |
| `images.logos.logotypeInvert` (`logo-long.png`) | `TemplateApp.tsx:66`; `utils/logoSource.ts:33` | — | — | — | — |
| Compact mark (served favicon / my_products logo / site logo) | `utils/logoSource.ts:36-40` | per caller | — | logotype | — |
| Splash per density (served `ios.*`, `android.*`) | `pages/Splash.tsx:16-46` | `Dimensions` thresholds (iOS ≤640/≤1242; Android ≤200/≤720/≤960) | — | logotype | — |
| `images.general.noNetwork` vs merged `notNetwork` | `TemplateApp.tsx` general; `NetworkError/index.tsx:19` reads `no_internet` directly | — | — | key mismatch in merge | — |
| `images.categories.all` | `TemplateApp.tsx` categories; `BusinessTypeFilter/index.tsx:82` | — | — | **lost when any served theme arrives** (merge bug) | — |
| `images.tabs.*` (7 PNGs) | `TemplateApp.tsx` tabs | — | — | — | unused → delete |
| `images.general.heart` (Lottie JSON) | `LottieAnimation/index.tsx:43` | — | — | — | Not an image: motion asset |
| `images.dummies.driverPhoto/customerPhoto` (remote cloudinary) | `TemplateApp.tsx` dummies | — | — | — | unused → delete |
| `src/assets/icons/*` 99 PNG, `src/assets/images/*` 64 | manifest | — | — | — | Many are tinted UI icons (see Icons) |

## Fonts

- Bundled: `src/assets/fonts/Poppins-{Thin,Light,Regular,Medium,SemiBold,Bold}.ttf` via `react-native.config.js` `assets`; copied to `android/app/src/main/assets/fonts/` (same 6); iOS `ios/ReactNativeAppsTemplate5/Info.plist` `UIAppFonts` lists the same 6 + 13 vector-icon fonts. Android icon fonts via `android/app/build.gradle:139` `fonts.gradle`.
- Choice: one family file `'Poppins-Regular'` + `fontWeight` (`OText.tsx:25,38`, `OIconText.tsx:17`) → Android faux bold for every weight; iOS resolves weights within the family (verify). Only `BusinessInformation/styles.tsx:59,63` picks a file per weight (`Poppins-Bold`).
- Hard-coded families: `'Poppins-Regular'` ×3 (`OText.tsx:25`, `OIconText.tsx:17`, `AddressForm/index.tsx:517`); `'Poppins'` ×7 (`WebsocketStatus/styles.tsx:15,30,38,53`, `ProjectForm/index.tsx:176`, `pages/IntroductoryTutorial.tsx:88,96`) — **`'Poppins'` does not exist on Android** (falls back to system).
- No fontFamily at all (system font): `OButton` text, `ODropDown`, `OIconButton`, tab bar labels, `OToast`, `OBottomPopup` title, `CookieConsentBanner`, all `styled.Text` without family.
- Thin/Light: **no file is referenced by name**; only reachable via weight `'300'` (2 call sites above) on iOS. Safe to drop (decision already logged) — map 300 → 400.
- Platform weight branch `ios ? '600' : 'bold'` ×14 (`HeaderTitle.tsx:13`, `FlatListBusinessListHeader.tsx:106`, `BusinessProductsListing/index.tsx:533,659`, `HighestRatedBusinesses/index.tsx:56`, `ProfessionalProfile/index.tsx:203,220,321`, `ServiceForm/index.tsx:329,360,440,542,551`, `GiftCard/SendGiftCard/index.tsx:61`, inverse in `ScheduleAccordion/index.tsx:47`) → a single `weight: 600` with per-weight font files removes the need.

## Icons

- Vector sets (react-native-vector-icons 10): AntDesign 35 imports (aliases `AntDesignIcon`, `IconAntDesign`, `AntIcon`, `AntDesignIcons`, `Icon`), MaterialCommunityIcons 25 (`MaterialCommunityIcon(s)`, `MaterialIcon`, `MaterialComIcon`), Ionicons 22 (`Icon`, `Ionicons`), Feather 7 (`FeatherIcon`, `Icon`, `FIcon`), SimpleLineIcons 6, FontAwesome5 4, FontAwesome 3, MaterialIcons 2, Foundation 1 → **9 sets**, size/color passed per call (`size={N}` literals, color from `theme.colors.*` or literals).
- Tinted PNGs: `OIcon` (`tintColor = props.color`, default untinted because the styled `tint-color: primary` is overridden by `tintColor: undefined` — verify), `OIconText`, `OIconButton`, `ODropDown` `DropIcon`; 99 PNG icons under `src/assets/icons`.
- SVG: `react-native-svg` only in `OrderDetails/styles.tsx:3` (gradient/progress art); no remote SVG.
- Proposal: one `Icon` wrapper (`set` + `name`, `size` from `icon` scale, `color` token default `colors.icon`); reduce to 2 sets (Ionicons + MaterialCommunityIcons) in a later phase.

## Platform branches, safe areas, sizes from the screen

| Kind | file:line | Today | Proposal |
|---|---|---|---|
| Hand-made inset | `HeaderTitle.tsx:15` | mt android 50 / ios 30 | safe-area inset + `space` |
| Hand-made inset | `FloatingBottomContainer.tsx:17` | pb ios 20 / android 10 | `insets.bottom` |
| Hand-made inset | `Container.tsx:11` | padding ios `0 20` / android `20 20` | one `space.page_x`, top from inset |
| Hand-made inset | `pages/UserVerification.tsx:17`, `pages/MultiOrdersDetails.tsx:12`, `pages/ProjectForm.tsx:37`, `pages/NetworkError.tsx:8`, `pages/Wallets.tsx:25`, `Wallets/index.tsx:135`, `PaymentOptionCard/index.tsx:129`, `Checkout/index.tsx:995` | ios 0 / android 20–30; ios 40 / 12; ios 35 / 10 | inset |
| Shadow vs border | 12 files `androidBorderColor` | iOS shadow, Android 1px border | `shadow` token; runtime paints per platform |
| Keyboard | `SafeAreaViewWrapper.tsx:64-65`, `OBottomPopup.tsx:119-120` | KAV ios padding / android offset 20/30 + spacer | behaviour, not theme |
| Font weight | 14 sites (Fonts §) | `'600'` vs `'bold'` | per-weight files |
| Tab bar | `BottomNavigator.tsx:43-46` | h 60+inset; Android pb inset+10 | `tab_bar.height` + inset |
| NavBar | `NavBar/index.tsx:52` | pt `insets.top + 24`, pb 24 (fixed `height 50` in styles) | `header.height` + inset |
| Toast | `OToast.tsx:67` | `bottom (insets.bottom||20)+20` | ok; token for offset |
| Cookie banner | `CookieConsentBanner/styles.tsx:5` | `bottom 90` fixed | tab bar height + inset |
| Dimensions at import | `FloatingBottomContainer.tsx:4`, `Forms/styles.tsx:4`, `Forms/Tabs.tsx:8`, + 9 component files (`ServiceForm:39`, `ProfessionalProfile:24`, `HelpOptions:9`, `BusinessPreorder:32`, `BusinessMenuList:14`, `ProductForm:70`, `GoogleMap:17-18`, `PaymentOptionStripe:201`) | width frozen at module load | `useWindowDimensions` (phone only, low priority) |
| Dimensions grid | `OrderTypeSelector/index.tsx:42-48` | 3 cols if ≥5 items and width>380 else 2; gap `margins.horizontal` | `space` token |
| Total | 38 files use `Dimensions`/`useWindowDimensions`; no `isTablet` | — | phone only |

## Off the scale or without a token

| Value | Where | Why it does not fit |
|---|---|---|
| `#6ba4ff`, `#73bd24` | `OToast.tsx:53,59` | toast info/success; no `info`/`success` token used |
| `#000000AA`, `#ffffff`, `#000` | `OBottomPopup.tsx:131,141,110` | overlay / surface / icon literals |
| `#2C7BE5`, `#FFF` | `CookieConsentBanner/styles.tsx:10,24,32,47,55,62` | fallbacks (`||`) → delete once theme complete |
| `#25D366` | `SupportBubble/styles.tsx:5` | WhatsApp brand — keep as literal |
| `#4cd137`, `#ecf0f1` | `OToggle.tsx:143-144` | unused component |
| `#959595` | `OInput.tsx:185` | ignored defaultProp |
| `rgba(0,0,0,0.1)` | 12 files | shadow substitute |
| `#888` shadow, opacity .8 | `CardAnimation.tsx:23-26` | pressed shadow |
| `zIndex 9999999999`, `elevation 99999`, `z 99999` | `OToast.tsx:82`, `CookieConsentBanner/styles.tsx:8-9` | z-index scale (`zi` has 30000/10000/9999) |
| radius 7.6 ×18 | OButton call sites | not on any scale; real button radius |
| min-height 60, radius 30, border 2 | `OButton.tsx:30-32` | default rarely kept |
| h 55, radius 15, mb 20 | `OInput.tsx:46-52` | input height not on `control_height` |
| `height 50` + paddings 24 | `NavBar/styles.tsx:10`, `NavBar/index.tsx:52` | header height |
| `bottom 90`, `88` clearance | `CookieConsentBanner/styles.tsx:5`, `SupportBubble/styles.tsx:4` | derived from tab bar |
| `keyboardVerticalOffset 30` / `20` | `OBottomPopup.tsx:120`, `SafeAreaViewWrapper.tsx:65` | behaviour |

## Maweja (to delete — inventory only)

Global/infra pieces: `src/utils/appDesign.ts` (whole file; `APP_DESIGNS`, `resolveAppDesign`), `src/utils/__tests__/appDesign.test.ts`, `src/ui/index.tsx:104,319-320` (`MawejaCartList`, `MawejaCartPage` exports). Branch readers of `resolveAppDesign`: `Home/index.tsx:10,67`, `OrderDetails/index.tsx:47,104`, `Checkout/index.tsx:26,143`, `BusinessProductsListing/index.tsx:11,822`, `BusinessesListing/index.tsx:7,14`, `pages/OrderDetails.tsx:9,18`, `pages/CartList.tsx:7,27`. 56 files mention maweja in total (list in other areas). Maweja-only served keys: `my_products.components.website_settings.components.values.{name,description}` (`Home/layouts/Maweja/index.tsx:59,60`).

## Not verified

- **No simulator runs**: everything above is from code reading. Not checked visually on iOS or Android: faux bold on Android, iOS weight resolution with `'Poppins-Regular'` + `fontWeight`, NavBar's real height (`height: 50` with 95+ pt of padding), CookieConsentBanner overlap with the tab bar on devices with a home indicator, OIcon default tint.
- Whether Metro resolves `styled-components` (web entry, outer provider, `LottieAnimation`) to the same native bundle/context as `styled-components/native` (via the package's `react-native` field). `node_modules` is not installed in this worktree, so the styled-components version and its `useTheme` behaviour outside a provider were not checked. If contexts differ, `LottieAnimation` reads the local theme and `OToast` (native `useTheme` outside the inner provider) would read the outer one or nothing.
- What the served v1 theme actually contains for any real project (only the code paths are listed); whether any project sets `app_design` = maweja.
- Image keys marked "never read" may be reached through dynamic access not caught by grep.
- `OAlertOriginal` usage: imported as `OAlert` alias in some files; JSX count for the alias not split.
- Submodule: only theme-related reads noted (`themeUtils.js`, `OrderingThemeContext`, `OptimizationLoadContext`, `BusinessList`, `BusinessSearchList`); other controllers not audited.
