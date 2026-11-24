# Area 5 — Orders and post-order

Phase 1 inventory, read-only. **Code reading only: no simulator was run, so no screenshot or
painted measurement backs this report** (see "Not verified"). The submodule `src/@/` is
excluded. Only the `original` design path is inventoried; maweja code is listed under "To
delete". Shared primitives (OText, OButton, OInput, NavBar, Tabs, NotFoundSource,
FloatingBottomContainer, OModal, OIcon/OIconButton, SafeAreaViewWrapper, CardAnimation,
LottieAnimation, PlaceSpot, GoogleMap, ProductItemAccordion, TaxInformation) are covered by
another agent: here they are only noted where this area bypasses or overrides them.

Literal counts from `.theme-audit/inventory.csv` for this area's files (tests and maweja
excluded): **~917 literals**: space 290, size 187, font_size 125, font_weight 111, radius
86, line_height 77, color 39, border 32, shadow_part 29. **132 inline `style={{`**, **12
files with `StyleSheet.create`** (all inside render, so they do see the theme), **5
`Platform.OS` branches that change the look**, **3 `Dimensions` reads**. Heaviest files:
`OrderDetails/Bill.tsx` (146), `OrderDetails/index.tsx` (109), `OrderDetails/styles.tsx`
(93), `MultiOrdersDetails/index.tsx` (80).

Font sizes used: 12 (×66), 14 (×19), 16 (×13), 20 (×7), 15, 18, 10, 13, 8 plus
`tsize.*` and `tsize.xxl + 2` (32) / `tsize.m + 2` (18). Radii used: 7.6 (×8), 8 (×17),
10, 12, 14, 15 (×11), 18, 20, 25, 30 (×6), 50 — 11 distinct values for "rounded corner".

## Routes and screens

| Route | Navigator | Page | UI root | Root container |
|---|---|---|---|---|
| `MyOrders` | BottomNavigator tab (`BottomNavigator.tsx:190`) | `src/pages/MyOrders.tsx` | `MyOrders` → `OrdersOption` ×3 / ×1 → `ActiveOrders`/`PreviousOrders` → `SingleOrderCard` | `SafeAreaViewWrapper` ScrollView with pull-to-refresh; lists are `.map()`, **no FlatList** |
| `OrderDetails` | HomeNavigator stack (`HomeNavigator.tsx:239`) | `src/pages/OrderDetails.tsx` | `OrderDetailsUI` | `OrderDetailsContainer` ScrollView (`OrderDetails/styles.tsx:10`) inside wrapper with `disableScrollView` |
| `MultiOrdersDetails` | HomeNavigator (`:165`) | `src/pages/MultiOrdersDetails.tsx` | `MultiOrdersDetailsUI` | own `styled(SafeAreaView)` (not the wrapper) + `OrdersDetailsContainer` ScrollView |
| `ReviewOrder` | HomeNavigator (`:214`) | `src/pages/ReviewOrder.tsx` | `ReviewOrderUI` | `Content` ScrollView + `FloatingBottomContainer` |
| `ReviewProducts` | HomeNavigator (`:219`) | `src/pages/ReviewProducts.tsx` | `ReviewProductsUI` → `SingleProductReview` ×n | same |
| `ReviewDriver` | HomeNavigator (`:224`) | `src/pages/ReviewDriver.tsx` | `ReviewDriverUI` | same |
| `Messages` | HomeNavigator (`:260`) | `src/pages/Messages.tsx` | `MessageListing` → `OrderListing` → `ActiveOrders isMessageView` → `SingleOrderCard` | wrapper ScrollView + refresh |
| `MessageView` | HomeNavigator (`:255`) | `src/pages/MessageView.tsx` (own `OrderMessageUI`) | `Messages` (own thread, `Messages/ChatThread.tsx`) | `KeyboardAvoidingView` + the thread's FlatList (inverted) |
| `Help` | HomeNavigator (`:274`) | `src/pages/Help.tsx` | `Help` (`CmsContent`) → `LastOrders` | wrapper ScrollView **plus** inner `Container` ScrollView (nested) |
| `HelpOptions` | HomeNavigator (`:281`) | `src/pages/HelpOptions.tsx` | `HelpOptions` → WebView | wrapper ScrollView + inner ScrollView + WebView of screen height (nested ×2) |
| `Notifications` | HomeNavigator (`:270`) | `src/pages/Notifications.tsx` | `NotificationsList` (UserFormDetails controller) | wrapper ScrollView + inner `SafeAreaView` + inner ScrollView (nested ×2) |

All pages use `NavBar` with a translated title. **Bug:** `ReviewDriver` page title uses
`t('REVIEW_PRODUCT', 'Review Product')` (`src/pages/ReviewDriver.tsx:20`).

## Blocks per screen (render order, `original` path)

### MyOrders (`src/ui/src/components/MyOrders/index.tsx`)
1. Root `View` — inline `paddingHorizontal: margins.horizontal (20)`, `marginTop: 20` (`:43`).
2. **Tabs** (`:44-53`) — shared `Tabs` with `bgColorSelected=active`, `textColorSelected=white`, `textColorUnselected=black`, wrapper `marginBottom: 16`. Tabs: Orders (always), Business (`theme.orders.components.business_tab.hidden`), Products (`…products_tab.hidden`), Gift card (server config `platform_store_giftcard_enabled`).
3. Orders tab: three `OrdersOption` stacked — **Preorders**, **Active**, **Past** (`:56-78`). Each renders: empty state → section title → skeleton → list → load more → 8 px full-bleed gray divider (ActiveOrders only).
4. Business tab: `OrdersOption isBusiness` → `PreviousBusinessOrdered` → `BusinessController simpleView` (business card, other area).
5. Products tab: `OrdersOption isProducts` → `PreviousProductsOrdered` → `SingleProductCard` (product card, other area).
6. Gift card tab: `GiftCardOrdersList` (gift-card area; not audited here).

### OrderDetails (`src/ui/src/components/OrderDetails/index.tsx`, original path)
1. NavBar title `Order No. {id}` (page, `src/pages/OrderDetails.tsx:41`; the literal "No." is not translated).
2. **Status header** (`:360-435`, only while not completed) — `Header` card gray100, radius 20, padding 20, margin-h 20, mb 20:
   - Delivery PIN (`DeliveryPin.tsx:34-45`) when requested.
   - Status text `tsize.l` (20) / 600 + **help button** (life-saver FontAwesome 24 black in white 5 px pill, iOS shadow / Android 1 px border) that opens the business chat.
   - ETA date line (default OText 14) `dddd, MMMM D YYYY`.
   - **Progress bar** — `LinearGradient` hard stop at `percentage`, colors `[active, activeContrast]`, h 12, r 8, `StaturBar` margin 20 0.
   - "Driver attending another order" (status 23), 14, **`color='#000'`** (`:392`).
   - Reservation block (date/time, guests, `tsize.s` bold) **or** big ETA time `tsize.xxxl` (36) bold + "Estimated Time / Pickup Order" 14.
