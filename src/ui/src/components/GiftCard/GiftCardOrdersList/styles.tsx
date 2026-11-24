import styled from 'styled-components/native';
import { spaceCss } from '@/theme/helpers'

const band = (theme: any) => theme.native.components.divider.variants.band.line
const px = (value: number) => `${value}px`

export const Container = styled.View`
`

/** The full-bleed band between groups (`divider.band`, out to the page sides). */
export const Band = styled.View`
  height: ${({ theme }: any) => px(band(theme).borderWidth)};
  background-color: ${({ theme }: any) => band(theme).borderColor};
  margin-horizontal: ${({ theme }: any) => px(-theme.native.tokens.layout.page_gutter)};
`

export const NoOrdersWrapper = styled.View`
  margin-vertical: ${({ theme }: any) => spaceCss(theme, 'lg')};
  align-items: center;
`
