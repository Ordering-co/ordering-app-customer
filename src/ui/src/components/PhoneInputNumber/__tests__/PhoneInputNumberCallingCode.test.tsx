import React from 'react'
import { act, fireEvent, waitFor } from '@testing-library/react-native'

// The submodule's real `CODES` table (wrong for CZ, GE, UZ, CY…, without PK…):
// the field must not take the calling code from it.
jest.mock('@ui', () => require('../../../../../../jest/helpers/m9IntegrationsUiMock').getUiMock())
jest.mock('@components', () => {
  const { CODES } = require('../../../../../@/components/src/constants/code-numbers')
  return require('../../../../../../jest/helpers/m9IntegrationsComponentsMock').getMock({
    CODES,
    useConfig: () => [{ loading: false, configs: (global as any).__phoneConfigs }]
  })
})

import { PhoneInputNumber } from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

const setConfigs = (country: string | null, validation = '1') => {
  (global as any).__phoneConfigs = {
    ...(country ? { default_country_code: { value: country } } : {}),
    validation_phone_number_lib: { value: validation }
  }
}

const lastData = (handleData: jest.Mock) => handleData.mock.calls[handleData.mock.calls.length - 1]?.[0]

// The countries of the real picker (react-native-country-picker-modal), loaded after the mount.
const settle = () => act(async () => { await Promise.resolve() })

describe('PhoneInputNumber calling code', () => {
  beforeEach(() => setConfigs('US'))

  it.each([
    ['CZ', '420', '601123456'],
    ['GE', '995', '555123456'],
    ['UZ', '998', '901234567'],
    ['CY', '357', '96123456'],
    // Not in the submodule's table at all.
    ['PK', '92', '3012345678'],
    ['RS', '381', '601234567'],
  ])('takes the calling code of the project\'s default country %s (+%s)', async (country, code, mobile) => {
    setConfigs(country)
    const handleData = jest.fn()
    const { getByTestId, getByText } = renderWithProviders(
      <PhoneInputNumber data={{ error: '' }} handleData={handleData} />
    )
    await settle()
    expect(getByText(`+${code}`)).toBeTruthy()

    fireEvent.changeText(getByTestId('phone-input'), mobile)
    expect(lastData(handleData)).toEqual(expect.objectContaining({
      error: '',
      phone: { country_phone_code: code, cellphone: mobile }
    }))
  })

  it('takes the calling code of the user\'s country given as an ISO code', async () => {
    const { getByText } = renderWithProviders(
      <PhoneInputNumber data={{ error: '' }} handleData={jest.fn()} defaultCode='cz' />
    )
    await settle()
    expect(getByText('+420')).toBeTruthy()
  })

  it('keeps a saved numeric code as it is, with its country', async () => {
    const { getByText, getByTestId, findByText, getByPlaceholderText } = renderWithProviders(
      <PhoneInputNumber data={{ error: '' }} handleData={jest.fn()} defaultCode='420' />
    )
    await settle()
    expect(getByText('+420')).toBeTruthy()
    // The country of the sheet is the code's own (CZ), not the project's.
    await act(async () => { fireEvent.press(getByTestId('phone-country-trigger')) })
    fireEvent.changeText(getByPlaceholderText('Search'), '+420')
    const row = await findByText(/^Czech.* \(\+420\)$/)
    let node: any = row
    while (node && node.props.accessibilityState?.selected === undefined) node = node.parent
    expect(node.props.accessibilityState.selected).toBe(true)
  })

  it('shows the read-only number with the country\'s code', async () => {
    const { getByText } = renderWithProviders(
      <PhoneInputNumber data={{ error: '' }} handleData={jest.fn()} defaultCode='UZ' defaultValue='901234567' isDisabled />
    )
    await settle()
    expect(getByText('+998 901234567')).toBeTruthy()
  })

  it('keeps the two codes of Puerto Rico: the first by default, the user\'s own one when saved', async () => {
    const first = renderWithProviders(
      <PhoneInputNumber data={{ error: '' }} handleData={jest.fn()} defaultCode='PR' />
    )
    await settle()
    expect(first.getByText('+1787')).toBeTruthy()
    first.unmount()

    const own = renderWithProviders(
      <PhoneInputNumber data={{ error: '' }} handleData={jest.fn()} defaultCode='PR' defaultCodeFallback='1939' />
    )
    await settle()
    expect(own.getByText('+1939')).toBeTruthy()
  })

  it('falls back to libphonenumber-js while the picker\'s countries are not loaded', () => {
    setConfigs('PK')
    const { getByText } = renderWithProviders(
      <PhoneInputNumber data={{ error: '' }} handleData={jest.fn()} />
    )
    // No `settle()`: the first render, before the countries arrive.
    expect(getByText('+92')).toBeTruthy()
  })
})