3. **Completed header** (`:437-457`) — `BusinessInfoContainer` gray100, padding 16, radius `radius.l` (10), logo 44×44 r15 (`Image`, not FastImage), name bold, date, status in **`success500`**, 40×40 round checkmark in `active` with white `checkmark-outline` 28.
4. **Driver map** (`:459-495`) — `GoogleMap` in `Map` (h 250, mb 20, r 20) wrapped by `View` margin-h 20, **radius 30 without `overflow: hidden`** (radius does not clip). Map = out of scope.
5. **Reservation static map** (`:503-525`) — Google Static Map `FastImage` 100% × 190, r 30, cover + `OButton class='secondary'` "Get Directions" (overrides: mt 10, r 8, minH 44, text 14 bold).
6. **Place spot** (`:527-536`) — shared `PlaceSpot` for eat-in/curbside/drive-thru.
7. **Delivery preference + Comment** (`:538-576`) — titles `tsize.m` (16) 600, values **12**; comment block `marginTop: 20` inline.
8. **Big total** (`:578-607`) — `WrapperFullTotal` padding 20 0, **5 px bottom border gray200**; "Total" and amount at `tsize.xxl + 2` = **32** bold, shrinks to `tsize.m + 2` = 18 when the price string > 11 chars (`:596`). Custom-order variant "Estimated Total ~ …".
9. **Student** (`:609-611`) — `OrderStudentInfo` (school vertical): title 18 bold, name 15, meta 13 `backgroundGray300 || '#909BA9'` (a *background* token used as text), bottom border `backgroundGray200 || '#E9ECEF'`.
10. **Bill** (`Bill.tsx`) — `ProductList` (products as `ProductItemAccordion` with image/options hidden; professionals block with 80×80 photo) → totals card (`backgroundGray100`, **r 15, padding 20, mt 10** inline, `:137`) with ~14 kinds of lines, **every text 12/18/400** repeated ~40 times; info icons `AntDesign infocirlceo 16 primary`; free delivery: struck price `disabled || '#9E9E9E'` + "Free" 12/600 primary; total row 12 (same size as lines — only `hideTotal` decides) → `Separator` → "Payment methods" (14/24/500) + rows (pay icon 30×30, name 500, amount) → `Separator`. Tax/fee info opens `OModal` + `TaxInformation`.
11. **Review CTA** (`:624-667`) — "Review your order" (500) + `OButton class='alert'` overridden to **text 10 bold, r 15, bg `backgroundGray200`, padding 7/0** + `Separator`. Only status 1/11/15 and not reviewed.
12. **Addresses** (`:668-735`) — label 600 + `WrapperAddress` (padding 10 0, **1 px border in `white`**, r 10: an invisible border on a white page).
13. **Driver** (`:737-855`) — `Separator`, photo 48×48 **r 10** (FastImage cover) in `WrapperPhoto` (r 50, white bg, mr 14), name `tsize.s + 1` = 15 / 18 / 600, absolute icon row (chat `MaterialCommunityIcons chat 24 black`, phone `phone-hangup 24 black rotated 220°`), each in `IconContainer` (padding 5, white, r 10, iOS shadow / Android border), caption "Your Driver".
14. **Send gift card** (`:857-862`) — gift-card orders only (`SendGiftCard`, other area).
15. **PoweredBy** footer (`:864`) — `paddingTop 20, paddingBottom 150` inline.
16. **Loading skeleton** (`:868-910`) — `shared/Skeleton` lines sized 10–20 tall, no `Fade` animation (others in the area use `Fade`).
17. **Error state** — none on screen: a toast + redirect to `BottomTab/Business` (`:290-295`).

`OrderContent` reserves **`margin-bottom: 150`** twice (styled `:94` and inline `:326`) plus PoweredBy `paddingBottom: 150`: ~300 pt of blank space at the end of the scroll.

### MultiOrdersDetails (`src/ui/src/components/MultiOrdersDetails/index.tsx`)
Content padding-h 20 inline (`:105`). Blocks: greeting "Hey {name}" 20/30 (+ name 700) and message 12/18 → `Divider` (8 px gray100, margin-h −40) → Customer details (title 16/24/500, three lines 12/18) → Divider → Payment method → Divider → Delivery address (delivery only) → Divider → **Order summary** card (gray100, margin-h −40, padding 25 40) with group progress bar (`[primary, backgroundGray100]`, h 12, **no radius**) + status 14 + per-order rows 12 + `BorderLine` 1 px gray200 + "Payment total" 14/500 → per-order `SingleOrderCard` (multi variant: "Order #id" 16/500, type+date 12, outlined "Order Details" `OButton` with inline r 7.6 h 44, "From" 16/500, business name/email/phone/address 12, phone/chat PNG icons 16 tinted `disabled`, optional individual progress bar, "Order total" 16/600) → Divider. Empty/expired: `NotFoundSource`. Every text passes `color={textNormal}` explicitly (~35 times).

The page wraps it in its own `SafeAreaContainer` with **`padding-top: Platform.OS === 'ios' ? 0 : 24px`** (`src/pages/MultiOrdersDetails.tsx:12`, hand-made inset) and passes `disableScrollView` to a `SafeAreaView` that ignores it.

### ReviewOrder / ReviewProducts (+ SingleProductReview) / ReviewDriver
Same template three times:
1. Header row: title "Rate the experience" / "Review Product" 20/700, subtitle "How was your experience with X?" 14; logo/photo 44×44 in a white r8 shadowed box (`shadowRadius 3, offset 1/4, opacity .1, elevation 3`).
2. Already-reviewed message (primary, centered, my 20).
3. Like / dislike: two 54×54 `LikeHandsButton` (r8, shadow `rgba(0,0,0,.2)` 0/1/4, elevation 4), AntDesign `like2`/`dislike2` **33**, color `primary` when selected else `lightGray`. `ProductHeader` has **`margin-left: -15px`** to undo the button margin.
4. 0.5 px rule `backgroundGray200`, mt 20 (inline `View`, ×2).
5. Quick-comment title (default 14 / 700), chips: `OButton` overridden inline — h 40, padding-h 5, margin 3/10, **r 15**, text 12; selected: bg `activeContrast`, border+text `active`; unselected: bg white, border **`alert`**, text `primary`.
6. "Do you want to add something?" 16/700 mt 30 + `OInput` multiline h 100, r 15 (order) / r 8 (product, driver), border `secondaryContrast`, mb 40.
7. Full-screen `Spinner` overlay (`LoadingOverlay`) while sending.
8. `FloatingBottomContainer` with full-width "Continue" `OButton`: `parentStyle` bg `primary`, **r 30**.

### Messages list (`MessageListing`)
`MessageListingWrapper` mt 20, padding-h 20. Empty: `NotFoundSource` with `images.general.notFound` PNG. Loading: 6 skeleton cards (border `border`, r 10, padding 10, gap 10). List: `ActiveOrders isMessageView` → `SingleOrderCard` with unread counter (24×24, r 7.6, bg `activeContrast`, text `active`) instead of price. An `OModal` + `MessagesView` branch (`:108-121`) is **dead** (`seletedOrder` is never set).

