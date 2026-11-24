import styled from 'styled-components/native'
import { controlHeightCss, gutterCss, spaceCss } from '@/theme/helpers'

/** The fixed top bar over the storefront and the space under it. */
export const HeaderWrapper = styled.View`
  margin-bottom: ${({ theme, flush }: any) => flush ? '0px' : spaceCss(theme, 'lg')};
`

/** The space that opens the menu, under the category bar. */
export const MenuTop = styled.View`
  height: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

/** The end of the menu: its closing space and the room for the floating view-order bar (a control of size `xl`). */
export const MenuEnd = styled.View`
  padding-top: ${({ theme }: any) => spaceCss(theme, 'sm')};
  padding-bottom: ${({ theme }: any) => controlHeightCss(theme, 'xl')};
`

/** A row of the menu that is not a product, on the page sides. */
export const MenuSides = styled.View`
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
`

export const ProfessionalFilterWrapper = styled.View`
  padding-left: ${({ theme }: any) => gutterCss(theme)};
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'xl')};
`
