/**
 * Whether the app can reach the API, and getting back when it cannot.
 *
 * The app used to know only about the phone's own connection (NetInfo): with
 * the network up but the API not answering, every request failed, the order
 * logic showed a "Network error" alert and nothing tried again until the app
 * was reopened. This provider checks the API itself and, while it cannot be
 * reached, keeps retrying on its own with growing pauses (5, 10, 20, 40 s,
 * then every minute) as long as the app is open, and at once when the phone
 * gets its network back or the app comes back to the foreground. A screen can
 * also retry by hand (`retry`). When the API answers again, `generation`
 * grows: the tree keyed on it mounts again and loads its data from scratch.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AppState } from 'react-native'
import NetInfo from '@react-native-community/netinfo'

export type ApiConnectionStatus = 'checking' | 'online' | 'offline' | 'unreachable'

/** Pauses between automatic retries, in seconds; the last one repeats. */
export const RETRY_STEPS = [5, 10, 20, 40, 60]
const PROBE_TIMEOUT_MS = 10000

export const retryDelay = (attempt: number) => RETRY_STEPS[Math.min(attempt, RETRY_STEPS.length - 1)] * 1000

interface ApiConnectionState {
  status: ApiConnectionStatus
  /** Out of reach: the last check failed and none has succeeded since (a check in progress keeps it). */
  down: boolean
  /** Grows each time the API answers again after being out of reach. */
  generation: number
  /** When the next automatic retry runs (ms since epoch), while out of reach. */
  nextRetryAt: number | null
  /** Check now (the Retry button). */
  retry: () => void
  /** A request failed for lack of network: check whether the API is there. */
  report: () => void
}

const ApiConnectionContext = createContext<ApiConnectionState>({
  status: 'online',
  down: false,
  generation: 0,
  nextRetryAt: null,
  retry: () => {},
  report: () => {},
})

export const useApiConnection = () => useContext(ApiConnectionContext)

const NETWORK_MESSAGES = ['network error', 'network request failed']

/** A failed request with no answer (no network, API down), as the logic reports it. */
export const isNetworkErrorContent = (content: unknown, translated: string) => {
  const text = (Array.isArray(content) ? content[0] : content)
  if (typeof text !== 'string') return false
  const lower = text.trim().toLowerCase()
  return lower === translated.trim().toLowerCase() || NETWORK_MESSAGES.includes(lower)
}

/** Any HTTP answer means the API is there; only a network failure or a timeout means it is not. */
export const probeApi = async (url: string, timeoutMs = PROBE_TIMEOUT_MS): Promise<boolean> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    await fetch(url, { method: 'GET', signal: controller.signal })
    return true
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

export const ApiConnectionProvider = ({ probeUrl, children }: { probeUrl: string, children: React.ReactNode }) => {
  const [status, setStatus] = useState<ApiConnectionStatus>('checking')
  const [generation, setGeneration] = useState(0)
  const [down, setDown] = useState(false)
  const [nextRetryAt, setNextRetryAt] = useState<number | null>(null)
  const [appActive, setAppActive] = useState(AppState.currentState !== 'background')

  const attempt = useRef(0)
  const wasDown = useRef(false)
  const checking = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }

  const check = useCallback(async () => {
    if (checking.current) return
    checking.current = true
    clearTimer()
    setNextRetryAt(null)
    setStatus(previous => (previous === 'online' ? previous : 'checking'))
    const net = await NetInfo.fetch().catch(() => null)
    const reachable = net?.isConnected === false ? false : await probeApi(probeUrl)
    checking.current = false
    if (reachable) {
      attempt.current = 0
      setStatus('online')
      setDown(false)
      if (wasDown.current) {
        wasDown.current = false
        setGeneration(value => value + 1)
      }
    } else {
      wasDown.current = true
      setDown(true)
      setStatus(net?.isConnected === false ? 'offline' : 'unreachable')
    }
  }, [probeUrl])

  // The first check, at launch.
  useEffect(() => { check() }, [check])

  // The phone's network: lost → out of reach; back → check at once.
  useEffect(() => NetInfo.addEventListener((state) => {
    if (state.isConnected === false) {
      wasDown.current = true
      clearTimer()
      setDown(true)
      setStatus('offline')
    } else if (wasDown.current) {
      check()
    }
  }), [check])

  // Foreground and background: retries only run while the app is open.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      const active = state === 'active'
      setAppActive(active)
      if (active && wasDown.current) check()
    })
    return () => subscription.remove()
  }, [check])

  // While out of reach and open, retry on its own with growing pauses.
  useEffect(() => {
    clearTimer()
    if ((status !== 'unreachable' && status !== 'offline') || !appActive) {
      setNextRetryAt(null)
      return
    }
    const delay = retryDelay(attempt.current)
    setNextRetryAt(Date.now() + delay)
    timer.current = setTimeout(() => {
      attempt.current += 1
      check()
    }, delay)
    return clearTimer
  }, [status, appActive, check])

  const value = useMemo(() => ({
    status,
    down,
    generation,
    nextRetryAt,
    retry: () => { check() },
    report: () => { if (!wasDown.current) check() },
  }), [status, down, generation, nextRetryAt, check])

  return <ApiConnectionContext.Provider value={value}>{children}</ApiConnectionContext.Provider>
}
