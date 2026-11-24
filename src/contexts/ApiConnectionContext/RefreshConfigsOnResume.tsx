import { useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import { useConfig } from '@components'
import { useApiConnection } from '.'

export const RefreshConfigsOnResume = ({ isFocused }: { isFocused: boolean }) => {
  const [, { refreshConfigs }] = useConfig()
  const { status } = useApiConnection()
  const refreshConfigsRef = useRef(refreshConfigs)
  const statusRef = useRef(status)
  const isFocusedRef = useRef(isFocused)
  const previousFocus = useRef(false)
  const previousAppState = useRef(AppState.currentState)

  refreshConfigsRef.current = refreshConfigs
  statusRef.current = status
  isFocusedRef.current = isFocused

  useEffect(() => {
    const becameFocused = isFocused && !previousFocus.current
    previousFocus.current = isFocused

    if (becameFocused && statusRef.current === 'online') {
      refreshConfigsRef.current()
    }
  }, [isFocused])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const wasBackgrounded = previousAppState.current === 'background' || previousAppState.current === 'inactive'
      previousAppState.current = nextAppState

      if (nextAppState === 'active' && wasBackgrounded && isFocusedRef.current && statusRef.current === 'online') {
        refreshConfigsRef.current()
      }
    })
    return () => subscription.remove()
  }, [])

  return null
}