describe('PhoneInputNumber numbering data', () => {
  beforeEach(() => setConfigs('US'))

  // Ranges opened after libphonenumber-js 1.11.19 (January 2025).
  it.each([
    ['VE', '58', '4221234567'],
    ['TR', '90', '5091234567'],
    ['AE', '971', '531234567'],
  ])('takes a number of a recent range of %s', async (country, code, mobile) => {
    setConfigs(country)
    const handleData = jest.fn()
    const { getByTestId } = renderWithProviders(
      <PhoneInputNumber data={{ error: '' }} handleData={handleData} />
    )
    await settle()
    fireEvent.changeText(getByTestId('phone-input'), mobile)
    expect(lastData(handleData)).toEqual(expect.objectContaining({
      error: '',
      phone: { country_phone_code: code, cellphone: mobile }
    }))
  })

  it('still refuses a number of no range (the full metadata, not the loose one)', async () => {
    setConfigs('VE')
    const handleData = jest.fn()
    const { getByTestId } = renderWithProviders(
      <PhoneInputNumber data={{ error: '' }} handleData={handleData} />
    )
    await settle()
    fireEvent.changeText(getByTestId('phone-input'), '4331234567')
    expect(lastData(handleData).error).toBe('The Phone Number field is invalid')
  })
})

