import React, { useEffect, useMemo, useRef } from 'react'
import { Animated, StyleSheet, View, ViewStyle } from 'react-native'
import { useTheme } from 'styled-components/native'
import { themeMotion, themeOpacity } from '@/theme/helpers'
import { orderProgressState, orderStatusTone } from '../SingleOrderCard/orderStatus'

/**
 * An order's progress: `components.progress` of the theme (track, fill,
 * radius, height by size), with the state of the status group (D4: completed
 * → `complete`, rejected or cancelled → `canceled`). One bar for order details
 * and multi-order details. The bar of an order still going (`active`) glows
 * softly when the theme asks for it (`states.active.pulse`) and motion is on.
 */
interface Props {
  /** 0…1 (`getOrderStatus().percentage`). */
  percentage?: number
  /** The order status, for the state's colors. Without it, the resting colors. */
  status?: number | string
  size?: 'sm' | 'md' | 'lg'
  style?: ViewStyle
  testID?: string
}

export const OrderProgressBar = ({ percentage = 0, status, size = 'md', style, testID }: Props) => {
  const theme: any = useTheme()
  const stateName = status === undefined || status === null ? null : orderProgressState(orderStatusTone(status))
  const styles = useMemo(() => {
    const progress = theme.native.components.progress
    const state = stateName === null ? null : progress.variants.default.states[stateName]
    return StyleSheet.create({
      track: {
        width: '100%',
        height: progress.sizes[size].height,
        borderRadius: progress.base.radius,
        backgroundColor: state?.track ?? progress.base.track,
        overflow: 'hidden',
      },
      fill: {
        height: '100%',
        borderRadius: progress.base.radius,
        backgroundColor: state?.fill ?? progress.base.fill,
      },
    })
  }, [theme, stateName, size])

  const pulses = stateName === 'active' && theme.native.components.progress.variants.default.states.active.pulse === true
  const glow = useRef(new Animated.Value(1)).current
  useEffect(() => {
    const { duration, easing } = themeMotion(theme, 'slow')
    if (!pulses || !duration) {
      glow.setValue(1)
      return
    }
    const low = themeOpacity(theme, 'pressed')
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: low, duration, easing, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 1, duration, easing, useNativeDriver: true }),
    ]))
    loop.start()
    return () => loop.stop()
  }, [theme, pulses, glow])

  const width = `${Math.max(0, Math.min(1, percentage)) * 100}%` as const
  return (
    <View style={[styles.track, style]} testID={testID} accessibilityRole='progressbar' accessibilityValue={{ min: 0, max: 100, now: Math.round(percentage * 100) }}>
      <Animated.View style={[styles.fill, { width, opacity: glow }]} />
    </View>
  )
}
