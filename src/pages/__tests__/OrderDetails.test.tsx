import { StackActions as NavActions } from '@react-navigation/routers'
import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { useBusiness } from '@components'
import { renderPage } from '../../../jest/helpers/renderPage'

jest.mock('@ui', () => require('../../../jest/helpers/mockUi'))

jest.mock('../../config.js', () => ({
  __esModule: true,
  default: {
    franchiseSlug: 'demo-franchise'
  }
}))

jest.mock('../../layouts/SafeAreaViewWrapper', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    SafeAreaViewWrapper: ({ children }: any) => (
      <View testID="layout-safe-area">{children}</View>
    )
  }
})


import OrderDetails from '../OrderDetails'


beforeEach(() => {
    jest.clearAllMocks()
    ;(useBusiness as jest.Mock).mockReturnValue([
      { business: { id: 99 } }
    ])
  })

describe('OrderDetails', () => {
  it('renders order number in navbar title', () => {
        const { getByTestId } = renderPage(OrderDetails, {
          route: { params: { orderNumberId: 1234, orderId: 'ord-1' } }
        })
        expect(getByTestId('navbar-title').props.children).toBe('Order No. 1234')
        expect(getByTestId('order-details-controller')).toBeTruthy()
      })
  
      it('titles the screen "Order" until the order loads, then with its number (a deep link brings only the uuid)', () => {
        const { getByTestId } = renderPage(OrderDetails, {
          route: { params: { orderId: 'order-uuid' } }
        })
        expect(getByTestId('navbar-title').props.children).toBe('Order')
        fireEvent.press(getByTestId('order-details-loaded'))
        expect(getByTestId('navbar-title').props.children).toBe('Order No. 4466')
      })

      it('navbar back from checkout navigates to home tab', () => {
        const { getByTestId, navigation } = renderPage(OrderDetails, {
          route: { params: { isFromCheckout: true } }
        })
        fireEvent.press(getByTestId('navbar-back'))
        expect(navigation.dispatch).toHaveBeenCalledWith(NavActions.popTo('BottomTab', { screen: 'Home' }, { merge: false }))
      })
  
      it('navbar back from home navigates to home tab', () => {
        const { getByTestId, navigation } = renderPage(OrderDetails, {
          route: { params: { fromHome: true } }
        })
        fireEvent.press(getByTestId('navbar-back'))
        expect(navigation.dispatch).toHaveBeenCalledWith(NavActions.popTo('BottomTab', { screen: 'Home' }, { merge: false }))
      })
  
      it('navbar back uses goBack or falls back to my orders tab', () => {
        const { getByTestId, navigation } = renderPage(OrderDetails)
        fireEvent.press(getByTestId('navbar-back'))
        expect(navigation.goBack).toHaveBeenCalled()
      })
  
      it('navbar back falls back to my orders when cannot go back', () => {
        const { getByTestId, navigation } = renderPage(OrderDetails, {
          navigation: { canGoBack: jest.fn(() => false) }
        })
        fireEvent.press(getByTestId('navbar-back'))
        expect(navigation.dispatch).toHaveBeenCalledWith(NavActions.popTo('BottomTab', { screen: 'MyOrders' }, { merge: false }))
      })
  
      it('handles controller go back and navigation redirect', () => {
        const { getByTestId, navigation } = renderPage(OrderDetails, {
          navigation: { canGoBack: jest.fn(() => false) }
        })
        fireEvent.press(getByTestId('order-details-go-back'))
        expect(navigation.goBack).not.toHaveBeenCalled()
        fireEvent.press(getByTestId('order-details-nav'))
        expect(navigation.navigate).toHaveBeenCalledWith('ReviewOrder', {
          order: { id: 1 }
        })
        fireEvent.press(getByTestId('order-details-nav-empty'))
        expect(navigation.navigate).toHaveBeenCalledTimes(1)
      })
})

