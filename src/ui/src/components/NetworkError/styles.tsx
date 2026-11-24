import styled from 'styled-components/native'
import { gutterCss } from '@/theme/helpers'

export const Container = styled.View`
  flex: 1;
  padding: ${({ theme }: any) => gutterCss(theme)};
`
export const ImageContainer = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`
