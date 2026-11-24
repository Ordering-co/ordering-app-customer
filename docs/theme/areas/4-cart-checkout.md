# Area 4 — Cart, checkout and money

Phase 1 (inventory), read-only. **Code reading only: no simulator was run**, so every
"painted" value below is what the code asks for, not a screenshot. Submodule `src/@/` was
excluded. The `maweja` design variant is listed only as "to delete" (decision 2026-11-02);
everything else describes the `original` path. Shared primitives (OText, OButton, OInput,
NavBar, ODropDown, OModal, OBottomPopup…) are another agent's; here only their bypasses and
the overrides passed to them are noted.

Script numbers for the area (from `.theme-audit/inventory.csv`, maweja files removed):
**1 256 literals** — space 422, size 260, font_size 247, font_weight 87, radius 78,
line_height 49, border 45, color 30. Heaviest files: `OrderSummary/index.tsx` 89,
`MultiCheckout/index.tsx` 84, `Checkout/index.tsx` 69, `CouponOffers/styles.tsx` 54,
`Cart/index.tsx` 46, `Checkout/styles.tsx` 42. Maweja files add 216 more (all go).
Inline `style={{` in the area: **228**. `StyleSheet.create`: 18 files (5 at module level:
`StripeCardsList:203`, `PaymentOptionStripe:202`, `SavedCards:15`, `PurchaseGiftCard:11`,
`CouponOffers/styles:213` — none of them reads the theme today, all literals).

Value spread in the area (original path):

| Category | Values (count) |
|---|---|
| font size | 12 (106), 14 (46), 16 (26), 13 (18), 20 (16), 10 (8), 15 (8), 18 (5), 17 (4), 22 (4), 11 (3), 24 (3) |
| font weight | 700 (32), 600 (31), 400 (15), 500 (8), 300 (1) — plus `'bold'` strings |
| line height | 18 (25), 24 (19), 21, 15, 17, 20 |
| radius | 7.6 (22), 8 (17), 15 (15), 10 (12), 18, 20, 50, 4, 12, 16 — plus OButton's implicit 30 |

---

## Routes and screens

| Route (HomeNavigator) | Page | UI component | Root container |
|---|---|---|---|
| `Cart` (`HomeNavigator.tsx:181`, only when `!cartUuid`) | `src/pages/CartList.tsx` | `CartContent` → `Cart` × n | `NavBar` + `SafeAreaViewWrapper` (ScrollView + RefreshControl) → `CCContainer` View → **one `CCList` ScrollView per cart** (nested ScrollViews) |
| `CheckoutPage` (`:198`) | `src/pages/Checkout.tsx` | `Checkout` → `CheckoutUI` | `NavBar` + `SafeAreaViewWrapper disableScrollView` → `HeaderContent` (fixed, outside scroll) + `ChContainer` (styled.ScrollView) + absolute `FloatingButton` |
| `MultiCart` (`:152`) | `src/pages/MultiCart.tsx` | `MultiCart` (skeleton only, `MultiCartCreate` redirects) | `Container noPadding` → `ChContainer` (borrowed from Checkout/styles) |
| `MultiCheckout` (`:157`) | `src/pages/MultiCheckout.tsx` | `MultiCheckout` → `MultiCheckoutUI` (or `MultiCart` while `checkCarts`) | `View flex 1 bg backgroundPage` → `NavBar` + `SafeAreaViewWrapper disableScrollView` → `Container` (ScrollView) + absolute `FloatingButton` |
| `SavedCards` (`:137`) | `src/pages/SavedCards.tsx` | `SavedCards` | `NavBar` + `SafeAreaViewWrapper` (ScrollView) → `Container` View |
| `CashWallet` (`:290`) | `src/pages/CashWallet.tsx` | `CashWallet` | `NavBar` + `SafeAreaViewWrapper` (ScrollView+refresh) → inner `ScrollView` (nested) |
| `LoyaltyPoints` (`:295`) | `src/pages/LoyaltyPoints.tsx` | `LoyaltyPoints` | `NavBar` + `SafeAreaViewWrapper disableScrollView` → `ScrollView maxHeight 55%` |
| `GiftCards` (`:300`) | `src/pages/GiftCards.tsx` | `GiftCardUI` | `NavBar` + `SafeAreaViewWrapper` (ScrollView) |
| `MyStudents` (`:142`) | `src/pages/MyStudents.tsx` | `StudentsList` | `NavBar` + `SafeAreaViewWrapper` → `Wrapper` + inner `ScrollView` |
| `CouponOffers` (`:202`, reached from the checkout coupon entry) | `src/pages/CouponOffers.tsx` | `CouponOffers` | `NavBar` + `SafeAreaViewWrapper disableScrollView` → list |
| **`Wallets` — NOT registered** | `src/pages/Wallets.tsx` (orphan) | `Wallets` (orphan) | `Container` + `RefreshControl` |

Entry points: Profile (`UserProfile/index.tsx:164-190`) → SavedCards, CashWallet,
LoyaltyPoints, GiftCards, MyStudents. `Checkout/index.tsx:466` navigates to `'Wallets'`
(empty gift-card cart) — **a route that does not exist**; `pages/Wallets.tsx` and
`ui/.../Wallets` are dead code reachable from nowhere.

---

## What the served (v1) theme drives today in this area — stops applying (no v1 map)

| Served path | Reader (file:line) | Effect today |
|---|---|---|
| `checkout.components.customer.hidden` | `Checkout/index.tsx:214` | hides the whole customer-details block (incl. guest login/sign-up buttons and `CheckoutStudentDetails`) |
| `business_view.components.cart.components.discount.hidden` | `Cart/index.tsx:93` → also passed to `CartChargesRows` (`Cart/BillRows.tsx:207`) | hides discount, offer and "subtotal with discount" rows **from the bill** (the total still includes them — the bill stops adding up) |
| `bar_menu.components.wallet.hidden` | `Wallets/index.tsx:79` | only in the orphan `Wallets` component — effectively dead |
| `app_design.components.layout.type` (`resolveAppDesign`) | `pages/CartList.tsx:28`, `Checkout/index.tsx:143` | maweja switch — goes with maweja |

No served images are read in this area: every `theme.images.*` here comes from the local
manifest injected in `TemplateApp.tsx` (lines 79-208).

Non-theme switches that hide pieces (keep as behaviour, they are server *configs*, not
theme): `guestCheckoutCoupon/Comment/DriveTip/Zipcode` checkout fields
(`Checkout/index.tsx:118-121`, passed as `hideCommentsByValidationCheckout` /
`hideCouponByValidationCheckout` to `OrderSummary`), `multi_business_checkout_*` configs
(`CartContent/index.tsx:213-215`, `MultiCheckout/index.tsx:597-604,628-630`),
`checkout_multi_business_enabled`, `driver_tip_type/use_custom`, `cash_wallet`,
`wallet_cash_enabled`, `wallet_credit_point_enabled`.

---

## Elements

### Checkout (`Checkout/index.tsx`, original path)

