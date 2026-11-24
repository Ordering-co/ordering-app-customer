import styled from 'styled-components/native'
import { controlHeightCss, spaceCss, themeColor, themePart } from '@/theme/helpers'

const px = (value: number) => `${value}px`
// The halves selector is the option's `halves` slot: tabs (pill) of its size.
const halves = (theme: any) => theme.native.components.product_option.slots.halves
const pill = (theme: any) => themePart(theme, 'tabs', `variants.${halves(theme).variant}`)
const tabSize = (theme: any) => themePart(theme, 'tabs', `sizes.${halves(theme).size}`)
const option = (theme: any) => theme.native.components.product_option.base

/** The suboption's stepper (`components.stepper`, small). */
export const QuantityControl = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }: any) => spaceCss(theme, 'xs')};
  border-radius: ${({ theme }: any) => px(theme.native.components.stepper.base.radius)};
`

/** The halves: one segmented control across the row. */
export const PositionControl = styled.View`
  flex-direction: row;
  align-items: center;
  padding: ${({ theme }: any) => px(pill(theme).inset)};
  gap: ${({ theme }: any) => px(pill(theme).gap)};
  border-radius: ${({ theme }: any) => px(pill(theme).radius)};
  background-color: ${({ theme }: any) => pill(theme).background};
`

export const Circle = styled.TouchableOpacity`
  flex: 1;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  min-height: ${({ theme }: any) => px(tabSize(theme).height)};
  padding-horizontal: ${({ theme }: any) => px(tabSize(theme).padding_x)};
  border-radius: ${({ theme }: any) => px(pill(theme).tab_radius)};
  background-color: ${({ theme, active }: any) => active ? pill(theme).active_background : 'transparent'};
`

/** The option's picture: a box of the option's image size and radius (a placeholder where the row has none). */
export const Logo = styled.View`
  height: ${({ theme }: any) => px(option(theme).image_size)};
  width: ${({ theme }: any) => px(option(theme).image_size)};
  border-radius: ${({ theme }: any) => px(option(theme).image_radius)};
  background-color: ${({ theme }: any) => themeColor(theme, 'surface_alt')};
  overflow: hidden;
`

export const WrapperOptionName = styled.View`
  flex: 1;
  flex-direction: column;
  justify-content: center;
`
