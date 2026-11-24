import React from 'react'
import { Keyboard, Linking, StyleSheet, Vibration } from 'react-native'
import { act, fireEvent, waitFor } from '@testing-library/react-native'
import Intercom from '@intercom/intercom-react-native'

import { useConfig, useSession } from '@components'
import { useCookieConsent } from '@/contexts/CookieConsentContext'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'
import { themeWith, withTheme } from '../../../../../../jest/helpers/themeWith'
import { themeSpace } from '@/theme/helpers'
import { SUPPORT_BUBBLE_CLEARANCE, SUPPORT_BUBBLE_SIZE } from '../styles'

import { SupportBubble } from '..'
import { setNativeFeatures } from '../../../../../utils/nativeKeys'
import { navigationRef } from '@/navigators/NavigationRef'

jest.mock('@intercom/intercom-react-native', () => ({
  loginUserWithUserAttributes: jest.fn(() => Promise.resolve()),
  loginUnidentifiedUser: jest.fn(() => Promise.resolve()),
  present: jest.fn(() => Promise.resolve()),
  hideIntercom: jest.fn(() => Promise.resolve(true)),
  logout: jest.fn()
}))

jest.mock('react-native-fast-image', () => {
  const { createElement } = require('react')
  const { View } = require('react-native')
  return { __esModule: true, default: (props: any) => createElement(View, { testID: 'fast-image', ...props }) }
})

jest.mock('@/contexts/CookieConsentContext', () => ({
  useCookieConsent: jest.fn(() => ({ hasConsented: false }))
}))

const configs = (overrides: Record<string, string> = {}) => ({
  whatsapp_support_enabled: { value: overrides.whatsapp ?? '0' },
  whatsapp_support_phone: { value: overrides.phone ?? '' },
  intercom_enabled: { value: overrides.intercom ?? '0' }
})

