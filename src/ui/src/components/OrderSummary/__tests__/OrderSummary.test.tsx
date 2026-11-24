import '../../../../../../jest/helpers/registerM6NativeMocks'

import React from 'react'
import { StyleSheet } from 'react-native'
import { fireEvent } from '@testing-library/react-native'

import { OrderSummaryUI } from '..'
import OButton from '../../shared/OButton'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'
import { withTheme } from '../../../../../../jest/helpers/themeWith'
import { defaultAppTheme } from '@/theme/engine'
import { themeColor } from '@/theme/helpers'

const buildCart = (overrides = {}) => ({
  uuid: 'cart-1',
  status: 0,
  valid: true,
  valid_products: true,
  valid_schedule: true,
  valid_address: true,
  valid_maximum: true,
  valid_minimum: true,
  business_id: 1,
  business: { id: 1, name: 'Pizza Place', slug: 'pizza-place', tax_type: 1 },
  products: [{
    id: 100,
    code: 'prod-1',
    name: 'Cheese Slice',
    price: 5,
    quantity: 1,
    total: 5,
    tax: { id: 1 },
    fee: { id: 1 },
    offers: []
  }],
  subtotal: 10,
  total: 12.5,
  discount: 0,
  driver_tip: 0,
  delivery_price: 2.5,
  taxes: [],
  fees: [],
  offers: [],
  payment_events: [],
  comment: '',
  ...overrides
})

jest.mock('@components', () => {
  const m6 = require('../../../../../../jest/helpers/m6OrdersComponentsMock')
  const product = { id: 100, code: 'prod-1', name: 'Cheese Slice', price: 5, quantity: 1, total: 5, tax: { id: 1 }, fee: { id: 1 }, offers: [] }
  const cart = {
    uuid: 'cart-1',
    status: 0,
    valid: true,
    business_id: 1,
    business: { id: 1, name: 'Pizza Place', slug: 'pizza-place', tax_type: 1 },
    products: [product],
    subtotal: 10,
    total: 12.5,
    discount: 0,
    driver_tip: 0,
    delivery_price: 2.5,
    taxes: [],
    fees: [],
    offers: [],
    payment_events: [],
    comment: ''
  }
  return m6.getMock({
    useOrder: jest.fn(() => [{
      loading: false,
      options: { type: 1, moment: null },
      carts: { 'businessId:1': cart }
    }, {
      changeQuantity: jest.fn(),
      removeProduct: jest.fn().mockResolvedValue(),
      clearCart: jest.fn().mockResolvedValue()
    }])
  })
})
jest.mock('@ui', () => require('../../../../../../jest/helpers/m6OrdersUiMock').getUiMock())

describe('OrderSummary', () => {
  it('renders cart products and subtotal', () => {
    const d = require('../../../../../../jest/helpers/m6OrdersDefaults')
    const cart = buildCart()
    const { getByText, getAllByTestId } = renderWithProviders(
      <OrderSummaryUI {...d.orderSummaryDefaults} cart={cart} />
    )
    expect(getAllByTestId('product-item-accordion-stub').length).toBeGreaterThan(0)
    expect(getByText('Subtotal')).toBeTruthy()
    expect(getByText('Total')).toBeTruthy()
  })

  it('clears a gift cart when deleting its product', async () => {
    const { useOrder } = require('@components')
    const d = require('../../../../../../jest/helpers/m6OrdersDefaults')
    const removeProduct = jest.fn()
    const clearCart = jest.fn().mockResolvedValue({ error: false })
    const cart = buildCart({ business_id: null, uuid: 'gift-1' })
    useOrder.mockReturnValue([{
      loading: false,
      options: { type: 1, moment: null },
      carts: { 'businessId:null': cart }
    }, {
      changeQuantity: jest.fn(),
      removeProduct,
      clearCart
    }])
    const { getByTestId } = renderWithProviders(
      <OrderSummaryUI
        {...d.orderSummaryDefaults}
        cart={cart}
        removeProduct={removeProduct}
        clearCart={clearCart}
      />
    )
    await fireEvent.press(getByTestId('product-delete'))
    expect(clearCart).toHaveBeenCalledWith('gift-1')
    expect(removeProduct).not.toHaveBeenCalled()
  })
})

