import styled from 'styled-components/native'
import { controlHeightCss, gutterCss, spaceCss, themeColor, themePart } from '@/theme/helpers'

const px = (value: number) => `${value}px`
// The required tag is the option's `required` slot: a badge (small, danger).
const badge = (theme: any) => theme.native.components.badge
const required = (theme: any) => themePart(theme, 'badge', `variants.${theme.native.components.product_option.slots.required.variant}`)
const option = (theme: any) => theme.native.components.product_option.base

export const Container = styled.View`
`

/** The group's header: its picture, its name with what it asks for, and the chevron; all of it opens and closes the group. */
export const AccordionTitle = styled.Pressable`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }: any) => spaceCss(theme, 'md')};
  min-height: ${({ theme }: any) => controlHeightCss(theme, 'md')};
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'sm')};
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
`

export const OptionImage = styled.View`
  width: ${({ theme }: any) => px(option(theme).image_size)};
  height: ${({ theme }: any) => px(option(theme).image_size)};
  border-radius: ${({ theme }: any) => px(option(theme).image_radius)};
  background-color: ${({ theme }: any) => themeColor(theme, 'surface_alt')};
  overflow: hidden;
`

export const WrapHeader = styled.View`
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
`

/** The badge and the limits under the name. */
export const OptionMeta = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
  margin-top: ${({ theme }: any) => spaceCss(theme, 'xs')};
`

export const OptionalWrap = styled.View`
  justify-content: center;
  min-height: ${({ theme }: any) => px(badge(theme).sizes.sm.height)};
  padding-horizontal: ${({ theme }: any) => px(badge(theme).sizes.sm.padding_x)};
  border-radius: ${({ theme }: any) => px(badge(theme).base.radius)};
  background-color: ${({ theme }: any) => badge(theme).variants.neutral.background};
`

export const RequiredWrap = styled.View`
  justify-content: center;
  min-height: ${({ theme }: any) => px(badge(theme).sizes.sm.height)};
  padding-horizontal: ${({ theme }: any) => px(badge(theme).sizes.sm.padding_x)};
  border-radius: ${({ theme }: any) => px(badge(theme).base.radius)};
  background-color: ${({ theme }: any) => required(theme).background};
`
