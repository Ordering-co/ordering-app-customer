import styled from 'styled-components/native'
import { spaceCss } from '@/theme/helpers'

export const SubCategoriesContainer = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'sm')};
`
