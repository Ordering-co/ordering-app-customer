import styled from 'styled-components/native'
import { gutterCss, spaceCss } from '@/theme/helpers'

export const Container = styled.View`
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
  margin-top: ${({ theme }: any) => spaceCss(theme, 'lg')};
`

export const TabsWrapper = styled.View`
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'md')};
`

export const EmptyWrapper = styled.View`
  align-items: center;
  margin-top: ${({ theme }: any) => spaceCss(theme, 'xxxl')};
`
