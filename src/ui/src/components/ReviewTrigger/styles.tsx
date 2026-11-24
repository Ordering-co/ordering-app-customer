import styled from 'styled-components/native'
import { controlHeightCss, gutterCss, spaceCss } from '@/theme/helpers'

export const ReviewOrderContainer = styled.ScrollView`
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
`

export const BusinessLogo = styled.View`
  margin-vertical: ${({ theme }: any) => spaceCss(theme, 'xs')};
  align-items: center;
`

export const ActionContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const RatingStarContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }: any) => spaceCss(theme, 'md')};
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
`

export const MultiLogosContainer = styled.View`
  justify-content: space-around;
  flex-direction: row;
  width: 100%;
`

// The order's logo (layout: a square of the extra-large control height).
export const LogoWrapper = styled.View`
  border-radius: ${({ theme }: any) => `${theme.native.components.order_details.base.business_logo_radius}px`};
  overflow: hidden;
  width: ${({ theme }: any) => controlHeightCss(theme, 'xl')};
  height: ${({ theme }: any) => controlHeightCss(theme, 'xl')};
`
