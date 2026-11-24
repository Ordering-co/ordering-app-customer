import styled from 'styled-components/native'
import { controlHeightCss, gutterCss, radiusCss, spaceCss, themeBorderWidth, themeColor, themeControlHeight } from '@/theme/helpers'

const px = (value: number) => `${value}px`

/** The head's bar: the header's height, so its title sits where every NavBar title sits. */
export const Search = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  min-height: ${({ theme }: any) => `${theme.native.components.header.base.height}px`};
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
`

export const AddressInput = styled.View`
  flex: 1;
  flex-direction: row;
  align-items: center;
  min-height: ${({ theme }: any) => controlHeightCss(theme, 'md')};
`

/**
 * The cart's box: the touch target (a control of size `md`, 44 pt) centered on
 * its glyph. Its right edge is the page's gutter, so the glyph ends a few
 * points inside it and the count (on the glyph's corner) stays inside too.
 */
export const CartIconWrapper = styled.View`
  position: relative;
  align-items: center;
  justify-content: center;
  min-width: ${({ theme }: any) => controlHeightCss(theme, 'md')};
  min-height: ${({ theme }: any) => controlHeightCss(theme, 'md')};
`

/**
 * The cart count (`components.badge`, primary, the count shape) on the glyph's
 * top-right corner, ringed by the header's background. Its right edge is the
 * box's, the page's gutter; with 2 digits or "99+" it grows to the left and
 * may cover the basket's handle, not its body. It sits no higher than the bar
 * (a parent clips what rises above it).
 */
export const CartBadge = styled.View`
  position: absolute;
  top: 0;
  right: 0;
  min-width: ${({ theme }: any) => px(theme.native.components.badge.sizes.sm.height)};
  height: ${({ theme }: any) => px(theme.native.components.badge.sizes.sm.height)};
  border-radius: ${({ theme }: any) => px(theme.native.components.badge.shapes.count.radius)};
  border-width: ${({ theme }: any) => px(themeBorderWidth(theme, 'thick'))};
  border-color: ${({ theme }: any) => theme.native.components.header.base.background};
  background-color: ${({ theme }: any) => theme.native.components.badge.variants.primary.background};
  justify-content: center;
  align-items: center;
  padding-horizontal: ${({ theme }: any) => spaceCss(theme, 'xxs')};
`

export const AddressInputContainer = styled.View`
  flex-direction: row;
  width: 100%;
  align-items: center;
  justify-content: flex-start;
  gap: ${({ theme }: any) => spaceCss(theme, 'xs')};
`

export const OrderControlContainer = styled.View`
  width: 100%;
  flex-direction: row;
  align-items: center;
  /* Padding, not margin: the row sits in a collapsible box that clips its
     overflow, and the pills' edge is their shadow (the input look has no
     border), so it needs room inside the box above and below. */
  padding-top: ${({ theme }: any) => spaceCss(theme, 'sm')};
  padding-bottom: ${({ theme }: any) => spaceCss(theme, 'xs')};
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
`

/** The city filter's own row under the order options: same gutter and gaps as theirs. */
export const CityFilterRow = styled.View`
  width: 100%;
  flex-direction: row;
  padding-bottom: ${({ theme }: any) => spaceCss(theme, 'xs')};
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
`

export const CityFilterSelect = styled.View`
  flex: 1;
`

/**
 * The listing's sections: one gap between the ones shown (`space.xl`). A section
 * owns no outer margin and a section with nothing to show renders no view at all,
 * so it leaves no gap behind.
 */
export const ListWrapper = styled.View`
  gap: ${({ theme }: any) => spaceCss(theme, 'xl')};
  padding-top: ${({ theme }: any) => spaceCss(theme, 'lg')};
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
  background-color: ${({ theme }: any) => themeColor(theme, 'background')};
`;

export const PopoverContainer = styled.TouchableOpacity.attrs(() => ({ activeOpacity: 1 }))`
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
`;

// The far-away tip: an inverse bubble with its pointer.
export const Bubble = styled.View`
  background-color: ${({ theme }: any) => themeColor(theme, 'inverse_surface')};
  border-radius: ${({ theme }: any) => radiusCss(theme, 'md')};
  padding: ${({ theme }: any) => spaceCss(theme, 'md')};
  width: 100%;
`;

export const Pointer = styled.View`
  width: 0;
  height: 0;
  background-color: transparent;
  border-style: solid;
  border-left-width: ${({ theme }: any) => spaceCss(theme, 'sm')};
  border-right-width: ${({ theme }: any) => spaceCss(theme, 'sm')};
  border-bottom-width: ${({ theme }: any) => spaceCss(theme, 'sm')};
  border-left-color: transparent;
  border-right-color: transparent;
  border-bottom-color: ${({ theme }: any) => themeColor(theme, 'inverse_surface')};
  margin-left: ${({ theme }: any) => spaceCss(theme, 'xl')};
`;
