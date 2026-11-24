// Real dayjs (no mock): nextOpening/closedStatusLabel need real date math.
// System time is fixed so the test is deterministic.
import '../../../../../../jest/helpers/registerM3NativeMocks'

import React from 'react'
import { Image } from 'react-native'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

jest.mock('../../BusinessInformation', () => {
  const { View } = require('react-native')
  return { BusinessInformation: () => <View testID="business-information-panel" /> }
})
jest.mock('../../BusinessReviews', () => {
  const { View } = require('react-native')
  return { BusinessReviews: () => <View testID="business-reviews-panel" /> }
})
jest.mock('@components', () => require('../../../../../../jest/helpers/m3DiscoveryComponentsMock').getMock())
jest.mock('@ui', () => require('../../../../../../jest/helpers/m3DiscoveryUiMock').getUiMock())

import { BusinessBasicInformation } from '..'

jest.spyOn(Image, 'getSize').mockImplementation((_uri, success) => {
  success(320, 180)
})

describe('BusinessBasicInformation: the "Closed" header status', () => {
  const lapse = (open: [number, number], close: [number, number]) => ({
    open: { hour: open[0], minute: open[1] },
    close: { hour: close[0], minute: close[1] }
  })
  const onlyDay = (day: number, open: [number, number], close: [number, number]) =>
    Array.from({ length: 7 }, (_, i) => ({
      enabled: i === day,
      lapses: i === day ? [lapse(open, close)] : []
    }))

  beforeEach(() => {
    // Tuesday 2026-10-20 08:00 in New York (12:00 UTC)
    jest.useFakeTimers().setSystemTime(new Date('2026-10-20T12:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('shows "Closed · Opens …" when the business is closed', () => {
    const defaults = require('../../../../../../jest/helpers/m3DiscoveryDefaults')
    const business = {
      ...defaults.sampleBusiness,
      open: false,
      timezone: 'America/New_York',
      schedule: onlyDay(2, [9, 0], [17, 0]),
      today: { enabled: false, lapses: [] }
    }
    const { getByText } = renderWithProviders(
      <BusinessBasicInformation
        navigation={{ navigate: jest.fn() }}
        businessState={{ loading: false, business }}
        header={business.header}
        logo={business.logo}
        categoryState={{ loading: false, categories: [] }}
      />
    )
    expect(getByText('Closed · Opens 09:00')).toBeTruthy()
  })

  it('shows no closed status when the business is open', () => {
    const defaults = require('../../../../../../jest/helpers/m3DiscoveryDefaults')
    const business = { ...defaults.sampleBusiness, open: true }
    const { queryByText } = renderWithProviders(
      <BusinessBasicInformation
        navigation={{ navigate: jest.fn() }}
        businessState={{ loading: false, business }}
        header={business.header}
        logo={business.logo}
        categoryState={{ loading: false, categories: [] }}
      />
    )
    expect(queryByText(/Closed/)).toBeNull()
  })
})