### MessageView (chat, `Messages/index.tsx` inside `src/pages/MessageView.tsx`)
NavBar (business or driver name + "Driver"/"Business" subtitle) → the chat thread (react-native-gifted-chat when this was audited; now the app's own `Messages/ChatThread.tsx`, whose list keeps `xs` under the last message and `md` over the first, and whose web addresses, emails and phones are links): list padding top 60 / bottom 16 / h 20 on `backgroundPage`; bubbles left `inputDisabled`, right `active` with white text, padding 5, tail corner 0, other corner `radius.l`; message image default; scroll-to-bottom button (chevron-double-down 32, **no color**, border `border`); loading `ActivityIndicator` **`color="#000"`** (`:478`). Input toolbar: white, top border `border`, quick-message chips row (h 32, r 50, border `border`, text 14 `textNormal`), composer pill (h 44, 85 %, `inputChat`, r 15) with image-picker action (28×28 PNG tinted `textNormal`; preview 32×32 r10 with close-circle 24 `backgroundDark`) and send button (44×44, r 15, `primary`, white send PNG, opacity .6 when disabled). Ended order: close-octagon 24 black + "You can't send messages…" 14. **Quick messages fall back to "Lorem ipsum 1–4"** (`:60-65`): unless the four keys are translated, customers see lorem ipsum.

### Help / HelpOptions
Help: title "All the themes" `tsize.l` bold mb 20 (string itself reads oddly: "themes" = topics) → CMS page rows (`HelpSubItem`: bottom border `border`, padding-v 15, text 14, chevron PNG 15) inside `AnimatedItem` → skeleton 5×30 → error `NotFoundSource simple` → "Last Orders" 18/600 + `LastOrders` (3 completed orders as 100-tall header images, r 8, with a **`rgba(0,0,0,0.3)` overlay** and white 16/700 name + 12 "Order Completed {date}"). HelpOptions: CMS HTML body in a WebView (out of scope) or `NotFoundSource`.

### Notifications
Intro text (inline `fontSize 16, lineHeight 22, color textSecondary || '#555555'`, mb 24) → three rows (SMS, Emails, Push) `SettingItem` (padding-v 18, bottom border gray200) with label `tsize.m`/500 and native `Switch` (track `disabled`/`active`, thumb white, `ios_backgroundColor` white, a meaningless `borderBlockColor`) → Spinner overlay. Visibility: the whole content renders only if **both** `theme.profile.components.promotions` and `.notification_settings` are not hidden; otherwise the screen is blank under its NavBar (no empty state).

## Elements

| Screen / component | Element | file:line | Values today | Function | Proposal (component, token or key) |
|---|---|---|---|---|---|
| MyOrders | Screen padding | `MyOrders/index.tsx:43` | inline padding-h `margins.horizontal`, mt 20 | page gutter | `space.page_x` / `space.section` on a screen container |
| MyOrders | Tabs | `MyOrders/index.tsx:45-52` | bg selected `active`, text white/black | segmented tabs | shared `Tabs` component variant (`segmented`) colors from `color.primary` / `on_primary` / `text` |
| OrdersOption | Section title "Active/Preorders/Past" | `OrdersOption/index.tsx:247` | 16/24 bold, mb 10, `OptionTitle` mt 20 | section heading | text style `section_title` (theme already has `typography.sectionTitle` 16/700/22 unused here) |
| OrdersOption | Empty state | `OrdersOption/index.tsx:216-241` | `NotFoundSource` Ionicons receipt/storefront/fast-food, wrapper mt 60 | empty | shared `EmptyState`; icon per list |
| OrdersOption | Skeleton card | `OrdersOption/index.tsx:288-306, 352-371` | inline bg **`#FFFFFF`**, r 12, border 1 **`#E0E0E0`**, padding 15, mb 20 | loading | shared `SkeletonCard` reading `color.surface`, `color.line`, `radius.card` |
| ActiveOrders / PreviousOrders | Load more | `ActiveOrders/index.tsx:49-55`, `PreviousOrders/index.tsx:48-53` | `OButton` default class, inline r **7.6**, shadowOpacity 0, wrapper padding-h 20 / mt 20 | load more | `OButton` variant `secondary` (no overrides) |
| ActiveOrders | Block divider | `ActiveOrders/index.tsx:59-65` | 8 px `backgroundGray100`, margin-h **−40** | separator between sections | `SectionDivider` component (`color.surface_muted`, height token); −40 is a magic bleed |
| SingleOrderCard | Card | `SingleOrderCard/index.tsx:63-68` | `CardAnimation` + StyleSheet mb 20, padding 10, border 1 `border`, **no radius** | order card | `OrderCard` component; `radius.card`, `space.card`, `border.card` |
| SingleOrderCard | Business name / group no. | `:234` | default 14 / 18 / 600, 1 line | card title | text style `card_title` |
| SingleOrderCard | Price | `:253` | 14 / 18, `Price` width 30 % | amount | text style `body_strong` / `price` |
| SingleOrderCard | Order No. + date/ETA | `:266-291` | 14, marginVertical 3 inline ×3 | meta | text style `caption`; key `orders.card.order_number`, `orders.card.date` |
| SingleOrderCard | Status text | `:294-300` | `active`, 1 line, **same color for every status** | order status | status color tokens (see "Status colors") |
| SingleOrderCard | Favorite heart | `:304-312` | Lottie, icon `danger` 16, `top: 7` | favorite toggle | `color.danger`/`favorite`; key `orders.card.favorite` |
| SingleOrderCard | Review / Reorder buttons | `:317-337, :89-96` | `OButton` class secondary / active, inline py 7, px 18, minH 40, **r 30**, text 12 bold; `ButtonWrapper` gap 10 mt 12 | card actions | `OButton size='sm'` (small pill); keys `orders.card.review_button`, `orders.card.reorder_button` |
| SingleOrderCard | Unread counter | `SingleOrderCard/styles.tsx:38-46` | 24×24, r 7.6, bg `activeContrast`, text `active` | badge | shared `Badge` component |
| SingleOrderCard | Business logo (commented out) | `:192-229` | 64×64 / 40×40, r 8, white bg, shadow `#000` .1 r1 el3 | — | dead today: `orders.components.business_logo.hidden` has no effect. Decide: restore as `orders.card.logo` or delete |
| OrderDetails | Status header card | `OrderDetails/styles.tsx:14-21` | gray100, **r 20**, padding 20, margin-h 20, mb 20 | hero card | `Card` variant `muted`; `radius.card_lg` |
| OrderDetails | Status title | `index.tsx:366` | `tsize.l` 20 / 600 | page heading | text style `title` |
| OrderDetails | Help button | `styles.tsx:62-80`, `index.tsx:369-374` | white, padding 5, `radius.l` 10, FA life-saver 24 black; iOS shadow `#000` .15 r4 y2; Android 1 px `rgba(0,0,0,.1)` | icon button | shared `IconButton` (`elevation` token; Platform branch absorbed by runtime) |
| OrderDetails | Progress bar | `index.tsx:379-390, 201-204` | LinearGradient hard stop, `[active, activeContrast]`, h 12, r 8; margin 20 0 | progress | `ProgressBar` component: `color.primary` fill, `color.primary_soft` track, `size.progress`; one implementation for 4 places (see duplicates) |
| OrderDetails | Driver-busy notice | `index.tsx:392` | 14, **`'#000'`**, mt 8 centered | notice | `color.text` |
| OrderDetails | Big ETA | `index.tsx:419` | `tsize.xxxl` 36 bold | display number | text style `display` |
| OrderDetails | Reservation info | `index.tsx:401-411` | `tsize.s` 14 bold / regular, mb 6 | info | `body_strong`/`body` |
| OrderDetails | Completed header | `styles.tsx:410-440`, `index.tsx:437-457` | gray100, padding 16, r 10, mt/mb 10; logo 44 r15; status `success500`; check circle 40 `active` + white icon 28 | completed summary | `Card` muted; `color.success` for status; key `order_details.completed_header` |
| OrderDetails | Map wrapper | `index.tsx:478`, `styles.tsx:229-234` | margin-h 20, r 30 (not clipped), map h 250, r 20 | map | maps out of scope; keep key `order_details.map` visibility only |
| OrderDetails | Static reservation map | `index.tsx:505-509` | 100 % × 190, r 30, cover | image (API) | `radius.media`; key `order_details.reservation_map` |
| OrderDetails | Get directions | `index.tsx:510-523` | `OButton secondary`, mt 10, **r 8**, minH 44, text 14 bold | secondary action | `OButton` variant secondary, no overrides |
| OrderDetails | Section labels (Delivery preference, Comment, addresses) | `index.tsx:557, 567, 680, 703, 728` | `tsize.m` 16 / 600 or default 14 / 600 (inconsistent) | section title | `section_title` |
| OrderDetails | Section values | `index.tsx:560, 570, 683, 711` | **12** vs 14 for same kind of value | body | `body` (one size) |
| OrderDetails | Big total row | `styles.tsx:183-189`, `index.tsx:582-602` | 32 bold (`xxl + 2`), shrinks to 18 if > 11 chars; padding 20 0; **5 px** bottom border gray200 | total | text style `display`/`total`; `adjustsFontSizeToFit` instead of string-length heuristic; border token |
| OrderDetails | Address box | `styles.tsx:281-286` | padding 10 0, 1 px border **`white`**, r 10 | — | remove invisible border; plain `body` |
| OrderDetails | Driver photo | `index.tsx:195-200`, `styles.tsx:108-112` | 48×48 r 10 inside r 50 white wrapper, mr 14 | avatar (API) | shared `Avatar` (`size.avatar_md`, `radius.full`) |
| OrderDetails | Driver name | `index.tsx:824` | `tsize.s + 1` = 15 / 18 / 600 | name | `card_title` |
| OrderDetails | Driver chat / call | `index.tsx:828-847`, `styles.tsx:121-148` | MCI chat / phone-hangup (rotated 220°) 24 black, `IconContainer` padding 5 white r 10 + platform shadow; absolute right/top 0, gap 10 | icon buttons | shared `IconButton`; icon `phone` instead of rotated hang-up; keys `order_details.driver.chat`, `.call` |
| OrderDetails | Review CTA | `index.tsx:651-665`, `:205-212` | "Review your order" 500; `OButton class='alert'` + text **10** bold, r 15, bg `backgroundGray200`, padding 7/0 | CTA | `OButton` variant `secondary` size `sm`; key `order_details.review` |
| OrderDetails | Separator | `styles.tsx:23-27` | 1 px `border`, margin-v 20 | rule | shared `Divider` |
| OrderDetails | Skeleton | `index.tsx:868-910` | `shared/Skeleton` lines h 10–20, no Fade | loading | shared skeleton set |
| OrderDetails / Bill | Totals card | `Bill.tsx:137` | inline gray100, **r 15**, padding 20, mt 10 | summary card | `Card` muted; same as Checkout summary (other area) |
| Bill | Line text | `Bill.tsx:143-381` | **12/18/400 ×~40**; total row also 12 | line items | text style `caption`/`body`; total row `body_strong` |
| Bill | Info icon | `Bill.tsx:178, 235, 253, 283, 327` | AntDesign infocirlceo 16 `primary` | info trigger | icon token `icon.sm`, `color.primary` |
| Bill | Free delivery strike | `Bill.tsx:296-302` | line-through, `disabled || '#9E9E9E'`; "Free" 600 `primary` | discount state | `color.text_muted`, `color.success`/`primary` |
| Bill | Payment methods title / rows | `Bill.tsx:452-479`, `styles.tsx:29-53` | 14/24/500; rows: icon 30×30 tinted black, name mLeft 10 500; `WrapperPaymethods` mt 20, **1 px border `white`**, r 10 | payment list | `section_title`; remove invisible border |
| ProductList | Professional block | `ProductList.tsx:45-73`, `styles.tsx:176-181, 250-258` | bottom border `border`, margin-v 10, photo 80×80 r 8, name 12/18/500 | service orders | rare; keep, tokenize radius/sizes |
| DeliveryPin | PIN card | `DeliveryPin.tsx:34-45`, `styles.tsx:461-473` | white, r 10, padding 12 20, mb 16; title 14/600; code 36 bold letter-spacing 8; help 12 `textSecondary` | code display | `Card`; text style `display` + `letter_spacing` token |
| MultiOrdersDetails | Divider | `MultiOrdersDetails/styles.tsx:8-12` | 8 px gray100, margin-h −40 | separator | shared `SectionDivider` (same as ActiveOrders) |
| MultiOrdersDetails | Summary card | `styles.tsx:30-34` | gray100, margin-h −40, padding 25 40 | summary | `Card` muted full-bleed |
| MultiOrdersDetails | Progress bars | `index.tsx:202-213`, `SingleOrderCard.tsx:147-158` | `[primary, backgroundGray100]`, h 12, no radius | progress | `ProgressBar` (note: **`primary` here vs `active` in OrderDetails**) |
| MultiOrdersDetails SingleOrderCard | Order Details button | `SingleOrderCard.tsx:89-96` | inline r 7.6, h 44, bg white, border `primary`, padding 5, text 14 | outlined button | `OButton` variant `outline` |
| MultiOrdersDetails SingleOrderCard | Phone / chat icons | `SingleOrderCard.tsx:114-128` | PNG `images.general.phone/chat` 16 tinted `disabled` | icon buttons | vector icon + `IconButton`; **chat navigates to `'MessageDetails'`, a route that does not exist** (`:52`) |
| Review* | Like/dislike buttons | `ReviewOrder/styles.tsx:80-95` (+2 copies) | 54×54, r 8, shadow rgba .2 0/1/4, el 4; icons 33, `primary`/`lightGray` | rating toggle | `RatingToggle` component; `elevation.sm`; `icon.lg` |
| Review* | Comment chips | `ReviewOrder/index.tsx:269-287` (+2 copies) | OButton inline h 40, r 15, text 12; sel bg `activeContrast` border/text `active`; unsel bg white border **`alert`** text `primary` | choice chip | shared `Chip` component (selected/unselected state tokens) |
| Review* | Rule | `ReviewOrder/index.tsx:260, 290` (+4 copies) | 0.5 px `backgroundGray200`, mt 20 | divider | shared `Divider` |
| Review* | Comment input | `ReviewOrder/index.tsx:42-50`; `SingleProductReview:35-42`; `ReviewDriver:57-64` | h 100, r **15** / **8** / **8**, border `secondaryContrast` (prop) vs `lightGray` (style) | textarea | `OInput multiline` variant; one radius `radius.input` |
| Review* | Logo / photo box | `ReviewOrder/index.tsx:327-353`, `ReviewDriver:48-56, 140-156`, `SingleProductReview/styles.tsx:49-57` | 44×44, r 8, shadow black .1 r3 y4 el3 | media thumb | shared `Thumb` / `Avatar`; `elevation.sm` |
| Review* | Continue | `ReviewOrder/index.tsx:312-318` (+2 copies) | `parentStyle` bg `primary`, r **30**, width 100 %, text paddingRight 10 | primary CTA | `OButton` primary, no overrides |
| Review* | Spinner overlay | `ReviewOrder/index.tsx:309`, `ReviewDriver:311` | `LoadingOverlay`, default colors | blocking loader | third-party; or `OButton loading` instead |
| Messages | Bubbles | `Messages/index.tsx:321-337` | left `inputDisabled`, right `active` + white text, padding 5, corner `radius.l` | chat bubble | `color.chat_in` / `chat_out` (or `surface_muted` / `primary`); `radius.bubble` |
| Messages | Quick chips | `Messages/index.tsx:160-170, 228` | h 32, r 50, border `border`, padding-h 12, text 14 `textNormal` | chip | shared `Chip` (same as review chips) |
| Messages | Composer | `Messages/index.tsx:129-137, 264-271` | h 44, 85 %, `inputChat`, r 15 | input | `OInput` variant `chat`; `color.input_bg` |
| Messages | Send button | `Messages/index.tsx:300-316` | 44×44, r 15, `primary`, white PNG icon, opacity .6 disabled | icon button | `IconButton` filled |
| Messages | Loader | `Messages/index.tsx:478` | ActivityIndicator **`#000`** | loading | `color.text` / `primary` |
| Messages | Scroll-to-bottom | `Messages/index.tsx:341, 458-463` | MCI 32, no color, border `border` | icon | `color.text` |
| Messages | Ended-chat notice | `Messages/index.tsx:250-258` | icon 24 black + text 14 centered | info | `color.text_muted` |
| MessageListing | Skeleton | `MessageListing/index.tsx:78-93` | border `border`, r 10, padding 10, gap 10 | loading | shared `SkeletonCard` |
| Help | Title | `Help/index.tsx:52-58` | `tsize.l` bold, mb 20 | page heading | `title` |
| Help | Topic row | `Help/styles.tsx:7-14`, `index.tsx:31-37` | bottom border `border`, padding-v 15, text 14, chevron PNG 15 | list row | shared `ListRow` (same as profile menu rows, other area) |
| LastOrders | Order tile | `LastOrders/index.tsx:34-39, 74-91`, `styles.tsx:3-17` | header image 100 tall r 8, overlay **`rgba(0,0,0,0.3)`**, padding-h 30; name 16/700 white, date 12 white | image tile | `color.overlay` token; `radius.media` |
| Notifications | Intro text | `Notifications/index.tsx:91` | inline 16/22, `textSecondary || '#555555'`, mb 24 | description | `body` + `color.text_muted`; drop fallback |
| Notifications | Setting row | `Notifications/styles.tsx:17-24`, `index.tsx:95-106` | padding-v 18, bottom border gray200, label `tsize.m`/500, Switch track `disabled`/`active` | toggle row | shared `ListRow` + `Switch` colors from `color.primary` / `color.line` |

### Status colors

There are **no per-status colors**. `getOrderStatus` / `getOrderStatuPickUp`
(`src/ui/src/utils/index.tsx:401-603`) return `{ key, value, slug, percentage, image }`;
every screen paints the status text in a fixed color regardless of status:

| Where | Color |
|---|---|
| Order card (`SingleOrderCard/index.tsx:295`) | `active` for pending, rejected, cancelled, completed alike |
| Completed header (`OrderDetails/index.tsx:447`) | `success500` |
| MultiOrdersDetails (`index.tsx:215`, `SingleOrderCard.tsx:159`) | `textNormal` |
| Home `OrderProgress/OrderCard.tsx:79` (other area) | `active` |

The progress bar fill is `active` in OrderDetails and Home but `primary` in
MultiOrdersDetails. Rejected / cancelled / failed orders (2, 5, 6, 10, 12, 16, 17) get
`percentage: 0` and the same color as active ones. **Proposal:** a status map in the
schema (`status.pending | progress | success | danger | neutral` → color tokens), read by
one `OrderStatusLabel` and one `ProgressBar`. The status → group mapping stays in code
(behaviour), only the group colors are theme.

## Duplicates (same function, different implementation)

| Function | Implementations (file:line) | Visible differences |
|---|---|---|
| Order progress bar | `OrderDetails/index.tsx:379-390` (LinearGradient, `active`/`activeContrast`, h12 r8); `MultiOrdersDetails/index.tsx:202-213` and `MultiOrdersDetails/SingleOrderCard.tsx:147-158` (LinearGradient, `primary`/`gray100`, h12, no radius); `OrderProgress/styles.tsx:39-51` (Views, `active`/`activeContrast`, h10 r5, Home); dead `OrderDetails/DynamicProgressBar.tsx` + SVG `ProgressBar` (`styles.tsx:309-405`, hard-coded `#E31837`/`#016491`) | color, height, radius, technique |
| Order card | `SingleOrderCard/index.tsx` (lists, messages); `MultiOrdersDetails/SingleOrderCard.tsx` (multi detail, **same name**); `OrderProgress/OrderCard.tsx` (Home active order); `LastOrders` tile (Help); dead `LastOrder/index.tsx` | border vs no border, r 0 / 12 / 8, logo or not, status color |
| Review screen skeleton (header + like/dislike + chips + textarea + Continue) | `ReviewOrder/index.tsx`, `SingleProductReview/index.tsx`, `ReviewDriver/index.tsx` with **three copies of** `LikeHandsButton`, `ProductHeader`, `CommentsButtonGroup`, `Content` styles | textarea radius 15 vs 8; title text; otherwise identical |
| Business-chat screen UI (`OrderMessageUI`) | `src/pages/MessageView.tsx:8-85` and `MessageListing/index.tsx:126-182` | page version has NavBar + `KeyboardAvoidingView`; listing version is dead |
| Order list controller wrapper (`OrdersOptionUI`) | `OrdersOption/index.tsx:28` and `MessageListing/index.tsx:24` (same name, different body) | separate skeletons (r 12 `#E0E0E0` vs r 10 `border`) |
| Full-bleed 8 px gray divider | `ActiveOrders/index.tsx:59-65` (inline), `MultiOrdersDetails/styles.tsx:8-12` | identical values, two implementations |
| Thin rule | `OrderDetails/styles.tsx:23` (1 px `border`, mv 20), `MultiOrdersDetails/styles.tsx:35` (1 px gray200, mv 6), Review* inline 0.5 px gray200 ×6, `OrderDetails/styles.tsx:236` dead `#EAEAEA` | width, color, margin |
| Skeleton card | `OrdersOption/index.tsx:288, 352`, `PreviousBusinessOrdered/index.tsx:42-60` (inline `#FFFFFF`/`#E0E0E0` r 12), `MessageListing/index.tsx:82` (`border` r 10), `LastOrders:63` (h 100 r 8) | colors hard-coded vs token, radius |
| Choice chip | Review* comment chips (OButton overridden, r 15, h 40); Messages quick-message chips (TouchableOpacity, r 50, h 32) | shape, height, selected state only in review |
| Icon button (white pill + shadow) | `OrderDetails/styles.tsx:62` `HelpBtn` and `:130` `IconContainer` (identical CSS, two names); Messages send button | — |
| Small action button in cards | Order card Review/Reorder (r 30, text 12); OrderDetails Review (r 15, text 10, bg gray200); MultiOrders "Order Details" (r 7.6, h 44, outline); load more (r 7.6) | radius 30 / 15 / 7.6 / 8 for the same kind of button |
| Business logo box | Order card (64, r 8, commented out), completed header (44, r 15), Review (44, r 8, shadow), Home OrderCard (48, r 12) | radius and shadow |
| Payment method name logic | `Bill.tsx:96-101`, `MultiOrdersDetails/index.tsx:69-76, 164-166` | logic copy; Multi lacks refunds and gateway fallback |
| Load-more button | `ActiveOrders/index.tsx:49`, `PreviousOrders/index.tsx:48` | Previous adds mt 20 and hides while loading; Active shows spinner |

## Blocks and pieces

| Page | Block or piece | Hideable? Movable? | Why |
|---|---|---|---|
| MyOrders | Tabs bar | Not hideable (navigation); tabs individually hideable | — |
| MyOrders | Business tab | Hideable (served `orders.components.business_tab.hidden` today) | content duplicate of browse |
| MyOrders | Products tab | Hideable (served `orders.components.products_tab.hidden` today) | — |
| MyOrders | Gift card tab | Server config, not theme | business feature flag |
| MyOrders | Preorders / Active / Past sections | Not hideable (core); **movable** (order of the three is a candidate) | — |
| Order card | Business name, order number, date/ETA, status, favorite, review button, reorder button | Hideable (served `orders.components.{business_name,order_number,date,order_status,favorite,review_order_button,reorder_button}.hidden` today) | all exist as keys |
| Order card | Logo | Key `business_logo` read but **code commented out**: no effect today | decide restore or drop |
| Order card | Price | Not hideable today; candidate key | — |
| OrderDetails | Status header (status + ETA + progress) | Candidate section; progress bar hideable (served `confirmation.components.order.components.progress.hidden` is **read but unused**, `index.tsx:165`) | key exists, reader missing |
| OrderDetails | Help (life-saver) button | Candidate key | opens business chat |
| OrderDetails | Delivery PIN | Not hideable (security flow) | — |
| OrderDetails | Completed header | Not hideable (replaces status header) | — |
| OrderDetails | Driver map | Hideable candidate (`orders.components.map` exists only in local `theme.json.layouts`, never read) | maps out of scope |
| OrderDetails | Reservation map + directions | Candidate key | — |
| OrderDetails | Place spot | Not hideable (needed for curbside) | behaviour |
| OrderDetails | Delivery preference / comment | Candidate keys | — |
| OrderDetails | Big total | Candidate key (duplicates Bill total once completed) | — |
| OrderDetails | Student info | Not hideable (school vertical) | — |
| OrderDetails | Bill / products | Not hideable; payment methods sub-block candidate | — |
| OrderDetails | Review CTA | Candidate key | — |
| OrderDetails | Addresses | Candidate key per address | — |
| OrderDetails | Driver block: name, phone, chat | Phone & chat hideable (served `confirmation.components.driver.components.{phone,messages}.hidden` read and used); name key **read but unused** (`index.tsx:166`); photo not keyed | — |
| OrderDetails | PoweredBy | Separate decision (brand) | — |
| OrderDetails | Movable? | Blocks are in a fixed if-chain with conditions per status/type: moving is possible only between the status header and the footer if each block becomes a section; not proposed for phase 1 | — |
| MultiOrdersDetails | Greeting, customer, payment, address, summary, per-order cards | Candidate sections; per-order business email/phone already hidden by config `isBusinessContactHidden` (server config, not theme) | — |
| Review* | Quick comments, free comment | Candidate keys | — |
| Messages | Quick messages | Candidate key (today shows lorem ipsum fallback) | — |
| Messages | Image attachment | Candidate key (behaviour flag, maybe config) | — |
| Help | Last orders | Candidate key | — |
| Notifications | Whole content | Governed by served `profile.components.promotions.hidden` **and** `.notification_settings.hidden`; when hidden the page is empty | the route should not be reachable, or show empty state |

## Served v1 flags read in this area (stop applying with "no v1 map")

| Path | Reader | Effect today |
|---|---|---|
| `orders.components.products_tab.hidden` | `MyOrders/index.tsx:30` | hides Products tab |
| `orders.components.business_tab.hidden` | `MyOrders/index.tsx:31` | hides Business tab |
| `orders.components.business_logo.hidden` | `SingleOrderCard/index.tsx:171` | none (code commented) |
| `orders.components.date.hidden` | `SingleOrderCard/index.tsx:172` | hides date/ETA |
| `orders.components.business_name.hidden` | `:173` | hides name (only on single-business orders; the `||`/`&&` precedence at `:232` means group-order title ignores `order_number`) |
| `orders.components.order_number.hidden` | `:174` | hides order no. |
| `orders.components.review_order_button.hidden` | `:175` | hides Review |
| `orders.components.reorder_button.hidden` | `:176`; also `OrderDetails/index.tsx:169` | hides Reorder in card; unused in OrderDetails |
| `orders.components.favorite.hidden` | `:177` | hides heart |
| `orders.components.order_status.hidden` | `:178` | hides status |
| `confirmation.components.order.components.progress.hidden` | `OrderDetails/index.tsx:165` | **none** (variable unused) |
| `confirmation.components.driver.components.name.hidden` | `:166` | **none** (unused) |
| `confirmation.components.driver.components.phone.hidden` | `:167` | hides call |
| `confirmation.components.driver.components.messages.hidden` | `:168` | hides chat + call row |
| `profile.components.promotions.hidden`, `profile.components.notification_settings.hidden` | `Notifications/index.tsx:36-37` | blank screen |
| `defaultLanguages.NOT_FOUND_ORDER`, `defaultLanguages.ORDERS_REDIRECT` | `MultiOrdersDetails/index.tsx:293-294` | text fallback from theme (not a theme concern; drop) |
| Layout `app_design` (maweja switch) via `resolveAppDesign(theme)` | `src/pages/OrderDetails.tsx:18`, `OrderDetails/index.tsx:104` | to delete |

Local `src/theme.json` holds `layouts.orders.components.{business_logo,date,map}` and
`layouts.confirmation.components.{delivery_type,delivery_date,delivery_progress,business_information.*,driver_information.*}`:
**never read** (the code reads the served keys at the root, and with different names:
`driver` vs `driver_information`, `order.components.progress` vs `delivery_progress`).

## Theme keys read but not defined (this area)

| Key | Where | Effect |
|---|---|---|
| `colors.backgroundCard` | `OrderDetails/Bill.tsx:132` (maweja branch only), `OrderProgress/OrderCard.tsx:48` (other area) | falls back to `white` |
| `colors.green500` | `OrderDetails/DynamicProgressBar.tsx:65` (dead file) | — |
| `images.general.arrow_right` | `OrderDetails/OrderHistory.tsx:185` (dead file) | — |

Colors read in this area (counts): textNormal 35, white 34, primary 28, black 17, active 13,
backgroundGray200 12, backgroundGray100 10, border 9, lightGray 8, clear 8,
secondaryContrast 7, backgroundPage 5, activeContrast 5, textSecondary 4, disabled 4,
success 3, green 3, alert 3, skyBlue 2, inputChat 2, backgroundLight 2, backgroundDark 2,
whiteGray, success500, inputDisabled, dusk, danger, backgroundGray300, backgroundGray.
Misuses: `alert` as an unselected chip border, `backgroundGray300` as text color
(`OrderStudentInfo`), `white` as border color (two invisible borders), `dusk` in a dead
style (`ReviewDriver/index.tsx:84`).

## Images

| Key or source | file:line | Painted box | Fit | Fallback | alt |
|---|---|---|---|---|---|
| `images.order.status0…13` (14 PNGs, `TemplateApp.tsx:171-185`) | returned by `getOrderStatus` `utils/index.tsx:409-537` | **never painted** | — | — | — |
| `images.dummies.businessLogo` | `SingleOrderCard:207,223` (commented), `OrderDetails/index.tsx:280` (map marker) | marker | — | — | — |
| `images.dummies.product` | `SingleProductReview/index.tsx:146` | 44×44 | default | is the fallback | none |
| `images.general.driverPng` | `OrderDetails/index.tsx:275` | map marker | — | driver photo | — |
| `images.general.user` | `ProductList.tsx:55` | 80×80 | contain | professional photo | none |
| `images.general.phone`, `.chat` | `MultiOrdersDetails/SingleOrderCard.tsx:115,125` | width 16, tinted `disabled` | — | — | none |
| `images.general.image`, `.send` | `Messages/index.tsx:190, 311` | 28×28 / send tinted white | — | — | none |
| `images.general.notFound` | `MessageListing/index.tsx:73` | NotFoundSource | — | — | — |
| `images.general.chevron_right` | `Help/index.tsx:36` | width 15 | — | — | none |
| API business logo | `OrderDetails/index.tsx:440` (`Image` 44 r15), `ReviewOrder:348-352` (OIcon 44) | 44×44 | default | **none** (blank if missing) | none |
| API driver photo | `OrderDetails/index.tsx:747,812` (FastImage 48 r10 cover), `ReviewDriver:149-153` (44) | 48 / 44 | cover | none (block omitted / blank) | none |
| API product image | `SingleProductReview/index.tsx:136-143` | 44×44 | cover | dummy product | none |
| API business header | `LastOrders/index.tsx:74-78` | 100 % × 100 | cover | none | none |
| API customer photo | `OrderDetails/index.tsx:285` | map marker | — | **hard-coded remote URL** `res.cloudinary.com/demo/.../d_avatar.png` | — |
| Google Static Map | `OrderDetails/index.tsx:505-509` | 100 % × 190 r30 | cover | none | none |
| Pay method icons (`getPayIcon`) | `Bill.tsx:459-464` | 30×30 tinted black | — | — | none |
| Lottie favorite | `SingleOrderCard:304-312` | — | — | — | — |

## Icons

Vector sets in this area: `Ionicons` (OrderDetails checkmark, NotFoundSource names),
`FontAwesome` (life-saver), `MaterialCommunityIcons` (chat, phone-hangup, close-octagon,
close-circle, chevron-double-down, maweja icons), `AntDesign` (infocirlceo, like2,
dislike2). Plus tinted PNGs (phone, chat, send, image, chevron). Sizes: 15, 16, 24, 28,
32, 33. Colors mostly `black`, `primary`, `lightGray`, `textNormal`, `disabled`, `white`;
two icons with no color. Four sets for one area: candidate to settle one icon set.

## Platform branches, screen sizes, safe area, keyboard

- `OrderDetails/styles.tsx:68-79, 136-147` — iOS shadow vs Android 1 px `rgba(0,0,0,0.1)` border on `HelpBtn` and `IconContainer`: a rendering difference the runtime should absorb (`elevation` token).
- `src/pages/MultiOrdersDetails.tsx:12` — `padding-top: ios ? 0 : 24px`: hand-made status-bar inset → use the safe-area inset.
- `Messages/index.tsx:241, 412` — toolbar `paddingBottom: bottom inset` unless keyboard shown; iOS `keyboardWillShow` vs Android `keyboardDidShow` (behaviour).
- `Bill.tsx:271-277` — `Platform.OS === 'web'` branch (dead on native).
- `PreviousBusinessOrdered/index.tsx:76, 91` and `PreviousProductsOrdered/index.tsx:17, 30` — card width `window.width − 120/80` in horizontal mode (only with `businessesSearchList`, not passed from MyOrders: dead in this area).
- `HelpOptions/index.tsx:9, 22` — WebView height = `Dimensions.get('screen').height` inside two ScrollViews.
- `ReviewDriver/index.tsx:66` — RTL `scaleX` in a dead `statusBar` style.
- Nested scroll views: Help, HelpOptions, Notifications (and Notifications adds its own `SafeAreaView`).
- Review screens: `Keyboard.removeAllListeners('keyboardDidShow')` on unmount removes *every* app listener (behaviour bug, not theme).

## Third-party UI (out of scope or partial)

GoogleMap / react-native-map-link `showLocation` dialog; Google Static Maps image;
the chat's long-press menu (`ActionSheetIOS` / `Alert`; the thread itself is the app's own,
`Messages/ChatThread.tsx`); react-native-image-picker; WebView (HelpOptions CMS HTML); native `Switch`;
`LoadingOverlay` (Review*, Notifications); `Alert.alert`
(free-delivery tooltip, `Bill.tsx:276`); `shared/Skeleton` skeletons.

