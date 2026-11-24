import styled, { css } from 'styled-components/native'
import { spaceCss } from '@/theme/helpers'

// The multi checkout (`components.checkout`, variant `multi`): sections split
// by full-bleed `band` dividers; the order type and moment are `chip`s.
const band = (theme: any) => theme.native.components.divider.variants.band.line
const chip = (theme: any) => theme.native.components.chip
const px = (value: number) => `${value}px`

export const ChContainer = styled.View``

export const ChSection = styled.View`
  ${({ first }: any) => first ? css`
    padding-top: 0px;
  ` : css`
    padding-top: ${({ theme }: any) => px(theme.native.components.checkout.base.section_gap)};
  `}
`

/** The band between sections, out to the page sides. */
export const Band = styled.View`
  height: ${({ theme }: any) => px(band(theme).borderWidth)};
  background-color: ${({ theme }: any) => band(theme).borderColor};
  margin-top: ${({ theme, flush }: any) => flush ? '0px' : spaceCss(theme, 'md')};
  margin-horizontal: ${({ theme }: any) => px(-theme.native.tokens.layout.page_gutter)};
`

export const ChHeader = styled.View`
  justify-content: flex-start;
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

/** The order type and moment chips (the max width keeps two in a row). */
export const CHMomentWrapper = styled.View`
  background-color: ${({ theme }: any) => chip(theme).base.background};
  border-radius: ${({ theme }: any) => px(chip(theme).base.radius)};
  max-width: 240px;
  height: ${({ theme }: any) => px(chip(theme).sizes.sm.height)};
  align-items: center;
  justify-content: center;
  gap: ${({ theme }: any) => px(chip(theme).base.gap)};
  padding-horizontal: ${({ theme }: any) => px(chip(theme).sizes.sm.padding_x)};
  flex-direction: row;
`
export const ChUserDetails = styled.View`
  display: flex;
  justify-content: center;
  flex-direction: column;
  width: 100%;
  padding-bottom: ${({ theme }: any) => spaceCss(theme, 'xl')};
`
export const ChAddress = styled.View`
  width: 100%;
`
export const ChCarts = styled.View`
  display: flex;
  flex-direction: column;
  padding-bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
`
export const CartsHeader = styled.View`
  align-items: center;
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'sm')};
`
/** The empty state box (layout height). */
export const CCNotCarts = styled.View`
  height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 80%;
  margin: auto;
`
export const ChCartsTotal = styled.View`
  margin-top: ${({ theme }: any) => spaceCss(theme, 'md')};
  gap: ${({ theme }: any) => px(theme.native.components.bill.base.row_gap)};
`
export const TotalRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
`
export const RewardRow = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  margin-top: ${({ theme }: any) => spaceCss(theme, 'sm')};
`
export const CouponWrapper = styled.View`
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'xs')};
`

export const ChErrors = styled.View`
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
`
