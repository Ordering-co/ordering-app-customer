import '../../../../../../jest/helpers/registerM6NativeMocks'

import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { OrderDetails } from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'
import { withTheme } from '../../../../../../jest/helpers/themeWith'
import { setNativeFeatures } from '../../../../../utils/nativeKeys'

jest.mock('../../../hooks/useDriverInterpolation', () => ({
  useDriverInterpolation: jest.fn(() => null)
}))

jest.mock('../OrderEta', () => {
  const { Text } = require('react-native')
  return { OrderEta: () => <Text testID="order-eta">ETA</Text> }
})

// The total is the bill's (one summary, as the cart's and the checkout's): the stub shows it unless hidden.
jest.mock('../Bill', () => {
  const { View, Text } = require('react-native')
  return { Bill: ({ hideTotal }: any) => <View testID="bill-stub">{!hideTotal && <Text>Total</Text>}</View> }
})

jest.mock('@components', () => {
  const m6 = require('../../../../../../jest/helpers/m6OrdersComponentsMock')
  const d = require('../../../../../../jest/helpers/m6OrdersDefaults')
  return m6.getMock({
    OrderDetails: m6.renderUiController(d.orderDetailsDefaults)
  })
})
jest.mock('@ui', () => require('../../../../../../jest/helpers/m6OrdersUiMock').getUiMock())

describe('OrderDetails', () => {
  it('renders in-progress order header and total', () => {
    const { getByText, getByTestId } = renderWithProviders(
      <OrderDetails onNavigationRedirect={jest.fn()} />
    )
    expect(getByText(/Pick up completed by driver/i)).toBeTruthy()
    expect(getByText('Total')).toBeTruthy()
    expect(getByTestId('bill-stub')).toBeTruthy()
  })

  it('shows student info when order has student', () => {
    const { getByTestId } = renderWithProviders(
      <OrderDetails onNavigationRedirect={jest.fn()} />
    )
    expect(getByTestId('order-student-info-stub')).toBeTruthy()
  })

  it('opens help messages for business', () => {
    const onNavigationRedirect = jest.fn()
    const { getByTestId } = renderWithProviders(
      <OrderDetails onNavigationRedirect={onNavigationRedirect} />
    )
    fireEvent.press(getByTestId('order-help-button'))
    expect(onNavigationRedirect).toHaveBeenCalledWith(
      'MessageView',
      expect.objectContaining({ type: 'business' })
    )
  })
})

describe('OrderDetails delivery PIN', () => {
  const collectText = (node: any): string[] => {
    if (typeof node === 'string') return [node]
    if (Array.isArray(node)) return node.flatMap(collectText)
    return (node?.children || []).flatMap(collectText)
  }

  const renderWithOrder = (overrides: Record<string, unknown>) => {
    const d = require('../../../../../../jest/helpers/m6OrdersDefaults')
    return renderWithProviders(
      <OrderDetails
        onNavigationRedirect={jest.fn()}
        order={{ loading: false, error: null, order: { ...d.sampleOrder, ...overrides } }}
      />
    )
  }

  it('shows the PIN with its leading zero while it is requested on an active order', () => {
    const { getByTestId, getByText, toJSON } = renderWithOrder({
      delivery_pin: '0427',
      delivery_pin_status: 'requested'
    })
    expect(getByTestId('delivery-pin')).toBeTruthy()
    expect(getByText('Delivery PIN')).toBeTruthy()
    expect(getByText('0427')).toBeTruthy()
    expect(getByText('Give this code to the driver when you receive your order')).toBeTruthy()
    const texts = collectText(toJSON())
    expect(texts.indexOf('0427')).toBeGreaterThan(-1)
    expect(texts.indexOf('0427')).toBeLessThan(texts.findIndex(text => /Pick up completed by driver/i.test(text)))
  })

  it('hides the PIN once it has been validated', () => {
    const { queryByTestId, queryByText } = renderWithOrder({
      delivery_pin: '0427',
      delivery_pin_status: 'validated'
    })
    expect(queryByTestId('delivery-pin')).toBeNull()
    expect(queryByText('0427')).toBeNull()
  })

  it('hides the PIN when the order has none', () => {
    const { queryByTestId } = renderWithOrder({
      delivery_pin: null,
      delivery_pin_status: 'requested'
    })
    expect(queryByTestId('delivery-pin')).toBeNull()
  })

  it('hides the PIN when the order is completed', () => {
    const { queryByTestId, queryByText } = renderWithOrder({
      status: 1,
      delivery_pin: '0427',
      delivery_pin_status: 'requested'
    })
    expect(queryByTestId('delivery-pin')).toBeNull()
    expect(queryByText('0427')).toBeNull()
  })
})

describe('OrderDetails driver map', () => {
  const renderOnTheWay = () => {
    const d = require('../../../../../../jest/helpers/m6OrdersDefaults')
    return renderWithProviders(
      <OrderDetails
        onNavigationRedirect={jest.fn()}
        order={{
          loading: false,
          error: null,
          order: {
            ...d.sampleOrder,
            status: 9,
            driver: { id: 3, name: 'Dana', lastname: 'Driver', location: { lat: 40.72, lng: -74.01 } }
          }
        }}
      />
    )
  }

  afterEach(() => setNativeFeatures(undefined))

  it('shows the driver on the map with the app\'s Google Maps key', () => {
    setNativeFeatures({ googleMaps: true })
    const { getByTestId, getByText } = renderOnTheWay()
    expect(getByTestId('google-map-stub')).toBeTruthy()
    expect(getByText(/Dana\s+Driver/)).toBeTruthy()
  })

  it('leaves the map out without the key: the driver and the order stay', () => {
    setNativeFeatures({ googleMaps: false })
    const { queryByTestId, getByText } = renderOnTheWay()
    expect(queryByTestId('google-map-stub')).toBeNull()
    expect(getByText(/Dana\s+Driver/)).toBeTruthy()
    expect(getByText('Total')).toBeTruthy()
  })
})

