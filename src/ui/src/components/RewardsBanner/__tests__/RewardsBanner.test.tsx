import React from 'react'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'
import { RewardsBanner } from '..'

jest.mock('@components', () => ({ useLanguage: () => [{}, (_key: string, fallback: string) => fallback] }))

describe('RewardsBanner', () => {
  it('shows the title and a line per reward, with its value', () => {
    const { getByText, getByTestId } = renderWithProviders(
      <RewardsBanner
        points={{ message: 'You could receive :amount: points for this purchase.', value: 12 }}
        cash={{ message: 'You could receive :amount: cashback for this purchase.', value: '$1.50' }}
      />
    )
    expect(getByText("You're earning rewards with this order")).toBeTruthy()
    expect(getByTestId('reward-points')).toBeTruthy()
    expect(getByTestId('reward-cash')).toBeTruthy()
    expect(getByText('12')).toBeTruthy()
    expect(getByText('$1.50')).toBeTruthy()
  })

  it('is not drawn without a reward', () => {
    const { toJSON } = renderWithProviders(<RewardsBanner points={null} cash={null} />)
    expect(toJSON()).toBeNull()
  })
})
