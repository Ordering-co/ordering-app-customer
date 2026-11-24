import styled from 'styled-components/native'
import { spaceCss } from '@/theme/helpers'

export const ActiveOrdersContainer = styled.View<{ isMiniCards?: any }>`
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
`
