import React from 'react'
import { StyleSheet } from 'react-native'
import OInput from '../OInput'
import { buildAppTheme } from '@/theme/engine'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

const themed = (field: any, input: any) =>
  buildAppTheme({ version: 2, values: { components: { field: { base: field }, input: { base: input } } } })

describe('OInput reads the field and input options', () => {
  it('puts the placeholder above as a label when the theme says so', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<OInput placeholder='Email' />, { themeOverrides: themed({ label_position: 'above' }, {}) })
    expect(getByText('Email')).toBeTruthy()
    expect(() => getByPlaceholderText('Email')).toThrow()
  })

  it('draws only the bottom border with border_sides bottom', () => {
    const t = themed({}, { border_sides: 'bottom', border: { width: 1, color: '#E9ECEF', style: 'solid' } })
    const { UNSAFE_root } = renderWithProviders(<OInput placeholder='x' />, { themeOverrides: t })
    const boxes = UNSAFE_root.findAll((node: any) => typeof node.type === 'string' && StyleSheet.flatten(node.props.style)?.borderBottomWidth !== undefined)
    const style = StyleSheet.flatten(boxes[0].props.style)
    expect(style.borderWidth).toBe(0)
    expect(style.borderBottomWidth).toBe(1)
  })
})
