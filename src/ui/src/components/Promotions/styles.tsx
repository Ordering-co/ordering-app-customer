import styled from 'styled-components/native'
import { gutterCss, radiusCss, spaceCss, themeColor } from '@/theme/helpers'

const px = (value: number) => `${value}px`
// `components.offer_card`: the offer's box, its code and divider.
const offer = (theme: any) => theme.native.components.offer_card.base

export const PromotionsContainer = styled.View`
  flex: 1;
  width: 100%;
  margin-top: ${({ theme }: any) => spaceCss(theme, 'lg')};
`

export const WrapperSingleOffer = styled.View`
  flex-direction: column;
  width: 100%;
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
  border-radius: ${({ theme }: any) => px(offer(theme).radius)};
  padding: ${({ theme }: any) => px(offer(theme).padding)};
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
  background-color: ${({ theme }: any) => offer(theme).background};
`

export const SingleOfferContainer = styled.View`
  width: 100%;
`

export const OfferInformation = styled.View`
  justify-content: space-between;
`

export const OfferTitleRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const SearchBarContainer = styled.View`
  width: 100%;
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
`

export const SingleBusinessOffer = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'sm')};
  padding: ${({ theme }: any) => spaceCss(theme, 'md')};
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
  border-radius: ${({ theme }: any) => px(offer(theme).radius)};
  background-color: ${({ theme }: any) => offer(theme).background};
`

export const OfferData = styled.View`
  align-items: stretch;
  width: 100%;
`

export const OfferHero = styled.View`
  align-items: center;
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'md')};
  gap: ${({ theme }: any) => spaceCss(theme, 'xs')};
`

export const OfferValueChip = styled.View`
  align-self: center;
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'sm')};
  padding-horizontal: ${({ theme }: any) => spaceCss(theme, 'md')};
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'md')};
  border-radius: ${({ theme }: any) => px(offer(theme).code_radius)};
  background-color: ${({ theme }: any) => offer(theme).code_background};
`

export const Code = styled.View`
  width: 100%;
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const CouponHighlight = styled.View`
  width: 100%;
  align-items: center;
  padding: ${({ theme }: any) => spaceCss(theme, 'md')};
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
  border-radius: ${({ theme }: any) => px(offer(theme).code_radius)};
  background-color: ${({ theme }: any) => offer(theme).code_background};
`

export const CouponCodeBadge = styled.View`
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'md')};
  padding-horizontal: ${({ theme }: any) => spaceCss(theme, 'lg')};
  min-width: 80%;
  align-items: center;
  border-radius: ${({ theme }: any) => px(offer(theme).code_radius)};
  background-color: ${({ theme }: any) => themeColor(theme, 'surface')};
`

export const OfferDescription = styled.View`
  width: 100%;
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'md')};
  padding: ${({ theme }: any) => spaceCss(theme, 'md')};
  border-radius: ${({ theme }: any) => radiusCss(theme, 'md')};
  background-color: ${({ theme }: any) => themeColor(theme, 'surface_alt')};
`

export const OfferMetaList = styled.View`
  width: 100%;
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'sm')};
  padding-horizontal: ${({ theme }: any) => spaceCss(theme, 'md')};
  border-radius: ${({ theme }: any) => radiusCss(theme, 'md')};
  background-color: ${({ theme }: any) => themeColor(theme, 'surface_alt')};
`

export const OfferMetaRow = styled.View<{ $isLast?: boolean }>`
  width: 100%;
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'sm')};
  border-bottom-width: ${({ theme, $isLast }: any) => $isLast ? '0px' : px(theme.native.tokens.border.thin)};
  border-bottom-color: ${({ theme }: any) => themeColor(theme, 'border')};
`

export const BusinessInfo = styled.View`
  flex: 1;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
`
