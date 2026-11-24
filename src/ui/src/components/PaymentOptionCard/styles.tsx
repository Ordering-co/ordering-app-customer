import styled from 'styled-components/native'
import { spaceCss } from '@/theme/helpers'

export const CardFormWrapper = styled.View`
  width: 100%;
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'md')};
`

export const CardFormRow = styled.View`
  flex-direction: row;
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const CardFormCell = styled.View`
  flex: 1;
`