describe('PhoneInputNumber whole number', () => {
  beforeEach(() => setConfigs('US'))

  it('takes a pasted number with its + and calling code: its country and the national number', async () => {
    const handleData = jest.fn()
    const changeCountry = jest.fn()
    const { getByTestId, getByText } = renderWithProviders(
      <PhoneInputNumber data={{ error: '' }} handleData={handleData} changeCountry={changeCountry} />
    )
    await settle()
    fireEvent.changeText(getByTestId('phone-input'), '+52 55 1234 5678')

    expect(getByText('+52')).toBeTruthy()
    expect(getByTestId('phone-input').props.value).toBe('5512345678')
    expect(changeCountry).toHaveBeenCalledWith(expect.objectContaining({ cca2: 'MX', callingCode: ['52'] }))
    expect(lastData(handleData)).toEqual(expect.objectContaining({
      error: '',
      phone: { country_phone_code: '52', cellphone: '5512345678' }
    }))
  })

  it('keeps the picker\'s own code of a country with several (Puerto Rico +1787)', async () => {
    const handleData = jest.fn()
    const { getByTestId, getByText } = renderWithProviders(
      <PhoneInputNumber data={{ error: '' }} handleData={handleData} />
    )
    await settle()
    fireEvent.changeText(getByTestId('phone-input'), '+1 (787) 721-2345')
    expect(getByText('+1787')).toBeTruthy()
    expect(getByTestId('phone-input').props.value).toBe('7212345')
    expect(lastData(handleData)).toEqual(expect.objectContaining({
      error: '',
      phone: { country_phone_code: '1787', cellphone: '7212345' }
    }))
  })

  it('takes a national number pasted with spaces, dashes and parentheses', async () => {
    const handleData = jest.fn()
    const { getByTestId } = renderWithProviders(
      <PhoneInputNumber data={{ error: '' }} handleData={handleData} />
    )
    await settle()
    fireEvent.changeText(getByTestId('phone-input'), '(201) 555-0123')
    // The field keeps what was typed; the number reported has its digits only.
    expect(getByTestId('phone-input').props.value).toBe('(201) 555-0123')
    expect(lastData(handleData)).toEqual(expect.objectContaining({
      error: '',
      phone: { country_phone_code: '1', cellphone: '2015550123' }
    }))
  })

  it('refuses what is not a number (other characters are not dropped silently)', async () => {
    const handleData = jest.fn()
    const { getByTestId } = renderWithProviders(
      <PhoneInputNumber data={{ error: '' }} handleData={handleData} />
    )
    await settle()
    fireEvent.changeText(getByTestId('phone-input'), '201*555#0123')
    expect(lastData(handleData).error).toBe('The Phone Number field is invalid')
  })

  it('waits for a number typed with its + to be whole', async () => {
    const handleData = jest.fn()
    const { getByTestId, getByText, queryByText } = renderWithProviders(
      <PhoneInputNumber data={{ error: '' }} handleData={handleData} />
    )
    await settle()
    fireEvent.changeText(getByTestId('phone-input'), '+52 55 12')
    // Nothing typed is rewritten while the number is not whole.
    expect(getByTestId('phone-input').props.value).toBe('+52 55 12')
    expect(getByText('+1')).toBeTruthy()
    expect(queryByText('+52')).toBeNull()
    expect(lastData(handleData).error).toBe('The Phone Number field is invalid')

    fireEvent.changeText(getByTestId('phone-input'), '+525512345678')
    expect(getByText('+52')).toBeTruthy()
    expect(lastData(handleData).error).toBe('')
  })
})

describe('PhoneInputNumber national number', () => {
  const report = async (country: string, typed: string) => {
    setConfigs(country)
    const handleData = jest.fn()
    const { getByTestId } = renderWithProviders(
      <PhoneInputNumber data={{ error: '' }} handleData={handleData} />
    )
    await settle()
    fireEvent.changeText(getByTestId('phone-input'), typed)
    return lastData(handleData)
  }

  // Italy has no trunk prefix: the zero of a landline is part of the number.
  it.each([
    ['0612345678', '0612345678'],
    ['06 1234 5678', '0612345678'],
    ['+39 06 1234 5678', '0612345678'],
    // A mobile has none.
    ['3123456789', '3123456789'],
  ])('keeps the zero that is part of an Italian number (%s)', async (typed, cellphone) => {
    expect(await report('IT', typed)).toEqual(expect.objectContaining({
      error: '',
      phone: { country_phone_code: '39', cellphone }
    }))
  })

  // What `handleData` took before, where a leading zero is the trunk prefix or there is none.
  it.each([
    ['GB', '44', '07400123456', '7400123456'],
    ['GB', '44', '7400123456', '7400123456'],
    ['GB', '44', '020 7031 3000', '2070313000'],
    // Not a number in use, taken by the UK's own rule (01, 02, 07… and its length).
    ['GB', '44', '01000000000', '1000000000'],
    ['MX', '52', '5512345678', '5512345678'],
    ['CO', '57', '3001234567', '3001234567'],
    ['US', '1', '2015550123', '2015550123'],
    ['DE', '49', '030123456', '30123456'],
    ['DE', '49', '015112345678', '15112345678'],
    ['DE', '49', '15112345678', '15112345678'],
    ['PR', '1787', '7212345', '7212345'],
  ])('reports the national number of %s (+%s) %s as %s', async (country, code, typed, cellphone) => {
    expect(await report(country, typed)).toEqual(expect.objectContaining({
      error: '',
      phone: { country_phone_code: code, cellphone }
    }))
  })

  it('gives the number as typed when the project validates no numbers', async () => {
    setConfigs('IT', '0')
    const handleData = jest.fn()
    const { getByTestId } = renderWithProviders(
      <PhoneInputNumber data={{ error: '' }} handleData={handleData} />
    )
    await settle()
    fireEvent.changeText(getByTestId('phone-input'), '0612345678')
    expect(lastData(handleData)).toEqual(expect.objectContaining({
      error: '',
      phone: { country_phone_code: '39', cellphone: '0612345678' }
    }))
  })
})

