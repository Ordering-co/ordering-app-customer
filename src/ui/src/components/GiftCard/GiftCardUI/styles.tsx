import styled from 'styled-components/native'
import { gutterCss, spaceCss, themeColor } from '@/theme/helpers'

// The gift card screen: the hero takes `components.gift_card` (radius) over
// a brand gradient; the intro is split from the purchase by a `section` divider.
const px = (value: number) => `${value}px`
const section = (theme: any) => theme.native.components.divider.variants.section

export const Container = styled.View`
  width: 100%;
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'lg')};
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
`

// React Native's own `backgroundImage` (0.88): corner to corner, as the
// former react-native-linear-gradient start {0,0} / end {1,1}.
export const HeroCard = styled.View`
  background-image: ${({ theme }: any) =>
    `linear-gradient(to bottom right, ${themeColor(theme, 'primary')}, ${themeColor(theme, 'success')})`};
  border-radius: ${({ theme }: any) => px(theme.native.components.gift_card.base.radius)};
  padding: ${({ theme }: any) => spaceCss(theme, 'lg')};
  min-height: 210px;
  overflow: hidden;
  justify-content: space-between;
`

export const HeroChip = styled.View`
  flex-direction: row;
  align-items: center;
  align-self: flex-start;
  gap: ${({ theme }: any) => spaceCss(theme, 'xs')};
  background-color: rgba(255, 255, 255, 0.2);
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'xs')};
  padding-horizontal: ${({ theme }: any) => spaceCss(theme, 'md')};
  border-radius: ${({ theme }: any) => px(theme.native.tokens.radius.full)};
`

/** A large decorative glyph bleeding off the hero's corner (layout offsets). */
export const HeroWatermark = styled.View`
  position: absolute;
  right: -18px;
  bottom: -26px;
`

export const HeroTitleWrap = styled.View`
  margin-top: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const Intro = styled.View`
  margin-top: ${({ theme }: any) => spaceCss(theme, 'lg')};
`

export const Divider = styled.View`
  border-bottom-width: ${({ theme }: any) => px(section(theme).line.borderWidth)};
  border-bottom-color: ${({ theme }: any) => section(theme).line.borderColor};
  margin-vertical: ${({ theme }: any) => spaceCss(theme, 'lg')};
`

export const ActionWrapper = styled.View`
  margin-top: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const RedeemWrapper = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-top: ${({ theme }: any) => spaceCss(theme, 'sm')};
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
`
