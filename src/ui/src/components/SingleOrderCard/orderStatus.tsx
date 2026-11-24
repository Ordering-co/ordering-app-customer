import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { useTheme } from 'styled-components/native'
import { OText } from '../shared'
import { nativeTextStyle, themeColor } from '@/theme/helpers'

/**
 * Decision D4: an order's status is painted by its group, never one color for
 * all. Pending and in progress → `primary`, completed → `success`, rejected,
 * failed and cancelled → `danger`. The status → group mapping is behaviour
 * (here); the group colors are the theme's (`badge` variants, `progress` states).
 */
export type OrderStatusTone = 'primary' | 'success' | 'danger'

/** Completed: completed, delivery completed by driver, pickup completed by customer. */
const COMPLETED = [1, 11, 15]
/** Rejected, failed or cancelled. */
const STOPPED = [2, 5, 6, 10, 12, 16, 17]

export const orderStatusTone = (status: number | string | undefined | null): OrderStatusTone => {
  const code = parseInt(String(status), 10)
  if (COMPLETED.includes(code)) return 'success'
  if (STOPPED.includes(code)) return 'danger'
  return 'primary'
}

const PREPARING = [3, 4, 7, 8, 14, 18, 22, 24, 25]
const ON_THE_WAY = [9, 19, 23, 26]
const READY_FOR_PICKUP = [4, 20, 21]

export const ORDER_PROGRESS_STEPS = 4

export const orderProgressStep = (status: number | string | undefined | null, delivery = true): number => {
  const code = parseInt(String(status), 10)
  if (STOPPED.includes(code)) return -1
  if (COMPLETED.includes(code)) return ORDER_PROGRESS_STEPS - 1
  if ((delivery ? ON_THE_WAY : READY_FOR_PICKUP).includes(code)) return 2
  if (PREPARING.includes(code)) return 1
  return 0
}

/** The `progress` state of a status group (`default.states`). */
export const orderProgressState = (tone: OrderStatusTone) =>
  tone === 'success' ? 'complete' : tone === 'danger' ? 'canceled' : 'active'

interface BadgeProps {
  status: number | string
  label: string
  size?: 'sm' | 'md'
  numberOfLines?: number
  testID?: string
}

/** The status as a `badge` of its group's variant. */
export const OrderStatusBadge = ({ status, label, size = 'sm', numberOfLines = 1, testID }: BadgeProps) => {
  const theme: any = useTheme()
  const tone = orderStatusTone(status)
  const styles = useMemo(() => {
    const badge = theme.native.components.badge
    // A status is information, not an action: the tone's soft fill and its text color
    // (a solid fill reads as a selected chip or a button).
    const variant = { background: themeColor(theme, `${tone}_subtle`), color: themeColor(theme, `${tone}_text`) }
    const sized = badge.sizes[size]
    return StyleSheet.create({
      box: {
        alignSelf: 'flex-start',
        justifyContent: 'center',
        minHeight: sized.height,
        paddingHorizontal: sized.padding_x,
        borderRadius: badge.base.radius,
        backgroundColor: variant.background,
      },
      text: { ...nativeTextStyle(badge.base.text), color: variant.color },
    })
  }, [theme, tone, size])
  return (
    <View style={styles.box} testID={testID}>
      <OText style={styles.text} numberOfLines={numberOfLines}>{label}</OText>
    </View>
  )
}

/** The color of a status written as text on the page (`*_text` roles). */
export const orderStatusTextColor = (status: number | string) => {
  const tone = orderStatusTone(status)
  return tone === 'success' ? 'success_text' : tone === 'danger' ? 'danger_text' : 'primary_text'
}

