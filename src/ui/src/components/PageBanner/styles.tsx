import styled from 'styled-components/native'
import { gutterCss, spaceCss } from '@/theme/helpers'

// The page sides and the space above and below, unless the screen's wrapper already
// gives them (`$flush`: the listing's sections are one gap apart, the banner owns none).
export const PageBannerWrapper = styled.View`
  align-self: stretch;
  overflow: hidden;
  position: relative;
  flex-direction: row;
  align-items: center;
  margin-vertical: ${({ theme, $flush }: any) => $flush ? '0px' : spaceCss(theme, 'sm')};
  margin-horizontal: ${({ theme, $flush }: any) => $flush ? '0px' : gutterCss(theme)};
`

/** The dots over the bottom of the banner image. */
export const BannerDots = styled.View`
  position: absolute;
  left: 0px;
  right: 0px;
  bottom: ${({ theme }: any) => spaceCss(theme, 'sm')};
  align-items: center;
`
