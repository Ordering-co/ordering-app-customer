import { StyleSheet } from 'react-native'
import { nativeBoxStyle, themeGutter, themeSpace } from '@/theme/helpers'

/**
 * The screen header: `components.header` (background, bottom border, shadow,
 * bar height, title, logo). Built with the theme, never at module level.
 */
export const navBarStyles = (theme: any) => {
  const header = theme.native.components.header.base
  return StyleSheet.create({
    wrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: header.height,
      // The bar's content sits on the page sides, as the screen's.
      paddingHorizontal: themeGutter(theme),
      backgroundColor: header.background,
      ...header.border_bottom,
      ...nativeBoxStyle({ shadow: header.shadow })
    },
    // After the back button, the title keeps the same distance on every header.
    afterBack: {
      marginLeft: themeSpace(theme, 'sm')
    },
    titleWrapper: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start'
    },
    titleBlock: {
      justifyContent: 'center'
    },
    // The title spans the bar, so its alignment (start, center, end) shows.
    titleFill: { flex: 1 },
    logo: {
      width: '100%',
      maxWidth: header.logo_width,
      height: header.logo_height
    },
    // Where a logo-only bar places its logo.
    logoRow: {
      justifyContent: ({ left: 'flex-start', center: 'center', right: 'flex-end' } as const)[header.logo_position as 'left' | 'center' | 'right']
    },
    right: {
      flexShrink: 0,
      marginLeft: themeSpace(theme, 'sm')
    }
  })
}
