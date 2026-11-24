import React from 'react'
import { render } from '@testing-library/react-native'

import { HomeEntry } from '../HomeEntry'

const mockOrder = jest.fn()
const mockConfig = jest.fn()
const mockSettings: any = {}
const mockBusinessProps = jest.fn()
jest.mock('@components', () => ({
  useOrderState: () => mockOrder(),
  useConfig: () => mockConfig()
}))
jest.mock('../../config', () => ({ __esModule: true, get default() { return mockSettings } }))
jest.mock('../../pages/AddressList', () => () => require('react').createElement('Text', null, 'ADDRESS_LIST'))
jest.mock('../../pages/BusinessesListing', () => () => require('react').createElement('Text', null, 'BUSINESS_LIST'))
jest.mock('../../pages/BusinessProductsList', () => (props: any) => {
  mockBusinessProps(props)
  return require('react').createElement('Text', null, 'BUSINESS_PAGE')
})

const show = (options: any, configs: any, propsToPass: any = {}) => {
  mockOrder.mockReturnValue({ options })
  mockConfig.mockReturnValue([{ configs }])
  return render(<HomeEntry propsToPass={propsToPass} />)
}
const pickupWithoutAddress = { unaddressed_order_types_allowed: { value: '2' } }

beforeEach(() => {
  delete mockSettings.businessSlug
  mockBusinessProps.mockClear()
})

describe('HomeEntry: what Home shows', () => {
  it('asks for an address first, as before', () => {
    expect(show({ type: 1 }, pickupWithoutAddress).queryByText('ADDRESS_LIST')).toBeTruthy()
    expect(show({ type: 2 }, {}).queryByText('ADDRESS_LIST')).toBeTruthy()
  })

  it('lists the businesses with an address', () => {
    expect(show({ type: 1, address_id: 3 }, {}).queryByText('BUSINESS_LIST')).toBeTruthy()
  })

  it('lists the businesses without an address for a type the project lists that way', () => {
    expect(show({ type: 2 }, pickupWithoutAddress).queryByText('BUSINESS_LIST')).toBeTruthy()
  })

  describe('with a single business configured', () => {
    beforeEach(() => {
      mockSettings.businessSlug = 1
    })

    it('opens the business instead of the listing', () => {
      const utils = show({ type: 1, address_id: 3 }, {})
      expect(utils.queryByText('BUSINESS_PAGE')).toBeTruthy()
      expect(utils.queryByText('BUSINESS_LIST')).toBeNull()
    })

    it('opens the business for a type the project lists without an address', () => {
      expect(show({ type: 2 }, pickupWithoutAddress).queryByText('BUSINESS_PAGE')).toBeTruthy()
    })

    it('still asks for an address first', () => {
      const utils = show({ type: 1 }, {})
      expect(utils.queryByText('ADDRESS_LIST')).toBeTruthy()
      expect(utils.queryByText('BUSINESS_PAGE')).toBeNull()
    })

    it('marks the page as the home screen and keeps the props of the tab', () => {
      const route = { params: undefined }
      show({ type: 1, address_id: 3 }, {}, { route, navigation: 'nav' })
      expect(mockBusinessProps).toHaveBeenCalledWith(expect.objectContaining({ isHome: true, route, navigation: 'nav' }))
    })
  })

  it('lists the businesses when the configured value means off', () => {
    mockSettings.businessSlug = null
    expect(show({ type: 1, address_id: 3 }, {}).queryByText('BUSINESS_LIST')).toBeTruthy()
  })
})
