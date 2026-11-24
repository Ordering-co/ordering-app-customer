import styled from 'styled-components/native'
import { themeColor } from '@/theme/helpers'

// `components.empty_state` (its `compact` variant when `$simple`).
const look = (theme: any, simple?: boolean) => {
  const empty = theme.native.components.empty_state
  return simple ? { ...empty.base, ...empty.variants.compact } : empty.base
}
const px = (value: number) => `${value}px`

export const NotFound = styled.View`
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: ${({ theme, $simple }: any) => px(look(theme, $simple).min_height)};
  margin-vertical: ${({ theme, $simple }: any) => px(look(theme, $simple).margin)};
  padding-vertical: ${({ theme, $simple }: any) => px(look(theme, $simple).padding_y)};
  padding-horizontal: ${({ theme, $simple }: any) => px(look(theme, $simple).padding_x)};
`

export const IconBadge = styled.View`
  width: ${({ theme }: any) => px(theme.native.components.empty_state.base.icon_box_size)};
  height: ${({ theme }: any) => px(theme.native.components.empty_state.base.icon_box_size)};
  border-radius: ${({ theme }: any) => px(theme.native.tokens.radius.full)};
  justify-content: center;
  align-items: center;
  margin-bottom: ${({ theme }: any) => px(theme.native.components.empty_state.base.image_gap)};
  background-color: ${({ theme }: any) => themeColor(theme, 'surface_alt')};
`
