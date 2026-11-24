import styled from 'styled-components/native'
import { spaceCss } from '@/theme/helpers'

export const OptionTitle = styled.View`
  margin-top: ${({ theme }: any) => spaceCss(theme, 'lg')};
`

export const NoOrdersWrapper = styled.View`
  flex-direction: column;
  align-items: center;
  margin-top: ${({ theme }: any) => spaceCss(theme, 'xxxl')};
`
