import styled from 'styled-components/native'
import { gutterCss, spaceCss } from '@/theme/helpers'

// The wallet screens (CashWallet, LoyaltyPoints) share these styles:
// `components.wallet_balance` and the `band` divider between blocks.
const balance = (theme: any) => theme.native.components.wallet_balance.base
const band = (theme: any) => theme.native.components.divider.variants.band.line
const px = (value: number) => `${value}px`

export const Container = styled.View`
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
  padding-bottom: ${({ theme }: any) => px(balance(theme).padding)};
`

export const SectionContent = styled.View`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const BalanceElement = styled.View`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }: any) => px(balance(theme).padding)};
`

export const LoyaltyContent = styled.View`
  width: 100%;
  margin-bottom: ${({ theme }: any) => px(balance(theme).padding)};
`

export const LoyaltyWrapp = styled.View`
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

/** The band between the balance and the transactions (`divider.band`). */
export const WalletBand = styled.View`
  height: ${({ theme }: any) => px(band(theme).borderWidth)};
  background-color: ${({ theme }: any) => band(theme).borderColor};
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
`