## Off the scale or without a token

| Value | Where | Why it does not fit |
|---|---|---|
| radius 7.6 | load more buttons, unread badge, Logo, MultiOrders "Order Details" (8 places) | not on any scale; reads as 8 |
| radius 15 | Bill card, review chips, review textarea, chat composer/send, Review CTA (11) | between 12 and 16 |
| radius 30 | order card buttons, map wrapper, static map, Continue button | pill vs "large card" mixed |
| radius 20 / 25 / 50 | status header & map; chat remove-image; chat chips, photo wrapper | — |
| font 32 (`xxl + 2`), 18 (`m + 2`), 15 (`s + 1`) | big total, driver name | arithmetic on tokens |
| font 10 | OrderDetails Review button text | below the smallest step (12) |
| font 33 | like/dislike icons | odd icon size |
| margin −40 / padding 40 / 25 | full-bleed dividers and MultiOrders summary | bleed tied to the 20 gutter ×2 |
| margin-bottom 150 (×2) + padding-bottom 150 | OrderDetails end space | fixed blank tail |
| margin-left −15 | Review `ProductHeader` | undoes the like button margin |
| `#FFFFFF`, `#E0E0E0` | skeletons (`OrdersOption`, `PreviousBusinessOrdered`) | hard-coded surface/line |
| `#000` / `'#000'` | `OrderDetails/index.tsx:392`, `Messages/index.tsx:478`, shadow colors | text/loader |
| `rgba(0,0,0,0.3)` | `LastOrders/styles.tsx:15` | overlay token missing |
| `rgba(0,0,0,0.1)` | `OrderDetails/styles.tsx:8` | Android shadow substitute |
| `rgba(0,0,0,0.2)` | Review `LikeHandsButton` shadow ×3 | — |
| `#D8DCE3` | `Bill.tsx:431` | maweja (to delete) |
| `#9E9E9E`, `#555555`, `#909BA9`, `#E9ECEF` | fallbacks after `||` | delete (fallbacks) |
| letter-spacing 8 | `DeliveryPinCode` | only letter-spacing in area |

