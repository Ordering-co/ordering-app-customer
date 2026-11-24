import '../../../../../../jest/helpers/registerM9NativeMocks'

jest.mock('@components', () => require('../../../../../../jest/helpers/m9IntegrationsComponentsMock').getMock())
jest.mock('@ui', () => require('../../../../../../jest/helpers/m9IntegrationsUiMock').getUiMock())
jest.mock('../TagOptions', () => ({
  addressTagIcon: () => 'home',
  TagOptions: () => null
}))
jest.mock('@react-native-vector-icons/ionicons/static', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    __esModule: true,
    default: (props: any) => React.createElement(View, { testID: 'ionicon', ...props })
  }
})

import React from 'react'
import { act, fireEvent } from '@testing-library/react-native'

import { AddressListUI } from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

describe('AddressList', () => {
  it('shows loading placeholders while addresses load', () => {
    const d = require('../../../../../../jest/helpers/m9IntegrationsDefaults')
    const { getAllByTestId } = renderWithProviders(
      <AddressListUI
        {...d.addressListDefaults}
        addressList={{ loading: true, error: null, addresses: [] }}
      />
    )
    expect(getAllByTestId('placeholder-line').length).toBeGreaterThan(0)
  })

  it('shows empty state when no addresses saved', () => {
    const d = require('../../../../../../jest/helpers/m9IntegrationsDefaults')
    const { getByText } = renderWithProviders(
      <AddressListUI
        {...d.addressListDefaults}
        addressList={{ loading: false, error: null, addresses: [] }}
      />
    )
    expect(getByText('No addresses saved yet')).toBeTruthy()
  })

  it('navigates to add new address from empty state', () => {
    const d = require('../../../../../../jest/helpers/m9IntegrationsDefaults')
    const onNavigationRedirect = jest.fn()
    const { getByText } = renderWithProviders(
      <AddressListUI
        {...d.addressListDefaults}
        addressList={{ loading: false, error: null, addresses: [] }}
        onNavigationRedirect={onNavigationRedirect}
      />
    )
    fireEvent.press(getByText('Add new Address'))
    expect(onNavigationRedirect).toHaveBeenCalledWith(
      'AddressForm',
      expect.objectContaining({ address: null })
    )
  })

  it('does not navigate until set-default finishes', async () => {
    const d = require('../../../../../../jest/helpers/m9IntegrationsDefaults')
    let resolveDefault: ((value?: unknown) => void) | undefined
    const handleSetDefault = jest.fn(() => new Promise((resolve) => {
      resolveDefault = resolve
    }))
    const onNavigationRedirect = jest.fn()
    const { getByText } = renderWithProviders(
      <AddressListUI
        {...d.addressListDefaults}
        handleSetDefault={handleSetDefault}
        onNavigationRedirect={onNavigationRedirect}
      />
    )

    fireEvent.press(getByText('456 Oak Ave'))
    expect(handleSetDefault).toHaveBeenCalled()
    expect(onNavigationRedirect).not.toHaveBeenCalled()

    await act(async () => {
      resolveDefault?.()
    })
    expect(onNavigationRedirect).toHaveBeenCalledWith('BottomTab')
  })

  it('stays on AddressList when set-default fails', async () => {
    const d = require('../../../../../../jest/helpers/m9IntegrationsDefaults')
    const onNavigationRedirect = jest.fn()
    const { getByText } = renderWithProviders(
      <AddressListUI
        {...d.addressListDefaults}
        handleSetDefault={jest.fn(async () => {
          throw new Error('failed')
        })}
        onNavigationRedirect={onNavigationRedirect}
      />
    )

    await act(async () => {
      fireEvent.press(getByText('456 Oak Ave'))
    })
    expect(onNavigationRedirect).not.toHaveBeenCalled()
  })

  describe('order for pickup without an address', () => {
    const configsWith = (allowed: string, unaddressed: string) => ({
      configs: {
        order_types_allowed: { value: allowed },
        unaddressed_order_types_allowed: { value: unaddressed }
      }
    })
    const setup = ({ options = { type: 1 }, configs = configsWith('1|2', '2'), loading = false } = {} as any) => {
      const components = require('@components')
      const changeType = jest.fn().mockResolvedValue(undefined)
      components.useOrder.mockReturnValue([{ loading, options, carts: {} }, { changeType }])
      components.useConfig.mockReturnValue([configs])
      return changeType
    }
    const renderList = (props: any = {}) => {
      const d = require('../../../../../../jest/helpers/m9IntegrationsDefaults')
      const onNavigationRedirect = jest.fn()
      const view = renderWithProviders(
        <AddressListUI
          {...d.addressListDefaults}
          addressList={{ loading: false, error: null, addresses: [] }}
          onNavigationRedirect={onNavigationRedirect}
          {...props}
        />
      )
      return { ...view, onNavigationRedirect }
    }

    it('switches to pickup and opens Home when the project lists pickup without an address', async () => {
      const changeType = setup()
      const { getByText, onNavigationRedirect } = renderList()
      await act(async () => { fireEvent.press(getByText('Order for pickup')) })
      expect(changeType).toHaveBeenCalledWith(2)
      expect(onNavigationRedirect).toHaveBeenCalledWith('BottomTab', expect.objectContaining({ screen: 'Home' }))
    })

    it('is not offered when the project does not list pickup without an address', () => {
      setup({ configs: configsWith('1|2', '') })
      expect(renderList().queryByText('Order for pickup')).toBeNull()
      setup({ configs: configsWith('1', '2') })
      expect(renderList().queryByText('Order for pickup')).toBeNull()
    })

    it('is not offered when the order has an address, or from the profile, the checkout or the listing', () => {
      setup({ options: { type: 1, address_id: 5 } })
      expect(renderList().queryByText('Order for pickup')).toBeNull()
      setup()
      expect(renderList({ isFromProfile: true }).queryByText('Order for pickup')).toBeNull()
      expect(renderList({ route: { params: { isFromCheckout: true } } }).queryByText('Order for pickup')).toBeNull()
      expect(renderList({ isFromBusinesses: true }).queryByText('Order for pickup')).toBeNull()
    })

    it('does nothing while the order is loading', async () => {
      const changeType = setup({ loading: true })
      const { getByText } = renderList()
      await act(async () => { fireEvent.press(getByText('Order for pickup')) })
      expect(changeType).not.toHaveBeenCalled()
    })
  })
})
