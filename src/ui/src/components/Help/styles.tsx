import styled from 'styled-components/native'
import { gutterCss, spaceCss } from '@/theme/helpers'

const row = (theme: any) => theme.native.components.list_row.base
const px = (value: number) => `${value}px`

export const Container = styled.ScrollView`
  padding: ${({ theme }: any) => gutterCss(theme)};
`

/** A help topic row: the `list_row` look (background, divider, vertical padding). */
export const HelpSubItem = styled.View`
  background-color: ${({ theme }: any) => row(theme).background};
  border-bottom-color: ${({ theme }: any) => row(theme).divider.borderColor ?? 'transparent'};
  border-bottom-width: ${({ theme }: any) => px(row(theme).divider.borderWidth ?? 0)};
  padding-vertical: ${({ theme }: any) => px(row(theme).padding_y)};
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`

export const LastOrdersContainer = styled.View`
  margin-vertical: ${({ theme }: any) => spaceCss(theme, 'xl')};
`
