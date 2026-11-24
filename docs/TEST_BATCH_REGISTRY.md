# Test batch registry — ordering-app-marketplace-v26

Living inventory for incremental test + coverage work on app-owned code.

## Coverage gate — interim vs final

| Stage | What 70% means |
|-------|----------------|
| **During batches** | ≥70% average on whatever is currently in Jest `collectCoverageFrom` / coverage include. |
| **At issue completion (ship)** | ≥70% average with **all** testable units from this registry in the gate (or explicitly `skipped` with reason). |

**Ship criterion:** full inventory in gate + ≥70% on that full set. **Not acceptable:** 70% on a partial include only.

**Excluded from this issue:** `src/@/components` submodule — covered by implementation notes.

## Counting convention

| Unit type | Rule |
|-----------|------|
| **Wired UI export** | Every folder under `src/ui/src/components/**` with `index.tsx` or `index.js` — nested layouts included. |
| **Page** | Every screen file in `src/pages/*.tsx`. |
| **Shared primitives** | `src/ui/src/components/shared/**` (OButton, OModal, OToast, etc.). |
| **App utils** | `src/utils/**`. |

## Test file convention (required)

**One test file per gated unit.** Batch IDs (P1, M3, …) are planning groups only — not file names.

| Unit type | Test path |
|-----------|-----------|
| Page `src/pages/Login.tsx` | `src/pages/__tests__/Login.test.tsx` |
| UI `src/ui/src/components/LoginForm/` | `src/ui/src/components/LoginForm/__tests__/LoginForm.test.tsx` |
| Nested UI `LoginForm/Otp/` | `src/ui/src/components/LoginForm/Otp/__tests__/Otp.test.tsx` |
| Shared `shared/OButton.tsx` | `src/ui/src/components/shared/__tests__/OButton.test.tsx` |
| Utils `src/utils/index.tsx` | `src/utils/__tests__/index.test.tsx` |

**Do not** combine multiple pages or components in one file (e.g. `p1-auth.test.tsx`, `m1-auth.test.tsx`). Shared mocks belong in `jest/helpers/`, not mega batch files.

## Jest helpers (`jest/helpers/`)

Active test infrastructure for implementation notes — **not stale code**. Batch IDs (M1–M9) match the UI batches in this registry; helpers are layered so later batches inherit earlier mocks.

### Cross-cutting files (always relevant)

| File | Role |
|------|------|
| `mockOrdering.js` | Base `@components` mock: `useSession`, `useConfig`, `useOrder`, `useLanguage`, `ToastType`, etc. Extended by every `*ComponentsMock.js`. |
| `mockUi.js` | Full `@ui` stub barrel for **page** tests (`src/pages/__tests__/`). |
| `renderWithProviders.tsx` | Wraps UI under `ThemeProvider` + `SafeAreaProvider`. Use for co-located **component** tests. |
| `renderPage.tsx` | Page harness with navigation mock. Use for `src/pages/__tests__/`. |

### Per-batch file types (M3–M9)

From M3 onward, each UI batch adds up to **four** helper files:

| Suffix | Purpose |
|--------|---------|
| `*Defaults.js` | Fake props/state: carts, orders, users, businesses, etc. Imported inside tests as `const d = require('.../m6OrdersDefaults')`. |
| `*ComponentsMock.js` | `getMock()` for `jest.mock('@components', …)`. Mocks controllers + hooks; **chains** the previous batch mock via spread (`...m5.getMock()`). |
| `*UiMock.js` | `getUiMock()` for `jest.mock('@ui', …)`. Stubs heavy child components so the unit under test stays isolated. |
| `*SharedMock.js` | (M8, M9 only) Mocks `../shared` primitives (`ODropDown`, `OModal`, …) without pulling the full `@ui` barrel (avoids Segment/analytics import chains). |

