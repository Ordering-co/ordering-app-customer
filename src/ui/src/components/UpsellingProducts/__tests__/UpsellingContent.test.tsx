import '../../../../../../jest/helpers/registerM4NativeMocks'

import { IllustrationWrapper } from '../styles'
import React from 'react'
import { StyleSheet } from 'react-native'
import { fireEvent } from '@testing-library/react-native'

import { UpsellingContent } from '../UpsellingContent'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'
import { themeWith, withTheme } from '../../../../../../jest/helpers/themeWith'

const mockBarProps = jest.fn()
const mockHeaderProps = jest.fn()

jest.mock('@components', () => require('../../../../../../jest/helpers/m4MenuComponentsMock').getMock())
jest.mock('@ui', () => {
  const { Text, View } = require('react-native')
  return {
    OrderSummary: () => <View testID="order-summary" />,
    CartStudentAlert: () => <View testID="cart-student-alert" />,
    FloatingButton: (props: any) => {
      mockBarProps(props)
      return (
        <View testID="cart-bar" style={props.containerStyle}>
          <Text onPress={props.handleClick}>{props.text}</Text>
          <Text onPress={props.handle2ndClick}>{props.text2nd}</Text>
        </View>
      )
    }
  }
})

jest.mock('../UpsellingLayout', () => {
  const { View } = require('react-native')
  return { UpsellingLayout: () => <View testID="upselling-layout" /> }
})

jest.mock('../../BusinessesListing/Layout/Original/HeaderContent', () => {
  const { View } = require('react-native')
  return {
    HeaderContent: (props: any) => {
      mockHeaderProps(props)
      return <View testID="cart-header" />
    }
  }
})

const cartOf = (quantities: number[]) => ({
  uuid: 'cart-1',
  status: 0,
  business: { id: 1, name: 'Pizza Place' },
  products: quantities.map((quantity, index) => ({ id: index + 1, quantity }))
})

const renderPage = (options?: any, quantities: number[] = [2, 1]) => {
  const navigation = { navigate: jest.fn(), goBack: jest.fn(), dispatch: jest.fn() }
  require('@components').useOrder.mockReturnValue([
    { loading: false, options: { type: 1 }, carts: { 'businessId:1': cartOf(quantities) } },
    {}
  ])
  const utils = renderWithProviders(
    <UpsellingContent navigation={navigation} businessId={1} productsList={[]} onNavigationRedirect={jest.fn()} handleUpsellingPage={jest.fn()} />,
    options
  )
  return { ...utils, navigation }
}

const barProps = () => mockBarProps.mock.calls[mockBarProps.mock.calls.length - 1][0]
const cartBase = (base: Record<string, unknown>) => ({ components: { cart: { base } } })

beforeEach(() => jest.clearAllMocks())

describe('UpsellingContent: the bar of the cart (cart.base.bar_background)', () => {
  it('leaves the bar on its own background by default', () => {
    const utils = renderPage()
    expect(barProps().containerStyle).toBeUndefined()
    expect(StyleSheet.flatten(utils.getByTestId('cart-bar').props.style)).toBeUndefined()
  })

  it('paints the bar with the color of the theme', () => {
    const values = cartBase({ bar_background: '#102030' })
    const utils = renderPage(withTheme(values))
    const color = themeWith(values).native.components.cart.base.bar_background
    expect(barProps().containerStyle).toEqual({ backgroundColor: color })
    expect(StyleSheet.flatten(utils.getByTestId('cart-bar').props.style)).toEqual({ backgroundColor: color })
  })

  it.each([['transparent'], ['rgba(16, 32, 48, 0.5)']])('does not paint it with %s', (color) => {
    renderPage(withTheme(cartBase({ bar_background: color })))
    expect(barProps().containerStyle).toBeUndefined()
  })

  it('keeps the two actions of the bar, the checkout first and the secondary one beside it', () => {
    const utils = renderPage(withTheme(cartBase({ bar_background: '#102030' })))
    expect(barProps()).toMatchObject({
      text: 'Checkout',
      text2nd: 'Add more products',
      flexDirection: 'row',
      reverseOrder: true,
      classBtn2: 'secondary'
    })
    fireEvent.press(utils.getByText('Add more products'))
    expect(utils.navigation.goBack).toHaveBeenCalledTimes(1)
  })
})

describe('UpsellingContent: the picture of the cart (images.icons.cart_page, cart.base.illustration_size)', () => {
  const image = { images: { 'icons.cart_page': 'https://example.com/cart-page.png' } }
  const pictures = (node: any) => node.findAll((child: any) => typeof child.type === 'string' && child.props?.source?.uri === 'https://example.com/cart-page.png')

  it('has no picture by default', () => {
    expect(renderPage().queryByTestId('cart-bar-image')).toBeNull()
  })

  it('has no space for the picture without it, nor with the size alone', () => {
    expect(renderPage().UNSAFE_queryAllByType(IllustrationWrapper)).toHaveLength(0)
    expect(renderPage(withTheme(cartBase({ illustration_size: 220 }))).UNSAFE_queryAllByType(IllustrationWrapper)).toHaveLength(0)
    expect(renderPage(withTheme(image)).UNSAFE_queryAllByType(IllustrationWrapper)).toHaveLength(1)
  })

  it('has none for the size alone', () => {
    expect(renderPage(withTheme(cartBase({ illustration_size: 220 }))).queryByTestId('cart-bar-image')).toBeNull()
  })

  it('does not draw the picture of the cart bar in its place', () => {
    expect(renderPage(withTheme({ images: { 'icons.cart_bar': 'https://example.com/cart-bar.png' } })).queryByTestId('cart-bar-image')).toBeNull()
  })

  it('draws the picture of the theme under the products, at the default size of the theme', () => {
    const size = themeWith(image).native.components.cart.base.illustration_size
    const box = renderPage(withTheme(image)).getByTestId('cart-bar-image')
    expect(size).toBe(160)
    expect(StyleSheet.flatten(box.props.style)).toEqual({ width: size, height: size })
    expect(pictures(box)).toHaveLength(1)
    expect(StyleSheet.flatten(pictures(box)[0].props.style)).toEqual({ width: size, height: size })
  })

  it('draws it at the size of the theme', () => {
    const values = { ...image, ...cartBase({ illustration_size: 220 }) }
    const box = renderPage(withTheme(values)).getByTestId('cart-bar-image')
    expect(StyleSheet.flatten(box.props.style)).toEqual({ width: 220, height: 220 })
  })

  it.each([
    [[2, 1], '3'],
    [[60, 60], '99+']
  ])('counts the units of the cart %j over it as %s', (quantities, label) => {
    const utils = renderPage(withTheme(image), quantities as number[])
    expect(utils.getByText(label)).toBeTruthy()
  })
})

describe('UpsellingContent: the head of the cart', () => {
  it('is the cart head, which the theme can fill over the safe area', () => {
    renderPage()
    expect(mockHeaderProps).toHaveBeenLastCalledWith(expect.objectContaining({ isCart: true, fillable: true, coversInset: true }))
  })
})
