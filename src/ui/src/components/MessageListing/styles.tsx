import styled from 'styled-components/native'
import { gutterCss, spaceCss } from '@/theme/helpers'

export const MessageListingWrapper = styled.View`
  position: relative;
  margin-top: ${({ theme }: any) => spaceCss(theme, 'lg')};
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
`
