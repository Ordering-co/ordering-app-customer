import React from 'react'
import * as ReactNative from 'react-native'
import * as StyledComponents from 'styled-components/native'
import { act, fireEvent, render } from '@testing-library/react-native'

/**
 * A fresh splash module (its "ready" state), component and bootsplash mock;
 * React, React Native and styled-components stay the renderer's.
 */
const load = () => {
  let AppSplash!: typeof import('..').AppSplash
  let splash!: typeof import('@/utils/splash')
  let BootSplash!: { hide: jest.Mock }
  jest.isolateModules(() => {
    jest.doMock('react', () => React)
    jest.doMock('react-native', () => ReactNative)
    jest.doMock('styled-components/native', () => StyledComponents)
    AppSplash = require('..').AppSplash
    splash = require('@/utils/splash')
    BootSplash = require('react-native-bootsplash').default
  })
  return { AppSplash, splash, BootSplash }
}

beforeEach(() => jest.useFakeTimers())
afterEach(() => jest.useRealTimers())

describe('AppSplash', () => {
  it('paints nothing in logo mode, and the app being ready hides the native splash', () => {
    const { AppSplash, splash, BootSplash } = load()
    const view = render(<AppSplash mode="logo" />)
    expect(view.queryByTestId('app-splash')).toBeNull()
    act(() => splash.hideSplash())
    expect(BootSplash.hide).toHaveBeenCalledWith({ fade: true })
  })

  it('in image mode paints the image, fades the native splash out once it has loaded, and goes once the app is ready', () => {
    const { AppSplash, splash, BootSplash } = load()
    const view = render(<AppSplash mode="image" />)
    const layer = view.getByTestId('app-splash')
    expect(BootSplash.hide).not.toHaveBeenCalled()

    fireEvent(layer.children[0] as any, 'loadEnd')
    expect(BootSplash.hide).toHaveBeenCalledWith({ fade: true })
    expect(view.queryByTestId('app-splash')).not.toBeNull()

    act(() => splash.hideSplash())
    act(() => { jest.runAllTimers() })
    expect(view.queryByTestId('app-splash')).toBeNull()
  })

  it('hides the splash after the safety timeout if the app never gets ready', () => {
    const { AppSplash, splash, BootSplash } = load()
    const view = render(<AppSplash mode="image" />)
    act(() => { jest.advanceTimersByTime(splash.SPLASH_MAX_MS) })
    expect(splash.isSplashDone()).toBe(true)
    expect(BootSplash.hide).toHaveBeenCalledWith({ fade: true })
    act(() => { jest.runAllTimers() })
    expect(view.queryByTestId('app-splash')).toBeNull()
  })

  it('reveals the image when it fails to load too (Android sends only onError)', () => {
    const { AppSplash, BootSplash } = load()
    const view = render(<AppSplash mode="image" />)
    fireEvent(view.getByTestId('app-splash').children[0] as any, 'error', { nativeEvent: { error: 'decode' } })
    expect(BootSplash.hide).toHaveBeenCalledWith({ fade: true })
  })

  it('a remount (a recreated activity or scene) is a new launch: the app being ready hides the splash again', () => {
    const { AppSplash, splash, BootSplash } = load()
    const first = render(<AppSplash mode="image" />)
    act(() => splash.hideSplash())
    act(() => { jest.runAllTimers() })
    first.unmount()
    BootSplash.hide.mockClear()

    const second = render(<AppSplash mode="image" />)
    expect(splash.isSplashDone()).toBe(false)
    expect(second.queryByTestId('app-splash')).not.toBeNull()
    act(() => splash.hideSplash())
    expect(BootSplash.hide).toHaveBeenCalledWith({ fade: true })
    act(() => { jest.runAllTimers() })
    expect(second.queryByTestId('app-splash')).toBeNull()
  })
})
