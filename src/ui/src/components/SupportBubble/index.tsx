import React, { useEffect, useState } from 'react'
import { Keyboard, Linking, Vibration } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from 'styled-components/native'
import Ionicons from '@react-native-vector-icons/ionicons/static'
import FastImage from 'react-native-fast-image'
import { useConfig, useLanguage } from '@components'
import { themeColor, themeIconSize, themeImage, themePart, themeSpace } from '@/theme/helpers'
import { isIntercomAvailable } from '@/utils/nativeKeys'
import { navigationRef } from '@/navigators/NavigationRef'

import { Bubble, SUPPORT_BUBBLE_CLEARANCE, SUPPORT_BUBBLE_SIZE } from './styles'
import { resolveSupportAction, whatsappUrl } from './supportChannel'
import { useIntercomChat } from './useIntercomChat'

const enabled = (configs: any, key: string) => configs?.[key]?.value === '1'

export const SupportBubble = () => {
  const [{ configs }] = useConfig()
  const [, t] = useLanguage()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { hasConsented, openIntercom } = useIntercomChat()
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const [routeName, setRouteName] = useState<string | undefined>(undefined)

  useEffect(() => {
    const update = () => setRouteName(navigationRef.current?.getCurrentRoute?.()?.name)
    update()
    return navigationRef.current?.addListener?.('state', update)
  }, [])

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true))
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false))
    return () => {
      show.remove()
      hide.remove()
    }
  }, [])

  const phone = configs?.whatsapp_support_phone?.value
  const action = resolveSupportAction({
    whatsappEnabled: enabled(configs, 'whatsapp_support_enabled'),
    phone,
    // Intercom also needs its SDK started (the app's own keys, src/utils/nativeKeys.ts).
    intercomEnabled: enabled(configs, 'intercom_enabled') && isIntercomAvailable(),
    hasConsented
  })

  const link = themePart(theme as any, 'floating_button', 'base')
  const linkImage = themeImage(theme as any, 'icons.floating_button')
  const showLink = !!link.url && (link.placement !== 'home' || routeName === 'Home')

  if (keyboardOpen || (!action && !showLink)) return null

  const openWhatsapp = () => {
    const url = whatsappUrl(phone)
    if (!url) return
    Vibration.vibrate()
    Linking.openURL(url).catch(() => {})
  }

  const whatsapp = action === 'whatsapp'

  const linkRoom = showLink ? SUPPORT_BUBBLE_SIZE + themeSpace(theme as any, 'sm') : 0

  return (
    <>
      {showLink && (
        <Bubble
          testID="floating-link-button"
          $background={link.background}
          bottom={insets.bottom + SUPPORT_BUBBLE_CLEARANCE}
          accessibilityRole="link"
          accessibilityLabel={t('OPEN_LINK', 'Open link')}
          onPress={() => { Linking.openURL(link.url).catch(() => {}) }}
        >
          {linkImage ? (
            <FastImage
              style={{ width: SUPPORT_BUBBLE_SIZE, height: SUPPORT_BUBBLE_SIZE }}
              source={linkImage}
              objectFit='cover'
            />
          ) : (
            <Ionicons name='globe-outline' size={themeIconSize(theme, 'lg')} color={themeColor(theme, 'surface')} />
          )}
        </Bubble>
      )}
      {!!action && (
        <Bubble
          testID="support-bubble"
          $whatsapp={whatsapp}
          bottom={insets.bottom + SUPPORT_BUBBLE_CLEARANCE + linkRoom}
          accessibilityRole="button"
          accessibilityLabel={whatsapp
            ? t('WHATSAPP_SUPPORT_BUTTON', 'Write to us on WhatsApp')
            : t('INTERCOM_SUPPORT_BUTTON', 'Chat with support')}
          onPress={whatsapp ? openWhatsapp : openIntercom}
        >
          <Ionicons
            name={whatsapp ? 'logo-whatsapp' : 'chatbox'}
            size={themeIconSize(theme, 'lg')}
            color={themeColor(theme, 'surface')}
          />
        </Bubble>
      )}
    </>
  )
}
