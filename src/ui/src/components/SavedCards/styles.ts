import styled from 'styled-components/native'
import { gutterCss, spaceCss } from '@/theme/helpers'

// A saved card is a `list_row` of the theme: background, vertical padding, gap and divider.
const row = (theme: any) => theme.native.components.list_row.base
const px = (value: number) => `${value}px`

export const Container = styled.View`
  flex: 1;
  padding: ${({ theme }: any) => gutterCss(theme)};
`

export const AddButtonWrapper = styled.View`
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'md')};
`

export const CardRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: ${({ theme }: any) => row(theme).background};
  padding-vertical: ${({ theme }: any) => px(row(theme).padding_y)};
  border-bottom-width: ${({ theme }: any) => px(row(theme).divider.borderWidth ?? 0)};
  border-bottom-color: ${({ theme }: any) => row(theme).divider.borderColor ?? 'transparent'};
`

export const CardInfo = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }: any) => px(row(theme).gap)};
`

/** The delete action: a 44 pt touch target around the trash icon. */
export const CardAction = styled.View`
  min-width: ${({ theme }: any) => px(theme.native.tokens.size.md)};
  min-height: ${({ theme }: any) => px(theme.native.tokens.size.md)};
  align-items: center;
  justify-content: center;
`

export const EmptyWrapper = styled.View`
  padding: ${({ theme }: any) => spaceCss(theme, 'xxl')} ${({ theme }: any) => gutterCss(theme)};
  align-items: center;
`

export const WebViewWrapper = styled.View`
  flex: 1;
  width: 100%;
`

export const ModalBody = styled.View`
  flex: 1;
  padding: ${({ theme }: any) => spaceCss(theme, 'sm')} ${({ theme }: any) => spaceCss(theme, 'md')} ${({ theme }: any) => spaceCss(theme, 'md')};
`
