import styled from 'styled-components/native'
import { spaceCss } from '@/theme/helpers'
import { PressableScale } from '../shared/PressableScale'

// The block opens with the `section` divider's line of the theme.
const line = (theme: any) => theme.native.components.divider.variants.section.line
const px = (value: number) => `${value}px`

export const Container = styled.View`
  border-top-width: ${({ theme }: any) => px(line(theme).borderWidth ?? 0)};
  border-top-color: ${({ theme }: any) => line(theme).borderColor ?? 'transparent'};
  margin-top: ${({ theme }: any) => spaceCss(theme, 'lg')};
  padding-top: ${({ theme }: any) => spaceCss(theme, 'md')};
`

export const Header = styled.View`
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const Info = styled.View`
  margin-top: ${({ theme }: any) => spaceCss(theme, 'sm')};
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'xs')};
`

/** A text link with a 44 pt touch target. */
export const EditLink = styled(PressableScale)`
  align-self: flex-start;
  justify-content: center;
  min-height: ${({ theme }: any) => px(theme.native.tokens.size.md)};
`
