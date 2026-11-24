import React from 'react'
import styled from 'styled-components/native'
import { spaceCss } from '@/theme/helpers'
import { OText } from '../shared'
import { PressableScale } from '../shared/PressableScale'

// The notice box is the `student_selector` of the theme (background, radius).
const selector = (theme: any) => theme.native.components.student_selector.base
const px = (value: number) => `${value}px`

export const Container = styled.View`
  padding-top: ${({ theme }: any) => spaceCss(theme, 'sm')};
  padding-bottom: ${({ theme }: any) => spaceCss(theme, 'xs')};
`

export const Label = ({ children }: { children?: React.ReactNode }) => (
  <OText preset='body_lg' weight={700} mBottom='sm'>{children}</OText>
)

export const Notice = styled.View`
  margin-top: ${({ theme }: any) => spaceCss(theme, 'sm')};
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'md')};
  padding: ${({ theme }: any) => spaceCss(theme, 'sm')} ${({ theme }: any) => spaceCss(theme, 'md')};
  border-radius: ${({ theme }: any) => px(selector(theme).radius)};
  background-color: ${({ theme }: any) => selector(theme).background};
`

/** A text link with a 44 pt touch target. */
export const AddStudentLink = styled(PressableScale)`
  align-self: flex-start;
  justify-content: center;
  min-height: ${({ theme }: any) => px(theme.native.tokens.size.md)};
`
