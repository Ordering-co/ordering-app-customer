import styled from 'styled-components/native'
import { gutterCss, spaceCss } from '@/theme/helpers'

export const Container = styled.View`
  padding-top: ${({ theme }: any) => spaceCss(theme, 'lg')};
  padding-bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
  gap: ${({ theme }: any) => spaceCss(theme, 'lg')};
`
