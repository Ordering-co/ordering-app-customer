import styled from 'styled-components/native';
import { radiusCss, spaceCss, themeColor, themePart } from '@/theme/helpers';

const px = (value: number) => `${value}px`
const bill = (theme: any) => themePart(theme, 'bill', 'base')
const card = (theme: any) => themePart(theme, 'card', 'base')

export const OSContainer = styled.View`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
`

export const OSProductList = styled.View``

// The bill box: a muted card (`card` padding and radius on `surface_alt`).
export const OSBill = styled.View`
  background-color: ${({ theme }: any) => themeColor(theme, 'surface_alt')};
  border-radius: ${({ theme }: any) => px(card(theme).radius)};
  padding: ${({ theme }: any) => px(card(theme).padding)};
  /* Every row leaves \`row_gap\` under it: the box takes it off its bottom, so its
     padding reads the same on every side. */
  padding-bottom: ${({ theme }: any) => px(Math.max(0, card(theme).padding - bill(theme).row_gap))};
  margin-top: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

// A bill row: `bill.row_gap` below it.
export const OSTable = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-bottom: ${({ theme }: any) => px(bill(theme).row_gap)};
`

// The total: an item divider above it.
export const OSTotalRule = styled.View`
  border-top-width: ${({ theme }: any) => px(themePart(theme, 'divider', 'variants.item.line').borderWidth)};
  border-top-color: ${({ theme }: any) => themePart(theme, 'divider', 'variants.item.line').borderColor};
  margin-top: ${({ theme }: any) => spaceCss(theme, 'md')};
  padding-top: ${({ theme }: any) => spaceCss(theme, 'md')};
`

export const OSCoupon = styled.View`
  width: 100%;
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'xs')};
`

export const OSRow = styled.View`
  flex-direction: row;
  align-items: center;
  overflow: hidden;
  width: 80%;
`

export const TaxesFeesDetail = styled.View`
  padding-left: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const BillToggle = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
`

export const BillToggleIcon = styled.View`
  margin-left: ${({ theme }: any) => spaceCss(theme, 'xs')};
  transform: ${(props: any) => props.open ? 'rotate(180deg)' : 'rotate(0deg)'};
`

export const BillIconButton = styled.TouchableOpacity`
  margin-left: ${({ theme }: any) => spaceCss(theme, 'xxs')};
  flex-shrink: 0;
`

export const BillIconMark = styled.View`
  margin-left: ${({ theme }: any) => spaceCss(theme, 'xxs')};
`

export const BillStrikeRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }: any) => spaceCss(theme, 'xs')};
`

export const BillLabelRow = styled.View`
  flex-direction: row;
  align-items: center;
  flex: 1;
`

export const ClearCartWrapper = styled.View`
  width: 100%;
  flex-direction: row;
  justify-content: center;
`

export const ClearCartButton = styled.View`
  background-color: ${({ theme }: any) => themeColor(theme, 'danger_subtle')};
  padding: ${({ theme }: any) => spaceCss(theme, 'sm')};
  border-radius: ${({ theme }: any) => radiusCss(theme, 'md')};
  margin-top: ${({ theme }: any) => spaceCss(theme, 'lg')};
  justify-content: center;
  flex-direction: row;
  align-items: center;
  align-self: flex-start;
`

export const ClearCartSlot = styled.View`
  margin-top: ${({ theme }: any) => spaceCss(theme, 'lg')};
  align-self: flex-start;
`

// The loyalty reward promo: a `card`.
/** The loyalty notice: the `rewards` banner (background, radius, padding; its shadow is set by the screen). */
export const CommentsBox = styled.View`
  width: 100%;
  margin-top: ${({ theme }: any) => spaceCss(theme, 'lg')};
`

export const CommentsSpinner = styled.View`
  position: absolute;
  right: ${({ theme }: any) => spaceCss(theme, 'lg')};
  top: ${({ theme }: any) => spaceCss(theme, 'sm')};
`
