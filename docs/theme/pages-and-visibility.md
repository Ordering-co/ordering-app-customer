# Pages, sections, visibility and images (phase 4)

Date: 2026-11-02 · Status: **approved** (gate 4, 2026-11-02; P1–P4 in decisions.md).

Inputs: the area reports ("Blocks and pieces"), [inventory.md](inventory.md), and the web
schema (`website-marketplace-theming/product.schema.json`): **page, section, visibility and
image keys reuse the web's names wherever the piece is the same**, so the Dashboard shows one
vocabulary for the website and the app.

Notation for sections: `key` (hideable, movable within its group) · `key*` (not hideable) ·
`@group` (moves only among its group) · no group = fixed in place. Every page has
`footer: false` (the app has no footer).

## 1. Pages and sections

| Page (web key) | Screens | Sections in default order | Notes |
|---|---|---|---|
| `home` | Welcome (signed out) | `hero*` · `language_selector` · `title` · `login_account*` | Guest button is config (`guest_checkout_enabled`), not theme |
| `onboarding` | IntroductoryTutorial | `slide_1`…`slide_6` @slides | Whole screen stays the build flag `show_tutorials`; ≥ 1 slide must stay visible (checked in code) |
| `business_listing` | Home tab (BusinessesListing), BusinessTypeListing | `order_progress`@main · `custom_order_banner`@main · `highest_rated`@main · `categories`@main · `all_businesses` | All in one `ListHeaderComponent`, no sticky headers: safe to move. "Top business" = web's `highest_rated`; page banner = `custom_order_banner`. `all_businesses` hides only when the business types open their own screen (`business_types.base.on_select` = `page`: the BusinessTypeListing screen, which always lists the type's stores); while they filter the list, it stays |
| `business_search` | BusinessSearch tab | `search*` · `categories` · `filters` · `results*` · `products` | `products` = product carousel per row |
| `promotions` | Offers tab, Promotions | `search` · `offers*` | |
| `favorites` | Favorite | `tabs` · list* | Tabs per type are visibility keys |
| `business` | Business (BusinessProductsList) | `business_header*` · `free_delivery_banner`@main · `student_selector*`@main · `offers_banner`@main · `order_it_again`@main · `featured_products`@main · `menu*` | **Movable only after phase 6** computes the sticky category bar's index from the rendered sections (`index.tsx:632` hard-codes it). `professionals` is data/behaviour, not a section. `search` and `near_business` are commented out today: not sections (see P1) |
| `product` | ProductDetails | `hero` · `summary*` · `option_tabs` · `ingredients*` · `options*` · `comment` · `actions*` | No movement (groups null): option validation and scroll anchors depend on order |
| `cart` | Cart | `products*` · `free_delivery_progress` · `bill*` · `checkout_button*` | Per cart card; `upselling` stays a separate screen |
| `multi_cart` | MultiCart | `carts*` · `group_totals*` | |
| `checkout` | CheckoutPage | `business`@main · `customer`@main · `address*`@main · `order_summary`@main · `delivery_instructions`@main · `payment_methods*`@side · `wallet`@side · `driver_tips`@side · `place_spot*`@side · `reservation*`@side · `totals*`@side · `rewards`@side · `place_order*` | The app is one column: `@main` and `@side` are kept so the order matches the web's editor; `pending_notice` and `errors` are always rendered, not sections. `customer` hides only the signed-in details, never the guest gate nor the student picker. `driver_tips` is ignored when the server marks it required |
| `multi_checkout` | MultiCheckout | `title*`@main · `address`@main · `customer`@main · `payment_methods*`@main · `coupon`@main · `driver_tips`@main · `order_summary*` · `rewards` · `place_order*` | Same rules as checkout |
| `orders` | MyOrders tab | `tabs` · `upcoming_orders`@main · `active_orders`@main · `past_orders`@main | |
| `order_details` | OrderDetails | `status*` · `map` · `summary*` · `products*` · `bill*` · `review_actions*` · `rewards` · `address` · `driver` | **Not movable** (status/type if-chain): every section `group: null`. Delivery PIN, completed header, place spot and student are always rendered when they apply |
| `multi_orders` | MultiOrdersDetails | `greeting`@main · `customer`@main · `summary*`@main · `orders*`@main | |
| `review` | ReviewOrder, ReviewProducts, ReviewDriver | `rating*` · `quick_comments` · `comment` · `continue*` | One page for the three (they become one `review_form`) |
| `messages` | Messages, MessageView | — | Pieces only (visibility) |
| `help` | Help, HelpOptions | `help_topics`@main · `last_order`@main | |
| `profile` | Profile tab | `profile_photo` · `quick_actions`@main · `rewards`@main · `account`@main · `information`@main · `app_info` | `information` keeps Logout always visible (row, not hideable) |
| `addresses` | AddressList, AddressForm | `address_list*` | Form fields are visibility keys |
| `wallets` | CashWallet, LoyaltyPoints, GiftCards | `balance*`@wallet · `transactions`@wallet · `gift_card_hero`@gift_card · `gift_card_purchase*`@gift_card · `gift_card_redeem`@gift_card | `loyalty_level` is a visibility key |
| `cards` | SavedCards | — | |
| `sessions` | Sessions | `bulk_actions` | |
| `verify` | UserVerification, CompleteProfile | — | |
| `reset_password` | Forgot | `form*` | |

