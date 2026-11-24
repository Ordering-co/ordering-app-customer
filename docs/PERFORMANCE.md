# Performance

The app's performance review (2026-11-05): what was fixed, and what is left, by where the fix lives.

## Measured

- **Production Android bundle**: 7.9 MB of minified JS (before Hermes bytecode). The biggest packages: react-native (2.2 MB of source), the app's `src/ui` (1.7 MB), the submodule (1.1 MB), Sentry (~2.2 MB together, including `@sentry/replay` and `@sentry/browser`, web session replay the app does not use), two phone-number libraries (`google-libphonenumber` 572 KB from `react-native-phone-number-input`, `libphonenumber-js` 434 KB from the submodule; since then the phone field validates with `libphonenumber-js` and `google-libphonenumber` is gone), `moment` (179 KB, alongside `dayjs`).
- **Bundled images**: 30 MB, of which the welcome hero (1760×3824 PNG, 12.1 MB) and the six tutorial slides (18 MB) were 29.8 MB. Opaque photos as PNG, decoded at 27 MB (hero) and 8.5 MB (each slide) of memory.

## Fixed

| Area | Before | Now |
|---|---|---|
| Images | Hero and slides as PNG (29.8 MB) | JPEG at quality 82, the hero 1288×2800 (the widest phone at 3x): 3.5 MB |
| Session | Re-read storage every 2 s (4 AsyncStorage reads, a JSON parse): the web's sync between tabs | Every 30 s (`sessionCheckInterval`, `TemplateApp.tsx`) |
| Home list | The 2-minute refresh re-armed by every list change, also behind the business or the checkout | Only while Home is in view |
| Home list | A GPS fix (`enableHighAccuracy`) on every order update (the effect depended on an object the order context rebuilds) | Only when the address's coordinates change |
| Home list | Every card rendered again on each page, refresh or order update; the memo compared two `JSON.stringify` of the business | Memoized cells with stable handlers; the business compared by identity (the list and the controller update it immutably) |
| Favorites | `setFavoriteIds` with a new array on every page (every card's effect ran) | Only when the ids change (Home and Top business) |
| Menu | Each card copied the products of every cart (O(cart²)), and the parent counted the cart once per card | One pass per card; the parent counts the cart once (`cartQuantities`) |
| Menu | The product cards kept the first click handler (their memo compares the product), so quick add saw an old cart | A stable handler that runs the latest one |
| Menu | The screen mounted every product (`ScrollView` + `map`): 298 cards for a 298-product business, 2,519 for one category of a large one (30 s of blank screen on the Android emulator) | A virtualized list of rows (`buildMenuRows`, `BusinessProductsListing`): 16 cards at open, about 45 mounted while scrolling |
| Menu | A business of more than 500 products fetched each category whole (`isFetchAllProducts`: 2,519 products, 3.8 MB in one request) | Pages of 20 (`productsPageSize`, about 31 KB each), the next one from `onEndReached`, one at a time, one notice per page |
| Menu | Per scroll event: three `setState`, a loop over every category's layout, and a toast for each event past the paging threshold | Comparisons against refs; a state is set only when a threshold is crossed (the title, the stuck bar); the category on screen comes from `onViewableItemsChanged` |
| Menu | Every mounted card rendered again each time a toast showed or hid (`useToast`) | The cards read the toast's actions (`useToastActions`) |
| Maps | The camera's animated fit every second (order tracking, address form, business info) | When the markers, zones or map change |
| Theme | The served theme set and cached on every launch even when equal to the cached one: the whole theme rebuilt during the first load | Kept when equal |
| Tabs | `TabBarIcon` declared inside the navigator: a new component type on every render, the icons remounted | Declared once |
| Root navigator | A storage read and `setCountryCode` on every order update | When the order loads or the address's country changes |
| OneSignal | A subscription observer added on every setup (login, logout, consent), each with an old state | One set of listeners per mount of the root navigator, removed when it unmounts; a setup that changes nothing does nothing |
| Reviews | `Keyboard.removeAllListeners('keyboardDidShow')` dropped the listeners of the support bubble, sheets and forms | Each screen removes only its own |
| Navigation params | Upselling, MessageView and AddressForm got SDK models (with the API client) or functions | Plain data (`plainParams`, `src/navigators/appNavigation.ts`) |
| Served images | The SDK's `optimizeImage` returns the URL unchanged: headers, logos and products at their upload size (logos of 2134 px for a 60-point box) | `imageUrl(url, { width, height })` (`src/utils/imageUrl.ts`): the shown size in points × density, rounded up to 50 px, WebP, `c_limit`; an existing transformation is replaced (the CDN answers a chained one with 403). Real URLs at 2.625x: logos −94%, products −71%, covers −49% |

## Left

### Submodule (`ordering-components`, PR #409, merged as `8754718`)

No visible behaviour changes (`f9d6ae7`):

- **Toasts**: the actions in their own stable context (`useToastActions`); Session and Order read only them, so a toast showing or hiding no longer renders them again (a cart socket event shows one: three full renders before).
- **`t`** changes only with the dictionary; the language actions keep one identity; the value is memoized.
- **Cart socket handlers** subscribe once per socket.
- **`NativeStrategy`**: one for the provider's life.
- **`BusinessController`**: no state update when the business or its favorite mark is already the same.

New, opt-in (`c4fa34b`): **`useOrderState()`** (the order without the deep copy, a new identity only when it changes; read only) and **`useOrderActions()`** (stable). `useOrder()` is unchanged. The busiest screens use them: bottom tabs, home and root navigators, the Home list and its cards, the menu and its product cards. The order's actions never change the carts in place (a new object each time), so a memo or effect on `useOrderState().carts` sees every change.

Left as it is, on purpose:

1. **`useOrder()` still deep-copies on every render**: its 61 consumers keep that behaviour; they move to the new hooks one by one, each checked not to modify what it reads.
2. **`optimizeImage`** stays a no-op (the web uses it too); the app uses its own `imageUrl`.
3. **`ipapi.co` on the startup path** (`ConfigContext`, no timeout, twice on a country change): improving it changes where the country comes from (the IP or the server's `default_country_code`), a product decision.

### App refactors (worth their own change and testing)

1. **The tabs re-render on every order update** (`BottomNavigator`: inline `children` callbacks with hooks inside, and `useOrder()` for one field): stable screen components.
2. **The Home header** (`FlatListBusinessListHeader`: Top business, banners, order progress) renders again with the list.
3. **The header's collapse animates layout on the JS thread** (`HeaderContent`, `useNativeDriver: false`).
4. **Bundle**: one phone-number library instead of two; `dayjs` instead of `moment`; Sentry without its web replay.
5. **A paged menu filters subcategories on the phone**: with a subcategory chosen in a business of more than 500 products, the list asks for page after page (one at a time) until its rows fill the screen. The filter belongs in the request (`BusinessAndProductList`, submodule).
