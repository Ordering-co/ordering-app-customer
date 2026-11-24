import styled from 'styled-components/native'
import { gutterCss, spaceCss } from '@/theme/helpers'

export const Wrapper = styled.View`
  flex: 1;
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'md')};
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
`

export const Header = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'md')};
`

export const Empty = styled.View`
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'lg')};
`
