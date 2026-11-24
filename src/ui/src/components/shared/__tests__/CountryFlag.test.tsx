/**
 * CountryFlag (src/ui/src/components/shared/CountryFlag.tsx): the emoji of
 * an ISO code, drawn at the size it is given, and nothing for a bad code.
 */
import React from 'react'
import { StyleSheet } from 'react-native'
import { CountryFlag, flagEmoji } from '../CountryFlag'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

describe('CountryFlag', () => {
  it('turns an ISO code into its regional indicators', () => {
    expect(flagEmoji('us')).toBe('\u{1F1FA}\u{1F1F8}')
    expect(flagEmoji('GB')).toBe('\u{1F1EC}\u{1F1E7}')
    expect(flagEmoji(' mx ')).toBe('\u{1F1F2}\u{1F1FD}')
    expect(flagEmoji('usa')).toBe('')
    expect(flagEmoji('1a')).toBe('')
    expect(flagEmoji(undefined)).toBe('')
  })

  it('draws the flag at the given size', () => {
    const { getByLabelText } = renderWithProviders(<CountryFlag isoCode="es" size={16} />)
    const flag = getByLabelText('ES')
    expect(flag.props.children).toBe('\u{1F1EA}\u{1F1F8}')
    expect(StyleSheet.flatten(flag.props.style)).toMatchObject({ fontSize: 16, lineHeight: 20 })
  })

  it('draws nothing without a valid code', () => {
    const { toJSON } = renderWithProviders(<CountryFlag isoCode="" size={16} />)
    expect(toJSON()).toBeNull()
  })
})
