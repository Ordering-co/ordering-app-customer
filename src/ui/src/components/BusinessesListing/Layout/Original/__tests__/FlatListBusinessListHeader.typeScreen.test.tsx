import '../../../../../../../../jest/helpers/registerM3NativeMocks'

import React from 'react'

import { FlatListBusinessListHeader } from '../FlatListBusinessListHeader'
import { HeaderContent } from '../HeaderContent'
import { renderWithProviders } from '../../../../../../../../jest/helpers/renderWithProviders'
import { withTheme } from '../../../../../../../../jest/helpers/themeWith'

const mockTypeFilter = jest.fn()
jest.mock('@react-navigation/native', () => ({ useIsFocused: () => true }))
jest.mock('../HeaderContent', () => ({ HeaderContent: jest.fn(() => null) }))
jest.mock('@components', () => require('../../../../../../../../jest/helpers/m3DiscoveryComponentsMock').getMock())
jest.mock('@ui', () => {
  const stub = () => null
  return {
    ...require('../../../../../../../../jest/helpers/m3DiscoveryUiMock').getUiMock(),
    HighestRatedBusinesses: stub,
    OrderProgress: stub,
    PageBanner: stub,
    BusinessTypeFilter: (props: any) => { mockTypeFilter(props); return null }
  }
})

const sections = (listVisible: boolean) => ({
  business_listing: {
    sections: [
      { key: 'order_progress', visible: true },
      { key: 'custom_order_banner', visible: true },
      { key: 'highest_rated', visible: true },
      { key: 'categories', visible: true },
      { key: 'all_businesses', visible: listVisible }
    ]
  }
})
const opensPage = { components: { business_types: { base: { on_select: 'page' } } } }

const setup = (props: any = {}, options?: any) => {
  const components = require('@components')
  components.useOrderState.mockReturnValue({ loading: false, options: { type: 1, address_id: 3 }, carts: {} })
  components.useOrderActions.mockReturnValue({ changeCityFilter: jest.fn() })
  const navigation = { navigate: jest.fn(), goBack: jest.fn() }
  const handleChangeBusinessType = jest.fn()
  mockTypeFilter.mockClear()
  ;(HeaderContent as jest.Mock).mockClear()
  const view = renderWithProviders(
    <FlatListBusinessListHeader
      navigation={navigation}
      businessesList={{ loading: false, fetched: true, businesses: [{ id: 1 }] }}
      handleChangeBusinessType={handleChangeBusinessType}
      citiesState={{ loading: false, cities: [] }}
      {...props}
    />,
    options
  )
  const filterCalls = mockTypeFilter.mock.calls
  const headerCalls = (HeaderContent as jest.Mock).mock.calls
  return {
    ...view,
    navigation,
    handleChangeBusinessType,
    selectType: (id: any) => {
      const filterProps = filterCalls[filterCalls.length - 1][0]
      filterProps.setBusinessTypes([{ id: null, name: 'All' }, { id: 7, name: 'Bakeries' }])
      filterProps.handleChangeBusinessType(id)
    },
    typeFilterRendered: filterCalls.length > 0,
    headerProps: headerCalls[headerCalls.length - 1][0]
  }
}

describe('FlatListBusinessListHeader: what a business type does when tapped', () => {
  it('filters the list by default', () => {
    const { selectType, handleChangeBusinessType, navigation } = setup()
    selectType(7)
    expect(handleChangeBusinessType).toHaveBeenCalledWith(7)
    expect(navigation.navigate).not.toHaveBeenCalled()
  })

  it('opens the type\'s own screen when the theme says so (business_types.base.on_select = page)', () => {
    const { selectType, handleChangeBusinessType, navigation } = setup({}, withTheme(opensPage))
    selectType(7)
    expect(navigation.navigate).toHaveBeenCalledWith('BusinessTypeListing', { businessTypeId: 7, businessTypeName: 'Bakeries' })
    expect(handleChangeBusinessType).not.toHaveBeenCalled()
  })

  it('keeps "All" as a filter of the home screen', () => {
    const { selectType, handleChangeBusinessType, navigation } = setup({}, withTheme(opensPage))
    selectType(null)
    expect(handleChangeBusinessType).toHaveBeenCalledWith(null)
    expect(navigation.navigate).not.toHaveBeenCalled()
  })
})

describe('FlatListBusinessListHeader: the list of stores on the home screen', () => {
  it('shows its title by default', () => {
    expect(setup().getByText('All business')).toBeTruthy()
  })

  it('is hidden with its section when the types open their own screen', () => {
    const { queryByText } = setup({ listHidden: true }, withTheme({ ...opensPage, pages: sections(false) }))
    expect(queryByText('All business')).toBeNull()
  })

  it('stays when the types only filter, so the home screen always leads to the stores', () => {
    const { getByText } = setup({ listHidden: false }, withTheme({ pages: sections(false) }))
    expect(getByText('All business')).toBeTruthy()
  })
})

describe('FlatListBusinessListHeader: the screen of one business type', () => {
  const typeScreen = { businessTypeScreen: { id: 7, name: 'Bakeries' } }

  it('has the type as its title, a back button and no address or order options', () => {
    const { headerProps, navigation } = setup(typeScreen)
    expect(headerProps).toMatchObject({ title: 'Bakeries', hideAddress: true, hideOrderControl: true, fillable: true })
    expect(headerProps.showLogo).toBeUndefined()
    headerProps.onGoBack()
    expect(navigation.goBack).toHaveBeenCalled()
  })

  it('lists only the stores: no categories and no "All business" title', () => {
    const { typeFilterRendered, queryByText } = setup(typeScreen)
    expect(typeFilterRendered).toBe(false)
    expect(queryByText('All business')).toBeNull()
  })
})
