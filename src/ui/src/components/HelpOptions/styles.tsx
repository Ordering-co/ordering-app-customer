import styled from 'styled-components/native'
import { gutterCss } from '@/theme/helpers'

export const Container = styled.ScrollView`
  position: relative;
  flex: 1;
  padding: ${({ theme }: any) => gutterCss(theme)};
`
