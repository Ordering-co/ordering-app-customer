# App icons

The launcher icons are plain resources at fixed paths. The Builder replaces these files per brand; nothing in the code refers to them except `AndroidManifest.xml` (`android:icon="@mipmap/ic_launcher"`, `android:roundIcon="@mipmap/ic_launcher_round"`) and the iOS asset catalog.

## Source

| File | What |
|------|------|
| `assets/icons/foreground.png` | 1024×1024 RGBA: the mark (Ordering ring) on a transparent background, edge to edge. Every Android icon is derived from it. |
| `ios/ReactNativeAppsTemplate5/Images.xcassets/AppIcon.appiconset/icon-1024.png` | 1024×1024 RGB, the store icon: the mark on its opaque background. |

## iOS

A single-size app icon (Xcode 14+): Xcode generates every size from one 1024 image.

| File | Size | Notes |
|------|------|-------|
| `AppIcon.appiconset/icon-1024.png` | 1024×1024 | **No alpha channel** (RGB). The mark at 80 % of the side, centered on the background color, so the iOS corner mask never clips it. |
| `AppIcon.appiconset/Contents.json` | | One entry: `{"filename":"icon-1024.png","idiom":"universal","platform":"ios","size":"1024x1024"}` |

> **The iOS icon must not have an alpha channel**, even when every pixel is opaque: App Store Connect rejects the upload (ITMS-90717, "Invalid large app icon"). Flatten it on the background color and save as RGB (`sips -g hasAlpha icon-1024.png` must print `no`). iOS rounds the corners itself: give a full square, never pre-rounded corners or transparency.

## Android

minSdk 24. Android 8+ (API 26) uses the adaptive icon; API 24–25 use the legacy PNGs.

### Adaptive icon (API 26+)

| File | Content |
|------|---------|
| `res/mipmap-anydpi-v26/ic_launcher.xml`, `ic_launcher_round.xml` | `<adaptive-icon>` with background `@color/ic_launcher_background`, foreground `@mipmap/ic_launcher_foreground`, monochrome `@mipmap/ic_launcher_monochrome`. Fixed, not replaced. |
| `res/values/ic_launcher_background.xml` | `<color name="ic_launcher_background">#FFFFFF</color>`: the background color, its own file so it can be replaced as text. |
| `res/mipmap-<density>/ic_launcher_foreground.png` | 108 dp, transparent background, the mark centered at 50 % of the side (54 dp). |
| `res/mipmap-<density>/ic_launcher_monochrome.png` | Same geometry as the foreground: the mark's silhouette in opaque white on transparent (Android 13+ themed icons tint it). |

| Density | Foreground / monochrome (108 dp) | Legacy (48 dp) |
|---------|------|------|
| mdpi | 108 px | 48 px |
| hdpi | 162 px | 72 px |
| xhdpi | 216 px | 96 px |
| xxhdpi | 324 px | 144 px |
| xxxhdpi | 432 px | 192 px |

**Safe zone.** The launcher masks the 108 dp layer to a shape (circle, squircle, rounded square) showing roughly the inner 72 dp, and only a centered circle of **66 dp** diameter is guaranteed visible; the outer 18 dp per side are for parallax/bleed. The mark must fit in that circle: the ring is 50 % of the side (54 dp), leaving 6 dp of air per side inside the 66 dp circle. Anything over ~61 % gets clipped on a circular mask, and close to it looks cramped.

### Legacy icon (API 24–25)

| File | Content |
|------|---------|
| `res/mipmap-<density>/ic_launcher.png` | 48 dp, opaque square: the mark at 80 % on the background color. |
| `res/mipmap-<density>/ic_launcher_round.png` | 48 dp, background-colored disc (transparent outside), the mark at 68 % inside. |

There is no `ldpi` folder: no current device uses it, Android scales from mdpi.

## What the Builder replaces

| Input | Files written |
|-------|---------------|
| Store icon, 1024 opaque | `AppIcon.appiconset/icon-1024.png` (mark at 80 %, centered, flattened on the background color, RGB, no alpha). |
| Adaptive foreground (transparent PNG, the mark) | `assets/icons/foreground.png`; `mipmap-*/ic_launcher_foreground.png` (mark at 50 % of the side, centered); `mipmap-*/ic_launcher.png` and `ic_launcher_round.png` (legacy, mark on the background color). |
| Background color | `values/ic_launcher_background.xml` (text replacement of `#FFFFFF`). |
| Monochrome | Derived from the foreground: its alpha channel, filled white (`mipmap-*/ic_launcher_monochrome.png`). |

The `mipmap-anydpi-v26/*.xml`, the `Contents.json` and the manifest stay as they are.

## Android: notification icon

Android draws a notification's small icon as a **silhouette**: it keeps only the alpha and tints it (a color icon shows as a gray square or circle). The app's is `res/drawable-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/ic_stat_onesignal_default.png`: the ring in white on transparent, 24 dp with 20 dp of content (24, 36, 48, 72, 96 px).

It is used by:

- OneSignal, which picks `ic_stat_onesignal_default` by name;
- Firebase Cloud Messaging in the background (`com.google.firebase.messaging.default_notification_icon` in `AndroidManifest.xml`);
- the notifications the app shows itself in the foreground (`smallIcon` in `src/navigators/RootNavigator.tsx`).

**Builder:** the brand uploads a white silhouette on transparent (1024 × 1024, the shape alone, no background or text) and the build resizes it to the five densities. A color logo does not work here.

