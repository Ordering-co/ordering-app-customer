import styled, { css } from 'styled-components/native'
import { iconSizeCss } from '@/theme/helpers'

export const GpsButtonStyle = styled.TouchableOpacity`
  width: ${({ theme }: any) => iconSizeCss(theme, 'sm')};
  height: ${({ theme }: any) => iconSizeCss(theme, 'sm')};
`
