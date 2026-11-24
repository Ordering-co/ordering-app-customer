import styled from 'styled-components/native'
import { borderCss, gutterCss, radiusCss, spaceCss } from '@/theme/helpers'

const px = (value: number) => `${value}px`
// `components.progress`: track, fill, radius and the `sm` bar height.
const progress = (theme: any) => theme.native.components.progress

export const ProgressContainer = styled.View<{ variant: 'compact' | 'full' }>`
  background-color: ${({ theme }: any) => theme.native.tokens.color.surface_alt};
  ${({ theme }: any) => borderCss(theme, 'thin', 'border')}
  border-radius: ${({ theme }: any) => radiusCss(theme, 'sm')};
  margin-horizontal: ${({ theme }: any) => gutterCss(theme)};
  margin-top: ${({ theme, variant }: any) => variant === 'compact' ? '0px' : spaceCss(theme, 'sm')};
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'sm')};
  padding: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const MessageRow = styled.View`
  align-items: center;
  flex-direction: row;
`

export const MessageContent = styled.View`
  flex: 1;
`

export const ProgressTrack = styled.View`
  background-color: ${({ theme }: any) => progress(theme).base.track};
  border-radius: ${({ theme }: any) => px(progress(theme).base.radius)};
  height: ${({ theme }: any) => px(progress(theme).sizes.sm.height)};
  margin-top: ${({ theme }: any) => spaceCss(theme, 'sm')};
  overflow: hidden;
  width: 100%;
`

export const ProgressFill = styled.View<{ progressPercent: number }>`
  background-color: ${({ theme }: any) => progress(theme).base.fill};
  border-radius: ${({ theme }: any) => px(progress(theme).base.radius)};
  height: 100%;
  width: ${(props: any) => `${Math.max(0, Math.min(100, props.progressPercent))}%`};
`
