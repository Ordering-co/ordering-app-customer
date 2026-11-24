import '../../../../../../jest/helpers/registerM3NativeMocks'

import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { StyleSheet } from 'react-native'
import { BusinessTypeFilter } from '..'
import { buildAppTheme } from '@/theme/engine'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'
import { themeWith, withTheme } from '../../../../../../jest/helpers/themeWith'

jest.mock('@components', () => require('../../../../../../jest/helpers/m3DiscoveryComponentsMock').getMock())
jest.mock('@ui', () => require('../../../../../../jest/helpers/m3DiscoveryUiMock').getUiMock())

describe('BusinessTypeFilter', () => {
  it('renders loading placeholders', () => {
    const { getAllByTestId } = renderWithProviders(
      <BusinessTypeFilter
        typesState={{ loading: true }}
        handleChangeBusinessType={jest.fn()}
        setBusinessTypes={jest.fn()}
        filters={{ business_types: [] }}
        handleChangeFilters={jest.fn()}
      />
    )
    expect(getAllByTestId('placeholder-line').length).toBeGreaterThan(0)
  })

  it('renders categories and handles selection', () => {
    const handleChangeBusinessType = jest.fn()
    const { getByText } = renderWithProviders(
      <BusinessTypeFilter
        typesState={{
          loading: false,
          types: [
            { id: null, name: 'All', enabled: true },
            { id: 1, name: 'Food', enabled: true }
          ]
        }}
        currentTypeSelected={null}
        handleChangeBusinessType={handleChangeBusinessType}
        setBusinessTypes={jest.fn()}
        filters={{ business_types: [] }}
        handleChangeFilters={jest.fn()}
      />
    )
    fireEvent.press(getByText('Food'))
    expect(handleChangeBusinessType).toHaveBeenCalledWith(1)
  })

  // The theme's layout (`business_types.base.layout`), not the data, picks how the types are drawn.
  const withLayout = (layout: string) => ({
    themeOverrides: buildAppTheme({ version: 2, values: { components: { business_types: { base: { layout } } } } }) as any
  })

  const buildTypes = (count: number, withImage: boolean) => ([
    { id: null, name: 'All', enabled: true, image: null },
    ...[...Array(count)].map((_, i) => ({
      id: i + 1,
      name: `Type ${i + 1}`,
      enabled: true,
      image: withImage ? `https://cdn.test/${i + 1}.png` : null
    }))
  ])

  const renderTypes = (types: any[], options?: any, selected: any = null, extra: any = {}) => renderWithProviders(
    <BusinessTypeFilter
      typesState={{ loading: false, types }}
      currentTypeSelected={selected}
      handleChangeBusinessType={jest.fn()}
      setBusinessTypes={jest.fn()}
      filters={{ business_types: [] }}
      handleChangeFilters={jest.fn()}
      {...extra}
    />,
    options
  )

  it('draws pills without images by default, even when the types have images', () => {
    const { queryAllByTestId, getAllByTestId } = renderTypes(buildTypes(3, true))
    expect(queryAllByTestId('category-icon').length).toBe(0)
    expect(getAllByTestId('category-row').length).toBe(1)
  })

  it('draws tiles when the theme says so, the All tile included', () => {
    const { getAllByTestId, getAllByText } = renderTypes(buildTypes(2, true), withLayout('tiles'))
    expect(getAllByTestId('category-icon').length).toBe(3)
    // One label: its bold copy (StableText) is hidden from accessibility.
    expect(getAllByText('All').length).toBe(1)
  })

  it('draws pills with the type image when the theme says pills_image (not on All)', () => {
    const { getAllByTestId } = renderTypes(buildTypes(2, true), withLayout('pills_image'))
    expect(getAllByTestId('category-icon').length).toBe(2)
  })

  it('keeps one scrolling row at 10+ categories (never two rows)', () => {
    const { getAllByTestId } = renderTypes(buildTypes(11, true), withLayout('tiles'))
    expect(getAllByTestId('category-row').length).toBe(1)
    expect(getAllByTestId('category-icon').length).toBe(12)
  })

  it('keeps the selected border room on every tile: selecting does not resize the image', () => {
    const flat = (node: any) => StyleSheet.flatten(node.props.style)
    const { getAllByTestId } = renderTypes(buildTypes(2, true), withLayout('tiles'), 1)
    const [all, selected, other] = getAllByTestId('category-icon').map(flat)
    expect(selected.borderWidth).toBeGreaterThan(0)
    expect(all.borderWidth).toBe(selected.borderWidth)
    expect(other.borderWidth).toBe(selected.borderWidth)
    expect(other.borderColor).toBe('transparent')
  })

  describe('the grid (business_types.base.layout = grid)', () => {
    const grid = (columns?: number) => ({ components: { business_types: { base: { layout: 'grid', ...(columns ? { grid_columns: columns } : {}) } } } })
    const flat = (node: any) => StyleSheet.flatten(node.props.style)
    const layout = (width: number) => ({ nativeEvent: { layout: { x: 0, y: 0, width, height: 0 } } })
    const tileOf = (icon: any) => {
      let node = icon.parent
      while (node && !(typeof node.type === 'string' && typeof flat(node)?.width === 'number')) node = node.parent
      return node
    }

    it('is one row that scrolls by default: no grid', () => {
      const { queryByTestId, getAllByTestId } = renderTypes(buildTypes(3, true))
      expect(queryByTestId('category-grid')).toBeNull()
      expect(getAllByTestId('category-row')).toHaveLength(1)
    })

    it('wraps the tiles in a grid instead of the row, and waits for its width to draw them', () => {
      const { getByTestId, queryByTestId, queryAllByTestId, getByText } = renderTypes(buildTypes(4, true), withTheme(grid()), null, { grid: true })
      expect(queryByTestId('category-row')).toBeNull()
      expect(flat(getByTestId('category-grid'))).toMatchObject({ flexDirection: 'row', flexWrap: 'wrap' })
      expect(queryAllByTestId('category-icon')).toHaveLength(0)
      fireEvent(getByTestId('category-grid'), 'layout', layout(350))
      expect(queryAllByTestId('category-icon')).toHaveLength(5)
      expect(getByText('Type 4')).toBeTruthy()
    })

    it.each([
      [undefined, 3, 350],
      [2, 2, 350],
      [3, 3, 361.6],
      [4, 4, 320]
    ])('sizes each tile to its column (grid_columns %s: %s columns in %s pt)', (asked, columns, width) => {
      const theme = themeWith(grid(asked))
      const base = theme.native.components.business_types.base
      const expected = Math.floor((Math.floor(width) - base.gap * (columns - 1)) / columns)
      const { getByTestId, getAllByTestId } = renderTypes(buildTypes(5, true), { themeOverrides: theme }, null, { grid: true })
      fireEvent(getByTestId('category-grid'), 'layout', layout(width))
      expect(base.grid_columns).toBe(columns)
      expect(flat(getByTestId('category-grid')).gap).toBe(base.gap)
      getAllByTestId('category-icon').forEach((icon) => {
        expect(flat(icon)).toMatchObject({ width: expected, height: expected })
        expect(flat(tileOf(icon)).width).toBe(expected)
      })
      expect(expected * columns + base.gap * (columns - 1)).toBeLessThanOrEqual(width)
    })

    it('stays a row of tiles where the grid is not asked for (the search screen)', () => {
      const { queryByTestId, getAllByTestId } = renderTypes(buildTypes(3, true), withTheme(grid()))
      expect(queryByTestId('category-grid')).toBeNull()
      expect(getAllByTestId('category-row')).toHaveLength(1)
      expect(getAllByTestId('category-icon').length).toBeGreaterThan(0)
    })

    it('selects a type from its tile', () => {
      const handleChangeBusinessType = jest.fn()
      const { getByTestId, getByText } = renderWithProviders(
        <BusinessTypeFilter
          typesState={{ loading: false, types: buildTypes(2, true) }}
          currentTypeSelected={null}
          handleChangeBusinessType={handleChangeBusinessType}
          setBusinessTypes={jest.fn()}
          filters={{ business_types: [] }}
          handleChangeFilters={jest.fn()}
          grid
        />,
        withTheme(grid())
      )
      fireEvent(getByTestId('category-grid'), 'layout', layout(350))
      fireEvent.press(getByText('Type 2'))
      expect(handleChangeBusinessType).toHaveBeenCalledWith(2)
    })
  })

  it('renders text-only pills when no business type has an image', () => {
    const { queryAllByTestId, getByText } = renderWithProviders(
      <BusinessTypeFilter
        typesState={{
          loading: false,
          types: [
            { id: null, name: 'All', enabled: true, image: null },
            { id: 1, name: 'Food', enabled: true, image: null }
          ]
        }}
        currentTypeSelected={null}
        handleChangeBusinessType={jest.fn()}
        setBusinessTypes={jest.fn()}
        filters={{ business_types: [] }}
        handleChangeFilters={jest.fn()}
      />
    )
    expect(queryAllByTestId('category-icon').length).toBe(0)
    expect(getByText('Food')).toBeTruthy()
  })

  it('translates API All variants (e.g. All :)) via ALL', () => {
    const { getByText, queryByText } = renderWithProviders(
      <BusinessTypeFilter
        typesState={{
          loading: false,
          types: [
            { id: 99, name: 'All :)', enabled: true, image: null },
            { id: 1, name: 'Food', enabled: true, image: null }
          ]
        }}
        currentTypeSelected={99}
        handleChangeBusinessType={jest.fn()}
        setBusinessTypes={jest.fn()}
        filters={{ business_types: [] }}
        handleChangeFilters={jest.fn()}
      />
    )
    expect(getByText('All')).toBeTruthy()
    expect(queryByText('All :)')).toBeNull()
  })

  it('resolves synthetic All via ALL (ignores polluted BUSINESS_TYPE_ALL)', () => {
    const { getByText, queryByText } = renderWithProviders(
      <BusinessTypeFilter
        typesState={{
          loading: false,
          types: [
            { id: null, name: 'Todos', enabled: true, image: null },
            { id: 1, name: 'Food', enabled: true, image: null }
          ]
        }}
        currentTypeSelected={null}
        handleChangeBusinessType={jest.fn()}
        setBusinessTypes={jest.fn()}
        filters={{ business_types: [] }}
        handleChangeFilters={jest.fn()}
      />
    )
    // Mock t returns fallback; name fallback is Todos when dictionary miss
    expect(getByText('Todos')).toBeTruthy()
    expect(queryByText('All :)')).toBeNull()
  })
})
