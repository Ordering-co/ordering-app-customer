import { StackActions as NavActions } from '@react-navigation/routers'
import React from 'react'
import { act, fireEvent } from '@testing-library/react-native'
import { BackHandler, Dimensions, Platform } from 'react-native'
import RNRestart from 'react-native-restart'
import Intercom from '@intercom/intercom-react-native'

import { useApi, useConfig, useSession } from '@components'
import { _setStoreData, _removeStoreData } from '@ui'
import { renderPage, stackState, ROOT_STACK_SCREENS } from '../../../jest/helpers/renderPage'
import { renderWithProviders } from '../../../jest/helpers/renderWithProviders'

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native')
  return { ...actual, useIsFocused: jest.fn(() => true) }
})

jest.mock('@ui', () => require('../../../jest/helpers/mockUi'))

jest.mock('../../contexts/ApiConnectionContext/RefreshConfigsOnResume', () => ({
  RefreshConfigsOnResume: () => null
}))

jest.mock('@/contexts/CookieConsentContext', () => ({
  useCookieConsent: jest.fn(() => ({ hasConsented: false }))
}))

import { useCookieConsent } from '@/contexts/CookieConsentContext'

import Login from '../Login'

// Login and Signup are screens of the root stack (next to MyAccount).
const rootNavigation = { getState: stackState(ROOT_STACK_SCREENS, ['MyAccount', 'Login']) }


beforeEach(() => {
    jest.clearAllMocks()
    ;(useCookieConsent as jest.Mock).mockReturnValue({ hasConsented: false })
    ;(useConfig as jest.Mock).mockReturnValue([{
      loading: false,
      configs: {
        powered_by_ordering_module: { value: true },
        verification_email_required: { value: '0' },
        verification_phone_required: { value: '0' }
      }
    }])
    ;(useSession as jest.Mock).mockReturnValue([
      { auth: false, user: null },
      { login: jest.fn() }
    ])
    ;(useApi as jest.Mock).mockReturnValue([{}, {}])
    jest.spyOn(Dimensions, 'get').mockImplementation((dim: string) => {
      if (dim === 'window') return { width: 390, height: 844, scale: 2, fontScale: 2 }
      if (dim === 'screen') return { width: 390, height: 844, scale: 2, fontScale: 2 }
      return { width: 0, height: 0, scale: 1, fontScale: 1 }
    })
    Platform.OS = 'ios'
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

describe('Login', () => {
  it('renders login form with navbar title', () => {
        const { getByTestId } = renderPage(Login, { navigation: rootNavigation })
        expect(getByTestId('navbar-title').props.children).toBe('Log in')
        expect(getByTestId('login-form')).toBeTruthy()
      })
  
      it('stores notification state on mount', () => {
        renderPage(Login, { navigation: rootNavigation,
          route: { params: { notification_state: 'pending' } },
          pageProps: { notificationState: 'pending' }
        })
        expect(_setStoreData).toHaveBeenCalledWith('notification_state', 'pending')
      })
  
      it('navigates home after successful login with default address', async () => {
        const { getByTestId, navigation } = renderPage(Login, { navigation: rootNavigation })
        await act(async () => {
          fireEvent.press(getByTestId('login-success-home'))
        })
        expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'MyAccount', params: { screen: 'BottomTab', params: { screen: 'Home' } } }] })
      })
  
      it('navigates to address list when user has no default address', async () => {
        const { getByTestId, navigation } = renderPage(Login, { navigation: rootNavigation })
        await act(async () => {
          fireEvent.press(getByTestId('login-success-address'))
        })
        expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'MyAccount', params: { screen: 'AddressList', params: undefined, initial: false } }] })
      })

      it('does not force AddressList when the auth payload has no addresses array', async () => {
        const { getByTestId, navigation } = renderPage(Login, { navigation: rootNavigation })
        await act(async () => {
          fireEvent.press(getByTestId('login-success-missing-addresses'))
        })
        expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'MyAccount', params: { screen: 'BottomTab', params: { screen: 'Home' } } }] })
        expect(navigation.reset).not.toHaveBeenCalledWith({ index: 0, routes: [{ name: 'MyAccount', params: { screen: 'AddressList', params: undefined, initial: false } }] })
      })

      it('navigates home when fetched addresses include a default', async () => {
        ;(useApi as jest.Mock).mockReturnValue([{
          setAccessToken: () => ({
            users: () => ({
              addresses: () => ({
                get: async () => ({ content: { error: false, result: [{ default: true }] } })
              })
            })
          })
        }, {}])
        const { getByTestId, navigation } = renderPage(Login, { navigation: rootNavigation })
        await act(async () => {
          fireEvent.press(getByTestId('login-success-missing-addresses'))
        })
        expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'MyAccount', params: { screen: 'BottomTab', params: { screen: 'Home' } } }] })
      })

      it('opens AddressList when fetched addresses have no default', async () => {
        ;(useApi as jest.Mock).mockReturnValue([{
          setAccessToken: () => ({
            users: () => ({
              addresses: () => ({
                get: async () => ({ content: { error: false, result: [] } })
              })
            })
          })
        }, {}])
        const { getByTestId, navigation } = renderPage(Login, { navigation: rootNavigation })
        await act(async () => {
          fireEvent.press(getByTestId('login-success-missing-addresses'))
        })
        expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'MyAccount', params: { screen: 'AddressList', params: undefined, initial: false } }] })
      })
  
      it('registers intercom and restarts when consented and project changed', async () => {
        jest.useFakeTimers()
        ;(useCookieConsent as jest.Mock).mockReturnValue({ hasConsented: true })
        const { getByTestId } = renderPage(Login, { navigation: rootNavigation,
          route: { params: { projectChanged: true } }
        })
        await act(async () => {
          fireEvent.press(getByTestId('login-success-home'))
        })
        expect(Intercom.loginUserWithUserAttributes).toHaveBeenCalled()
        act(() => {
          jest.advanceTimersByTime(300)
        })
        expect(RNRestart.restart).toHaveBeenCalled()
        jest.useRealTimers()
      })
  
      it('handles hardware back to reset home', () => {
        const remove = jest.fn()
        jest.spyOn(BackHandler, 'addEventListener').mockReturnValue({ remove })
        const { navigation } = renderPage(Login, { navigation: rootNavigation })
        const handler = (BackHandler.addEventListener as jest.Mock).mock.calls[0][1]
        handler()
        expect(navigation.reset).toHaveBeenCalledWith({
          index: 0,
          routes: [{ name: 'Home' }]
        })
      })
  
      it('redirects through onNavigationRedirect', () => {
        const { getByTestId, navigation } = renderPage(Login, { navigation: rootNavigation })
        fireEvent.press(getByTestId('login-redirect'))
        expect(navigation.navigate).toHaveBeenCalledWith('Signup', undefined)
      })
})
