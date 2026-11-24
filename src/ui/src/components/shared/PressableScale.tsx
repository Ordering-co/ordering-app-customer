import React from 'react'
import { Pressable, StyleProp, ViewStyle } from 'react-native'
import { useTheme } from 'styled-components/native'
import { themeOpacity } from '@/theme/helpers'

type PressableScaleProps = {
  children: React.ReactNode
  onPress?: () => void
  testID?: string
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

/**
 * The one press feedback of what can be tapped (cards, rows): the theme's
 * pressed opacity (`opacity.pressed`). `CardAnimation` is the same feedback.
 */
export const PressableScale = ({ children, onPress, testID, disabled, style }: PressableScaleProps) => {
  const theme: any = useTheme()
  const pressedOpacity = themeOpacity(theme, 'pressed')
  return (
    <Pressable
      testID={testID}
      disabled={disabled || !onPress}
      onPress={onPress}
      style={({ pressed }) => [style, pressed && { opacity: pressedOpacity }]}
    >
      {children}
    </Pressable>
  )
}