| Screen / component | Element | file:line | Values today | Function | Proposal |
|---|---|---|---|---|---|
| Checkout | Page gutter / scroll | `Checkout/styles.tsx:4-7` | `ChContainer` ScrollView, `padding-horizontal 20`, `margin-bottom 100` (clearance for the fixed place-order bar, ignores safe area) | page container | `space.page_x` token; bottom clearance = bar height + inset, computed |
| Checkout | Section wrapper | `styles.tsx:9-11` | `padding-top 20` (MultiCheckout's copy: 30) | separation between blocks | `space.section` token |
| Checkout | Section bottom rule | `styles.tsx:35-40,59-67,69-76,95-99,125-129`, inline `:822` | 1px `colors.border`, `padding-bottom 20` repeated on 6 styled views + inline | block separator | one `SectionDivider` (or `section.divider` variant) |
| Checkout | `Divider` | `styles.tsx:172-176` | 1px `colors.border`, `margin-vertical 16` | separator around tips / spot / reservation | same `SectionDivider` |
| Checkout | Section title (local `HeaderTitle`) | `index.tsx:171-178` | `OText preset="sectionTitle"` (16/700/22), `mBottom 10` or 0 | heading of each block | keep as `text.section_title`; delete the local component, one shared `SectionHeader` |
| Checkout | Top header (address + order type) | `index.tsx:578-582` → `BusinessesListing/Layout/Original/HeaderContent.tsx` | listing header reused, fixed above the scroll, hidden for gift-card carts | context bar | belongs to the listing area; candidate section `header`, hideable |
| BusinessDetails | Logo | `Checkout/BusinessDetails.tsx:24-30`, `styles.tsx:166-170` | FastImage 44×44, radius 15, cover, fallback `images.dummies.businessLogo` | business identity | `image.logo_sm` box; radius token |
| BusinessDetails | Name | `BusinessDetails.tsx:32` | OText 14 bold | | `text.card_title` |
| BusinessDetails | Phone | `:36` | OText 12 `textNormal` (hidden by `isBusinessContactHidden`) | | `text.caption` + `color.text_secondary` |
| BusinessDetails | Skeleton | `:43-57` | inline row with 1px border, lines 44 and 35 high | loading | `Skeleton` component |
| Address | Skeleton | `index.tsx:605-611` | 3 × PlaceholderLine 20 high (80/40/89 %) — same block copied at `:644-648` | loading | `Skeleton.lines` |
| Address | `AddressDetails` | `:612-624` | other area (address); receives `HeaderTitle` | delivery address | — |
| Summary (articles) | Header row + edit pencil | `Checkout/Summary.tsx:96-110` | MCI `pencil-outline` 24 `textSecondary`; navigates to `UpsellingPage` | edit cart | icon size token `icon.md` |
| Summary | Line: qty / name / price | `Summary.tsx:114-124` | OText 14 / 700 (qty, fixed width 25) / 600 / 600 | articles list | `text.body_strong`; qty column width token |
| Summary | Options line | `:130-136` | OText 12/400 | modifiers | `text.caption` |
| Summary | Section bottom rule | `:82` | inline `borderBottomWidth 1 border` | | `SectionDivider` |
| Summary | Skeleton | `:84-93` | 3 × (20 high 80 % + 20 high 60 %) | loading | `Skeleton` |
| Customer | Guest gate: Login / Sign up / Continue as guest | `index.tsx:652-672` | OButton primary / secondary / secondary, `borderRadius 15`, `marginTop 20` (MultiCheckout: radius 7.6) | gate | `button.primary` / `button.secondary`; drop the radius override |
| Customer | `UserDetails` | `:676-691` | other area (profile/forms) | | — |
| Customer | `CheckoutStudentDetails` (school) | `:692-694` | see school section | | — |
| Delivery options | Selected option pill | `Checkout/DeliveryOptions.tsx:69-76`, `styles.tsx:131-140` | `padding 15`, radius 15, 1px border `active`, text `active`, chevron MaterialIcons fontSize 20 absolute `top 15, right ios 5 / android RTL 30 : 0` | opens picker | `ChoiceRow` component (selected state); chevron via flex, no platform offsets |
| Delivery options | Picker sheet | `DeliveryOptions.tsx:77-92` | `OBottomPopup` 50 % height, title "Special instructions", FlatList rows = same pill; unselected text `colors.black` | choose option | `ChoiceRow`; `color.text` |
| Delivery options | Skeleton | `:60-65` | 1 line 40 high | | `Skeleton` |
| Pending payment | Notice | `Checkout/PendingCartNotice.tsx:87-114` | title OText 17/600 `error` centered; desc 14 `textNormal` mTop 8; OButton secondary "Cancel payment attempt"; non-releasable fallback OText 17 `error` | pending cart state | `Notice` component (`tone: warning`); 17 → 16 |
| Pending payment | Dialogs | `PendingCartNotice.tsx:53-84` | `Alert.alert` × 3 | | system alert — out of scope |
| Reservation | `BusinessReservation` + Divider | `index.tsx:732-745` | other area | | — |
| Payment | "No payment needed" | `:750-765` | OText 14, `marginTop 15`, section rule inline | free order | `text.body` |
| Payment | Status-4 message | `:825-832` | OText **17** `error`, centered, `marginTop 20` | failed payment | `Notice tone=error` |
| PaymentOptions | Method chip (`PMItem`) | `PaymentOptions/styles.tsx:15-39`, `index.tsx:261-290` | 120×50, radius 10, `margin-right 10, margin-top 10`, bg `inputDisabled`; selected bg `active`, else 1px `border`; icon 20×20 tinted white/`backgroundDark`; label OText **10**, selected white else **`'#000'`** | choose method | `PaymethodChip` component, states `default/selected/disabled`; `isDisabled` prop is passed but not styled |
| PaymentOptions | Wallet-pay / custom image tile | `index.tsx:234-259` | Image or OIcon 70×70, `marginRight 10`, selected → radius 10 + 1px `border` | Apple/Google Pay marks, merchant image | same `PaymethodChip` (`variant: image`) |
| PaymentOptions | List | `:320-328` | horizontal FlatList (nested in the ScrollView) | | — |
| PaymentOptions | Skeleton | `:330-344` | 3 × 80 high, 37 % wide, radius 10 | loading | `Skeleton` |
| PaymentOptions | Error / empty | `:346-358` | OText 12 | | `text.caption`, `EmptyState` inline |
| PaymentOptionCash | "Cash" label + input + error | `PaymentOptionCash/index.tsx:21-38,69-92`, `styles.tsx` | label 12/18/400; OInput radius **7.6**, h 50, mTop 10; error 16 bold `error` centered; container `margin 20 0 0` | cash change amount | `input` token set; `text.error` |
| PaymentOptionCard | "Add New Payment Card" | `PaymentOptionCard/index.tsx:151-162` | OButton radius 7.6, h 44, text 12, `marginVertical 20` | add card | `button.secondary`/size `sm` |
| PaymentOptionCard | Add-card modal | `:179-229` | native `Modal` slide; close PNG 16 with **`marginTop ios 40 : 12`** (hand-made inset); third-party `CreditCardInput`; error OText **20** `error`; "Add card" OButton passes **`isDisabled`/`isLoading` (OButton ignores both)** | | safe-area inset; third-party (out of scope) |
| StripeCardsList | Saved card row | `StripeCardsList/index.tsx:116-165`, `PaymentOptionStripe/styles.tsx:36-64` | row `padding 10 0`; radio = PNG `radio_act`/`radio_nor` 16 tinted primary/disabled; brand = FontAwesome `cc-*` size 20 **`'#000'`** (`ui/utils/index.tsx:195`); number "XXXX-XXXX-XXXX-1234" 12 `textNormal`; missing zip OText 10 **`danger5` (undefined)**; trash PNG 16 `disabled`; invalid → opacity .7 | pick card | `SavedCardRow` component; vector radio; `color.danger` |
| StripeCardsList | List box | `:203-217` | ScrollView `maxHeight 150` | | size token |
| StripeCardsList | Skeleton | `:94-104` | 2 × 44 high | | `Skeleton` |
| PaymentOptionWallet | Wallet toggle row | `PaymentOptionWallet/index.tsx:97-150`, `styles.tsx` | row `padding 10 0`; image 44×44 radius 10 1px `border`; name OText 14 (disabled → `colors.disabled`); points OText bold `primary`; checkbox MCI 25 primary/disabled; whole-row opacity .5 when unusable | apply wallet | `WalletToggleRow` component |
| Wallets block | Container | `Checkout/styles.tsx:95-99` | `padding-top 20`, 1px bottom rule | | `SectionDivider` |
| DriverTips | Label | `DriverTips/styles.tsx:47-57` | **`styled.Text`** 14 `textSecondary` (system font, not Poppins) | explanation | `OText` `text.body` |
| DriverTips | Tip chip (`DTCard`) | `styles.tsx:23-37`, `index.tsx:96-135` | radius 12, `padding 10 16`, min-width 64, border 1 `border` / selected **2px** `active` + bg `activeContrast`; text 600 `active`/`black`, custom chip size 12; gap 10, `margin-top 20`; spinner overlay `active` | choose tip | `ChoiceChip` component (selected/pending states) |
| DriverTips | Custom input + Apply | `index.tsx:51-60,140-160` | OInput radius **15**, h 44; OButton radius 15, h 44, text 13 | custom tip | `input` + `button.sm` tokens |
| DriverTips | Current tip text | `:168-174` | OText 16 `primary`, centered | feedback | `text.body_strong` + `color.primary` |
| PlaceSpot | Spot form | `PlaceSpot/index.tsx:155-300` | labels 12 `textNormal`, group title 16/500; OButton radius 7.6 h 44; `SelectDropdown` (third-party) | spot / vehicle | shared form tokens |
| OrderSummary | Bill box (`OSBill`) | `OrderSummary/styles.tsx:12-17` | bg `backgroundGray100`, radius 15, `padding 20`, `margin-top 10` | totals card | `Card variant=muted`; radius token |
| OrderSummary | Bill row (`OSTable`) | `styles.tsx:19-24`, `index.tsx:258-524` | row, `padding-bottom 10`; label/amount OText **12** (no line height) | subtotal, discount, offers, taxes, fees, delivery, tip, extra values, wallet payments | `BillRow` component, `text.caption` |
| OrderSummary | Info / remove icons | `:288-293,340,354,385,417,458,474` | AntDesign `infocirlceo` 16 `primary`, `closecircle` 16 `primary` (OAlert) | tax detail / remove offer | `icon.sm` |
| OrderSummary | Taxes & fees toggle | `:316-362` | chevron AntDesign `down` 14 `textSecondary` rotated 180°; detail `padding-left 12`, text `textSecondary` | expandable group | `BillRow variant=group` |
| OrderSummary | Free delivery strike | `:427-438` | 12 line-through `disabled || '#9E9E9E'` + "Free" 12/600 `primary` | | `BillRow` state |
| OrderSummary | Coupon | `:525-539` → `CouponControl` | wrapper `paddingVertical 5` | coupon | see CouponControl |
| OrderSummary | Loyalty reward card | `:540-551`, `styles.tsx:65-79` | white card radius 15 `padding 18`, **shadow #000 .1 r4 + elevation 2**; FA5 `trophy` 32 **`#FFC107`** rotated 15°; text 13 bold `textNormal` + value `primary` | earn-points promo | `Card variant=raised`; `color.reward` token or `warning` |
| OrderSummary | Total row | `:552-564` | top rule 1px **`#d9d9d9`** (inline, and `OSTotal` styles:26-30 unused copy), `marginTop 15` ×2; OText 14 bold `textNormal` ("Total") | order total | `BillRow variant=total`; `color.border` |
| OrderSummary | Comments | `:575-614` | label 12 `mBottom 10`, `marginTop 20`; OInput multiline h 120 (inner 100), radius **8**, `paddingRight 50`, `border`; ActivityIndicator large `primary` absolute | order notes | `textarea` input token |
| OrderSummary | Tax info modal | `:632-643` → `TaxInformation` | `TaxInformation/index.tsx:61-81`: titles 24 / 20 / 18 centered; `padding 10` | | `text.screen_title` etc. |
| Errors | Inline validation list | `index.tsx:993-1035`, `styles.tsx:107-113` | `cartMessage` = OText **12** `error`; container centered, `marginBottom ios 35 : 10` (hand-made inset) | blocking messages | `text.error`; inset from safe area |
| Modals | Login / Sign-up | `:1084-1111` | OModal + ScrollView `paddingHorizontal 20` + LoginForm/SignupForm; `loginButtonBackground primary` | guest auth | other area (auth); note MultiCheckout uses `CheckoutLoginForm` instead (duplicate) |
| Modals | Required-fields modal | `:1045-1082`, `DetailWrapper styles.tsx:178-181` | `UserDetails` in OModal, padding 20 | missing fields | — |
| Place-order bar | `FloatingButton` | `index.tsx:1114-1153`, `FloatingButton/styles.tsx:3-17`, `FloatingButton/index.tsx:38-98` | absolute bottom, white bg, `padding 10 utils.margins.horizontal(20)`, `paddingBottom inset || 20`, z 20001; row-reverse with gap 10; OButton **default radius 30** (no override), flex 1; left element: "Order total" OText 14 + amount **20 bold** | place order + total | `PlaceOrderBar` (sticky, never hideable); `text.price_lg`; `button.primary` |
| Place-order bar | Disabled tap | `:1148-1152` | haptic `vibrateApp` | | behaviour |
| Payment webviews | PayPal / Square / Credomatic / Computop | `:1155-1202` | `PaymentOptionsWebView` | third-party | out of scope (Square URI and location id are hard-coded test values: `https://test-square-f50f7.web.app`, `L1NGAY5M6KJRX`) |
| Checkout wrapper | Not found | `:1488-1497` | `NotFoundSource` centered | cart missing | `EmptyState` |
| Checkout wrapper | Initial skeleton | `:1499-1508` | 5 lines (20/20/50/20/50 high), `marginHorizontal 20` | loading | `Skeleton` |

### Cart (`CartList` → `CartContent` → `Cart`)

| Screen / component | Element | file:line | Values today | Function | Proposal |
|---|---|---|---|---|---|
| CartList | Title | `pages/CartList.tsx:66-71` | NavBar "Cart" (single business) / "My carts" | | — |
| CartContent | Container | `CartContent/index.tsx:273-275`, `styles.tsx:3-5` | `padding-vertical 20` + inline `paddingHorizontal 20` | page | `space.page_x` |
| CartContent | Per-cart ScrollView | `:204`, `styles.tsx:13-15` | `CCList` ScrollView `padding 10 0`, `overflow visible` | — | plain View (nested ScrollView) |
| CartContent | Group header (multi) | `:41-56` | OText inline **fontSize 18 bold**, `marginBottom 10`; "(Pending)" 12 `primary`; OButton "Checkout" (default radius 30) | multi-cart group | `SectionHeader` + `button.sm` |
| CartContent | Group total | `:58-63` | OText 14 default | | `BillRow variant=total` |
| CartContent | Group separator | `:290` | inline 1px **`#ccc`**, `marginVertical 10` | | `SectionDivider` |
| CartContent | Combined totals | `:301-338`, `styles.tsx:27-29` | rows 14/24/400 `textNormal`; total 16/24/500; message 14/**300** centered `marginVertical 20` | all-carts total | `BillRow` (same component as checkout) |
| CartContent | Price skeleton | `:17-21` | 14 high | | `Skeleton` |
| CartContent | Empty | `:345-355`, `styles.tsx:7-11` | `NotFoundSource hideImage`, button **radius 8**, `margin-top 40` | no carts | `EmptyState` |
| CartContent | Overlay spinner | `:356` | `LoadingOverlay` | busy | third-party; theme the colour |
| BusinessItemAccordion | Cart card | `BusinessItemAccordion/styles.tsx:3-17` | radius 7.6, min-height 120 (60 closed), closed opacity .5 | one business cart | `Card` |
| BusinessItemAccordion | Header | `styles.tsx:19-27`, `index.tsx:80-153` | `padding 10 0` white bg; name 16/24/600; links "Go to store" / "Clear cart" / "Change store" 12/18 `primary` underline separated by " • " `textSecondary`; Closed 12 `red`; chevron PNG `drop_down/up` 12 | header + actions | `CartCardHeader`; `text.link` |
| BusinessItemAccordion | Collapsed price + Checkout | `index.tsx:157-170` | OText default; OButton width **180**, radius 7.6, `textStyle color` | | `button.sm` |
| BusinessItemAccordion | Reservation line | `:171-177` | 12 **`danger5` (undefined → black)** when invalid | | `color.danger` |
| BusinessItemAccordion | Dead var | `:62` | `bgStyle` reads `colors.secundary` (undefined), never used | | delete |
| Cart | Student alert | `Cart/index.tsx:241-243` → `CartStudentAlert` | see school | | — |
| Cart | Upselling | `:244-256` → `UpsellingProducts` | modal of suggested products; fallback `images.dummies.product` (`UpsellingLayout.tsx:52`) | | product area |
| Cart | Product lines | `:279-294` → `ProductItemAccordion` | product area (shared with OrderDetails) | | — |
| FreeDeliveryProgress | Progress card | `FreeDeliveryProgress/styles.tsx:3-35`, `index.tsx:44-66` | bg `backgroundGray100`, 1px `border`, radius 8; variant full `margin 12 20, padding 12`; track 8 high radius 4 `backgroundGray200`, fill `active`; text `preset body`, 600 when unlocked | free-delivery nudge | `ProgressBar` + `Card muted`; candidate hideable piece |
| Cart | Bill box | `:301-425` (uses `OSBill/OSTable/OSRow` from OrderSummary) | same box; rows OText **12 / line height 18** (OrderSummary: 12, no line height) | bill | `BillRow` |
| Cart BillRows | `BillRow`, taxes group, charges | `Cart/BillRows.tsx:35-238`, `Cart/styles.tsx:41-77` | label 12/18 `numberOfLines 1`; info icon 16 `primary`; toggle chevron 14 `textSecondary`; strike `disabled` + Free 600 `primary` | bill rows | this is the most reusable implementation → base of `BillRow` |
| Cart | Coupon | `:391-404` → `CouponControl` inside `OSCoupon` (`padding 5 0`) | | | — |
| Cart | Spot row | `:408-423` | label 14/21/600; "Edit" 14/21/600 `primary` underline; `marginTop 15` | | `text.link` |
| Cart | Catering moment | `:427-440` → `MomentOption` | other area | | — |
| Cart | Invalid address | `:442-448` | 12 `error` | | `text.error` |
| Cart | Checkout button | `:453-477`, `styles.tsx:20-28` | OButton full width, **radius 30 (default)**, label = state text (out of coverage / min / max / missing reservation / Checkout / Loading); `margin 10 0` | go to checkout | `button.primary` full |
| Cart | Invalid products | `:479-483` | 12 **`colors.red`** centered `marginTop 5` (checkout uses `error` for the same message) | | `text.error` |
| Cart | Modals | `:489-523` | `CartStoresListing`, `TaxInformation`, `PlaceSpot` ("Choose your spot") | | — |
| CartStoresListing | Change store sheet | `CartStoresListing/styles.tsx:3-30`, `index.tsx:39-90` | close PNG 16; list `padding 0 20`, **`margin-bottom 140`**; `BusinessCart` items (star PNG 12) | | listing area for `BusinessCart` |
| Cart (unused styles) | `OrderBill`, `CouponContainer`, `Divider` | `Cart/styles.tsx:7-35` | `#FFF`, `#EAEAEA` literals | — | delete |

### MultiCheckout (`MultiCheckout/index.tsx`)

| Screen / component | Element | file:line | Values today | Function | Proposal |
|---|---|---|---|---|---|
| MultiCheckout | Page padding | `index.tsx:97-114,420` | `paddingLeft/Right 20`, `marginBottom 100 + insets.bottom` | | `space.page_x` |
| MultiCheckout | Order type / moment pills | `:422-455`, `styles.tsx:32-43` | `CHMomentWrapper` bg `backgroundGray100`, radius 7.6, h 26, `padding-h 8`, `margin-end 12`; text 12 `textSecondary`; `arrow_down` PNG width 10 | change type/time | `Pill` component (also used by listing header) |
| MultiCheckout | **Section band** | `:456,507,529,566,593,616,647` | inline `View height 8 bg backgroundGray100 marginHorizontal -40` (×8; `marginTop` 13 or 18) | full-bleed separator | `SectionDivider variant=band` — the -40 bleed should be `-page_x` |
| MultiCheckout | Section | `styles.tsx:23-25` | `padding-top 30` (single checkout: 20) | | `space.section` |
| MultiCheckout | Customer title | `:465-467` | OText **14** `textNormal` (checkout: sectionTitle 16/700) | | `SectionHeader` |
| MultiCheckout | Guest buttons | `:468-487` | radius **7.6** (checkout: 15) | | `button.*` |
| MultiCheckout | Pending / failed text | `:510-519,532-539` | OText **17** `error` | | `Notice` |
| MultiCartsPaymethodsAndWallets | Title | `MultiCartsPaymethodsAndWallets/index.tsx:178` | 16/24/500 `textNormal` | | `SectionHeader` |
| MultiCartsPaymethodsAndWallets | Method chip | `styles.tsx:8-32`, `index.tsx:137-170` | copy of `PMItem` but selected bg **`primary`** (single: `active`) and border **`#EAEAEA`** (single: `colors.border`); label 10 `'#000'` | | `PaymethodChip` |
| MultiCartsPaymethodsAndWallets | Wallet row | `styles.tsx:33-47`, `index.tsx:270-305` | `padding 20 0`, `margin-top 10`, top/bottom 1px `backgroundGray200`; checkbox **left** MCI 25; name 12 `marginLeft 15`; no wallet image | | `WalletToggleRow` (same as single) |
| MultiCartsPaymethodsAndWallets | Skeletons | `:182-194,256-262` | 3 × 80 high radius 10; 40 high | | `Skeleton` |
| MultiCheckout | Driver tips title | `:575-579` | OText 14/20 `textNormal` inside `DriverTipsContainer` (imported from `Cart/styles` `padding 5 0`) | | `SectionHeader` |
| MultiCheckout | Group coupon | `:600-616` | `OSBill` + `CouponControl isMulti` | | — |
| MultiCheckout | "Your order" | `:618-623` | 16/24/500 | | `SectionHeader` |
| MultiCheckout | Per-cart `Cart` | `:624-640` | same Cart component (bill, product lines) | | — |
| MultiCheckout | Empty | `:651-657`, `styles.tsx:65-73` | OText **24** centered, box h 300 width 80 % | | `EmptyState` |
| MultiCheckout | Partial wallet warning | `:660-664` | 14 **`danger5` (undefined → black)** `marginVertical 20` | | `Notice tone=warning` |
| MultiCheckout | All-carts totals | `:666-713`, `styles.tsx:74-76` | same rows as `CartContent:301-338` (copied); reward 12; description 12 **`mediumGray`** `mRight 70` | | `BillRow` |
| MultiCheckout | Errors | `:717-730` | 12 `error` | | `text.error` |
| MultiCheckout | Place-order bar | `:798-813` | `FloatingButton` without total; `containerStyle paddingBottom insets.bottom` **overrides the component's `|| 20` → 0 px on phones without a home indicator** | | `PlaceOrderBar` |
| MultiCart | Skeleton | `MultiCart/index.tsx:10-42` | 3 groups of lines 20, one 120 radius 8; 8 px bands `marginHorizontal -40` | loading only | `Skeleton` |
| MultiCheckout (unused styles) | `TopActions`, `TopHeader`, `ChAddress` duplicate Checkout/styles | `styles.tsx:3-18` | | | delete with the copy |

### Coupon

| Component | Element | file:line | Values today | Function | Proposal |
|---|---|---|---|---|---|
| CouponControl | Entry button (offers enabled) | `CouponControl/index.tsx:92-116`, `styles.tsx:25-49` | bg `backgroundPage`, 1px `border`, radius `utils.radius.l` (10), min-h 64, `padding 12 14`; icon box 40×40 `backgroundGray100` radius 10, AntDesign `tagso` 20 `primary`; title 14/600; subtitle 12 `textSecondary`; chevron 16 | open CouponOffers | `ListRow` / `NavRow` component — one of the few places already reading `theme.utils` |
| CouponControl | Inline input + Apply | `:119-160`, `:35-43` | OInput radius **8** h 44; OButton radius 8 h 44 text 12; `gap 20` | apply code | `input` + `button.sm` |
| CouponControl | Applied coupon pill | `:121-135`, `styles.tsx:18-23` | `CCButton` bg `backgroundGray`, radius **50**, `padding 10`; text 12 white centered; OAlert to remove | applied state | `Pill` |
| CouponControl | Error | `:57-77` | `Alert.alert` | | system alert |
| CouponOffers | Whole screen | `CouponOffers/styles.tsx:1-222` | 8 **`styled.Text`** (system font): 13/600, 11/700, 14/700, 14/600, 11/700 letter-spacing .8 uppercase, 12/17, 12/600; radius `utils.radius.l/m`; min-heights 44/40/38; OfferRate 48×44 | offers list | only screen in the area built on tokens; replace `styled.Text` with `OText` presets |

### Wallets, gift cards, saved cards

| Screen / component | Element | file:line | Values today | Function | Proposal |
|---|---|---|---|---|---|
| CashWallet | Balance row | `CashWallet/index.tsx:69-77`, `styles.tsx:3-28` | `Container padding 0 20 20`; "Available" + amount OText **20 bold** | balance | `text.price_lg` |
| CashWallet | Band | `:79` | inline 5 px `backgroundGray100` `marginBottom 20` | | `SectionDivider band` |
| CashWallet | Loading | — | **no loading state**: nothing renders while `walletList.loading` | | add `Skeleton` |
| CashWallet | Empty / error | `:86-93` | `NotFoundSource` | | `EmptyState` |
| LoyaltyPoints | Level image | `LoyaltyPoints/index.tsx:28-44,118-132` | FastImage 120×120 (API `loyaltyLevel.image`), hidden 0×0 until loaded | level badge | `image.badge` box |
| LoyaltyPoints | Level name | `:134-141` | 22 bold uppercase `primary` | | `text.screen_title` + transform |
| LoyaltyPoints | Balance row | `:145-152` | 20/600 | | `text.price_lg` |
| LoyaltyPoints | Band + list | `:155-158` | 5 px band; ScrollView `maxHeight 55%` | | — |
| LoyaltyPoints | Loading | — | **none** (same gap as CashWallet) | | `Skeleton` |
| WalletTransactions | List | `WalletTransactions/index.tsx:20-60` | skeleton 100×100 radius 8 (×n); empty 16 `disabled` centered | history | `Skeleton`, `EmptyState` |
| WalletTransactionItem | Row | `WalletTransactionItem/styles.tsx:3-55`, `index.tsx:27-50` | `padding 0 20 10`, `margin-bottom 20`, 1px `border` except last; icon box 55×55 radius 10 `backgroundGray100`, AntDesign arrowup/down 25 `success500`/`danger`; date `disabled`; amount bold green/red; unused `Dot` | transaction | `ListRow`; `color.success`/`danger` |
| GiftCardUI | Hero card | `GiftCard/GiftCardUI/styles.tsx:9-38`, `index.tsx:47-59` | `backgroundImage: linear-gradient` `active`→`green`, radius 16, `padding 22`, min-h 210; chip `rgba(255,255,255,.2)` radius 20; watermark Ionicons `gift` 130 `rgba(255,255,255,.16)`; title 22/700 white; subtitle 13/400 white opacity .9 | hero | `Hero` component; gradient as two colour tokens |
| GiftCardUI | Intro texts | `:60-63` | 20/600 centered; 12/400 | | `text.section_title`, `text.caption` |
| GiftCardUI | Divider | `styles.tsx:40-44` | 1px `border` `margin-vertical 20` | | `SectionDivider` |
| GiftCardUI | Redeem row + button | `:72-83`, `:21-35` | 18/600 + 14/400; OButton radius 15 h **35** | | `button.sm` |
| GiftCardUI | Redeem sheet | `:84-93` → `RedeemGiftCard` | OBottomPopup; inputs; result texts 20 bold / 14 / 16/600 ×n `mBottom 12` | | form tokens |
| PurchaseGiftCard | Option card | `PurchaseGiftCard/styles.tsx:7-29`, `index.tsx:60-100` | 1px **`disabled`** border, radius 15, `padding 12`; image 70×70; price 16/600 `textNormal`; name 12 `textSecondary`; OButton radius 15 text 14 | buy | `Card` + `button` |
| PurchaseGiftCard | Image | `index.tsx:76` | `images.general.giftCard{price}` with fallback **`giftCard5` for any other price** (a $20 card shows the $5 artwork) | | image key per product or one generic |
| PurchaseGiftCard | Skeleton | `:62-71` | 70 high | | `Skeleton` |
| SendGiftCard | Form (from OrderDetails) | `GiftCard/SendGiftCard/index.tsx:25-150` | title 20 with **`Platform` weight `600`/`bold`**; labels 14; inputs radius 7.6 h 44; message h 100 | | form tokens; drop platform weight |
| SavedCards | Screen | `SavedCards/index.tsx:103-175`, `styles.ts:3-41` | padding 20; "Add card" OButton (default radius 30), `margin-bottom 16`; card row 1px **`#e9e9e9`** radius 10 `padding 14` `margin-bottom 12`; Ionicons `card-outline` 22 `primary`; brand capitalize `marginLeft 10`; "•••• 1234"; trash Ionicons 20 `danger || '#d9534f'`; empty/error `padding 40 20` | manage cards | `SavedCardRow` (same component as checkout list) |
| SavedCards | Loading | `:104-108` | ActivityIndicator large `primary` | | `Skeleton` like the checkout list |
| SavedCards | Add modal | `:158-172` | OModal; Braintree `WebView` or `StripeElementsForm` | | third-party |

### School vertical

| Component | Element | file:line | Values today | Function | Proposal |
|---|---|---|---|---|---|
| CheckoutStudentDetails | Block | `CheckoutStudentDetails/styles.tsx:3-21`, `index.tsx:115-160` | top 1px `backgroundGray200 || '#E9ECEF'`, `margin-top 18`, `padding-top 16`; title 18 bold; ODropDown; info 15 ×4; links 13 `primary` | student on order | `SectionHeader`, `text.body`, `text.link` |
| StudentSelector | Selector (listing) | `StudentSelector/styles.tsx:3-24`, `index.tsx:97-125` | **`styled.Text` Label** 16 bold; "Add student" OText **18** `primary`; notice bg `backgroundGray100 || '#F8F9FA'` radius 8 `padding 12 14`, text 13 | | business-page area; noted for consistency |
| CartStudentAlert | Modal | `CartStudentAlert/styles.tsx:3-21`, `index.tsx:77-110` | `padding 8 20 28`; intro 14; item 15 bold + reason 13 coloured **`backgroundGray300 || '#909BA9'` (a background token used as text)**; two OButtons | items not allowed for student | `color.text_secondary` |
| StudentsList (MyStudents) | Screen | `StudentsList/styles.tsx:3-31`, `index.tsx:20-50` | `padding 16 20`; "Add student" pill bg `primary` radius 20 `padding 9 14` text 14 white; card radius 10 1px `backgroundGray200` `padding 14 16`; name 16 bold; detail 13 `backgroundGray300` (same misuse); loading = the word "Loading" | | `button.pill`, `Card`, `Skeleton` |
| StudentFormModal | Form | `StudentFormModal/styles.tsx:4-49`, `index.tsx:108-241` | **`styled.Text` Label** 14; read-only field radius 15 with **iOS shadow / Android border `rgba(0,0,0,.1)` branch**; chips radius 20 `padding 8 14`, selected bg/border `primary`, else `lightGray` border + white; chip text 13 | create/edit student | `ChoiceChip`; `input` tokens; drop platform branch |

---

## Duplicates (same function, different implementation)

| Function | Implementations (file:line) | Visible differences |
|---|---|---|
| **Bill / totals rows** | `Cart/index.tsx:301-425` + `Cart/BillRows.tsx:35-238`; `OrderSummary/index.tsx:247-564`; `CartContent/index.tsx:301-338`; `MultiCheckout/index.tsx:666-713` (copy of CartContent); (`OrderDetails/Bill.tsx`, other area) | cart rows 12/**lh 18**, checkout rows 12/no lh; all-carts rows 14/24 and total 16/500; checkout total 14 bold with `#d9d9d9` rule; free-delivery strike uses `disabled` vs `disabled || #9E9E9E`; Cart uses a `BillRow` component, OrderSummary repeats the JSX ~10 times |
| Payment-method chip + icon map | `PaymentOptions/styles.tsx:15` + `index.tsx:96-123`; `MultiCartsPaymethodsAndWallets/styles.tsx:8` + `index.tsx:85-106` | selected bg `active` vs `primary`; border `colors.border` vs `#EAEAEA`; icon maps differ (paypal_braintree/apple/google braintree only in single) |
| Wallet toggle row | `PaymentOptionWallet/index.tsx:97-150`; `MultiCartsPaymethodsAndWallets/index.tsx:270-305` | image 44 + checkbox right vs checkbox left + no image; 14 vs 12 text; borders none vs gray200 |
| Saved card row | `StripeCardsList/index.tsx:116-165`; `PaymentOptionStripe/index.tsx:60-100` (**dead UI**: `PaymentOptionStripeUI` is never exported from `@ui`); `SavedCards/index.tsx:141-155` | PNG radio 16 vs MCI 24; number 12 "XXXX-…" vs 20 vs "•••• 1234"; trash PNG 16 vs MCI 28 vs Ionicons 20; brand icon `#000` FA vs Ionicons primary |
| Section header | `Checkout/index.tsx:171` (local, 16/700); `shared/HeaderTitle.tsx` (20, ios 600/android bold, own margins); `MultiCheckout:465` (14/400), `:577` (14/20), `:621` (16/24/500); `MultiCartsPaymethodsAndWallets:178` (16/24/500); `CartContent:42` (18 bold inline); `CheckoutStudentDetails:117` (18 bold); `StudentSelector/styles:7` (styled.Text 16 bold) | five sizes for the same role |
| Section separator | Checkout 1px rules on 6 styled views + `Divider` (16 margin); MultiCheckout 8 px band ×8 with `-40` bleed; CashWallet/LoyaltyPoints 5 px band; MultiCart 8 px band; CartContent 1px `#ccc`; GiftCardUI 1px (20 margin); `Cart/styles` and `OrderSummary/styles` `Divider` (1px `#EAEAEA` border, unused) | rule vs band, three thicknesses, three greys |
| Checkout layout styles | `Checkout/styles.tsx` vs `MultiCheckout/styles.tsx` | `TopActions`, `TopHeader`, `CHMomentWrapper`, `ChErrors` identical; `ChSection` 20 vs 30; `ChContainer` mb 100 vs 60; `ChUserDetails` pb 20 + rule vs pb 34 |
| Place-order / checkout CTA | `Checkout:1114` (FloatingButton with total); `MultiCheckout:798` (no total, inset override); `Cart:453` (full-width OButton radius 30); `BusinessItemAccordion:161` (width 180 radius 7.6); `CartContent:51` (group OButton) | radius 30 vs 7.6; bottom padding `inset || 20` vs `inset` |
| Guest gate | `Checkout:652-672` (radius 15, LoginForm inline in ScrollView `:1103`); `MultiCheckout:468-487` (radius 7.6, `CheckoutLoginForm` with forgot/register) | radius; login form has different actions |
| Choice chip / option | `DriverTips DTCard` (r12, 2px active border + `activeContrast`); `DeliveryOptionItem` (r15, 1px `active`); `PMItem` (r10, filled `active`); `StudentFormModal Chip` (r20, filled `primary`); `CouponOffers OfferTab` (r `utils.m`, white on gray) | five selected-state styles |
| Coupon entry | `CouponControl` entry row (r10, h64) ; inline input (r8) + applied pill (r50); `CouponOffers` manual form (r10, `CompactButton`) | three looks for "enter a code" |
| Text inputs in money flows | comments r8 h120; tip r15 h44; coupon r8 h44; cash r7.6 h50; gift-card r7.6 h44; CouponOffers r10 h44; student read-only r15 | 5 radii, 3 heights |
| Error / notice text | `cartMessage` 12 `error`; Cart invalid products 12 **`red`**; status-4 17; pending 17/600; cash error 16 bold; add-card error 20; partial wallet 14 `danger5` | sizes 12–20 for the same tone |
| Wallet screens | `CashWallet/styles.tsx` ≡ `LoyaltyPoints/styles.tsx` (byte-identical); `Wallets/styles.tsx` near copy; UIs near copies | — |
| Skeleton blocks | ≈ 15 hand-built `Placeholder` groups (heights 14, 20, 35, 40, 44, 50, 64, 70, 80, 100, 120) | no shared skeleton |
| Empty states | `NotFoundSource` (CartContent with `hideImage` + btn r8; Checkout; StripeCardsList; CashWallet/LoyaltyPoints); MultiCheckout `CCNotCarts` OText 24; StudentsList plain text; SavedCards `EmptyWrapper` | — |

---

## Blocks and pieces

### CheckoutPage (original order, `Checkout/index.tsx:588-990`)

| Page | Block or piece | Hideable? Movable? | Why |
|---|---|---|---|
| checkout | `header` (HeaderContent: address + order type) | hideable, fixed on top | context only; NavBar already gives back |
| checkout | `business` (logo, name, phone) | hideable, movable | informative |
| checkout | `address` | **not hideable** (delivery); movable | the invalid-address error (`:996`) is only fixable here |
| checkout | `articles` (Summary) | hideable, movable | the bill still shows the totals; edit entry is also in the cart |
| checkout | `customer` (UserDetails + guest gate + student) | hideable **only for signed-in users** — v1 already allowed it (`checkout.components.customer.hidden`) | guest gate (login / sign up / continue as guest) and the school student picker live here; hiding them blocks guests and school orders → the key must not hide the gate or the student picker |
| checkout | `delivery_options` | hideable, movable | a default option is always set |
| checkout | `pending_notice` (status 2/4) | **not hideable** | payment state, release action |
| checkout | `reservation` | not hideable when order type 9 | required data |
| checkout | `payment_methods` | **not hideable**; movable | required to place |
| checkout | `wallets` | hideable, movable | optional |
| checkout | `driver_tips` | hideable **only when the `driver_tip` checkout field is not required** (`:158`), else the "Driver Tip is required" error has no control | conditional |
| checkout | `place_spot` (types 3/4/5) | not hideable when the spot is required | |
| checkout | `bill` (OrderSummary totals) | **not hideable** | price transparency; total must be visible before paying |
| checkout | piece `bill.coupon` | hideable unless the coupon field is required (`:159`) | same reason as tips |
| checkout | piece `bill.comments` | hideable unless required (`:157`) | |
| checkout | piece `bill.loyalty_reward` | hideable | promo |
| checkout | `errors` | not hideable | blocking messages |
| checkout | `place_order_bar` | not hideable, not movable (sticky) | primary action |
| checkout | piece `place_order_bar.total` | hideable (the bill shows it) | |

### Cart (per cart card)

| Page | Block or piece | Hideable? Movable? | Why |
|---|---|---|---|
| cart | `student_alert` | not hideable | blocks invalid school items |
| cart | `cart_header` (name + go to store / clear / change store) | header not hideable; each link hideable | |
| cart | `products` | not hideable | |
| cart | `free_delivery_progress` | hideable, movable | nudge |
| cart | `bill` | not hideable (v1 let merchants hide the discount rows — do **not** carry that over: the rows stop adding up to the total) | |
| cart | piece `bill.coupon` | hideable | |
| cart | `spot`, `catering_moment` | not hideable when they apply | required data |
| cart | `checkout_button` | not hideable | |
| cart (multi) | `group_totals` | not hideable; piece `group_message` hideable | |
| cart | `empty` | — | state |

### MultiCheckout

Blocks in order: `order_type_moment` (hideable), `customer` (same rule as checkout),
`pending_notice` (no), `address` (no), `payment_methods_wallets` (no), `driver_tips`
(conditional), `group_coupon` (conditional), `carts` (no), `totals` (no; pieces
`loyalty_reward`, `description` hideable), `errors` (no), `place_order_bar` (no).

### Wallets / gift cards / saved cards / students

`CashWallet`: `balance` (no), `transactions` (no). `LoyaltyPoints`: `level`
(hideable), `balance` (no), `transactions` (no). `GiftCards`: `hero` (hideable),
`intro` (hideable), `purchase` (no), `redeem` (hideable). `SavedCards`, `MyStudents`:
single block each.

Proposed visibility keys (to be confirmed in the schema phase):
`checkout.header.hidden`, `checkout.business.hidden`, `checkout.articles.hidden`,
`checkout.customer.hidden` (signed-in only), `checkout.delivery_options.hidden`,
`checkout.wallets.hidden`, `checkout.driver_tips.hidden` (ignored when required),
`checkout.bill.coupon.hidden` (ignored when required), `checkout.bill.comments.hidden`
(ignored when required), `checkout.bill.loyalty_reward.hidden`,
`checkout.place_order_bar.total.hidden`, `cart.free_delivery_progress.hidden`,
`cart.bill.coupon.hidden`, `cart.header.go_to_store.hidden`,
`loyalty_points.level.hidden`, `gift_cards.hero.hidden`, `gift_cards.intro.hidden`.

---

## Images

| Key or source | file:line | Painted box | Fit | Fallback | alt |
|---|---|---|---|---|---|
| API `business.logo` / `images.dummies.businessLogo` | `Checkout/BusinessDetails.tsx:24-30` | 44×44 r15 | cover | dummy store | none |
| `images.general.{cash, carddelivery, paypal, creditCard, stripecc, stripes, stripesb, applePayMark, googlePayMark}` | `PaymentOptions/index.tsx:96-123` (dup `MultiCartsPaymethodsAndWallets:85-106`) | 20×20 tinted in chip; 70×70 for Apple/Google Pay | contain | `creditCard` | none |
| API paymethod custom image (`getPaymethodCustomImageUri`) | `PaymentOptions/index.tsx:239-250` | 70×70 | contain | gateway icon | none |
| `images.general.wallet_cash` / `wallet_credit_point` | `PaymentOptionWallet/index.tsx:104-108` | 44×44 r10 bordered | contain | — | none |
| `images.general.radio_act` / `radio_nor` / `trash` (PNG used as icons) | `StripeCardsList/index.tsx:120-161` | 16 | — | — | none → vector icons |
| Card brand (FontAwesome `cc-*`) | `ui/src/utils/index.tsx:195-` via `StripeCardsList:134` | 20, `#000` | — | — | — |
| `images.general.close` | `CartStoresListing:42`, `PaymentOptionCard:193` | 16 | — | — | none |
| `images.general.arrow_down` | `MultiCheckout:434,450` | width 10 | — | — | — |
| `images.general.drop_down` / `drop_up` | `BusinessItemAccordion:152` | width 12 | — | — | — |
| `images.general.giftCard{5,10,25,50,100}` | `PurchaseGiftCard/index.tsx:76` | 70×70 | OIcon default | **`giftCard5` for any other price (wrong artwork)** | none |
| `images.dummies.giftCard` / API product images | `SingleGiftCard/index.tsx:85-90` (MyOrders area) | 70×70 | — | dummy | none |
| API `loyaltyLevel.image` | `LoyaltyPoints/index.tsx:122-132` | 120×120 (0×0 until loaded) | — | none (hidden) | none |
| `images.dummies.loyaltyLevel` | `Wallets/index.tsx:197` (orphan) | ImageBackground 150 h | — | — | — |
| `images.dummies.product` | `UpsellingProducts/UpsellingLayout.tsx:52` | product area | | | |
| Ionicons `gift` watermark | `GiftCardUI/index.tsx:49` | 130 | — | — | decorative |

Images that should become theme keys: the gift-card artworks (one per product or a
generic), the wallet icons, the payment-method marks (only the brand-neutral ones —
Apple/Google Pay marks must stay as delivered by the brands).

---

## Icons

AntDesign (`infocirlceo` 16, `closecircle` 16, `down` 14, `tagso` 20, `right` 16,
`arrowup/arrowdown` 25), MaterialCommunityIcons (`pencil-outline` 24,
`checkbox-*` 25, radio 24/28 in dead UI), MaterialIcons (`keyboard-arrow-down`, sized by
`fontSize 20`), FontAwesome5 (`trophy` 32 `#FFC107`), FontAwesome (`cc-*` brands 20
`#000`), Ionicons (`card-outline` 22, `trash-outline` 20, `gift` 16/130), plus tinted PNGs
(radio, trash, close, arrow_down, drop_down/up, star). Sizes used: 10, 12, 14, 16, 20,
22, 24, 25, 28, 32, 130 → propose `icon.sm 16`, `icon.md 20`, `icon.lg 24`, one-offs for
the trophy and the watermark.

## Fonts

`OText` paints `font-family: 'Poppins-Regular'` plus `font-weight` (faux bold on Android,
`shared/OText.tsx:25`) — every bold/600 in the area is synthetic on Android.
**Raw `styled.Text` bypassing OText (system font, not Poppins):**
`CouponOffers/styles.tsx:48,104,112,148,159,165,173,197`, `DriverTips/styles.tsx:47`,
`StudentSelector/styles.tsx:7`, `StudentFormModal/styles.tsx:12`,
`PaymentOptionStripe/styles.tsx:12` (dead). Platform weight branch:
`SendGiftCard/index.tsx:61`.

## Platform branches, safe areas, lists

| Where | Branch | Kind |
|---|---|---|
| `Checkout/index.tsx:995` | errors `marginBottom ios 35 : 10` | hand-made inset → use safe area |
| `PaymentOptionCard/index.tsx:129` | close icon `marginTop ios 40 : 12` (native Modal) | hand-made inset |
| `pages/Wallets.tsx:25` | `paddingVertical ios 0 : 10` | orphan page |
| `Checkout/DeliveryOptions.tsx:37` | chevron `right ios 5 : RTL 30 : 0` | layout hack → flex row |
| `StudentFormModal/styles.tsx:22`, `index.tsx:48` | iOS shadow vs Android border | shadow token, runtime absorbs |
| `SendGiftCard/index.tsx:61` | weight `600` vs `bold` | theme font weight |
| `PaymentOptions:459`, `PaymentOptionCard:185` | KeyboardAvoidingView behaviour | behaviour |
| `PaymentOptions:296-298` | hides Google Pay on iOS / Apple Pay on Android | behaviour |
| `PaymentOptionCard:240` | `Dimensions.get('window').height - 100` | computed size |
| `FloatingButton/index.tsx:41` | `paddingBottom: inset || 20`; MultiCheckout overrides to `inset` | safe area |
| `Checkout/styles.tsx:5` vs `MultiCheckout:103` | bar clearance 100 vs `100 + inset` | should derive from bar height |

Lists: no `FlatList`/`SectionList` roots and no sticky indices in the area. Nested
scrolling: Cart (one ScrollView per cart inside the page ScrollView), PaymentOptions
(horizontal FlatList inside ScrollView), StripeCardsList (ScrollView max 150), CashWallet
(ScrollView inside scrolling wrapper), DeliveryOptions (FlatList in OBottomPopup).

## Third-party UI (out of scope, noted)

Stripe (`StripeElementsForm`, `initStripe`/`confirmPayment`, Apple/Google Pay sheets),
`react-native-credit-card-input` in a native `Modal` (`PaymentOptionCard:200`), WebViews
(`PaymentOptionsWebView` for PayPal, Square, Credomatic, Computop, Braintree/GlobalPay/
Cybersource iframes; Braintree WebView in `SavedCards:163`), `Alert.alert` (coupon error,
pending-cart dialogs, free-delivery tooltip), `LoadingOverlay`
(`CartContent:356`), `SelectDropdown` (`PlaceSpot:163`).

---

## Off the scale or without a token

| Value | Where | Why it does not fit |
|---|---|---|
| radius 7.6 (22×) | `BusinessItemAccordion/styles:8`, `Checkout/styles:48`, `MultiCheckout/styles:34`, OButton overrides in Cart/MultiCheckout/PaymentOptionCard/StripeCardsList/PlaceSpot/SendGiftCard/VerticalGiftCardOrdersLayout, cash input | legacy "7.6" — collapse to 8 |
| radius 15 / 16 / 18 / 20 / 30 / 50 | OSBill, LoyaltyCard, DeliveryOptionItem, guest buttons, tip input; gift hero 16; chips 20; OButton default 30; coupon pill 50 | collapse to `md 12` / `lg 16` / `pill` |
| font 17 | `Checkout:829`, `PendingCartNotice:91,96`, `MultiCheckout:513,535` | error/notice headline, no level → 16 |
| font 10, 11, 13, 15 | paymethod label 10, missing-zip 10; CouponOffers 11; many 13; student info 15 | between caption levels |
| font weight 300 | `CartContent:334` | not bundled (Poppins Light dropped) |
| `#FFC107` | `OrderSummary:542` trophy | no reward/warning token used |
| `#d9d9d9` | `OrderSummary:553`, `styles:28` | should be `color.border` |
| `#EAEAEA`, `#e9e9e9`, `#ccc` | `MultiCartsPaymethodsAndWallets/styles:30`, `SavedCards/styles:17`, `CartContent:290` | three border greys |
| `'#000'` | `PaymentOptions:286`, `MultiCartsPaymethodsAndWallets:165`, card brand icons | should be `color.text` |
| `#9E9E9E`, `#d9534f`, `#E9ECEF`, `#F8F9FA`, `#909BA9` | fallbacks after `||` (`OrderSummary:431`, `SavedCards:152`, student styles) | fallbacks — delete once the theme is complete |
| `rgba(255,255,255,.2/.16)` | `GiftCardUI/styles:25`, `index:49` | on-brand translucent — needs an `on_primary` alpha token |
| `rgba(0,0,0,.1)` | `StudentFormModal/styles:31` | border |
| `marginHorizontal -40` | MultiCheckout bands ×8, MultiCart | bleed = 2 × gutter; should be `-page_x` |
| `margin-bottom 100` / `140` | `Checkout/styles:5`, `CartStoresListing/styles:13` | clearance for floating bar |
| width 180, 120×50, 70×70, 55×55, 44×44 | collapsed checkout button, paymethod chip, gift/paymethod tiles, transaction icon, logos | component sizes, not spacing |
| `colors.backgroundGray300` as text | `CartStudentAlert:92`, `StudentsList:38` | background token used for text → `text_secondary` |
| `colors.green` as gradient stop | `GiftCardUI/styles:10` | semantic success colour used as brand |
| `colors.red` vs `colors.error` | `Cart:480`, `BusinessItemAccordion:138` | two reds for errors |
| `colors.mediumGray`, `colors.inputDisabled` (chip bg), `colors.activeContrast` | MultiCheckout description, PMItem, DTCard | ad-hoc roles |

### Keys read but not defined (paint nothing today)

| Key | Where | Effect |
|---|---|---|
| `colors.danger5` | `StripeCardsList:143`, `MultiCheckout:662`, `BusinessItemAccordion:173` | "Missing zipcode", partial-wallet warning and invalid reservation render **black** instead of red |
| `colors.secundary` | `BusinessItemAccordion:62` (unused var), `Cart:470-471` (commented) | dead |
| `colors.backgroundCard` | maweja only (`Checkout:642,754`, `OrderSummary:248`, maweja styles) | goes with maweja |

Theme reads that already use `theme.utils` (radius / margins), the only token-like
reads in the area: `CouponControl/styles:29,40`, `CouponOffers/styles` (×8),
`FloatingButton/styles:8`, `FloatingButton/index:88`.

---

## Maweja — to delete

Files: `Cart/layouts/Maweja/index.tsx`, `Cart/layouts/Maweja/styles.tsx`,
`Checkout/layouts/Maweja/index.tsx`, `Checkout/layouts/Maweja/styles.tsx`,
`Cart/__tests__/MawejaCart.test.tsx`, `Checkout/__tests__/MawejaCheckout.test.tsx`;
exports `MawejaCartList`, `MawejaCartPage` (`src/ui/index.tsx:104,319-320`).

Branches: `pages/CartList.tsx:28,52-62`; `Checkout/index.tsx` (37 refs: `143-150`,
`203`, `211-213`, `586`, `589`, `597`, `603-604`, `621`, `635`, `641-642`, `678-679`,
`715-718`, `751-817`, `879`, `896-934`, `955`, `979`, `995`); `Checkout/BusinessDetails.tsx:14,21,23,31-32,61-67`;
`Checkout/Summary.tsx:27-48`; `Checkout/PendingCartNotice.tsx:89-91,96,116`;
`OrderSummary/index.tsx:36,86,247-259,314,365-376,424,540,552-574` (and its
`themeBrandColor` import, still used elsewhere); `PaymentOptions/index.tsx:31,204-230,311-319`;
`AddressDetails` / `UserDetails` `layout`/`mawejaCheckout` props (other areas).

Two traps when deleting:
1. **`CheckoutSectionOrder` lives in the maweja file but the original path renders
   through it** (`Checkout/index.tsx:588`, `layouts/Maweja/index.tsx:37-63`) — inline the
   original order (business, address, articles, customer, beforePay, payments, wallet,
   afterWallet) before deleting the file.
2. **Maweja changes behaviour, not only looks**: `isGuestOrderBlocked` /
   `showContinueAsGuest` (`Checkout/isGuestOrderBlocked.ts:10,20`) and
   `useGuestCheckoutPermission({ requiresAccount: isMaweja })` (`Checkout/index.tsx:203`)
   block guest checkout under maweja. Flattening to `original` re-enables guest checkout
   for apps that had maweja — worth a line in `decisions.md`.

---

## Behaviour bugs found on the way (not theme, for the owner)

- `Checkout/index.tsx:466` navigates to `'Wallets'`, a route that is not registered;
  `pages/Wallets.tsx` and `Wallets` UI are unreachable.
- `PaymentOptionCash.defaultProps` (`PaymentOptionCash/index.tsx:99`) is ignored on
  function components in React 19.
- `PaymentOptionCard/index.tsx:216-219` passes `isDisabled`/`isLoading` to OButton, which
  reads `disabled`/`loading` → the "Add card" button never disables or spins.
- `Checkout/DeliveryOptions.tsx:22-24` calls `useTheme`/`useLanguage`/`useState` after an
  early `return null` (hooks order changes when `showComponent` flips).
- `CashWallet` and `LoyaltyPoints` render nothing while loading.
- `PurchaseGiftCard:76` shows the $5 artwork for any price not in {5,10,25,50,100}.
- Hard-coded Square test URL and location id (`Checkout/index.tsx:1170,1177`).
- v1 `business_view…cart…discount.hidden` hides bill rows while the total keeps them.

---

## Not verified

- **Nothing was run**: no simulator, no screenshots, iOS/Android, small/large phone. All
  painted sizes are read from code; how OText/OButton/OInput finally paint (font
  metrics, button heights, default paddings) is the primitives agent's.
- Which served v1 flags are actually set for live merchants (`checkout.customer.hidden`,
  `business_view.cart.discount.hidden`) — needs an API/DB check before they are dropped.
- How `createMergedTheme` (submodule) merges served keys at the theme root; assumed the
  served `checkout`/`business_view`/`bar_menu` keys arrive there because the code reads
  them there.
- Children owned by other areas, read only at their call sites: `HeaderContent`,
  `AddressDetails`, `UserDetails`, `LoginForm`/`SignupForm`, `ProductItemAccordion`,
  `UpsellingProducts`, `MomentOption`, `BusinessReservation`, `BusinessCart`,
  `NotFoundSource`, `GiftCardOrdersList`/`SingleGiftCard`/`SendGiftCard` (MyOrders /
  OrderDetails).
- `StripeElementsForm`, `StripeCardForm`, `StripeMethodForm`, `StripeRedirectForm`,
  `PaymentOptionsWebView` internals (third-party wrappers, out of scope).
- How `MultiCart` is reached (no `navigate('MultiCart')` in app source; likely deep link
  or submodule).
- RTL rules (`theme.rtl` css blocks in `PaymentOptions/styles:28`,
  `MultiCartsPaymethodsAndWallets/styles:21`, `DriverTips/styles:53`) — not exercised.
- Line numbers in `Checkout/index.tsx` for the maweja branch list are from a grep and may
  be off by a line or two.
