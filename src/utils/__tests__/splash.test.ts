/**
 * The launch splash's module (src/utils/splash.ts): hiding on every call, the
 * listeners once per launch, the reset of a new launch, the safety timeout and the mode of src/splash.json.
 */

type SplashModule = typeof import('../splash')

/** A fresh copy of the module (its "ready" state) and of the bootsplash mock. */
const load = (config?: unknown) => {
  let splash!: SplashModule
  let BootSplash!: { hide: jest.Mock }
  jest.isolateModules(() => {
    if (config !== undefined) jest.doMock('../../splash.json', () => config)
    splash = require('../splash')
    BootSplash = require('react-native-bootsplash').default
  })
  return { splash, BootSplash }
}

afterEach(() => {
  jest.dontMock('../../splash.json')
  jest.useRealTimers()
})

describe('splash', () => {
  it('reads the mode of src/splash.json, logo by default', () => {
    expect(load().splash.splashMode).toBe('logo')
    expect(load({ mode: 'image' }).splash.splashMode).toBe('image')
    expect(load({ mode: 'video' }).splash.splashMode).toBe('logo')
    expect(load({}).splash.splashMode).toBe('logo')
  })

  it('reads any value as a mode', () => {
    const { splash } = load()
    expect(splash.readSplashMode({ mode: 'image' })).toBe('image')
    expect(splash.readSplashMode({ mode: 'logo' })).toBe('logo')
    expect(splash.readSplashMode(null)).toBe('logo')
    expect(splash.readSplashMode(undefined)).toBe('logo')
  })

  it('hides the native splash, fading, every time the app says it is ready', () => {
    const { splash, BootSplash } = load()
    expect(splash.isSplashDone()).toBe(false)
    splash.hideSplash()
    splash.hideSplash()
    expect(splash.isSplashDone()).toBe(true)
    // A recreated activity or scene shows the native splash again: it is hidden again
    expect(BootSplash.hide).toHaveBeenCalledTimes(2)
    expect(BootSplash.hide).toHaveBeenCalledWith({ fade: true })
  })

  it('starts a new launch on reset: not ready, and its listeners are told again', () => {
    const { splash } = load()
    const first = jest.fn()
    splash.onSplashDone(first)
    splash.hideSplash()
    splash.resetSplash()
    expect(splash.isSplashDone()).toBe(false)
    const second = jest.fn()
    splash.onSplashDone(second)
    expect(second).not.toHaveBeenCalled()
    splash.hideSplash()
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('tells each listener once, and at once a listener that comes after', () => {
    const { splash } = load()
    const before = jest.fn()
    const gone = jest.fn()
    splash.onSplashDone(before)
    const unsubscribe = splash.onSplashDone(gone)
    unsubscribe()
    splash.hideSplash()
    splash.hideSplash()
    expect(before).toHaveBeenCalledTimes(1)
    expect(gone).not.toHaveBeenCalled()

    const after = jest.fn()
    splash.onSplashDone(after)
    expect(after).toHaveBeenCalledTimes(1)
  })

  it('reveals the image by hiding the native splash, without the app being ready', () => {
    const { splash, BootSplash } = load({ mode: 'image' })
    splash.revealSplashImage()
    expect(BootSplash.hide).toHaveBeenCalledWith({ fade: true })
    expect(splash.isSplashDone()).toBe(false)
  })

  it('hides the splash after the safety timeout if the app never gets ready', () => {
    jest.useFakeTimers()
    const { splash, BootSplash } = load()
    splash.armSplashTimeout()
    jest.advanceTimersByTime(splash.SPLASH_MAX_MS - 1)
    expect(splash.isSplashDone()).toBe(false)
    jest.advanceTimersByTime(1)
    expect(splash.isSplashDone()).toBe(true)
    expect(BootSplash.hide).toHaveBeenCalledTimes(1)
  })

  it('does not fire the safety timeout once cancelled', () => {
    jest.useFakeTimers()
    const { splash } = load()
    const cancel = splash.armSplashTimeout()
    cancel()
    jest.advanceTimersByTime(splash.SPLASH_MAX_MS)
    expect(splash.isSplashDone()).toBe(false)
  })
})
