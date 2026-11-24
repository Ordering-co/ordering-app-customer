import React from 'react'

import { createNavigationStub } from '../../../jest/helpers/renderPage'
import { renderWithProviders } from '../../../jest/helpers/renderWithProviders'
import { withTheme } from '../../../jest/helpers/themeWith'

const mockWrapperProps = jest.fn()

jest.mock('@ui', () => {
  const { View } = require('react-native')
  return {
    ProductForm: () => <View testID="product-form" />,
    SafeAreaViewWrapper: (props: any) => {
      mockWrapperProps(props)
      return <View testID="safe-area">{props.children}</View>
    }
  }
})

import ProductDetails from '../ProductDetails'

const wrapperProps = (options?: any) => {
  mockWrapperProps.mockClear()
  const utils = renderWithProviders(
    <ProductDetails navigation={createNavigationStub()} route={{ params: { productId: 10, businessId: 2 } }} />,
    options
  )
  expect(utils.getByTestId('product-form')).toBeTruthy()
  return mockWrapperProps.mock.calls[mockWrapperProps.mock.calls.length - 1][0]
}

describe('ProductDetails: the safe area over the product (visibility product.header)', () => {
  it('keeps the top inset of the page by default, as before', () => {
    expect(wrapperProps()).toMatchObject({ pt: true, disableScrollView: true })
  })

  it('keeps it for a theme that turns the bar off', () => {
    expect(wrapperProps(withTheme({ visibility: { 'product.header': false } })).pt).toBe(true)
  })

  it('leaves the top inset to the bar when the theme shows it', () => {
    expect(wrapperProps(withTheme({ visibility: { 'product.header': true } }))).toMatchObject({ pt: false, disableScrollView: true })
  })
})
