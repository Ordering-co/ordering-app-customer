import styled from 'styled-components/native'
import { themeColor } from '@/theme/helpers'

export const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }: any) => themeColor(theme, 'background')};
`

export const QuickMessageContainer = styled.ScrollView``
