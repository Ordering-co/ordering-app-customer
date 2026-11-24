import styled from 'styled-components/native'
import { gutterCss, spaceCss } from '@/theme/helpers'

const px = (value: number) => `${value}px`
// `components.divider` variant `band`: its thickness and color (a line, or none).
const band = (theme: any) => theme.native.components.divider.variants.band.line

export const UpsellingContainer = styled.ScrollView`
  margin-top: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const Divider = styled.View`
  height: ${({ theme }: any) => px(band(theme) ? band(theme).borderWidth : 0)};
  background-color: ${({ theme }: any) => band(theme) ? band(theme).borderColor : 'transparent'};
  margin-horizontal: ${({ theme }: any) => gutterCss(theme)};
`

export const SummaryWrapper = styled.View`
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
`

export const IllustrationWrapper = styled.View`
  align-items: center;
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
`

export const ComplementWrapper = styled.View`
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
  margin-top: ${({ theme }: any) => spaceCss(theme, 'lg')};
  overflow: visible;
`

export const UpsellingItem = styled.View`
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'lg')};
  margin-right: ${({ theme }: any) => spaceCss(theme, 'lg')};
`
