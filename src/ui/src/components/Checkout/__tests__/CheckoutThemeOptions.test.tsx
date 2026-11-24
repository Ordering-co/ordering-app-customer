import '../../../../../../jest/helpers/registerM5NativeMocks'

import React from 'react'
import { AppState, StyleSheet } from 'react-native'
import { waitFor } from '@testing-library/react-native'

import { Checkout } from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'
import { themeWith, withTheme } from '../../../../../../jest/helpers/themeWith'
import { defaultAppTheme } from '@/theme/engine'

const mockBarProps = jest.fn()
const mockDetailsProps = jest.fn()
const mockControllerProps = jest.fn()
const mockHeaderProps = jest.fn()

jest.mock('../../../../../utils', () => ({
  parseCartPaymethodData: (cart: any) => cart?.paymethod_data ?? null,
  REDIRECT_PAYMETHODS: ['stripe_redirect', 'paypal']
}))

jest.mock('../../BusinessesListing/Layout/Original/HeaderContent', () => {
  const { View } = require('react-native')
  return {
    HeaderContent: (props: any) => {
      mockHeaderProps(props)
      return <View testID="header-content-stub" />
    }
  }
})

jest.mock('../../shared/OrderTypeSwitch', () => {
  const { View } = require('react-native')
  return { OrderTypeSwitch: () => <View testID="order-type-switch-stub" /> }
})

jest.mock('../../BusinessBasicInformation/BusinessDetailsBox', () => {
  const { View } = require('react-native')
  return {
    BusinessDetailsBox: (props: any) => {
      mockDetailsProps(props)
      return <View testID="business-details-box-stub" />
    }
  }
})

jest.mock('../BusinessDetails', () => {
  const { View } = require('react-native')
  return { BusinessDetailsComponent: () => <View testID="business-details-stub" /> }
})

jest.mock('../Summary', () => {
  const { View } = require('react-native')
  return { Summary: () => <View testID="summary-stub" /> }
})

jest.mock('../DeliveryOptions', () => {
  const { View } = require('react-native')
  return { DeliveryOptionsComponent: () => <View testID="delivery-options-stub" /> }
})

jest.mock('@components', () => {
  const m5 = require('../../../../../../jest/helpers/m5CheckoutComponentsMock')
  const d = require('../../../../../../jest/helpers/m5CheckoutDefaults')
  const render = m5.renderUiController(d.checkoutDefaults)
  return m5.getMock({
    Checkout: (props: any) => {
      mockControllerProps(props)
      return render(props)
    }
  })
})
jest.mock('@ui', () => {
  const { Text, View } = require('react-native')
  const ui = require('../../../../../../jest/helpers/m5CheckoutUiMock').getUiMock()
  return {
    ...ui,
    PaymentOptions: () => null,
    FloatingButton: (props: any) => {
      mockBarProps(props)
      return (
        <View testID="floating-button">
          <Text>{props.text}</Text>
          {props.secondElement}
        </View>
      )
    }
  }
})

const last = (mock: jest.Mock) => mock.mock.calls[mock.mock.calls.length - 1][0]
const hostParent = (node: any) => {
  let parent = node.parent
  while (parent && typeof parent.type !== 'string') parent = parent.parent
  return parent
}
const renderCheckout = async (options?: any) => {
  const utils = renderWithProviders(<Checkout cartUuid="cart-1" onNavigationRedirect={jest.fn()} />, options)
  await waitFor(() => expect(utils.getByTestId('floating-button')).toBeTruthy())
  return utils
}

beforeEach(() => {
  jest.clearAllMocks()
  Object.defineProperty(AppState, 'currentState', {
    configurable: true,
    get: () => 'active'
  })
})

describe('Checkout: the total beside the button (checkout.base.total_background)', () => {
  const totalBox = (utils: any) => StyleSheet.flatten(hostParent(utils.getByText('Order total')).props.style)

  it('has no background of its own by default', async () => {
    const utils = await renderCheckout()
    expect(totalBox(utils)).toEqual({})
    expect(last(mockBarProps).joinedBackground).toBe('transparent')
  })

  it('gets its box when the bar is joined', async () => {
    const utils = await renderCheckout(withTheme({ components: { bottom_bar: { base: { joined: true } } } }))
    expect(totalBox(utils)).toMatchObject({ borderRadius: defaultAppTheme().native.components.card.base.radius })
    expect(totalBox(utils).paddingHorizontal).toBeGreaterThan(0)
  })

  it('takes the color of the theme, in the radius of the cards, and gives it to a joined bar', async () => {
    const values = { components: { checkout: { base: { total_background: '#102030' } } } }
    const color = themeWith(values).native.components.checkout.base.total_background
    const utils = await renderCheckout(withTheme(values))
    expect(color).not.toBe('transparent')
    expect(totalBox(utils)).toMatchObject({ backgroundColor: color, borderRadius: defaultAppTheme().native.components.card.base.radius })
    expect(last(mockBarProps).joinedBackground).toBe(color)
  })

  it('keeps the bar in a row, the total in place of a second button', async () => {
    await renderCheckout()
    expect(last(mockBarProps)).toMatchObject({ flexDirection: 'row', reverseOrder: true })
    expect(last(mockBarProps).secondElement).toBeTruthy()
    expect(last(mockBarProps).text2nd).toBeUndefined()
  })

  it('still gives the color to the bar when the theme hides the total', async () => {
    const values = {
      components: { checkout: { base: { total_background: '#102030' } } },
      visibility: { 'checkout.place_order.total': false }
    }
    const utils = await renderCheckout(withTheme(values))
    expect(utils.queryByText('Order total')).toBeNull()
    expect(last(mockBarProps).secondElement).toBeUndefined()
    expect(last(mockBarProps).joinedBackground).toBe(themeWith(values).native.components.checkout.base.total_background)
  })
})

