import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { CardForm } from '../CardForm'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

jest.mock('@components', () => ({
  useLanguage: () => [{}, (_key: string, fallback: string) => fallback]
}))

describe('CardForm', () => {
  it('formats the card as it is typed and is valid with every field and a name', () => {
    const onChange = jest.fn()
    const { getByTestId } = renderWithProviders(<CardForm onChange={onChange} />)

    fireEvent.changeText(getByTestId('CC_NUMBER'), '4242424242424242')
    expect(getByTestId('CC_NUMBER').props.value).toBe('4242 4242 4242 4242')
    fireEvent.changeText(getByTestId('CC_EXPIRY'), '1239')
    expect(getByTestId('CC_EXPIRY').props.value).toBe('12/39')
    fireEvent.changeText(getByTestId('CC_CVC'), '123')
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ valid: false }))

    fireEvent.changeText(getByTestId('CC_NAME'), 'Ada Lovelace')
    expect(onChange).toHaveBeenLastCalledWith({
      valid: true,
      values: { number: '4242 4242 4242 4242', expiry: '12/39', cvc: '123', type: 'visa', name: 'Ada Lovelace' }
    })
  })

  it('is not valid with an incomplete number', () => {
    const onChange = jest.fn()
    const { getByTestId } = renderWithProviders(<CardForm onChange={onChange} />)
    fireEvent.changeText(getByTestId('CC_NAME'), 'Ada')
    fireEvent.changeText(getByTestId('CC_NUMBER'), '4242')
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ valid: false }))
  })
})
