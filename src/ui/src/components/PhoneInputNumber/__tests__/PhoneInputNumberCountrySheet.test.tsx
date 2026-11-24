import React from 'react'
import { act, fireEvent, waitFor } from '@testing-library/react-native'

jest.mock('react-native-country-picker-modal', () => ({
  FlagType: { FLAT: 'flat', EMOJI: 'emoji' },
  getAllCountries: jest.fn(() => Promise.resolve([
    { cca2: 'US', name: 'United States', callingCode: ['1'] },
    { cca2: 'PR', name: 'Puerto Rico', callingCode: ['1787', '1939'] },
    { cca2: 'CO', name: 'Colombia', callingCode: ['57'] }
  ]))
}))

jest.mock('@ui', () => require('../../../../../../jest/helpers/m9IntegrationsUiMock').getUiMock())
// The number validated (`validation_phone_number_lib` on, as the server's default).
jest.mock('@components', () => require('../../../../../../jest/helpers/m9IntegrationsComponentsMock').getMock({
  useConfig: () => [{ loading: false, configs: { default_country_code: { value: 'US' }, validation_phone_number_lib: { value: '1' } } }]
}))

import { PhoneInputNumber } from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

const lastData = (handleData: jest.Mock) => handleData.mock.calls[handleData.mock.calls.length - 1]?.[0]

describe('PhoneInputNumber country sheet', () => {
  it('opens the countries in the select sheet, one row per calling code, and applies the choice', async () => {
    const changeCountry = jest.fn()
    const handleData = jest.fn()
    const { getByTestId, getByText, findByText, getByPlaceholderText, queryByText } = renderWithProviders(
      <PhoneInputNumber data={{ error: '' }} handleData={handleData} defaultCode='US' changeCountry={changeCountry} />
    )
    await waitFor(() => expect(getByTestId('phone-country-trigger')).toBeTruthy())
    await act(async () => { fireEvent.press(getByTestId('phone-country-trigger')) })
    expect(getByText('Select country')).toBeTruthy()
    expect(await findByText('Puerto Rico (+1939)')).toBeTruthy()

    fireEvent.changeText(getByPlaceholderText('Search'), 'puerto')
    expect(queryByText('United States (+1)')).toBeNull()
    fireEvent.press(getByText('Puerto Rico (+1787)'))

    expect(changeCountry).toHaveBeenCalledWith(expect.objectContaining({ cca2: 'PR', callingCode: ['1787'] }))
    expect(getByText('+1787')).toBeTruthy()

    // The number typed after the choice goes with the new calling code.
    fireEvent.changeText(getByTestId('phone-input'), '7212345')
    expect(lastData(handleData)).toEqual(expect.objectContaining({
      error: '',
      phone: { country_phone_code: '1787', cellphone: '7212345' }
    }))
  })

  it('validates the number with libphonenumber-js', () => {
    const handleData = jest.fn()
    const { getByTestId } = renderWithProviders(
      <PhoneInputNumber data={{ error: '' }} handleData={handleData} defaultCode='US' />
    )
    fireEvent.changeText(getByTestId('phone-input'), '555')
    expect(lastData(handleData).error).toBe('The Phone Number field is invalid')

    fireEvent.changeText(getByTestId('phone-input'), '2015550123')
    expect(lastData(handleData)).toEqual(expect.objectContaining({
      error: '',
      phone: { country_phone_code: '1', cellphone: '2015550123' }
    }))
  })

  it('takes a UK number typed with its leading zero, reported without it', () => {
    const handleData = jest.fn()
    const { getByTestId } = renderWithProviders(
      <PhoneInputNumber data={{ error: '' }} handleData={handleData} defaultCode='GB' />
    )
    fireEvent.changeText(getByTestId('phone-input'), '07400123456')
    expect(lastData(handleData)).toEqual(expect.objectContaining({
      error: '',
      phone: { country_phone_code: '44', cellphone: '7400123456' }
    }))
  })
})
