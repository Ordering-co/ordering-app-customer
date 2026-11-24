import styled, { css } from 'styled-components/native'
import { spaceCss } from '@/theme/helpers'

// `components.wallet_transaction` (icon box, credit/debit colors) and the
// item divider between rows.
const item = (theme: any) => theme.native.components.divider.variants.item.line
const look = (theme: any) => theme.native.components.wallet_transaction.base
const px = (value: number) => `${value}px`

export const Container = styled.View`
  display: flex;
  flex-direction: row;
  position: relative;
  /* The list already sits on the page sides: a row adds no gutter of its own. */
  padding-bottom: ${({ theme }: any) => spaceCss(theme, 'sm')};
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
  ${({ isLast }: { isLast: boolean }) => isLast ? css`
    border-bottom-width: 0px;
  ` : css`
    border-bottom-color: ${({ theme }: any) => item(theme).borderColor};
    border-bottom-width: ${({ theme }: any) => px(item(theme).borderWidth)};
  `}
`

export const Body = styled.View`
  flex: 1;
`

export const DateBlock = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`

export const DescriptionBlock = styled.View`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`

/** The icon box: a fixed square around the icon, credit or debit tinted. */
export const IconWrapper = styled.View`
  display: flex;
  justify-content: center;
  align-items: center;
  width: ${({ theme }: any) => px(theme.native.tokens.size.lg)};
  height: ${({ theme }: any) => px(theme.native.tokens.size.lg)};
  border-radius: ${({ theme }: any) => px(look(theme).icon_radius)};
  background-color: ${({ theme, isDebit }: any) => isDebit ? look(theme).debit_background : look(theme).credit_background};
  margin-right: ${({ theme }: any) => spaceCss(theme, 'sm')};
`
