import styled, { css } from 'styled-components/native'
import { controlHeightCss, gutterCss, spaceCss, themeColor, themeOpacity } from '@/theme/helpers'

const pressable = ({ theme }: any) => ({ activeOpacity: themeOpacity(theme, 'pressed') })

export const BContainer = styled.View`
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'lg')};
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const BrandContainer = styled.View``

export const BrandItem = styled.TouchableOpacity.attrs(pressable)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-direction: row;
  min-height: ${({ theme }: any) => controlHeightCss(theme, 'md')};
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'xs')};
  padding-horizontal: ${({ theme }: any) => spaceCss(theme, 'sm')};
  border-radius: ${({ theme }: any) => `${theme.native.components.menu.base.radius}px`};
  ${({ active }: any) => active && css`
    background-color: ${({ theme }: any) => themeColor(theme, 'primary_subtle')};
  `}
`

export const PriceFilterWrapper = styled.View`
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const WrapperButtons = styled.View`
  width: 100%;
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
  padding-bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
  gap: ${({ theme }: any) => spaceCss(theme, 'xs')};
`

export const PriceContainer = styled.View`
  width: 100%;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const WrapperResults = styled.View`
  margin-top: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const FiltersActionBar = styled.ScrollView.attrs(({ theme }: any) => ({
  horizontal: true,
  showsHorizontalScrollIndicator: false,
  contentContainerStyle: { alignItems: 'center', gap: theme.native.components.filters.base.gap }
}))`
  width: 100%;
`

export const SheetContent = styled.ScrollView.attrs(({ theme }: any) => ({
  showsVerticalScrollIndicator: false,
  contentContainerStyle: { paddingHorizontal: theme.native.tokens.layout.page_gutter }
}))``

export const BrandList = styled.ScrollView.attrs(() => ({
  showsVerticalScrollIndicator: true,
  nestedScrollEnabled: true
}))`
  max-height: 300px;
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'sm')};
`
