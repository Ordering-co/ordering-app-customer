import styled from 'styled-components/native'
import { Animated, Dimensions } from 'react-native'
import { gutterCss, spaceCss } from '@/theme/helpers'

// Layout of the sheet over the map: its share of the window and the part that peeks.
export const SHEET_EXPANDED_HEIGHT = Math.round(Dimensions.get('window').height * 0.72)
export const SHEET_PEEK_HEIGHT = 172
export const SHEET_COLLAPSED_TRANSLATE_Y = SHEET_EXPANDED_HEIGHT - SHEET_PEEK_HEIGHT

// `components.sheet`: the sheet's box, handle and title.
const sheet = (theme: any) => theme.native.components.sheet.base
const px = (value: number) => `${value}px`

export const GoogleMapContainer = styled.View`
  flex: 1;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`

export const HeaderContainer = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const HeaderRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: ${({ theme }: any) => spaceCss(theme, 'sm')};
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const FilterRow = styled.ScrollView.attrs(({ theme }: any) => ({
  horizontal: true,
  showsHorizontalScrollIndicator: false,
  contentContainerStyle: { gap: theme.native.components.filters.base.gap, paddingVertical: theme.native.tokens.space.xs }
}))``

export const SearchAreaWrapper = styled.View`
  align-items: center;
`

export const NoResult = styled.View`
  align-items: center;
`

export const FilterContainer = styled.View`
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'lg')};
`

export const PriceListContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const BrandList = styled.ScrollView.attrs(() => ({
  showsVerticalScrollIndicator: true,
  nestedScrollEnabled: true
}))`
  max-height: 300px;
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const SheetFooter = styled.View`
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
  padding-bottom: ${({ theme }: any) => spaceCss(theme, 'sm')};
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const WrapperNotFound = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  justify-content: center;
  align-items: center;
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
`

export const SheetContainer = styled(Animated.View)`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: ${SHEET_EXPANDED_HEIGHT}px;
  background-color: ${({ theme }: any) => sheet(theme).background};
  border-top-left-radius: ${({ theme }: any) => px(sheet(theme).radius)};
  border-top-right-radius: ${({ theme }: any) => px(sheet(theme).radius)};
`

export const SheetHandleArea = styled.View`
  padding-top: ${({ theme }: any) => spaceCss(theme, 'sm')};
  padding-bottom: ${({ theme }: any) => spaceCss(theme, 'sm')};
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const SheetGrabber = styled.View`
  width: ${({ theme }: any) => spaceCss(theme, 'xxxl')};
  height: ${({ theme }: any) => spaceCss(theme, 'xs')};
  border-radius: ${({ theme }: any) => px(theme.native.tokens.radius.full)};
  align-self: center;
  background-color: ${({ theme }: any) => sheet(theme).handle_color};
`

export const SheetCardWrapper = styled.View`
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
`
