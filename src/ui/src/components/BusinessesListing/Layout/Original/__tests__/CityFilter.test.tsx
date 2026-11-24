import '../../../../../../../../jest/helpers/registerM3NativeMocks'

import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { CityFilter } from '../CityFilter'
import { renderWithProviders } from '../../../../../../../../jest/helpers/renderWithProviders'

jest.mock('@components', () => require('../../../../../../../../jest/helpers/m3DiscoveryComponentsMock').getMock())
jest.mock('@ui', () => require('../../../../../../../../jest/helpers/m3DiscoveryUiMock').getUiMock())

const cities = [
  { id: 1, name: 'Austin', enabled: true },
  { id: 2, name: 'Boston', enabled: true },
  { id: 3, name: 'Closed town', enabled: false }
]

describe('CityFilter', () => {
  it('shows "All cities" while no city is chosen (null or undefined)', () => {
    expect(renderWithProviders(<CityFilter cities={cities} cityId={null} onChange={jest.fn()} />).getByText('All cities')).toBeTruthy()
    expect(renderWithProviders(<CityFilter cities={cities} cityId={undefined} onChange={jest.fn()} />).getByText('All cities')).toBeTruthy()
  })

  it('shows the chosen city', () => {
    const { getByText, queryByText } = renderWithProviders(<CityFilter cities={cities} cityId={2} onChange={jest.fn()} />)
    expect(getByText('Boston')).toBeTruthy()
    expect(queryByText('All cities')).toBeNull()
  })

  it('lists "All cities" and the enabled cities only, and reports the choice', () => {
    const onChange = jest.fn()
    const { getByTestId, getByText, queryByText, getAllByText } = renderWithProviders(
      <CityFilter cities={cities} cityId={null} onChange={onChange} />
    )
    fireEvent.press(getByTestId('business-list-city-filter'))
    expect(queryByText('Closed town')).toBeNull()
    expect(getByText('Austin')).toBeTruthy()
    fireEvent.press(getByText('Austin'))
    expect(onChange).toHaveBeenCalledWith(1)

    fireEvent.press(getByTestId('business-list-city-filter'))
    fireEvent.press(getAllByText('All cities').slice(-1)[0])
    expect(onChange).toHaveBeenLastCalledWith(null)
  })

  it('does not open while the order loads', () => {
    const { getByTestId, queryByText } = renderWithProviders(<CityFilter cities={cities} cityId={null} disabled onChange={jest.fn()} />)
    fireEvent.press(getByTestId('business-list-city-filter'))
    expect(queryByText('Austin')).toBeNull()
  })
})
