import '../../../../../../../../jest/helpers/registerM3NativeMocks'

import React from 'react'
import { FlatList, TouchableOpacity } from 'react-native'
import { fireEvent } from '@testing-library/react-native'

import { FlatListBusinessListing } from '../FlatListBusinessListing'
import { renderWithProviders } from '../../../../../../../../jest/helpers/renderWithProviders'
import { withTheme } from '../../../../../../../../jest/helpers/themeWith'

const mockCard = jest.fn()
const mockBanner = jest.fn()
jest.mock('../FlatListBusinessListHeader', () => ({ FlatListBusinessListHeader: () => null }))
jest.mock('../FlatListBusinessListFooter', () => ({ FlatListBusinessListFooter: () => null }))
jest.mock('@components', () => require('../../../../../../../../jest/helpers/m3DiscoveryComponentsMock').getMock())
jest.mock('@ui', () => ({
  ...require('../../../../../../../../jest/helpers/m3DiscoveryUiMock').getUiMock(),
  BusinessController: (props: any) => { mockCard(props); return null },
  PageBanner: (props: any) => { mockBanner(props); return null }
}))

const { sampleBusiness } = require('../../../../../../../../jest/helpers/m3DiscoveryDefaults')
const businesses = [sampleBusiness, { ...sampleBusiness, id: 2 }]
const baseProps = {
  navigation: { navigate: jest.fn() },
  businessesList: { loading: false, businesses },
  favoriteIds: [] as number[],
  setFavoriteIds: jest.fn(),
  handleScroll: jest.fn(),
  handleOnRefresh: jest.fn()
}

describe('FlatListBusinessListing: cards', () => {
  beforeEach(() => mockCard.mockClear())

  it('hides the distance of every card in a listing without an address', () => {
    renderWithProviders(<FlatListBusinessListing {...baseProps} isUnaddressedListing />)
    expect(mockCard).toHaveBeenCalled()
    mockCard.mock.calls.forEach(([props]) => expect(props.hideDistance).toBe(true))
  })

  it('keeps it with an address', () => {
    renderWithProviders(<FlatListBusinessListing {...baseProps} isUnaddressedListing={false} />)
    mockCard.mock.calls.forEach(([props]) => expect(props.hideDistance).toBe(false))
  })

  // The parent renders again with an equal `isUnaddressedListing`, as it does on every order update.
  const Parent = ({ unaddressed }: { unaddressed: boolean }) => {
    const [, setTick] = React.useState(0)
    return (
      <>
        <TouchableOpacity testID='tick' onPress={() => setTick((n) => n + 1)} />
        <FlatListBusinessListing {...baseProps} isUnaddressedListing={unaddressed} />
      </>
    )
  }

  it('does not render the cards again when the parent does with the same values (memo)', () => {
    const view = renderWithProviders(<Parent unaddressed />)
    const first = mockCard.mock.calls.length
    fireEvent.press(view.getByTestId('tick'))
    expect(mockCard.mock.calls.length).toBe(first)
  })

  it('renders the cards again when the listing goes from with to without an address', () => {
    const view = renderWithProviders(<Parent unaddressed />)
    const first = mockCard.mock.calls.length
    view.rerender(<Parent unaddressed={false} />)
    expect(mockCard.mock.calls.length).toBeGreaterThan(first)
  })
})

describe('FlatListBusinessListing: the list hidden on the home screen', () => {
  const hiddenList = {
    business_listing: {
      sections: [
        { key: 'order_progress', visible: true },
        { key: 'custom_order_banner', visible: true },
        { key: 'highest_rated', visible: true },
        { key: 'categories', visible: true },
        { key: 'all_businesses', visible: false }
      ]
    }
  }
  const opensPage = { components: { business_types: { base: { on_select: 'page' } } } }

  beforeEach(() => mockCard.mockClear())

  it('draws no card when the types open their own screen and the section is hidden', () => {
    renderWithProviders(<FlatListBusinessListing {...baseProps} />, withTheme({ ...opensPage, pages: hiddenList }))
    expect(mockCard).not.toHaveBeenCalled()
  })

  it('still lists the stores on a business type\'s screen', () => {
    renderWithProviders(
      <FlatListBusinessListing {...baseProps} businessTypeScreen={{ id: 7, name: 'Bakeries' }} />,
      withTheme({ ...opensPage, pages: hiddenList })
    )
    expect(mockCard).toHaveBeenCalledTimes(businesses.length)
  })

  it('keeps the stores when the types only filter the list', () => {
    renderWithProviders(<FlatListBusinessListing {...baseProps} />, withTheme({ pages: hiddenList }))
    expect(mockCard).toHaveBeenCalledTimes(businesses.length)
  })
})

describe('FlatListBusinessListing: the banner inside the list (banner.base.listing_after)', () => {
  const after = (count: number) => ({ components: { banner: { base: { listing_after: count } } } })
  const three = [...businesses, { ...sampleBusiness, id: 3 }]
  const renderList = (options?: any, props: any = {}) => {
    const utils = renderWithProviders(<FlatListBusinessListing {...baseProps} businessesList={{ loading: false, businesses: three }} {...props} />, options)
    const rows = utils.UNSAFE_getByType(FlatList).props.data.map((item: any) => item.id)
    return { ...utils, rows }
  }

  beforeEach(() => {
    mockCard.mockClear()
    mockBanner.mockClear()
  })

  it('has no banner by default: the stores alone', () => {
    const { rows } = renderList()
    expect(rows).toEqual([1, 2, 3])
    expect(mockBanner).not.toHaveBeenCalled()
    expect(mockCard).toHaveBeenCalledTimes(3)
  })

  it.each([
    [1, [1, 'inline-banner', 2, 3]],
    [2, [1, 2, 'inline-banner', 3]],
    [3, [1, 2, 3, 'inline-banner']]
  ])('draws one home banner after store %s', (count, expected) => {
    const { rows } = renderList(withTheme(after(count)))
    expect(rows).toEqual(expected)
    expect(mockBanner).toHaveBeenCalledTimes(1)
    expect(mockBanner.mock.calls[0][0]).toMatchObject({ position: 'app_home_page', navigation: baseProps.navigation })
    expect(mockCard).toHaveBeenCalledTimes(3)
  })

  it('has none with fewer stores than the theme asks for', () => {
    const { rows } = renderList(withTheme(after(4)))
    expect(rows).toEqual([1, 2, 3])
    expect(mockBanner).not.toHaveBeenCalled()
  })

  it.each([
    ['no stores', []],
    ['stores not loaded', undefined]
  ])('has none with %s', (_name, list) => {
    const { rows } = renderList(withTheme(after(1)), { businessesList: { loading: false, businesses: list } })
    expect(rows).toEqual([])
    expect(mockBanner).not.toHaveBeenCalled()
  })

  it('has none when the list is hidden on the home screen', () => {
    const { rows } = renderList(withTheme({
      components: { ...after(1).components, business_types: { base: { on_select: 'page' } } },
      pages: { business_listing: { sections: [{ key: 'categories', visible: true }, { key: 'all_businesses', visible: false }] } }
    }))
    expect(rows).toEqual([])
    expect(mockBanner).not.toHaveBeenCalled()
    expect(mockCard).not.toHaveBeenCalled()
  })
})
