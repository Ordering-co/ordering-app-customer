import styled from 'styled-components/native'
import { spaceCss } from '@/theme/helpers'

export const Container = styled.View`
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'xl')};
`

export const WrappButton = styled.View`
  margin-top: ${({ theme }: any) => spaceCss(theme, 'lg')};
`
