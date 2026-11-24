import styled from 'styled-components/native'
import { gutterCss, spaceCss } from '@/theme/helpers'

// A block of the order details closed by the divider's `item` line.
export const Container = styled.View`
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'sm')};
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'sm')};
  border-bottom-width: ${({ theme }: any) => `${theme.native.components.divider.variants.item.line.borderWidth}px`};
  border-bottom-color: ${({ theme }: any) => theme.native.components.divider.variants.item.line.borderColor};
`

export const Inner = styled.View`
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
`
