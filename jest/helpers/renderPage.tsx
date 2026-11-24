import React from 'react'
import { RenderOptions } from '@testing-library/react-native'
import { renderWithProviders } from './renderWithProviders'

type NavigationStub = {
  navigate: jest.Mock
  reset: jest.Mock
  goBack: jest.Mock
  canGoBack: jest.Mock
  dispatch: jest.Mock
  replace: jest.Mock
  getState: () => { routeNames: string[], routes: Array<{ name: string, params?: any }> }
  getParent: () => any
}

/** The app's main stack (HomeNavigator), with the tabs open: where most pages live. */
export const MAIN_STACK_SCREENS = [
  'AddressForm', 'AddressList', 'BottomTab', 'Business', 'BusinessSearchMap', 'Cart',
  'CashWallet', 'CheckoutPage', 'CouponOffers', 'Favorite', 'GiftCards', 'Help', 'HelpOptions', 'Home',
  'Languages', 'LoyaltyPoints', 'Messages', 'MessageView', 'MomentOption', 'MultiCart', 'MultiCheckout',
  'MultiOrdersDetails', 'MyStudents', 'Notifications', 'OrderDetails', 'OrderTypes', 'ProductDetails',
  'ProfileForm', 'ReviewDriver', 'ReviewOrder', 'ReviewProducts', 'SavedCards', 'Sessions', 'UpsellingPage',
  'UserVerification'
]
/** The root stack: Login and Signup live there. */
export const ROOT_STACK_SCREENS = ['MyAccount', 'Home', 'Login', 'Signup', 'Forgot']

export const stackState = (routeNames: string[], routes: Array<string | { name: string, params?: any }>) =>
  () => ({ routeNames, routes: routes.map(route => typeof route === 'string' ? { name: route } : route) })

type RenderPageOptions = Omit<RenderOptions, 'wrapper'> & {
  route?: { params?: Record<string, unknown> }
  navigation?: Partial<NavigationStub>
  pageProps?: Record<string, unknown>
}

export const createNavigationStub = (
  overrides: Partial<NavigationStub> = {}
): NavigationStub => ({
  navigate: jest.fn(),
  reset: jest.fn(),
  goBack: jest.fn(),
  canGoBack: jest.fn(() => true),
  dispatch: jest.fn(),
  replace: jest.fn(),
  getState: stackState(MAIN_STACK_SCREENS, ['BottomTab']),
  getParent: () => undefined,
  ...overrides
})

export const renderPage = (
  Page: React.ComponentType<any>,
  {
    route = { params: {} },
    navigation,
    pageProps = {},
    ...options
  }: RenderPageOptions = {}
) => {
  const navigationStub = createNavigationStub(navigation)
  const result = renderWithProviders(
    <Page navigation={navigationStub} route={route} {...pageProps} />,
    options
  )
  return { ...result, navigation: navigationStub, route }
}
