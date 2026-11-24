# Area 3: Business storefront and product

Phase 1 (inventory), read-only. **Code reading only: no simulator was run**, so every
"painted" value below is what the code asks for, not a screenshot. The `src/@/`
submodule is excluded. Shared primitives (OText, OButton, OInput, NavBar,
SafeAreaViewWrapper, FloatingButton, OModal, OBottomPopup, OIcon, LottieAnimation,
CardAnimation, PageBanner, `Forms/Tabs`) are another agent's: this report notes where
the area bypasses or overrides them, nothing more.

Screens covered (navigator `src/navigators/HomeNavigator.tsx`):

| Route | Page | UI component (`src/ui/src/components/`) | Reachable? |
|---|---|---|---|
| `Business` (:228) | `src/pages/BusinessProductsList.tsx` | `BusinessProductsListing` → `BusinessBasicInformation`, `BusinessProductsCategories`, `BusinessProductsList` (+ `SingleProductCard`, `FeaturedProducts`, `OrderItAgain`, `SubcategoriesComponent`), modals `BusinessInformation`, `BusinessReviews`, `BusinessReservation`, `ServiceForm` | yes |
| `ProductDetails` (:187) | `src/pages/ProductDetails.tsx` | `ProductForm` → `ProductOption`, `ProductOptionSubOption`, `ProductIngredient`, `ActionButton`, `ExtraOptions` | yes |
| `MomentOption` (:175) | `src/pages/MomentOption.tsx` | `MomentOption` (+ `TimeListItem`) | yes (business "Preorder" chip, header moment pill, closing timer, BusinessController, MultiCheckout) |
| `OrderTypes` (:233) | `src/pages/OrderTypes.tsx` | `OrderTypeSelector` | yes (header order-type pill, MultiCheckout) |
| `UpsellingPage` (:208) | `src/pages/UpsellingPage.tsx` | `UpsellingProducts` (`isPage`) → `UpsellingContent`, `UpsellingLayout`, `CustomItem` | yes (View order → `UpsellingRedirect`; Checkout summary) |
| `BusinessPreorder` (:170) | `src/pages/BusinessPreorder.tsx` | `BusinessPreorder` (+ `BusinessMenuList`) | **no**: no `navigate('BusinessPreorder')` anywhere in `src` (orphan route). **Removed** (route, page, component): the pre-order is MomentOption's |

Also orphaned in this area: `MomentSelector` (exported from `src/ui/index.tsx`, used by
nothing), `SearchBar` on the
storefront (the whole search header is commented out, see below).

Area metrics (original path only, maweja excluded): 749 literals in
`inventory.csv` (233 space, 184 size, 82 font_size, 76 radius, 42 font_weight, 39
color, 24 border, 21 line_height, 15 shadow_part, 14 z_index, 14 opacity, 5
text_transform); 122 inline `style={{`; 7 `StyleSheet.create` (all inside render, so
they do see the theme); 16 `Platform.OS` branches; 2 hard-coded `fontFamily`; 9
`Dimensions`/`useWindowDimensions` reads.

---

## Business (storefront)

### Root container and render order

`BusinessProductsListing/index.tsx:493-817` (`BusinessProductsListingOriginal`).
Page wrapper: `SafeAreaViewWrapper pt disableScrollView` (`pages/BusinessProductsList.tsx:109`).

1. `StudentOnboardingPopup` (school vertical only, :495).
2. Root `View` `flex:1`, `backgroundColor = theme.business_view.components.style.backgroundColor` (:498) — served v1 value; `undefined` in the defaults, so transparent.
3. **Fixed top bar** (outside the scroll): `HeaderContent` from `BusinessesListing/Layout/Original/HeaderContent.tsx`, wrapped in `View marginBottom:20` (:499-509), with `hideAddress`, `title=business.name`, `collapseControls` (scroll > 30), cart icon only when `viewOrderButtonVisible`. It shows: back button, centred title, cart button + badge, then an animated (220 ms) collapsible row with the **order-type pill** (→ `OrderTypes`) and the **moment pill** (→ `MomentOption`, only if preorder enabled). Shared with the Home screen (area of the home agent).
4. Commented-out blocks (:511-630): the old `TopHeader` with back arrow, **search icon + `SearchBar`**, near-business logos strip (`hideBusinessNearCity`), and the search-results overlay `FiltProductsContainer`. Consequence: **product search is unreachable on the storefront today** (`isOpenSearchBar` never becomes true; `BackgroundGray` at :748 never shows). The props `isSearchByName/Description` sent by the page do nothing visible.
5. `ScrollView` (:631) `bounces=false`, `scrollEventThrottle=16`, `stickyHeaderIndices=[(professionals ? 3 : 2) + (freeDeliveryAwareness ? 1 : 0)]` (:632). Children in order:
   - 0 `BusinessBasicInformation` (header image, logo/name block, action chips, fee/time card)
   - (1) `FreeDeliveryProgress variant='full'` when cart empty and status `awareness`
   - (2) Professionals block (`ProfessionalFilterWrapper` + title + `ProfessionalFilter`)
   - `PageBanner position='app_business_page'` (rendered whenever `business.id`)
   - **`BusinessProductsCategories`** — the sticky category bar (the index targets this child)
   - `WrapContent` (`paddingHorizontal:20` inline + `padding-vertical:10`) → `StudentSelector` (school) + `BusinessProductsList`
   - loading fragment (category bar with no tabs → returns `null`, + product-list skeleton)
6. Footer (outside scroll, :752-775): `FreeDeliveryProgress variant='compact'` + `FloatingButton` "View Order · $total" / "Minimum subtotal order: $min" / "Missing Reservation" / "Loading".
7. `UpsellingRedirect` (no UI, navigates to `UpsellingPage`), `Alert`, `OModal` → `ServiceForm`.

**stickyHeaderIndices is computed from conditional children** (`index.tsx:632`):
- it assumes `PageBanner` is always present before the category bar; true only because both need `business.id`;
- when the business has `categories: []` the category bar is not rendered and index 2
  lands on `WrapContent`, so **the whole product list becomes the sticky header**
  (not verified on device);
- any hide/move of BBI, FreeDelivery, professionals or banner (which the theme will
  allow) shifts the index. The index must be derived from the rendered section list.

Category scroll-spy uses magic offsets `-70` (`BusinessProductsCategories/index.tsx:43,50`, `BusinessProductsListing/index.tsx:349`) and `±50` window (:354): they assume the sticky bar height; changing the bar's padding/size breaks the spy.

### Elements

