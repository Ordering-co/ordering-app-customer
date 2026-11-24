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

jest.mock('@ui', () => require('../../../jest/helpers/mockUi'))

jest.mock('@/contexts/CookieConsentContext', () => ({
  useCookieConsent: jest.fn(() => ({ hasConsented: false }))
}))

import { useCookieConsent } from '@/contexts/CookieConsentContext'

import Signup from '../Signup'

// Login and Signup are screens of the root stack (next to MyAccount).
const rootNavigation = { getState: stackState(ROOT_STACK_SCREENS, ['MyAccount', 'Signup']) }


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

describe('Signup', () => {
  it('renders signup form', () => {
        const { getByTestId, getByText } = renderPage(Signup, { navigation: rootNavigation,
          route: { params: { notification_state: 'x' } }
        })
        expect(getByText('Sign up')).toBeTruthy()
        expect(getByTestId('signup-form')).toBeTruthy()
        expect(_setStoreData).toHaveBeenCalledWith('notification_state', 'x')
      })
  
      it('logs in and navigates home after signup', async () => {
        const login = jest.fn()
        ;(useSession as jest.Mock).mockReturnValue([{}, { login }])
        const { getByTestId, navigation } = renderPage(Signup, { navigation: rootNavigation })
        await act(async () => {
          fireEvent.press(getByTestId('signup-success-home'))
        })
        expect(_removeStoreData).toHaveBeenCalledWith('isGuestUser')
        expect(login).toHaveBeenCalled()
        expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'MyAccount', params: { screen: 'BottomTab', params: { screen: 'Home' } } }] })
      })

      it('does not force AddressList when signup user has no addresses array', async () => {
        const { getByTestId, navigation } = renderPage(Signup, { navigation: rootNavigation })
        await act(async () => {
          fireEvent.press(getByTestId('signup-success-missing-addresses'))
        })
        expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'MyAccount', params: { screen: 'BottomTab', params: { screen: 'Home' } } }] })
        expect(navigation.reset).not.toHaveBeenCalledWith({ index: 0, routes: [{ name: 'MyAccount', params: { screen: 'AddressList', params: undefined, initial: false } }] })
      })

      it('opens AddressList when signup user has an empty addresses array', async () => {
        const { getByTestId, navigation } = renderPage(Signup, { navigation: rootNavigation })
        await act(async () => {
          fireEvent.press(getByTestId('signup-success-empty-addresses'))
        })
        expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'MyAccount', params: { screen: 'AddressList', params: undefined, initial: false } }] })
      })

      it('opens AddressList when fetched signup addresses have no default', async () => {
        ;(useApi as jest.Mock).mockReturnValue([{
          setAccessToken: () => ({
            users: () => ({
              addresses: () => ({
                get: async () => ({ content: { error: false, result: [] } })
              })
            })
          })
        }, {}])
        const { getByTestId, navigation } = renderPage(Signup, { navigation: rootNavigation })
        await act(async () => {
          fireEvent.press(getByTestId('signup-success-missing-addresses'))
        })
        expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'MyAccount', params: { screen: 'AddressList', params: undefined, initial: false } }] })
      })
  
      it('skips navigation when verification is required', async () => {
        ;(useConfig as jest.Mock).mockReturnValue([{
          configs: {
            verification_email_required: { value: '1' },
            verification_phone_required: { value: '0' }
          }
        }])
        const { getByTestId, navigation } = renderPage(Signup, { navigation: rootNavigation })
        await act(async () => {
          fireEvent.press(getByTestId('signup-success-verify'))
        })
        expect(navigation.navigate).not.toHaveBeenCalled()
      })
})

