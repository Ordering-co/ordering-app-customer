import React from 'react'
import { StyleSheet } from 'react-native'
import { fireEvent } from '@testing-library/react-native'

import { BackButton } from '../styles'
import OButton from '../OButton'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'
import { themeWith, withTheme } from '../../../../../../jest/helpers/themeWith'
import { defaultAppTheme } from '@/theme/engine'

const closeSlot = (slot: Record<string, unknown>) => ({ components: { modal: { slots: { close: slot } } } })
const backIcon = (icon: string) => ({ components: { header: { base: { back_icon: icon } } } })
const renderBack = (options?: any, props: any = {}) => renderWithProviders(<BackButton testID="back" {...props} />, options)
const hostParent = (node: any) => {
  let parent = node.parent
  while (parent && typeof parent.type !== 'string') parent = parent.parent
  return parent
}
const pullOf = (utils: any) => StyleSheet.flatten(hostParent(utils.getByTestId('back')).props.style).marginLeft
const glyphOf = (utils: any) => utils.getByTestId('back').findAll((node: any) => typeof node.type === 'string' && !!node.props?.name)[0]
const insetOf = (theme: any, size: string) => {
  const sized = theme.native.components.button.sizes[size]
  return (sized.height - sized.icon_size) / 2
}

describe('BackButton: where its glyph starts (modal.slots.close.appearance)', () => {
  it('pulls the ghost button of the default theme to the page side, by the room around its glyph', () => {
    const utils = renderBack()
    const inset = insetOf(defaultAppTheme(), 'md')
    expect(utils.UNSAFE_getByType(OButton).props).toMatchObject({ iconOnly: true, appearance: 'ghost', color: 'neutral', size: 'md' })
    expect(inset).toBeGreaterThan(0)
    expect(pullOf(utils)).toBe(-inset)
  })

  it('pulls a ghost button of another size by the room of that size', () => {
    const values = closeSlot({ size: 'lg' })
    expect(pullOf(renderBack(withTheme(values)))).toBe(-insetOf(themeWith(values), 'lg'))
  })

  it.each([['solid'], ['tonal'], ['outline']])('pulls a %s button as well by default', (appearance) => {
    const values = closeSlot({ appearance })
    const utils = renderBack(withTheme(values))
    expect(utils.UNSAFE_getByType(OButton).props.appearance).toBe(appearance)
    expect(pullOf(utils)).toBe(-insetOf(themeWith(values), 'md'))
  })

  it('keeps the pull of a ghost button with header.base.back_aligned on', () => {
    const values = { components: { header: { base: { back_aligned: true } } } }
    expect(pullOf(renderBack(withTheme(values)))).toBe(-insetOf(themeWith(values), 'md'))
  })

  it.each([['solid'], ['tonal'], ['outline']])('lines up a %s button with the margin with header.base.back_aligned on', (appearance) => {
    const values = { components: { header: { base: { back_aligned: true } }, modal: { slots: { close: { appearance } } } } }
    expect(pullOf(renderBack(withTheme(values)))).toBe(0)
  })
})

describe('BackButton: its glyph (header.base.back_icon)', () => {
  it('is an arrow by default', () => {
    expect(glyphOf(renderBack()).props.name).toBe('arrow-back')
  })

  it('is a chevron when the theme says so', () => {
    expect(glyphOf(renderBack(withTheme(backIcon('chevron')))).props.name).toBe('chevron-back')
  })

  it('is the arrow for the arrow option', () => {
    expect(glyphOf(renderBack(withTheme(backIcon('arrow')))).props.name).toBe('arrow-back')
  })

  it('goes back when pressed, under the label it is given', () => {
    const onPress = jest.fn()
    const utils = renderBack(withTheme(backIcon('chevron')), { onPress, accessibilityLabel: 'Go back' })
    fireEvent.press(utils.getByLabelText('Go back'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
