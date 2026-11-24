import { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { useTheme } from 'styled-components/native'
import { nativeBoxStyle, themeSpace } from '@/theme/helpers'

/**
 * The loading card of the order lists: the theme's `card` box with the
 * `skeleton` blocks (color and radius), `space.md` inside and `space.lg` below.
 */
export const useSkeletonCard = () => {
  const theme: any = useTheme()
  return useMemo(() => {
    const card = theme.native.components.card.base
    const skeleton = theme.native.components.skeleton.base
    const styles = StyleSheet.create({
      list: { marginTop: themeSpace(theme, 'lg') },
      listUnderTitle: { marginTop: 0 },
      card: {
        ...nativeBoxStyle(card),
        borderRadius: card.radius,
        padding: themeSpace(theme, 'md'),
        marginBottom: themeSpace(theme, 'lg'),
      },
      row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
      fullRow: { width: '100%', flexDirection: 'row' },
      line: { borderRadius: skeleton.radius },
      lineSpaced: { borderRadius: skeleton.radius, marginBottom: themeSpace(theme, 'sm') },
      lineSpacedMd: { borderRadius: skeleton.radius, marginBottom: themeSpace(theme, 'md') },
      lineLast: { borderRadius: skeleton.radius, marginBottom: 0 },
      inner: { marginBottom: 0 },
    })
    return { styles, color: skeleton.color as string }
  }, [theme])
}
