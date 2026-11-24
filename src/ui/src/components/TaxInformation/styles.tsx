import styled from 'styled-components/native'
import { spaceCss } from '@/theme/helpers'

export const TaxInformationContainer = styled.ScrollView`
  padding: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const ProductContainer = styled.View`
  flex: 1
`
