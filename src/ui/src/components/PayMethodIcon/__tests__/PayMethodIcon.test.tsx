import React from 'react'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'
import { PayMethodIcon, payBrandMark } from '..'

describe('PayMethodIcon', () => {
  it('draws cash and a card as vector icons, a brand as its mark', () => {
    const glyph = (gateway: string) => renderWithProviders(<PayMethodIcon gateway={gateway} size={20} color='#000000' />)
      .UNSAFE_root.findAll((n: any) => typeof n.props.name === 'string').map((n: any) => n.props.name)[0]
    expect(glyph('cash')).toBe('cash-outline')
    expect(glyph('card_delivery')).toBe('card-outline')
    expect(glyph('credomatic')).toBe('card-outline')
    expect(payBrandMark('paypal')).toBeTruthy()
    expect(payBrandMark('cash')).toBeNull()
  })
})
