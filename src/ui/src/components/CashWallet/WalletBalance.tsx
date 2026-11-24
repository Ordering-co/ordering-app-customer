import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { useTheme } from 'styled-components/native'
import { nativeTextStyle, themeSpace } from '@/theme/helpers'
import { OText } from '../shared'
import Icon from '../shared/Icon'
import { BalanceElement } from './styles'

/** A wallet's glyph, the web's: the coins for cash, the heart for loyalty points. */
export const WALLET_ICONS = {
  cash: { set: 'fa5' as const, name: 'coins' },
  credit_point: { set: 'ion' as const, name: 'heart' }
}

/**
 * The balance row of a wallet (`components.wallet_balance`): its label, and
 * the amount after the wallet's icon (`icon_size`; `cash_icon_color` or
 * `points_icon_color`).
 */
export const WalletBalance = ({ label, amount, type }: { label: React.ReactNode, amount: React.ReactNode, type: 'cash' | 'credit_point' }) => {
  const theme: any = useTheme()
  const look = theme.native.components.wallet_balance.base
  const styles = useMemo(() => StyleSheet.create({
    label: { ...nativeTextStyle(look.label), color: look.label_color },
    amount: { ...nativeTextStyle(look.amount), color: look.amount_color },
    value: { flexDirection: 'row', alignItems: 'center', gap: themeSpace(theme, 'xs') }
  }), [theme, look])
  const icon = WALLET_ICONS[type]
  return (
    <BalanceElement>
      <OText style={styles.label}>{label}</OText>
      <View style={styles.value}>
        <Icon
          set={icon.set}
          name={icon.name}
          size={look.icon_size}
          color={type === 'cash' ? look.cash_icon_color : look.points_icon_color}
        />
        <OText style={styles.amount}>{amount}</OText>
      </View>
    </BalanceElement>
  )
}
