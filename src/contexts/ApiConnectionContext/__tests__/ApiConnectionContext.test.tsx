import React from 'react'
import { Text } from 'react-native'
import { act, render } from '@testing-library/react-native'

const netState = { isConnected: true }
let netListener: ((state: any) => void) | null = null
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn(() => Promise.resolve(netState)),
    addEventListener: jest.fn((listener: any) => { netListener = listener; return () => { netListener = null } }),
  },
}))

import { ApiConnectionProvider, RETRY_STEPS, isNetworkErrorContent, probeApi, retryDelay, useApiConnection } from '..'

const Probe = () => {
  const { status, down, generation, nextRetryAt } = useApiConnection()
  return <Text testID='state'>{JSON.stringify({ status, down, generation, retry: nextRetryAt !== null })}</Text>
}
const state = (view: any) => JSON.parse(view.getByTestId('state').props.children)

const flush = async () => { await act(async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve() }) }

describe('ApiConnectionContext', () => {
  const fetchMock = jest.fn()
  beforeEach(() => {
    jest.useFakeTimers()
    netState.isConnected = true
    fetchMock.mockReset()
    ;(global as any).fetch = fetchMock
  })
  afterEach(() => jest.useRealTimers())

  it('retries 5, 10, 20, 40 s and then every minute', () => {
    expect(RETRY_STEPS).toEqual([5, 10, 20, 40, 60])
    expect([0, 1, 2, 3, 4, 5, 9].map(retryDelay)).toEqual([5000, 10000, 20000, 40000, 60000, 60000, 60000])
  })

  it('takes any HTTP answer as reachable and only a failure as out of reach', async () => {
    fetchMock.mockResolvedValueOnce({ status: 401 })
    await expect(probeApi('http://api/x')).resolves.toBe(true)
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'))
    await expect(probeApi('http://api/x')).resolves.toBe(false)
  })

  it('is not down while the first check runs, goes down when the API does not answer, and retries on its own until it does', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'))
    const view = render(<ApiConnectionProvider probeUrl='http://api/x'><Probe /></ApiConnectionProvider>)
    expect(state(view)).toMatchObject({ down: false })
    await flush()
    expect(state(view)).toMatchObject({ status: 'unreachable', down: true, retry: true, generation: 0 })

    // The first automatic retry, 5 s later, still fails.
    await act(async () => { jest.advanceTimersByTime(5000) })
    await flush()
    expect(state(view)).toMatchObject({ status: 'unreachable', down: true })
    expect(fetchMock).toHaveBeenCalledTimes(2)

    // The API is back: the next retry (10 s) finds it and the tree reloads.
    fetchMock.mockResolvedValue({ status: 200 })
    await act(async () => { jest.advanceTimersByTime(10000) })
    await flush()
    expect(state(view)).toMatchObject({ status: 'online', down: false, generation: 1, retry: false })
  })

  it('goes offline without the phone network and checks at once when it comes back', async () => {
    fetchMock.mockResolvedValue({ status: 200 })
    const view = render(<ApiConnectionProvider probeUrl='http://api/x'><Probe /></ApiConnectionProvider>)
    await flush()
    expect(state(view)).toMatchObject({ status: 'online', down: false })

    await act(async () => { netListener && netListener({ isConnected: false }) })
    expect(state(view)).toMatchObject({ status: 'offline', down: true })

    await act(async () => { netListener && netListener({ isConnected: true }) })
    await flush()
    expect(state(view)).toMatchObject({ status: 'online', down: false, generation: 1 })
  })

  it('recognises the network error the logic reports', () => {
    expect(isNetworkErrorContent('Network error', 'Error de red')).toBe(true)
    expect(isNetworkErrorContent(['Error de red'], 'Error de red')).toBe(true)
    expect(isNetworkErrorContent('Network request failed', 'Network error')).toBe(true)
    expect(isNetworkErrorContent('The product is not available', 'Network error')).toBe(false)
  })
})