Screens without a page (one block, nothing to order): Login and Signup (pieces under
`auth.*`), OrderTypes, MomentOption, UpsellingPage, Languages, MyStudents,
Notifications, NetworkError, BusinessSearchMap (maps out of scope; two pieces as keys).

## 2. Visibility keys

Default `true` unless noted. Names in **bold** are new (no web equivalent); the rest are the
web's keys. One editor group per prefix.

| Group | Keys |
|---|---|
| `bottom_nav` | `bottom_nav.browse`, **`bottom_nav.offers`**, `bottom_nav.orders` (Home and Profile tabs not hideable). The tab bar is the web's `bottom_nav` component (renamed from `tab_bar` in components.md) |
| `header` | `header.logo`, `header.cart`, `header.cart_count` (`disabled_if` cart hidden), **`header.far_away`** (the far-away warning: icon color and popover) |
| `order_context` | `order_context.order_type`, `order_context.moment`, **`order_context.map`** (listing pills), **`order_context.address`**, `order_context.city` (the city filter of pickup without an address) |
| `business_listing` | `business_listing.categories.all`, **`business_listing.logo`** (**default `false`**: the logo, and the `header_badge` image beside it, on a row at the top of the home screen), **`business_listing.search`** (**default `false`**: a search field at the top of the home screen that opens the Browse tab), **`business_listing.address`**, **`business_listing.order_options`** (the row of the order type, the moment and the map button), **`business_listing.cart`** (the address, the order options and the cart button of the home screen's head only; `order_context.*` and `header.cart` hide them on every screen), **`business_listing.order_caption`** (the “Order in progress” caption over the store's name on the home screen's order card) |
| `business_card` | `header`, `logo`, `reviews`, `favorite`, `offer`, **`ribbon`**, `time`, `fee`, `distance`, `preorder` — the same keys drive the `default` and `compact` cards (today only 2 of 4 cards honor them) |
| `business_search` | **`business_search.hint`**, **`business_search.results_count`** |
| `business_map` | **`business_map.search_area`**, **`business_map.recenter`** |
| `promotions` | `promotions.offer.image`, `promotions.offer.description`, `promotions.offer.expires`, **`promotions.offer.apply_for`** |
| `favorites` | **`favorites.products_tab`**, **`favorites.orders_tab`** |
| `business` | `business.header.logo`, `header.address`, `header.description` (business types), `header.ribbon`, `header.reviews`, `header.info`, `header.time`, `header.fee`, `header.social`, `header.preorder`, `header.distance` (**default `false`**, as the web), **`header.cover`** (the cover photo), **`header.name`**, **`header.order_type`** (**default `false`**: with `business.order_type_switch` on, the order type of the store's head stays in the head, beside the switch); `business.information.address`, `information.location` (map), `information.description` (notes), `information.schedule`, `information.images`, `information.videos`; **`business_page`**: `business.back`, `business.cart_bar` (the View Order bar), **`business.order_type_switch`** (**default `false`**: the allowed order types as tabs under the store's details), **`business.cart_bar.fees`** (hidden: the bar shows the subtotal, without fees); **`business_categories`**: `business.categories.all`, `categories.image`, `categories.ribbon`; **`business_reviews`**: `business.reviews.customer_comments` (**default `false`**, as the web), `reviews.review_date`, `reviews.ranking` (the summary, **default `false`**) |
| `product` (cards and page) | `product.image`, `product.description`, `product.favorite`, `product.tags`, `product.ribbon`, `product.cart_quantity`, `product.dummy_image`, **`product.calories`**, **`product.sku`**, **`product.persons`**, `product.navigation` (option tabs), **`product.offer_price`** (price before the offer), `product.add_price` (the total on the add button; visible by default in the app), **`product.discard_button`** (**default `false`**: a trash button beside the quantity; it leaves a new product, and removes one being edited from the cart after asking), **`product.header`** (**default `false`**: a header bar with the store's name over the product page), **`product.details.description`** (hidden: no description on the product page, the cards keep theirs; `product.description` hides both); **`product_option`**: `product.options.image`, `options.price`, `options.required_badge`, **`options.optional_badge`** (**default `false`**: an “Optional” badge on the groups that can be skipped and on the comment) |
| `cart` | `cart.discount_coupon`, `cart.go_to_store`, `cart.clear`, `cart.business_name`, **`cart.products.image`**, **`cart.upselling`** (the suggested products step before the cart; hidden, View Order goes straight on), **`cart.taxes_detail`** (hidden: only the taxes and fees total, in the cart and the checkout), **`cart.products.tags`** (**default `false`**: the pictures of a product's tags beside its price), **`cart.products.remove_button`** (**default `false`**: the trash button always beside the quantity; hidden, it shows only at one unit, in place of the minus), **`cart.products.description`** (**default `false`**: the description of a product under its price, with a View more link that opens the product; the cart does not carry it, so each line asks the API once and the answer is kept) |
| `checkout` | `checkout.business.logo`, `checkout.business.phone`, `checkout.products.image`, `checkout.payment_methods.logo`, **`checkout.comments`** (ignored when required), **`checkout.place_order.total`**, **`checkout.wallet.points_equivalence`** (**default `false`**), **`checkout.driver_tips.subtitle`**, **`multi_checkout.description`**, **`checkout.order_type_switch`** (**default `false`**: the allowed order types as tabs at the top), **`checkout.business.details`** (**default `false`**: the store's details box, delivery fee and time, at the top), `checkout.business.address` (**default `false`** in the app: the store's address under its name) |
| `confirmation` (order details) | `confirmation.order.progress`, `order.eta`, `order.help`, `order.directions`, `confirmation.driver.photo`, `driver.name`, `driver.phone`, `confirmation.business.messages`, `confirmation.products.image`, **`confirmation.order.total`**, **`confirmation.business.logo`** (completed order), **`confirmation.order.date`** (completed order: the date under the store's name; the order in progress's is `order.eta`), **`confirmation.customer.address`**, **`confirmation.customer.phone`** (multi-store order; the single order's address is its `address` section) |
| `orders` | `orders.products_tab`, `orders.business_tab`, `orders.business_name`, `orders.order_number`, `orders.date`, `orders.order_status`, `orders.total`, `orders.favorite`, `orders.reorder_button`, `orders.review_order_button`, `orders.business_logo` (**default `false`**: commented out today), **`orders.gift_cards_tab`** |
| `review` | **`review.quick_comments`**, **`review.comment`** |
| `messages` | `messages.quick_messages`, `messages.image_upload`, **`messages.order_console`** (the first, “Order placed” message), **`messages.time`** (**default `false`**) |
| `auth` | `auth.social` (all providers; the provider is config), `auth.signup_link`, `auth.forgot_password_link`, **`auth.login_link`** (sign-up’s link to log in); `signup.promotions_optin` |
| `menu` (profile rows) | `menu.favorites`, `menu.cards`, `menu.addresses`, `menu.wallet`, `menu.loyalty_points`, `menu.gift_cards`, `menu.messages`, `menu.language`, `menu.notifications`, `menu.help`, `menu.sessions` — `disabled_if` rules: hiding `menu.notifications` also hides the route (today the screen goes blank, see P3) |
| `wallets` | `wallets.loyalty_level` |
| `profile` | **`profile.password`** |
| `address` | `address.map`, `address.icons` (tags), `address.internal_number`, `address.zipcode`, `address.notes` (each ignored when the server marks the field required), **`address.tag_filter`**, **`address.add_button`**, **`address.gps_button`** |
| `home` | `home.hero.title`, **`home.language_selector`** |
| `connection_status` | `connection_status` |

Not visibility keys (config or behaviour, kept out of the theme): guest checkout, reCAPTCHA,
terms row, login methods, reservation/preorder availability, gift card tab, professionals,
business contact (`hide_business_contact_customer_app`), cookie consent, Powered-by plan
flag where it is a plan feature.

**Must not come back:** v1 `business_view…cart…discount.hidden` (hid discount rows while the
total still counted them).

## 3. Images

Painted size in pt; ideal upload = largest painted size × 3 (phones). `''` falls back to
the bundled `require` in one module. Native splash and app icon are not themable at run time.

| Key (web name) | Today | Painted box (pt, from code) | Hints |
|---|---|---|---|
| `logotype` | `logos.logotype` | NavBar height 25, contain; ProjectForm | `[600,150]`, alpha, png/svg/webp, ≤ 200 kB |
| `home_hero` | `general.homeHero` (12.1 MB today) | full screen, cover | `[1290,2796]` 9:19.5, safe 3:4, ≤ 800 kB |
| **`onboarding.slide_1`…`slide_6`** | `tutorials.slide1–6` (18 MB together) | full screen | as `home_hero` |
| `empty.not_found` | `general.notFound` | empty states, contain | `[600,600]`, alpha |
| `empty.no_internet` | `general.noNetwork` | contain | same |
| `empty.sessions` | (today shows `notFound`) | contain | same |
| `placeholder.business_header`, `placeholder.business_logo` | header/logo fallbacks | storefront hero, card logo | `[1200,600]` / `[300,300]` |
| `placeholder.product` | `dummies.product` | product card/page | `[600,600]` |
| `placeholder.gift_card` | `general.giftCardImage` (+ 5/10/25/50/100) | gift card | `[900,560]` |
| `order_types.delivery`, `pickup`, `eat_in`, `curbside`, `drive_thru`, `catering_delivery`, `catering_pickup`, `reservation` | the type's vector icon | OrderTypes card, above the name (`''`: the icon stays) | `[360,240]`, alpha |
| **`header_badge`** | — | home screen's logo row, a control's height (`size.md`), contain | `[192,192]`, alpha |
| **`icons.cart`** | the basket glyph | the header's cart button (`header.cart_icon_size`), contain | `[144,144]`, alpha |
| **`icons.cart_bar`** | — | before the View Order button of a store, a control's height (`size.lg`), with the cart's count | `[240,240]`, alpha |
| **`icons.floating_button`** | a globe glyph | the floating link button (`floating_button.base.url`), over the support bubble's place, cover | `[144,144]` |
| **`icons.tab_home`**, **`tab_offers`**, **`tab_browse`**, **`tab_orders`**, **`tab_profile`** | the tab's glyph | the tab bar (`bottom_nav.icon_size`), contain; the same picture selected or not | `[96,96]`, alpha |
| **`icons.business_time`**, **`icons.business_fee`**, **`icons.business_distance`** | — | the store's details in columns (`business_header.details_layout`), `size.sm`, contain | `[144,144]`, alpha |
| **`icons.cart_page`** | — | the cart page, under its products, a square of `cart.base.illustration_size`, contain, with the cart's count | `[480,480]`, alpha |
| **`icons.order_progress`** | a chevron | the home screen's order card, at the end of its first row, a control's height (`size.xl`), contain | `[480,480]`, alpha |
| **`icons.wallet_cash`**, **`icons.wallet_points`** | the coins and the heart glyphs | the icon of the cash and of the points wallet in the checkout's wallets, at the wallet icon's size (`wallet_balance.base.icon_size`), contain | `[240,240]`, alpha |
| **`categories.all`** | `categories.all` | listing category tile | `[200,200]`, alpha |
| `map.driver`, `map.store`, `map.customer` | `general.driverPng`, `marker`, `mapPin` (missing) | map markers | `[120,120]`, alpha, square, anchor bottom center |

Not theme images (stay bundled, icons of the app): payment marks (Apple/Google Pay — brand),
`wallet_*`, `delivery_fee`, `help`, `ranking`, `neighborhood`, the heart Lottie, the 99 PNG
icons, the 14 `order.status*` PNGs (never painted today: deleted or kept for D4's badge —
decided in phase 7), splash per density (dead page).

## 4. What the served v1 theme drives today and stops applying (no v1 map)

~60 hidden flags (listing, card, business, checkout, orders, confirmation, profile/bar_menu,
address), the `app_design` switch, the header logo, home hero, splash and offline images, and
the input text color. Each one has a v2 key above except: the splash images (dead page), the
input text color (now `input` component), `near_business` (dead), `business_view…discount`
(must not return). Until a merchant edits a v2 theme, every key shows its default (visible).

## 5. Decisions for the owner

| # | Topic | Options | Recommendation |
|---|---|---|---|
| P1 | Storefront search and nearby businesses (commented out today) | (a) delete the dead code · (b) restore as sections `search` / `near_business` | (a): out of scope of theming; restore later as a feature |
| P2 | Profile `app_info` (websocket status, version) | (a) section hideable, default visible · (b) default hidden | (a) |
| P3 | Notifications screen blank when its two keys are hidden | (a) hide the profile row and route when both are hidden · (b) show an empty state | (a) |
| P4 | `orders.business_logo` (code commented out) | (a) key with default `false`, restore the code · (b) drop | (a): the web has it |

## 6. Not verified

- Painted image boxes come from code, not from a device; the image hints are estimates.
- Which pieces real merchants hide today (served themes not read from the API).
- Whether the checkout's `@main`/`@side` order can be kept without visual gaps in one column
  (the app renders one column; to check on device in phase 9).

## 7. Options that are behaviour, kept in the theme

Each one is off by default and changes nothing until a theme sets it.

| Key | What it does |
|---|---|
| `business_types.base.on_select` = `page` | A business type opens the BusinessTypeListing screen instead of filtering the home screen's list |
| `banner.base.listing_after` (0–10) | The banners of the position `app_home_page` show inside the list of stores, after that many stores (0: none) |
| `checkout.base.cash_suggestions` | The exact total and the next round amounts as chips over the cash field (`cashSuggestions`, `src/ui/src/utils/cashSuggestions.ts`) |
| `floating_button.base.url` | A floating button that opens that address; with the support bubble, the bubble sits above it |

## 8. Options of look and layout, on their component

Each default is the look the app has without the option.

| Key | What it does |
|---|---|
| `header.base.back_icon` (`arrow` · `chevron`) | The glyph of the back button of every header (`BackButton`). Default `arrow` |
| `header.base.back_aligned` | `true`: a back button with a background (`modal.slots.close.appearance` not `ghost`) lines its box up with the page margin, with no negative margin. A `ghost` back button keeps the negative margin whatever this says, so its arrow stays on the margin. Default `false`: the button is pulled into the margin, as in the themes saved before |
| `header.base.context_style` (`field` · `button`) | How the order type and the moment are drawn wherever they show (`OrderContextPill`): `field`, the input box of the `moment` slot with its chevron; `button`, a button of `header.slots.context`. Default `field` |
| `header.slots.context` | The button of `context_style` = `button`: its size, appearance and color (solid primary by default). Not read while the style is `field` |
| `header.base.title_align` (`inherit` · `center` · `center_business`) | The alignment of the title of the head and of the navigation bar. `inherit`, as every title of the app (`section_header.base.align`); `center`, always centered; `center_business`, centered only on the store's head (`BusinessProductsListing`) and the product's bar (`ProductForm`), as every other title. Default `inherit` |
| `header.base.sheet_radius` (0–40) | Only on the home screen's head (a head without a back button, outside the cart page), and only with `header.base.fill_listing`: the page starts over the bar's background with its top corners rounded by this much, in `color.background`. Default 0: a straight edge |
| `header.scope.tabs.variants.pill` (`background`, `border`, `radius`, `shadow`, `inset`, `gap`, `joined`, `tab_radius`, `tab_border`, `active_background`, `active`, `inactive`) | The pill tabs inside the head's group: the order type switch (`OrderTypeSwitch`, shown by `business.order_type_switch` and `checkout.order_type_switch`). With `header.base.order_type_own_look` off (default) the switch ignores this scope and looks like the project's tabs (`components.tabs`, its colours included); with it on it uses these values, whose defaults are the ones of `tabs.variants.pill`; `joined` needs `gap` 0 |
| `header.base.order_type_own_look` | `true`: the order type switch uses the `header.scope.tabs` look. Default `false`: it follows the project's tabs |
| `business_card.base.ribbon_position` (`image` · `name`) | The ribbon of a store's card: over the cover, or under the name. Default `image`. The compact card and a card without its cover keep it over the name |
| `business_types.base.grid_columns` (2–4) | With `business_types.base.layout` = `grid`: the home screen draws the business types as a grid of tiles that wraps, this many per row (3 by default), each image as wide as its column. Where the types show elsewhere, `grid` is the row of tiles |
| `business_header.base.details_layout` (`row` · `columns`) | The store's details (delivery fee, time, distance): `row`, each value over its name in one row; `columns`, one column per detail, its picture (`icons.business_fee`, `business_time`, `business_distance`) and name over the value. Default `row` |
| `business_header.base.details_order` (`fee_first` · `time_first`) | The order of those details: fee, time, distance, or the time first. Default `fee_first`. The checkout's box (`checkout.business.details`) follows both options |
| `business_header.base.details_label_color` | The color of the details' names in the `columns` layout; the row's names keep the text color. Default `color.text` |
| `product_modal.base.close_icon` (`back` · `close`) | The glyph of the product page's close button: an arrow or a cross. Default `back` |
| `product_modal.base.close_position` (`start` · `end`) | The side of that button; at the end, the favorite button over the photo moves to the start. Default `start` |
| `product_modal.base.favorite_position` (`image` · `title`) | The favorite button of the product page: over the photo, across from the close button, or beside the product's name. Default `image` |
| `stepper.base.background` | The fill of the quantity control's box (product page, cart line). Default transparent: none |
| `stepper.base.compact` | Narrow buttons (icon plus the extra space of `space.xs` on each side) and no extra space around the number, in the product page's quantity and in a cart line. Default `false`: the control size |
| `business_header.base.cover_full_width` | The store's cover with no side margin, no radius and no space between it and the head (the head's bottom margin is dropped). Default `false` |
| `business_header.base.collapse_empty_actions` | `true`: no row of actions (and no space) when the store has no reviews, information or booking to show. Default `false`: the row is always drawn, as before |
| `business_card.base.meta_order` (`time_first` · `distance_first`) | The order of the time, the fee and the distance on the store card. Default `time_first` |
| `business_card.base.meta_images` | The pictures `icons.business_time`, `icons.business_fee` and `icons.business_distance` instead of the icons, at `meta_icon_size`; an icon stays where the theme has no picture. Default `false` |
| `product_modal.base.comment_border` | The border of the product's comment field. A width of 0 (the default) leaves the border of the other fields |
| `product_modal.base.image_radius` | The radius of the top corners of the product page's main photo (0 to 40). Default `0` |
| `product_modal.base.image_background` | The color behind the product page's main photo, seen at its rounded corners. Default `transparent` |
| `stepper.base.icon_color` | The ink of the minus and plus of the product page's quantity. Default empty (`Automatic`): the primary color, as before |
| `cart.base.line_image_position` (`start` · `end`) | The side of a product's photo on a cart line: before the name, or after it with the quantity under the photo. Default `start` |
| `cart.base.line_price_position` (`top` · `bottom`) | The place of the price (and the tags) on a cart line: under the name, or after the description at the bottom of the line. Default `top` |
| `cart.slots.quantity` | The size of a cart line's quantity buttons and of its trash button (`md` by default); their look is the `stepper`'s |
| `cart.slots.remove` | The trash button of a cart line: its color and appearance (danger; without an appearance, the stepper's `button_appearance`). It shows at one unit, or always with `cart.products.remove_button` |
| `cart.slots.clear_page` | "Clear cart" on the cart page (`cart.clear`): without an appearance (the default), a text link; with one, a button of that size, appearance and color |
| `cart.base.illustration_size` (80–320) | The side of the cart page's picture (`icons.cart_page`). Default 160; without the image nothing is drawn |
| `cart.base.bar_background` | The fill of the cart page's bottom bar. Default transparent: the same as the bottom action bar |
| `order_types_page.base.bar_background` | The fill of the bottom bar of the delivery type page. Default transparent: the same as the bottom action bar |
| `order_types_page.slots.button` | The size, color and style of the delivery type page's Continue button. Default `appearance` empty: the one of `bottom_bar.slots.button`, as before |
| `cart.base.context_position` (`header` · `page`) | Where the cart page shows the order type and the moment: inside the head, or under it on the page. It differs only with `header.base.fill_listing`, which paints the head's band. Default `header` |
| `checkout.base.business_name_color` | The color of the store's name in the checkout's store block. Default empty (`Automatic`): the checkout's store name text style, as before |
| `checkout.base.total_align` (`start` · `center`) | Where the name and the amount of the total sit in the checkout's bottom bar. Default `start` |
| `checkout.base.business_logo_shape` (`card` · `own`) | The rounding of the store logo in the checkout: `card` (default) takes `business_card.base.radius`; `own` takes `checkout.base.business_logo_radius` |
| `checkout.base.total_background` | The fill of the total beside the place order button, and of the shape they share with `bottom_bar.base.joined`. Default transparent: none |
| `checkout.slots.edit` | The edit buttons of the checkout's blocks (customer, address, order summary), one look for the three (`EditButton`). A ghost neutral icon button by default |
| `order_details.base.progress_layout` (`bar` · `segments`) | An order's progress on its page and on the home screen's order card: one bar, or four segments with their names (confirmed, preparing, on the way or ready for pickup, delivered or completed). Default `bar`. With `segments`, `progress.base.border` outlines the row of segments as one pill; without a border nothing changes |
| `order_card.base.summary_position` (`bottom` · `top`) | The status and the estimate on the home screen's order card: `bottom`, on one row under the progress, the status first; `top`, over the progress, the estimate and then the status. Default `bottom` |
| `bottom_bar.slots.secondary` | The second button of a bottom bar (the cart page's "Add more products"): its size, appearance and color. Outline primary by default |
| `bottom_bar.base.joined` | With a second button, a total or a picture beside the main button, they share one rounded shape (the button's radius) with no gap between them. Default off |
| `bottom_bar.base.joined_background` | The fill of that shape when nothing else fills it: a screen's own fill comes first (`checkout.base.total_background`), then the second button's background, then this one. Default transparent: none |
| `floating_button.base.background` | The fill of the floating link button, behind its picture or glyph. Default `color.primary` |
| `floating_button.base.placement` (`all` · `home`) | Where the floating link button shows: on every screen that shows the support bubble, or on the home screen only. Default `all` |
