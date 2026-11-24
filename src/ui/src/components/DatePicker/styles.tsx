import styled from 'styled-components/native';
import { spaceCss } from '@/theme/helpers';

const sheetPadding = (theme: any) => `${theme.native.components.sheet.base.padding}px`

export const DateContainer = styled.View`
  align-items: center;
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
`

export const DateActions = styled.View`
  flex-direction: row;
  gap: ${({ theme }: any) => spaceCss(theme, 'md')};
  padding-horizontal: ${({ theme }: any) => sheetPadding(theme)};
  padding-bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
`
