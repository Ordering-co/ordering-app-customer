import styled from 'styled-components/native'
import { gutterCss, spaceCss } from '@/theme/helpers'

const px = (value: number) => `${value}px`
const row = (theme: any) => theme.native.components.list_row.base

export const Container = styled.ScrollView`
  position: relative;
  flex: 1;
  padding: ${({ theme }: any) => gutterCss(theme)};
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'xxl')};
  padding-top: ${({ theme }: any) => spaceCss(theme, 'lg')};
`

// `list_row`: its vertical padding and gap.
export const AddressItem = styled.TouchableOpacity.attrs(({ theme }: any) => ({
  activeOpacity: theme.native.tokens.opacity.pressed
}))`
  padding-vertical: ${({ theme }: any) => px(row(theme).padding_y)};
  gap: ${({ theme }: any) => px(row(theme).gap)};
  flex-direction: row;
  justify-content: center;
  align-items: center;
`