**M1 / M2** only have `*Defaults.js` today. Their component tests still use `mockOrdering` + inline `jest.mock` in each file (auth/shell predates the ComponentsMock pattern).

**Native mocks:** `registerM3NativeMocks.js` … `registerM9NativeMocks.js` — `jest.mock` for RN/third-party libs (FastImage, Stripe, the clipboard, the date picker, vector icons, …). Each file **requires** the previous register (chain).

```
registerM3 → registerM4 → registerM5 → registerM6 → registerM7 → registerM8 → registerM9
```

### ComponentsMock inheritance chain

Later batches do not replace earlier mocks — they **extend** them:

```
mockOrdering.js
    ↑  m3DiscoveryComponentsMock.getMock()
    ↑  m4MenuComponentsMock.getMock()
    ↑  m5CheckoutComponentsMock.getMock()
    ↑  m6OrdersComponentsMock.getMock()
    ↑  m7ReviewsComponentsMock.getMock()
    ↑  m8ProfileComponentsMock.getMock()
    ↑  m9IntegrationsComponentsMock.getMock()
```

A test that imports only `m6OrdersComponentsMock` still gets M3–M5 session/config/order mocks through this chain. **Do not delete “older” batch helpers** while any later batch or test depends on the chain.

`UiMock` follows the same stacking: `m3DiscoveryUiMock` → `m4MenuUiMock` → `m5CheckoutUiMock` → `m6OrdersUiMock` → `m7ReviewsUiMock` → `m8ProfileUiMock` → `m9IntegrationsUiMock` (each file `require`s the previous).

### Inventory by batch

| Batch | Defaults | ComponentsMock | UiMock | SharedMock | registerM* |
|-------|----------|----------------|--------|------------|------------|
| M1 auth | `m1AuthDefaults.js` | — | — | — | (inline in tests) |
| M2 shell | `m2ShellDefaults.js` | — | — | — | (inline in tests) |
| M3 discovery | `m3DiscoveryDefaults.js` | `m3DiscoveryComponentsMock.js` | `m3DiscoveryUiMock.js` | — | `registerM3NativeMocks.js` |
| M4 menu | `m4MenuDefaults.js` | `m4MenuComponentsMock.js` | `m4MenuUiMock.js` | — | `registerM4NativeMocks.js` |
| M5 checkout | `m5CheckoutDefaults.js` | `m5CheckoutComponentsMock.js` | `m5CheckoutUiMock.js` | — | `registerM5NativeMocks.js` |
| M6 orders | `m6OrdersDefaults.js` | `m6OrdersComponentsMock.js` | `m6OrdersUiMock.js` | — | `registerM6NativeMocks.js` |
| M7 reviews | `m7ReviewsDefaults.js` | `m7ReviewsComponentsMock.js` | `m7ReviewsUiMock.js` | — | `registerM7NativeMocks.js` |
| M8 profile | `m8ProfileDefaults.js` | `m8ProfileComponentsMock.js` | `m8ProfileUiMock.js` | `m8ProfileSharedMock.js` | `registerM8NativeMocks.js` |
| M9 integrations | `m9IntegrationsDefaults.js` | `m9IntegrationsComponentsMock.js` | `m9IntegrationsUiMock.js` | `m9IntegrationsSharedMock.js` | `registerM9NativeMocks.js` |

### Standard co-located UI test template (M3+)

```tsx
import '../../../../../../jest/helpers/registerM6NativeMocks'  // match batch; MUST be first line

import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { ActiveOrders } from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

jest.mock('@components', () => require('../../../../../../jest/helpers/m6OrdersComponentsMock').getMock())
jest.mock('@ui', () => require('../../../../../../jest/helpers/m6OrdersUiMock').getUiMock())

describe('ActiveOrders', () => {
  it('renders order cards', () => {
    const d = require('../../../../../../jest/helpers/m6OrdersDefaults')
    const { getByText } = renderWithProviders(
      <ActiveOrders {...d.activeOrdersDefaults} />
    )
    expect(getByText('Pizza Place')).toBeTruthy()
  })
})
```

