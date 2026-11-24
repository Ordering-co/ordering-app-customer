import styled from 'styled-components/native'
import { themeColor } from '@/theme/helpers'

export const PlaceholderContainer = styled.View`
  width: 100%;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: ${({ theme }: any) => themeColor(theme, 'surface_alt')};
`

export const LogoWrapper = styled.View`
  align-items: center;
  justify-content: center;
`
