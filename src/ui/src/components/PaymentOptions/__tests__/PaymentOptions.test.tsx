import '../../../../../../jest/helpers/registerM5NativeMocks'

import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { PaymentOptions } from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'
import { setNativeFeatures } from '../../../../../utils/nativeKeys'

jest.mock('@components', () => {
  const m5 = require('../../../../../../jest/helpers/m5CheckoutComponentsMock')
  const d = require('../../../../../../jest/helpers/m5CheckoutDefaults')
  return m5.getMock({
    PaymentOptions: m5.renderUiController({
      ...d.paymentOptionsDefaults,
      paymethodV2Featured: []
    })
  })
})
jest.mock('@ui', () => require('../../../../../../jest/helpers/m5CheckoutUiMock').getUiMock())

describe('PaymentOptions', () => {
  describe('Apple Pay and the merchant id', () => {
    const { Platform, FlatList } = require('react-native')
    // Apple Pay shows as its mark (an image): the list's methods tell.
    const gateways = (view: any) => view.UNSAFE_getByType(FlatList).props.data.map((p: any) => p.gateway)
    const originalOS = Platform.OS
    const applePayList = {
      loading: false,
      error: null,
      paymethods: [
        { id: 1, gateway: 'cash', name: 'Cash', enabled: true },
        { id: 3, gateway: 'apple_pay', name: 'Apple Pay', enabled: true }
      ]
    }

    beforeEach(() => {
      Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' })
    })
    afterEach(() => {
      Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS })
    })

    afterEach(() => setNativeFeatures(undefined))

    it.each(['none', '', 'null', '-', '0', '_MERCHANT_ID_', 'com.ordering.v5app5'])('hides Apple Pay without a merchant id (%j)', merchantId => {
      const view = renderWithProviders(
        <PaymentOptions paymethodsList={applePayList} merchantId={merchantId} />
      )
      expect(gateways(view)).toEqual(['cash'])
    })

    it('hides Apple Pay when the app is signed without its entitlement, whatever config.json says', () => {
      setNativeFeatures({ applePay: false })
      const view = renderWithProviders(
        <PaymentOptions paymethodsList={applePayList} merchantId='merchant.com.ordering.app' />
      )
      expect(gateways(view)).toEqual(['cash'])
    })

    it('shows Apple Pay with a merchant id and the entitlement', () => {
      setNativeFeatures({ applePay: true })
      const view = renderWithProviders(
        <PaymentOptions paymethodsList={applePayList} merchantId='merchant.com.ordering.app' />
      )
      expect(gateways(view)).toEqual(['cash', 'apple_pay'])
    })

    it('shows Apple Pay with a merchant id', () => {
      const view = renderWithProviders(
        <PaymentOptions paymethodsList={applePayList} merchantId='merchant.com.ordering.app' />
      )
      expect(gateways(view)).toEqual(['cash', 'apple_pay'])
    })
  })

  it('renders available payment methods', () => {
    const { getByText } = renderWithProviders(<PaymentOptions />)
    expect(getByText('Cash')).toBeTruthy()
    expect(getByText('Credit Card')).toBeTruthy()
  })

  it('selects cash payment method', () => {
    const { getByText } = renderWithProviders(<PaymentOptions />)
    fireEvent.press(getByText('Cash'))
    expect(getByText('Cash')).toBeTruthy()
  })

  it('does not render the saved cards list for cash', () => {
    const { queryByTestId } = renderWithProviders(
      <PaymentOptions isOpenMethod={{ paymethod: { id: 1, gateway: 'cash', name: 'Cash' } }} />
    )
    expect(queryByTestId('stripe-cards-list-stub')).toBeNull()
  })

  it.each(['stripe', 'stripe_connect_v2'])('renders the saved cards list for %s', (gateway) => {
    const paymethod = { id: 85, gateway, name: 'Card', credentials: { publishable: 'pk_test' } }
    const { getByTestId } = renderWithProviders(
      <PaymentOptions isOpenMethod={{ paymethod }} paySelected={paymethod} />
    )
    expect(getByTestId('stripe-cards-list-stub')).toBeTruthy()
  })

  it.each(['stripe', 'stripe_connect_v2'])('keeps the saved cards list open for a cart that already has %s', (gateway) => {
    const paymethod = { id: 85, gateway, name: 'Card', credentials: { publishable: 'pk_test' } }
    const { getByTestId } = renderWithProviders(
      <PaymentOptions
        isOpenMethod={{ paymethod: null }}
        paySelected={{ id: 85, paymethodId: 85, gateway, paymethod, data: { id: 'card_1' } }}
      />
    )
    expect(getByTestId('stripe-cards-list-stub')).toBeTruthy()
  })

  it('closes the saved cards list when another method is being picked', () => {
    const paymethod = { id: 85, gateway: 'stripe', name: 'Card', credentials: { publishable: 'pk_test' } }
    const { queryByTestId } = renderWithProviders(
      <PaymentOptions
        isOpenMethod={{ paymethod: { id: 2, gateway: 'stripe_direct', name: 'Stripe Direct' } }}
        paySelected={{ id: 85, paymethodId: 85, gateway: 'stripe', paymethod, data: { id: 'card_1' } }}
      />
    )
    expect(queryByTestId('stripe-cards-list-stub')).toBeNull()
  })

})