describe('OrderSummary: the button that clears the cart on its page (cart.slots.clear_page)', () => {
  const slotOf = (slot: Record<string, unknown>) => ({ components: { cart: { slots: { clear_page: slot } } } })
  const hostParent = (node: any) => {
    let parent = node.parent
    while (parent && typeof parent.type !== 'string') parent = parent.parent
    return parent
  }
  const renderPage = (options?: any, props: any = {}) => {
    const { useOrder } = require('@components')
    const d = require('../../../../../../jest/helpers/m6OrdersDefaults')
    const clearCart = jest.fn().mockResolvedValue({ error: false })
    const cart = buildCart()
    useOrder.mockReturnValue([{
      loading: false,
      options: { type: 1, moment: null },
      carts: { 'businessId:1': cart }
    }, {
      changeQuantity: jest.fn(),
      removeProduct: jest.fn(),
      clearCart
    }])
    const utils = renderWithProviders(
      <OrderSummaryUI {...d.orderSummaryDefaults} cart={cart} showOnlyProducts clearCart={clearCart} {...props} />,
      options
    )
    return { ...utils, clearCart }
  }
  const clearButtons = (utils: any) => utils.UNSAFE_queryAllByType(OButton).filter((button: any) => button.props.text === 'Clear Cart')

  it('keeps the original box by default: the danger text on its subtle background, not a button of the theme', () => {
    const utils = renderPage()
    const box = StyleSheet.flatten(hostParent(utils.getByText('Clear Cart')).props.style)
    expect(clearButtons(utils)).toHaveLength(0)
    expect(box.backgroundColor).toBe(themeColor(defaultAppTheme(), 'danger_subtle'))
    expect(box.alignSelf).toBe('flex-start')
  })

  it('keeps the original box for a slot that names a color and a size without an appearance', () => {
    const utils = renderPage(withTheme(slotOf({ color: 'neutral', size: 'lg' })))
    expect(clearButtons(utils)).toHaveLength(0)
    expect(utils.getByText('Clear Cart')).toBeTruthy()
  })

  it('is a danger button of the theme when the slot names an appearance', () => {
    const utils = renderPage(withTheme(slotOf({ appearance: 'outline' })))
    const buttons = clearButtons(utils)
    expect(buttons).toHaveLength(1)
    expect(buttons[0].props).toMatchObject({ color: 'danger', appearance: 'outline', size: 'md' })
    expect(utils.getAllByText('Clear Cart')).toHaveLength(1)
  })

  it('takes the color, the appearance and the size of the slot', () => {
    const slot = { color: 'neutral', appearance: 'tonal', size: 'sm' }
    expect(clearButtons(renderPage(withTheme(slotOf(slot))))[0].props).toMatchObject(slot)
  })

  it('leaves the touch of the button to the alert that wraps it', () => {
    const utils = renderPage(withTheme(slotOf({ appearance: 'solid' })))
    expect(clearButtons(utils)[0].props.onClick).toBeUndefined()
    expect(hostParent(utils.getByRole('button', { name: 'Clear Cart' })).props.pointerEvents).toBe('none')
  })

  it.each([
    ['the original box', undefined],
    ['the button of the theme', withTheme(slotOf({ appearance: 'solid' }))]
  ])('clears the cart from %s once the alert is accepted', async (_name, options) => {
    const utils = renderPage(options)
    expect(utils.clearCart).not.toHaveBeenCalled()
    await fireEvent.press(utils.getByTestId('oalert-trigger'))
    expect(utils.clearCart).toHaveBeenCalledWith('cart-1')
  })

  it('has no way to clear the cart outside its page, whatever the slot', () => {
    const utils = renderPage(withTheme(slotOf({ appearance: 'solid' })), { showOnlyProducts: false })
    expect(utils.queryByText('Clear Cart')).toBeNull()
  })

  it('is shown on the cart page as before, whatever the cart.clear visibility', () => {
    const utils = renderPage(withTheme({ ...slotOf({ appearance: 'solid' }), visibility: { 'cart.clear': false } }))
    expect(utils.queryByText('Clear Cart')).not.toBeNull()
  })
})
