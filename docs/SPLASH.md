# Launch splash

The splash is [react-native-bootsplash](https://github.com/zoontek/react-native-bootsplash) 7: a native screen, shown from the first frame and kept over the app until JS hides it. It has two modes, picked per brand in `src/splash.json`:

| Mode | `src/splash.json` | What shows |
|------|-------------------|------------|
| Logo (default) | `{ "mode": "logo" }` | The logo centered on a color, the same on iOS and Android (on every Android version bootsplash draws it over the window from the first frame, so it looks the same as Android 12+'s system splash, which it replaces at once). When the app is ready it fades out to the app. |
| Image | `{ "mode": "image" }` | A full-screen image (cover). iOS shows it from the first frame (it is in the launch screen); Android shows the logo splash first and fades to the image once it has loaded (Android 12+ cannot show a full-screen image in its system splash). When the app is ready the image fades out. |

All the files are at fixed paths: the Builder replaces them per brand, nothing has a hash in its name.

## When it hides

`src/utils/splash.ts` `hideSplash()` (once, whoever calls first):

- `src/navigators/RootNavigator.tsx`: the app has loaded its data (`loaded && tutorialReady`);
- `src/contexts/ApiConnectionContext/ApiConnectionGate.tsx`: the API is out of reach, the connection screen shows;
- a safety timeout (`SPLASH_MAX_MS`, 10 s, armed by `AppSplash`), so the splash never stays stuck.

`src/ui/src/components/AppSplash` is mounted last in `src/TemplateApp.tsx` (over everything, outside the theme). In image mode it paints `src/assets/splash/splash_image.png`; when the image has loaded (`onLoadEnd`) it hides the native splash with a fade (on iOS the native one shows the same image, so nothing changes), and when the app is ready it fades out (the theme's default `base` motion) and unmounts. In logo mode it paints nothing.

## Files

### Logo mode (always present)

| File | What | Size |
|------|------|------|
| `assets/bootsplash/logo-source.png` | Source: the logo, square, transparent background, edge to edge (today the Ordering ring, 1024×1024). Not bundled: every logo below comes from it. | any square, ≥ 480 px |
| `android/app/src/main/res/drawable-<density>/bootsplash_logo.png` | Android: a transparent square canvas of **288 dp** with the logo, **120 dp** wide, centered. | mdpi 288 (logo 120), hdpi 432 (180), xhdpi 576 (240), xxhdpi 864 (360), xxxhdpi 1152 (480) px |
| `android/app/src/main/res/values/colors.xml` | Android background: `<color name="bootsplash_background">#FFFFFF</color>`, the one place (text replacement). | |
| `ios/ReactNativeAppsTemplate5/Images.xcassets/BootSplashLogo.imageset/logo.png`, `logo@2x.png`, `logo@3x.png` | iOS: the logo, 120 pt wide (the storyboard's `BootSplashLogo`). | 120, 240, 360 px |
| `ios/ReactNativeAppsTemplate5/BootSplash.storyboard` | iOS background: the one `<color key="backgroundColor" red="1" green="1" blue="1" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>` of the view (sRGB components 0–1: `#RRGGBB` → `RR/255`…). | |

**Logo size.** Android 12+'s splash shows a 288 dp icon area masked to a **192 dp** circle; a square logo must fit in it (its diagonal ≤ 192 dp, so ≤ ~134 dp wide). 120 dp leaves room for any square logo; the ring, being round, could go up to ~190 dp. Keep the same width on iOS (120 pt) so both look alike. A non-square logo: fit it into the 120 square (the CLI keeps the aspect ratio: height = 120 × h / w).

### Image mode (in addition)

| File | What | Size |
|------|------|------|
| `src/splash.json` | `{ "mode": "image" }` | |
| `src/assets/splash/splash_image.png` | The image the app paints (cover, the whole screen). Default: the Ordering wordmark on white. | 1290×2796 portrait (the largest iPhone at @3x); keep it light (PNG with few colors or a JPEG-quality PNG; under ~1 MB) |
| `ios/ReactNativeAppsTemplate5/Images.xcassets/SplashFullImage.imageset/splash_full.png` | The same image, in the launch screen (aspect fill, to the screen edges, over the logo). In logo mode it is a transparent 1×1 PNG, so only the logo shows. `Contents.json` declares the one file at `3x` and stays as it is (declared without a scale, the launch screen showed the logo instead of the image in the simulator). | same as above |

In image mode the logo files and the colors stay: Android shows them until the image has loaded, and the background color is what shows if the image has transparency.

## Native wiring (fixed, not replaced)

- iOS: `Info.plist` `UILaunchStoryboardName` = `BootSplash`; `AppDelegate.swift` `ReactNativeDelegate.customize(_:)` calls `RNBootSplash.initWithStoryboard("BootSplash", rootView:)`, which keeps the storyboard over the app until `hide()`.
- Android: `AndroidManifest.xml` `MainActivity` theme `@style/BootTheme` (`res/values/styles.xml`, parent `Theme.BootSplash`, then `AppTheme`); `MainActivity.kt` calls `RNBootSplash.init(this, R.style.BootTheme)` before `super.onCreate`.

## Regenerating with the CLI

```bash
corepack pnpm exec react-native-bootsplash generate assets/bootsplash/logo-source.png \
  --platforms=android,ios --background=FFFFFF --logo-width=120 \
  --assets-output=<a temporary folder>
```

The CLI writes names with a hash (`BootSplashLogo-<hash>.imageset`, `logo-<hash>.png`, `Colors.xcassets/BootSplashBackground-<hash>.colorset`), rewrites `BootSplash.storyboard` (losing the `SplashFullImage` view), reformats `AndroidManifest.xml` and adds `Colors.xcassets` to the Xcode project. After running it, put back the fixed names above: rename the imageset and its PNGs, restore `BootSplash.storyboard` from git, delete `Colors.xcassets` and its entries in `project.pbxproj`, and keep only the theme change in the manifest. `--assets-output` takes the generic assets (`logo@Nx.png`, `manifest.json`, for `useHideAnimation`), which the app does not use.

## iOS launch screen cache

iOS caches the launch screen. With fixed file names, a device that updates an app whose splash changed may show the old one until the app is reinstalled or the device restarts (the CLI's hashes exist to avoid this). A new brand is a new app (fresh install), so this only matters when a brand changes its splash between versions.
