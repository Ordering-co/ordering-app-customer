import styled from 'styled-components/native'
import { PressableScale } from '../shared/PressableScale'

// A saved card is a `list_row` of the theme: vertical padding and the gap between its pieces.
const row = (theme: any) => theme.native.components.list_row.base
const px = (value: number) => `${value}px`

export const CardRow = styled.View`
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-vertical: ${({ theme }: any) => px(row(theme).padding_y)};
`

export const CardRowContent = styled(PressableScale)`
  flex: 1;
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }: any) => px(row(theme).gap)};
`

/** The delete action: a 44 pt touch target around the trash icon. */
export const CardRowAction = styled.View`
  min-width: ${({ theme }: any) => px(theme.native.tokens.size.md)};
  min-height: ${({ theme }: any) => px(theme.native.tokens.size.md)};
  align-items: center;
  justify-content: center;
`
