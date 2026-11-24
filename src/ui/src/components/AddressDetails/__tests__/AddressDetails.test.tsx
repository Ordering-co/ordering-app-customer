import '../../../../../../jest/helpers/registerM9NativeMocks'

jest.mock('../../shared', () => require('../../../../../../jest/helpers/m9IntegrationsSharedMock'))

import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { AddressDetails } from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

jest.mock('@components', () => require('../../../../../../jest/helpers/m9IntegrationsComponentsMock').getMock())

describe('AddressDetails', () => {
  it('renders delivery address and map image', () => {
    const d = require('../../../../../../jest/helpers/m9IntegrationsDefaults')
    const { getByText, getByTestId } = renderWithProviders(
      <AddressDetails {...d.addressDetailsDefaults} />
    )
    expect(getByText('Delivery address')).toBeTruthy()
    expect(getByText('123 Main St')).toBeTruthy()
    expect(getByTestId('fast-image')).toBeTruthy()
  })

  it('shows edit control for delivery orders', () => {
    const d = require('../../../../../../jest/helpers/m9IntegrationsDefaults')
    const { getByLabelText } = renderWithProviders(
      <AddressDetails {...d.addressDetailsDefaults} />
    )
    fireEvent.press(getByLabelText('Change address'))
    expect(d.addressDetailsDefaults.navigation.navigate).toHaveBeenCalledWith('AddressList', expect.objectContaining({ isFromCheckout: true }))
  })

  it('does not render businessCellphone under the delivery address', () => {
    const d = require('../../../../../../jest/helpers/m9IntegrationsDefaults')
    const { queryByText, getByText } = renderWithProviders(
      <AddressDetails {...d.addressDetailsDefaults} />
    )
    expect(getByText('123 Main St')).toBeTruthy()
    expect(queryByText('555-0100')).toBeNull()
  })
})
