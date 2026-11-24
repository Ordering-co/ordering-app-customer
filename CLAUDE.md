# CLAUDE.md

Guidance for AI assistants working in **ordering-app-marketplace-theming** — the customer-facing **bare React Native** mobile app for Ordering.co.

**Repository:** [Ordering-co/ordering-app-customer](https://github.com/Ordering-co/ordering-app-customer) (formerly `OrderingPlus/app-marketplace-2`)

**Stack:** React Native 0.88.1 (New Architecture on both platforms, Hermes V1, precompiled iOS core), React 19.3.0, TypeScript, styled-components/native. **Not Expo.** Customers browse businesses, build carts, check out, and track orders.

**Related repos:**

| Repo | Role |
|------|------|
| [ordering-components](https://github.com/Finitless-com/ordering-components) | Headless logic submodule at `src/@/components` |
| [Ordering Website](https://github.com/Ordering-co/ordering-website-customer) | Web marketplace — shares the same submodule and `@ui` pattern |

## Onboarding

Follow [setup.md](setup.md) for Ordering MCP project detection, automatic public configuration and the local iOS simulator. The development-only project gate validates the tenant before mounting the SDK.

## Commands

Package manager is **pnpm** (the version pinned in `package.json` `packageManager`, through `corepack enable`; settings in `pnpm-workspace.yaml`). Node **>=22.13** (`package.json` engines; React Native 0.88 needs it).

```bash
pnpm install               # install (applies patches/ through pnpm-workspace.yaml)
pnpm start                 # Metro bundler
pnpm ios                   # run on iOS simulator
pnpm android               # run on Android emulator
pnpm test                  # jest (single file: pnpm test path/to/file-test.tsx)
pnpm lint                  # eslint . --fix
npx tsc --noEmit           # TypeScript typecheck (there is NO `npm run build`)
```

**Verify a change in this order:** `npx tsc --noEmit` → `pnpm lint` → `pnpm test` → for UI changes, run on a simulator and compare before/after screenshots. There is no web/headless flow here — it's a native app.

## Architecture: three layers

The app is deliberately split into **headless logic**, **presentational UI**, and **screen wiring**. Understanding this separation is essential before editing.

```
@components (submodule)     →  controllers + hooks, NO visual markup
@ui (src/ui)                →  styled-components skins, wired via UIComponent prop
pages + navigators (src/)   →  thin screen wrappers, navigation, i18n strings
```

### 1. `@components` → `src/@/components` (GIT SUBMODULE — edit with caution)

Headless, UI-agnostic business logic from [Finitless-com/ordering-components](https://github.com/Finitless-com/ordering-components) (formerly `OrderingPlus/components`).

**React Native entry point:** `@components` resolves to `src/@/components/native/index.js` — **not** `src/@/components/src/index.js` (that web barrel pulls the entire SDK into the bundle).

Exposes `OrderingProvider` (RN variant uses `NativeStrategy` + AsyncStorage) and hooks: `useSession`, `useOrder`, `useConfig`, `useApi`, `useLanguage`, `useWebsocket`, `useEvent`, `useBusiness`, `useCustomer`, `useToast`, `useSchools`/`useSchoolStudents`/`useSelectedStudent`/`useCartStudent` (school vertical), etc.

Controllers accept a `UIComponent` prop and return only `<UIComponent {...props} />` — no layout markup of their own.

**This is a submodule:** clone with `--recursive`; logic changes belong in the upstream [ordering-components](https://github.com/Finitless-com/ordering-components) repo, not here. See `src/@/components/CLAUDE.md` for submodule rules. Confirm folder boundaries (app source vs. submodule) before editing.

**Native vs web wiring in the submodule:**

| Platform | Strategy | OrderingProvider | Import alias |
|----------|----------|------------------|--------------|
| React Native (this app) | `NativeStrategy` (AsyncStorage) | `native/src/contexts/OrderingContext` | `@components` → `native/index.js` |
| Ordering Website | `WebStrategy` (localStorage) | `src/contexts/OrderingContext` | deep-imports from `~components/...` |

### 2. `@ui` → `src/ui` (APP SOURCE — the presentational component library)

~136 styled-components-based components in `src/ui/src/components/*`, re-exported from `src/ui/index.tsx`. This is where **visual work** happens.

**Wiring pattern** (every feature follows this):

```tsx
// src/ui/src/components/LoginForm/index.tsx
import { LoginForm as LoginFormController } from '@components'

const LoginFormUI = (props) => { /* styled JSX */ }

export const LoginForm = (props) => (
  <LoginFormController {...props} UIComponent={LoginFormUI} />
)
```

Also exports helpers consumed by pages: `SafeAreaViewWrapper`, `NavBar`, `OButton`, `OSelect`, `Alert`, `Toast`, `StoreMethods`, `AnalyticsSegment`, `FacebookPixel`, `orderTypeList`, etc.

Each component keeps styles in a sibling **`styles.tsx`** with **named** styled-components — do not scatter inline `style={{ ... }}` objects.

### 3. `src/pages` + `src/navigators` (screen wiring)

Each file in `src/pages/*.tsx` is a thin screen wrapper: pulls hooks (`useLanguage`, `useTheme`, …), assembles props (including translated strings), and renders a `@ui` component inside `NavBar` + `SafeAreaViewWrapper`. See `src/pages/Login.tsx` for the canonical pattern.

**App-only contexts** (not in submodule): `CookieConsentProvider` (`src/contexts/CookieConsentContext/`), `PermissionsProvider` (`src/contexts/PermissionsContext/`), and the theme's `AppThemeProvider` + `RemoteThemeLoader` (`src/theme/AppThemeContext.tsx`).

## Entry flow

```
index.js  →  App.tsx  →  src/TemplateApp.tsx
```

`TemplateApp` builds the provider tree:

`AppThemeProvider` → `CookieConsentProvider` → `OrderingProvider` (with `RemoteThemeLoader`) → `NavigationContainer` → `PermissionsProvider` → `RootNavigator`

Also reads the cached theme before the first frame (`readCachedTheme`), the deep-link `linking` config, and cookie-consent sync between local state, server user settings, and gated analytics (Segment/FB Pixel only mount after consent).

## Navigation

React Navigation (stack + bottom tabs):

```
RootNavigator (auth gating, tutorial, network, OneSignal, version check, deep links)
└─ HomeNavigator (authed stack)
   ├─ BottomTab → BottomNavigator (Home, Offers, Browse, Orders, Profile)
   └─ Stack screens: Business, CheckoutPage, OrderDetails, Cart, AddressList, …
```

`NavigationRef.tsx` enables imperative navigation from outside React (e.g. OneSignal push handlers).

**Page conventions:**
- `const [, t] = useLanguage()` + `t('KEY', 'Fallback')`
- `useTheme()` for token colors
- `onNavigationRedirect: (page, params) => navigation.navigate(page, params)`
- Navigation (React Navigation 7) follows `src/navigators/appNavigation.ts`: `navigate` opens a screen (it pushes, it does not go back); going home is `goHome` (back to the tabs, never a second copy); going back to a screen below (the business, the checkout) is `returnTo`; page redirects use `openScreen`, which also reaches the main stack (`MyAccount`) from the root stack's screens (Login, Signup, the landing Home).

## Import aliases

Defined in BOTH `babel.config.js` (module-resolver) and `tsconfig.json` (paths) — **keep them in sync**:

| Alias | Resolves to |
|-------|-------------|
| `@` | `src` |
| `@ui` | `src/ui/index.tsx` |
| `@components` | `src/@/components/native/index.js` |

## Configuration & theming (runtime, not env vars)

- **`src/config.json`** — runtime app config: `app_id`, `api.url`/`version`, `socket.url`, `project`, `franchiseSlug`/`businessSlug`, feature flags (`show_tutorials`, `use_root_point`, `cookie_consent_enabled`). `src/config.js` re-exports it and converts slug values of `'0'` to `null`. Passed into `OrderingProvider` as `settings`. `businessSlug` (a business id or slug; `'0'`, `0` and empty mean off, and a quoted id such as `"1"` becomes the number) turns on single business mode: Home opens that business's menu with no back arrow, the Browse tab is hidden, Offers lists only that business's offers (and those without a business list) and there is no business-selection step (`src/utils/singleBusiness.ts`, normalised in `src/config.js`). The settings keep an id as a number (the listing filter and the orders-to-review query read a string as a slug), and the business page hands it to its controller as text, with `ignoreSlugToCompare` off for an id (`BusinessProductsListing`): that guard compares the store with the business's slug only, and with it on the products of a store given by id never load.
- **Theme** — read `docs/THEMING.md` before styling anything. The app obeys `product.schema.json` (product `marketplace_app`), compiled to `src/theme.compiled.json` (`pnpm theme:compile`); the served v2 theme is completed and converted in `src/theme/` and read through the helpers of `src/theme/helpers.ts`.
- Server-side `configs` (from `useConfig()`) override local settings for many flags (e.g. `cookie_consent_enabled`, `verification_email_required`, `onesignal_orderingapp_id`, `app_version`).

## i18n

Translation via `const [, t] = useLanguage()`, called as `t('LANG_KEY', 'Fallback text')`. Always pass a sensible fallback.

Multi-locale source of truth: **`i18n/translations.json`** (locales from `i18n/config.json`). Commands: `pnpm i18n:generate|verify|missing|apply-batch|sync`. Fill missing locales with `.cursor/skills/translate-keys` (`/translate-keys`). See `i18n/README.md`.

Legacy EN-only dumps still regenerated by `pnpm i18n:generate`: `app-marketplace-translations.json` / `.csv`.

## Where to edit what

| Task | Edit here | Do NOT edit |
|------|-----------|-------------|
| Visual design, layout, styled-components | `src/ui/src/components/*` | submodule controllers |
| Screen navigation, NavBar titles, page-specific props | `src/pages/*`, `src/navigators/*` | `@ui` unless reusable |
| Business logic, API calls, cart/checkout state | submodule `src/@/components/src/components/*` | this repo's pages for logic |
| Theme tokens, components, visibility, images | `product.schema.json` (then `pnpm theme:compile`), read through `src/theme/helpers.ts` | hardcoded values in components |
| App config, API URL, feature flags | `src/config.json` | env vars (not used) |
| Native-only integrations (Stripe RN, OneSignal) | `src/pages/*`, `src/utils/*` | submodule (keep platform-agnostic) |

## Common LLM mistakes — avoid these

1. **Adding styled-components or layout markup in submodule controllers** — belongs in `src/ui`.
2. **Importing from `src/@/components/src/index.js`** — use `@components` alias (native barrel).
3. **Putting business logic in `src/pages/*`** — pages wire props; logic lives in submodule controllers or `@ui` only when purely presentational.
4. **Hardcoding colors/spacing** — read the theme through the helpers of `src/theme/helpers.ts` (`docs/THEMING.md`); the guard (`pnpm theme:guard`) fails on literals.
5. **Editing submodule casually** — changes affect web + mobile; coordinate upstream PRs.
6. **Scattering inline styles** — use sibling `styles.tsx` with named styled-components.
7. **Forgetting translation fallbacks** — always pass fallback to `t()`.
8. **Dashboard vs customer confusion in submodule** — `OrdersDashboardComponents/` is admin-only; marketplace uses `components/Cart/`, `components/Checkout/`, etc.

## Gotchas

- **Submodule**: `src/@/components` is a git submodule (`.gitmodules`). Fresh clones need `git clone --recursive https://github.com/Ordering-co/ordering-app-customer.git` or `git submodule update --init`.
- **Patches**: `pnpm install` applies the patches in `patches/` listed in `pnpm-workspace.yaml` `patchedDependencies`: `react-native-notify-kit` (its Gradle script exits on any JDK but 8/11/17/21: it accepts any JDK from 17, Android Studio's JBR 25 included). Don't hand-edit node_modules; make or refresh a patch with `pnpm patch <pkg>` and `pnpm patch-commit`.
- **Builder base**: the Builder builds from its own copy of this repository (`builder_bases`, cloned from `main`). Every push to `main` publishes the theme schema and then asks api-core to clone that base again (`.github/workflows/theme-publish.yml`, `POST system/builder_bases/sync` with the `BUILDER_BASE_SYNC_KEY_PRODUCTION` secret): what is merged is what the next build ships, and the apps of the base show "Changes since this build" in the Dashboard.
- **Builder builds (Jenkins)**: `BUILD_PNPM.txt` at the root tells the Builder's pipelines (infrastructure-files `jenkins-pipelines/builder/dashboard-build-rn-*.groovy`) to install with pnpm (`corepack`, `pnpm install --frozen-lockfile`, so patches and the lock apply) and to keep `ios/Podfile.lock`; without it they install with yarn. Always commit `pnpm-lock.yaml` with `package.json` (CI fails otherwise).
- **Splash**: `react-native-bootsplash` (`docs/SPLASH.md`): a logo over a color (iOS `BootSplash.storyboard`, Android `BootTheme`), or a full-screen image when `src/splash.json` says `"mode": "image"` (`AppSplash` in `src/ui`). The app hides it through `hideSplash()` (`src/utils/splash.ts`) only, never `BootSplash.hide` directly; its files have fixed names because the Builder replaces them per brand.
- **Deep links (iOS)**: the app has a scene (`SceneDelegate` in `AppDelegate.swift`), and React Native's Linking has its own entry points for one: `RCTLinkingManager.scene(_:openURLContexts:)` / `scene(_:continue:)` for a link opened while the app runs (the app delegate's `application(_:open:options:)` ones do nothing in a scene app), and the launch options (`SceneDelegate.launchOptions`) for the link that launched it, which `Linking.getInitialURL()` reads. The Facebook SDK sees the URL first. Try one with `xcrun simctl openurl <udid> "<scheme>://order/<id>"` (`adb shell am start -a android.intent.action.VIEW -d …` on Android); the binaries register the Builder's `_APP_SCHEME_` placeholder, so set `app_scheme` in the local `src/config.json` to a scheme the build has (iOS registers `delivery` too; on Android replace `_APP_SCHEME_` in the manifest for the local build, uncommitted).
- **Push providers** (`src/navigators/RootNavigator.tsx` wires them): the server's configs choose one, Firebase when `firebase_push_enabled` is on, else OneSignal when `onesignal_orderingapp_id` is set, and only with a session and consent (`getDesiredPushProvider`, `src/navigators/pushProviderSwitch.ts`). The configs load again each time the checkout opens, so the provider can change with the app open: `createPushProviderSwitch` runs one change at a time and ends the other provider's teardown (its row deleted, state and storage reset) before the setup starts. A provider already set up with its token is not set up again on those reloads (its listeners would pile up: Firebase's `onMessage` showed a foreground push once per reload). The state each provider registers is built whole (`notification_app`, `notification_token`, `notification_provider`), never spread from an older one, and is also written to AsyncStorage `notification_state`: `LogoutButton` sends that token on logout and the API deletes its row (no token there = the row stays and the user who left keeps receiving pushes on that phone).
- **OneSignal** (`react-native-onesignal` 5, a TurboModule, no patch; `src/navigators/oneSignalPush.ts`, tested in `__tests__/oneSignalPush.test.ts` with `jest/helpers/mockOneSignal.js`): `initialize` → `login` (external id `<project>-<user id>`) → `User.addEmail` / `User.addSms` (E.164, `oneSignalSms.ts`), in that order (v5 adds them to the current user, and adds instead of replacing: a changed email or number removes the old one, kept in `onesignal_identity`). A setup that changes nothing does nothing (v5 queues an operation on each `addEmail` / `addSms`). The token registered in `notification_tokens` is the push subscription id (`User.pushSubscription.getIdAsync()`, or its `change` event on a clean install; the v4 player id, kept on update). The permission dialog shows once per install (`onesignal_permission_asked`). Teardown (logout, the switch to Firebase) is `pushSubscription.optOut()` + `logout()`; the next setup opts in again once the permission is granted. An app that opens in Firebase mode with a OneSignal subscription left in `notification_state` opts it out once (`retireStaleSubscription`). The SDK logs verbosely in development only (`__DEV__`): at that level it writes the user's email, phone and external id to the device log. Nothing of the SDK is called before `initialize` (it throws inside the native module on Android), and the click, subscription and permission listeners are removed when the navigator unmounts (`dispose()`; it mounts again when the API comes back). iOS: the `OneSignalNotificationServiceExtension` target (bundle `<app>.OneSignalNotificationServiceExtension`, App Group `group.<app>.onesignal`, names the Builder replaces) uses `OneSignalExtension` from `OneSignalXCFramework`, pinned in the Podfile to the version of react-native-onesignal's podspec.
- **Optional Builder keys** (`src/utils/nativeKeys.ts` has the table): `google_maps_api_key`, `facebook_id` + `facebook_client_token`, `google_reversed_client_id` (iOS), `apple_merchant_id` (iOS) and Intercom's two are off when empty, `none`, `null`, `-`, `0` (not the Facebook client token's `0`), their placeholder left as it is, or not of their shape (`merchant.…`, digits, `com.googleusercontent.apps.…`). The rule has one copy per platform, all tested with `src/utils/nativeKeys.cases.json`: `nativeKeys.ts` (jest), `ios/native_keys.rb` (`ruby ios/native_keys_test.rb`) and Android's `NativeKeys.kt` (`./gradlew :app:testDebugUnitTest --tests 'co.ordering.app.NativeKeysTest'`); change the three and the table together. The native side decides and starts an SDK only when its keys are set, and JS gets booleans (the root's `nativeFeatures`) and hides what is off: the native map only (the address form's Google autocomplete and GPS are HTTP with the server's key), the Facebook/Google buttons and Facebook's app events, Apple Pay, Intercom's bubble. iOS decides at build time, in the Podfile's two `[CP-User] Native keys` build phases: the signing `ReactNativeAppsTemplate5.signing.entitlements` (gitignored, written by `pod install` without Apple Pay when there is no merchant id; the build stops and writes it again when the `.entitlements` changed since) and the built Info.plist (no URL type of a key that is off, and `OrderingNativeFeatures`, which `AppDelegate.swift` reads). Android decides at start (`MainApplication`): Facebook's own provider is out of the manifest and its React Native package is left out without the keys. The Builder replaces every occurrence of a placeholder's text in a file: never write one in a comment, and keep `AppDelegate.swift`'s three `static let … = "…"` lines as they are (`native_keys.rb` reads them).
- **Native request headers**: every fetch/XHR request carries two headers set natively, never from JS: the `User-Agent` with the app, build, OS and device (`<App>/<version> (<package>; build:<code>; Android 15; samsung SM-S911B) okhttp/…`, iOS `… iOS 18.2; iPhone15,2) CFNetwork/…`), which api-core parses, and `X-Device-Id-X`, the device's id for analytics (not gated by the cookie consent). Android: one OkHttp interceptor in `UserAgent.kt` (React Native takes a single client builder), the id is `ANDROID_ID`, read once per process and kept in memory only (`DeviceId.kt`; never on disk: Auto Backup would copy it to another phone). iOS: `UserAgent` / `DeviceId` in `AppDelegate.swift`, a UUID v4 in the Keychain (`…AfterFirstUnlockThisDeviceOnly`, survives a reinstall, no backup to another phone), declared in `PrivacyInfo.xcprivacy`. The socket's handshake does not carry them. Never `X-Physical-Device-Code-X` (POS/kiosk devices) nor the Advertising ID.
- **Hermes V1** (default from RN 0.84) does not compile a shorthand `set`/`get` with a default in a destructuring (`({ set = 'ion' }) =>`): rename it (`({ set: iconSet = 'ion' })`).
- **iOS pods**: Firebase and Stripe come from CocoaPods (`$RNFirebaseDisableSPM` / `$StripeDisableSPM` in the Podfile): their Swift packages need dynamic frameworks and the app links statically. That pins `@react-native-firebase/*` to 26.x (Firebase iOS 12.x, the last on CocoaPods) and `@stripe/stripe-react-native` to 0.83.0 (the last that accepts CocoaPods).
- **Forms** use react-hook-form 7: `const { control, handleSubmit, formState: { errors } } = useForm<FormValues>()`, and a `Controller`'s `render` receives `{ field: { onChange, value } }`.
- **Navigation params are plain data**: pass the fields a screen reads (e.g. a business's `id`, `slug`, `header`), never an SDK model (it holds the API client: pass `plainParams(model)`, `src/navigators/appNavigation.ts`) and never a function. A screen that hands something back (a review sent, an address saved, a cart product edited) sets it as params of the screen that opened it with `useSendResult` (`src/navigators/appNavigation.ts`), and the opener reads them; a closed business's pre-order opens with `preorderParams`.
- **Android package (Builder)**: each brand's build renames `com.reactnativeappstemplate5` to its own package only in the files the Builder base lists (`MainActivity.kt`, `MainApplication.kt`, `build.gradle`, `google-services.json`, `config.json`) and then moves `android/app/src/main/java/com/reactnativeappstemplate5/` to the new package's path. Only `MainActivity` and `MainApplication` live there (the manifest names them relative to the `namespace`). Any other Kotlin/Java class of the app goes in the fixed package `co.ordering.app` (`android/app/src/main/java/co/ordering/app/`) and is imported by its full name: a new file in the renamed package would keep the old `package` line and break the build (`Unresolved reference`) unless the base got its own replace action.
- **Android (AGP 9)**: `android/build.gradle` turns `buildConfig` on for every library module (several still declare BuildConfig fields).
- **Performance**: `docs/PERFORMANCE.md` lists what was measured and fixed, and what is left (submodule PRs, app refactors).
- **Production builds** strip `console.*` (babel `transform-remove-console`), so don't rely on console logging for prod behavior.
- ESLint extends `@react-native` with many rules relaxed (see `.eslintrc.js`); `react/prop-types` is off.
- **TypeScript** extends `@react-native/typescript-config` (Hermes's lib, `skipLibCheck`) and must stay at 0 errors. A library without types gets a declaration in `src/types/<package>/index.d.ts`; one that publishes its TypeScript source instead of declarations is mapped in `tsconfig.json` `paths` to such a declaration, so its source is not checked as the app's.
- **School vertical**: hooks `useSchools`, `useSchoolStudents`, `useSelectedStudent`, `useCartStudent` + UI components (`StudentSelector`, `CheckoutStudentDetails`, etc.).

## Linear / issue workflow

`local-reference/linear-target.md` (gitignored) binds this repo to its Linear board. Key facts: team **Ordering Product Team** (`ORD`), project **Eatstreet Issues and Improvements** (shared numbering with the web-marketplace repo — always `list_issues` to confirm the latest before creating). Default product label for issues filed here: **`product:app-marketplace`** (tag where the *fix* lives, not where the symptom shows).
