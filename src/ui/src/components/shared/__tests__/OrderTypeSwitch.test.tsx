import React from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { fireEvent } from '@testing-library/react-native'
import { useConfig, useOrder } from '@components'

import { OrderTypeSwitch } from '../OrderTypeSwitch'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

jest.mock('@components', () => {
  const { createElement } = require('react')
  return {
    ...require('../../../../../../jest/helpers/mockOrdering'),
    OrderTypeControl: ({ UIComponent, ...props }: any) => createElement(UIComponent, props)
  }
})
jest.mock('@ui', () => ({ OText: require('../OText').default }))

const setUp = (allowed: string | undefined, order: any = { loading: false, options: { type: 1 } }) => {
  ;(useConfig as jest.Mock).mockReturnValue([{ loading: false, configs: allowed === undefined ? {} : { order_types_allowed: { value: allowed } } }])
  ;(useOrder as jest.Mock).mockReturnValue([order, {}])
}

const renderSwitch = (typeSelected = 1) => {
  const handleChangeOrderType = jest.fn()
  const utils = renderWithProviders(<OrderTypeSwitch typeSelected={typeSelected} handleChangeOrderType={handleChangeOrderType} />)
  return { ...utils, handleChangeOrderType }
}

const tabOf = (utils: any, text: string) => {
  let node = utils.getByText(text)
  while (node && node.props.accessibilityRole !== 'tab') node = node.parent
  return node
}

describe('OrderTypeSwitch', () => {
  it('lists the order types the project allows as tabs, the order\'s one selected', () => {
    setUp('1|2')
    const utils = renderSwitch(2)
    expect(utils.getAllByRole('tab')).toHaveLength(2)
    expect(tabOf(utils, 'Delivery').props.accessibilityState.selected).toBe(false)
    expect(tabOf(utils, 'Pickup').props.accessibilityState.selected).toBe(true)
    expect(utils.queryByText('Eat in')).toBeNull()
  })

  it.each([
    ['one allowed type', '2'],
    ['no allowed type', ''],
    ['no config', undefined],
    ['types the app does not know', '98|99']
  ])('renders nothing with %s', (_name, allowed) => {
    setUp(allowed)
    expect(renderSwitch().toJSON()).toBeNull()
  })

  it('changes the order to another type', () => {
    setUp('1|2')
    const utils = renderSwitch(1)
    fireEvent.press(utils.getByText('Pickup'))
    expect(utils.handleChangeOrderType).toHaveBeenCalledTimes(1)
    expect(utils.handleChangeOrderType).toHaveBeenCalledWith(2)
  })

  it('does nothing for the type already selected', () => {
    setUp('1|2')
    const utils = renderSwitch(1)
    fireEvent.press(utils.getByText('Delivery'))
    expect(utils.handleChangeOrderType).not.toHaveBeenCalled()
  })

  it('does nothing while the order is loading', () => {
    setUp('1|2', { loading: true, options: { type: 1 } })
    const utils = renderSwitch(1)
    fireEvent.press(utils.getByText('Pickup'))
    expect(utils.handleChangeOrderType).not.toHaveBeenCalled()
  })

  it('stretches up to three types over the width, without a scroll', () => {
    setUp('1|2|3')
    const utils = renderSwitch()
    expect(utils.getAllByRole('tab')).toHaveLength(3)
    expect(utils.UNSAFE_queryAllByType(ScrollView)).toHaveLength(0)
    utils.getAllByRole('tab').forEach((tab: any) => expect(StyleSheet.flatten(tab.props.style).flex).toBe(1))
  })

  it('scrolls from four types on, each at its own width', () => {
    setUp('1|2|3|4')
    const utils = renderSwitch()
    expect(utils.getAllByRole('tab')).toHaveLength(4)
    expect(utils.UNSAFE_queryAllByType(ScrollView)).toHaveLength(1)
    utils.getAllByRole('tab').forEach((tab: any) => expect(StyleSheet.flatten(tab.props.style).flex).toBeUndefined())
  })
})
