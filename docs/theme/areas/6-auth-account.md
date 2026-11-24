# Area 6: Auth, account and onboarding

Phase 1 (inventory), read-only. **Code reading only: no simulator was run**, so no
screenshots, no iOS/Android comparison and no small/large phone checks were made. Painted
sizes below come from the code, not from measurements.

Scope: RootNavigator-level screens (welcome `Home`, tutorial, Login, Signup, Forgot,
UserVerification, CompleteProfile, ProjectForm, NetworkError, version check), the account
stack (Profile tab, ProfileForm, AddressList, AddressForm without map/places, Languages,
Sessions, MyStudents) and the shared form helpers they use (`src/ui/src/Forms/*`,
`LoginForm/Otp`, `VerifyPhone`, `UserFormDetails`, `UserDetails`, `NotFoundSource`,
social login buttons). Excluded: `src/@/` (submodule, only read to see the theme merge),
the shared primitives (OText, OButton, OInput, OModal, NavBar, tab bar…), maps and places
autocomplete, Stripe, native pickers and system alerts.

Area metrics (81 files, literals from `.theme-audit/inventory.csv`): **628 literals**
(space 226, size 108, font_size 83, radius 54, font_weight 43, color 36, border 30,
shadow_part 15, opacity 12, z_index 9, line_height 6, font_family 4); **115** inline
`style={{`; **20** `StyleSheet.create` (all inside render, so they do see the theme);
**4** hard-coded `fontFamily`; **~25** `Platform.OS` branches; **6 color keys read but not
defined**. Hot files: `AddressForm/index.tsx` 44, `UserVerification/index.tsx` 38,
`UserDetails/index.tsx` 34, `SignupForm/index.tsx` 32, `UserFormDetails/index.tsx` 32.

---

## Routes and screens (navigator → page → UI)

| Route | Navigator (file:line) | Page | UI component | Root container | Keyboard |
|---|---|---|---|---|---|
| `Home` (welcome, signed out) | Root stack via `initialScreens` `src/navigators/RootNavigator.tsx:732`; also `HomeNavigator.tsx:119` when `!auth` | `src/pages/Home.tsx` | `HomeView` → `src/ui/src/components/Home/index.tsx` | `ImageBackground` + `SafeContainer` (manual insets) | none needed |
| `IntroductoryTutorial` | `RootNavigator.tsx:722` (only `!auth && settings.show_tutorials`; `config.json` has `false`) | `src/pages/IntroductoryTutorial.tsx` | inline (`Pager`) | `View` > `SafeAreaView` > `Pager` | n/a |
| `Login` | `RootNavigator.tsx:740`; **also rendered inline inside 5 bottom tabs** `BottomNavigator.tsx:132-197,245` | `src/pages/Login.tsx` | `LoginForm/index.tsx` | `NavBar` + `SafeAreaViewWrapper disableScrollView` > `Container` (ScrollView) | KAV `padding` on iOS (wrapper) |
| `Signup` | `RootNavigator.tsx:760`; also inside tabs | `src/pages/Signup.tsx` | `SignupForm/index.tsx` | `NavBar` + `SafeAreaViewWrapper` (ScrollView) > **second ScrollView** | KAV iOS + Android spacer; manual `scrollToEnd` |
| `Forgot` | `RootNavigator.tsx:766`; also the **fallback** of every tab when `accountState === ''` (`BottomNavigator.tsx:140`) | `src/pages/ForgotPassword.tsx` | `ForgotPasswordForm/index.tsx` | own `KeyboardAvoidingView` > `Container` (layouts, ScrollView) > NavBar **inside the form** | KAV padding/height |
| `UserVerification` | `RootNavigator.tsx:702` (gate); `HomeNavigator.tsx:112` | `src/pages/UserVerification.tsx` | `UserVerification/index.tsx` | page `SafeAreaView` (styled **inside render**) > `SafeAreaView` > `ScrollView` + bottom `ButtonsActions` | none (no KAV) |
| `CompleteProfile` | `RootNavigator.tsx:696` (gate) | `src/pages/CompleteProfile.tsx` (renders UI itself) | `UserDetails` → `UserFormDetails` | `SafeAreaView` > `ScrollView` | none (no KAV) |
| `ProjectForm` | `RootNavigator.tsx:732` only if `settings.use_root_point` (`false`) | `src/pages/ProjectForm.tsx` | `ProjectForm/index.tsx` | `SafeAreaView` (paddingTop android 30) > `Container` View | keyboard listeners only drive navigation |
| `NetworkError` | `RootNavigator.tsx:774`, `HomeNavigator.tsx:105` | `src/pages/NetworkError.tsx` | `NetworkError/index.tsx` | `SafeAreaContainer` (paddingTop android 20) | n/a |
| Force update | `RootNavigator.tsx:569-598` | — | `Alert.alert` (system) | system alert | n/a — out of theme |
| `Profile` tab | `BottomNavigator.tsx:~240` | `src/pages/Profile.tsx` | `UserProfile/index.tsx` (`ProfileListUI`) | `NavBar` + `SafeAreaViewWrapper disableScrollView` > `Container` > `WrapperOptions` (ScrollView) | n/a |
| `ProfileForm` | `HomeNavigator.tsx:242` | `src/pages/UserProfileForm.tsx` | `UserProfileForm/index.tsx` | `SafeAreaViewWrapper` (ScrollView) > `Container` (**ScrollView in ScrollView**) | wrapper |
| `AddressList` | `HomeNavigator.tsx:131`; also the **Home tab body** when signed in without address `BottomNavigator.tsx:128` | `src/pages/AddressList.tsx` | `AddressList/index.tsx` | `SafeAreaViewWrapper` (ScrollView) > `Container` (**ScrollView in ScrollView**, own RefreshControl) | wrapper |
| `AddressForm` | `HomeNavigator.tsx:146` | `src/pages/AddressForm.tsx` | `AddressForm/index.tsx` | `SafeAreaViewWrapper disableScrollView` > `ScrollView` > `TouchableWithoutFeedback` > `AddressFormContainer` | wrapper; tap-outside dismiss |
| `Languages` | `HomeNavigator.tsx:263` | `src/pages/Languages.tsx` | `Languages/index.tsx` | `SafeAreaViewWrapper` (ScrollView) > `FlatList` (**VirtualizedList in ScrollView**) | n/a |
| `Sessions` | `HomeNavigator.tsx:284` | `src/pages/Sessions.tsx` | `Sessions/index.tsx` | `SafeAreaViewWrapper` (ScrollView) > `Container` (ScrollView) | n/a |
| `MyStudents` | `HomeNavigator.tsx:141` | `src/pages/MyStudents.tsx` | `StudentsList/index.tsx` (+ `StudentFormModal`) | `SafeAreaViewWrapper` (ScrollView) > `Wrapper flex:1` > `ScrollView` | modal `isAvoidKeyBoardView` |
| (dead) `Splash` | **not registered anywhere** | `src/pages/Splash.tsx` | inline | — | — |
| (dead) `SpinnerLoader` | **not registered** | `src/pages/SpinnerLoader.tsx` | `LoadingOverlay` | — | — |
| (dead) `NotFound` | **not registered** | `src/pages/NotFound.tsx` | `NotFoundSource` | — | — |

