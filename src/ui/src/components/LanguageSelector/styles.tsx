import styled from 'styled-components/native'
import { controlHeightCss } from '@/theme/helpers'

export const DummyContainer = styled.View`
  height: ${({ theme }: any) => controlHeightCss(theme, 'md')};
`