describe('PhoneInputNumber edit state', () => {
  beforeEach(() => setConfigs('US'))

  it('shows the saved number again when the field leaves read-only, not what was typed before', async () => {
    const handleData = jest.fn()
    const props = { data: { error: '' }, handleData, defaultCode: 'US', defaultValue: '2015550123' }
    const { getByTestId, getByText, findByText, getByPlaceholderText, rerender } = renderWithProviders(<PhoneInputNumber {...props} />)
    await settle()
    // Another country, chosen in the sheet, and another number.
    await act(async () => { fireEvent.press(getByTestId('phone-country-trigger')) })
    fireEvent.changeText(getByPlaceholderText('Search'), 'Mexico')
    fireEvent.press(await findByText('Mexico (+52)'))
    fireEvent.changeText(getByTestId('phone-input'), '5512345678')
    expect(getByTestId('phone-input').props.value).toBe('5512345678')
    expect(getByText('+52')).toBeTruthy()

    // The profile leaves the edit (read-only) and enters it again.
    rerender(<PhoneInputNumber {...props} isDisabled />)
    expect(getByText('+1 2015550123')).toBeTruthy()
    rerender(<PhoneInputNumber {...props} isDisabled={false} />)

    expect(getByTestId('phone-input').props.value).toBe('2015550123')
    expect(getByText('+1')).toBeTruthy()
  })

  it('shows a default value that arrives after the mount', async () => {
    const props = { data: { error: '' }, handleData: jest.fn(), defaultCode: 'US' }
    const { getByTestId, rerender } = renderWithProviders(<PhoneInputNumber {...props} />)
    await settle()
    expect(getByTestId('phone-input').props.value).toBe('')
    rerender(<PhoneInputNumber {...props} defaultValue='2015550123' />)
    expect(getByTestId('phone-input').props.value).toBe('2015550123')
  })

  it('does not replace what the user is typing with a later default value', async () => {
    const props = { data: { error: '' }, handleData: jest.fn(), defaultCode: 'US' }
    const { getByTestId, rerender } = renderWithProviders(<PhoneInputNumber {...props} />)
    await settle()
    fireEvent.changeText(getByTestId('phone-input'), '201555')
    rerender(<PhoneInputNumber {...props} defaultValue='9999999999' />)
    expect(getByTestId('phone-input').props.value).toBe('201555')
  })
})

describe('PhoneInputNumber focus', () => {
  beforeEach(() => setConfigs('US'))

  it('focuses the number from its box, never from the countries\' sheet', async () => {
    const ref: any = React.createRef()
    const { getByTestId, getByText } = renderWithProviders(
      <PhoneInputNumber data={{ error: '' }} handleData={jest.fn()} forwardRef={ref} />
    )
    await settle()
    const focus = jest.spyOn(ref.current, 'focus').mockImplementation(() => {})

    await act(async () => { fireEvent.press(getByTestId('phone-country-trigger')) })
    await waitFor(() => expect(getByText('Select country')).toBeTruthy())
    // A touch on the sheet where nothing is pressable (its title).
    fireEvent.press(getByText('Select country'))
    expect(focus).not.toHaveBeenCalled()

    fireEvent.press(getByTestId('phone-input-box'))
    expect(focus).toHaveBeenCalledTimes(1)
  })
})
