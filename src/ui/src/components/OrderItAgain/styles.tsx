import styled from 'styled-components/native'
import { spaceCss } from '@/theme/helpers'

export const Container = styled.View``

/** A tile of the carousel: the space between tiles and above and below them. */
export const ProductWrapper = styled.View`
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'lg')};
  margin-right: ${({ theme }: any) => spaceCss(theme, 'lg')};
`
