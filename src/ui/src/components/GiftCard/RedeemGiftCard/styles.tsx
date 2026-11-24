import styled from 'styled-components/native'
import { gutterCss, spaceCss } from '@/theme/helpers'

const item = (theme: any) => theme.native.components.divider.variants.item.line
const px = (value: number) => `${value}px`

export const Container = styled.View`
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
`
export const FormController = styled.View`
`
export const RedeemedDetails = styled.View`
  padding-bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
`
export const RedeemedHeader = styled.View`
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'sm')};
  padding-bottom: ${({ theme }: any) => spaceCss(theme, 'sm')};
  border-bottom-width: ${({ theme }: any) => px(item(theme).borderWidth)};
  border-bottom-color: ${({ theme }: any) => item(theme).borderColor};
`
