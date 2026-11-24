import styled from 'styled-components/native'
import { gutterCss, spaceCss, themeSpace } from '@/theme/helpers'

export const AddressFormContainer = styled.View`
  flex: 1;
  padding: ${({ theme }: any) => gutterCss(theme)};
  background-color: ${({ theme }: any) => theme.native.tokens.color.background};
  justify-content: space-between;
`

/** The tags: one row that scrolls sideways, as the address list's tag filter (never wrapped). */
export const TagContainer = styled.ScrollView.attrs(({ theme }: any) => ({
  horizontal: true,
  showsHorizontalScrollIndicator: false,
  contentContainerStyle: { gap: themeSpace(theme, 'sm') }
}))`
  flex-grow: 0;
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
`

export const AutocompleteInput = styled.View`
  z-index: 1000;
`

export const GoogleMapContainer = styled.View`
  flex: 1;
`

export const FormInput = styled.View`
  display: flex;
  flex-direction: column;
`
