import { useEffect } from 'react'
import { Vibration } from 'react-native'
import Intercom from '@intercom/intercom-react-native'
import { useSession } from '@components'

import { useCookieConsent } from '@/contexts/CookieConsentContext'

export const useIntercomChat = () => {
  const [{ user }] = useSession()
  const { hasConsented } = useCookieConsent()

  const openIntercom = async () => {
    Vibration.vibrate()
    try {
      if (user?.id) {
        const interParams: { userId: string, email?: string } = { userId: String(user.id) }
        if (user.email) interParams.email = user.email
        await Intercom.loginUserWithUserAttributes(interParams).catch(() => {})
      } else {
        await Intercom.loginUnidentifiedUser().catch(() => {})
      }
      await Intercom.present()
    } catch {
      // Intercom is not configured on this build.
    }
  }

  useEffect(() => {
    return () => {
      if (!hasConsented) return
      // A promise since Intercom 10: it rejects when Intercom is not configured on this build.
      Intercom.hideIntercom().catch(() => {})
    }
  }, [hasConsented])

  return { hasConsented, openIntercom }
}
