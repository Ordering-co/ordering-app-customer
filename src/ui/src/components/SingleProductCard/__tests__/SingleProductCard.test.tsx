import '../../../../../../jest/helpers/registerM4NativeMocks'

import React from 'react'
import { fireEvent } from '@testing-library/react-native'
import { useSession, useToast, useToastActions } from '@components'

import { SingleProductCard } from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

jest.mock('@components', () => require('../../../../../../jest/helpers/m4MenuComponentsMock').getMock())
jest.mock('@ui', () => require('../../../../../../jest/helpers/m4MenuUiMock').getUiMock())

describe('SingleProductCard', () => {
  it('renders product name', () => {
    const { getByText } = renderWithProviders(
      <SingleProductCard product={{ id: 100, name: 'Cheese Slice', price: 5 }} />
    )
    expect(getByText('Cheese Slice')).toBeTruthy()
  })

  it('calls onProductClick when pressed', () => {
    const defaults = require('../../../../../../jest/helpers/m4MenuDefaults').singleProductCardDefaults
    defaults.onProductClick.mockClear()
    const { getByText } = renderWithProviders(
      <SingleProductCard product={defaults.product} />
    )
    fireEvent.press(getByText('Cheese Slice'))
    expect(defaults.onProductClick).toHaveBeenCalled()
  })

  it('opens the product, as the card does, from "View more" of a long description (no popup)', () => {
    const defaults = require('../../../../../../jest/helpers/m4MenuDefaults').singleProductCardDefaults
    const product = { ...defaults.product, description: 'A long description that goes past the fifty characters the card shows' }
    const onProductClick = jest.fn()
    const { getByText, queryByText } = renderWithProviders(
      <SingleProductCard {...defaults} product={product} onProductClick={onProductClick} />
    )
    fireEvent.press(getByText('View more'))
    expect(onProductClick).toHaveBeenCalledTimes(1)
    expect(onProductClick).toHaveBeenCalledWith(product)
    // The product's description is not shown again in a popup.
    expect(queryByText(product.description)).toBeNull()
  })

  it('redirects to login when favorite tapped while logged out', () => {
    ;(useSession as jest.Mock).mockReturnValueOnce([{ auth: false, user: null, token: null }, {}])
    const navigation = { navigate: jest.fn() }
    const defaults = require('../../../../../../jest/helpers/m4MenuDefaults').singleProductCardDefaults
    const { UNSAFE_getAllByType } = renderWithProviders(
      <SingleProductCard
        product={defaults.product}
        navigation={navigation}
        handleFavoriteProduct={jest.fn()}
      />
    )
    const { TouchableOpacity } = require('react-native')
    const buttons = UNSAFE_getAllByType(TouchableOpacity)
    if (buttons.length > 1) {
      fireEvent.press(buttons[1])
    }
    expect(navigation.navigate).toHaveBeenCalledWith('Login')
  })

  it('reads the toast\'s actions, not its state: a toast that shows or hides does not render every card', () => {
    const defaults = require('../../../../../../jest/helpers/m4MenuDefaults').singleProductCardDefaults
    ;(useToast as jest.Mock).mockClear()
    ;(useToastActions as jest.Mock).mockClear()
    ;(useToastActions as jest.Mock).mockReturnValueOnce({ showToast: jest.fn() })
    renderWithProviders(<SingleProductCard product={defaults.product} />)
    expect(useToastActions).toHaveBeenCalledTimes(1)
    expect(useToast).not.toHaveBeenCalled()
  })

  it('still says so when the product is at its maximum per order', () => {
    const defaults = require('../../../../../../jest/helpers/m4MenuDefaults').singleProductCardDefaults
    const showToast = jest.fn()
    ;(useToastActions as jest.Mock).mockReturnValueOnce({ showToast })
    const onProductClick = jest.fn()
    const { getByText } = renderWithProviders(
      <SingleProductCard
        {...defaults}
        product={{ ...defaults.product, maximum_per_order: 2 }}
        productAddedToCartLength={2}
        onProductClick={onProductClick}
      />
    )
    fireEvent.press(getByText('Cheese Slice'))
    expect(showToast).toHaveBeenCalledWith('error', 'The product is on maximum order')
    expect(onProductClick).not.toHaveBeenCalled()
  })
})
