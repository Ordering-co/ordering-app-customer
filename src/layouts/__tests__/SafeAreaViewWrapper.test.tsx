import React from 'react'
import { StyleSheet, View } from 'react-native'

import { SafeAreaViewWrapper } from '../SafeAreaViewWrapper'
import { renderWithProviders } from '../../../jest/helpers/renderWithProviders'
import { themeWith, withTheme } from '../../../jest/helpers/themeWith'
import { defaultAppTheme } from '../../theme/engine'

jest.mock('react-native-safe-area-context', () => {
  const insets = { top: 47, right: 0, bottom: 34, left: 0 }
  return {
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaView: ({ children }: any) => children,
    useSafeAreaInsets: () => insets
  }
})

const filled = { components: { header: { base: { fill_listing: true, background: '#102030' } } } }

const parentOf = (node: any, testID: string): any => {
  if (!node || typeof node !== 'object') return null
  if (Array.isArray(node)) return node.map((child) => parentOf(child, testID)).find(Boolean) ?? null
  const children = node.children ?? []
  if (children.some((child: any) => child?.props?.testID === testID)) return node
  return children.map((child: any) => parentOf(child, testID)).find(Boolean) ?? null
}

const renderPage = (props: any = {}, options?: any) => {
  const utils = renderWithProviders(
    <SafeAreaViewWrapper disableScrollView {...props}>
      <View testID='page' />
    </SafeAreaViewWrapper>,
    options
  )
  const container = parentOf(utils.toJSON(), 'page')
  return { ...utils, container, style: StyleSheet.flatten(container.props.style) }
}

describe('SafeAreaViewWrapper: the top inset of a page with a filled header', () => {
  it('pads the top inset by default, with no band', () => {
    const { queryByTestId, style } = renderPage({ pt: true, headerInset: true })
    expect(queryByTestId('header-inset')).toBeNull()
    expect(style.paddingTop).toBe(47)
    expect(defaultAppTheme().native.components.header.base.fill_listing).toBe(false)
  })

  it('pads it on a page that does not ask for the band, with the option on', () => {
    const { queryByTestId, style } = renderPage({ pt: true }, withTheme(filled))
    expect(queryByTestId('header-inset')).toBeNull()
    expect(style.paddingTop).toBe(47)
  })

  it('paints nothing on a page without a top inset, with the option on', () => {
    const { queryByTestId, style } = renderPage({ headerInset: true }, withTheme(filled))
    expect(queryByTestId('header-inset')).toBeNull()
    expect(style.paddingTop).toBe(0)
  })

  it('paints the inset with the header background instead of padding it, above the page', () => {
    const { getByTestId, container, style } = renderPage({ pt: true, headerInset: true }, withTheme(filled))
    expect(StyleSheet.flatten(getByTestId('header-inset').props.style)).toEqual({
      height: 47,
      backgroundColor: themeWith(filled).native.components.header.base.background
    })
    expect(style.paddingTop).toBe(0)
    expect(container.children.map((child: any) => child.props.testID)).toEqual(['header-inset', 'page'])
  })

  it('leaves the inset to the header band where the band covers it (headerInset = band)', () => {
    const { queryByTestId, style } = renderPage({ pt: true, headerInset: 'band' }, withTheme(filled))
    expect(queryByTestId('header-inset')).toBeNull()
    expect(style.paddingTop).toBe(0)
  })

  it('leaves the bottom inset as it was', () => {
    expect(renderPage({ pt: true, pb: true, headerInset: true }, withTheme(filled)).style.paddingBottom).toBe(34)
    expect(renderPage({ pt: true, headerInset: true }, withTheme(filled)).style.paddingBottom).toBe(0)
  })
})
