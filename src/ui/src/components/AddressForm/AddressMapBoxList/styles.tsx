import styled from 'styled-components/native'
import { spaceCss } from '@/theme/helpers'

// A suggestion under the field: a row of the suggestions' menu (its look comes from `suggestionLook`).
export const AddressSuggestContainer = styled.Pressable`
  width: 100%;
  z-index: 1000;
  bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
`