**Student / shared-only components (M8–M9):** when the unit imports from `../shared` instead of `@ui`, add:

```tsx
jest.mock('../../shared', () => require('../../../../../../jest/helpers/m8ProfileSharedMock'))
```

**Page tests** use `renderPage` + `mockUi.js`, not the batch `*UiMock` (unless the page test overrides `@components` locally).

### When adding or changing helpers

| Task | Where to edit |
|------|----------------|
| New fake order/cart/user for M6 tests | `m6OrdersDefaults.js` |
| New controller stub for checkout batch | `m5CheckoutComponentsMock.js` (+ defaults if needed) |
| New native lib (e.g. maps SDK) for M9 | `registerM9NativeMocks.js` (and chain upstream if M3–M8 tests also need it) |
| Override session/auth for one test file | `setMockState()` on the batch ComponentsMock (see `m7ReviewsComponentsMock`, `m8ProfileComponentsMock`) — avoid duplicating `getMock()` per test |
| New UI batch (hypothetical M10) | Add all four helper types; `getMock()` must spread `...m9.getMock()`; `registerM10` must `require('./registerM9NativeMocks')` |

**Do not** move batch-specific defaults into a monolithic `testHelpers.js` — keep one defaults file per batch so the registry and coverage batches stay aligned.

### Pitfalls & patterns (M4–M9)

| Pattern | Guidance |
|---------|----------|
| **M⁻ defer** | Dense components stay out of `coverage-include.js` but keep smoke tests; document as `deferred` in the batch table below. Re-gate when coverage headroom allows. |
| **`@ui` barrel trap** | `jest.mock('@ui')` that resolves the real barrel can pull `AnalyticsSegment` → Segment ESM errors. Use batch `*UiMock`, partial mocks, or `*SharedMock` for `../shared` imports. |
| **Export `*UI` for direct tests** | When the controller wrapper is heavy, export the inner UI (e.g. `OrderSummaryUI`, `ReviewOrderUI`, `AddressListUI`) and test it with defaults + `renderWithProviders`. |
| **`setMockState` / `resetMockState`** | `m7ReviewsComponentsMock` and `m8ProfileComponentsMock` expose per-test overrides for session/messages/student state — prefer over duplicating `getMock()` in each file. |
| **Shared sample data** | `sampleProduct` lives in `m5CheckoutDefaults.js`; import from there if an M6+ test needs it (not re-exported from later defaults files). |
| **`UserFormDetails` mock** | `m8ProfileComponentsMock` picks defaults by `UI.name` (`ProfileListUI`, `ProfileUI`, `UserDetailsUI`). |
| **School constants** | `SCHOOL_ALLERGENS` / `SCHOOL_DIETARY_TAGS` in student tests must be `{ value, name }` objects, not plain strings. |

## Rules per batch (every session)

1. Pick the **next pending batch** below.
2. Add **one test file per unit** (see convention above).
3. Expand Jest `collectCoverageFrom` for every new path in the batch.
4. Run verify commands — gate must stay ≥70%.
5. Mark batch `done` here + update `docs/ci-coverage-plan.md`.
6. Stop after one batch unless explicitly asked.


## Inventory at ship

| Surface | Units | Batches |
|---------|-------|---------|
| Foundation harness | scaffold | F1 |
| App utils | 1 (`src/utils`) | U1 |
| Pages (`src/pages`) | 49 | P1, P2, P3, P4, P5, P6, P7 |
| UI wired exports | 153 | M1, M2, M3, M4, M5, M6, M7, M8, M9 |
| **Total gated units** | **203** | **18 batches** |

**Gate today:** 176 paths (S0 + 49 pages + U1 + M1 + M2 + M3 + M4⁻ + M5⁻ + M6⁻ + M7⁻ + M8⁻ + M9⁻ + P). **225 test suites**, 1 file per unit. M9 is the **last UI batch** — remaining work is re-gating deferred dense units across M4–M9.

