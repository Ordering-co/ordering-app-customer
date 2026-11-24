import styled from 'styled-components/native'
import { spaceCss } from '@/theme/helpers'

// `components.slider`: the track, its fill and the marks under it.
const slider = (theme: any) => theme.native.components.slider.base
const px = (value: number) => `${value}px`

export const ProgressContentWrapper = styled.View`
  height: ${({ theme }: any) => px(slider(theme).height)};
  border-radius: ${({ theme }: any) => px(slider(theme).radius)};
  background-color: ${({ theme }: any) => slider(theme).track};
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'sm')};
  overflow: hidden;
`

export const ProgressBar = styled.View`
  height: 100%;
  background-color: ${({ theme }: any) => slider(theme).fill};
`

export const MaxContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
`

export const SectionWrapper = styled.View`
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
`
