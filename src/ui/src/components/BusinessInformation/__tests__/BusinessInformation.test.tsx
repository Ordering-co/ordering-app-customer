import '../../../../../../jest/helpers/registerM3NativeMocks'

import React from 'react'

import { BusinessInformation } from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'
import { setNativeFeatures } from '../../../../../utils/nativeKeys'

jest.mock('@components', () => require('../../../../../../jest/helpers/m3DiscoveryComponentsMock').getMock())
jest.mock('@ui', () => require('../../../../../../jest/helpers/m3DiscoveryUiMock').getUiMock())

describe('BusinessInformation', () => {
  it('renders business address and schedule', () => {
    const { getByText } = renderWithProviders(
      <BusinessInformation navigation={{ navigate: jest.fn() }} />
    )
    expect(getByText('123 Main St')).toBeTruthy()
    expect(getByText('Monday')).toBeTruthy()
  })

  describe('the business\'s map', () => {
    const businessLocation = { location: { lat: 40.7128, lng: -74.006 } }

    afterEach(() => setNativeFeatures(undefined))

    it('shows with the app\'s Google Maps key', () => {
      setNativeFeatures({ googleMaps: true })
      const { getByTestId } = renderWithProviders(
        <BusinessInformation navigation={{ navigate: jest.fn() }} businessLocation={businessLocation} />
      )
      expect(getByTestId('google-map-stub')).toBeTruthy()
    })

    it('is left out without the key: the address and the schedule stay', () => {
      setNativeFeatures({ googleMaps: false })
      const { getByText, queryByTestId } = renderWithProviders(
        <BusinessInformation navigation={{ navigate: jest.fn() }} businessLocation={businessLocation} />
      )
      expect(queryByTestId('google-map-stub')).toBeNull()
      expect(getByText('123 Main St')).toBeTruthy()
      expect(getByText('Monday')).toBeTruthy()
    })
  })
})
