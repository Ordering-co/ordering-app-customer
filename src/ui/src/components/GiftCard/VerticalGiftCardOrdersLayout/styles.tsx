import styled from 'styled-components/native';
import { nativeShadowStyle, spaceCss, themeColor } from '@/theme/helpers'

// Each gift card order is a `components.gift_card` box (radius, shadow).
const look = (theme: any) => theme.native.components.gift_card.base
const px = (value: number) => `${value}px`

export const ProductsListContainer = styled.View`
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
`
export const WrappButton = styled.View`
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'xl')};
`
export const SkeletonTitle = styled.View`
  margin-vertical: ${({ theme }: any) => spaceCss(theme, 'md')};
`
export const SingleGiftCardWrapper = styled.View.attrs(({ theme }: any) => ({
  style: nativeShadowStyle(look(theme).shadow)
}))`
  background-color: ${({ theme }: any) => themeColor(theme, 'surface')};
  border-radius: ${({ theme }: any) => px(look(theme).radius)};
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
`
