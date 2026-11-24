import styled from 'styled-components/native'
import { gutterCss, spaceCss } from '@/theme/helpers'

const px = (value: number) => `${value}px`
const card = (theme: any) => theme.native.components.card.base

export const Container = styled.ScrollView`
  padding: ${({ theme }: any) => gutterCss(theme)};
`

export const SessionsWrapper = styled.View`
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'xxl')};
  gap: ${({ theme }: any) => spaceCss(theme, 'lg')};
`

// An outline card: `card` background, radius and padding with a thin border.
export const SessionItem = styled.View.attrs(({ theme }: any) => ({
  style: theme.native.components.card.base.border ?? {}
}))`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: ${({ theme }: any) => card(theme).background};
  border-radius: ${({ theme }: any) => px(card(theme).radius)};
  padding: ${({ theme }: any) => px(card(theme).padding)};
`