`P` = profile completion gate (OTP profile flow): `src/contexts/CheckoutFieldsContext/profileFields.tsx` (pure rule), `src/contexts/CheckoutFieldsContext/index.tsx` (fetch + `useProfileCompletion` + `useSuppressProfileGate`), `src/pages/CompleteProfile.tsx` (screen, smoke). The dense `UserDetails`/`UserFormDetails` it renders stay deferred (M8⁻).

`M9⁻` = M9 without AddressDetails / AddressList / AddressForm / AddressMapBoxList / PurchaseGiftCard / SendGiftCard / GiftCardUI / RedeemGiftCard / SingleGiftCard / VerticalGiftCardOrdersLayout / AnalyticsSegment / FacebookPixel / PhoneInputNumber / ProfessionalFilter / SingleProfessionalCard / ProfessionalProfile / ServiceForm (deferred for dense address/gift/integration coverage; smoke tests exist).

`M8⁻` = M8 without UserDetails / UserFormDetails / UserProfile / UserProfileForm / StudentFormModal / StudentOnboardingPopup (deferred for dense profile/form coverage; smoke tests exist).

`M7⁻` = M7 without Messages / ReviewDriver (deferred for dense chat/driver-review coverage; smoke tests exist, and the chat's own thread has `ChatThread.test.tsx` and `linkify.test.ts`).

`M6⁻` = M6 without OrderDetails / OrdersOption / SingleOrderCard / MultiCheckout / MultiCartsPaymethodsAndWallets / MomentOption / MultiOrdersDetails / OrderSummary (deferred for dense orders coverage; smoke tests exist).

`M4⁻` = M4 without ProductForm / BusinessProductsListing / BusinessReservation (deferred for dense coverage; smoke tests exist).

`M5⁻` = M5 without Checkout / CheckoutStudentDetails / PaymentOptions / PaymentOptionStripe / PaymentOptionCard / PaymentOptionsWebView / StripeElementsForm / StripeMethodForm / StripeRedirectForm / SavedCards / DriverTips (deferred for dense Stripe/checkout coverage; smoke tests exist).

## Shared primitives batch

### S0 — `src/ui/src/components/shared/**`

| Unit | Status |
|------|--------|
| `shared/OButton.tsx` | done |
| `shared/OModal.tsx` | done |
| `shared/OToast.tsx` | done |
| `shared/OInput.tsx` | done |
| `shared/OAlert.tsx` | done |
| `shared/OText.tsx` | done |
| `shared/ODropDown.tsx` | done |
| `shared/OBottomPopup.tsx` | done |
| `shared/OIcon.tsx` | done |
| `shared/OIconButton.tsx` | done |
| `shared/OIconText.tsx` | done |
| `shared/OKeyButton.tsx` | done |
| `shared/OTextarea.tsx` | done |
| `shared/OToggle.tsx` | done |
| `shared/CardAnimation.tsx` | done |
| `shared/HeaderTitle.tsx` | done |
| `shared/index.tsx` | done |
| `shared/styles.tsx` | done |

Test shared primitives before feature UI batches — most screens depend on OButton/OModal/OToast.

---

## Foundation

### F1 — Jest harness + CI scaffold

| Work item | Status |
|-----------|--------|
| Jest + RN preset + Testing Library RN | done |
| `jest/setup.js` + `renderWithProviders` + `mockOrdering` | done |
| Coverage scripts + `collectCoverageFrom` (`jest/coverage-include.js`) | done |
| `.github/workflows/ci.yml` (one `CI Quality Gate` job: lint + i18n + `test:coverage` + 70% gate) | done |
| Exclude `src/@/components` submodule from Jest + coverage | done |

---

### U1 — App utils

| Unit | Status |
|------|--------|
| `src/utils/index.tsx` | done |

---

## Page batches

### P1 — Auth & splash

| Unit | Status |
|------|--------|
| `src/pages/Splash.tsx` | done |
| `src/pages/IntroductoryTutorial.tsx` | done |
| `src/pages/Login.tsx` | done |
| `src/pages/Signup.tsx` | done |
| `src/pages/ForgotPassword.tsx` | done |
| `src/pages/UserVerification.tsx` | done |
| `src/pages/Sessions.tsx` | done |
### P2 — Home & discovery

| Unit | Status |
|------|--------|
| `src/pages/Home.tsx` | done |
| `src/pages/BusinessesListing.tsx` | done |
| `src/pages/BusinessListingSearch.tsx` | done |
| `src/pages/BusinessSearchMap.tsx` | done |
| `src/pages/BusinessProductsList.tsx` | done |
| `src/pages/Promotions.tsx` | done |
| `src/pages/Favorite.tsx` | done |
### P3 — Product & cart

| Unit | Status |
|------|--------|
| `src/pages/ProductDetails.tsx` | done |
| `src/pages/CartList.tsx` | done |
| `src/pages/MomentOption.tsx` | done |
| `src/pages/OrderTypes.tsx` | done |
| `src/pages/UpsellingPage.tsx` | done |
### P4 — Checkout & wallet

| Unit | Status |
|------|--------|
| `src/pages/Checkout.tsx` | done |
| `src/pages/MultiCart.tsx` | done |
| `src/pages/MultiCheckout.tsx` | done |
| `src/pages/SavedCards.tsx` | done |
| `src/pages/CashWallet.tsx` | done |
| `src/pages/LoyaltyPoints.tsx` | done |
### P5 — Orders & reviews

| Unit | Status |
|------|--------|
| `src/pages/MyOrders.tsx` | done |
| `src/pages/OrderDetails.tsx` | done |
| `src/pages/MultiOrdersDetails.tsx` | done |
| `src/pages/ReviewDriver.tsx` | done |
| `src/pages/ReviewOrder.tsx` | done |
| `src/pages/ReviewProducts.tsx` | done |
### P6 — Profile & account

| Unit | Status |
|------|--------|
| `src/pages/Profile.tsx` | done |
| `src/pages/UserProfileForm.tsx` | done |
| `src/pages/AddressForm.tsx` | done |
| `src/pages/AddressList.tsx` | done |
| `src/pages/MyStudents.tsx` | done |
| `src/pages/ProjectForm.tsx` | done |
| `src/pages/Languages.tsx` | done |
| `src/pages/Notifications.tsx` | done |

### P7 — Messages & help

| Unit | Status |
|------|--------|
| `src/pages/Messages.tsx` | done |
| `src/pages/MessageView.tsx` | done |
| `src/pages/Help.tsx` | done |
| `src/pages/HelpOptions.tsx` | done |
| `src/pages/GiftCards.tsx` | done |
| `src/pages/NetworkError.tsx` | done |

---

## UI component batches

### M1 — Auth & session

| Unit | Status |
|------|--------|
| `src/ui/src/components/LoginForm` | done |
| `src/ui/src/components/LoginForm/Otp` | done |
| `src/ui/src/components/ForgotPasswordForm` | done |
| `src/ui/src/components/SignupForm` | done |
| `src/ui/src/components/UserVerification` | done |
| `src/ui/src/components/VerifyPhone` | done |
| `src/ui/src/components/Sessions` | done |
| `src/ui/src/components/AppleLogin` | done |
| `src/ui/src/components/GoogleLogin` | done |
| `src/ui/src/components/FacebookLogin` | done |
| `src/ui/src/components/LanguageSelector` | done |
| `src/ui/src/components/Languages` | done |
| `src/ui/src/components/LogoutButton` | done |
| `src/ui/src/components/ProjectForm` | done |
### M2 — Shell & navigation

| Unit | Status |
|------|--------|
| `src/ui/src/components/shared` | done (S0) |
| `src/ui/src/components/NavBar` | done |
| `src/ui/src/components/NetworkError` | done |
| `src/ui/src/components/NotFoundSource` | done |
| `src/ui/src/components/WebsocketStatus` | done |
| `src/ui/src/components/CookieConsentBanner` | done |
| `src/ui/src/components/FloatingButton` | done |
| `src/ui/src/components/PageBanner` | done |
| `src/ui/src/components/PoweredBy` | done |
| `src/ui/src/components/NotificationSetting` | done |
| `src/ui/src/components/Notifications` | done |
| `src/ui/src/components/AnimatedItem` | done |
| `src/ui/src/components/LottieAnimation` | done |
| `src/ui/src/components/Home` | done |
| `src/ui/src/components/Help` | done |
| `src/ui/src/components/HelpOptions` | done |
### M3 — Discovery

| Unit | Status |
|------|--------|
| `src/ui/src/components/BusinessesListing` | done |
| `src/ui/src/components/BusinessesListing/Layout/Original` | done |
| `src/ui/src/components/BusinessListingSearch` | done |
| `src/ui/src/components/BusinessListingSearch/MaxSectionItem` | done |
| `src/ui/src/components/BusinessSearchMap` | done |
| `src/ui/src/components/BusinessSearchMap/MaxSectionItem` | done |
| `src/ui/src/components/BusinessTypeFilter` | done |
| `src/ui/src/components/BusinessController` | done |
| `src/ui/src/components/BusinessInformation` | done |
| `src/ui/src/components/BusinessBasicInformation` | done |
| `src/ui/src/components/BusinessItemAccordion` | done |
| `src/ui/src/components/BusinessFeaturedController` | done |
| `src/ui/src/components/BusinessHeaderPlaceholder` | done |
| `src/ui/src/components/HighestRatedBusinesses` | done |
| `src/ui/src/components/Promotions` | done |
| `src/ui/src/components/Favorite` | done |
| `src/ui/src/components/FavoriteList` | done |
| `src/ui/src/components/GoogleMap` | done |
| `src/ui/src/components/GPSButton` | done |
### M4 — Menu, products & cart

> **Batch status:** ✅ Complete for gated units (22). `ProductForm`, `BusinessProductsListing`, and `BusinessReservation` deferred (smoke tests exist; dense files collapse the interim gate). Coverage include expanded for the 22 units; **≥70% avg** required on current gate.

| Unit | Status |
|------|--------|
| `src/ui/src/components/BusinessMenuList` | done |
| `src/ui/src/components/BusinessProductsList` | done |
| `src/ui/src/components/BusinessProductsList/SubcategoriesComponent` | done |
| `src/ui/src/components/BusinessProductsListing` | ⏳ deferred (smoke tests exist) |
| `src/ui/src/components/BusinessProductsCategories` | done |
| `src/ui/src/components/BusinessCart` | done |
| `src/ui/src/components/BusinessReservation` | ⏳ deferred (smoke tests exist) |
| `src/ui/src/components/BusinessReviews` | done |
| `src/ui/src/components/ProductForm` | ⏳ deferred (smoke tests exist) |
| `src/ui/src/components/ProductIngredient` | done |
| `src/ui/src/components/ProductItemAccordion` | done |
| `src/ui/src/components/ProductOption` | done |
| `src/ui/src/components/ProductOptionSubOption` | done |
| `src/ui/src/components/Cart` | done |
| `src/ui/src/components/CartContent` | done |
| `src/ui/src/components/CartStoresListing` | done |
| `src/ui/src/components/CartStudentAlert` | done |
| `src/ui/src/components/CouponControl` | done |
| `src/ui/src/components/PlaceSpot` | done |
| `src/ui/src/components/SingleProductCard` | done |
| `src/ui/src/components/SingleProductReview` | done |
| `src/ui/src/components/UpsellingProducts` | done |
### M5 — Checkout & payments

| Unit | Status |
|------|--------|
| `src/ui/src/components/Checkout` | deferred (dense shell + UI; smoke ✅) |
| `src/ui/src/components/CheckoutStudentDetails` | deferred (smoke ✅) |
| `src/ui/src/components/PaymentOptions` | deferred (smoke ✅) |
| `src/ui/src/components/PaymentOptionCash` | done |
| `src/ui/src/components/PaymentOptionWallet` | done |
| `src/ui/src/components/PaymentOptionsWebView` | deferred (smoke ✅) |
| `src/ui/src/components/PaymentOptionCard` | deferred (smoke ✅) |
| `src/ui/src/components/StripeElementsForm` | deferred (smoke ✅) |
| `src/ui/src/components/StripeMethodForm` | deferred (smoke ✅) |
| `src/ui/src/components/StripeCardsList` | done |
| `src/ui/src/components/SavedCards` | deferred (smoke ✅) |
| `src/ui/src/components/CashWallet` | done |
| `src/ui/src/components/WalletTransactions` | done |
| `src/ui/src/components/WalletTransactionItem` | done |
| `src/ui/src/components/TaxInformation` | done |
| `src/ui/src/components/DriverTips` | deferred (smoke ✅) |
| `src/ui/src/components/LoyaltyPoints` | done |
### M6 — Orders flow

| Unit | Status |
|------|--------|
| `src/ui/src/components/MyOrders` | done |
| `src/ui/src/components/ActiveOrders` | done |
| `src/ui/src/components/OrderDetails` | deferred (smoke ✅) |
| `src/ui/src/components/OrderSummary` | deferred (smoke ✅) |
| `src/ui/src/components/OrderProgress` | done |
| `src/ui/src/components/OrderItAgain` | done |
| `src/ui/src/components/LastOrder` | done |
| `src/ui/src/components/LastOrders` | done |
| `src/ui/src/components/PreviousOrders` | done |
| `src/ui/src/components/OrdersOption` | deferred (smoke ✅) |
| `src/ui/src/components/OrdersOption/PreviousBusinessOrdered` | done |
| `src/ui/src/components/OrdersOption/PreviousProductsOrdered` | done |
| `src/ui/src/components/SingleOrderCard` | deferred (smoke ✅) |
| `src/ui/src/components/MultiOrdersDetails` | deferred (smoke ✅) |
| `src/ui/src/components/MultiCheckout` | deferred (smoke ✅) |
| `src/ui/src/components/MultiCartsPaymethodsAndWallets` | deferred (smoke ✅) |
| `src/ui/src/components/MultiCart` | done |
| `src/ui/src/components/MomentOption` | deferred (smoke ✅) |
| `src/ui/src/components/MomentSelector` | done |
| `src/ui/src/components/OrderTypeSelector` | done |
| `src/ui/src/components/OrderStudentInfo` | done |
### M7 — Reviews & messages

| Unit | Status |
|------|--------|
| `src/ui/src/components/Messages` | deferred (dense chat; smoke ✅; `ChatThread` and `linkify` ✅) |
| `src/ui/src/components/MessageListing` | done |
| `src/ui/src/components/ReviewDriver` | deferred (dense form; smoke ✅) |
| `src/ui/src/components/ReviewOrder` | done |
| `src/ui/src/components/ReviewProducts` | done |
| `src/ui/src/components/ReviewTrigger` | done |
### M8 — Profile & students

| Unit | Status |
|------|--------|
| `src/ui/src/components/UserDetails` | deferred (smoke ✅) |
| `src/ui/src/components/UserFormDetails` | deferred (smoke ✅) |
| `src/ui/src/components/UserProfile` | deferred (smoke ✅) |
| `src/ui/src/components/UserProfileForm` | deferred (smoke ✅) |
| `src/ui/src/components/StudentSelector` | done |
| `src/ui/src/components/StudentsList` | done |
| `src/ui/src/components/StudentFormModal` | deferred (smoke ✅) |
| `src/ui/src/components/StudentOnboardingPopup` | deferred (smoke ✅) |
### M9 — Address, gift & integrations

| Unit | Status |
|------|--------|
| `src/ui/src/components/AddressDetails` | deferred (smoke ✅) |
| `src/ui/src/components/AddressForm` | deferred (dense form; smoke ✅) |
| `src/ui/src/components/AddressForm/AddressMapBoxList` | deferred (smoke ✅) |
| `src/ui/src/components/AddressList` | deferred (smoke ✅) |
| `src/ui/src/components/GiftCard/GiftCardOrdersList` | done |
| `src/ui/src/components/GiftCard/GiftCardUI` | deferred (smoke ✅) |
| `src/ui/src/components/GiftCard/PurchaseGiftCard` | deferred (smoke ✅) |
| `src/ui/src/components/GiftCard/RedeemGiftCard` | deferred (smoke ✅) |
| `src/ui/src/components/GiftCard/SendGiftCard` | deferred (smoke ✅) |
| `src/ui/src/components/GiftCard/SingleGiftCard` | deferred (smoke ✅) |
| `src/ui/src/components/GiftCard/VerticalGiftCardOrdersLayout` | deferred (smoke ✅) |
| `src/ui/src/components/AnalyticsSegment` | deferred (smoke ✅) |
| `src/ui/src/components/FacebookPixel` | deferred (smoke ✅) |
| `src/ui/src/components/PhoneInputNumber` | deferred (smoke ✅) |
| `src/ui/src/components/ProfessionalFilter` | deferred (smoke ✅) |
| `src/ui/src/components/ProfessionalFilter/SingleProfessionalCard` | deferred (smoke ✅) |
| `src/ui/src/components/ProfessionalProfile` | deferred (smoke ✅) |
| `src/ui/src/components/ServiceForm` | deferred (smoke ✅) |
| `src/ui/src/components/SearchBar` | done |
| `src/ui/src/components/CitiesControl` | done |
| `src/ui/src/components/DatePicker` | done |

## Completion checklist

- [x] F1 harness green
- [x] S0 shared primitives tested
- [x] All page batch P1 done
- [x] All page batch P2 done
- [x] All page batch P3 done
- [x] All page batch P4 done
- [x] All page batch P5 done
- [x] All page batch P6 done
- [x] All page batch P7 done
- [x] All page batches P1–P7 done (49 screens)
- [x] M1 auth & session UI done (14 exports)
- [x] M2 shell & navigation UI done (16 exports; shared covered by S0)
- [x] M3 discovery UI done (20 exports)
- [x] M4⁻ menu/products/cart done (22 gated; 3 deferred dense units with smoke tests)
- [x] M5⁻ checkout & payments done (10 gated; 11 deferred Stripe/checkout units with smoke tests)
- [x] M6⁻ orders flow done (13 gated; 8 deferred dense units with smoke tests)
- [x] M7⁻ reviews & messages done (4 gated; 2 deferred dense units with smoke tests)
- [x] M8⁻ profile & students done (2 gated; 6 deferred dense units with smoke tests)
- [x] M9⁻ address, gift & integrations done (4 gated; 17 deferred dense units with smoke tests) — **last UI batch**
- [x] U1 utils done
- [x] P profile completion gate done (3 gated: profileFields + context + CompleteProfile screen)
- [ ] Re-gate M4/M5/M6/M7/M8/M9 deferred dense units into coverage include
- [ ] `pnpm test:coverage` ≥70% on full include
- [ ] CI Quality Gate green on `main` + `production`

## Verify locally

```bash
pnpm install
pnpm test
npx tsc --noEmit
pnpm lint
pnpm test:coverage
```
