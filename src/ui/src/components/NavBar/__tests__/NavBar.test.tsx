import React from 'react'
import { Text, View } from 'react-native'
import { act, fireEvent, waitFor } from '@testing-library/react-native'
import RNRestart from 'react-native-restart'
import { checkNotifications, openSettings } from 'react-native-permissions'

import {
  useApi,
  useConfig,
  useEvent,
  useOrder,
  useSession
} from '@components'
import { useCookieConsent } from '@/contexts/CookieConsentContext'

jest.mock('react-native-fast-image', () => {
  const React = require('react')
  const { View } = require('react-native')
  function FastImage (props: any) {
    return React.createElement(View, { testID: 'fast-image', ...props })
  }
  FastImage.resizeMode = { contain: 'contain', cover: 'cover' }
  return { __esModule: true, default: FastImage, resizeMode: FastImage.resizeMode }
})

jest.mock('react-native-webview', () => {
  const { View: RNView } = require('react-native')
  return { WebView: (props: any) => <RNView testID="webview" {...props} /> }
})

jest.mock('react-native-uuid', () => ({ v4: jest.fn(() => 'guest-token-uuid') }))

jest.mock('lottie-react-native', () => 'Lottie')

jest.mock('react-native-permissions', () => ({
  checkNotifications: jest.fn().mockResolvedValue({ status: 'granted' }),
  openSettings: jest.fn().mockResolvedValue(undefined)
}))

jest.mock('@/contexts/CookieConsentContext', () => ({
  useCookieConsent: jest.fn()
}))

jest.mock('@/ui/src/components/Help/functions', () => {
  const defaults = require('../../../../../../jest/helpers/m2ShellDefaults')
  return {
    CmsContent: (props: any) => {
      const UI = props.UIComponent
      if (!UI) return null
      return (
        <UI
          cmsState={defaults.helpCmsDefaults.cmsState}
          onRedirect={props.onRedirect}
          navigation={props.navigation}
        />
      )
    }
  }
})

jest.mock('@ui', () => {
  const { View } = require('react-native')
  const OText = require('@/ui/src/components/shared/OText').default
  const OButton = require('@/ui/src/components/shared/OButton').default
  const OIcon = require('@/ui/src/components/shared/OIcon').default
  const { NotFoundSource } = jest.requireActual('@/ui/src/components/NotFoundSource/index')
  const { AnimatedItem } = jest.requireActual('@/ui/src/components/AnimatedItem/index')
  return {
    OText,
    OButton,
    OIcon,
    LanguageSelector: () => <View testID="language-selector" />,
    NotFoundSource,
    AnimatedItem,
    LastOrders: () => <View testID="last-orders" />,
    SafeAreaViewWrapper: ({ children }: any) => children,
    Toast: () => null
  }
})

const renderUiController = (defaults: Record<string, unknown> = {}) => (props: any) => {
  const UI = props.UIComponent
  if (!UI) return null
  const { UIComponent, ...rest } = props
  return <UI {...defaults} {...rest} />
}

jest.mock('@components', () => {
  const base = require('../../../../../../jest/helpers/mockOrdering')
  const m1 = require('../../../../../../jest/helpers/m1AuthDefaults')
  const m2 = require('../../../../../../jest/helpers/m2ShellDefaults')
  return {
    ...base,
    WebsocketStatus: renderUiController(m2.websocketStatusDefaults),
    PageBanner: renderUiController(m2.pageBannerDefaults),
    UserFormDetails: renderUiController({
      ...m1.userFormDetailsDefaults,
      ...m2.notificationsListDefaults
    }),
    useEvent: jest.fn(() => [{ emit: jest.fn() }]),
    useUtils: jest.fn(() => [{
      parseDate: (value: string) => value,
      optimizeImage: (url: string) => url
    }]),
    useOrder: jest.fn(() => [{ loading: false, carts: [] }, { handleOrderStateLoading: jest.fn() }]),
    useToast: jest.fn(() => [, { showToast: jest.fn() }])
  }
})


