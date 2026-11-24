import styled from 'styled-components/native'
import { spaceCss, themeColor } from '@/theme/helpers'

export const OrderContainer = styled.View`
  position: relative;
  margin-vertical: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

/** The business name over the header photo: the `overlay` scrim. */
export const OrderInfo = styled.View`
  position: absolute;
  width: 100%;
  height: 100%;
  flex-direction: column;
  justify-content: center;
  padding-horizontal: ${({ theme }: any) => spaceCss(theme, 'xl')};
  background-color: ${({ theme }: any) => themeColor(theme, 'overlay')};
  border-radius: ${({ theme }: any) => `${theme.native.components.order_card.base.radius}px`};
`
