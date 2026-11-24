import '../../../../../../jest/helpers/registerM4NativeMocks'

import React from 'react'
import { Text } from 'react-native'
import { fireEvent } from '@testing-library/react-native'

import { ProductOption, optionLimitText } from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'
import { withTheme } from '../../../../../../jest/helpers/themeWith'
import { defaultAppTheme } from '@/theme/engine'

jest.mock('@components', () => {
  const m4 = require('../../../../../../jest/helpers/m4MenuComponentsMock')
  const d = require('../../../../../../jest/helpers/m4MenuDefaults')
  return m4.getMock({
    ProductOption: m4.renderUiController({
      option: { id: 2, name: 'Extras', min: 0, max: 3 },
      error: false
    })
  })
})
jest.mock('@ui', () => require('../../../../../../jest/helpers/m4MenuUiMock').getUiMock())

describe('ProductOption', () => {
  it('renders option max label and starts open when the theme collapses none', () => {
    const theme: any = defaultAppTheme()
    const productOption = theme.native.components.product_option
    const native = {
      ...theme.native,
      components: { ...theme.native.components, product_option: { ...productOption, base: { ...productOption.base, collapsed: 'none' } } }
    }
    const { getByText, queryByText, getByLabelText } = renderWithProviders(
      <ProductOption>
        <Text>Child option</Text>
      </ProductOption>,
      { themeOverrides: { native } }
    )
    expect(getByText('Extras')).toBeTruthy()
    expect(getByText(/Max/i)).toBeTruthy()
    expect(getByText('Child option')).toBeTruthy()
    fireEvent.press(getByLabelText('Extras'))
    expect(queryByText('Child option')).toBeNull()
  })

  it('starts an optional group closed with the default theme (`collapsed: optional`, as before)', () => {
    const theme: any = defaultAppTheme()
    const productOption = theme.native.components.product_option
    const native = {
      ...theme.native,
      components: { ...theme.native.components, product_option: { ...productOption, base: { ...productOption.base, collapsed: 'optional' } } }
    }
    const { queryByText, getByText, getByLabelText } = renderWithProviders(
      <ProductOption>
        <Text>Child option</Text>
      </ProductOption>,
      { themeOverrides: { native } }
    )
    expect(queryByText('Child option')).toBeNull()
    fireEvent.press(getByLabelText('Extras'))
    expect(getByText('Child option')).toBeTruthy()
  })
})

describe('ProductOption: the optional badge (product.options.optional_badge)', () => {
  const on = { visibility: { 'product.options.optional_badge': true } }
  const renderOption = (option: any, options?: any) => renderWithProviders(
    <ProductOption option={option}>
      <Text>Child option</Text>
    </ProductOption>,
    options
  )

  it('has none by default on an optional group', () => {
    const { queryByTestId, queryByText, getByText } = renderOption({ id: 2, name: 'Extras', min: 0, max: 3 })
    expect(queryByTestId('optional-badge')).toBeNull()
    expect(queryByText('Optional')).toBeNull()
    expect(getByText(/Max/i)).toBeTruthy()
  })

  it('has none by default on a required group', () => {
    const { queryByTestId, getByText } = renderOption({ id: 3, name: 'Size', min: 1, max: 1 })
    expect(queryByTestId('optional-badge')).toBeNull()
    expect(getByText('Required')).toBeTruthy()
  })

  it.each([
    ['min 0 with a maximum', { id: 2, name: 'Extras', min: 0, max: 3 }],
    ['min 0 without limits', { id: 4, name: 'Sauces', min: 0, max: 0 }],
    ['no min', { id: 5, name: 'Toppings' }]
  ])('marks an optional group (%s) when the theme shows it', (_name, option) => {
    const { getByTestId, getByText, queryByText } = renderOption(option, withTheme(on))
    expect(getByTestId('optional-badge')).toBeTruthy()
    expect(getByText('Optional')).toBeTruthy()
    expect(queryByText('Required')).toBeNull()
  })

  it('never marks a required group', () => {
    const { queryByTestId, getByText } = renderOption({ id: 3, name: 'Size', min: 1, max: 1 }, withTheme(on))
    expect(queryByTestId('optional-badge')).toBeNull()
    expect(getByText('Required')).toBeTruthy()
  })
})

describe('optionLimitText', () => {
  const t = (_key: string, fallback: string) => fallback

  it('says what the group asks for, as the web does', () => {
    expect(optionLimitText(t, { min: 1, max: 1 })).toBe('Choose 1')
    expect(optionLimitText(t, { min: 0, max: 3 })).toBe('Max. 3')
    expect(optionLimitText(t, { min: 2, max: 0 })).toBe('Min. 2')
    expect(optionLimitText(t, { min: 1, max: 2 })).toBe('Min. 1 - Max. 2')
    expect(optionLimitText(t, { min: 0, max: 0 })).toBe('')
  })

  it('does not double the dot of a translation that already has it', () => {
    const es = (key: string, fallback: string) => (key === 'MAX' ? 'máx.' : fallback)
    expect(optionLimitText(es, { min: 0, max: 2 })).toBe('máx. 2')
  })
})
