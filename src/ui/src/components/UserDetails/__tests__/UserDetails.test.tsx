import '../../../../../../jest/helpers/registerM8NativeMocks'

import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { UserDetails } from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

jest.mock('@components', () => require('../../../../../../jest/helpers/m8ProfileComponentsMock').getMock())
jest.mock('@ui', () => require('../../../../../../jest/helpers/m8ProfileUiMock').getUiMock())

describe('UserDetails', () => {
  it('renders customer details header and user info', () => {
    const { getByText } = renderWithProviders(<UserDetails />)
    expect(getByText('Customer Details')).toBeTruthy()
    expect(getByText(/Jane/)).toBeTruthy()
    expect(getByText('jane@test.com')).toBeTruthy()
  })

  it('shows Close and the fields while the customer details are being edited', () => {
    const d = require('../../../../../../jest/helpers/m8ProfileDefaults')
    const { getByLabelText, getByTestId } = renderWithProviders(
      <UserDetails
        {...d.userDetailsDefaults}
        isEdit
      />
    )
    expect(getByLabelText('Close')).toBeTruthy()
    expect(getByTestId('user-form-details-ui-stub')).toBeTruthy()
  })

  it('toggles edit mode when pencil is pressed', () => {
    const d = require('../../../../../../jest/helpers/m8ProfileDefaults')
    const toggleIsEdit = jest.fn()
    const { getByLabelText } = renderWithProviders(
      <UserDetails {...d.userDetailsDefaults} toggleIsEdit={toggleIsEdit} />
    )
    fireEvent.press(getByLabelText(/Edit|Close/))
    expect(toggleIsEdit).toHaveBeenCalled()
  })
})
