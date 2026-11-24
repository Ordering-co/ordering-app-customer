import React from 'react'
import { StyleSheet } from 'react-native'

import { OptionalBadge } from '../OptionalBadge'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'
import { defaultAppTheme } from '@/theme/engine'

jest.mock('@components', () => require('../../../../../../jest/helpers/mockOrdering'))
jest.mock('@ui', () => ({ OText: require('../../shared/OText').default }))

describe('OptionalBadge', () => {
  it('says Optional in the neutral badge of the theme, at its small size', () => {
    const badge = defaultAppTheme().native.components.badge
    const { getByTestId, getByText } = renderWithProviders(<OptionalBadge />)
    expect(StyleSheet.flatten(getByTestId('optional-badge').props.style)).toMatchObject({
      minHeight: badge.sizes.sm.height,
      paddingHorizontal: badge.sizes.sm.padding_x,
      backgroundColor: badge.variants.neutral.background
    })
    expect(StyleSheet.flatten(getByText('Optional').props.style).color).toBe(badge.variants.neutral.color)
  })

  it('is translated (OPTIONAL)', () => {
    const { useLanguage } = require('@components')
    useLanguage.mockReturnValueOnce([{}, (key: string, fallback: string) => (key === 'OPTIONAL' ? 'Opcional' : fallback)])
    expect(renderWithProviders(<OptionalBadge />).getByText('Opcional')).toBeTruthy()
  })
})
