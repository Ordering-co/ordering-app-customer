import styled, { css } from 'styled-components/native'
import { PressableScale } from '../shared/PressableScale'
import { controlHeightCss, gutterCss, nativeBoxStyle, spaceCss } from '@/theme/helpers'

// A block of the reservation form: `components.card` (background, radius,
// border, shadow), padded and placed on the page sides.
const card = (theme: any) => theme.native.components.card.base
const px = (value: number) => `${value}px`

export const Block = styled.View.attrs(({ theme }: any) => ({ style: nativeBoxStyle(card(theme)) }))`
  padding: ${({ theme }: any) => px(card(theme).padding)};
  border-radius: ${({ theme }: any) => px(card(theme).radius)};
  margin: ${({ theme }: any) => gutterCss(theme)};
  ${({ isCheckout, theme }: any) => isCheckout && css`
    margin: 0px;
    margin-bottom: ${gutterCss(theme)};
  `}
`

// A choice row (radio + label): the shared press feedback, 44 pt high at least.
export const IconControl = styled(PressableScale)`
  flex-direction: row;
  min-height: ${({ theme }: any) => controlHeightCss(theme, 'md')};
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'sm')};
  width: 50%;
  align-items: center;
`
