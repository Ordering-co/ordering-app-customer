import React from 'react'
import { StyleProp, TextStyle } from 'react-native'
import { FlagEmoji } from './styles'

/**
 * A country's flag as its emoji (the two regional indicators of its ISO
 * 3166 code), in place of react-native-country-flag, which downloaded a PNG
 * from flagcdn.com for every flag: it draws offline, at once, in the system's
 * flag set. `size` is the flag's height (an icon size of the theme).
 */
const REGIONAL_INDICATOR_A = 0x1f1e6

export const flagEmoji = (isoCode?: string | null): string => {
  const code = String(isoCode ?? '').trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(code)) return ''
  return String.fromCodePoint(...[...code].map(letter => REGIONAL_INDICATOR_A + letter.charCodeAt(0) - 65))
}

type CountryFlagProps = {
  isoCode?: string | null
  size: number
  style?: StyleProp<TextStyle>
}

export const CountryFlag = ({ isoCode, size, style }: CountryFlagProps) => {
  const emoji = flagEmoji(isoCode)
  if (!emoji) return null
  return (
    <FlagEmoji size={size} style={style} accessibilityLabel={String(isoCode).toUpperCase()} allowFontScaling={false}>
      {emoji}
    </FlagEmoji>
  )
}

export default CountryFlag
