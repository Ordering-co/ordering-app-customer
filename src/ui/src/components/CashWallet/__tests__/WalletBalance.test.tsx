import React from 'react'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'
import { defaultAppTheme } from '../../../../../theme/engine'
import { WalletBalance } from '../WalletBalance'

jest.mock('@ui', () => ({ OText: require('../../shared/OText').default }))

describe('WalletBalance', () => {
  it("draws the wallet's icon in its theme color: coins for cash, a heart for points", () => {
    const look: any = defaultAppTheme().native.components.wallet_balance.base
    const cash = renderWithProviders(<WalletBalance label='Available' amount='$10' type='cash' />)
    const coins = cash.UNSAFE_root.findAll((n: any) => n.props.name === 'coins' && n.props.color === look.cash_icon_color)
    expect(coins.length).toBeGreaterThan(0)
    const points = renderWithProviders(<WalletBalance label='Available' amount='10 Points' type='credit_point' />)
    const heart = points.UNSAFE_root.findAll((n: any) => n.props.name === 'heart' && n.props.color === look.points_icon_color)
    expect(heart.length).toBeGreaterThan(0)
  })
})
