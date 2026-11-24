import styled from 'styled-components/native'
import { gutterCss } from '@/theme/helpers'

// Room below the list so its last store clears the modal's bottom edge: layout, not spacing.
const LIST_BOTTOM_CLEARANCE = 140

export const Container = styled.View`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  width: 100%;
`

export const ItemListing = styled.ScrollView`
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
  margin-bottom: ${LIST_BOTTOM_CLEARANCE}px;
`
