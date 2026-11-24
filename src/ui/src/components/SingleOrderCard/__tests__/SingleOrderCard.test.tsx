import '../../../../../../jest/helpers/registerM6NativeMocks'

import React from 'react'
import { act, fireEvent } from '@testing-library/react-native'

import { SingleOrderCard } from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

jest.mock('@components', () => {
  const m6 = require('../../../../../../jest/helpers/m6OrdersComponentsMock')
  const d = require('../../../../../../jest/helpers/m6OrdersDefaults')
  return m6.getMock({
    SingleOrderCard: m6.renderUiController(d.singleOrderCardDefaults)
  })
})
jest.mock('@ui', () => require('../../../../../../jest/helpers/m6OrdersUiMock').getUiMock())

describe('SingleOrderCard', () => {
  it('puts the number and the date on two lines when the line does not fit', () => {
    const { getByText, queryByText, UNSAFE_getAllByType } = renderWithProviders(
      <SingleOrderCard onNavigationRedirect={jest.fn()} pastOrders={false} />
    )
    const { Text } = require('react-native')
    const line = UNSAFE_getAllByType(Text).find((node: any) => node.props.onTextLayout)
    expect(line).toBeTruthy()
    expect(queryByText(/Order No/)).toBeTruthy()
    act(() => {
      line!.props.onTextLayout({ nativeEvent: { lines: [{}, {}] } })
    })
    // two texts now: the number alone and the date alone, no dot between them
    expect(getByText(/^Order No\. \d+$/)).toBeTruthy()
    expect(UNSAFE_getAllByType(Text).some((node: any) => node.props.onTextLayout)).toBe(false)
  })

  it('keeps the number and the date on one line when it fits', () => {
    const { UNSAFE_getAllByType } = renderWithProviders(
      <SingleOrderCard onNavigationRedirect={jest.fn()} pastOrders={false} />
    )
    const { Text } = require('react-native')
    const line = UNSAFE_getAllByType(Text).find((node: any) => node.props.onTextLayout)
    act(() => {
      line!.props.onTextLayout({ nativeEvent: { lines: [{}] } })
    })
    expect(UNSAFE_getAllByType(Text).some((node: any) => node.props.onTextLayout)).toBe(true)
  })

  it('renders past order business name and status', () => {
    const { getByText } = renderWithProviders(
      <SingleOrderCard onNavigationRedirect={jest.fn()} />
    )
    expect(getByText('Pizza Place')).toBeTruthy()
    expect(getByText(/Status 1/)).toBeTruthy()
  })

  it('shows reorder button for past orders', () => {
    const { getByText } = renderWithProviders(
      <SingleOrderCard onNavigationRedirect={jest.fn()} />
    )
    expect(getByText('Reorder')).toBeTruthy()
  })

  it('navigates to order details when card pressed', () => {
    const onNavigationRedirect = jest.fn()
    const { getByTestId } = renderWithProviders(
      <SingleOrderCard onNavigationRedirect={onNavigationRedirect} />
    )
    fireEvent.press(getByTestId('card-animation'))
    expect(onNavigationRedirect).toHaveBeenCalledWith('OrderDetails', expect.objectContaining({ orderId: 'order-uuid-41' }))
  })
})
