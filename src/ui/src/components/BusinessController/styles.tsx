import { StyleSheet } from 'react-native'
import { nativeBoxStyle, nativeShadowStyle, nativeTextStyle, themeSpace } from '@/theme/helpers'

/**
 * The styles of a business card, from `components.business_card` (both
 * variants: `default`, vertical with the header image, and `compact`, the row
 * of search, the map and the orders tab). Built inside the component,
 * memoized on the theme.
 */
export const businessCardStyles = (theme: any) => {
  const card = theme.native.components.business_card.base
  const tag = theme.native.components.business_card.slots.tag
  const badge = theme.native.components.badge
  const rating = theme.native.components.rating.base
  const box = { ...nativeBoxStyle(card), borderRadius: card.radius }
  const innerRadius = Math.max(0, card.radius - (card.border?.borderWidth ?? 0))

  return StyleSheet.create({
    card: {
      ...box,
      marginVertical: themeSpace(theme, 'sm')
    },
    compact: {
      ...box,
      padding: card.padding,
      gap: card.padding
    },
    // The photo sits inside the card's border: its corners are the box's inner radius.
    hero: {
      borderTopLeftRadius: innerRadius,
      borderTopRightRadius: innerRadius,
      overflow: 'hidden',
      backgroundColor: card.header_background
    },
    cover: {
      height: card.header_height
    },
    coverListing: {
      height: card.header_height_listing
    },
    body: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: card.padding,
      gap: card.padding
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: card.padding
    },
    logo: {
      width: card.logo_size,
      height: card.logo_size,
      borderRadius: card.radius,
      backgroundColor: card.background,
      ...nativeShadowStyle(card.logo_shadow)
    },
    info: {
      flex: 1,
      gap: themeSpace(theme, 'xxs')
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: themeSpace(theme, 'sm')
    },
    name: {
      ...nativeTextStyle(card.name),
      color: card.name_color,
      flex: 1
    },
    meta: {
      ...nativeTextStyle(card.meta),
      color: card.meta_color
    },
    closed: {
      ...nativeTextStyle(card.meta),
      color: theme.native.tokens.color.danger_text
    },
    bullet: {
      ...nativeTextStyle(card.meta),
      color: card.bullet_color
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: themeSpace(theme, 'xs')
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: themeSpace(theme, 'xs')
    },
    rating: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: rating.gap
    },
    tags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: themeSpace(theme, 'xs')
    },
    tagsOnImage: {
      position: 'absolute',
      left: card.padding,
      bottom: card.padding
    },
    tag: {
      justifyContent: 'center',
      height: badge.sizes[tag.size].height,
      paddingHorizontal: badge.sizes[tag.size].padding_x,
      borderRadius: badge.base.radius,
      backgroundColor: badge.variants[tag.variant].background
    },
    tagText: {
      ...nativeTextStyle(badge.base.text),
      color: badge.variants[tag.variant].color
    },
    // The merchant ribbon never covers the name or leaves the card: in the text column
    // above the name (it takes its own room), or, over the photo, inset by the card's
    // padding so it clears the corner's radius and the border.
    ribbon: {
      alignSelf: 'flex-start'
    },
    ribbonOnImage: {
      position: 'absolute',
      zIndex: 1,
      top: card.padding,
      right: card.padding
    }
  })
}
