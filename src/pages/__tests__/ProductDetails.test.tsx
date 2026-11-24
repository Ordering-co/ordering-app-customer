import { StackActions as NavActions } from '@react-navigation/routers'
import React from 'react'
import { fireEvent } from '@testing-library/react-native'
import { StackActions } from '@react-navigation/native'

import { useConfig, useOrder } from '@components'
import { renderPage } from '../../../jest/helpers/renderPage'

jest.mock('@ui', () => require('../../../jest/helpers/mockUi'))

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native')
  return {
    ...actual,
    StackActions: {
      ...jest.requireActual('@react-navigation/routers').StackActions,
      replace: jest.fn((name: string, params: unknown) => ({
        type: 'REPLACE',
        payload: { name, params }
      }))
    }
  }
})


import ProductDetails from '../ProductDetails'


beforeEach(() => {
    jest.clearAllMocks()
    ;(useOrder as jest.Mock).mockReturnValue([
      { options: { type: 1 } },
      {}
    ])
    ;(useConfig as jest.Mock).mockReturnValue([{
      configs: {
        max_days_preorder: { key: 'max_days_preorder', value: '3' },
        preorder_slot_interval: { key: 'preorder_slot_interval', value: 'catering_delivery,30|catering_pickup,45' },
        preorder_lead_time: { key: 'preorder_lead_time', value: 'catering_delivery,60|catering_pickup,90' },
        preorder_time_range: { key: 'preorder_time_range', value: 'catering_delivery,120|catering_pickup,180' },
        preorder_maximum_days: { key: 'preorder_maximum_days', value: 'catering_delivery,5|catering_pickup,7' },
        preorder_minimum_days: { key: 'preorder_minimum_days', value: 'catering_delivery,1|catering_pickup,2' }
      }
    }])
  })

describe('ProductDetails', () => {
  it('renders product form with route params', () => {
        const callbackAfterUpdateCart = jest.fn()
        const { getByTestId } = renderPage(ProductDetails, {
          route: {
            params: {
              productId: 10,
              businessId: 2,
              isCartProduct: true,
              callbackAfterUpdateCart
            }
          }
        })
        expect(getByTestId('product-form')).toBeTruthy()
      })
  
      it('a cart product saved tells the screen that opened it (the multi checkout reloads)', () => {
        const getState = () => ({ index: 1, routes: [{ key: 'mc', name: 'MultiCheckout' }, { key: 'pd', name: 'ProductDetails' }] })
        const { getByTestId, navigation } = renderPage(ProductDetails, {
          route: { params: { isCartProduct: true } },
          navigation: { getState } as any
        })
        fireEvent.press(getByTestId('product-cart-updated'))
        expect(navigation.dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'SET_PARAMS', source: 'mc' }))
      })

      it('goes back on save when navigation can go back', () => {
        const { getByTestId, navigation } = renderPage(ProductDetails)
        fireEvent.press(getByTestId('product-save'))
        expect(navigation.goBack).toHaveBeenCalled()
      })
  
      it('replaces to business on save when redirect flag is set', () => {
        const { getByTestId, navigation } = renderPage(ProductDetails, {
          route: {
            params: {
              isRedirect: 'business',
              alreadyInBusinessListing: false,
              business: { store: 'biz-1', header: 'H', logo: 'L' }
            }
          }
        })
        fireEvent.press(getByTestId('product-save'))
        expect(navigation.replace).toHaveBeenCalledWith('Business', {
          store: 'biz-1',
          header: 'H',
          logo: 'L'
        })
      })
  
      it('navigates to bottom tab when cannot go back', () => {
        const { getByTestId, navigation } = renderPage(ProductDetails, {
          navigation: { canGoBack: jest.fn(() => false) }
        })
        fireEvent.press(getByTestId('product-go-back'))
        expect(navigation.dispatch).toHaveBeenCalledWith(NavActions.popTo('BottomTab', undefined, { merge: false }))
      })
})