describe('Checkout: the details of the business (visibility checkout.business.details)', () => {
  const on = withTheme({ visibility: { 'checkout.business.details': true } })
  const testIds = (node: any, ids: string[] = []): string[] => {
    if (!node) return ids
    if (Array.isArray(node)) {
      node.forEach((child) => testIds(child, ids))
      return ids
    }
    if (node.props?.testID) ids.push(node.props.testID)
    ;(node.children || []).forEach((child: any) => typeof child === 'object' && testIds(child, ids))
    return ids
  }

  it('has none by default, and asks the API for nothing more', async () => {
    const utils = await renderCheckout()
    expect(utils.queryByTestId('business-details-box-stub')).toBeNull()
    expect(mockDetailsProps).not.toHaveBeenCalled()
    expect(last(mockControllerProps).propsToFetch).toBeUndefined()
  })

  it('opens the checkout with the fee and the time of the business, above its sections, when the theme shows them', async () => {
    const utils = await renderCheckout(on)
    const ids = testIds(utils.toJSON())
    expect(utils.getAllByTestId('business-details-box-stub')).toHaveLength(1)
    expect(ids.indexOf('header-content-stub')).toBeLessThan(ids.indexOf('business-details-box-stub'))
    expect(ids.indexOf('business-details-box-stub')).toBeLessThan(ids.indexOf('business-details-stub'))
    expect(ids.indexOf('business-details-box-stub')).toBeLessThan(ids.indexOf('summary-stub'))
  })

  it('gives them the business with the delivery fee of the cart and no distance', async () => {
    const d = require('../../../../../../jest/helpers/m5CheckoutDefaults')
    await renderCheckout(on)
    const { business } = last(mockDetailsProps)
    expect(business).toMatchObject({ name: d.checkoutDefaults.businessDetails.business.name, distance: null })
    expect(business.delivery_price).toBe(d.checkoutDefaults.cart.delivery_price)
  })

  it('asks the API for the times of the business', async () => {
    await renderCheckout(on)
    expect(last(mockControllerProps).propsToFetch).toEqual(expect.arrayContaining(['id', 'name', 'delivery_time', 'pickup_time']))
  })

  it('goes before the order type switch when the theme shows both', async () => {
    const utils = await renderCheckout(withTheme({ visibility: { 'checkout.business.details': true, 'checkout.order_type_switch': true } }))
    const ids = testIds(utils.toJSON())
    expect(ids.indexOf('business-details-box-stub')).toBeLessThan(ids.indexOf('order-type-switch-stub'))
  })

  it('sits at the margin of the other sections, without its own side padding', async () => {
    const utils = await renderCheckout(withTheme({ visibility: { 'checkout.business.details': true, 'checkout.order_type_switch': true } }))
    const flat = (node: any) => Object.assign({}, ...[].concat(node.props.style).flat(Infinity).filter(Boolean))
    const parentOf = (id: string) => utils.getByTestId(id).parent as any
    expect(flat(parentOf('business-details-box-stub')).paddingHorizontal).toBeUndefined()
    expect(flat(parentOf('order-type-switch-stub')).paddingHorizontal).toBeUndefined()
  })

  it('has none while the cart is not there', () => {
    const utils = renderWithProviders(<Checkout onNavigationRedirect={jest.fn()} />, on)
    expect(utils.getByTestId('not-found-source')).toBeTruthy()
    expect(utils.queryByTestId('business-details-box-stub')).toBeNull()
  })
})

describe('Checkout: the order type of the header (visibility checkout.order_type_switch)', () => {
  it('keeps the order type in the header by default', async () => {
    await renderCheckout()
    expect(last(mockHeaderProps).hideOrderType).toBe(false)
  })

  it('takes it out of the header when the theme shows the switch', async () => {
    const utils = await renderCheckout(withTheme({ visibility: { 'checkout.order_type_switch': true } }))
    expect(last(mockHeaderProps).hideOrderType).toBe(true)
    expect(utils.getAllByTestId('order-type-switch-stub')).toHaveLength(1)
  })
})

describe('Checkout: the total of the bar (checkout.base.total_align)', () => {
  const totalBox = (utils: any) => StyleSheet.flatten(hostParent(utils.getByText('Order total')).props.style)

  it('keeps the total at the start by default', async () => {
    const utils = await renderCheckout()
    expect(totalBox(utils).alignItems).toBeUndefined()
  })

  it('centers the name and the amount of the total', async () => {
    const utils = await renderCheckout(withTheme({ components: { checkout: { base: { total_align: 'center' } } } }))
    expect(totalBox(utils).alignItems).toBe('center')
  })
})
