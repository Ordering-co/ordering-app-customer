import styled from 'styled-components/native'
import { gutterCss } from '@/theme/helpers'

const px = (value: number) => `${value}px`
// `components.bottom_bar`: background, top border, shadow and padding.
const bar = (theme: any) => theme.native.components.bottom_bar.base

export const Container = styled.View`
  position: absolute;
  bottom: 0px;
  left: 0;
  right: 0;
  padding-top: ${({ theme }: any) => px(bar(theme).padding)};
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
  flex-direction: row;
  width: 100%;
  justify-content: space-between;
  background-color: ${({ theme }: any) => bar(theme).background};
  z-index: 20001;
`
