import React, { useMemo } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useTheme } from 'styled-components/native'

import { ChoiceMark, Icon, OText } from '../shared'
import { PressableScale } from '../shared/PressableScale'
import { WALLET_ICONS } from '../CashWallet/WalletBalance'
import FastImage from 'react-native-fast-image'
import { nativeTextStyle, themeIconSize, themeImage, themeOpacity } from '@/theme/helpers'

interface Props {
  type: 'cash' | 'credit_point'
  name: string
  /** The wallet's balance, at the row's end before the checkbox. */
  balance?: React.ReactNode
  checked?: boolean
  loading?: boolean
  disabled?: boolean
  /** Without the checkbox (a cart waiting for its payment cannot change it). */
  hideCheckbox?: boolean
  onPress?: () => void
  testID?: string
}

/**
 * A wallet of the checkout (single and multi): a `list_row` with the wallet's
 * icon (the web's: coins for cash, the heart for points), its name, its
 * balance and a checkbox at the end.
 */
export const WalletRow = ({ type, name, balance, checked, loading, disabled, hideCheckbox, onPress, testID }: Props) => {
  const theme: any = useTheme()
  const row = theme.native.components.list_row.base
  const wallet = theme.native.components.wallet_balance.base
  const styles = useMemo(() => StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: row.gap,
      paddingVertical: row.padding_y,
      backgroundColor: row.background,
      borderBottomWidth: row.divider.borderWidth,
      borderBottomColor: row.divider.borderColor
    },
    name: { ...nativeTextStyle(row.title), color: row.title_color, flex: 1 },
    balance: { ...nativeTextStyle(row.title), color: row.title_color },
    off: { opacity: themeOpacity(theme, 'disabled') }
  }), [theme, row])
  const icon = WALLET_ICONS[type]
  const image = themeImage(theme, type === 'cash' ? 'icons.wallet_cash' : 'icons.wallet_points')
  const imageSize = typeof wallet.icon_size === 'number' ? wallet.icon_size : themeIconSize(theme, wallet.icon_size)

  return (
    <PressableScale testID={testID} onPress={onPress} disabled={disabled}>
      <View style={[styles.row, disabled && styles.off]}>
        {image ? (
          <FastImage style={{ width: imageSize, height: imageSize }} source={image} objectFit='contain' />
        ) : (
          <Icon
            set={icon?.set}
            name={icon?.name ?? 'wallet-outline'}
            size={wallet.icon_size}
            color={type === 'cash' ? wallet.cash_icon_color : wallet.points_icon_color}
          />
        )}
        <OText style={styles.name} numberOfLines={2} ellipsizeMode='tail'>{name}</OText>
        {!!balance && <OText style={styles.balance}>{balance}</OText>}
        {!hideCheckbox && (
          loading
            ? <ActivityIndicator size='small' color={theme.native.components.spinner.base.color} />
            : (
              <ChoiceMark kind='check' checked={!!checked} />
            )
        )}
      </View>
    </PressableScale>
  )
}

export default WalletRow