describe('OrderDetails that could not load', () => {
  const renderFailed = (getOrder = jest.fn()) => {
    const onNavigationRedirect = jest.fn()
    const utils = renderWithProviders(
      <OrderDetails
        onNavigationRedirect={onNavigationRedirect}
        getOrder={getOrder}
        order={{ loading: false, error: ['ERROR_ORDER_FIND'], order: null }}
      />
    )
    return { ...utils, onNavigationRedirect, getOrder }
  }

  it('stays on the screen with the error instead of redirecting to a tab that does not exist', () => {
    const { getByText, onNavigationRedirect } = renderFailed()
    expect(getByText("We couldn't load this order")).toBeTruthy()
    expect(onNavigationRedirect).not.toHaveBeenCalled()
  })

  it('loads the order again from its retry', () => {
    const { getByTestId, getOrder } = renderFailed()
    fireEvent.press(getByTestId('not-found-btn'))
    expect(getOrder).toHaveBeenCalled()
  })
})

describe('OrderDetails without a session (an order link opened signed out)', () => {
  const { useSession } = require('@components')
  const signedIn = (useSession as jest.Mock).getMockImplementation()

  afterEach(() => (useSession as jest.Mock).mockImplementation(signedIn as any))

  it('asks to log in instead of requesting the order, and opens the login', () => {
    ;(useSession as jest.Mock).mockReturnValue([{ auth: false, loading: false, user: null, token: null }, {}])
    const onNavigationRedirect = jest.fn()
    const { getByText, getByTestId, queryByText } = renderWithProviders(
      <OrderDetails onNavigationRedirect={onNavigationRedirect} />
    )
    expect(getByText('Log in to see this order')).toBeTruthy()
    expect(queryByText('Total')).toBeNull()
    fireEvent.press(getByTestId('not-found-btn'))
    expect(onNavigationRedirect).toHaveBeenCalledWith('Login')
  })

  it('shows nothing while the session is still loading', () => {
    ;(useSession as jest.Mock).mockReturnValue([{ auth: null, loading: true, user: null, token: null }, {}])
    const { queryByText } = renderWithProviders(<OrderDetails onNavigationRedirect={jest.fn()} />)
    expect(queryByText('Log in to see this order')).toBeNull()
    expect(queryByText('Total')).toBeNull()
  })
})

describe('OrderDetails title', () => {
  it('tells the page the number of the order it loaded', () => {
    const onOrderNumber = jest.fn()
    const d = require('../../../../../../jest/helpers/m6OrdersDefaults')
    renderWithProviders(<OrderDetails onNavigationRedirect={jest.fn()} onOrderNumber={onOrderNumber} />)
    expect(onOrderNumber).toHaveBeenCalledWith(d.sampleOrder.id)
  })
})

describe('OrderDetails progress (order_details.base.progress_layout)', () => {
  const segments = withTheme({ components: { order_details: { base: { progress_layout: 'segments' } } } })
  const renderOrder = (overrides: Record<string, unknown>, options?: any) => {
    const d = require('../../../../../../jest/helpers/m6OrdersDefaults')
    return renderWithProviders(
      <OrderDetails
        onNavigationRedirect={jest.fn()}
        order={{ loading: false, error: null, order: { ...d.sampleOrder, ...overrides } }}
      />,
      options
    )
  }
  const bars = (utils: any) => utils.UNSAFE_queryAllByProps({ accessibilityRole: 'progressbar' }).filter((node: any) => typeof node.type === 'string')

  it('is one bar by default, without segments', () => {
    const utils = renderOrder({})
    expect(utils.queryByTestId('order-step-0')).toBeNull()
    expect(bars(utils)).toHaveLength(1)
    expect(bars(utils)[0].props.accessibilityValue.max).toBe(100)
  })

  it('is four segments with the steps of a delivery when the theme says segments', () => {
    const utils = renderOrder({ status: 9, delivery_type: 1 }, segments)
    ;[0, 1, 2, 3].forEach((index) => expect(utils.getByTestId(`order-step-${index}`)).toBeTruthy())
    expect(utils.queryByTestId('order-step-4')).toBeNull()
    expect(bars(utils)).toHaveLength(1)
    expect(bars(utils)[0].props.accessibilityValue).toEqual({ min: 0, max: 4, now: 3, text: 'On the way' })
    expect(utils.getByText('Delivered')).toBeTruthy()
  })

  it('names the steps of a pickup for an order that is not delivered', () => {
    const utils = renderOrder({ status: 4, delivery_type: 2 }, segments)
    expect(bars(utils)[0].props.accessibilityValue).toEqual({ min: 0, max: 4, now: 3, text: 'Ready for pickup' })
    expect(utils.queryByText('On the way')).toBeNull()
    expect(utils.queryByText('Delivered')).toBeNull()
  })

  it('has neither when the theme hides the progress', () => {
    const utils = renderOrder({}, withTheme({
      components: { order_details: { base: { progress_layout: 'segments' } } },
      visibility: { 'confirmation.order.progress': false }
    }))
    expect(utils.queryByTestId('order-step-0')).toBeNull()
    expect(bars(utils)).toHaveLength(0)
  })
})
