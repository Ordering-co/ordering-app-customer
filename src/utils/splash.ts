import BootSplash from 'react-native-bootsplash'
import splashConfig from '../splash.json'

/**
 * The launch splash (docs/SPLASH.md). The native one (react-native-bootsplash:
 * a logo over a color, iOS's BootSplash.storyboard and Android's BootTheme)
 * shows from the first frame. In image mode (`src/splash.json` `mode: "image"`)
 * a full-screen image (AppSplash) takes over once it has loaded and stays until
 * the app is ready.
 *
 * The app is ready when it has loaded its data (RootNavigator) or when the API
 * is out of reach and the connection screen shows (ApiConnectionGate): both
 * call `hideSplash()`. A safety timeout (`SPLASH_MAX_MS`, armed by AppSplash)
 * hides it anyway, so the splash never stays stuck.
 */

export type SplashMode = 'logo' | 'image'

export const readSplashMode = (config: unknown): SplashMode =>
  (config as { mode?: unknown } | null)?.mode === 'image' ? 'image' : 'logo'

export const splashMode: SplashMode = readSplashMode(splashConfig)

/** The longest the splash stays, whatever happens. */
export const SPLASH_MAX_MS = 10000

let ready = false
const listeners = new Set<() => void>()

/** Hides the native splash, fading (once is enough: it is safe to call again). */
const hideNative = () => {
  BootSplash.hide({ fade: true }).catch(() => undefined)
}

/**
 * The app is ready: the splash goes. The native splash is hidden on every
 * call (hiding it again is harmless: in image mode it has gone already when
 * the image loaded), so a splash shown again by a recreated activity or scene
 * never stays; the listeners run once per launch.
 */
export const hideSplash = () => {
  hideNative()
  if (ready) return
  ready = true
  listeners.forEach(listener => listener())
  listeners.clear()
}

/**
 * A new launch of the app's root (AppSplash mounting): the native splash is
 * up again (a recreated Android activity or iOS scene shows it while the JS
 * runtime lives on), so the app is not ready yet.
 */
export const resetSplash = () => {
  ready = false
  listeners.clear()
}

export const isSplashDone = () => ready

/** Calls `listener` once the app is ready (at once if it is); returns the unsubscribe. */
export const onSplashDone = (listener: () => void) => {
  if (ready) {
    listener()
    return () => undefined
  }
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

/** Image mode: the full-screen image has loaded under the native splash, which fades out to it. */
export const revealSplashImage = () => {
  hideNative()
}

/** Hides the splash after `SPLASH_MAX_MS` if the app has not by then; returns the cancel. */
export const armSplashTimeout = (ms = SPLASH_MAX_MS) => {
  const timer = setTimeout(hideSplash, ms)
  return () => clearTimeout(timer)
}
