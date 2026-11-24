import { Animated } from 'react-native'
import styled, { css } from 'styled-components/native'
import { gutterCss, shadowCss, spaceCss, themeBorderWidth, themeColor, themeOpacity, themePart, themeRadius } from '@/theme/helpers'
import OImageBackground from '../shared/OImageBackground'

const px = (value: number) => `${value}px`
// The summary floats like a sheet over the hero (`components.sheet`).
const sheet = (theme: any) => theme.native.components.sheet.base
const stepper = (theme: any) => theme.native.components.stepper.base
const band = (theme: any) => themePart(theme, 'divider', 'variants.band.line')
const bottomBar = (theme: any) => theme.native.components.bottom_bar.base

export const ProductTitle = styled.View`
  justify-content: flex-start;
  padding-bottom: ${({ theme }: any) => spaceCss(theme, 'xs')};
`

export const ProductDescription = styled.View`
  padding-bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
`

export const ProductEditions = styled.View`
  padding-vertical: 0;
  background-color: ${({ theme }: any) => sheet(theme).background};
`

export const SectionTitle = styled.View`
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const WrapperIngredients = styled.View`
`

/** An option's body: tinted when the option has an error, faded when nothing can be added. */
export const WrapperSubOption = styled.View`
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
  ${({ theme, state }: any) => state === 'error' && css`
    background-color: ${themeColor(theme, 'danger_subtle')};
  `}
  ${({ theme, state }: any) => state === 'off' && css`
    opacity: ${themeOpacity(theme, 'disabled')};
  `}
`

export const ProductComment = styled.View`
  padding-bottom: ${({ theme }: any) => spaceCss(theme, 'xxxl')};
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
`

/** The add-to-cart bar (`components.bottom_bar`); its bottom inset is added by the screen. */
export const ProductActions = styled.View`
  position: absolute;
  bottom: 0px;
  width: 100%;
  flex-direction: column;
  z-index: 1000;
  padding-top: ${({ theme }: any) => px(bottomBar(theme).padding)};
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
  background-color: ${({ theme }: any) => bottomBar(theme).background};
  border-top-width: ${({ theme }: any) => px(bottomBar(theme).border_top.borderWidth ?? 0)};
  border-top-color: ${({ theme }: any) => bottomBar(theme).border_top.borderColor ?? 'transparent'};
`

/** Under the summary: the option tabs (`ExtraOptions`). */
// The option tabs on the page sides, as the name and the options under them.
export const ExtraOptionWrap = styled.View`
  padding-top: ${({ theme }: any) => spaceCss(theme, 'lg')};
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
  background-color: ${({ theme }: any) => sheet(theme).background};
`

export const ProductSummary = styled.View`
  padding-top: ${({ theme }: any) => spaceCss(theme, 'xl')};
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
  position: relative;
  background-color: ${({ theme }: any) => sheet(theme).background};
  border-top-left-radius: ${({ theme }: any) => px(sheet(theme).radius)};
  border-top-right-radius: ${({ theme }: any) => px(sheet(theme).radius)};
`

export const BackgroundImage = styled(OImageBackground)`
  flex: 1;
  justify-content: center;
`

/** The sheet's grab handle. */
export const Line = styled.View`
  align-self: center;
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'sm')};
  height: ${({ theme }: any) => spaceCss(theme, 'xs')};
  width: 35px;
  border-radius: ${({ theme }: any) => px(themeRadius(theme, 'full', { fixed: true }))};
  background-color: ${({ theme }: any) => sheet(theme).handle_color};
`

export const WrapperHeaderActions = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'sm')};
  ${(props: any) => props.isSticky && css`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
  `}
`

/**
 * The solid header (background, line and shadow) under the floating buttons; the
 * screen fades it in (`opacity`) as the content reaches the buttons' zone.
 */
export const HeaderBackground = styled(Animated.View)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ theme }: any) => themePart(theme, 'product_modal', 'base.header_background')};
  border-bottom-width: ${({ theme }: any) => px(themeBorderWidth(theme, 'thin', { fixed: true }))};
  border-bottom-color: ${({ theme }: any) => themeColor(theme, 'border')};
  ${({ theme }: any) => shadowCss(theme, 'sm')}
`

/** Between the summary and the options: the divider's `band`. */
export const Divider = styled.View`
  height: ${({ theme }: any) => px(band(theme).borderWidth)};
  background-color: ${({ theme }: any) => band(theme).borderColor};
`

/** The quantity stepper (`components.stepper`). */
export const QuantityControl = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-right: ${({ theme, isCentered }: any) => isCentered ? '0px' : spaceCss(theme, 'sm')};
  border-radius: ${({ theme }: any) => px(stepper(theme).radius)};
  border-width: ${({ theme }: any) => px(stepper(theme).border.borderWidth ?? 0)};
  border-color: ${({ theme }: any) => stepper(theme).border.borderColor ?? 'transparent'};
  background-color: ${({ theme }: any) => stepper(theme).background};
`
