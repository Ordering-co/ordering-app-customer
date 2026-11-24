import styled from 'styled-components/native';
import { FlatList } from 'react-native';
import { borderCss, gutterCss, radiusCss, spaceCss } from '@/theme/helpers';

const px = (value: number) => `${value}px`;
const row = (theme: any) => theme.native.components.list_row.base;

export const ScreenContainer = styled.View`
  background-color: ${({ theme }: any) => theme.native.tokens.color.background};
  margin-top: ${({ theme }: any) => spaceCss(theme, 'lg')};
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'xl')};
`;

export const LanguageList = styled(FlatList)`
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
`;

// `list_row`: padding, gap and divider.
export const LanguageItemContainer = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }: any) => px(row(theme).gap)};
  padding-vertical: ${({ theme }: any) => px(row(theme).padding_y)};
  background-color: ${({ theme }: any) => row(theme).background};
  border-bottom-width: ${({ theme }: any) => px(row(theme).divider.borderWidth)};
  border-bottom-color: ${({ theme }: any) => row(theme).divider.borderColor};
`;

export const WrapperFlag = styled.View`
  border-radius: ${({ theme }: any) => radiusCss(theme, 'md')};
  padding: ${({ theme }: any) => spaceCss(theme, 'sm')};
  ${({ theme }: any) => borderCss(theme, 'thin', 'border', { fixed: true })}
`;

// A radio (`components.radio`): a ring of its size, in its checked or unchecked color.
export const RadioButtonOuter = styled.View<{ isSelected?: boolean }>`
  width: ${({ theme }: any) => theme.native.components.radio.base.size}px;
  height: ${({ theme }: any) => theme.native.components.radio.base.size}px;
  border-radius: ${({ theme }: any) => radiusCss(theme, 'full', { fixed: true })};
  border-width: ${({ theme }: any) => theme.native.tokens.border.thick}px;
  border-color: ${({ theme, isSelected }: any) => isSelected ? theme.native.components.radio.base.checked : theme.native.components.radio.base.unchecked};
  align-items: center;
  justify-content: center;
`;

export const RadioButtonInner = styled.View`
  width: ${({ theme }: any) => px(theme.native.components.radio.base.size / 2)};
  height: ${({ theme }: any) => px(theme.native.components.radio.base.size / 2)};
  border-radius: ${({ theme }: any) => radiusCss(theme, 'full', { fixed: true })};
  background-color: ${({ theme }: any) => theme.native.components.radio.base.checked};
`;
