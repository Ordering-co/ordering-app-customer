import '../../../../../../jest/helpers/registerM6NativeMocks'

import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { MyOrders } from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

jest.mock('../../GiftCard/GiftCardOrdersList', () => {
  const { View, TouchableOpacity } = require('react-native')
  return {
    GiftCardOrdersList: (props: any) => (
      <View testID="gift-card-orders-list">
        <TouchableOpacity testID="gift-card-tab-refresh" onPress={() => props.setRefreshOrders?.(true)} />
      </View>
    )
  }
})

jest.mock('@components', () => require('../../../../../../jest/helpers/m6OrdersComponentsMock').getMock())
jest.mock('@ui', () => require('../../../../../../jest/helpers/m6OrdersUiMock').getUiMock())

describe('MyOrders', () => {
  it('renders orders tab with OrdersOption sections', () => {
    const d = require('../../../../../../jest/helpers/m6OrdersDefaults')
    const { getByText, getAllByTestId } = renderWithProviders(
      <MyOrders {...d.myOrdersDefaults} />
    )
    expect(getByText('Orders')).toBeTruthy()
    expect(getAllByTestId('orders-option-stub').length).toBeGreaterThan(0)
  })

  it('switches to business tab', () => {
    const d = require('../../../../../../jest/helpers/m6OrdersDefaults')
    const { getByText, getAllByTestId } = renderWithProviders(
      <MyOrders {...d.myOrdersDefaults} />
    )
    fireEvent.press(getByText('Business'))
    expect(getAllByTestId('orders-option-stub').length).toBe(1)
  })

  it('switches to gift card tab when enabled', () => {
    const d = require('../../../../../../jest/helpers/m6OrdersDefaults')
    const { getByText, getByTestId } = renderWithProviders(
      <MyOrders {...d.myOrdersDefaults} />
    )
    fireEvent.press(getByText('Gift card'))
    expect(getByTestId('gift-card-orders-list')).toBeTruthy()
  })
})

describe('ordersEmptyState', () => {
  const { ordersEmptyState } = require('..')
  const all = ['tabs', 'upcoming_orders', 'active_orders', 'past_orders']

  it('waits until every visible section has loaded', () => {
    expect(ordersEmptyState({ activeOrdersLength: 0, previousOrdersLength: 0, preordersLength: null }, all)).toBeNull()
  })

  it('is empty when every visible section loaded without orders', () => {
    expect(ordersEmptyState({ activeOrdersLength: 0, previousOrdersLength: 0, preordersLength: 0 }, all)).toBe('empty')
  })

  it('ignores the sections the theme hides', () => {
    expect(ordersEmptyState({ activeOrdersLength: 0, previousOrdersLength: null, preordersLength: null }, ['active_orders'])).toBe('empty')
  })

  it('is nothing while a section has orders', () => {
    expect(ordersEmptyState({ activeOrdersLength: 1, previousOrdersLength: 0, preordersLength: 0 }, all)).toBeNull()
  })

  it('is an error when a section could not load its list', () => {
    expect(ordersEmptyState({
      activeOrdersLength: 0,
      previousOrdersLength: 0,
      preordersLength: 0,
      errors: { activeOrdersLength: true }
    }, all)).toBe('error')
  })
})
