import React from 'react'
import { Alert, AppState, Linking } from 'react-native'
import { act, render, waitFor } from '@testing-library/react-native'
import { NavigationContainer } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ThemeProvider } from 'styled-components/native'

import { defaultAppTheme } from '../theme/engine'
import RootNavigator from '../navigators/RootNavigator'
import BootSplash from 'react-native-bootsplash'

jest.mock('@react-navigation/native', () => {
  const React = require('react')
  const actual = jest.requireActual('@react-navigation/native')
  return {
    ...actual,
    NavigationContainer: ({ children }: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, children)
  }
})

jest.mock('@react-navigation/stack', () => {
  const React = require('react')
  const { View } = require('react-native')

  const flattenScreens = (nodes: React.ReactNode): Array<React.ReactElement<{ name?: string, component?: React.ComponentType<unknown> }>> => {
    const screens: Array<React.ReactElement<{ name?: string, component?: React.ComponentType<unknown> }>> = []
    React.Children.forEach(nodes, (child) => {
      if (!React.isValidElement(child)) return
      if (child.type === React.Fragment) {
        screens.push(...flattenScreens(child.props.children))
        return
      }
      screens.push(child)
    })
    return screens
  }

  return {
    createStackNavigator: () => ({
      Navigator: ({ children, initialRouteName }: { children?: React.ReactNode, initialRouteName?: string }) => {
        const screens = flattenScreens(children)
        const match = screens.find(child => child.props.name === initialRouteName) || screens[0]
        const ScreenComponent = match?.props?.component
        if (!ScreenComponent) return null
        return React.createElement(View, null, React.createElement(ScreenComponent, {}))
      },
      Screen: () => null
    })
  }
})

jest.mock('@ui', () => {
  const React = require('react')
  const { Text, TouchableOpacity } = require('react-native')
  const store = {
    _retrieveStoreData: jest.fn(async () => false),
    _setStoreData: jest.fn(),
    _removeStoreData: jest.fn(),
    _clearStoreData: jest.fn()
  }
  const OText = ({ children, ...props }: { children?: React.ReactNode }) => React.createElement(Text, props, children)
  return {
    ...store,
    OText,
    OButton: ({ text, onClick }: { text?: string, onClick?: () => void }) => (
      React.createElement(TouchableOpacity, { onPress: onClick }, React.createElement(Text, null, text))
    ),
    LanguageSelector: () => null,
    HomeView: (props: object) => {
      const { Home } = require('../ui/src/components/Home')
      return React.createElement(Home, props)
    }
  }
})

jest.mock('../navigators/HomeNavigator', () => {
  const React = require('react')
  const Home = require('../pages/Home').default
  return function HomeNavigatorMock () {
    return React.createElement(Home, {
      navigation: { navigate: jest.fn() },
      route: { params: {} }
    })
  }
})

const quietPage = () => null
jest.mock('../pages/Login', () => quietPage)
jest.mock('../pages/Signup', () => quietPage)
jest.mock('../pages/ForgotPassword', () => quietPage)
jest.mock('../pages/IntroductoryTutorial', () => quietPage)
jest.mock('../pages/NetworkError', () => quietPage)
jest.mock('../pages/ProjectForm', () => quietPage)
jest.mock('../pages/UserVerification', () => quietPage)
jest.mock('../pages/CompleteProfile', () => quietPage)

jest.mock('react-native-onesignal', () => require('../../jest/helpers/mockOneSignal'))

jest.mock('@react-native-firebase/messaging', () => ({
  getMessaging: jest.fn(() => ({})),
  getToken: jest.fn(async () => null),
  deleteToken: jest.fn(async () => undefined),
  getInitialNotification: jest.fn(async () => null),
  onNotificationOpenedApp: jest.fn(() => jest.fn()),
  onMessage: jest.fn(() => jest.fn()),
  onTokenRefresh: jest.fn(() => jest.fn())
}))

jest.mock('react-native-notify-kit', () => ({
  __esModule: true,
  default: {
    createChannel: jest.fn(),
    displayNotification: jest.fn(),
    onForegroundEvent: jest.fn(() => jest.fn()),
    onBackgroundEvent: jest.fn()
  },
  AndroidImportance: { HIGH: 4 },
  EventType: { PRESS: 1 }
}))

jest.mock('react-native-permissions', () => ({
  requestNotifications: jest.fn(async () => ({ status: 'granted' }))
}))

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: (handler: (state: { isConnected: boolean }) => void) => {
    handler({ isConnected: true })
    return () => undefined
  }
}))

jest.mock('../utils/storeVersion', () => ({
  checkStoreUpdate: jest.fn(async () => ({ isNeeded: false }))
}))

const ordering = require('@components')

describe('marketplace storefront launch', () => {
  beforeEach(() => {
    ordering.useSession.mockReturnValue([
      { auth: false, user: null, token: null, loading: false },
      { login: jest.fn() }
    ])
    ordering.useOrder.mockReturnValue([
      { loading: false, carts: [], options: {} },
      { changeMoment: jest.fn(), handleOrderStateLoading: jest.fn() }
    ])
    ordering.useConfig.mockReturnValue([{ loading: false, configs: {} }])
    ordering.useApi.mockReturnValue([{
      project: 'test',
      root: 'https://example.test',
      setCountryCode: jest.fn()
    }, {}])
  })

  it('shows the home title after tutorial, order, and push loading resolve', async () => {
    const view = render(
      <SafeAreaProvider>
        <ThemeProvider theme={defaultAppTheme()}>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </ThemeProvider>
      </SafeAreaProvider>
    )

    await waitFor(() => {
      expect(view.getByText(/Shop/)).toBeTruthy()
      expect(BootSplash.hide).toHaveBeenCalledWith({ fade: true })
    })
    expect(view.toJSON()).toBeTruthy()
  })

  it('forces the update when the app opens and when it comes back, one alert at a time', async () => {
    const { checkStoreUpdate } = require('../utils/storeVersion')
    checkStoreUpdate.mockResolvedValue({ isNeeded: true, storeUrl: 'https://store.test/app' })
    ordering.useConfig.mockReturnValue([{ loading: false, configs: { app_version: { value: '1' } } }])
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn())
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true)
    let onAppState: (state: string) => void = () => {}
    jest.spyOn(AppState, 'addEventListener').mockImplementation(((_: string, listener: any) => {
      onAppState = listener
      return { remove: jest.fn() }
    }) as any)

    render(
      <SafeAreaProvider>
        <ThemeProvider theme={defaultAppTheme()}>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </ThemeProvider>
      </SafeAreaProvider>
    )

    await waitFor(() => expect(alert).toHaveBeenCalledTimes(1))
    const [, , buttons, options] = alert.mock.calls[0] as any
    expect(options).toEqual({ cancelable: false })
    expect(buttons).toHaveLength(1)

    // Back to the foreground with the alert still open: no second alert.
    await act(async () => { onAppState('background') })
    await act(async () => { onAppState('active') })
    expect(alert).toHaveBeenCalledTimes(1)

    // Update: the store opens; back without updating, the alert shows again.
    await act(async () => { buttons[0].onPress() })
    expect(openURL).toHaveBeenCalledWith('https://store.test/app')
    await act(async () => { onAppState('background') })
    await act(async () => { onAppState('active') })
    await waitFor(() => expect(alert).toHaveBeenCalledTimes(2))

    // The store does not open: the alert shows again at once.
    openURL.mockRejectedValueOnce(new Error('no store'))
    await act(async () => { (alert.mock.calls[1] as any)[2][0].onPress() })
    await waitFor(() => expect(alert).toHaveBeenCalledTimes(3))
  })
})