import NavBar from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'


beforeEach(() => {
    jest.clearAllMocks()
    ;(useConfig as jest.Mock).mockReturnValue([{
      configs: { powered_by_ordering_module: { value: false } }
    }])
    ;(useCookieConsent as jest.Mock).mockReturnValue({
      consentStatus: 'unknown',
      acceptConsent: jest.fn(),
      optOutConsent: jest.fn(),
      isConsentEnabled: true,
      loading: false
    })
    ;(checkNotifications as jest.Mock).mockResolvedValue({ status: 'granted' })
  })

describe('NavBar', () => {
  it('renders title and handles back action', () => {
        const onActionLeft = jest.fn()
        const { getByText, getByLabelText } = renderWithProviders(
          <NavBar title="Settings" onActionLeft={onActionLeft} />
        )
        expect(getByText('Settings')).toBeTruthy()
        fireEvent.press(getByLabelText('back'))
        expect(onActionLeft).toHaveBeenCalled()
      })
  
      describe('the alignment of the title (header.base.title_align)', () => {
        const alignOf = (utils: any) => Object.assign({}, ...[].concat(utils.getByText('Settings').props.style).flat(Infinity).filter(Boolean)).textAlign

        it('follows the titles of the app by default', () => {
          const { themeWith, withTheme } = require('../../../../../../jest/helpers/themeWith')
          expect(alignOf(renderWithProviders(<NavBar title="Settings" />))).toBe('auto')
          expect(alignOf(renderWithProviders(<NavBar title="Settings" />, withTheme({ components: { section_header: { base: { align: 'end' } } } })))).toBe('right')
          expect(themeWith({}).native.components.header.base.title_align).toBe('inherit')
        })

        it('centers it when the theme says so, whatever the other titles do', () => {
          const { withTheme } = require('../../../../../../jest/helpers/themeWith')
          const values = { components: { header: { base: { title_align: 'center' } }, section_header: { base: { align: 'start' } } } }
          expect(alignOf(renderWithProviders(<NavBar title="Settings" />, withTheme(values)))).toBe('center')
        })

        it('centers it only where the bar says so with center_business', () => {
          const { withTheme } = require('../../../../../../jest/helpers/themeWith')
          const values = { components: { header: { base: { title_align: 'center_business' } }, section_header: { base: { align: 'start' } } } }
          expect(alignOf(renderWithProviders(<NavBar title="Settings" />, withTheme(values)))).toBe('auto')
          expect(alignOf(renderWithProviders(<NavBar title="Settings" centerTitle />, withTheme(values)))).toBe('center')
        })

        it('balances the title beside the back button only with its own centered alignment', () => {
          const { withTheme } = require('../../../../../../jest/helpers/themeWith')
          const inherited = withTheme({ components: { section_header: { base: { align: 'center' } } } })
          const own = withTheme({ components: { header: { base: { title_align: 'center' } } } })
          expect(renderWithProviders(<NavBar title="Settings" onActionLeft={() => {}} />, inherited).queryByTestId('navbar-title-balance')).toBeNull()
          expect(renderWithProviders(<NavBar title="Settings" onActionLeft={() => {}} />, own).queryByTestId('navbar-title-balance')).not.toBeNull()
        })

        it('ignores the indicator unless the theme asks for it', () => {
          expect(alignOf(renderWithProviders(<NavBar title="Settings" centerTitle />))).toBe('auto')
        })
      })

      it('renders subtitle under title', () => {
        const { getByText } = renderWithProviders(
          <NavBar title="Messages" subtitle="Inbox" />
        )
        expect(getByText('Messages')).toBeTruthy()
        expect(getByText('Inbox')).toBeTruthy()
      })
  
      it('renders custom children instead of title', () => {
        const { getByTestId } = renderWithProviders(
          <NavBar noTitle>
            <View testID="navbar-child" />
          </NavBar>
        )
        expect(getByTestId('navbar-child')).toBeTruthy()
      })
})

