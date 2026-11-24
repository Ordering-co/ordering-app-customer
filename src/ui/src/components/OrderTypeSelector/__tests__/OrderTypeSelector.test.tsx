import '../../../../../../jest/helpers/registerM6NativeMocks'

import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { OrderTypeSelector } from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'
import { themeWith, withTheme } from '../../../../../../jest/helpers/themeWith'
import { ORDER_TYPE_ICONS, ORDER_TYPE_IMAGES } from '../../../utils'

jest.mock('@components', () => {
  const m6 = require('../../../../../../jest/helpers/m6OrdersComponentsMock')
  const d = require('../../../../../../jest/helpers/m6OrdersDefaults')
  return m6.getMock({
    OrderTypeControl: m6.renderUiController({
      ...d.orderTypeSelectorDefaults,
      configTypes: [1, 2, 3],
      orderTypes: [
        { value: 1, content: 'DELIVERY' },
        { value: 2, content: 'PICKUP' },
        { value: 3, content: 'EAT_IN' }
      ]
    })
  })
})
const mockBarProps = jest.fn()
jest.mock('@ui', () => {
  const ui = require('../../../../../../jest/helpers/m6OrdersUiMock').getUiMock()
  return {
    ...ui,
    FloatingButton: (props: any) => {
      mockBarProps(props)
      return ui.FloatingButton(props)
    }
  }
})

describe('OrderTypeSelector', () => {
  it('renders available order types', () => {
    const { getByText } = renderWithProviders(
      <OrderTypeSelector goToBack={jest.fn()} configTypes={[1, 2, 3]} />
    )
    expect(getByText('Delivery')).toBeTruthy()
    expect(getByText('Pickup')).toBeTruthy()
    expect(getByText('Eat in')).toBeTruthy()
  })

  it('continues with selected order type', () => {
    const handleChangeOrderType = jest.fn()
    const goToBack = jest.fn()
    const { getByText } = renderWithProviders(
      <OrderTypeSelector
        handleChangeOrderType={handleChangeOrderType}
        goToBack={goToBack}
        configTypes={[1, 2, 3]}
        typeSelected={1}
      />
    )
    fireEvent.press(getByText('Pickup'))
    fireEvent.press(getByText('Continue'))
    expect(handleChangeOrderType).toHaveBeenCalledWith(2)
    expect(goToBack).toHaveBeenCalled()
  })
})

describe('OrderTypeSelector: the image of an order type (images.order_types.*)', () => {
  const glyphs = (utils: any, type: number) =>
    utils.UNSAFE_queryAllByProps({ name: ORDER_TYPE_ICONS[type].name }).filter((node: any) => typeof node.type === 'string')
  const images = (utils: any) => utils.queryAllByTestId('fast-image').map((image: any) => image.props.source)
  const renderTypes = (options?: any) => renderWithProviders(
    <OrderTypeSelector goToBack={jest.fn()} configTypes={[1, 2, 3]} />,
    options
  )

  it('names an image of the theme for every order type', () => {
    expect(ORDER_TYPE_IMAGES).toMatchObject({ 1: 'order_types.delivery', 2: 'order_types.pickup' })
    Object.keys(ORDER_TYPE_ICONS).forEach((type) => expect(ORDER_TYPE_IMAGES[Number(type)]).toMatch(/^order_types\./))
  })

  it('draws the vector icon of each type by default', () => {
    const utils = renderTypes()
    expect(images(utils)).toEqual([])
    expect(glyphs(utils, 1)).toHaveLength(1)
    expect(glyphs(utils, 2)).toHaveLength(1)
    expect(glyphs(utils, 3)).toHaveLength(1)
  })

  it('draws the image of the theme for its type only, and the type is still chosen from it', () => {
    const handleChangeOrderType = jest.fn()
    const utils = renderWithProviders(
      <OrderTypeSelector handleChangeOrderType={handleChangeOrderType} goToBack={jest.fn()} configTypes={[1, 2, 3]} typeSelected={2} />,
      withTheme({ images: { 'order_types.delivery': 'https://example.com/delivery.png' } })
    )
    expect(images(utils)).toEqual([{ uri: 'https://example.com/delivery.png' }])
    expect(glyphs(utils, 1)).toHaveLength(0)
    expect(glyphs(utils, 2)).toHaveLength(1)
    expect(glyphs(utils, 3)).toHaveLength(1)
    fireEvent.press(utils.getByText('Delivery'))
    fireEvent.press(utils.getByText('Continue'))
    expect(handleChangeOrderType).toHaveBeenCalledWith(1)
  })

  it('draws an image for each type the theme sets', () => {
    const utils = renderTypes(withTheme({
      images: {
        'order_types.delivery': 'https://example.com/delivery.png',
        'order_types.pickup': 'https://example.com/pickup.png'
      }
    }))
    expect(images(utils)).toEqual([{ uri: 'https://example.com/delivery.png' }, { uri: 'https://example.com/pickup.png' }])
    expect(glyphs(utils, 3)).toHaveLength(1)
  })
})

describe('OrderTypeSelector: the bottom bar (order_types_page)', () => {
  const lastBar = () => mockBarProps.mock.calls[mockBarProps.mock.calls.length - 1][0]
  const renderTypes = (options?: any) => renderWithProviders(
    <OrderTypeSelector goToBack={jest.fn()} configTypes={[1, 2, 3]} />,
    options
  )

  beforeEach(() => mockBarProps.mockClear())

  it('keeps the bar and the button of the other pages by default', () => {
    renderTypes()
    expect(lastBar().containerStyle).toBeUndefined()
    expect(lastBar().look).toBeUndefined()
  })

  it('takes the background and the button of its own component', () => {
    const values = {
      components: { order_types_page: { base: { bar_background: '#FFFFFF' }, slots: { button: { component: 'button', size: 'lg', appearance: 'solid', color: 'success' } } } }
    }
    renderTypes(withTheme(values))
    const base = themeWith(values).native.components.order_types_page.base
    expect(lastBar().containerStyle).toEqual({ backgroundColor: base.bar_background })
    expect(lastBar().look).toMatchObject({ size: 'lg', color: 'success', appearance: 'solid' })
  })
})
