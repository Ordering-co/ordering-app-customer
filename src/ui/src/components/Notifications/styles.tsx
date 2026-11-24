import styled from 'styled-components/native'
import { gutterCss, spaceCss } from '@/theme/helpers'

const row = (theme: any) => theme.native.components.list_row.base
const px = (value: number) => `${value}px`

// Under the NavBar, which already keeps the safe area: no second top inset.
export const ScreenContainer = styled.View`
  flex: 1;
`;

export const ContentContainer = styled.ScrollView`
  flex: 1;
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
  padding-top: ${({ theme }: any) => spaceCss(theme, 'lg')};
`;

export const SettingsWrapper = styled.View`
  flex-grow: 1;
`;

export const SettingItem = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background-color: ${({ theme }: any) => row(theme).background};
  padding-vertical: ${({ theme }: any) => px(row(theme).padding_y)};
  border-bottom-width: ${({ theme }: any) => px(row(theme).divider.borderWidth ?? 0)};
  border-bottom-color: ${({ theme }: any) => row(theme).divider.borderColor ?? 'transparent'};
`;