The native splash is `react-native-bootsplash` (`docs/SPLASH.md`), hidden through `hideSplash()`
(`src/utils/splash.ts`) from `RootNavigator.tsx`; it cannot change at run time (lessons §13).

---

## Elements

Abbreviations: `h` = theme.utils.margins.horizontal (20); colors are `theme.colors.*`.

### Welcome (`Home/index.tsx`, `Home/styles.tsx`, `Home/utils.tsx`)

| Screen / component | Element | file:line | Values today | Function | Proposal |
|---|---|---|---|---|---|
| Welcome | Background | `Home/index.tsx:82-84`, `styles.tsx:4` | `ImageBackground` cover, source served `homepage_view…homepage_header…image` or `images.general.homeHero` | hero image | image key `welcome.hero` (cover, fallback = brand bg color) |
| Welcome | Safe container | `styles.tsx:9-16`, `index.tsx:86` | `pt = insets.top \|\| 20`, `pb = insets.bottom \|\| 10`, `padding-horizontal: h` | screen gutter | `space.gutter`; drop `\|\| 20/10` fallbacks |
| Welcome | Language pill | `LanguageSelector/index.tsx:32-50` | bg **`#003B2C`** hard-coded, text white, h 40, radius 50, `paddingLeft: 15 + width*0.04`, flag 11, arrow PNG tinted white | language switch | `color.surface.inverse` or brand; `radius.pill`; one `LanguagePill` |
| Welcome | Title | `index.tsx:91-106`, `utils.tsx:6-31` | white, size 56/48/32 by screen height, scaled ×0.62–0.9 by string length, min 28, line ×1.2, marginTop 80/60/40, bold spans | display heading | `type.display` (ratio 1.2) + a responsive rule; text from i18n stays |
| Welcome | Buttons | `index.tsx:110-133`, `:140` | OButton primary / `secondary` + inline `borderColor: white` / `third`; `marginVertical: 5`; `WrapperBtn` mb 20 | CTA stack | OButton variants; `space.xs` gap; `borderColor` override → variant `outline-inverse` |

### Tutorial (`src/pages/IntroductoryTutorial.tsx`)

| Element | file:line | Values today | Function | Proposal |
|---|---|---|---|---|
| Slide bg | `:29-64`, `:121-125` | `colors.white` per slide, root `backgroundPage` | surface | `color.surface.page` |
| Slide image | `:75-83`, `:126` | absolute, top 40, w 100%, h 70%, `cover` (or `contain` if width > 1080), mt 10 | illustration | image keys `tutorial.slide1..6` |
| Title | `:93-102` | raw `Text`, **`fontFamily: 'Poppins'`** (no such file on Android), 20/600, color **`colorTextTutorial` (undefined)**, bottom `H*0.22`, width `W*0.85` | heading | OText `type.title`; `color.text.primary` |
| Body | `:84-92` | raw `Text`, Poppins, 15, color undefined key, bottom `H*0.13` | body | OText `type.body` |
| Next / Skip / Back / Done | `:103-116`, `:133-190` | raw `Text` 18/300, `primary`; boxes 90×40 `top: 3`; Skip `marginLeft/start = W*0.45` by **Platform.OS**; Prev `start W*0.7` | text buttons | `OButton` variant `link`; remove platform offsets |
| Dots | `:205-214` | active `primary`; inactive **`'lightgray'`** literal; both shifted `right: W*0.29` | pager | `color.border.strong` / `color.brand`; component `PagerDots` |
| Arrow icon | `:140-144` | AntDesign `arrowright` 16 `primary` | icon | icon size token `icon.sm` |
| Status bar | `:200` | `translucent`, transparent | — | behaviour |

### Login (`LoginForm/index.tsx`, `LoginForm/styles.tsx`, `Forms/*`)

| Element | file:line | Values today | Function | Proposal |
|---|---|---|---|---|
| Scroll container | `styles.tsx:3-6` | pt 20, px `h` | screen | `space.lg` / `space.gutter` |
| Method tabs (email/phone/OTP) | `Forms/Tabs.tsx:74-108`, `Forms/styles.tsx:6-19` | track `backgroundGray100` radius 30; tab py10 px15 radius 30; selected bg `activeContrast` (= `lightPrimary` on app), text `active` (= primary) bold / unselected `disabled` | segmented control | component `SegmentedTabs`; `radius.pill`; `color.brand.subtle` |
| Form block | `styles.tsx:36-41` | padding 20/0/15 | form | `space.lg` |
| Email error text | `index.tsx:359-367` | 14 normal, **`danger`** | field error | `color.feedback.danger` + `type.caption` |
| Email input | `index.tsx:371-387` | border **`danger5` (undefined)** on error, `marginBottom: 10` | input error state | `OInput` `invalid` state → `color.feedback.danger` |
| Phone input | `index.tsx:412-422` | wrapper mb 15 | input | `PhoneInputNumber` (primitive owner) |
| Password error | `index.tsx:424-431` | 14, **`danger5` (undefined)** — same function as the email error, different key | field error | as above |
| Password input + eye | `index.tsx:433-468` | MCI eye 24 `disabled`; border `danger5` | secure input | `OInput` `secure` with built-in toggle; `icon.md` |
| Forgot link | `index.tsx:471-477` | OText 14 bold, mb 18, default color | link | `OButton` `link` / `type.label` |
| reCAPTCHA v2 row | `index.tsx:490-518`, `styles.tsx:77-81` | MCI 26, checked `primary` / unchecked `mediumGray`, label 14 ml 8, row mb 10 | checkbox | `Checkbox` component; `icon.lg` |
| reCAPTCHA v3 | `index.tsx:482-488` | WebView container h 40 | third party | out of theme |
| "New on Ordering? Create account" | `index.tsx:523-534` | 14 / 14 bold `primary`, ml 5 | switch to sign-up | `AuthSwitchLink` (shared with signup) |
| Twilio "Get verify code" | `index.tsx:538-551` | OButton, wrapper `mBottom 20` | action | OButton |
| "Powered By Orderingplus" | `index.tsx:552` | **hard-coded, untranslated** plain OText | branding | `PoweredBy` component (exists in `@ui`) + visibility key |
| Sticky actions | `index.tsx:595-640`, `styles.tsx:83-89` | py10 px0, bg `white` (not `backgroundPage`); SMS/WhatsApp row `gap: 10` | primary CTA | `space.sm`; `color.surface.page` |
| OTP modal | `index.tsx:569-586`, `Otp/index.tsx:70-158` | native `Modal` slide; timer OText 24; boxes 45×50 r8 border `lightGray` fs16; error 20 `error`; resend 16 `primary`/`disabled`; Cancel OButton; `OTPContainer` p20 | OTP entry | one `OtpInput` component (see duplicates) |
| Verify-phone modal | `index.tsx:554-568` | `OModal` > `VerifyPhone` | OTP entry | same |
| Alert | `index.tsx:587-593` | `Alert` from `@ui` | dialog | primitive owner |
| Social buttons | `Forms/SocialButtons.tsx:48-101`, `Forms/UIButton.tsx`, `Forms/styles.tsx:36-47` | wrapper mt 10; button py12 px10, **radius 30, border 2 `black`, bg `#fff`**, `minWidth: width*0.3`; label raw `Text` 16 **`#000000`**; icon FA5 16 (FB `skyBlue`, Google `black`, Apple 20 `'black'`) | social sign-in | `SocialButton` (variant of OButton `outline`); visibility per provider |
| Social skeleton | `Forms/SocialButtons.tsx:88-99` | `shared/Skeleton` lines 20 / 50 r25 | loading | `Skeleton` sizes |
| Overlay spinner | `index.tsx:594` | `LoadingOverlay` | loading | out of theme (or `color.overlay`) |

