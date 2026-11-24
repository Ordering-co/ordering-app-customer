import React from 'react'
import { AppState, Platform } from 'react-native'
import { act, render } from '@testing-library/react-native'
import { useConfig } from '@components'
import { useApiConnection } from '..'
import { RefreshConfigsOnResume } from '../RefreshConfigsOnResume'

jest.mock('@components', () => ({ useConfig: jest.fn() }))
jest.mock('..', () => ({ useApiConnection: jest.fn() }))

describe('RefreshConfigsOnResume', () => {
  const refreshConfigs = jest.fn()
  const originalPlatform = Platform.OS
  const originalCurrentState = Object.getOwnPropertyDescriptor(AppState, 'currentState')
  let appStateListener: ((state: any) => void) | null = null
  let removeListener: jest.Mock

  beforeEach(() => {
    Object.defineProperty(AppState, 'currentState', { configurable: true, value: 'active' })
    appStateListener = null
    removeListener = jest.fn()
    refreshConfigs.mockReset().mockResolvedValue(undefined)
    ;(useConfig as jest.Mock).mockReturnValue([{ loading: false, configs: {} }, { refreshConfigs }])
    ;(useApiConnection as jest.Mock).mockReturnValue({ status: 'online' })
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
      appStateListener = listener as (state: any) => void
      return { remove: removeListener }
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform })
    if (originalCurrentState) Object.defineProperty(AppState, 'currentState', originalCurrentState)
  })

  it('refreshes remote configs when the online app returns to the foreground', () => {
    const view = render(<RefreshConfigsOnResume isFocused />)
    refreshConfigs.mockClear()

    act(() => {
      appStateListener?.('background')
      appStateListener?.('active')
    })

    expect(refreshConfigs).toHaveBeenCalledTimes(1)
    view.unmount()
    expect(removeListener).toHaveBeenCalledTimes(1)
  })

  it('refreshes remote configs when Login becomes focused while online', () => {
    const view = render(<RefreshConfigsOnResume isFocused={false} />)
    expect(refreshConfigs).not.toHaveBeenCalled()

    view.rerender(<RefreshConfigsOnResume isFocused />)

    expect(refreshConfigs).toHaveBeenCalledTimes(1)
  })

  it('refreshes when iOS moves from inactive to active', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' })
    render(<RefreshConfigsOnResume isFocused />)
    refreshConfigs.mockClear()

    act(() => {
      appStateListener?.('inactive')
      appStateListener?.('active')
    })

    expect(refreshConfigs).toHaveBeenCalledTimes(1)
  })

  it('does not refresh configs while the API is not online', () => {
    ;(useApiConnection as jest.Mock).mockReturnValue({ status: 'unreachable' })
    render(<RefreshConfigsOnResume isFocused />)

    act(() => {
      appStateListener?.('background')
      appStateListener?.('active')
    })

    expect(refreshConfigs).not.toHaveBeenCalled()
  })

  it('uses the current refresh callback and API status after rerender', () => {
    const staleRefreshConfigs = jest.fn().mockResolvedValue(undefined)
    const offlineRefreshConfigs = jest.fn().mockResolvedValue(undefined)
    const currentRefreshConfigs = jest.fn().mockResolvedValue(undefined)

    ;(useConfig as jest.Mock).mockReturnValue([{}, { refreshConfigs: staleRefreshConfigs }])
    const view = render(<RefreshConfigsOnResume isFocused={false} />)

    ;(useConfig as jest.Mock).mockReturnValue([{}, { refreshConfigs: offlineRefreshConfigs }])
    ;(useApiConnection as jest.Mock).mockReturnValue({ status: 'unreachable' })
    view.rerender(<RefreshConfigsOnResume isFocused={false} />)

    act(() => {
      appStateListener?.('background')
      appStateListener?.('active')
    })

    expect(staleRefreshConfigs).not.toHaveBeenCalled()
    expect(offlineRefreshConfigs).not.toHaveBeenCalled()

    ;(useConfig as jest.Mock).mockReturnValue([{}, { refreshConfigs: currentRefreshConfigs }])
    ;(useApiConnection as jest.Mock).mockReturnValue({ status: 'online' })
    view.rerender(<RefreshConfigsOnResume isFocused />)
    expect(currentRefreshConfigs).toHaveBeenCalledTimes(1)

    act(() => {
      appStateListener?.('inactive')
      appStateListener?.('active')
    })

    expect(staleRefreshConfigs).not.toHaveBeenCalled()
    expect(offlineRefreshConfigs).not.toHaveBeenCalled()
    expect(currentRefreshConfigs).toHaveBeenCalledTimes(2)
  })
})
