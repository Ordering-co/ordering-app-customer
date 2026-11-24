import '../../../../../../jest/helpers/registerM5NativeMocks'

import React from 'react'
import { StyleSheet } from 'react-native'

import { BusinessDetailsComponent } from '../BusinessDetails'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'
import { themeWith, withTheme } from '../../../../../../jest/helpers/themeWith'
import { defaultAppTheme } from '@/theme/engine'
import { themeColor } from '@/theme/helpers'

jest.mock('@ui', () => require('../../../../../../jest/helpers/m9IntegrationsUiMock').getUiMock())

describe('BusinessDetailsComponent', () => {
  it('renders the store phone in the business info', () => {
    const { getByText } = renderWithProviders(
      <BusinessDetailsComponent
        showComponent
        loading={false}
        business={{ name: 'Le Comptoir', cellphone: '555-0100' }}
      />
    )
    expect(getByText('Le Comptoir')).toBeTruthy()
    expect(getByText('555-0100')).toBeTruthy()
  })

  it('hides the phone when contact is hidden', () => {
    const { getByText, queryByText } = renderWithProviders(
      <BusinessDetailsComponent
        showComponent
        hideContact
        loading={false}
        business={{ name: 'Le Comptoir', cellphone: '555-0100', phone: '555-0199' }}
      />
    )
    expect(getByText('Le Comptoir')).toBeTruthy()
    expect(queryByText('555-0100')).toBeNull()
    expect(queryByText('555-0199')).toBeNull()
  })

  it('hides the phone when the business has no cellphone', () => {
    const { getByText, queryByText } = renderWithProviders(
      <BusinessDetailsComponent
        showComponent
        loading={false}
        business={{ name: 'Le Comptoir' }}
      />
    )
    expect(getByText('Le Comptoir')).toBeTruthy()
    expect(queryByText('555-0100')).toBeNull()
  })
})

describe('BusinessDetailsComponent: the address (visibility checkout.business.address)', () => {
  const business = { name: 'Le Comptoir', cellphone: '555-0100', address: '12 Rue de la Paix' }
  const shown = withTheme({ visibility: { 'checkout.business.address': true } })
  const renderDetails = (props: any = {}, options?: any) => renderWithProviders(
    <BusinessDetailsComponent showComponent loading={false} business={business} {...props} />,
    options
  )

  it('has no address by default, only the name and the phone', () => {
    const { queryByTestId, queryByText, getByText } = renderDetails()
    expect(queryByTestId('checkout-business-address')).toBeNull()
    expect(queryByText('12 Rue de la Paix')).toBeNull()
    expect(getByText('Le Comptoir')).toBeTruthy()
    expect(getByText('555-0100')).toBeTruthy()
  })

  it('shows the address of the business under its name when the theme turns it on, on two lines at most', () => {
    const { getByTestId, getByText } = renderDetails({}, shown)
    const address = getByTestId('checkout-business-address')
    expect(address.props.children).toBe('12 Rue de la Paix')
    expect(address.props.numberOfLines).toBe(2)
    expect(getByText('Le Comptoir')).toBeTruthy()
    expect(getByText('555-0100')).toBeTruthy()
  })

  it('has no address line for a business without an address', () => {
    const { queryByTestId, getByText } = renderDetails({ business: { name: 'Le Comptoir', cellphone: '555-0100' } }, shown)
    expect(queryByTestId('checkout-business-address')).toBeNull()
    expect(getByText('Le Comptoir')).toBeTruthy()
  })

  it('keeps the address when the contact is hidden', () => {
    const { getByTestId, queryByText } = renderDetails({ hideContact: true }, shown)
    expect(getByTestId('checkout-business-address')).toBeTruthy()
    expect(queryByText('555-0100')).toBeNull()
  })

  it('has no address while the business loads', () => {
    expect(renderDetails({ loading: true }, shown).queryByTestId('checkout-business-address')).toBeNull()
  })
})

describe('BusinessDetailsComponent: the color of the name (checkout.base.business_name_color)', () => {
  const colorOf = (options?: any) => StyleSheet.flatten(renderWithProviders(
    <BusinessDetailsComponent showComponent loading={false} business={{ name: 'Le Comptoir' }} />,
    options
  ).getByText('Le Comptoir').props.style).color

  it('adds no color of its own by default, so the text style keeps its color', () => {
    expect(defaultAppTheme().native.components.checkout.base.business_name_color).toBeNull()
    expect(colorOf()).toBeUndefined()
  })

  it('adds no color for an empty value either', () => {
    expect(colorOf(withTheme({ components: { checkout: { base: { business_name_color: null } } } }))).toBeUndefined()
  })

  it('is the color of the theme', () => {
    const values = { components: { checkout: { base: { business_name_color: '#a1b2c3' } } } }
    const color = themeWith(values).native.components.checkout.base.business_name_color
    expect(color).toBe('#a1b2c3')
    expect(colorOf(withTheme(values))).toBe(color)
  })
})

describe('BusinessDetailsComponent: the logo (checkout.base.business_logo_*)', () => {
  const { BusinessLogo } = require('../../shared/BusinessLogo')
  const logoOf = (options?: any) => renderWithProviders(
    <BusinessDetailsComponent showComponent loading={false} business={{ name: 'Le Comptoir', logo: 'https://cdn.test/logo.png' }} />,
    options
  ).UNSAFE_getByType(BusinessLogo)

  it('takes the radius and the size of the checkout by default', () => {
    const base = defaultAppTheme().native.components.checkout.base
    expect(logoOf().props.radius).toBe(base.business_logo_radius)
    expect(logoOf().props.size).toBe(base.business_logo_size)
  })

  it('takes the radius of the store card by default, whatever the radius of the checkout', () => {
    const values = { components: { checkout: { base: { business_logo_radius: 15, business_logo_size: 72 } }, business_card: { base: { radius: 999 } } } }
    const logo = logoOf(withTheme(values))
    expect(logo.props.radius).toBe(999)
    expect(logo.props.size).toBe(72)
  })

  it('takes its own radius with business_logo_shape own', () => {
    const values = { components: { checkout: { base: { business_logo_shape: 'own', business_logo_radius: 15, business_logo_size: 72 } }, business_card: { base: { radius: 999 } } } }
    const logo = logoOf(withTheme(values))
    expect(logo.props.radius).toBe(15)
    expect(logo.props.size).toBe(72)
  })
})
