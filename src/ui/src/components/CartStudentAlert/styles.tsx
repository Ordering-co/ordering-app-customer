import styled from 'styled-components/native'
import { gutterCss, spaceCss } from '@/theme/helpers'

// The conflicting items are separated by the `item` divider of the theme.
const divider = (theme: any) => theme.native.components.divider.variants.item.line
const px = (value: number) => `${value}px`

export const Content = styled.View`
  padding: ${({ theme }: any) => spaceCss(theme, 'sm')} ${({ theme }: any) => gutterCss(theme)} ${({ theme }: any) => spaceCss(theme, 'xl')};
`

export const Intro = styled.View`
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'md')};
`

export const ItemList = styled.View`
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'md')};
`

export const Item = styled.View`
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'sm')};
  border-bottom-width: ${({ theme }: any) => px(divider(theme).borderWidth ?? 0)};
  border-bottom-color: ${({ theme }: any) => divider(theme).borderColor ?? 'transparent'};
`

export const Actions = styled.View`
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
`
