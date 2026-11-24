import styled from 'styled-components/native';
import { gutterCss, spaceCss, themePart } from '@/theme/helpers';

const px = (value: number) => `${value}px`
const itemLine = (theme: any) => themePart(theme, 'divider', 'variants.item.line')

export const CCContainer = styled.View`
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'lg')};
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
`

export const CCNotCarts = styled.View`
  flex-direction: column;
  align-items: center;
  margin-top: ${({ theme }: any) => spaceCss(theme, 'xxl')};
`

export const CCList = styled.ScrollView`
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'sm')};
  overflow: visible;
`

export const GroupHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-top: ${({ theme }: any) => spaceCss(theme, 'sm')};
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const BillLine = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-bottom: ${({ theme }: any) => px(themePart(theme, 'bill', 'base.row_gap'))};
`

// Between cart groups: an item divider.
export const GroupDivider = styled.View`
  width: 100%;
  height: ${({ theme }: any) => px(itemLine(theme).borderWidth)};
  background-color: ${({ theme }: any) => itemLine(theme).borderColor};
  margin-vertical: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const GroupMessage = styled.View`
  flex-direction: row;
  justify-content: center;
  margin-vertical: ${({ theme }: any) => spaceCss(theme, 'lg')};
`

export const ChCartsTotal = styled.View`
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'md')};
`
