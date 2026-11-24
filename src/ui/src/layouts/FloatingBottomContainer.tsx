import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { useTheme } from 'styled-components/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { nativeShadowStyle, themeBottomSpace, themeGutter } from '@/theme/helpers'

/**
 * The bar pinned to the bottom of a screen with its main action:
 * `components.bottom_bar` (background, top border, shadow, padding), above the
 * bottom safe-area inset.
 */
export const FloatingBottomContainer = ({ children }: { children?: React.ReactNode }) => {
  const theme: any = useTheme()
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => {
    const bar = theme.native.components.bottom_bar.base
    const top = bar.border_top
    return StyleSheet.create({
      bar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: bar.padding,
        // Its action on the page sides, as every bottom bar's (place order, add to cart).
        paddingHorizontal: themeGutter(theme),
        paddingBottom: bar.padding + themeBottomSpace(theme, insets.bottom),
        backgroundColor: bar.background,
        ...(top.borderWidth ? { borderTopWidth: top.borderWidth, borderStyle: top.borderStyle, borderTopColor: top.borderColor } : {}),
        ...nativeShadowStyle(bar.shadow),
      },
    })
  }, [theme, insets.bottom])
  return <View style={styles.bar}>{children}</View>
}
