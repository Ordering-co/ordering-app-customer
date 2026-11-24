import React from 'react'
import { StyleSheet } from 'react-native'
import { fireEvent } from '@testing-library/react-native'

import { OrderContextPill } from '../OrderContextPill'
import OButton from '../OButton'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'
import { themeWith, withTheme } from '../../../../../../jest/helpers/themeWith'
import { defaultAppTheme } from '@/theme/engine'
import { themePart } from '@/theme/helpers'

const asButton = (slot?: Record<string, unknown>) => ({
  components: { header: { base: { context_style: 'button' }, ...(slot && { slots: { context: slot } }) } }
})
const renderPill = (props: any = {}, options?: any) => renderWithProviders(<OrderContextPill testID="pill" text="Delivery" {...props} />, options)
const chevrons = (utils: any) => utils.getByTestId('pill').findAll((node: any) => typeof node.type === 'string' && node.props?.name === 'chevron-down')

describe('OrderContextPill (header.base.context_style)', () => {
  it('is a field with the look of the inputs and a chevron by default', () => {
    const utils = renderPill()
    const input = defaultAppTheme().native.components.input
    const box = StyleSheet.flatten(utils.getByTestId('pill').props.style)
    expect(utils.UNSAFE_queryAllByType(OButton)).toHaveLength(0)
    expect(box).toMatchObject({ flexDirection: 'row', justifyContent: 'space-between', borderRadius: input.base.radius })
    expect(StyleSheet.flatten(utils.getByText('Delivery').props.style).color).toBe(input.base.text_color)
    expect(chevrons(utils)).toHaveLength(1)
  })

  it('stays a field for the field option', () => {
    const utils = renderPill({}, withTheme({ components: { header: { base: { context_style: 'field' } } } }))
    expect(utils.UNSAFE_queryAllByType(OButton)).toHaveLength(0)
    expect(chevrons(utils)).toHaveLength(1)
  })

  it('opens its options when pressed as a field, and not while it is disabled', () => {
    const onPress = jest.fn()
    fireEvent.press(renderPill({ onPress }).getByTestId('pill'))
    expect(onPress).toHaveBeenCalledTimes(1)
    fireEvent.press(renderPill({ onPress, disabled: true }).getByTestId('pill'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})

describe('OrderContextPill as a button (header.slots.context)', () => {
  it('is a solid primary button of its text, without a chevron', () => {
    const values = asButton()
    const utils = renderPill({}, withTheme(values))
    const button = utils.UNSAFE_getByType(OButton)
    expect(button.props).toMatchObject({ text: 'Delivery', size: 'md', color: 'primary', appearance: 'solid' })
    expect(chevrons(utils)).toHaveLength(0)
    expect(StyleSheet.flatten(utils.getByText('Delivery').props.style).color).toBe(themePart(themeWith(values), 'button', 'variants.primary.solid.color'))
  })

  it('takes the size, color and appearance of the slot', () => {
    const slot = { size: 'sm', color: 'neutral', appearance: 'tonal' }
    const values = asButton(slot)
    const utils = renderPill({}, withTheme(values))
    expect(utils.UNSAFE_getByType(OButton).props).toMatchObject(slot)
    expect(StyleSheet.flatten(utils.getByText('Delivery').props.style).color).toBe(themePart(themeWith(values), 'button', 'variants.neutral.tonal.color'))
  })

  it('leaves the slot alone while it is a field', () => {
    const utils = renderPill({}, withTheme({ components: { header: { slots: { context: { size: 'sm', color: 'danger', appearance: 'tonal' } } } } }))
    expect(utils.UNSAFE_queryAllByType(OButton)).toHaveLength(0)
    expect(chevrons(utils)).toHaveLength(1)
  })

  it('opens its options when pressed, and not while it is disabled', () => {
    const onPress = jest.fn()
    fireEvent.press(renderPill({ onPress }, withTheme(asButton())).getByTestId('pill'))
    expect(onPress).toHaveBeenCalledTimes(1)
    const disabled = renderPill({ onPress, disabled: true }, withTheme(asButton()))
    expect(disabled.UNSAFE_getByType(OButton).props.disabled).toBe(true)
    fireEvent.press(disabled.getByTestId('pill'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
