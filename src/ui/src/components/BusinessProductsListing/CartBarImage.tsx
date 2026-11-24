import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { useTheme } from 'styled-components/native'
import FastImage from 'react-native-fast-image'
import OText from '../shared/OText'
import { nativeTextStyle, themeControlHeight, themeImage, themeSpace } from '@/theme/helpers'

export const CartBarImage = ({ count = 0, image: imageKey = 'icons.cart_bar', size: customSize }: { count?: number, image?: string, size?: number }) => {
  const theme: any = useTheme()
  const image = useMemo(() => themeImage(theme, imageKey), [theme, imageKey])
  const styles = useMemo(() => {
    const badge = theme.native.components.badge
    const size = customSize ?? themeControlHeight(theme, 'lg')
    return StyleSheet.create({
      box: { width: size, height: size },
      badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        minWidth: badge.sizes.sm.height,
        height: badge.sizes.sm.height,
        borderRadius: badge.shapes.count.radius,
        backgroundColor: badge.variants.primary.background,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: themeSpace(theme, 'xxs')
      },
      count: { ...nativeTextStyle(badge.base.text), color: badge.variants.primary.color }
    })
  }, [theme, customSize])

  if (!image) return null

  return (
    <View testID='cart-bar-image' style={styles.box}>
      <FastImage style={styles.box} source={image} objectFit='contain' />
      {count > 0 && (
        <View style={styles.badge}>
          <OText style={styles.count}>{count > 99 ? '99+' : count}</OText>
        </View>
      )}
    </View>
  )
}