## To delete

**Maweja (decision 2026-11-02):**
- `src/ui/src/components/OrderDetails/layouts/Maweja/` (`index.tsx`, `styles.tsx`, `__tests__/MawejaOrderDetails.test.tsx`).
- Imports from `../Checkout/layouts/Maweja` in `OrderDetails/index.tsx:56-57`, `Bill.tsx:8-9`, `ProductList.tsx:8`, `DeliveryPin.tsx:6-7` (Checkout maweja itself belongs to the checkout area).
- Branches: `OrderDetails/index.tsx:104, 179, 187-193, 199, 302-309, 327-359, 360/437/578 (`!isMaweja`), 460-476, 496-501, 544-553, 614, 620-621, 629-650, 670-677, 691-700, 720-725, 739-807, 772, 777, 786-793`; `Bill.tsx:94, 114-115, 123-130, 131-136, 138-140, 385-397, 410, 412-450`; `ProductList.tsx:16-33`; `DeliveryPin.tsx:18-32`; `src/pages/OrderDetails.tsx:9, 18, 20-23, 39-44` (`onTrackingHeader` prop too).
- `themeBrandColor` / `resolveAppDesign` uses in this area (utils themselves: shared).

**Dead code found (not maweja):**
- `OrderDetails/DynamicProgressBar.tsx` (imported, never rendered) and the SVG `ProgressBar` + `NumberLabel` + `DynamicProgressBarContainer`/`Progress`/`Section` in `OrderDetails/styles.tsx:288-405` (hard-coded `#E31837`, `#016491`, `#950D01`, `#A95241`, `#377BAD`).
- `OrderDetails/OrderHistory.tsx` (not imported).
- Unused styled components in `OrderDetails/styles.tsx`: `Logo`, `WrapperActionBtns`, `OrderStatus`, `StatusImage`, `SectionTitle`, `OrderProducts`, `HeaderInfo`, `CustomerPhoto`, `Divider` (`#EAEAEA`), `OrderAction`, `TopActions`, `TopHeader`, `BlockInfo`, `StarsContainer`, `StarButton`.
- `LastOrder/` component (not rendered anywhere).
- `MyOrders/styles.tsx` (`Wrapper`, `Tab` unused); `PreviousOrders/styles.tsx` `Card`/`Logo`/`Information`/`MyOrderOptions`/`Status`; `ReviewOrder/styles.tsx` `ReviewOrderContainer`, `FormReviews`, `ActionContainer`, `SkipButton`, `RatingBar*`, `MultiLogosContainer`, `ActionButtonWrapper`; same set in `ReviewDriver/styles.tsx` and `ReviewProducts/styles.tsx`; `Messages/styles.tsx` `WrapperBackBtn`, `ContentBackBtn`, `MessageTypeItem`; `MessageListing/styles.tsx` `MessageContainer`; ReviewDriver inline styles `statusBar`, `ratingItem*`, `ratingLineStyle`.
- `MessageListing/index.tsx:108-121` modal branch and `OrderMessageUI` (`:126-182`).
- `SingleOrderCard/index.tsx:192-229` commented-out logo.
- `images.order.status0…13` (14 PNGs) and the `image` field of `getOrderStatus`.

