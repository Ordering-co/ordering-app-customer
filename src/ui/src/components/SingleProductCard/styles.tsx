import styled from 'styled-components/native'
import FastImage from 'react-native-fast-image'
import { nativeBoxStyle, nativeShadowStyle, spaceCss, themeColor, themePart } from '@/theme/helpers'

// `components.product_card`: the card, its photo and its texts.
const card = (theme: any) => themePart(theme, 'product_card', 'base')
const px = (value: number) => `${value}px`

/** The photo on the card's left or right (`image_position`): the row's direction. */
const imageOnLeft = (theme: any) => themePart(theme, 'product_card', 'base.image_position') === 'left'

/** The row card: the product card's box (background, border, shadow), radius and padding. */
export const AdaptedCardContainer = styled.View`
  border-radius: ${({ theme }: any) => px(card(theme).radius)};
  padding: ${({ theme }: any) => px(card(theme).padding)};
  flex-direction: ${({ theme }: any) => imageOnLeft(theme) ? 'row-reverse' : 'row'};
  align-items: center;
`

/** The box look of the product card as a View style (borders and shadows are objects). */
export const cardBoxStyle = (theme: any) => {
  const base = card(theme)
  return nativeBoxStyle({ background: base.background, border: base.border, shadow: base.shadow })
}

export const ContentContainer = styled.View`
  flex: 1;
  ${({ theme }: any) => imageOnLeft(theme) ? 'margin-left' : 'margin-right'}: ${({ theme }: any) => px(card(theme).info_gap)};
`

export const BottomRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-top: ${({ theme }: any) => px(card(theme).info_gap)};
`

export const PriceFavoriteContainer = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }: any) => spaceCss(theme, 'lg')};
`

export const TagsContainer = styled.View`
  margin: auto;
  margin-right: ${({ theme }: any) => spaceCss(theme, 'xs')};
`

/** The photo's shadow (`image_shadow`), on a box of the photo's radius around the clipped photo. */
export const productImageShadowStyle = (theme: any) => ({
  borderRadius: card(theme).image_radius,
  backgroundColor: themeColor(theme, 'surface_alt'),
  ...nativeShadowStyle(themePart(theme, 'product_card', 'base.image_shadow'))
})

/** The photo box: the card's image size and radius over the soft fill. */
export const ProductImageContainer = styled.View`
  width: ${({ theme }: any) => px(card(theme).image_size)};
  height: ${({ theme }: any) => px(card(theme).image_size)};
  border-radius: ${({ theme }: any) => px(card(theme).image_radius)};
  overflow: hidden;
  background-color: ${({ theme }: any) => themeColor(theme, 'surface_alt')};
`

export const ProductImageStyled = styled(FastImage)`
  width: 100%;
  height: 100%;
`

/** The in-cart quantity: the card's `quantity_badge` slot (a count badge). */
export const QuantityContainer = styled.View`
  position: absolute;
  right: ${({ theme }: any) => spaceCss(theme, 'sm')};
  top: ${({ theme }: any) => spaceCss(theme, 'sm')};
  z-index: 1;
`
