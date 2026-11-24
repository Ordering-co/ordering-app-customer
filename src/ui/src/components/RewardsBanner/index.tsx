import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { useTheme } from 'styled-components/native'
import { useLanguage } from '@components'
import { nativeBoxStyle, themeColor, themeSpace } from '@/theme/helpers'
import OText from '../shared/OText'
import Icon from '../shared/Icon'

interface Reward {
  /** The message with `:amount:` where the value goes. */
  message: string
  value: number | string
}

interface Props {
  /** The loyalty points this order earns (a trophy), when there are any. */
  points?: Reward | null
  /** The cashback this order earns (cash), when there is any. */
  cash?: Reward | null
  testID?: string
}

/**
 * What this order earns, as the web's checkout shows it: the banner's
 * `rewards` variant (`components.banner`: background, radius, padding,
 * shadow), a title, and a reward per line, centered: its icon at the theme's
 * large icon size in the rewards color (`rating`), the message in the body
 * text and its value, inline, in the label text and the primary color.
 */
export const RewardsBanner = ({ points, cash, testID }: Props) => {
  const theme: any = useTheme()
  const [, t] = useLanguage()
  const styles = useMemo(() => {
    const banner = theme.native.components.banner
    const look = banner.variants.rewards
    return StyleSheet.create({
      container: {
        ...nativeBoxStyle({ background: look.background, border: banner.base.border, shadow: look.shadow }),
        borderRadius: banner.base.radius,
        padding: look.padding,
        gap: banner.base.gap,
        marginTop: themeSpace(theme, 'lg'),
        marginBottom: themeSpace(theme, 'sm')
      },
      reward: { alignItems: 'center', gap: themeSpace(theme, 'sm') },
      message: { textAlign: 'center' }
    })
  }, [theme])

  const rewards = [
    points && { key: 'points', icon: <Icon set='mci' name='trophy' size='lg' color='rating' />, ...points },
    cash && { key: 'cash', icon: <Icon name='cash-outline' size='lg' color={theme.native.components.wallet_balance.base.cash_icon_color} />, ...cash }
  ].filter(Boolean) as Array<Reward & { key: string, icon: React.ReactNode }>
  if (!rewards.length) return null

  return (
    <View style={styles.container} testID={testID}>
      <OText preset='label' color='text'>
        {t('REWARDS_ON_THIS_ORDER', "You're earning rewards with this order")}
      </OText>
      {rewards.map(({ key, icon, message, value }) => {
        const [start, end] = message.split(':amount:')
        return (
          <View key={key} style={styles.reward} testID={`reward-${key}`}>
            {icon}
            <OText preset='body' color='text' style={styles.message}>
              {start}
              <OText preset='label' style={{ color: themeColor(theme, 'primary_text') }}>{value}</OText>
              {end}
            </OText>
          </View>
        )
      })}
    </View>
  )
}
