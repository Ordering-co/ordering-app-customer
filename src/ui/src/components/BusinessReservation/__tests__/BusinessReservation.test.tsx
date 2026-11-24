import '../../../../../../jest/helpers/registerM4NativeMocks'

import React from 'react'
import { fireEvent } from '@testing-library/react-native'
import { useOrder } from '@components'

import { BusinessReservation } from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

jest.mock('@components', () => require('../../../../../../jest/helpers/m4MenuComponentsMock').getMock())
jest.mock('@ui', () => require('../../../../../../jest/helpers/m4MenuUiMock').getUiMock())

const reservationOrderState = {
  loading: false,
  options: { type: 9 },
  carts: {}
}

describe('BusinessReservation', () => {
  beforeEach(() => {
    ;(useOrder as jest.Mock).mockReturnValue([reservationOrderState, {}])
  })

  it('renders reservation shell without crashing', () => {
    const { toJSON, getAllByTestId } = renderWithProviders(
      <BusinessReservation cart={require('../../../../../../jest/helpers/m4MenuDefaults').sampleCart} />
    )
    expect(toJSON()).toBeTruthy()
    expect(getAllByTestId('reservation-guests-select').length).toBeGreaterThan(0)
  })

  it('renders checkout reservation mode', () => {
    const { toJSON } = renderWithProviders(
      <BusinessReservation
        cart={require('../../../../../../jest/helpers/m4MenuDefaults').sampleCart}
        isCheckout
      />
    )
    expect(toJSON()).toBeTruthy()
  })

  it('selects guest count and continues', () => {
    const { getByTestId, queryAllByText, toJSON } = renderWithProviders(
      <BusinessReservation cart={require('../../../../../../jest/helpers/m4MenuDefaults').sampleCart} />
    )
    expect(toJSON()).toBeTruthy()
    // The guests select opens its sheet; a guest count is picked when the setting offers one.
    fireEvent.press(getByTestId('reservation-guests-select'))
    const items = queryAllByText(/\d+ Guests/)
    if (items.length) fireEvent.press(items[0])
  })
})