| Screen / component | Element | file:line | Values today | Function | Proposal (component, token or key) |
|---|---|---|---|---|---|
| HeaderContent (shared) | Top bar row `Search` | BusinessesListing/Layout/Original/styles.tsx:6 | row, `padding-horizontal: utils.margins.horizontal` (20) | Screen top bar | `space.page_x` |
| HeaderContent | Back button `BackArrow` | …/styles.tsx:14 | 30×30, r10, bg `white`, iOS shadow `#000` 0/2/0.15/4, Android border 1 `rgba(0,0,0,0.1)`; AntDesign `left` 18 `colors.black` (HeaderContent.tsx:123) | Floating icon button | `IconButton` variant `floating` (size sm), `radius.md`, `shadow.sm`; duplicate of ProductForm `WrappAction` |
| HeaderContent | Title | HeaderContent.tsx:131 | `OText preset="cardTitle"` (16/600/22), centred, 2 lines, `marginHorizontal:16` inline | Screen title (business name) | `type.title_sm`; duplicate of BBI name (20/600) on the same screen |
| HeaderContent | Cart button `WrapperCartIcon` | …/styles.tsx:44 | 40×40, r12, white, same shadow pair; FontAwesome5 `shopping-basket` 22, `primary` when items else `black` | Cart shortcut | `IconButton floating` size md (r12 vs r10 of back: unify) |
| HeaderContent | Badge `CartBadge` | …/styles.tsx:71; HeaderContent.tsx:201 | min 18×18, r9, bg `primary`, top -2 right -4, px4; OText 10/600 white | Count badge | `Badge` component (`type.micro`, `color.on_primary`) |
| HeaderContent | Order-type / moment pills `WrapMomentOption` | …/styles.tsx:100; HeaderContent.tsx:239-267 | r15, h45, px20, bg `backgroundGray100`, width as % prop (35/45/40/25/16); OText `tsize.m-1`=15/600 (literal arithmetic), moment `tsize.s`/`m`; arrow_down PNG 14 black | Order context selector | `Chip` variant `selector` (`radius.lg`, `control.h_lg`); kill `tsize.m - 1` |
| HeaderContent | Controls row | …/styles.tsx:91 | margin-top 10, px 20 | — | `space.sm` |
| BusinessProductsListing | Header wrapper | index.tsx:499 | `marginBottom:20` inline | Gap header→scroll | section gap token |
| BusinessBasicInformation | Header image `BusinessHeader` | BBI/styles.tsx:6; index.tsx:171 | ImageBackground 100%×210, default cover | Business hero | `business.hero.height` key (sm/md/lg), image from API |
| BBI | Header skeleton | index.tsx:185 | PlaceholderLine h210 r8 | Loading | `Skeleton` with same height token as hero (radius differs from hero: r8 vs 0) |
| BusinessHeaderPlaceholder | No-header fallback | BusinessHeaderPlaceholder/index.tsx:27; styles.tsx:3 | h210, r0 (passed), bg `businessHeaderPlaceholder` (#EEF1F4); logo 50% of height (105) contain; else monogram OText `round(210*0.32)`=67/600 `backgroundGray300` | Hero fallback | keep; monogram size → `type.display` or ratio constant; color `color.text_muted` |
| BBI | Info block `BusinessInfo` | styles.tsx:11 | bg `backgroundPage`, padding `10px 20px` | Business info section | section `business_info`, `space.page_x` |
| BBI | Social icons row | SocialIcons.tsx:48; styles.tsx:94 | 30×30 touch, Ionicons/MaterialCommunity 22 black, right-aligned ScrollView | Social links | **Dead**: `<SocialIcons loading={loading} />` (index.tsx:191) never passes `business`, so it renders an empty ScrollView (and a 5-item skeleton while loading). Decide: wire `business` or delete. Visibility key `business_info.social` if kept |
| BBI | Logo | index.tsx:198; styles.tsx:23 | FastImage 69×69, r15, contain; wrapper width 20%; source `logo` route param (raw) or `optimizeImage(logo,'h_70,c_limit')` (70 px for 69 pt: blurry at @2x/@3x) | Business logo | `business.logo.size`, `radius.lg`; request ≥ 3× (h_210) |
| BBI | Logo skeleton | index.tsx:209-212 | 69×69, PlaceholderLine r8 | Loading | Skeleton |
| BBI | Name | index.tsx:221 | OText 20/600, 2 lines | Business name (h1) | `type.title_lg` |
| BBI | Ribbon `RibbonBox` | styles.tsx:61; index.tsx:225 | bg API color (default `primary`), padding `2px 8px`, max-w 180, mb5, r7.6 (round-rect) / r50 (capsule) / r0; border 1 `black`/`white` literal; text 10/400 lh13 black/white by luminance | Merchant ribbon | `Ribbon` component (one for business/category/product), `radius.sm`/`radius.full`, `type.micro`; color from API (not theme) |
| BBI | Address | index.tsx:244 | OText default, 1 line | Address | `type.body`, `color.text_secondary`? (today primary text) |
| BBI | Business types | index.tsx:254 | OText default, fallback "General" | Category label | `type.body` |
| BBI | Name/address skeleton | index.tsx:263-265 | 3 lines h18 r8 (w80/60/78 %) | Loading | Skeleton |
| BBI | Action chips row | index.tsx:279 | `flexWrap`, `gap:10` inline | Action chips | `space.sm` |
| BBI | Action chip `BusinessInfoActionsItem` | styles.tsx:38 | r15, bg `backgroundGray100`, padding `10px 20px`, gap5; text 14/600 | Reviews / Info / Preorder / Reservation | `Chip` variant `action` (same as WrapMomentOption) |
| BBI | Reviews chip | index.tsx:280-289 | star PNG 14 **black** + `reviews.total` (the average rating) | Opens reviews modal | visibility `business_info.reviews` (v1 `…business.components.reviews.hidden` is read at :63 but **never applied**) |
| BBI | Info chip | index.tsx:292-300 | Ionicons `information-circle-outline` 20 black + "Info" | Opens info modal | visibility `business_info.info_button` (v1 `business_info.hidden` read :66, never applied) |
| BBI | Preorder chip | index.tsx:302-311 | text only, when `preorder_status_enabled` and no professionals | → `MomentOption` | behaviour (config), not theme |
| BBI | Reservation chip | index.tsx:313-323 | inline `backgroundColor: primary`, Ionicons `time-outline` 18 white, text white | Primary action (type 9) | `Chip` variant `primary` instead of inline override |
| BBI | Chips skeleton | index.tsx:330-334 | 3 lines h20 | Loading | Skeleton |
| BBI | Fee/time card `CardContainer` | styles.tsx:101 | r20, border 1 `border`, padding `15px 20px`, centred | Delivery stats | `Card` variant `outlined`, `radius.xl`; visibility `business_info.stats` (v1 `fee.hidden`/`time.hidden` read :61-62 but **never applied**) |
| BBI | Stat value / label | index.tsx:351-359 | 14 bold / 12 400; `InfoSection` px25 | Stat | `type.label_strong` / `type.caption`; label says "Delivery time" even for pickup (`pickup_time` shown) — copy bug |
| BBI | `VerticalSeparator` | styles.tsx:118 | 1 px, `border` | Divider | `border.hairline` |
| BBI | Card skeleton | index.tsx:342-343 | two h70 r8 | Loading | Skeleton |
| BusinessProductsListing | Professionals title | index.tsx:656 | OText 16, `Platform.OS ios ? '600' : 'bold'`, mb16 inline; wrapper pl20 mb35 (styles.tsx:52) | Section title | `type.section_title`; drop the platform weight |
| BusinessProductsCategories | Sticky bar wrapper | BusinessProductsCategories/index.tsx:63 | inline `paddingHorizontal:20, backgroundColor:'white', paddingBottom:10` | Sticky category bar | section `category_bar`; `color.surface` (literal `'white'` while root uses served `backgroundColor`) |
| Forms/Tabs (shared) | Tab track `OTabs` / tab `OTab` | Forms/styles.tsx:6,12 | track bg `backgroundGray100` r30; tab py10 px15 r30, selected bg `active` (#21BC9E, passed at :68); text bold, selected `white`, unselected `black` | Category pill tabs | `Tabs` variant `pill`; selected colors `color.accent`/`color.on_accent` |
| BusinessProductsCategories | (unused) `Tab` styled | styles.tsx:3 | — | dead | delete |
| SubcategoriesComponent | Subcategory pills | BusinessProductsList/SubcategoriesComponent/index.tsx:32-82; styles.tsx:3 | OButton override: r8, h35, px8, borderWidth0; text 12; selected text `'#FFF'` literal + Feather `x-circle` 16; container gap8 mb10. `ContainerButton isSelected` is a plain View that ignores the prop: selected vs unselected **background is identical** (OButton default) | Subcategory filter | `Chip` variant `filter` with real selected state |
| BusinessProductsList | List container | styles.tsx:4 | padding-bottom 60 | — | footer clearance from FloatingButton height |
| BusinessProductsList | Category header `CatWrap` | styles.tsx:57; index.tsx:153 | row, mb10 | Category heading | — |
| BusinessProductsList | Category image | index.tsx:155-161; styles.tsx:63 | OIcon 41×41 r7.6 inline, `h_250`; wrapper r8 mr10, iOS shadow `#000` 0/0/0.1/1 | Category icon | `category.image` visibility key; `radius.sm` |
| BusinessProductsList | Category name | index.tsx:164 | `OText preset="sectionTitle"` (16/700/22) | h2 | `type.section_title` (good: already a preset) |
| BusinessProductsList | Category ribbon | index.tsx:168; styles.tsx:18 | same as BBI ribbon + ml5, no mb | Ribbon | `Ribbon` |
| FeaturedProducts | Title "Featured items" | FeaturedProducts.tsx:30 | OText 20 bold | h2 | `type.section_title` (20 vs 16 of category names) |
| FeaturedProducts | Carousel item | FeaturedProducts.tsx:42 | width `window*0.35`, py20, mr20 inline | Featured card slot | card width token or ratio key |
| OrderItAgain | Title | OrderItAgain/index.tsx:35 | OText 20 bold | h2 | `type.section_title` |
| OrderItAgain | Item | OrderItAgain/index.tsx:44; styles.tsx:5 | width `window*0.5`, mr20 inline, py20 | Card slot | as above |
| SingleProductCard | Card `AdaptedCardContainer` | SingleProductCard/styles.tsx:80 | r10, padding12, row; border-bottom 1 `border` (unless `hideBorder`); card mb20 inline (index.tsx:168) | Product row | `ProductCard` variant `row`; `radius.md`, `space.md` |
| SingleProductCard | Sold-out state | index.tsx:57-60,168 | bg `disabled` + opacity 0.7 on the whole card | Disabled | `state.disabled` token |
| SingleProductCard | Quantity badge | styles.tsx:16; index.tsx:173 | 25×25 r12.5, bg `primary`, abs top10 right10; text 12 white | In-cart count | `Badge` |
| SingleProductCard | Name | index.tsx:179 | preset `cardTitle` (16/600/22), 2 lines | Product name | `type.card_title` |
| SingleProductCard | Description | index.tsx:183 | OText default, 3 lines, cut at 50 chars + "..." | Description | `type.body`, `color.text_secondary`; visibility `product_card.description` (v1 key read :50) |
| SingleProductCard | "View more" | index.tsx:187-192 | Pressable h16, text `tsize.s || 12` (14) `active` | Opens the product (as the card does) | `Link` text; remove `|| 12` fallback |
| SingleProductCard | Price | index.tsx:200 | bold, `tsize.m` (16), mRight20 | Price | `type.price` |
| SingleProductCard | Favorite | index.tsx:203 | LottieAnimation, color `danger`, 18 | Favorite toggle (signed out → Login) | visibility `product_card.favorite` (v1 key read :54) |
| SingleProductCard | Tag images | index.tsx:226; :61 | 30×30 cover, mr5, `h_250` | Dietary tags | `tag.icon` size token |
| SingleProductCard | Product image | styles.tsx:108; index.tsx:266 | 100×100, r20, bg `backgroundGray100`, cover, `w_160,h_160` (160 px for 100 pt: blurry @2x/@3x). **No image → no box at all** (no fallback, layout shifts) | Product photo | `product_card.image` visibility (v1 key :51-53), size key, `radius.xl`; request 3× |
| SingleProductCard | Product ribbon | styles.tsx:49; index.tsx:246 | abs top-4 right-4, padding `1px 8px` (vs 2px 8px elsewhere) | Ribbon | `Ribbon` |
| SingleProductCard | "More" custom card | index.tsx:122-129 | `minHeight:80` inline, preset cardTitle | Lazy-load "More" tile | ProductCard variant `more` |
| CustomItem | Vertical card | SingleProductCard/CustomItem.tsx:28-39 | **styled components declared inside render** (recreated every render); card r `utils.radius.l` (10); image box 100% width, aspect 1 (featured/upselling) or 1.7 (order-again), r20, bg `border` | Featured / Order it again / Upselling card | `ProductCard` variant `tile`; move styled defs out |
| CustomItem | Featured "+" | CustomItem.tsx:74-75 | PNG `general.add` 65×65 abs bottom-10 right0 | Quick add affordance | `IconButton` |
| CustomItem | Name / last ordered / price | CustomItem.tsx:79-90 | cardTitle 1 line / default / 14 600 | Tile texts | `type.card_title`, `type.caption`, `type.price` (14 vs 16 on row card) |
| CustomItem | Rating | CustomItem.tsx:91-97 | star 14 `star`, text 600 `star` | Rating | never shown (`reviewsTotal` not passed by any caller) |
| CustomItem | Upselling add icon | CustomItem.tsx:100-108 | PNG `tag_plus` 20 white on black, padding5, r8 | Add | `IconButton` variant `solid` |
| BusinessProductsList | Product skeleton | index.tsx:229-245 | minH165 mb28 p12; lines w60/w20, 24%×70 thumb, h52 | Loading | Skeleton sized from ProductCard tokens |
| BusinessProductsList | Empty state | index.tsx:260-285; styles.tsx:14 | `NotFoundSource` in fixed h500 wrapper; "No products found at this time" / "Go to Businesses"; search variant "Clear filters" | Empty | `EmptyState` component; hide CTA when single-business (already) |
| BusinessProductsList | Error | index.tsx:291-294; styles.tsx:7 | p20, bg `#CCCCCC` literal, `font-weight` on a View (ignored); text "ERROR:" untranslated | Error | `Alert`/`InlineError` component; `color.surface_muted`; translate |
| FreeDeliveryProgress | Banner | FreeDeliveryProgress/styles.tsx:3-35 | bg gray100, border 1, r8; full: margin `12px 20px`, padding12; compact: `0 20px 8px`, `8px 12px`; track h8 r4 gray200; fill `active` | Free-delivery nudge | `ProgressBanner`; section `free_delivery` (hideable) |
| BusinessProductsListing | Footer CTA | index.tsx:752-774 | `FloatingButton` with `containerStyle position:relative`; label composed with " · " | View order | shared FloatingButton |

### Modals opened from the storefront

| Modal | Element | file:line | Values today | Function | Proposal |
|---|---|---|---|---|---|
| Info (`OModal title=name subtitle=types`) | Address row | BusinessInformation/index.tsx:99-109 | mt20 inline; pin PNG 18 `active` mr10 | Address | visibility `business_info_modal.address` (v1 `information.components.address.hidden`, applied) |
| Info | Map | index.tsx:112-122; styles.tsx:29 | h135, r30, mt20, GoogleMap readOnly (third party, out of scope) | Location | v1 `location.hidden` (applied, also hides address) |
| Info | Address notes + "Read more" | index.tsx:128-141 | 12, mb10, 3/20 lines; link 12 `primary` mb20; truncation threshold `WIDTH*0.76` | Notes | `type.caption` |
| Info | `DivideView` | styles.tsx:36 | h2, my20, `backgroundGray100` | Divider | `border.divider` (3rd divider style in this area) |
| Info | Schedule title + card | ScheduleTable.tsx:58-66; styles.tsx:44 | title 16 bold; card bg gray100 r20 p20 mt20; rows py10 | Opening hours | `Card` variant `muted`; v1 `schedule.hidden` (applied) |
| Info | Day / hours text | styles.tsx:58-64 | **hard-coded `font-family: Poppins-Bold / Poppins-Regular`** for current day vs others; "Closed" untranslated (ScheduleTable.tsx:32) | Hours | weight via `type.*` + theme font family; translate |
| Info | Photos | index.tsx:152-165; styles.tsx:13 | title 16 bold; horizontal ScrollView h127 mt10 gap20; each 210×127 cover r10 wrapper, `h_150` | Gallery | v1 `images.hidden` (applied) |
| Info | Videos | index.tsx:167-187 | WebView 210×127 r20 (WebView, out of scope) | Gallery | v1 `videos.hidden` (applied) |
| Info | Container | styles.tsx:17; index.tsx:94 | padding20, contentContainer pb80 | — | `space.page_x` |
| Reviews (`OModal title="Reviews"`) | Summary | BusinessReviews/index.tsx:28-41; styles.tsx:71-85 | `ranking` bundle image 120×120 cover mr20; rating 60 bold; "of the 5.0" | Rating summary | `type.display`; image key `business.reviews_illustration` |
| Reviews | List | index.tsx:43-62; styles.tsx:17 | mt24, px20 gap10 pb80 inline | Reviews | — |
| Reviews | Review item | Item.tsx:22-31; styles.tsx:59 | p20 r15 border1 `border`; stars as text "★" inline color `'black'` / `'#E9ECEF'` literal | Review card | `Card outlined`; `Rating` component with `color.rating` (star elsewhere is `colors.star` #FFC700, here black) |
| Reviews | Date | Item.tsx:27 | format `'MMMM D, YYYY • hh:mm A'` hard-coded | Meta | `type.caption` |
| Reviews | Empty / error | index.tsx:47,61 | OText 16 / default | Empty | `EmptyState` |
| Reviews | Unused styled | styles.tsx:5-57 | ScoreView, WrapCustomerReview, ReviewSearchView, ReviewProgressView, PrincipalWrapView (`lightGray`) unused | dead | delete |
| Reservation (`OModal`, type 9) | BusinessReservation | BusinessReservation/* | auto-opens once (BBI index.tsx:96-100); Block p15 r7.6 | Reservation form | **not audited in depth** (see Not verified) |
| Service (`OModal` → `ServiceForm`) | — | BusinessProductsListing/index.tsx:799-815 | professionals vertical | Booking | not audited (other vertical) |

### Blocks and pieces

| Page | Block or piece | Hideable? Movable? | Why |
|---|---|---|---|
| Business | `header` (HeaderContent: back, title, cart) | Not hideable (back is the only exit besides hardware back). Not movable | Navigation |
| Business | `header.order_controls` (type + moment pills) | Hideable | Context exists on Home too; collapses on scroll already |
| Business | `hero` (header image / placeholder) | Hideable — v1 `business_view.components.header.hidden` (BBI :68, applied) | Purely visual |
| Business | `business_info` (logo, name, ribbon, address, types) | Name not hideable; logo hideable (v1 key read twice, BPL :106 + BBI :60, **never applied**); address, types hideable | Identity |
| Business | `business_info.actions` (reviews, info, preorder, reservation chips) | Reviews and Info hideable each (v1 keys read but unapplied); Preorder and Reservation are behaviour (config/order type) | Reservation hidden would block type-9 flow (it is also auto-opened) |
| Business | `business_info.stats` (fee/time card) | Hideable (fee and time separately; v1 keys read, unapplied) | Informational |
| Business | `business_info.social` | Currently dead; hideable if revived | — |
| Business | `free_delivery` progress (top + footer) | Hideable | Marketing nudge |
| Business | `professionals` | Data-driven; hideable would break service booking | Behaviour |
| Business | `banner` (PageBanner `app_business_page`) | Hideable, movable | Marketing |
| Business | `category_bar` (sticky) | Hideable only if scroll-spy and "All/Featured" still work; movable **only** if `stickyHeaderIndices` becomes computed | Navigation within menu |
| Business | `order_it_again` | Hideable (already empty for school) | Personalisation |
| Business | `featured` | Hideable (the "Featured" tab is added unconditionally for non-school at index.tsx:171) | Merchandising |
| Business | `product_list` | Not hideable | Core |
| Business | `product_card` pieces: image, description, favorite, tags, ribbon, in-cart badge | image/description/favorite have v1 keys (applied); tags, ribbon hideable | Visual |
| Business | `view_order` footer | Not hideable | Checkout entry |
| Business | `search` | Today absent (commented) | Decide: restore as a section or delete the dead code |
| Business | `near_businesses` strip | Commented out (v1 `near_business.hidden` read at :107, default hidden) | Delete |
| Info modal | address, map, notes, schedule, photos, videos | Each hideable (5 v1 keys applied) | Informational |

### Signed in / out

- Signed out: "View Order" footer and header cart button never show (`auth &&` at index.tsx:200), so a guest cannot open the cart from the storefront; quick-add (`add_product_with_one_click`) requires auth (:239); favorite heart redirects to Login (`SingleProductCard/index.tsx:87-93`).
- Signed in: all of the above visible.

---

## ProductDetails

### Root container and render order

`ProductForm/index.tsx:465-891`. Page: `SafeAreaViewWrapper pt disableScrollView` (`pages/ProductDetails.tsx:41`). No NavBar: own header.

1. Hero `BackgroundImage` absolutely positioned, height `Dimensions.get('screen').height * 0.55` (:468-476), **raw `product.images` URL, not optimised**, cover. Absent when no image (no fallback image; layout switches to a 56 pt clearance, `STICKY_HEADER_CLEARANCE` :72).
2. Sticky header `WrapperHeaderActions` (abs, z1000; :478-509): back `WrappAction`, product name (after scroll), favorite `WrappAction`.
3. `ScrollView` (`paddingTop = HEIGHT*0.45` or 56, pb80; :511-523), no sticky children:
   - `ProductSummary` sheet (white, top radius 30): grab `Line`, title row (name + calories), description (position depends on image presence: :561 vs :601), SKU · persons, price / weight price + offer price, tags, `Divider`.
   - `ExtraOptionWrap` horizontal tab strip (Ingredients + each option with suboptions; hidden when suboptions ≥ 200).
   - `ProductEditions`: Ingredients section, options (accordions) with suboptions, special comment.
   - Skeleton (2 groups) while loading / before `InteractionManager`.
   - Error `NotFoundSource`.
4. Bottom bar `ProductActions` (absolute bottom 0, z1000): quantity stepper + `ActionButton`.
5. `StudentOnboardingPopup` (school).

`scrollDown` assumes the hero is `HEIGHT*0.55` tall (:316) while the scroll padding is `HEIGHT*0.45` (:516): error auto-scroll lands ~10% of screen off. Uses `Dimensions.get('screen')` (includes Android nav bar), not window.

### Elements

| Screen / component | Element | file:line | Values today | Function | Proposal |
|---|---|---|---|---|---|
| ProductForm | Header bar | styles.tsx:150-181 | px `margins.horizontal`, py10; when scrolled: bg white, border-bottom 1 `border`, iOS shadow `#000` 0/2/0.1/3, Android elevation 4 | Collapsing top bar | `TopBar` variant `overlay→solid`; `shadow.sm` |
| ProductForm | Back / favorite buttons `WrappAction` | styles.tsx:127-148 | 30×30 r10 white; iOS shadow 0/2/0.15/4; Android border 1 `rgba(0,0,0,0.1)`; AntDesign `left` 18 black | Floating icon button | `IconButton floating` (identical to HeaderContent `BackArrow`) |
| ProductForm | Favorite icon | index.tsx:499-507 | Lottie, color **`theme.colors.danger5` — undefined in theme.json** (card uses `danger`) | Favorite | `color.favorite` token |
| ProductForm | Collapsed title | index.tsx:488-495 | 16/600, 1 line, px15 | Title | `type.title_sm` |
| ProductForm | Hero image | index.tsx:468-476; styles.tsx:113 | screen×0.55, cover, unoptimised | Product photo | `product.hero.height` key; `optimizeImage` w/ screen width ×3 |
| ProductForm | Summary sheet `ProductSummary` | styles.tsx:105 | padding `26px 20px 0` (ph prop), bg `white` literal, top radius 30 | Sheet | `Sheet` surface, `radius.xxl`, `color.surface` |
| ProductForm | Grab line `Line` | styles.tsx:118 | 35×5 r10 `backgroundGray200` mb10 | Handle | Sheet handle token |
| ProductForm | Name | index.tsx:549-555 | 20 / lh30 / 600, mb10 | h1 | `type.title_lg` (BBI name is 20/600 without lh) |
| ProductForm | Calories | index.tsx:557 | 16 `#808080` literal | Meta | `type.body`, `color.text_muted` |
| ProductForm | Description | index.tsx:562-566, 602-606; styles.tsx:49 | 12/lh18 `textSecondary`, pb20 | Description | `type.caption` |
| ProductForm | SKU · persons | index.tsx:569-580 | 14 `#909BA9` literal (= `backgroundGray300`), mb7 | Meta | `color.text_muted` |
| ProductForm | Price | index.tsx:583-586 | 16 `primary` (weight price lh24) | Price | `type.price`, `color.price` (`primary` is #000 by default) |
| ProductForm | Offer price | index.tsx:588-594 | inline fontSize14 `#808080` line-through mx7 | Strike-through price | `type.price_old` |
| ProductForm | Tags | index.tsx:609-629; :138-151 | image 32×32 r8 with `h_40` (blurry), name 12 `textSecondary` px6; ScrollView pb20 | Tags | `Tag` component |
| ProductForm | `Divider` | styles.tsx:183 | h4 `border` | Section divider | `border.divider_thick` (same as Upselling Divider) |
| ProductForm | Option tab strip `ExtraOptionWrap` | styles.tsx:88; ExtraOptions.tsx:33-49; index.tsx:642-664 | padding `20px 10px`, pb0, bg white; item px7 pb10 border-bottom 1 (selected `textNormal`, else `backgroundPage`); text 12, 600 selected / normal, maxW150 | Jump-to-option tabs | `Tabs` variant `underline` (third tab style in the area) |
| ProductForm | Ingredients title | index.tsx:678-682; styles.tsx:58 | OText 16 **no weight**, SectionTitle py10 | h3 | `type.section_title` (Comments title is 16/600/24) |
| ProductIngredient | Row | ProductIngredient/styles.tsx:3; index.tsx:21-31 | py10; MaterialCommunity `checkbox-marked` 24 `primary` / `checkbox-blank-outline` 24 `#cbcbcb` literal; name ml10 | Ingredient toggle | `Checkbox` component; `color.border_strong` |
| ProductOption | Accordion header `AccordionTitle` | ProductOption/styles.tsx:17 | padding `10px 20px`, bg **`theme.colors.safeAreaColor` — undefined** (transparent) | Option group header | `color.surface` |
| ProductOption | Name | index.tsx:72 | `tsize.m` (16) 600 | h3 | `type.section_title` |
| ProductOption | Required pill `RequiredWrap` | styles.tsx:49; index.tsx:75-77 | bg `activeContrast` r15 padding `5px 10px`; text `tsize.xs` (12) `active` | Required tag | `Badge` variant `accent` |
| ProductOption | Min/Max text | index.tsx:79 | 12 `primary` | Constraint | `type.caption` |
| ProductOption | Chevron box `WrappAction` | styles.tsx:26-47 | 45×45 r10 bg gray100 + same shadow pair; AntDesign up/down 18 black | Expand | `IconButton` variant `muted` |
| ProductOption | Error state | index.tsx:64 | `style={{ color: error ? 'orange' : white }}` on a View — **no visible effect** | Validation error | `state.error` border/bg |
| ProductForm | Suboption wrapper `WrapperSubOption` | styles.tsx:65; index.tsx:708-711 | px 20; **reads `props.bgcolor` but receives `bgColor`**, so the error tint `rgba(255,0,0,0.05)` and max-reached `hsl(0,0%,72%)` (index.tsx:226-236) are never painted; `justifyContent` prop ignored too | Option body | Together with the line above: **option validation errors have no visual today**. `state.error_bg` token |
| ProductOptionSubOption | Row | ProductOptionSubOption/styles.tsx:3-21 | IconControl py10; LeftContent 60%; right column gap10 mr13 inline | Suboption | `OptionRow` |
| ProductOptionSubOption | Image | index.tsx:126-135; styles.tsx:53 | 35×35 r`radius.l`(10) cover, `h_100`; Logo wrapper r10 mr10 | Suboption image | `option.image` size |
| ProductOptionSubOption | Name / price | index.tsx:138-145 | 12 lh18 ml5; "+ $x" 12 lh18 | Label | `type.body_sm` |
| ProductOptionSubOption | Qty stepper | index.tsx:154-172; styles.tsx:23 | width62; AntDesign `minuscircleo`/`pluscircleo` 20, `active` or `black` when disabled; qty 12 | Stepper | `Stepper` size sm (main stepper uses Feather squares 24) |
| ProductOptionSubOption | Check / radio | index.tsx:174-199 | PNG `check_act`/`check_nor`/`radio_act`/`radio_nor` 16, `active` / black | Selection control | `Checkbox` / `Radio` components (ingredients use vector icons) |
| ProductOptionSubOption | Half/whole selector `Circle` | styles.tsx:38-51; index.tsx:205-229 | padding `10px 20px`, bg `activeContrast` active else gray100, outer radius 30; icon PNG 15; text 600 capitalize | Segmented control | `Segmented` component |
| ProductOptionSubOption | Max message | index.tsx:233-241 | 10 `primary` centred | Hint | `type.micro` |
| ProductForm | Comment title | index.tsx:745-749 | 16/600/24 | h3 | `type.section_title` |
| ProductForm | Comment input | index.tsx:750-761; :104-110 | OInput multiline, border1 `border` r8 h100; **`placeholderTextColor = colors.white`** on white → placeholder invisible | Special instructions | `Input` multiline; `color.placeholder`; visibility is API (`hide_special_instructions`) |
| ProductForm | Comment wrapper | styles.tsx:70 | pb `pb || 60`, px20 | — | — |
| ProductForm | Skeleton | index.tsx:766-803 | 2 groups: h40 line + 3 rows (h30 w10/50/30, mb20) | Loading | Skeleton |
| ProductForm | Title skeleton | index.tsx:536-545 | two lines h20 (w40/w30) | Loading | Skeleton |
| ProductForm | Error | index.tsx:805-807 | NotFoundSource | Error | `EmptyState` |
| ProductForm | Bottom bar `ProductActions` | styles.tsx:75-87 | abs bottom0, `padding-top: ios ? 20 : 0` then `padding-vertical: 20` (overrides it), px30, bg `#FFF` literal, border-top 1 `border`, z1000; no bottom safe-area inset | Add-to-cart bar | `BottomBar` component (same job as FloatingButton) with inset |
| ProductForm | Quantity stepper `QuantityControl` | styles.tsx:188; index.tsx:816-874 | border1 `border` r30 padding `0 20px`, mr10; Feather `minus-square`/`plus-square` 24 `active` / black disabled; TextInput minW60 h44 r8 fontSize20 `top:2` hack, **no color/font family** (system font) | Quantity | `Stepper` size md; input font from theme |
| ActionButton | Wrapper width | ActionButton.tsx:45 | 100% / 60% / 40% by state | — | layout |
| ActionButton | Add / Update / Sold out | ActionButton.tsx:60-75 | OButton `class='primary'`, text 14, **10 when loading or edit mode** | Primary CTA | `Button primary`; one text size |
| ActionButton | Signed-in without address | ActionButton.tsx:80-88 | loading OButton text 10; else `<OButton testID="product-address-redirect" onClick=…/>` **with no text** (blank button) | Go to address | label "Select address" |
| ActionButton | Signed out | ActionButton.tsx:90-108 | OButton override h42 r7.6 px0, text 13 centred: "Login / Sign Up" | Auth CTA | `Button primary` (no override) |
| ActionButton | Guest link | ActionButton.tsx:110-120 | 13 `primary` / `disabled`, mt10; skeleton h20 | Continue as guest | `Link` |
| ProductForm | Unused | index.tsx:118-137, 185-198, 290-298; styles.tsx:5-42, 94-104 | swiper styles, `gallery`/thumbs/video state computed but never rendered, `qtyBy` weight switch with no UI, `TopHeader`, `ProductHeader`, `WrapContent`, `WeightUnitSwitch/Item` | dead | delete; product gallery is computed and not shown |
| ProductForm | `ProductForm.defaultProps` | index.tsx:909 | ignored on function components in React 19 (lesson 8) | — | default in destructuring |

### Blocks and pieces

| Page | Block or piece | Hideable? Movable? | Why |
|---|---|---|---|
| ProductDetails | `top_bar` (back, favorite, collapsed title) | Back not hideable; favorite hideable | Exit |
| ProductDetails | `hero` image | Hideable / size key | Visual; if hidden, use the no-image layout path that already exists |
| ProductDetails | `summary` name, price | Not hideable | Core |
| ProductDetails | calories, SKU, persons, description, tags | Each hideable | Informational |
| ProductDetails | `option_tabs` strip | Hideable | Navigation aid only |
| ProductDetails | `ingredients`, `options` | Not hideable (they carry required choices) | Validation |
| ProductDetails | `comment` | Already API-controlled per product; a theme key could hide it globally | Optional input |
| ProductDetails | `actions` bar | Not hideable | Add to cart |

Signed in/out: favorite → Login when signed out; CTA becomes "Login / Sign Up" + optional "As guest user" (`guestCheckoutEnabled`); signed in without address → blank button (bug).

---

## MomentOption (delivery time)

Root: NavBar "Delivery time" + `SafeAreaViewWrapper disableScrollView` (`pages/MomentOption.tsx:68-74`) → `Container` ScrollView (`MomentOption/styles.tsx:3`, bg `backgroundPage`; contentContainer px `margins.horizontal`, pt16, pb 180/32 inline :237-241) + `FloatingButton` footer.

| Element | file:line | Values today | Function | Proposal |
|---|---|---|---|---|
| Subtitle | index.tsx:245 | 14 lh20 `textSecondary`; wrapper mb20 | Helper text | `type.body`, `color.text_secondary` |
| Day tabs `DayTabCard` | styles.tsx:17-28; index.tsx:257-272 | minW120 mr10 padding `12px 16px` r`radius.l`(10) border1 (`primary` active / `border`) bg `backgroundPage`; label 15 (600/500, `primary`/`textNormal`); sub 12 `textSecondary`; radio PNG 18 | Day selector | `SelectableCard`; 15 is off-scale |
| ASAP row / time rows `OptionRow` | styles.tsx:38-48; index.tsx:282-296; TimeListItem.tsx:24-40 | minH56 py8 border-bottom1 `border`; radio PNG 20 mr16; title 16 lh22 (600 selected); sub 13 lh18 | Radio list row | `RadioRow` component; 13 off-scale |
| Empty | styles.tsx:54; index.tsx:311-315 | py48; 15/500 `textSecondary` centred | Empty | `EmptyState` |
| Footer | index.tsx:322-334; styles.tsx:59 | FloatingButton "Continue" + `CancelButton` py6, text 16/600 `textNormal` | Confirm / cancel | shared FloatingButton |

Also rendered embedded inside Cart (`Cart/index.tsx:429`) and OrderSummary (`:619`) with `isCart` (footer hidden): one component, two contexts.

## OrderTypes

Root: NavBar "Type delivery" + ScrollView + FloatingButton "Continue" (`OrderTypeSelector/index.tsx:69-113`).

| Element | file:line | Values today | Function | Proposal |
|---|---|---|---|---|
| Grid | styles.tsx:3; index.tsx:41-48 | px `margins.horizontal`, pt20; columns 3 if ≥5 types and window > 380 else 2; card width computed from `Dimensions` | Grid | phone only: keep computation, tokens for gap |
| Type card `TypeCard` | styles.tsx:11-29 | square, bg `white`, r`radius.l`, **border 2** (`active` selected / `border`), p10, shadow `#000` 0/2/0.05/4 + elevation 2 (both platforms, no Platform branch) | Selectable card | `SelectableCard` (same as MomentOption day card, which uses border 1 and `primary`) |
| Icon | index.tsx:89-93; utils/index.tsx:18-29 | Ionicons 34, `active` / `black` | Type icon | `icon.size.xl` |
| Label | index.tsx:95 | 600, default size; label overridable by served `theme.order_types_config.type{N}.name` | Type name | served text → v2 text key or drop (no v1 map) |
| Empty | index.tsx:101-103 | inline flex centring | Empty | `EmptyState` |

## UpsellingPage

Root: `SafeAreaViewWrapper pt disableScrollView` → `UpsellingContent` (`UpsellingProducts/UpsellingContent.tsx:50-93`): `CartStudentAlert` (school), `HeaderContent isCart` (back only, plus order controls row because `hideOrderControl` is not passed), gesture-handler `ScrollView` (mt20 **mb120** inline to clear the footer), `OrderSummary showOnlyProducts` (other area), `Divider`, "Complement your order" block with horizontal `UpsellingLayout`, `FloatingButton` Checkout + "Add more products" (secondary).

| Element | file:line | Values today | Function | Proposal |
|---|---|---|---|---|
| Summary wrapper | UpsellingContent.tsx:64 | px20 mb20 inline | — | `space.page_x` |
| `Divider` | styles.tsx:78 | h4 `border` mx20 | Divider | `border.divider_thick` |
| Title / subtitle | UpsellingContent.tsx:77-78 | 18/500; default `textSecondary` | Section title | `type.section_title` (18/500 is unique) |
| Carousel item | UpsellingLayout.tsx:42-56 | width `window*0.35`, py20, mr25 (Featured uses mr20) | Card slot | same token as Featured |
| Upsell card | UpsellingLayout.tsx:46-55 → CustomItem | **raw `product.images` URL (not optimised)**; fallback `theme.images.dummies.product` | Product tile | `ProductCard tile` |
| Unused styled | styles.tsx:3-76 | Item, Details, AddButton (`primaryContrast`), CloseUpselling, TopBar, TopActions, CartList, CartDivider, TopActionsHeader, TopHeader | dead | delete |

Non-page mode (`OBottomPopup`, UpsellingProducts/index.tsx:59-68) is used by Cart, not by the storefront (the storefront always redirects to the page).

## BusinessPreorder (orphan route) and helpers

**Removed** with the route and its page: MomentOption covers the pre-order (`preorderParams`).

Route registered but never navigated to. Its UI (`BusinessPreorder/index.tsx`) is the heaviest literal cluster of the area: `#344050`, `#B1BCCC` ×4, `#000000` shadow, `white`, `#E9ECEF`, `#F5F9FF`, `#fff` (index.tsx:76-147; styles.tsx:45-66), third-party `SelectDropdown` and `CalendarStrip` styled through props, `Platform.OS === 'ios' ? 12 : -top` dropdown offset (:376), `TimeItem` 86×34 r7.6 grid. `BusinessMenuList` is only used here. **Proposal: delete the route, page, component and `BusinessMenuList`** (MomentOption already covers the in-business preorder via `handleBusinessClick`), or confirm with the owner that some entry point should exist. `MomentSelector` (196 lines, 22 literals) is also unused: delete.

---

## Duplicates (same function, different implementation)

| Function | Implementations (file:line) | Visible differences |
|---|---|---|
| Merchant ribbon | `BusinessBasicInformation/styles.tsx:61`, `BusinessProductsList/styles.tsx:18`, `SingleProductCard/styles.tsx:49` (also used by `CustomItem.tsx:45`); render block copy-pasted 4× | padding 2/8 vs 1/8; mb5 + align-self vs ml5 vs absolute -4/-4; all use r7.6 / r50 and literal `black`/`white` border |
| Floating icon button | `BusinessesListing/Layout/Original/styles.tsx:14` (BackArrow 30, r10), `:44` (cart 40, r12), `ProductForm/styles.tsx:127` (WrappAction 30, r10), `ProductOption/styles.tsx:26` (45, r10, gray100) | size 30/40/45, radius 10/12, bg white vs gray100; same iOS shadow / Android border pair copy-pasted 4× |
| Chip / pill | `BusinessInfoActionsItem` (BBI styles.tsx:38, r15), `WrapMomentOption` (r15 h45), `OTab` (r30), subcategory OButton override (r8 h35), `RequiredWrap` (r15), half-option `Circle` (r30) | 4 radii (8/15/30), 3 heights, 3 selected colors (`active`, `activeContrast`, none) |
| Tabs | `Forms/Tabs` pill tabs (category bar), `ExtraOptions` underline tabs (ProductForm), MomentOption day cards | pill vs underline vs card; selected = `active` bg vs `textNormal` underline vs `primary` border |
| Selectable card | `TypeCard` (OrderTypeSelector/styles.tsx:11), `DayTabCard` (MomentOption/styles.tsx:17) | border 2 `active` vs border 1 `primary`; shadow vs none |
| Quantity stepper | `ProductForm` QuantityControl (Feather squares 24 + TextInput 20), `ProductOptionSubOption` (AntDesign circles 20 + text 12) | icon set, size, editable vs not |
| Checkbox / radio | `ProductIngredient` (MaterialCommunity 24, `primary`/`#cbcbcb`), `ProductOptionSubOption` (PNG check/radio 16, `active`), MomentOption (PNG option_checked 18–20), BusinessPreorder (same PNG 18) | vector vs PNG, `primary` vs `active` |
| Product card | `SingleProductCard` row (100×100 image right, r10 card), `CustomItem` tile (featured 1:1, order-again 1.7:1, upselling 1:1, r20 image) | two card systems; price 16 bold vs 14/600; name 2 lines vs 1 |
| Section title | category `preset sectionTitle` (16/700/22), Featured / Order it again (20 bold), Professionals (16, ios 600 / android bold), Info Photos/Videos/Schedule (16 bold), Ingredients (16 regular), Comments (16/600/24), Option name (16/600), Upselling (18/500) | 4 sizes/weights for the same role |
| Business name | HeaderContent title (16/600 cardTitle) + BBI name (20/600) on the same screen | shown twice |
| Price | card 16 bold, tile 14/600, product detail 16 `primary`, suboption 12, offer 14 `#808080` | — |
| Divider | ProductForm `Divider` h4 `border`, Upselling `Divider` h4 `border` mx20, Info `DivideView` h2 gray100 my20, BBI `VerticalSeparator` 1 `border`, Preorder `Divider` 1 `border` | 1/2/4 px, two colors |
| Sticky / collapsing top bar | `HeaderContent` (business, upselling) vs `WrapperHeaderActions` (product) | different collapse logic (Animated height vs bg swap) |
| Bottom CTA bar | `FloatingButton` (storefront, moment, order types, upselling) vs `ProductActions` custom bar (product) | product bar has its own border/padding/bg literal and no inset |
| Skeleton blocks | BBI (h210 r8, h18 r8, h20, h70 r8), product list (h165 group), ProductForm (h40/h30), MomentOption-less, BPL `businessSkeleton` 56 r8 (dead) | radii 0/8, no shared component |
| Rating star | BBI star PNG black, CustomItem star PNG `star` (#FFC700), review "★" text black / `#E9ECEF` | three colors for the same icon |

## Images

| Key or source | file:line | Painted box | Fit | Fallback | alt |
|---|---|---|---|---|---|
| API `business.header` (`optimizeImage h_250,c_limit`), route `header` param (raw) as 2nd choice | BBI index.tsx:170-173 | 100% × 210 | cover (ImageBackground default) | `BusinessHeaderPlaceholder` (logo 105 contain on `businessHeaderPlaceholder`, or monogram) | none |
| `Image.getSize` on header | BBI index.tsx:152-163 | — | — | — | fetches real size only to gate the skeleton; size never used for layout (extra network round trip) |
| API `business.logo` `h_70,c_limit` / route `logo` raw | BBI index.tsx:198-206 | 69 × 69 r15 | contain | `theme.images.dummies.businessLogo` (bundle `assets/images/dummies/store.png`, or served string URL) | none |
| API logo `h_200` in placeholder | BusinessHeaderPlaceholder/index.tsx:35-41 | 105 × 105 | contain | monogram | none |
| API `category.image` `h_250` | BusinessProductsList/index.tsx:156 | 41 × 41 r7.6 | OIcon default | none (hidden) | none |
| API `product.images` `w_160,h_160` | SingleProductCard/index.tsx:266 | 100 × 100 r20 | cover | **none** (box removed) | none |
| API `product.images` `w_160,h_160` | SingleProductCard/index.tsx:138,155 → CustomItem | window×0.35 square (≈137 pt) / window×0.5 at 1.7:1 | cover | none for featured/order-again | none |
| API `product.images` **raw** | UpsellingLayout.tsx:50 | window×0.35 square | cover | `theme.images.dummies.product` (bundle) | none |
| API `product.images` **raw** | ProductForm/index.tsx:468 | full width × screen×0.55 | cover | none (layout switches) | none |
| API `product.gallery` | ProductForm/index.tsx:406-447 | not painted | — | — | computed, never rendered |
| API `tag.image` `h_250` | SingleProductCard/index.tsx:229 | 30 × 30 | cover | none | none |
| API `tag.image` `h_40` | ProductForm/index.tsx:622 | 32 × 32 r8 | OIcon | none | none |
| API `suboption.image` `h_100` | ProductOptionSubOption/index.tsx:130 | 35 × 35 r10 | cover | none | none |
| API `business.gallery` files `h_150` | BusinessInformation/index.tsx:160 | 210 × 127 r10 | cover | section hidden | none |
| Bundle `general.ranking` | BusinessReviews/index.tsx:31-35 | 120 × 120 | cover | — | none |
| Bundle `general.add` | CustomItem.tsx:75 | 65 × 65 | — | — | none |
| Bundle icons tinted (`search`, `pin`, `arrow_down`, `pin_map`, `star`, `tag_plus`, `check_act/nor`, `radio_act/nor`, `half_l/f/r`, `option_checked/normal`) | various | 14–20 | tinted | — | — (icons, not images) |

Findings: four requests are smaller than their painted box at @2x/@3x (logo h_70 for 69 pt, product w_160 for 100–137 pt, tag h_40 for 32 pt, description h_100 for 240 pt); two are unoptimised originals (product hero, upselling); the product photo has three fallbacks policies (none / dummy / layout switch); the same logo is painted 69 r15 contain (storefront) and 105 contain (placeholder).

## Served (v1) theme read in this area — stops applying (decision: no v1 map)

| Path | Reader file:line | Applied today? | Proposed v2 home |
|---|---|---|---|
| `app_design.components.layout.type` | BusinessProductsListing/index.tsx:822 (via `utils/appDesign.ts`) | yes (maweja switch) | deleted with maweja |
| `business_view.components.style.backgroundColor` | BusinessProductsListing/index.tsx:108 | yes (root bg) | `color.background` of the screen |
| `business_view.components.header.hidden` | BBI index.tsx:68 | yes | `business.hero` visibility |
| `business_view.components.header.components.business.components.logo.hidden` | BPL :106, BBI :60 | **no** (read, unused) | `business_info.logo` |
| `…business.components.fee.hidden` / `time.hidden` | BBI :61-62 | **no** | `business_info.stats.*` |
| `…business.components.reviews.hidden` | BBI :63 | **no** | `business_info.reviews` |
| `business_view.components.header.components.reviews.hidden` | BBI :64 | **no** | same |
| `…business.components.distance.hidden` | BBI :65 | **no** (render commented) | drop |
| `…business.components.business_info.hidden` | BBI :66 | **no** | `business_info.info_button` |
| `…business.components.city.hidden` | BBI :67 | **no** | drop |
| `business_view.components.near_business.hidden` | BPL :107 | only in commented code | drop |
| `business_view.components.information.components.{location,schedule,videos,images,address}.hidden` | BusinessInformation/index.tsx:46-50 | yes | `business_info_modal.*` |
| `business_view.components.products.components.product.components.{description,image,favorite}.hidden` | SingleProductCard/index.tsx:50-54 | yes | `product_card.*` |
| `[viewString].components.cart.components.products.image.hidden` | SingleProductCard/index.tsx:51-52 | yes when `viewString` passed (no caller in this area passes it) | other area (cart) |
| `order_types_config.type{N}.name` | OrderTypeSelector/index.tsx:33 | yes (label text) | text key or drop |
| `images.dummies.businessLogo` (string → URL) | BBI index.tsx:200-204 | yes if served | `business.logo_fallback` image key |

Server configs (not theme, stay as behaviour): `preorder_status_enabled`, `add_product_with_one_click`, `checkout_multi_business_enabled`, `use_parent_category`, `max_product_amount`, `unaddressed_order_types_allowed`, `preorder_slot_interval`, `use_alternative_to_google_maps`, `school_module_enabled`. The new **`hide_business_contact_customer_app`** (`utils/contactVisibility.ts`, commit 7192991) is **not read anywhere in this area**: the storefront (header, info chips, Info modal) shows **no business phone or email at all** in the original path, so nothing here needs it. It applies to Checkout `BusinessDetails` and `MultiOrdersDetails/SingleOrderCard` (other areas). It is a server setting, not a theme visibility key.

## Keys read but not defined (paint nothing today)

| Key | Where | Effect |
|---|---|---|
| `colors.danger5` | ProductForm/index.tsx:505 | product-detail favorite heart color `undefined` |
| `colors.safeAreaColor` | ProductOption/styles.tsx:22 | option header bg transparent |
| `business_view.*` (whole tree) | above | not in local defaults → all `undefined` unless served |

## Maweja — to delete (original path only inventoried)

- `src/ui/src/components/BusinessProductsListing/layouts/Maweja/` (`index.tsx` 587 l., `styles.tsx` 192 l., `truncateDescription.ts`, `__tests__/MawejaBusinessMenu.test.tsx`, `__tests__/truncateDescription.test.ts`) — 111 literals.
- Branch `BusinessProductsListing/index.tsx:11,14,820-826` (`resolveAppDesign` → `MawejaBusinessMenu`).
- Tests `BusinessProductsListing/__tests__/BusinessProductsListing.test.tsx:600-690` (maweja cases).
- Shared pieces with maweja branches seen from this area (owned by other agents): `PageBanner/index.tsx:26,38-39,228-231`; `BusinessesListing/Layout/Maweja/HomeHeader.tsx` (navigates to OrderTypes/MomentOption).
- `ProductForm`, `MomentOption`, `OrderTypeSelector`, `UpsellingProducts` (page) have no maweja branch. `Cart/layouts/Maweja` renders `UpsellingProducts` (other area).

## Off the scale or without a token

| Value | Where | Why it does not fit |
|---|---|---|
| radius 7.6 | ribbons (3 files), category image, description image, login button, preorder | legacy web value; snap to `radius.sm` (8) |
| radius 12.5 / 9 | in-cart badge 25/2, cart badge 18/2 | half-height circles: `radius.full` |
| radius 15 | logo, chips, required pill, review card | between 10 and 20 |
| radius 20 / 30 | product image, stats card, schedule card / summary sheet, map, tabs, half selector | two large radii; `radius.xl`, `radius.xxl` |
| radius 50 | capsule ribbon | `radius.full` |
| font 10 | badges, ribbons, max-options hint, loading CTA text | `type.micro` |
| font 13 | ASAP sub, login CTA, guest link | off scale |
| font 15 | moment pill (`tsize.m - 1`), day tab, empty text | off scale |
| font 18 | Upselling title | off scale |
| font 60 | rating value | `type.display` |
| font 67 (`height*0.32`) | header monogram | computed |
| space 25 / 35 / 13 / 7 / 26 / 27 / 28 | stats px25, professional mb35, suboption mr13, offer mx7 / extra px7 / sku mb7, summary pt26, `GrayBackground` 27 (unused), skeleton mb28 | off a 4-pt scale |
| `#808080`, `#909BA9`, `#cbcbcb`, `#CCCCCC`, `orange`, `'black'`/`'#E9ECEF'` stars, `'white'` bar, `#FFF` ×3 | ProductForm, ProductIngredient, BusinessProductsList, ProductOption, Review Item, Categories, Subcategories | literals; map to `color.text_muted`, `color.border_strong`, `color.surface`, `color.on_primary` |
| `rgba(255,0,0,0.05)`, `hsl(0,0%,72%)`, `rgba(208,208,208,0.5)` | ProductForm/index.tsx:228,231,133 | error/disabled tints (first two never painted, third dead) |
| `rgba(0,0,0,0.1)` Android border, iOS `#000` shadows | 4 files | `shadow.sm` + platform rendering in runtime |
| `Platform.OS ios ? '600' : 'bold'` | BusinessProductsListing/index.tsx:533 (commented), :659 | weight by platform (faux bold on Android) |
| `Poppins-Bold` / `Poppins-Regular` | BusinessInformation/styles.tsx:59,63 | hard-coded family |
| `HEIGHT*0.55` / `0.45`, `window*0.35`, `window*0.5`, logo `height*0.5` | ProductForm, Featured, OrderItAgain, Upselling, placeholder | screen ratios: keep as ratio keys, not px |
| `-70`, `±50`, `130`, `-50`, `70` scroll offsets | BPL :349,354; Categories :43,50; ProductForm :319,383,647; ExtraOptions :29 | layout coupling to bar heights |

## Not verified

- **No simulator run**: every painted size, color, sticky behaviour and overlap is from code. Nothing was checked on iOS vs Android, small vs large phone.
- The sticky category bar with `categories: []` making the product list sticky.
- Whether `OButton` default renders subcategory pills with any selected difference (depends on OButton defaults, other agent).
- Bottom safe area under `ProductActions` (absolute bar, no inset) and under `FloatingButton` on devices with a home indicator.
- Product hero under `SafeAreaViewWrapper pt`: whether the image starts below the notch or is painted behind it.
- `BusinessReservation` (type 9 modal, 361 l. + date-time picker), `ServiceForm`, `ProfessionalFilter`, `StudentSelector`, `StudentOnboardingPopup`, `CartStudentAlert`, `OrderSummary` (in UpsellingPage): only noted, not audited element by element.
- `PageBanner`, `Forms/Tabs`, `FloatingButton`, `OModal`, `LottieAnimation`, `NotFoundSource`: shared primitives, other agent.
- Rendering of `HeaderContent` order-control row on UpsellingPage (not hidden there; may be intended).
- Served-theme merge (whether `business_view` arrives at all at runtime) — theme-provider area.
- Whether `BusinessPreorder` is reached by a deep link or push handler outside `src/` (searched `src/` only).
- Third-party pieces out of scope by decision: GoogleMap, WebView videos, `SelectDropdown`, the skeleton animation.
