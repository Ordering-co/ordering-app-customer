import styled from 'styled-components/native'
import { gutterCss, spaceCss } from '@/theme/helpers'

export const Container = styled.View`
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'xl')};
`
export const FormController = styled.View`
  margin-bottom: ${({ theme }: any) => `${theme.native.components.field.base.gap}px`};
`
