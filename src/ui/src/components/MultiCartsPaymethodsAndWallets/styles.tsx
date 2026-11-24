import styled from 'styled-components/native'
import { spaceCss } from '@/theme/helpers'

// The wallet-pay marks and the loading rows; a method is a chip and a wallet a `WalletRow`.
const choice = (theme: any) => theme.native.components.choice
const px = (value: number) => `${value}px`

export const PMContainer = styled.View`
  display: flex;
  flex-direction: column;
  width: 100%;
`

/** The wallet-pay marks (Apple/Google Pay) keep their own artwork box. */
export const PayMark = styled.View`
  margin-right: ${({ theme }: any) => px(choice(theme).base.gap)};
`

export const SkeletonBox = styled.View`
  margin-vertical: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const SkeletonRow = styled.View`
  display: flex;
  flex-direction: row;
`
