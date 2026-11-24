import React, { useEffect, useRef } from 'react'
import { Animated } from 'react-native'
import { useTheme } from 'styled-components/native'
import { themeMotion } from '@/theme/helpers'

/** Fades an item in, one after the other, at the theme's slow motion. */
export const AnimatedItem = (props: any) => {
  const { index, item } = props
  const theme: any = useTheme()
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const { duration, easing } = themeMotion(theme, 'slow')
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      easing,
      delay: index * duration,
      useNativeDriver: true
    }).start()
  }, [opacity, index, theme])

  return (
    <Animated.View style={{ opacity }}>
      {item}
    </Animated.View>
  )
}
