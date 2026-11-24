import '../../../../../../jest/helpers/registerM4NativeMocks'

import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { BusinessProductsCategories } from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

jest.mock('@components', () => require('../../../../../../jest/helpers/m4MenuComponentsMock').getMock())
jest.mock('@ui', () => require('../../../../../../jest/helpers/m4MenuUiMock').getUiMock())

const defaults = require('../../../../../../jest/helpers/m4MenuDefaults').businessProductsCategoriesDefaults

describe('BusinessProductsCategories', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders category tabs', () => {
    const { getByText } = renderWithProviders(<BusinessProductsCategories />)
    expect(getByText('All')).toBeTruthy()
    expect(getByText('Pizzas')).toBeTruthy()
  })

  it('updates selected category when a tab is pressed', () => {
    const { getByText } = renderWithProviders(<BusinessProductsCategories />)
    fireEvent.press(getByText('Pizzas'))
    expect(defaults.setCategoryClicked).toHaveBeenCalledWith(true)
    expect(defaults.setSelectedCategoryId).toHaveBeenCalledWith('cat_10')
  })

  it('asks the menu to scroll to the category when every product is loaded', () => {
    const { getByText } = renderWithProviders(<BusinessProductsCategories />)
    fireEvent.press(getByText('Pizzas'))
    expect(defaults.scrollToCategory).toHaveBeenCalledWith(10)
    // The category is on the page: nothing is fetched and nothing is chosen.
    expect(defaults.handlerClickCategory).not.toHaveBeenCalled()
  })

  it('asks for the top of the menu on "All"', () => {
    const { getByText } = renderWithProviders(<BusinessProductsCategories selectedCategoryId='cat_10' />)
    fireEvent.press(getByText('All'))
    expect(defaults.scrollToCategory).toHaveBeenCalledWith(null)
    expect(defaults.setSelectedCategoryId).toHaveBeenCalledWith('cat_null')
  })

  it('chooses the category instead of scrolling in a menu that loads by pages', () => {
    const { getByText } = renderWithProviders(<BusinessProductsCategories lazyLoadProductsRecommended />)
    fireEvent.press(getByText('Pizzas'))
    expect(defaults.handlerClickCategory).toHaveBeenCalledWith(expect.objectContaining({ id: 10 }))
    expect(defaults.scrollToCategory).not.toHaveBeenCalled()
  })

  it('reports its height: the menu scrolls a category to just under it', () => {
    const onBarLayout = jest.fn()
    const { getByText } = renderWithProviders(<BusinessProductsCategories onBarLayout={onBarLayout} />)
    let bar: any = getByText('All')
    while (bar && !bar.props.onLayout) bar = bar.parent
    // The outermost view with a layout is the bar (the tabs measure themselves inside it).
    let outer = bar
    for (let node = bar?.parent; node; node = node.parent) if (node.props.onLayout) outer = node
    fireEvent(outer, 'layout', { nativeEvent: { layout: { height: 56 } } })
    expect(onBarLayout).toHaveBeenCalledWith(56)
  })

  it('renders nothing while the business loads', () => {
    const { queryByText } = renderWithProviders(<BusinessProductsCategories loading />)
    expect(queryByText('All')).toBeNull()
  })
})
