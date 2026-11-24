import styled from 'styled-components/native'
import { nativeShadowStyle, spaceCss, themeColor } from '@/theme/helpers'

// Each gift card on sale is a `components.gift_card` box (radius, shadow).
const look = (theme: any) => theme.native.components.gift_card.base
const px = (value: number) => `${value}px`

export const Container = styled.View`
  width: 100%;
`

export const GiftCardItem = styled.View.attrs(({ theme }: any) => ({
  style: nativeShadowStyle(look(theme).shadow)
}))`
  padding: ${({ theme }: any) => spaceCss(theme, 'sm')};
  background-color: ${({ theme }: any) => themeColor(theme, 'surface')};
  border-radius: ${({ theme }: any) => px(look(theme).radius)};
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const GiftCardHeader = styled.View`
  flex-direction: row;
  align-items: flex-start;
`

export const GiftCardCopy = styled.View`
  flex: 1;
  margin-left: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const PurchaseButtonWrap = styled.View`
  align-self: stretch;
  margin-top: ${({ theme }: any) => spaceCss(theme, 'sm')};
`
