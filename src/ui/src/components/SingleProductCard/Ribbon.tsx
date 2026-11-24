import React, { useMemo } from 'react'
import { StyleProp, View, ViewStyle } from 'react-native'
import { useTheme } from 'styled-components/native'
import { onColor } from '@orderingco/ordering-theme-engine/colors'

import OText from '../shared/OText'
import { nativeTextStyle, themeColor, themePart, themeRadius } from '@/theme/helpers'
import { shape } from '../../utils'

interface Props {
  /** The merchant's ribbon from the API: `{ enabled, text, color, shape }`. */
  ribbon?: { enabled?: boolean, text?: string, color?: string, shape?: string } | null
  style?: StyleProp<ViewStyle>
}

/**
 * The merchant ribbon of a business, a category or a product: the theme's
 * `ribbon` component (text, padding, radius). Its fill is the merchant's color
 * from the API (the theme's primary without one); the text takes the light or
 * dark text color that reads over it.
 */
export const Ribbon = ({ ribbon, style }: Props) => {
  const theme: any = useTheme()

  const styles = useMemo(() => {
    const base = themePart(theme, 'ribbon', 'base')
    const background = ribbon?.color || themeColor(theme, 'primary')
    const radius = ribbon?.shape === shape.capsuleShape
      ? themeRadius(theme, 'full', { fixed: true })
      : ribbon?.shape === shape.rectangleRound ? base.radius : 0
    return {
      box: {
        backgroundColor: background,
        paddingHorizontal: base.padding_x,
        paddingVertical: base.padding_y,
        borderRadius: radius,
        maxWidth: 180
      },
      text: {
        ...nativeTextStyle(base.text),
        color: onColor(background, themeColor(theme, 'on_inverse'), themeColor(theme, 'text')) ?? themeColor(theme, 'on_primary')
      }
    }
  }, [theme, ribbon?.color, ribbon?.shape])

  if (!ribbon?.enabled) return null

  return (
    <View style={[styles.box, style]}>
      <OText style={styles.text} numberOfLines={2} ellipsizeMode='tail'>
        {ribbon?.text}
      </OText>
    </View>
  )
}
