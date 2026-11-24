import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { EditButton } from '../EditButton'
import OButton from '../OButton'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'
import { themeWith, withTheme } from '../../../../../../jest/helpers/themeWith'
import { defaultAppTheme } from '@/theme/engine'
import { themeColor, themePart } from '@/theme/helpers'

const slotOf = (slot: Record<string, unknown>) => ({ components: { checkout: { slots: { edit: slot } } } })
const glyphOf = (utils: any) => utils.getByTestId('edit').findAll((node: any) => typeof node.type === 'string' && !!node.props?.name)[0]
const renderEdit = (props: any = {}, options?: any) => renderWithProviders(<EditButton testID="edit" accessibilityLabel="Edit" {...props} />, options)

describe('EditButton (checkout.slots.edit)', () => {
  it('is a ghost neutral icon button with a muted pencil by default', () => {
    const utils = renderEdit()
    const button = utils.UNSAFE_getByType(OButton)
    expect(button.props).toMatchObject({ iconOnly: true, color: 'neutral', appearance: 'ghost', size: 'md' })
    expect(glyphOf(utils).props.name).toBe('pencil-outline')
    expect(glyphOf(utils).props.color).toBe(themeColor(defaultAppTheme(), 'text_muted'))
    expect(glyphOf(utils).props.color).not.toBe(themePart(defaultAppTheme(), 'button', 'variants.neutral.ghost.color'))
    expect(utils.getByLabelText('Edit')).toBeTruthy()
  })

  it('keeps the muted pencil on a ghost button of another color', () => {
    const utils = renderEdit({}, withTheme(slotOf({ color: 'primary', appearance: 'ghost' })))
    expect(utils.UNSAFE_getByType(OButton).props).toMatchObject({ color: 'primary', appearance: 'ghost' })
    expect(glyphOf(utils).props.color).toBe(themeColor(defaultAppTheme(), 'text_muted'))
  })

  it.each([
    ['solid', 'primary'],
    ['tonal', 'primary'],
    ['outline', 'danger']
  ])('lets a %s button of the %s color paint the pencil with its ink', (appearance, color) => {
    const values = slotOf({ color, appearance })
    const utils = renderEdit({}, withTheme(values))
    expect(utils.UNSAFE_getByType(OButton).props).toMatchObject({ color, appearance })
    expect(glyphOf(utils).props.color).toBe(themePart(themeWith(values), 'button', `variants.${color}.${appearance}.color`))
  })

  it('takes the size of the slot, and its glyph the icon size of that size', () => {
    const values = slotOf({ size: 'sm' })
    const utils = renderEdit({}, withTheme(values))
    expect(utils.UNSAFE_getByType(OButton).props.size).toBe('sm')
    expect(glyphOf(utils).props.size).toBe(themePart(themeWith(values), 'button', 'sizes.sm.icon_size'))
    expect(glyphOf(renderEdit()).props.size).toBe(themePart(defaultAppTheme(), 'button', 'sizes.md.icon_size'))
  })

  it('draws another glyph it is given', () => {
    expect(glyphOf(renderEdit({ icon: 'close' })).props.name).toBe('close')
  })

  it('runs its action when pressed', () => {
    const onClick = jest.fn()
    fireEvent.press(renderEdit({ onClick }).getByTestId('edit'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
