import React, { useEffect } from 'react'
import { useLanguage } from '@components'
import { Alert, NetworkError, SafeAreaContainer } from '@ui'
import { hideSplash } from '../../utils/splash'
import { isNetworkErrorContent, useApiConnection } from '.'

/**
 * While the API is out of reach, the app shows the connection screen (with its
 * Retry button and the countdown to the next automatic retry) instead of its
 * screens; when the API answers again the screens come back, loaded anew.
 */
export const ApiConnectionGate = ({ children }: { children: React.ReactNode }) => {
  const { down, status, retry, nextRetryAt } = useApiConnection()
  // The app hides the native splash once its data has loaded, which never
  // happens without the API: the connection screen hides it itself.
  useEffect(() => { if (down) hideSplash() }, [down])
  if (!down) return <>{children}</>
  return (
    <SafeAreaContainer>
      <NetworkError
        reason={status === 'offline' ? 'offline' : 'unreachable'}
        retrying={status === 'checking'}
        nextRetryAt={nextRetryAt}
        onRetry={retry}
      />
    </SafeAreaContainer>
  )
}

/**
 * The alert of the logic providers (OrderingProvider's `Alert`): a network
 * error is not shown as an alert but checked (the connection screen takes
 * over if the API is out of reach); any other alert shows as before.
 */
export const ConnectionAwareAlert = (props: any) => {
  const { report, down } = useApiConnection()
  const [, t] = useLanguage()
  const { onClose } = props
  const networkError = !!props.open && isNetworkErrorContent(props.content, t('NETWORK_ERROR', 'Network error'))

  useEffect(() => {
    if (networkError) {
      report()
      onClose && onClose()
    }
  }, [networkError, report, onClose])

  if (networkError || down) return null
  return <Alert {...props} />
}
