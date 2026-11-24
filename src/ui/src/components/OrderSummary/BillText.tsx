import React from 'react'
import { useTheme } from 'styled-components/native'
import { nativeTextStyle, themeOpacity, themePart } from '@/theme/helpers'
import OText from '../shared/OText'
import Icon from '../shared/Icon'
import { BillIconButton, BillIconMark } from './styles'

// 16 pt icon + 2 × 14 = a 44 pt touch target.
/** The touch area around a bill row's small controls (info, remove, the taxes toggle): up to a 44 pt target. */
export const BILL_HIT_SLOP = { top: 14, bottom: 14, left: 14, right: 14 }
const hitSlop = BILL_HIT_SLOP

/**
 * A text of the bill (`components.bill`): a row (`row`, `row_color`) or the
 * total (`total`, `total_color`). One look for every bill of the app (cart,
 * checkout, all-carts totals). A `weight` keeps its own font file.
 */
export const BillText = ({ total = false, weight, color, style, ...rest }: any) => {
  const theme: any = useTheme()
  const bill = themePart(theme, 'bill', 'base')
  const look = nativeTextStyle(total ? bill.total : bill.row)
  // A kept weight is painted by OText with that weight's file: only the size goes in the style.
  const size = Object.fromEntries(Object.entries(look).filter(([key]) => key !== 'fontFamily'))
  return (
    <OText
      {...rest}
      weight={weight}
      color={color ?? (total ? bill.total_color : bill.row_color)}
      style={[weight === undefined ? look : size, style]}
    />
  )
}

/** The info button of a bill row (tax, fee or offer detail). */
export const BillInfoButton = ({ onPress, accessibilityLabel }: { onPress: () => void, accessibilityLabel?: string }) => {
  const theme: any = useTheme()
  return (
    <BillIconButton
      onPress={onPress}
      hitSlop={hitSlop}
      activeOpacity={themeOpacity(theme, 'pressed')}
      accessibilityRole='button'
      accessibilityLabel={accessibilityLabel}
    >
      <Icon name='information-circle-outline' size='sm' color='primary' />
    </BillIconButton>
  )
}

/** The remove mark of an applied offer (inside its confirm alert). */
export const BillRemoveIcon = () => (
  <BillIconMark>
    <Icon name='close-circle' size='sm' color='text_muted' />
  </BillIconMark>
)
