import styled from 'styled-components/native'
import { PressableScale } from '../shared/PressableScale'
import { nativeBoxStyle, spaceCss } from '@/theme/helpers'

// A student to pick is a choice (`components.choice`, `md`).
const choice = (theme: any) => theme.native.components.choice
const px = (value: number) => `${value}px`

export const Content = styled.View`
  padding-top: ${({ theme }: any) => spaceCss(theme, 'sm')};
  padding-horizontal: ${({ theme }: any) => spaceCss(theme, 'lg')};
  padding-bottom: ${({ theme }: any) => spaceCss(theme, 'xl')};
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const StudentButton = styled(PressableScale).attrs(({ theme }: any) => ({ style: nativeBoxStyle(choice(theme).base) }))`
  justify-content: center;
  min-height: ${({ theme }: any) => px(choice(theme).sizes.md.height)};
  padding-horizontal: ${({ theme }: any) => spaceCss(theme, 'md')};
  border-radius: ${({ theme }: any) => px(choice(theme).base.radius)};
`

export const EmptyMessage = styled.View`
  padding-bottom: ${({ theme }: any) => spaceCss(theme, 'sm')};
`
