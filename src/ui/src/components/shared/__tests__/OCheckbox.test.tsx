import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import OCheckbox from '../OCheckbox'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

describe('OCheckbox', () => {
  it('toggles its value and says whether it is checked', () => {
    const onValueChange = jest.fn()
    const { getByTestId, rerender } = renderWithProviders(
      <OCheckbox testID='box' value={false} onValueChange={onValueChange} />
    )
    expect(getByTestId('box').props.accessibilityState).toMatchObject({ checked: false })
    fireEvent.press(getByTestId('box'))
    expect(onValueChange).toHaveBeenCalledWith(true)

    rerender(<OCheckbox testID='box' value onValueChange={onValueChange} />)
    fireEvent.press(getByTestId('box'))
    expect(onValueChange).toHaveBeenLastCalledWith(false)
  })

  it('does nothing when disabled', () => {
    const onValueChange = jest.fn()
    const { getByTestId } = renderWithProviders(
      <OCheckbox testID='box' value={false} disabled onValueChange={onValueChange} />
    )
    fireEvent.press(getByTestId('box'))
    expect(onValueChange).not.toHaveBeenCalled()
  })
})
