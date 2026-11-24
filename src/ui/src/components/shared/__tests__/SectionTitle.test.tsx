import React from 'react'
import { StyleSheet } from 'react-native'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'
import { defaultAppTheme } from '../../../../../theme/engine'
import { SectionTitle } from '../SectionTitle'

describe('SectionTitle', () => {
  it("takes section_header's text, color and the space under it", () => {
    const section: any = defaultAppTheme().native.components.section_header.base
    const { getByText, getByTestId } = renderWithProviders(<SectionTitle testID='box' description='Sponsored'>Top business</SectionTitle>)
    expect(StyleSheet.flatten(getByTestId('box').props.style).marginBottom).toBe(section.margin_bottom)
    expect(StyleSheet.flatten(getByText('Top business').props.style)).toMatchObject({ fontSize: section.title.fontSize, color: section.title_color })
    expect(getByText('Sponsored')).toBeTruthy()
  })

  it("a component's own text look keeps the same spacing", () => {
    const theme: any = defaultAppTheme()
    const own = theme.native.components.checkout.base.section_title
    const { getByText } = renderWithProviders(<SectionTitle text={own} color='#123456'>Summary</SectionTitle>)
    expect(StyleSheet.flatten(getByText('Summary').props.style)).toMatchObject({ fontSize: own.fontSize, color: '#123456' })
  })
})
