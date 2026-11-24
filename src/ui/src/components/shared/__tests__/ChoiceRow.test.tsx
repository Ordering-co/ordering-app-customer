import React from 'react'
import { Text } from 'react-native'
import { fireEvent } from '@testing-library/react-native'

import ChoiceRow from '../ChoiceRow'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

describe('ChoiceRow', () => {
  it('is a radio for a single choice and a checkbox for a multiple one, with its state', () => {
    const { getByTestId, rerender } = renderWithProviders(
      <ChoiceRow testID='row' kind='radio' selected onPress={jest.fn()}><Text>Small</Text></ChoiceRow>
    )
    expect(getByTestId('row').props.accessibilityRole).toBe('radio')
    expect(getByTestId('row').props.accessibilityState).toMatchObject({ checked: true, disabled: false })

    rerender(<ChoiceRow testID='row' kind='check' selected={false} onPress={jest.fn()}><Text>Ham</Text></ChoiceRow>)
    expect(getByTestId('row').props.accessibilityRole).toBe('checkbox')
    expect(getByTestId('row').props.accessibilityState).toMatchObject({ checked: false })
  })

  it('takes the whole row as the touch target', () => {
    const onPress = jest.fn()
    const { getByText } = renderWithProviders(
      <ChoiceRow kind='check' selected={false} onPress={onPress}><Text>Ham</Text></ChoiceRow>
    )
    fireEvent.press(getByText('Ham'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('does not answer when disabled (sold out), but a dimmed row still does (a group at its maximum says why)', () => {
    const disabled = jest.fn()
    const dimmed = jest.fn()
    const { getByText } = renderWithProviders(
      <>
        <ChoiceRow kind='check' selected={false} disabled onPress={disabled}><Text>Sold out</Text></ChoiceRow>
        <ChoiceRow kind='check' selected={false} dimmed onPress={dimmed}><Text>At max</Text></ChoiceRow>
      </>
    )
    fireEvent.press(getByText('Sold out'))
    fireEvent.press(getByText('At max'))
    expect(disabled).not.toHaveBeenCalled()
    expect(dimmed).toHaveBeenCalledTimes(1)
  })
})