### Signup (`SignupForm/index.tsx`, `SignupForm/styles.tsx`)

| Element | file:line | Values today | Function | Proposal |
|---|---|---|---|---|
| Scroll | `index.tsx:487-493` | paddingTop 20 (0 when `embedded`) | screen | `space.lg` |
| FormSide | `styles.tsx:3-10` | px `h` | gutter | `space.gutter` |
| Tabs | `index.tsx:495-507` | same `Forms/Tabs` | segmented | `SegmentedTabs` |
| Dynamic fields | `index.tsx:511-561` | error OText 14 **`danger5`**; OInput border `danger5`/`border` | form | `OInput` invalid state |
| Phone | `index.tsx:563-586` | wrapper mb **25** (login uses 15) | input | one form-rhythm token |
| reCAPTCHA v2 | `index.tsx:600-627` | icon **23** (login 26), unchecked **`disabled`** (login `mediumGray`), mx 4 mb 10 | checkbox | `Checkbox` |
| Password | `index.tsx:644-699` | `inputStyle` mb 10; left icon `images.general.lock`; eye 24 `disabled`; error `danger5` | secure input | `OInput secure` |
| Promotions checkbox | `index.tsx:704-732` | `@react-native-community/checkbox` 20×20, tint `primary`/`disabled`; label pl 15; row mb 20 | opt-in | `Checkbox`; visibility key |
| Terms checkbox + link | `index.tsx:735-777` | error `danger5`; link bold **`black`** | consent | `Checkbox` + `link` |
| "Already have an account? Log in" | `index.tsx:785-797`, `:99-104` | `wrappText` space-between, mb 30; link bold `primary` | switch | `AuthSwitchLink` |
| Sticky actions | `index.tsx:827-874`, `styles.tsx:30-36` | `padding 10px h`, bg `white`; **inside the ScrollView** (not sticky, unlike Login's) | CTA | same as login |
| Dead styles | `index.tsx:91-97, 108-113`, `styles.tsx:17-28` | `btnOutline` `#FFF`, `line`, `ButtonsSection`, `SocialButtons` unused | — | delete |

### Forgot password (`ForgotPasswordForm/index.tsx`, `styles.tsx`)

| Element | file:line | Values today | Function | Proposal |
|---|---|---|---|---|
| NavBar inside form | `index.tsx:117-123` | `marginHorizontal: -h`, pt 0, pb 16 | header | page-level NavBar like every other screen |
| Lead text | `index.tsx:125-132` | color **`'gray'`** literal, 16/300, mb 30 | description | `color.text.secondary`, `type.body` |
| Error | `index.tsx:134-141` | 14 **`danger5`** | field error | invalid state |
| Email input | `index.tsx:38-46`, `:145-160` | mb 25, border 1 `border`, minHeight 40, **radius 7.6**, left icon `images.general.email` | input | `OInput`; `radius.md` |
| reCAPTCHA v2 | `index.tsx:172-202` | same as login (26 / `mediumGray`) | checkbox | `Checkbox` |
| Submit | `index.tsx:204-211` | inline `borderRadius 7.6, shadowOpacity 0`; passes **`isDisabled`/`isLoading`/`imgRightSrc`, props OButton does not read** (it reads `disabled`/`loading`) → no disabled/loading state painted | CTA | OButton with real `disabled`/`loading` |
| Dead | `styles.tsx:3-7` | `Wrapper` bg `white`, p 25 unused | — | delete |

### UserVerification (`UserVerification/index.tsx`, `styles.tsx`; page `src/pages/UserVerification.tsx`)

| Element | file:line | Values today | Function | Proposal |
|---|---|---|---|---|
| Page wrapper | `pages/UserVerification.tsx:14-18` | styled component **created inside render**; bg `backgroundPage`; `padding-top` android 20 / ios 0 | screen | shared screen container; safe-area inset instead of platform literal |
| Title | `index.tsx:323-325` | 22 bold mb 10 | heading | `type.title` |
| Lead | `index.tsx:327-343`, `:438-440` | 14 `disabled`, centered, py 20 | description | `color.text.secondary` (not `disabled`) |
| Logout icon | `index.tsx:346-357` | absolute top/right, OIcon PNG `images.general.logout` w 20 `textNormal` | escape hatch | `IconButton` |
| Email (read-only) | `index.tsx:362-369`, `:114-119` | mb 28, border `border`, r 7.6, icon `email` | display | `OInput` disabled |
| Countdown pill | `index.tsx:372-381`, `styles.tsx:51-65` | bg `${color}4D` (30% alpha of `success`/`error`), **r 7.6**, w 80%; OText 26 | timer | `CountdownBadge` component |
| Code digits | `index.tsx:152-178`, `:98-107` | each `View` border 1 r 7.6 p 12 `disabled` / focused `primary`; raw `Text` 20 `black`/`disabled` | OTP | `OtpInput` |
| Resend | `index.tsx:407-414` | OText default size `primary` | link | `link` |
| Phone read-only | `index.tsx:423-435`, `:125-140` | box 44×32, input h 30 fs 12 | display | `PhoneInputNumber` disabled |
| User details | `index.tsx:493-501` | px 20 pb 20 → `UserDetails` | form | — |
| Bottom actions | `index.tsx:503-543`, `styles.tsx:27-37` | p 12/40, border-top 1 `border`, bg **`#FFF`**, z 1000; buttons inline **r 7.6** | CTA bar | `BottomActionBar` (also in checkout) |

### CompleteProfile (`src/pages/CompleteProfile.tsx`)

| Element | file:line | Values today | Function | Proposal |
|---|---|---|---|---|
| Container | `:45-52` | `StyleSheet` in page, bg `backgroundPage`, padding 20 | screen | page renders UI itself: move to `@ui` |
| Title + logout | `:73-80` | OText 22 bold; logout PNG w 20 `textNormal` | header | same as UserVerification (duplicate header) |
| Lead | `:82-87` | 14 `disabled`, py 20 | description | `color.text.secondary` |
| Form | `:89-103` | `UserDetails` `isCheckoutPlace` → `UserFormDetails` | form | — |
| Skip | `:105-111` | 14 `primary`, py 20 | link | `link` |

### Profile tab (`UserProfile/index.tsx`, `styles.tsx`)

| Element | file:line | Values today | Function | Proposal |
|---|---|---|---|---|
| NavBar title | `pages/Profile.tsx:35` | "Hi {name}" | header | — |
| Quick actions card | `styles.tsx:16-38` | bg `white`, r **12**, p 20/10, m 5/15/25; iOS shadow `#000` 0/2 .15 r4; Android border 1 `rgba(0,0,0,.1)` | card | `Card` + `shadow.sm` (see duplicates) |
| Quick action | `index.tsx:144-151`, `styles.tsx:45-49` | icon box r 10 p 8 `backgroundGray100`; Ionicons 28 `black`; label mt 6 / 500 | shortcut | `IconTile`; `icon.lg` |
| Section title | `index.tsx:171,185,204`, `:242-246` | size `tsize.m + 2` (18), 600, mt 10 mb 15 | section heading | `type.sectionTitle` (exists in theme.json, unused here) |
| Menu row | `index.tsx:127-142`, `styles.tsx:63-76`, `:247-258` | py 18, bottom border 1 `backgroundGray200`; Ionicons 24 `black` mr 18; text 16; value 16/500 ml 10 | list row | `ListRow` component |
| Logout row | `index.tsx:211-217` | same `ListItem` via `LogoutButton` `UIButton` | row | `ListRow` |
| App version | `index.tsx:220-224` | OText default, centered | meta | `type.caption` |
| Websocket status | `index.tsx:219` | `WebsocketStatus` | debug | visibility key or remove |
| Scroll padding | `index.tsx:239-241` | pb 80 | tab bar clearance | inset |

### ProfileForm (`UserProfileForm/index.tsx`, `styles.tsx`, `UserFormDetails/*`)

| Element | file:line | Values today | Function | Proposal |
|---|---|---|---|---|
| Container | `UserProfileForm/styles.tsx:4-10` | ScrollView, `padding-top: ${pdng}` (**no unit, prop never passed**), mb 40, px `h` | screen | fix; no nested ScrollView |
| Profile header card | `styles.tsx:12-20`, `index.tsx:161-178` | mt 20, r **14**, bg `backgroundGray100`, p 10/15; name OText default | identity | `Card` variant `muted` |
| Avatar | `styles.tsx:26-37`, `index.tsx:164-176` | FastImage 60×60 r 10; pencil 20 `white` overlay; fallback FA5 `user-edit` 60 `black` | avatar | `Avatar` component; `radius.md` |
| Fields | `UserFormDetails/index.tsx:357-401` | OInput mb 10; border `danger5` when **`errors.email`** (every field turns red on an email error) | form | invalid state per field |
| Password | `UserFormDetails/index.tsx:413-438` | mb 10, border `danger5` | input | — |
| Phone | `UserFormDetails/styles.tsx:31-34`, `index.tsx:444-469` | mb 25; previous-phone note 10 `error` | input | `type.caption` |
| Birthdate box | `UserFormDetails/styles.tsx:36-49`, `index.tsx:477-486` | h 55, r **15**, border `rgba(0,0,0,.1)`, bg `white`, shadow `#000` .15 r4 **on both platforms**; text `textNormal` 500 | date field | should look like `OInput` |
| Remove account | `UserFormDetails/index.tsx:497-502` | reuses `UserProfile/styles` `ListItem` (mb 24, no border); PNG `images.general.user` 16 `danger`; text 14/24 `danger`; opacity .5 when admin | destructive row | `ListRow` variant `danger` |
| Edit/Update button | `UserFormDetails/index.tsx:509-524` | class `active`/`primary`, `width:auto` | CTA | OButton |
| Loader | `UserFormDetails/index.tsx:503-507` | "Loading" OText 12 | loading | skeleton |
| Verify phone modal | `UserProfileForm/index.tsx:188-199` | `OModal` > `VerifyPhone` | OTP | `OtpInput` |

### AddressList (`AddressList/index.tsx`, `styles.tsx`, `TagOptions.tsx`)

| Element | file:line | Values today | Function | Proposal |
|---|---|---|---|---|
| Container | `styles.tsx:5-11` | ScrollView, padding `h`, pt 20, mb 40, own RefreshControl | screen | single scroll |
| Skeleton | `index.tsx:159-174` | 8 × two lines 14 high, py 10 | loading | `Skeleton` |
| Tag filter chips | `TagOptions.tsx:23-83` | min 70 max 90, py 8 px 12, **r 16**, bg **`#FFFFFF`** literal, border 1 `border` / selected `active` + bg `activeContrast`; Ionicons 18; label 12/600 capitalize | filter | `Chip` component |
| "Saved addresses" | `index.tsx:193-195` | 600, `tsize.m` | section heading | `type.sectionTitle` |
| Address row | `index.tsx:198-250`, `styles.tsx:13-18` | py 10; pin Ionicons 24 `active`/`primary`; text 12/600 same colors | selectable row | `ListRow` selectable |
| Row actions | `styles.tsx:24-46`, `index.tsx:219-248` | 30×30 r 10 bg `white` m 3, iOS shadow / Android border `rgba(0,0,0,.1)`; SimpleLineIcons 16 `textNormal`; `TouchableRipple` (react-native-paper) | icon buttons | `IconButton` + `shadow.sm` |
| Delete confirm | `index.tsx:239-249` | `OAlert` (children-trigger style) | dialog | primitive owner |
| Empty / error | `index.tsx:253-279` | `NotFoundSource` (plain / `location-outline` icon) | empty state | `EmptyState` |
| Add / Continue | `index.tsx:281-305`, `:319` | OButton `secondary` or `primary`, mt 30 | CTA | OButton |
| Commented search input | `index.tsx:181-189` | dead | — | delete |

### AddressForm (non-map parts; `AddressForm/index.tsx`, `styles.tsx`)

| Element | file:line | Values today | Function | Proposal |
|---|---|---|---|---|
| Container | `styles.tsx:3-8` | flex, padding `h`, bg `backgroundPage`, inline `overflow: scroll` | screen | — |
| Address input (places) | `index.tsx:491-519` | out of scope (third party) but styled with r **7.6**, border `primary`/`border`, fs 15, **`fontFamily: 'Poppins-Regular'`**, suggestions `#ddd`, `#fff`, r 15 | autocomplete | (map/places area) |
| GPS pin | `index.tsx:130-140`, `:771-786` | absolute top 15, `end` by **Platform.OS** and focus 30/15/10; PNG `images.general.pin` 16 `active` | locate | — |
| Inline map preview | `index.tsx:789-811` | h 189, r 7.6, mb 24 | map | out of scope |
| Internal number / zip | `index.tsx:113-120`, `:813-905` | h 50, r **10**, mb 20, 50% each, gap mr 24 | inputs | `OInput` (height from token) |
| Notes | `index.tsx:121-129`, `:907-949` | h 104, r 10, mb 20, multiline | textarea | `OTextarea` |
| "Address label" | `index.tsx:953-955` | bold, mb 10 | label | `type.label` |
| Tag pills | `styles.tsx:10-20`, `index.tsx:956-976` | p 10, r **15**, bg `backgroundGray100` / selected `activeContrast`; text **`backgroundGray300`** (a background token used for text) / `active` | tag picker | same `Chip` as AddressList |
| Submit | `index.tsx:981-997` | OButton; text Loading/Update/Continue/**Cancel** | CTA | — |
| Map modal | `index.tsx:998-1019` | out of scope | — | — |

### Languages, Sessions, MyStudents

| Screen | Element | file:line | Values today | Function | Proposal |
|---|---|---|---|---|---|
| Languages | List | `Languages/styles.tsx:4-12` | mt 20 mb 30, px `h`, bg `backgroundPage` | list | — |
| Languages | Row | `styles.tsx:14-26`, `index.tsx:56-66` | py 15; flag box r 10 p 8 border `disabled` mr 10; flag 17; name `tsize.m + 2` | radio row | `ListRow` + `Radio` |
| Languages | Radio | `styles.tsx:33-48` | 24 ring 2 `active`/`border`, dot 12 `active` | radio | `Radio` component |
| Languages | Empty | `index.tsx:75` | **"No languages available." untranslated** | empty | i18n |
| Languages | Dead | `styles.tsx:28-31` | `FlagText` unused | — | delete |
| Sessions | Container | `Sessions/styles.tsx:6-13` | padding `h`; list gap 20, mb 40 | list | — |
| Sessions | Session card | `styles.tsx:14-23`, `index.tsx:83-103` | py 15 px 20, border 1 `backgroundGray200`, r **15**; created date colored **`backgroundGray300`** (bg token for text); "Current" `active` mr 15 | row card | `Card` outline; `color.text.tertiary` |
| Sessions | Delete btn | `styles.tsx:25-43` | bg `white` r 10 p 8, iOS shadow/Android border | icon button | `IconButton` |
| Sessions | Buttons | `index.tsx:104-117`, `:130-136` | inline `textStyle fontSize 14`, mt 20 | CTA | OButton size `sm` |
| Sessions | Empty | `index.tsx:122-127` | `NotFoundSource` with `images.general.notFound` (served from **business_listing** not-found image) h = 50% window | empty | `EmptyState` + own image key |
| MyStudents | Wrapper | `StudentsList/styles.tsx:3-6` | p 16/20 | screen | `space.gutter` (16 vs 20 elsewhere) |
| MyStudents | Add button | `styles.tsx:15-19`, `index.tsx:23-27` | styled Touchable p 9/14 r 20 bg `primary`; OText 14 `white` | CTA | **OButton bypass** → OButton `sm` |
| MyStudents | Student card | `styles.tsx:21-27`, `index.tsx:37-42` | p 14/16 r 10 border `backgroundGray200 \|\| '#E9ECEF'`; name 16 bold; meta 13 `backgroundGray300 \|\| '#909BA9'` | row card | `Card` outline (same as Sessions, different radius) |
| MyStudents | Form modal | `StudentFormModal/styles.tsx:4-49`, `index.tsx:45-51,115-241` | Label **styled.Text** 14 (bypasses OText font); ReadonlyField p 16/20 r 15 shadow; dropdown `cardStyle` r 15 shadow/border; chips p 8/14 r 20 border `lightGray`/`primary` | form | `OInput`/`Field` label; `Chip` |

### NetworkError, ProjectForm

| Screen | Element | file:line | Values today | Function | Proposal |
|---|---|---|---|---|---|
| NetworkError | Page | `pages/NetworkError.tsx:7-9` | `paddingTop` android 20 / ios 0 | safe area | inset |
| NetworkError | Title / text | `NetworkError/index.tsx:22-34` | 20/700 `textNormal` mb 14; 14 `textNormal` | heading/body | `type.title` / `type.body` |
| NetworkError | Image | `index.tsx:36-41` | served `no_internet.components.image` or `images.general.noNetwork`; box `(screenW-80)*0.9 × (screenW-80)*0.8` | illustration | image key `network_error.image` |
| NetworkError | Refresh | `index.tsx:42-49` | inline r **8**, mt 45 | CTA | OButton |
| ProjectForm | Logo | `ProjectForm/index.tsx:64-74` | `images.logos.logotype`, `width/2 × width/8`, contain, mt 20 | logo | `brand.logo` key |
| ProjectForm | Label | `index.tsx:76-78` | 20 mb 20 | heading | `type.title` |
| ProjectForm | Input | `index.tsx:86-117` | placeholder/icon color **`arrowColor` (undefined)**, border **`inputSignup` (undefined)** / `error`, bg **`transparent` (undefined)**, r 7.6, icon `arrow_bar_right` | input | `OInput` |
| ProjectForm | Error | `index.tsx:119-125` | OText default color, centered | field error | danger caption |
| ProjectForm | Continue | `index.tsx:127-142`, `:161-180` | text color **`inputTextColor` (undefined)**, **`fontFamily: 'Poppins'`** 18 normal; `bgColor`/`borderColor`/`isLoading`/`imgRightSrc` props OButton does not read; r 7.6 mt 20 | CTA | OButton |

---

## Duplicates (same function, different implementation)

| Function | Implementations (file:line) | Visible differences |
|---|---|---|
| OTP / code entry | `LoginForm/Otp/index.tsx:127-135` (lib `react-native-otp-entry`); `UserVerification/index.tsx:152-178,384-403` (hidden TextInput + painted digits); `VerifyPhone/index.tsx:34-45,152-165` (4 raw TextInputs) | boxes 45×50 r8 `lightGray` fs16 vs padded Views r7.6 `disabled` fs20 vs 75×75 r8 `inputBorderColor` fs40; 6 vs 6 vs 4 digits |
| Countdown | `Otp/index.tsx:116-118` (plain 24); `UserVerification/styles.tsx:51-65` (pill r7.6 w80%, text 26); `VerifyPhone/styles.tsx:10-28` (pill r30, px80, text 30) | three looks for one timer |
| Field error text | `LoginForm/index.tsx:360` (`danger`), `:425` (`danger5`), `SignupForm/index.tsx:520,637,738` (`danger5`), `ForgotPasswordForm/index.tsx:135` (`danger5`), `Otp/index.tsx:138` (`error`, size 20), `VerifyPhone/index.tsx:175` (`error` 16), `ProjectForm/index.tsx:120` (default color) | 3 color keys (one undefined), 3 sizes, above vs below input |
| Input error border | `danger5` in Login/Signup/UserFormDetails; `error` in ProjectForm; none in Forgot | undefined key → no red border today in 3 forms |
| reCAPTCHA checkbox row | `LoginForm/index.tsx:491-510`, `SignupForm/index.tsx:600-620`, `ForgotPasswordForm/index.tsx:174-193` | icon 26/23/26, unchecked `mediumGray`/`disabled`/`mediumGray`, signup has mx 4 |
| Checkbox | MCI icons (recaptcha) vs `@react-native-community/checkbox` (signup promos/terms) vs `Radio` (Languages) | different native looks; checkbox not themeable on Android beyond tint |
| "Switch login/sign-up" link | `LoginForm/index.tsx:523-534` (centered, 14) vs `SignupForm/index.tsx:785-797` (space-between, mb30, default size) | layout and size |
| Sticky CTA bar | `LoginForm/styles.tsx:83-89` (outside form, inside ScrollView), `SignupForm/styles.tsx:30-36` (padded), `UserVerification/styles.tsx:27-37` (border-top, `#FFF`, z1000) | bg `white` vs `#FFF`; only verification has a top border |
| SMS / WhatsApp pair | `LoginForm/index.tsx:598-613`, `SignupForm/index.tsx:830-845`, `UserVerification/index.tsx:516-531` | radius default vs 7.6 |
| Screen header with logout icon | `CompleteProfile.tsx:73-80`, `UserVerification/index.tsx:321-358` | row vs absolute positioning |
| Card with "soft shadow" (iOS `#000` 0/2 .15 r4, Android border `rgba(0,0,0,.1)`) | `UserProfile/styles.tsx:16-38` (r12), `AddressList/styles.tsx:24-46` (r10), `Sessions/styles.tsx:25-43` (r10), `UserFormDetails/styles.tsx:36-49` (r15, both platforms), `StudentFormModal/styles.tsx:18-33` (r15), `StudentFormModal/index.tsx:45-51` (r15) | radius 10/12/15; Android path = border not elevation; `androidBorderColor` constant redeclared in 4 files |
| Outline row card | `Sessions/styles.tsx:14-23` (r15 p15/20), `StudentsList/styles.tsx:21-27` (r10 p14/16), `StudentOnboardingPopup/styles.tsx:7-13` (r8 p14/16) | radius 15/10/8 |
| Address tag chips | `AddressList/TagOptions.tsx` (icon + text, border, r16, bg `#FFFFFF`) vs `AddressForm/styles.tsx:16-20` + `index.tsx:956-976` (text only, no border, r15, bg `backgroundGray100`, unselected text `backgroundGray300`) | same 4 tags, two looks |
| Chip | above + `StudentFormModal/styles.tsx:40-45` (r20, border `lightGray`, filled `primary` when active) + `Forms/styles.tsx:12-19` tab (r30) | 4 pill styles |
| List row | `UserProfile` `ListItemStyle` (py18 border-bottom), `UserProfile/styles.tsx:56-61` `ListItem` (mb24, no border; used only by Remove account), `Languages` row (py15 no border), `AddressList` row (py10) | spacing and dividers differ |
| Social button | `Forms/styles.tsx:36-47` + `Forms/UIButton.tsx` (live: r30 border 2) vs dead `FacebookButton`/`GoogleButton`/`AppleButton` in `{Facebook,Google,Apple}Login/styles.tsx` (r7.6 border 1 h52) | dead copies |
| Login method tabs | live `Forms/styles.tsx:6-19` vs dead `LoginForm/styles.tsx:16-25` (`OTabs`, `OTab`, `TabBtn`, `LoginWith`, `SocialButtons`, `OrSeparator`, `LineSeparator`, `SkeletonWrapper` — none imported) | dead copies |
| Alert / confirm | `Alert` (Login/Signup), `OAlert` (AddressList), `OAlertOriginal as OAlert` (UserProfile, Sessions, UserFormDetails), `Alert.alert` (force update) | three in-app dialog components |
| Phone verification modal | `LoginForm/index.tsx:554-568`, `UserProfileForm/index.tsx:188-199`, `UserDetails/index.tsx:252-263` | same content, three hosts |
| Safe-area top on Android | `pages/NetworkError.tsx:8` (20), `pages/UserVerification.tsx:17` (20), `pages/ProjectForm.tsx:37` (30), `layouts/Container.tsx:11` (20) | hand-made insets (lessons §14) |
| Radius 7.6 | ForgotPassword, UserVerification ×5, UserFormDetails, ProjectForm ×2, AddressForm places/map | off-scale value next to r8, r10 |

---

## Blocks and pieces

| Page | Block or piece | Hideable? Movable? | Why |
|---|---|---|---|
| Welcome | Hero background | image swappable, not hideable (fallback color) | carries the screen |
| Welcome | Language pill | hideable | already hidden in practice when one language |
| Welcome | Display title | hideable / text editable | marketing copy |
| Welcome | Log in / Sign up buttons | not hideable | only way in |
| Welcome | Guest button | config `guest_checkout_enabled`, not theme | business rule |
| Tutorial | whole screen | already a flag (`config.show_tutorials`, build-time) | candidate visibility key `onboarding.tutorial` |
| Tutorial | slides 1–6 | each hideable; images editable | content |
| Login | Method tabs | hidden automatically when one method | config driven |
| Login | Forgot link | hideable (risky) | support |
| Login | Sign-up switch | hideable | closed marketplaces |
| Login | reCAPTCHA | config, not theme | security |
| Login | Social buttons (Facebook / Google / Apple) | per provider: config enables; theme could hide | each a visibility key `auth.social.<provider>` |
| Login | "Powered by" | hideable | branding; currently `usePoweredByOrdering` |
| Signup | Promotions opt-in | hideable | marketing |
| Signup | Terms row | config driven (`terms_and_conditions`) | legal, not theme |
| Signup | Social buttons | as login | — |
| UserVerification | user details form below the code | hideable? risky | lets the user fix phone/email |
| CompleteProfile | Skip link | config `canSkip` | rule |
| Profile | Quick actions card (Favorites, Cards/Addresses, My account) | section, each tile hideable, movable | candidate section `profile.quick_actions` |
| Profile | Rewards section (Cash wallet, Loyalty, Gift cards) | section hideable; served `profile.components.wallet.hidden` today | candidate section |
| Profile | My account section (Addresses, My students, Messages, Languages, Notifications) | each row hideable; served `bar_menu.messages.hidden`, `profile.languages.hidden` (inverted name `showLanguages`), `profile.notification_settings.hidden` today | candidate section |
| Profile | Information section (Help, Security, Logout) | Help/Security hideable (`bar_menu.help/sessions.hidden`), Logout not | candidate section |
| Profile | Websocket status / version | hideable | debug info |
| ProfileForm | header card (name + avatar) | hideable | cosmetic |
| ProfileForm | Remove account | not hideable (store policy requires it) | Apple guideline |
| AddressList | tag filter chips | hideable | convenience |
| AddressForm | inline map | served `address.components.map.hidden` today | — |
| AddressForm | tag picker | served `address.components.icons.hidden` today | — |
| AddressForm | internal number / zipcode / notes | served `address.components.<field>.hidden` today (`showFieldWithTheme`), overridden when required | — |
| NetworkError | image | swappable | — |

No screen in this area uses `stickyHeaderIndices` or `SectionList`; the only `FlatList` is
Languages (inside a ScrollView).

### Served v1 theme read in this area (stops applying: decision "no v1 map")

| v1 path | Reader (file:line) | Effect today |
|---|---|---|
| `homepage_view.components.homepage_header.components.image` | `Home/index.tsx:40`; also merged into `images.general.homeHero` (`src/@/components/src/utils/themeUtils.js:37`) | welcome hero |
| `no_internet.components.image` | `NetworkError/index.tsx:19` (merge writes `general.notNetwork`, the screen reads `general.noNetwork`: the merged key is never read) | network error image |
| `header.components.logo.components.image` → `images.logos.logotype` | `themeUtils.js:99-103`; read at `ProjectForm/index.tsx:69`, `Splash.tsx:53` | project screen logo |
| `business_listing_view.components.not_found_source.components.image` → `images.general.notFound` | `themeUtils.js:39`; read at `Sessions/index.tsx:125` | Sessions empty image (cross-wired) |
| `profile.components.wallet.hidden` | `UserProfile/index.tsx:70` | hides Rewards cash/points |
| `bar_menu.components.messages.hidden` / `help.hidden` / `sessions.hidden` | `UserProfile/index.tsx:71-73` | hide rows |
| `profile.components.languages.hidden` | `UserProfile/index.tsx:74` | hides Languages row |
| `profile.components.notification_settings.hidden` | `UserProfile/index.tsx:75` | hides Notifications row |
| `address.components.map.hidden`, `.icons.hidden`, `.<field>.hidden` | `AddressForm/index.tsx:198-199,540` | hides map, tags, optional fields |
| `ios.components.*`, `android.components.*` splash images | `pages/Splash.tsx:16-48` | dead page, never shown |
| `app_design.components.layout.type` | `Home/index.tsx:67` via `src/utils/appDesign.ts` | maweja switch (to delete) |

### Maweja: to delete (only `original` inventoried)

- `src/ui/src/components/Home/layouts/Maweja/index.tsx`, `MawejaLogin.tsx`, `styles.tsx`
  and the branch `Home/index.tsx:13,67-79`.
- `SignupForm` `embedded` path, used only by Maweja: `SignupForm/index.tsx:13,83-89,488-490,836,843,857,860`.
- `UserFormDetails` `mawejaCheckout`: `index.tsx:52,352-356,360-362,445-449`.
- `UserDetails` `mawejaCheckout`: `index.tsx:160-180,201-217,226`.
- Then `src/utils/logoSource.ts` (`resolveThemeLogo`) and `src/ui/src/hooks/useKeyboardInset.ts`
  lose their last readers once the other areas' maweja folders go; `src/utils/themeBrandColor.ts`
  is just `colors.primary`.

---

## Images

| Key or source | file:line | Painted box | Fit | Fallback | alt |
|---|---|---|---|---|---|
| `images.general.homeHero` (`assets/images/home-hero.png`, **1760×3824, 12.1 MB**) / served homepage image | `Home/index.tsx:83` | full screen | cover | bundled hero | none |
| `images.tutorials.slide1..6` (`slide*.png`, 1242×1708, **2.5–3.4 MB each, 18.2 MB total**) | `IntroductoryTutorial.tsx:28-63` | 100% × 70% of slide, top 40 | cover (contain if > 1080 wide) | none | none |
| `images.logos.logotype` (798×180, 30 KB) / served header logo | `ProjectForm/index.tsx:69`; `Splash.tsx:53` (dead) | `W/2 × W/8` (ProjectForm), 250×80 (Splash) | contain / default | bundled | none |
| `images.general.noNetwork` (1002×904) / served `no_internet` | `NetworkError/index.tsx:20,37-40` | `(sw-80)·0.9 × (sw-80)·0.8` | OIcon default | bundled | none |
| `images.general.notFound` (1404×1380) / served business-listing not-found | `Sessions/index.tsx:125` via `NotFoundSource/index.tsx:57-63` | 100% × 50% window height | contain | bundled | none |
| Avatar `user.photo` (API) | `UserProfileForm/index.tsx:164-168` | 60×60 r10 | FastImage default (cover) | FA5 icon 60 | none |
| Icon PNGs tinted: `general.logout` (w20), `email`, `lock`, `user` (w16 `danger`), `pin` (w16 `active`), `arrow_down` (picker, white), `arrow_bar_right` | `CompleteProfile.tsx:78`, `UserVerification/index.tsx:352,366`, `ForgotPasswordForm/index.tsx:148`, `SignupForm/index.tsx:651`, `UserFormDetails/index.tsx:499`, `AddressForm/index.tsx:782`, `LanguageSelector/index.tsx:93`, `ProjectForm/index.tsx:92` | 16–20 | tint | none | none |
| Country flags (`shared/CountryFlag`, emoji) | `Languages/index.tsx:59`, `LanguageSelector/index.tsx:67` | 17 / 11 | — | none | none |
| Served splash images by density | `Splash.tsx:16-48` | 250×80 | — | logotype | dead page |

Findings: the welcome hero (12 MB) and the six tutorial slides (18 MB) are far heavier than
their painted size on a phone; no image in the area has an accessibility label; the same
logo is painted at 250×80 (Splash) and `W/2 × W/8` (ProjectForm).

Icon sets in the area: Ionicons (Profile, AddressList, NotFoundSource, TagOptions),
MaterialCommunityIcons (eye, recaptcha, UserDetails), SimpleLineIcons (address actions),
AntDesign (tutorial arrow, Sessions close), FontAwesome5 (social, avatar fallback),
Foundation (NotFoundSource default). Sizes literal: 16, 18, 20, 23, 24, 26, 28, 40, 60.

---

## Theme keys read but not defined (paint nothing today)

| Key | Readers | Effect |
|---|---|---|
| `colors.danger5` | `LoginForm/index.tsx:382,427,452`; `SignupForm/index.tsx:522,541,639,677,739`; `ForgotPasswordForm/index.tsx:137`; `UserFormDetails/index.tsx:396,431` (11 reads) | error texts fall back to OText default color; error borders are `undefined` → default border (Signup passes `theme.colors.border` only when no error) |
| `colors.colorTextTutorial` | `IntroductoryTutorial.tsx:86,99` | tutorial title/body use platform default color |
| `colors.arrowColor` | `ProjectForm/index.tsx:90,93` | placeholder and icon default |
| `colors.inputSignup` | `ProjectForm/index.tsx:105` | border color undefined |
| `colors.transparent` | `ProjectForm/index.tsx:106` | bg undefined |
| `colors.inputTextColor` | `ProjectForm/index.tsx:133` | button text color undefined |

Defined-key misuse: `backgroundGray300` used as a **text** color (`AddressForm/index.tsx:969`,
`Sessions/index.tsx:87`, `StudentsList/index.tsx:39`); `disabled` used as secondary text
color (UserVerification, CompleteProfile, Tabs); `active`/`activeContrast` are overwritten
by the merge to `primary`/`lightPrimary` on the app (`themeUtils.js:160-165`).
`theme.utils.typography.*` (screenTitle, sectionTitle…) exists in `theme.json` but no file in
this area reads it.

Props passed to OButton that it does not read: `isDisabled`, `isLoading`, `imgRightSrc`
(ForgotPassword, ProjectForm), `bgColor`, `borderColor` (ProjectForm) — so those buttons
show no loading/disabled state. `Otp.defaultProps` (`Otp/index.tsx:161`) is ignored on a
function component (lessons §8); harmless because callers pass `pinCount`.

---

## Off the scale or without a token

| Value | Where | Why it does not fit |
|---|---|---|
| radius 7.6 | ForgotPassword, UserVerification, UserFormDetails, ProjectForm, AddressForm | between 5 (`radius.m`) and 10 (`radius.l`); clearly meant as 8 |
| radius 12, 14, 15, 16, 20, 30, 44, 50 | UserProfile, UserProfileForm, Sessions, TagOptions, StudentsList, Forms tabs/social, NotFoundSource badge, LanguageSelector | too many levels: proposal `sm 8 / md 12 / lg 16 / pill 999` |
| `#003B2C` | `LanguageSelector/index.tsx:34` | brand green outside the palette |
| `'gray'`, `'lightgray'`, `'black'`, `#fff`, `#FFF`, `#FFFFFF`, `#000000`, `#959595`, `#E9ECEF`, `#909BA9`, `#ddd`, `#efeff1`, `#c8c7cc`, `#666` | Forgot, Tutorial, AppleLogin, Forms, UserVerification, TagOptions, UIButton, AddressMapBoxList, StudentsList fallbacks, places input | literals; fallbacks after `\|\|` are dead once tokens are complete |
| `rgba(0,0,0,0.1)` + shadow `#000` 0/2/.15/4 | 6 places (see duplicates) | one `shadow.sm` token with Android elevation |
| font sizes 13, 15, 22, 24, 26, 30, 40, 56 (+ responsive 28–56) | StudentsList, Tutorial, CompleteProfile, Otp, UserVerification, VerifyPhone, Welcome | beyond `tsize` (12/14/16/20/25/30/36) |
| `tsize.m + 2` (18) | UserProfile, Languages | arithmetic on a token |
| font weight `'300'` | Forgot lead, Tutorial buttons | Light file to be dropped (decisions: weights 400–700) |
| `fontFamily: 'Poppins'` / `'Poppins-Regular'` | Tutorial ×2, ProjectForm, AddressForm places | hard-coded family; `'Poppins'` does not exist on Android |
| spacing 3, 5, 9, 14, 18, 25, 28, 45, 50, 80 | Login/Signup/Forgot/UserVerification/NetworkError/AddressList | off a 4-pt scale |
| sizes from window: `W*0.85`, `H*0.22`, `H*0.13`, `W*0.29`, `W*0.45`, `W*0.7`, `width*0.3`, `width*0.04`, `(sw-80)*0.9` | Tutorial, Forms social, LanguageSelector, NetworkError | layout math, keep in code but not as theme values |
| z-index 1000 / 1002 / 100 / 30/20/10 | UserVerification, AddressForm, StudentFormModal | stacking, not theme |

---

## Not verified

- Nothing was run: no simulator, no screenshots, no iOS vs Android check, no small phone
  (SE) vs large phone, no RTL. Everything above is from code reading.
- Whether `OInput` actually paints `borderColor={null}`/`undefined` as its default border
  (owned by the primitives agent); the visible effect of the `danger5` bug depends on it.
- How the tutorial's `Pager` overlay lays out the buttons and dots
  on each platform (the `Platform.OS` offsets suggest they differ).
- Whether nested ScrollViews (Signup, ProfileForm, AddressList, Sessions, MyStudents,
  Languages FlatList) produce scroll or keyboard bugs at run time.
- Whether `usePoweredByOrdering` is ever true in production builds.
- The served v1 keys listed above were found by reading the readers; no real v1 theme
  payload was inspected to confirm which keys merchants actually set.
- `Splash`, `SpinnerLoader` and `NotFound` pages were judged dead by grep (no navigator
  registers them, no import); deep-link config in `TemplateApp.tsx` was not re-checked for
  string screen names.
- Social login controllers (`FacebookLogin`, `GoogleLogin`, `AppleLogin` index files)
  were read only for the props they pass to `UIButton`; native SDK buttons were not checked.
- `StudentOnboardingPopup` (shown from business/product screens) and `CheckoutStudentDetails`
  belong to other areas; only their shared styles were compared here.
- The Maweja screens were not inventoried (decision: delete).