describe('SupportBubble', () => {
  let keyboardHandlers: Record<string, () => void>

  beforeEach(() => {
    jest.clearAllMocks()
    keyboardHandlers = {}
    jest.spyOn(Keyboard, 'addListener').mockImplementation((event, handler) => {
      keyboardHandlers[event] = handler as () => void
      return { remove: jest.fn() } as any
    })
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as any)
    jest.spyOn(Vibration, 'vibrate').mockImplementation(() => {})
    ;(useConfig as jest.Mock).mockReturnValue([{ configs: configs() }])
    ;(useSession as jest.Mock).mockReturnValue([{ auth: true, user: { id: 7, email: 'jane@test.com' } }, {}])
    ;(useCookieConsent as jest.Mock).mockReturnValue({ hasConsented: false })
  })

  it('opens WhatsApp with a digits-only number and ignores consent', () => {
    ;(useConfig as jest.Mock).mockReturnValue([{
      configs: configs({ whatsapp: '1', phone: '+243 81-000 22', intercom: '1' })
    }])
    ;(useCookieConsent as jest.Mock).mockReturnValue({ hasConsented: false })

    const { getByTestId } = renderWithProviders(<SupportBubble />)
    fireEvent.press(getByTestId('support-bubble'))

    expect(Linking.openURL).toHaveBeenCalledWith('https://wa.me/2438100022')
    expect(Intercom.present).not.toHaveBeenCalled()
  })

  it('opens Intercom when WhatsApp is off and the user consented', async () => {
    ;(useConfig as jest.Mock).mockReturnValue([{
      configs: configs({ intercom: '1' })
    }])
    ;(useCookieConsent as jest.Mock).mockReturnValue({ hasConsented: true })

    const { getByLabelText } = renderWithProviders(<SupportBubble />)
    fireEvent.press(getByLabelText('Chat with support'))

    expect(Vibration.vibrate).toHaveBeenCalled()
    await waitFor(() => {
      expect(Intercom.loginUserWithUserAttributes).toHaveBeenCalledWith({
        userId: '7',
        email: 'jane@test.com'
      })
      expect(Intercom.present).toHaveBeenCalled()
    })
    expect(Linking.openURL).not.toHaveBeenCalled()
  })

  describe('without Intercom\'s keys in the app', () => {
    beforeEach(() => setNativeFeatures({ intercom: false }))
    afterEach(() => setNativeFeatures(undefined))

    it('hides the Intercom bubble although the server enables Intercom', () => {
      ;(useConfig as jest.Mock).mockReturnValue([{ configs: configs({ intercom: '1' }) }])
      ;(useCookieConsent as jest.Mock).mockReturnValue({ hasConsented: true })

      const { queryByTestId } = renderWithProviders(<SupportBubble />)
      expect(queryByTestId('support-bubble')).toBeNull()
    })

    it('keeps the WhatsApp bubble', () => {
      ;(useConfig as jest.Mock).mockReturnValue([{
        configs: configs({ whatsapp: '1', phone: '2438100022', intercom: '1' })
      }])
      ;(useCookieConsent as jest.Mock).mockReturnValue({ hasConsented: true })

      const { getByLabelText } = renderWithProviders(<SupportBubble />)
      expect(getByLabelText('Write to us on WhatsApp')).toBeTruthy()
    })
  })

  it('shows the Intercom bubble with Intercom\'s keys in the app', () => {
    setNativeFeatures({ intercom: true })
    ;(useConfig as jest.Mock).mockReturnValue([{ configs: configs({ intercom: '1' }) }])
    ;(useCookieConsent as jest.Mock).mockReturnValue({ hasConsented: true })

    const { getByLabelText } = renderWithProviders(<SupportBubble />)
    expect(getByLabelText('Chat with support')).toBeTruthy()
    setNativeFeatures(undefined)
  })

  it('renders nothing when both channels are off', () => {
    const { queryByTestId } = renderWithProviders(<SupportBubble />)
    expect(queryByTestId('support-bubble')).toBeNull()
  })

  it('renders nothing for Intercom without consent', () => {
    ;(useConfig as jest.Mock).mockReturnValue([{
      configs: configs({ intercom: '1', phone: '2438100022' })
    }])
    const { queryByTestId } = renderWithProviders(<SupportBubble />)
    expect(queryByTestId('support-bubble')).toBeNull()
  })

  it('hides while the keyboard is open', () => {
    ;(useConfig as jest.Mock).mockReturnValue([{
      configs: configs({ whatsapp: '1', phone: '2438100022' })
    }])
    const { getByTestId, queryByTestId } = renderWithProviders(<SupportBubble />)
    expect(getByTestId('support-bubble')).toBeTruthy()

    act(() => {
      keyboardHandlers.keyboardDidShow()
    })
    expect(queryByTestId('support-bubble')).toBeNull()

    act(() => {
      keyboardHandlers.keyboardDidHide()
    })
    expect(getByTestId('support-bubble')).toBeTruthy()
  })

  it('falls through to Intercom when the WhatsApp number has no digits', async () => {
    ;(useConfig as jest.Mock).mockReturnValue([{
      configs: configs({ whatsapp: '1', phone: '++ --', intercom: '1' })
    }])
    ;(useCookieConsent as jest.Mock).mockReturnValue({ hasConsented: true })

    const { getByLabelText } = renderWithProviders(<SupportBubble />)
    fireEvent.press(getByLabelText('Chat with support'))

    await waitFor(() => {
      expect(Intercom.present).toHaveBeenCalled()
    })
    expect(Linking.openURL).not.toHaveBeenCalled()
  })

  it('hides Intercom when the bubble unmounts after consent', () => {
    ;(useCookieConsent as jest.Mock).mockReturnValue({ hasConsented: true })
    const { unmount } = renderWithProviders(<SupportBubble />)
    unmount()
    expect(Intercom.hideIntercom).toHaveBeenCalled()
  })

  describe('the link bubble (floating_button.base.url)', () => {
    const url = 'https://example.com/club'
    const link = (base: Record<string, unknown> = {}, images?: Record<string, string>) =>
      ({ components: { floating_button: { base: { url, ...base } } }, ...(images ? { images } : {}) })
    const whatsappOn = () => (useConfig as jest.Mock).mockReturnValue([{ configs: configs({ whatsapp: '1', phone: '2438100022' }) }])
    const flat = (node: any) => StyleSheet.flatten(node.props.style)
    const glyphs = (node: any, name: string) => node.findAll((child: any) => child.props?.name === name && typeof child.type === 'string')

    it('has none by default, and the support bubble stays where it was', () => {
      whatsappOn()
      const { getByTestId, queryByTestId } = renderWithProviders(<SupportBubble />)
      expect(queryByTestId('floating-link-button')).toBeNull()
      expect(flat(getByTestId('support-bubble')).bottom).toBe(SUPPORT_BUBBLE_CLEARANCE)
    })

    it('shows without a support channel and opens the url of the theme', () => {
      const { getByTestId, queryByTestId, getByLabelText } = renderWithProviders(<SupportBubble />, withTheme(link()))
      expect(queryByTestId('support-bubble')).toBeNull()
      expect(getByLabelText('Open link').props.accessibilityRole).toBe('link')
      expect(flat(getByTestId('floating-link-button')).bottom).toBe(SUPPORT_BUBBLE_CLEARANCE)
      fireEvent.press(getByTestId('floating-link-button'))
      expect(Linking.openURL).toHaveBeenCalledTimes(1)
      expect(Linking.openURL).toHaveBeenCalledWith(url)
    })

    it('draws a globe without an image, on the background of the theme', () => {
      const theme = link({ background: '#102030' })
      const { getByTestId, queryByTestId } = renderWithProviders(<SupportBubble />, withTheme(theme))
      const bubble = getByTestId('floating-link-button')
      expect(glyphs(bubble, 'globe-outline')).toHaveLength(1)
      expect(queryByTestId('fast-image')).toBeNull()
      expect(flat(bubble).backgroundColor).toBe(themeWith(theme).native.components.floating_button.base.background)
    })

    it('draws the image of the theme instead of the globe (images.icons.floating_button)', () => {
      const { getByTestId } = renderWithProviders(
        <SupportBubble />,
        withTheme(link({}, { 'icons.floating_button': 'https://example.com/club.png' }))
      )
      const bubble = getByTestId('floating-link-button')
      expect(glyphs(bubble, 'globe-outline')).toHaveLength(0)
      const image = getByTestId('fast-image')
      expect(image.props.source).toEqual({ uri: 'https://example.com/club.png' })
      expect(flat(image)).toMatchObject({ width: SUPPORT_BUBBLE_SIZE, height: SUPPORT_BUBBLE_SIZE })
    })

    it('ignores the image without a url', () => {
      const { queryByTestId } = renderWithProviders(
        <SupportBubble />,
        withTheme({ images: { 'icons.floating_button': 'https://example.com/club.png' } })
      )
      expect(queryByTestId('floating-link-button')).toBeNull()
      expect(queryByTestId('fast-image')).toBeNull()
    })

    it('lifts the support bubble over the link by a bubble and a small space when both show', () => {
      whatsappOn()
      const theme = link()
      const { getByTestId } = renderWithProviders(<SupportBubble />, withTheme(theme))
      expect(flat(getByTestId('floating-link-button')).bottom).toBe(SUPPORT_BUBBLE_CLEARANCE)
      expect(flat(getByTestId('support-bubble')).bottom).toBe(
        SUPPORT_BUBBLE_CLEARANCE + SUPPORT_BUBBLE_SIZE + themeSpace(themeWith(theme), 'sm')
      )
      fireEvent.press(getByTestId('support-bubble'))
      expect(Linking.openURL).toHaveBeenCalledWith('https://wa.me/2438100022')
      fireEvent.press(getByTestId('floating-link-button'))
      expect(Linking.openURL).toHaveBeenLastCalledWith(url)
    })

    it('hides with the keyboard open, as the support bubble', () => {
      const { getByTestId, queryByTestId } = renderWithProviders(<SupportBubble />, withTheme(link()))
      expect(getByTestId('floating-link-button')).toBeTruthy()
      act(() => {
        keyboardHandlers.keyboardDidShow()
      })
      expect(queryByTestId('floating-link-button')).toBeNull()
      act(() => {
        keyboardHandlers.keyboardDidHide()
      })
      expect(getByTestId('floating-link-button')).toBeTruthy()
    })

    it('does not break when the url cannot be opened', async () => {
      ;(Linking.openURL as jest.Mock).mockRejectedValueOnce(new Error('no app'))
      const { getByTestId } = renderWithProviders(<SupportBubble />, withTheme(link()))
      fireEvent.press(getByTestId('floating-link-button'))
      await act(async () => {})
      expect(getByTestId('floating-link-button')).toBeTruthy()
    })
  })

  describe('where the link bubble shows (floating_button.base.placement)', () => {
    const url = 'https://example.com/club'
    const link = (base: Record<string, unknown> = {}) => ({ components: { floating_button: { base: { url, ...base } } } })
    const whatsappOn = () => (useConfig as jest.Mock).mockReturnValue([{ configs: configs({ whatsapp: '1', phone: '2438100022' }) }])
    const flat = (node: any) => StyleSheet.flatten(node.props.style)
    const navigator = (name: string) => {
      const listeners: Array<() => void> = []
      const unsubscribe = jest.fn()
      const route = { name }
      navigationRef.current = {
        getCurrentRoute: () => ({ name: route.name }),
        addListener: jest.fn((_event: string, listener: () => void) => {
          listeners.push(listener)
          return unsubscribe
        })
      }
      const goTo = (next: string) => {
        route.name = next
        listeners.forEach((listener) => listener())
      }
      return { goTo, unsubscribe }
    }

    afterEach(() => {
      navigationRef.current = null
    })

    it.each([['Home'], ['BusinessList'], ['Profile']])('shows on every screen by default, as on %s', (name) => {
      navigator(name)
      expect(renderWithProviders(<SupportBubble />, withTheme(link())).getByTestId('floating-link-button')).toBeTruthy()
    })

    it('shows on every screen for the all option', () => {
      navigator('Profile')
      expect(renderWithProviders(<SupportBubble />, withTheme(link({ placement: 'all' }))).getByTestId('floating-link-button')).toBeTruthy()
    })

    it('shows on the home when the theme keeps it there, and opens the url', () => {
      navigator('Home')
      const { getByTestId } = renderWithProviders(<SupportBubble />, withTheme(link({ placement: 'home' })))
      fireEvent.press(getByTestId('floating-link-button'))
      expect(Linking.openURL).toHaveBeenCalledWith(url)
    })

    it.each([['BusinessList'], ['Profile'], ['Cart']])('is nothing on %s when the theme keeps it on the home', (name) => {
      navigator(name)
      expect(renderWithProviders(<SupportBubble />, withTheme(link({ placement: 'home' }))).toJSON()).toBeNull()
    })

    it('is nothing before the navigator knows its screen', () => {
      expect(renderWithProviders(<SupportBubble />, withTheme(link({ placement: 'home' }))).toJSON()).toBeNull()
    })

    it('leaves the support bubble where it was on the other screens', () => {
      whatsappOn()
      navigator('Profile')
      const { getByTestId, queryByTestId } = renderWithProviders(<SupportBubble />, withTheme(link({ placement: 'home' })))
      expect(queryByTestId('floating-link-button')).toBeNull()
      expect(flat(getByTestId('support-bubble')).bottom).toBe(SUPPORT_BUBBLE_CLEARANCE)
    })

    it('leaves and comes back with the screen, and stops listening when it unmounts', () => {
      const { goTo, unsubscribe } = navigator('Home')
      const { getByTestId, queryByTestId, unmount } = renderWithProviders(<SupportBubble />, withTheme(link({ placement: 'home' })))
      expect(getByTestId('floating-link-button')).toBeTruthy()
      act(() => goTo('Profile'))
      expect(queryByTestId('floating-link-button')).toBeNull()
      act(() => goTo('Home'))
      expect(getByTestId('floating-link-button')).toBeTruthy()
      expect(unsubscribe).not.toHaveBeenCalled()
      unmount()
      expect(unsubscribe).toHaveBeenCalledTimes(1)
    })
  })
})
