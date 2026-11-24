import styled from 'styled-components/native'
import { spaceCss } from '@/theme/helpers'

export const Container = styled.View`
  display: flex;
  flex-direction: column;
  width: 100%;
`

export const Content = styled.View`
  width: 100%;
  padding-bottom: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const TransactionsWrapper = styled.View`
  display: flex;
  flex-direction: column;
`

export const SkeletonItem = styled.View`
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'sm')};
`
