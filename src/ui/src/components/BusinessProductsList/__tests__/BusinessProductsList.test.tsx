import '../../../../../../jest/helpers/registerM4NativeMocks'

import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { BusinessProductsList } from '..'
import { areMenuRowsEqual } from '../MenuRowView'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

jest.mock('@components', () => require('../../../../../../jest/helpers/m4MenuComponentsMock').getMock())
jest.mock('@ui', () => require('../../../../../../jest/helpers/m4MenuUiMock').getUiMock())

jest.mock('../FeaturedProducts', () => {
  const { View, Text } = require('react-native')
  return {
    FeaturedProducts: (props) => (
      <View testID="featured-products-stub">
        <Text>{props.categoryState?.products?.[0]?.name}</Text>
      </View>
    )
  }
})

describe('BusinessProductsList', () => {
  it('renders featured products when category is All', () => {
    const { getByTestId, getAllByText } = renderWithProviders(
      <BusinessProductsList
        businessId={1}
        category={{ id: null, name: 'All' }}
        featured
        previouslyProducts={[]}
      />
    )
    expect(getByTestId('featured-products-stub')).toBeTruthy()
    expect(getAllByText('Cheese Slice').length).toBeGreaterThan(0)
  })

  it('renders category products and subcategories', () => {
    const onProductClick = jest.fn()
    const category = {
      id: 10,
      name: 'Pizzas',
      description: 'Fresh pizzas',
      image: 'https://cdn.test/cat.jpg',
      subcategories: [{ id: 11, name: 'Classic', parent_category_id: 10 }]
    }
    const { getByText, getAllByTestId } = renderWithProviders(
      <BusinessProductsList
        businessId={1}
        category={category}
        featured={false}
        previouslyProducts={[{ id: 200, name: 'Past Slice', price: 4 }]}
        onProductClick={onProductClick}
        subcategoriesSelected={[]}
        setSubcategoriesSelected={jest.fn()}
      />
    )
    expect(getByText('Classic')).toBeTruthy()
    expect(getByText('All')).toBeTruthy()
    expect(getAllByTestId('order-it-again-stub').length).toBeGreaterThan(0)
    fireEvent.press(getAllByTestId('single-product-card')[0])
    expect(onProductClick).toHaveBeenCalled()
  })

  it('renders empty search not found state', () => {
    const { getByText } = renderWithProviders(
      <BusinessProductsList
        businessId={1}
        category={{ id: null, name: 'All' }}
        featured={false}
        searchValue="zzz"
        categoryState={{ loading: false, products: [], error: null, pagination: {} }}
        errorQuantityProducts={false}
        isBusinessLoading={false}
      />
    )
    expect(getByText(/No products found/i)).toBeTruthy()
  })

  it('shows the empty catalog sentence when the menu has no products', () => {
    const { getByText, queryByText } = renderWithProviders(
      <BusinessProductsList
        businessId={1}
        category={{ id: 10, name: 'Pizzas' }}
        featured={false}
        searchValue=""
        categoryState={{ loading: false, products: [], error: null, pagination: {} }}
        errorQuantityProducts
        isBusinessLoading={false}
        isFiltMode={false}
        errors={null}
      />
    )
    expect(getByText('No products found at this time')).toBeTruthy()
    expect(queryByText('ERROR:')).toBeNull()
  })

  it('shows the catalog error prefix when the menu request fails', () => {
    const { getByText } = renderWithProviders(
      <BusinessProductsList
        businessId={1}
        category={{ id: 10, name: 'Pizzas' }}
        featured={false}
        searchValue=""
        categoryState={{ loading: false, products: [], error: null, pagination: {} }}
        errorQuantityProducts={false}
        isBusinessLoading={false}
        errors={['menu down']}
      />
    )
    expect(getByText(/^Error: /)).toBeTruthy()
    expect(getByText(/menu down/)).toBeTruthy()
  })

  it('renders loading placeholders', () => {
    const { getAllByTestId, toJSON } = renderWithProviders(
      <BusinessProductsList
        businessId={1}
        category={{ id: null, name: 'All' }}
        featured={false}
        categoryState={{
          loading: true,
          products: [],
          error: null,
          pagination: { nextPageItems: 3 }
        }}
        isBusinessLoading={false}
      />
    )
    expect(toJSON()).toBeTruthy()
    expect(getAllByTestId('placeholder').length).toBeGreaterThan(0)
  })
  it('lists every category with its title and products, in the order of the rows', () => {
    const categories = [{ id: 10, name: 'Pizzas' }, { id: 11, name: 'Drinks' }]
    const { toJSON, queryByText } = renderWithProviders(
      <BusinessProductsList
        businessId={1}
        category={{ id: null, name: 'All' }}
        categories={categories}
        featured={false}
        categoryState={{
          loading: false,
          error: null,
          pagination: {},
          products: [
            { id: 3, name: 'Cola', category_id: 11, rank: 1 },
            { id: 2, name: 'Margherita', category_id: 10, rank: 2 },
            { id: 1, name: 'Pepperoni', category_id: 10, rank: 1 }
          ]
        }}
      />
    )
    const text = JSON.stringify(toJSON())
    const order = ['Pizzas', 'Pepperoni', 'Margherita', 'Drinks', 'Cola'].map((name) => text.indexOf(`"${name}"`))
    expect(order.every((at) => at !== -1)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
    // A full menu (e.g. a closed business whose menu still returns every product) never shows "No products".
    expect(queryByText(/No products/i)).toBeNull()
  })

  it('previews a lazy menu\'s category and opens it from "More"', () => {
    const onClickCategory = jest.fn()
    const category = { id: 10, name: 'Pizzas' }
    const { getAllByTestId, UNSAFE_getByProps } = renderWithProviders(
      <BusinessProductsList
        businessId={1}
        category={{ id: null, name: 'All' }}
        categories={[category]}
        featured={false}
        lazyLoadProductsRecommended
        onClickCategory={onClickCategory}
        categoryState={{
          loading: false,
          error: null,
          pagination: {},
          products: Array.from({ length: 12 }, (_, index) => ({ id: index + 1, name: `Pizza ${index + 1}`, category_id: 10, rank: index }))
        }}
      />
    )
    // Nine products and the "More" card.
    const cards = getAllByTestId('single-product-card')
    expect(cards).toHaveLength(10)
    UNSAFE_getByProps({ useCustomFunctionality: true }).props.onCustomClick()
    expect(onClickCategory).toHaveBeenCalledWith(category)
  })

  it('runs the latest handler: the rows keep theirs, the screen changes its own', () => {
    const first = jest.fn()
    const latest = jest.fn()
    const props = {
      businessId: 1,
      category: { id: 10, name: 'Pizzas' },
      featured: false,
      subcategoriesSelected: [],
      previouslyProducts: []
    }
    const { getAllByTestId, rerender } = renderWithProviders(<BusinessProductsList {...props} onProductClick={first} />)
    rerender(<BusinessProductsList {...props} onProductClick={latest} />)
    fireEvent.press(getAllByTestId('single-product-card')[0])
    expect(latest).toHaveBeenCalledWith(expect.objectContaining({ name: 'Cheese Slice' }))
    expect(first).not.toHaveBeenCalled()
  })
})

describe('areMenuRowsEqual', () => {
  const menu: any = { subcategoriesSelected: [] }
  const product = { id: 1, name: 'Cheese Slice' }
  const row = (extra: any = {}): any => ({ kind: 'product', key: 'product:10:1', product, section: 10, ...extra })

  it('keeps a product row when the cart or a page of products changes what the rows share', () => {
    expect(areMenuRowsEqual({ row: row(), quantity: 0, menu }, { row: row(), quantity: 0, menu: { ...menu } })).toBe(true)
  })

  it('renders a product row again when its units in the cart or its product change', () => {
    expect(areMenuRowsEqual({ row: row(), quantity: 0, menu }, { row: row(), quantity: 1, menu })).toBe(false)
    expect(areMenuRowsEqual({ row: row(), quantity: 0, menu }, { row: row({ product: { ...product } }), quantity: 0, menu })).toBe(false)
  })

  it('keeps a category title and a skeleton, whatever the rows share', () => {
    const category = { id: 10, name: 'Pizzas' }
    const title = (): any => ({ kind: 'category', key: 'category:10', category, section: 10 })
    expect(areMenuRowsEqual({ row: title(), quantity: 0, menu }, { row: title(), quantity: 0, menu: { ...menu } })).toBe(true)
    const skeleton = (): any => ({ kind: 'skeleton', key: 'skeleton:0', section: null })
    expect(areMenuRowsEqual({ row: skeleton(), quantity: 0, menu }, { row: skeleton(), quantity: 0, menu: { ...menu } })).toBe(true)
  })

  it('renders the rows that read the shared data again when it changes', () => {
    for (const kind of ['order_it_again', 'featured_products', 'empty']) {
      const shared = (): any => ({ kind, key: kind, section: null })
      expect(areMenuRowsEqual({ row: shared(), quantity: 0, menu }, { row: shared(), quantity: 0, menu })).toBe(true)
      expect(areMenuRowsEqual({ row: shared(), quantity: 0, menu }, { row: shared(), quantity: 0, menu: { ...menu } })).toBe(false)
    }
    const category = { id: 10, subcategories: [{ id: 11 }] }
    const chips = (): any => ({ kind: 'subcategories', key: 'subcategories:10', category, section: 10 })
    expect(areMenuRowsEqual({ row: chips(), quantity: 0, menu }, { row: chips(), quantity: 0, menu: { ...menu, subcategoriesSelected: [{ id: 11 }] } })).toBe(false)
  })

  it('never keeps a row of another kind', () => {
    expect(areMenuRowsEqual({ row: row(), quantity: 0, menu }, { row: { kind: 'skeleton', key: 'product:10:1', section: null } as any, quantity: 0, menu })).toBe(false)
  })
})
