import React from 'react'
import { AnalyticsSegment, FacebookPixel } from '@ui'

import { isFacebookAvailable } from '@/utils/nativeKeys'
import { useCookieConsent } from './index'

/**
 * The analytics that need the user's consent. Facebook's app events also need
 * its SDK started (the app's own Facebook keys, src/utils/nativeKeys.ts):
 * without them nothing of Facebook is mounted, so nothing calls the SDK.
 */
export const ConsentGatedAnalytics = () => {
  const { hasConsented } = useCookieConsent()
  return (
    <>
      {hasConsented && <AnalyticsSegment />}
      {hasConsented && isFacebookAvailable() && <FacebookPixel />}
    </>
  )
}
