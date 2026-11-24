import '../../../../../../../../jest/helpers/registerM3NativeMocks'

import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { BusinessesListing } from '..'
import { renderWithProviders } from '../../../../../../../../jest/helpers/renderWithProviders'

const mockListingProps = jest.fn()
jest.mock('../FlatListBusinessListing', () => {
  const { View, TouchableOpacity } = require('react-native')
  return {
    FlatListBusinessListing: (props: any) => (
      mockListingProps(props),
      <View testID="flat-list-business-listing">
        <TouchableOpacity testID="refresh-list" onPress={() => props.handleOnRefresh?.()} />
      </View>
    )
  }
})

jest.mock('@components', () => require('../../../../../../../../jest/helpers/m3DiscoveryComponentsMock').getMock())
jest.mock('@ui', () => require('../../../../../../../../jest/helpers/m3DiscoveryUiMock').getUiMock())

describe('BusinessesListing Original layout', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('renders flat list and handles refresh', () => {
    const getBusinesses = jest.fn()
    const { getByTestId } = renderWithProviders(
      <BusinessesListing
        navigation={{ navigate: jest.fn() }}
        businessesList={{
          loading: false,
          businesses: [require('../../../../../../../../jest/helpers/m3DiscoveryDefaults').sampleBusiness]
        }}
        getBusinesses={getBusinesses}
        paginationProps={{ currentPage: 1, totalPages: 2 }}
        citiesState={{ cities: [] }}
        logosLayout={false}
      />
    )
    expect(getByTestId('flat-list-business-listing')).toBeTruthy()
    fireEvent.press(getByTestId('refresh-list'))
    expect(getBusinesses).toHaveBeenCalledWith(true)
  })

  describe('pickup by city without an address', () => {
    const unaddressed = { unaddressed_order_types_allowed: { value: '2' }, order_types_allowed: { value: '1|2' } }
    const setup = (options: any, configs: any = unaddressed, loading = false) => {
      const components = require('@components')
      const changeCityFilter = jest.fn()
      components.useOrderState.mockReturnValue({ loading, options, carts: {} })
      components.useOrderActions.mockReturnValue({ changeCityFilter })
      components.useConfig.mockReturnValue([{ loading: false, configs }])
      mockListingProps.mockClear()
      const view = renderWithProviders(
        <BusinessesListing
          navigation={{ navigate: jest.fn() }}
          businessesList={{ loading: false, businesses: [] }}
          getBusinesses={jest.fn()}
          paginationProps={{ currentPage: 1, totalPages: 1 }}
          citiesState={{ cities: [{ id: 1, name: 'Austin', enabled: true }] }}
          logosLayout
        />
      )
      return { changeCityFilter, view }
    }
    const lastProps = () => mockListingProps.mock.calls[mockListingProps.mock.calls.length - 1][0]

    it('lists without an address only for the types the project allows', () => {
      setup({ type: 2, city_id: 1 })
      expect(lastProps().isUnaddressedListing).toBe(true)
      setup({ type: 1 })
      expect(lastProps().isUnaddressedListing).toBe(false)
      setup({ type: 2, address_id: 4 })
      expect(lastProps().isUnaddressedListing).toBe(false)
      setup({ type: 2 }, {})
      expect(lastProps().isUnaddressedListing).toBe(false)
    })

    it('starts the order type from the order\'s type', () => {
      setup({ type: 2 })
      expect(lastProps().orderTypeValue).toBe(2)
    })

    it('keeps the city while it is pickup without an address', () => {
      const { changeCityFilter } = setup({ type: 2, city_id: 1 })
      expect(changeCityFilter).not.toHaveBeenCalled()
    })

    it('clears the city once the order has an address, once', () => {
      const { changeCityFilter, view } = setup({ type: 2, city_id: 1, address_id: 4 })
      expect(changeCityFilter).toHaveBeenCalledTimes(1)
      expect(changeCityFilter).toHaveBeenCalledWith(null)
      view.rerender(
        <BusinessesListing
          navigation={{ navigate: jest.fn() }}
          businessesList={{ loading: false, businesses: [] }}
          getBusinesses={jest.fn()}
          paginationProps={{ currentPage: 1, totalPages: 1 }}
          citiesState={{ cities: [{ id: 1, name: 'Austin', enabled: true }] }}
          logosLayout
        />
      )
      expect(changeCityFilter).toHaveBeenCalledTimes(1)
    })

    it('clears the city for another order type, and waits while the order loads', () => {
      expect(setup({ type: 3, city_id: 1 }).changeCityFilter).toHaveBeenCalledWith(null)
      expect(setup({ type: 2, city_id: 1, address_id: 4 }, unaddressed, true).changeCityFilter).not.toHaveBeenCalled()
    })
  })
})
