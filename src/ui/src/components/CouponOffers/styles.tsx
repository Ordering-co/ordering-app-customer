import styled from 'styled-components/native'
import { borderCss, controlHeightCss, gutterCss, radiusCss, spaceCss, themeColor, themePart } from '@/theme/helpers'

const px = (value: number) => `${value}px`
const chip = (theme: any) => themePart(theme, 'chip', 'base')
const badge = (theme: any) => themePart(theme, 'badge', 'variants.neutral')

export const ScreenContainer = styled.View`
  flex: 1;
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
`

export const ManualSection = styled.View`
  padding-bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
`

export const SectionHeader = styled.View`
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const ManualForm = styled.View`
  align-items: center;
  flex-direction: row;
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const InputWrapper = styled.View`
  flex: 1;
`

export const AppliedCouponCard = styled.View`
  align-items: center;
  background-color: ${({ theme }: any) => themeColor(theme, 'surface_alt')};
  ${({ theme }: any) => borderCss(theme, 'thin', 'border', { fixed: true })}
  border-radius: ${({ theme }: any) => radiusCss(theme, 'md')};
  flex-direction: row;
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
  padding: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const AppliedCouponInfo = styled.View`
  flex: 1;
`

export const OfferIcon = styled.View`
  align-items: center;
  background-color: ${({ theme }: any) => themeColor(theme, 'primary_subtle')};
  border-radius: ${({ theme }: any) => radiusCss(theme, 'md')};
  height: ${({ theme }: any) => controlHeightCss(theme, 'md')};
  width: ${({ theme }: any) => controlHeightCss(theme, 'md')};
  justify-content: center;
`

export const OfferTabs = styled.View`
  flex-direction: row;
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'md')};
`

// Each tab is a `chip` (its selected state marks the open tab).
export const OfferTab = styled.TouchableOpacity<{ $active?: boolean }>`
  align-items: center;
  flex: 1;
  flex-direction: row;
  justify-content: center;
  gap: ${({ theme }: any) => px(chip(theme).gap)};
  min-height: ${({ theme }: any) => px(themePart(theme, 'chip', 'sizes.md.height'))};
  padding-horizontal: ${({ theme }: any) => px(themePart(theme, 'chip', 'sizes.md.padding_x'))};
  border-radius: ${({ theme }: any) => px(chip(theme).radius)};
  background-color: ${({ theme, $active }: any) => $active
    ? themePart(theme, 'chip', 'variants.default.states.selected.background')
    : chip(theme).background};
`

// The count on a tab: a neutral `badge` (count shape).
export const OfferTabCount = styled.View`
  align-items: center;
  justify-content: center;
  min-width: ${({ theme }: any) => px(themePart(theme, 'badge', 'sizes.sm.height'))};
  height: ${({ theme }: any) => px(themePart(theme, 'badge', 'sizes.sm.height'))};
  padding-horizontal: ${({ theme }: any) => spaceCss(theme, 'xs')};
  border-radius: ${({ theme }: any) => px(themePart(theme, 'badge', 'shapes.count.radius'))};
  background-color: ${({ theme }: any) => badge(theme).background};
`

export const OfferCardContainer = styled.View<{ $unavailable?: boolean }>`
  align-items: center;
  background-color: ${({ theme, $unavailable }: any) => themeColor(theme, $unavailable ? 'surface_alt' : 'background')};
  ${({ theme }: any) => borderCss(theme, 'thin', 'border', { fixed: true })}
  border-radius: ${({ theme }: any) => radiusCss(theme, 'md')};
  flex-direction: row;
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'sm')};
  padding: ${({ theme }: any) => spaceCss(theme, 'md')};
`

export const OfferRate = styled.View`
  align-items: center;
  background-color: ${({ theme }: any) => themeColor(theme, 'primary')};
  border-radius: ${({ theme }: any) => radiusCss(theme, 'md')};
  height: ${({ theme }: any) => controlHeightCss(theme, 'md')};
  width: ${({ theme }: any) => controlHeightCss(theme, 'md')};
  justify-content: center;
`

export const OfferContent = styled.View`
  flex: 1;
  gap: ${({ theme }: any) => spaceCss(theme, 'xxs')};
`

// The empty, loading and error states: a box of layout height in the list.
export const OfferState = styled.View`
  align-items: center;
  flex: 1;
  justify-content: center;
  min-height: 220px;
  gap: ${({ theme }: any) => spaceCss(theme, 'xs')};
  padding-horizontal: ${({ theme }: any) => spaceCss(theme, 'xl')};
`
