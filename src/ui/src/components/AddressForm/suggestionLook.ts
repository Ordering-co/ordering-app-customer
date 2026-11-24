import { nativeBoxStyle, nativeTextStyle, themeColor, themeSpace } from '@/theme/helpers'

/**
 * The address suggestions under the field, one look for every provider
 * (Google, the legacy places input, Mapbox): a `menu` (its background, radius,
 * border and shadow) whose rows are the menu's items (height, side padding,
 * text) divided by the `list_row` divider; a second line in the row's
 * subtitle color.
 */
export const suggestionLook = (theme: any) => {
  const menu = theme.native.components.menu.base
  const row = theme.native.components.list_row.base
  const divider = row.divider ? { borderBottomWidth: row.divider.borderWidth, borderBottomColor: row.divider.borderColor } : {}
  return {
    list: {
      ...nativeBoxStyle({ background: menu.background, border: menu.border, shadow: menu.shadow }),
      borderRadius: menu.radius,
      marginTop: themeSpace(theme, 'xxs')
    },
    item: {
      minHeight: menu.item_height,
      justifyContent: 'center' as const,
      paddingHorizontal: menu.padding_x,
      paddingVertical: themeSpace(theme, 'xs'),
      ...divider
    },
    main: { ...nativeTextStyle(menu.item_text), color: themeColor(theme, 'text') },
    secondary: { ...nativeTextStyle(menu.item_text), color: row.subtitle_color }
  }
}