## Bugs noticed while reading (not theme, for the record)

- `src/pages/ReviewDriver.tsx:20` — title says "Review Product".
- `MultiOrdersDetails/SingleOrderCard.tsx:52` — navigates to `MessageDetails`, not a registered route.
- `Messages/index.tsx:60-65` — quick messages default to "Lorem ipsum N".
- `SingleOrderCard/index.tsx:232` — `a && b || c && d` precedence: group-order title shows only when `order_number` is not hidden, single-order name only when `business_name` is not hidden — probably intended, but reads accidental.
- `OrderDetails` header literal `No.` not translated (`src/pages/OrderDetails.tsx:41`); `ReviewOrder/index.tsx:112` `console.log`.
- Notifications screen blank when either profile flag hides it.

## Candidate sections (proposal for phase 2)

- **orders** (MyOrders): `tabs`, `preorders_list`, `active_list`, `past_list`; component `order_card` with pieces `name`, `order_number`, `date`, `status`, `price`, `favorite`, `review_button`, `reorder_button` (+ `logo` if restored).
- **order_details**: `status_header` (pieces `help_button`, `eta`, `progress`), `delivery_pin`, `completed_header`, `map`, `reservation`, `place_spot`, `preferences` (pieces `delivery_option`, `comment`), `total`, `student`, `bill` (pieces `products`, `summary`, `payment_methods`), `review_cta`, `addresses`, `driver` (pieces `photo`, `name`, `chat`, `call`), `gift_card`, `powered_by`.
- **multi_order_details**: `greeting`, `customer`, `payment`, `address`, `summary`, `orders`.
- **review** (one template for order / products / driver): `header`, `rating`, `quick_comments`, `comment`, `continue`.
- **messages** list + **chat**: `quick_messages`, `attachments`.
- **help**: `topics`, `last_orders`. **notifications**: `channels`.

