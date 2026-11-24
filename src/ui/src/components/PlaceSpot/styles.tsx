import styled from 'styled-components/native'
import { spaceCss } from '@/theme/helpers'

export const PlaceSpotContainer = styled.View`
`

export const PlaceGroupContainer = styled.View`
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'xxl')};
  margin-top: ${({ theme }: any) => spaceCss(theme, 'lg')};
`
