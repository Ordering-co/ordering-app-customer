import styled from 'styled-components/native'
import { radiusCss, spaceCss, textCss } from '@/theme/helpers'

// `components.cookie_banner`: its background, text color, radius and shadow.
const banner = (theme: any) => theme.native.components.cookie_banner.base
const px = (value: number) => `${value}px`

export const BannerContainer = styled.View`
  position: absolute;
  right: ${({ theme }: any) => spaceCss(theme, 'sm')};
  left: ${({ theme }: any) => spaceCss(theme, 'sm')};
  z-index: 9999;
  background-color: ${({ theme }: any) => banner(theme).background};
  padding: ${({ theme }: any) => spaceCss(theme, 'lg')};
  border-radius: ${({ theme }: any) => px(banner(theme).radius)};
`

export const BannerContent = styled.View`
  align-items: center;
`

export const BannerText = styled.Text`
  ${({ theme }: any) => textCss(theme, 'body')}
  color: ${({ theme }: any) => banner(theme).color};
  text-align: center;
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'md')};
`

export const BannerLink = styled.Text`
  color: ${({ theme }: any) => banner(theme).color};
  text-decoration-line: underline;
`

export const BannerActions = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }: any) => spaceCss(theme, 'md')};
`

export const OptOutButton = styled.TouchableOpacity`
  justify-content: center;
  min-height: ${({ theme }: any) => px(theme.native.tokens.size.md)};
  padding-horizontal: ${({ theme }: any) => spaceCss(theme, 'md')};
`

export const AcceptButton = styled.TouchableOpacity`
  justify-content: center;
  min-height: ${({ theme }: any) => px(theme.native.tokens.size.md)};
  background-color: ${({ theme }: any) => banner(theme).color};
  border-radius: ${({ theme }: any) => radiusCss(theme, 'md')};
  padding-horizontal: ${({ theme }: any) => spaceCss(theme, 'xl')};
`

export const OptOutButtonText = styled.Text`
  ${({ theme }: any) => textCss(theme, 'button')}
  color: ${({ theme }: any) => banner(theme).color};
  text-decoration-line: underline;
`

export const AcceptButtonText = styled.Text`
  ${({ theme }: any) => textCss(theme, 'button')}
  color: ${({ theme }: any) => banner(theme).background};
`