New shared components this area asks for: `ProgressBar`, `OrderStatusLabel` (+ status
color map), `OrderCard`, `RatingToggle`, `Chip`, `SectionDivider`, `SkeletonCard`,
`IconButton`, `Avatar/Thumb`, `ListRow`, `Badge`.

## Not verified

- **Nothing was run.** No simulator or device: every size, color and layout here is read from code. Painted boxes, clipping (e.g. the r 30 map wrapper), text truncation, the 300 pt blank tail of OrderDetails, nested-scroll behaviour in Help/HelpOptions/Notifications, and keyboard behaviour in chat and reviews are unverified on iOS and Android.
- What the served theme actually contains for `orders.*`, `confirmation.*`, `profile.*` on real projects (only the code paths are listed).
- `OButton` `class` handling (`secondary`, `active`, `alert`) and whether the inline overrides win — shared-primitive agent.
- `Tabs`, `NotFoundSource`, `CardAnimation`, `LottieAnimation`, `FloatingBottomContainer`, `OInput` multiline, `ProductItemAccordion`, `TaxInformation`, `PlaceSpot`, `SendGiftCard`, `PoweredBy`, `GiftCardOrdersList`, `BusinessController simpleView`, `SingleProductCard` internals were not audited (other areas).
- `getOrderStatuPickUp` was not read line by line (assumed same shape as `getOrderStatus`).
- Whether `images.order.status*` are read anywhere outside `src/` (e.g. the submodule) — only `src/` was searched.
- RTL rendering, small-phone (SE) layout, Dynamic Type / font scaling.
