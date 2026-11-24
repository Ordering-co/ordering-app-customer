import '../../../../../../../../jest/helpers/registerM3NativeMocks'

import React from 'react'

import { FlatListBusinessListHeader } from '../FlatListBusinessListHeader'
import { HeaderContent } from '../HeaderContent'
import { renderWithProviders } from '../../../../../../../../jest/helpers/renderWithProviders'
import { withTheme } from '../../../../../../../../jest/helpers/themeWith'
import * as appNavigation from '@/navigators/appNavigation'

jest.mock('@react-navigation/native', () => ({ useIsFocused: () => true }))
jest.mock('../HeaderContent', () => ({ HeaderContent: jest.fn(() => null) }))
jest.mock('@components', () => require('../../../../../../../../jest/helpers/m3DiscoveryComponentsMock').getMock())
jest.mock('@ui', () => {
  const stub = () => null
  return {
    ...require('../../../../../../../../jest/helpers/m3DiscoveryUiMock').getUiMock(),
    HighestRatedBusinesses: stub,
    OrderProgress: stub,
    PageBanner: stub
  }
})

const cities = [{ id: 1, name: 'Austin', enabled: true }]
const baseProps = {
  navigation: { navigate: jest.fn() },
  businessesList: { loading: false, fetched: true, businesses: [] },
  citiesState: { loading: false, cities },
  allCitiesDisabled: false,
  isUnaddressedListing: true
}

const setOrder = (options: any, loading = false) => {
  const components = require('@components')
  const state = { loading, options, carts: {} }
  components.useOrderState.mockReturnValue(state)
  components.useOrderActions.mockReturnValue({ changeCityFilter: jest.fn() })
}

const themeWithout = (key: string) => {
  const { defaultAppTheme } = require('../../../../../../../theme/engine')
  const base = defaultAppTheme()
  return { values: { ...base.values, visibility: { ...base.values.visibility, [key]: false } } }
}

describe('FlatListBusinessListHeader: city filter and empty list', () => {
  it('shows the city filter in pickup without an address', () => {
    setOrder({ type: 2, city_id: null })
    const { getByTestId, getByText } = renderWithProviders(<FlatListBusinessListHeader {...baseProps} />)
    expect(getByTestId('business-list-city-filter')).toBeTruthy()
    expect(getByText('All cities')).toBeTruthy()
  })

  it('shows the selected city', () => {
    setOrder({ type: 2, city_id: 1 })
    expect(renderWithProviders(<FlatListBusinessListHeader {...baseProps} />).getByText('Austin')).toBeTruthy()
  })

  it.each([
    ['delivery', { type: 1 }, {}],
    ['an order with an address', { type: 2, address_id: 3 }, { isUnaddressedListing: false }],
    ['no enabled city', { type: 2 }, { allCitiesDisabled: true }],
    ['no cities loaded', { type: 2 }, { citiesState: { loading: true, cities: [] } }]
  ])('has no city filter for %s', (_name, options, props: any) => {
    setOrder(options)
    const { queryByTestId } = renderWithProviders(<FlatListBusinessListHeader {...baseProps} {...props} />)
    expect(queryByTestId('business-list-city-filter')).toBeNull()
  })

  it('has none when the theme hides it (order_context.city)', () => {
    setOrder({ type: 2 })
    const { queryByTestId } = renderWithProviders(<FlatListBusinessListHeader {...baseProps} />, { themeOverrides: themeWithout('order_context.city') })
    expect(queryByTestId('business-list-city-filter')).toBeNull()
  })

  it('has its own empty message without an address, and the usual one with it', () => {
    setOrder({ type: 2 })
    const without = renderWithProviders(<FlatListBusinessListHeader {...baseProps} />)
    expect(without.getByText(/Try another city or add your address/)).toBeTruthy()
    setOrder({ type: 1, address_id: 3 })
    const withAddress = renderWithProviders(<FlatListBusinessListHeader {...baseProps} isUnaddressedListing={false} />)
    expect(withAddress.getByText(/No businesses to delivery/)).toBeTruthy()
    expect(withAddress.queryByText(/Try another city/)).toBeNull()
  })
})

describe('FlatListBusinessListHeader: the logo and the search of the header', () => {
  const headerProps = (options?: any) => {
    ;(HeaderContent as jest.Mock).mockClear()
    setOrder({ type: 1, address_id: 3 })
    renderWithProviders(<FlatListBusinessListHeader {...baseProps} isUnaddressedListing={false} />, options)
    const calls = (HeaderContent as jest.Mock).mock.calls
    return calls[calls.length - 1][0]
  }

  it('shows neither by default, and lets the header be filled', () => {
    expect(headerProps()).toMatchObject({ fillable: true, showLogo: false, showSearch: false })
  })

  it('shows the logo when the theme says so (business_listing.logo)', () => {
    expect(headerProps(withTheme({ visibility: { 'business_listing.logo': true } }))).toMatchObject({ showLogo: true, showSearch: false })
  })

  it('shows the search when the theme says so (business_listing.search)', () => {
    expect(headerProps(withTheme({ visibility: { 'business_listing.search': true } }))).toMatchObject({ showLogo: false, showSearch: true })
  })
})

describe('FlatListBusinessListHeader: the address, the order options and the cart of the header', () => {
  const navigation = { navigate: jest.fn() }
  const headerProps = (options?: any) => {
    ;(HeaderContent as jest.Mock).mockClear()
    setOrder({ type: 1, address_id: 3 })
    renderWithProviders(<FlatListBusinessListHeader {...baseProps} navigation={navigation} isUnaddressedListing={false} />, options)
    const calls = (HeaderContent as jest.Mock).mock.calls
    return calls[calls.length - 1][0]
  }
  const hidden = (...keys: string[]) => withTheme({ visibility: Object.fromEntries(keys.map((key) => [key, false])) })

  it('shows the three by default', () => {
    const props = headerProps()
    expect(props.hideAddress).toBe(false)
    expect(props.hideOrderControl).toBe(false)
    expect(typeof props.onHandleCart).toBe('function')
  })

  it('opens the cart from the header', () => {
    const openScreen = jest.spyOn(appNavigation, 'openScreen').mockImplementation(() => {})
    headerProps().onHandleCart()
    expect(openScreen).toHaveBeenCalledTimes(1)
    expect(openScreen).toHaveBeenCalledWith(navigation, 'Cart')
    openScreen.mockRestore()
  })

  it('hides the address when the theme says so (business_listing.address), and nothing else', () => {
    const props = headerProps(hidden('business_listing.address'))
    expect(props.hideAddress).toBe(true)
    expect(props.hideOrderControl).toBe(false)
    expect(typeof props.onHandleCart).toBe('function')
  })

  it('hides the order options when the theme says so (business_listing.order_options), and nothing else', () => {
    const props = headerProps(hidden('business_listing.order_options'))
    expect(props.hideOrderControl).toBe(true)
    expect(props.hideAddress).toBe(false)
    expect(typeof props.onHandleCart).toBe('function')
  })

  it('gives the header no cart when the theme says so (business_listing.cart), and nothing else', () => {
    const props = headerProps(hidden('business_listing.cart'))
    expect(props.onHandleCart).toBeUndefined()
    expect(props.hideAddress).toBe(false)
    expect(props.hideOrderControl).toBe(false)
  })

  it('hides the three together, and keeps the header to fill', () => {
    const props = headerProps(hidden('business_listing.address', 'business_listing.order_options', 'business_listing.cart'))
    expect(props).toMatchObject({ hideAddress: true, hideOrderControl: true, fillable: true })
    expect(props.onHandleCart).toBeUndefined()
  })
})
