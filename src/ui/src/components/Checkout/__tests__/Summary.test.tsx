import '../../../../../../jest/helpers/registerM4NativeMocks'

import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { Summary } from '../Summary'
import OButton from '../../shared/OButton'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'
import { themeWith, withTheme } from '../../../../../../jest/helpers/themeWith'
import { defaultAppTheme } from '@/theme/engine'
import { themeColor, themePart } from '@/theme/helpers'

const mockCart: any = {
  uuid: 'cart-1',
  business_id: 1,
  status: 0,
  business: { name: 'Burger Guys', slug: 'burger-guys' },
  products: [{ id: 9, code: 'burger', name: 'Buffalo Ranch Chicken', price: 10.35, quantity: 1, total: 10.35 }]
}

jest.mock('@components', () => {
  const React = require('react')
  return {
    Cart: (props: any) => props.UIComponent ? React.createElement(props.UIComponent, props) : null,
    useOrder: () => [{ carts: { 'businessId:1': mockCart } }],
    useLanguage: () => [null, (_key: string, fallback: string) => fallback],
    useUtils: () => [{ parsePrice: (value: number) => `$${value}`, optimizeImage: (value: string) => value }]
  }
})

jest.mock('@ui', () => {
  const { Text } = require('react-native')
  return {
    OText: ({ children }: any) => <Text>{children}</Text>,
    OButton: require('../../shared/OButton').default,
    Icon: require('../../shared/Icon').default
  }
})

describe('Checkout summary', () => {
  const navigation = { navigate: jest.fn(), push: jest.fn() }

  const renderSummary = () => renderWithProviders(
    <Summary showComponent businessId={1} navigation={navigation} />
  )

  beforeEach(() => {
    navigation.navigate.mockClear()
    navigation.push.mockClear()
    mockCart.status = 0
  })

  it('opens the cart editor from the summary', () => {
    const { getByTestId } = renderSummary()
    fireEvent.press(getByTestId('checkout-edit-cart'))
    expect(navigation.navigate).toHaveBeenCalledWith('UpsellingPage', { businessId: 1 })
  })

  it('lists a pending cart without the ways to change it', () => {
    mockCart.status = 2
    const { getByText, queryByTestId } = renderSummary()

    expect(queryByTestId('checkout-edit-cart')).toBeNull()
    fireEvent.press(getByText('Buffalo Ranch Chicken'))
    expect(navigation.navigate).not.toHaveBeenCalled()
    expect(navigation.push).not.toHaveBeenCalled()
  })
})

describe('Checkout summary: its edit button (checkout.slots.edit)', () => {
  const navigation = { navigate: jest.fn(), push: jest.fn() }
  const renderSummary = (options?: any) => renderWithProviders(
    <Summary showComponent businessId={1} navigation={navigation} />,
    options
  )
  const pencil = (utils: any) => utils.getByTestId('checkout-edit-cart').findAll((node: any) => typeof node.type === 'string' && node.props?.name === 'pencil-outline')[0]

  beforeEach(() => {
    navigation.navigate.mockClear()
    mockCart.status = 0
  })

  it('is a ghost neutral button with a muted pencil by default', () => {
    const utils = renderSummary()
    expect(utils.UNSAFE_getByType(OButton).props).toMatchObject({ iconOnly: true, color: 'neutral', appearance: 'ghost', size: 'md' })
    expect(pencil(utils).props.color).toBe(themeColor(defaultAppTheme(), 'text_muted'))
  })

  it('takes the look of the slot, which paints the pencil, and still opens the cart', () => {
    const values = { components: { checkout: { slots: { edit: { color: 'primary', appearance: 'tonal', size: 'sm' } } } } }
    const utils = renderSummary(withTheme(values))
    expect(utils.UNSAFE_getByType(OButton).props).toMatchObject({ color: 'primary', appearance: 'tonal', size: 'sm' })
    expect(pencil(utils).props.color).toBe(themePart(themeWith(values), 'button', 'variants.primary.tonal.color'))
    fireEvent.press(utils.getByTestId('checkout-edit-cart'))
    expect(navigation.navigate).toHaveBeenCalledWith('UpsellingPage', { businessId: 1 })
  })
})
