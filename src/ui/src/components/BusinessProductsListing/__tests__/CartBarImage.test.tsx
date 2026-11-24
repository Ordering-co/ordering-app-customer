import '../../../../../../jest/helpers/registerM4NativeMocks'

import React from 'react'
import { StyleSheet } from 'react-native'

import { CartBarImage } from '../CartBarImage'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'
import { themeWith, withTheme } from '../../../../../../jest/helpers/themeWith'
import { themeControlHeight } from '@/theme/helpers'

jest.mock('@components', () => require('../../../../../../jest/helpers/mockOrdering'))
jest.mock('@ui', () => ({ OText: require('../../shared/OText').default }))

const image = { images: { 'icons.cart_bar': 'https://example.com/cart-bar.png' } }

describe('CartBarImage (images.icons.cart_bar)', () => {
  it('is nothing without the image of the theme, whatever the count', () => {
    expect(renderWithProviders(<CartBarImage />).toJSON()).toBeNull()
    expect(renderWithProviders(<CartBarImage count={3} />).toJSON()).toBeNull()
  })

  it('draws the image of the theme in a box of the large control height', () => {
    const size = themeControlHeight(themeWith(image), 'lg')
    const { getByTestId } = renderWithProviders(<CartBarImage count={2} />, withTheme(image))
    const box = getByTestId('cart-bar-image')
    expect(StyleSheet.flatten(box.props.style)).toEqual({ width: size, height: size })
    const images = box.findAll((node: any) => typeof node.type === 'string' && node.props?.source)
    expect(images).toHaveLength(1)
    expect(images[0].props.source).toEqual({ uri: 'https://example.com/cart-bar.png' })
  })

  it.each([
    [1, '1'],
    [12, '12'],
    [99, '99'],
    [100, '99+'],
    [250, '99+']
  ])('counts %s products as %s', (count, label) => {
    const { getByText } = renderWithProviders(<CartBarImage count={count} />, withTheme(image))
    expect(getByText(label)).toBeTruthy()
  })

  it.each([[undefined], [0], [-2]])('has no count badge for %s products', (count) => {
    const { getByTestId, queryByText } = renderWithProviders(<CartBarImage count={count} />, withTheme(image))
    expect(getByTestId('cart-bar-image').children).toHaveLength(1)
    expect(queryByText(/\d/)).toBeNull()
  })
})
