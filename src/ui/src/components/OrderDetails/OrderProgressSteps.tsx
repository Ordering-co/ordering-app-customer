import React, { useMemo } from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'
import { useTheme } from 'styled-components/native'
import { useLanguage } from '@components'
import OText from '../shared/OText'
import { themeSpace } from '@/theme/helpers'
import { orderProgressState, orderProgressStep, orderStatusTone } from '../SingleOrderCard/orderStatus'

interface Props {
  status?: number | string
  delivery?: boolean
  size?: 'sm' | 'md' | 'lg'
  style?: ViewStyle
  testID?: string
}

export const OrderProgressSteps = ({ status, delivery = true, size = 'md', style, testID }: Props) => {
  const theme: any = useTheme()
  const [, t] = useLanguage()
  const stateName = orderProgressState(orderStatusTone(status))
  const current = orderProgressStep(status, delivery)
  const styles = useMemo(() => {
    const progress = theme.native.components.progress
    const state = progress.variants.default.states[stateName]
    return StyleSheet.create({
      box: { width: '100%', gap: themeSpace(theme, 'xs') },
      row: { flexDirection: 'row', gap: themeSpace(theme, 'xs') },
      track: progress.base.border?.borderWidth > 0
        ? { ...progress.base.border, borderRadius: progress.base.radius, padding: themeSpace(theme, 'xs') }
        : {},
      step: { flex: 1 },
      segment: {
        flex: 1,
        height: progress.sizes[size].height,
        borderRadius: progress.base.radius,
        backgroundColor: state?.track ?? progress.base.track
      },
      reached: { backgroundColor: state?.fill ?? progress.base.fill },
      label: { textAlign: 'center' }
    })
  }, [theme, stateName, size])

  const steps = [
    t('ORDER_CONFIRMED', 'Confirmed'),
    t('ORDER_PREPARING', 'Preparing'),
    delivery ? t('ORDER_ON_THE_WAY', 'On the way') : t('ORDER_READY_FOR_PICKUP', 'Ready for pickup'),
    delivery ? t('ORDER_DELIVERED', 'Delivered') : t('COMPLETED', 'Completed')
  ]

  return (
    <View
      style={[styles.box, style]}
      testID={testID}
      accessibilityRole='progressbar'
      accessibilityValue={{ min: 0, max: steps.length, now: current + 1, text: steps[current] }}
    >
      <View testID='order-steps-track' style={[styles.row, styles.track]}>
        {steps.map((label, index) => (
          <View key={label} testID={`order-step-${index}`} style={[styles.segment, index <= current && styles.reached]} />
        ))}
      </View>
      <View style={styles.row}>
        {steps.map((label, index) => (
          <View key={label} style={styles.step}>
            <OText
              preset='caption'
              color={index === current ? 'primary_text' : 'text_muted'}
              weight={index === current ? 700 : undefined}
              style={styles.label}
              numberOfLines={2}
            >
              {label}
            </OText>
          </View>
        ))}
      </View>
    </View>
  )
}
