import styled, { css } from 'styled-components/native';
import { spaceCss, themeOpacity, themePart } from '@/theme/helpers';

const px = (value: number) => `${value}px`
const cart = (theme: any) => themePart(theme, 'cart', 'base')

// One business cart: `components.cart` (radius, background). The heights are
// layout (room for the header while the products load), not theme sizes.
export const BIContainer = styled.View`
  display: flex;
  flex-direction: column;
  width: 100%;
  border-radius: ${({ theme }: any) => px(cart(theme).radius)};
  overflow: hidden;
  ${(props: any) => !props.isMultiCheckout && css`
    min-height: 120px;
  `}
  ${(props: any) => props.isClosed && css`
    opacity: ${themeOpacity(props.theme, 'disabled')};
    min-height: 60px;
  `}
`

export const BIHeader = styled.View`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  position: relative;
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'sm')};
  background-color: ${({ theme }: any) => cart(theme).background};
`

export const BIInfo = styled.View`
  display: flex;
  flex-direction: row;
  align-items: center;
  flex: 1;
`

export const BIContent = styled.View`
`

export const BIContentInfo = styled.View`
  flex: 1;
  justify-content: center;
`

export const BILinks = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
`

export const BITotal = styled.View`
  width: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
`

export const BIActions = styled.View`
  max-width: 30%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
`

export const PriceContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  flex: 1
`
