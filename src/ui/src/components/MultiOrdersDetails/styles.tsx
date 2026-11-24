import styled from 'styled-components/native'
import { gutterCss, spaceCss } from '@/theme/helpers'

const px = (value: number) => `${value}px`
const divider = (theme: any, variant: 'item' | 'band') => theme.native.components.divider.variants[variant].line

export const OrdersDetailsContainer = styled.ScrollView`
`
export const Header = styled.View`
  padding-top: ${({ theme }: any) => spaceCss(theme, 'sm')};
  padding-bottom: ${({ theme }: any) => spaceCss(theme, 'xl')};
`
/** The divider's `band`, full bleed across the page gutter. */
export const Divider = styled.View`
  height: ${({ theme }: any) => px(divider(theme, 'band').borderWidth)};
  background-color: ${({ theme }: any) => divider(theme, 'band').borderColor};
  margin-horizontal: ${({ theme }: any) => px(-theme.native.tokens.layout.page_gutter)};
`
export const Section = styled.View`
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'xl')};
`
export const Customer = styled.View`
  flex-direction: row;
  align-items: center;
`
export const InfoBlock = styled.View`
  width: 100%;
`
export const Row = styled.View`
  flex-direction: row;
  justify-content: space-between;
  flex: 1;
  align-items: center;
  padding-bottom: ${({ theme }: any) => px(theme.native.components.bill.base.row_gap)};
`
/** A full-bleed band of `surface_alt` holding the group's summary. */
export const OrdersSummary = styled.View`
  background-color: ${({ theme }: any) => theme.native.tokens.color.surface_alt};
  margin-horizontal: ${({ theme }: any) => px(-theme.native.tokens.layout.page_gutter)};
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'xl')};
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
`
/** The divider's `item` line. */
export const BorderLine = styled.View`
  height: ${({ theme }: any) => px(divider(theme, 'item').borderWidth)};
  background-color: ${({ theme }: any) => divider(theme, 'item').borderColor};
  margin-vertical: ${({ theme }: any) => spaceCss(theme, 'xs')};
`
export const SingleOrderContainer = styled.View`
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'xxl')};
`
export const StaturBar = styled.View`
  margin-top: ${({ theme, isOrderDetails }: any) => spaceCss(theme, isOrderDetails ? 'sm' : 'xl')};
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'sm')};
`
export const Icons = styled.View`
  flex-direction: row;
  align-items: center;
`
