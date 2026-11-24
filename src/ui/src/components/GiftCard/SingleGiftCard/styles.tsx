import styled from 'styled-components/native';
import { borderCss, spaceCss } from '@/theme/helpers'

export const SingleGiftCardContainer = styled.View`
  flex-direction: row;
  align-items: center;
  padding: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const GiftCardInfoContainer = styled.View`
  flex: 1;
`

/** The product image box (70 × 70: the image's own size). */
export const LogoContainer = styled.View`
  width: 70px;
  height: 70px;
  border-radius: ${({ theme }: any) => `${theme.native.components.product_card.base.image_radius}px`};
  ${({ theme }: any) => borderCss(theme, 'thin', 'border')}
  align-items: center;
  justify-content: center;
`

export const SingleGiftCardPriceContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 70%;
  margin-top: ${({ theme }: any) => spaceCss(theme, 'xs')};
`

export const SkeletonRow = styled.View`
  flex-direction: row;
  padding: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const SkeletonImage = styled.View`
  width: 64px;
  margin-right: ${({ theme }: any) => spaceCss(theme, 'md')};
`

export const SkeletonLines = styled.View`
  flex: 1;
  padding-top: ${({ theme }: any) => spaceCss(theme, 'xs')};
`
