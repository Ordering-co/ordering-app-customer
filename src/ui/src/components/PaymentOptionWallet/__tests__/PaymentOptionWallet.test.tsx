import '../../../../../../jest/helpers/registerM5NativeMocks'

import React from 'react'

import { PaymentOptionWallet } from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'
import { withTheme } from '../../../../../../jest/helpers/themeWith'

jest.mock('@components', () => {
  const m5 = require('../../../../../../jest/helpers/m5CheckoutComponentsMock')
  const d = require('../../../../../../jest/helpers/m5CheckoutDefaults')
  return m5.getMock({
    PaymentOptionWallet: m5.renderUiController(d.paymentOptionWalletDefaults)
  })
})
jest.mock('@ui', () => require('../../../../../../jest/helpers/m5CheckoutUiMock').getUiMock())

describe('PaymentOptionWallet', () => {
  it('renders cash and points wallet options', () => {
    const { getAllByText } = renderWithProviders(<PaymentOptionWallet />)
    expect(getAllByText(/Cash|Wallet|Points/i).length).toBeGreaterThan(0)
  })

  it('shows wallets with balances', () => {
    const { getAllByText } = renderWithProviders(<PaymentOptionWallet />)
    expect(getAllByText(/\$20|\$50|20|50/i).length).toBeGreaterThan(0)
  })

  it('names each wallet row by its type', () => {
    const { getByText, queryByText } = renderWithProviders(
      <PaymentOptionWallet loyaltyRewardRate={1} />
    )
    expect(getByText(/Pay with Cash Wallet/)).toBeTruthy()
    expect(getByText(/Pay with Credit Points Wallet/)).toBeTruthy()
    expect(queryByText('Loyalty Points')).toBeNull()
  })
})

describe('PaymentOptionWallet: the pictures of the wallets (icons.wallet_cash, icons.wallet_points)', () => {
  const images = (utils: any) => utils.queryAllByTestId('fast-image').map((image: any) => image.props.source)

  it('draws the vector icons by default', () => {
    expect(images(renderWithProviders(<PaymentOptionWallet />))).toEqual([])
  })

  it('draws the picture of the theme in place of the icon of its wallet only', () => {
    const utils = renderWithProviders(
      <PaymentOptionWallet />,
      withTheme({ images: { 'icons.wallet_cash': 'https://example.com/cash.png' } })
    )
    expect(images(utils)).toEqual([{ uri: 'https://example.com/cash.png' }])
  })

  it('draws both pictures', () => {
    const utils = renderWithProviders(
      <PaymentOptionWallet />,
      withTheme({ images: { 'icons.wallet_cash': 'https://example.com/cash.png', 'icons.wallet_points': 'https://example.com/points.png' } })
    )
    expect(images(utils)).toEqual([{ uri: 'https://example.com/cash.png' }, { uri: 'https://example.com/points.png' }])
  })
})
