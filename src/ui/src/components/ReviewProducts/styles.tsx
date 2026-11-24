import styled from 'styled-components/native'
import { themeColor } from '@/theme/helpers'

export const Content = styled.ScrollView`
  background-color: ${({ theme }: any) => themeColor(theme, 'background')};
`

export const ProductsReviewsContainer = styled.View`
  flex-direction: column;
`
