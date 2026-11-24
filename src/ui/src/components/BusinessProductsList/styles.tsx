import styled from 'styled-components/native'
import { controlHeightCss, gutterCss, radiusCss, spaceCss } from '@/theme/helpers'

/** The list, with room at its end for the floating view-order bar (a control of size `xl`). */
export const ProductsContainer = styled.View`
  padding-bottom: ${({ theme }: any) => controlHeightCss(theme, 'xl')};
`

/** A row of the menu, on the page sides. */
export const MenuRowBox = styled.View`
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
`

export const WrapperNotFound = styled.View`
  height: 500px;
`

export const CatWrap = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

/** The category picture: a small rounded box with the soft shadow. */
export const CatIcon = styled.View`
  border-radius: ${({ theme }: any) => radiusCss(theme, 'sm')};
  margin-right: ${({ theme }: any) => spaceCss(theme, 'sm')};
`
