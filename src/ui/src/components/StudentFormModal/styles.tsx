import React from 'react'
import styled, { useTheme } from 'styled-components/native'
import { nativeBoxStyle, nativeTextStyle, spaceCss } from '@/theme/helpers'
import { OText } from '../shared'

// Labels and spacing of a `field`; the read-only school takes the `input` look; chips are `chip`s.
const field = (theme: any) => theme.native.components.field.base
const input = (theme: any) => theme.native.components.input
const chip = (theme: any) => theme.native.components.chip
const px = (value: number) => `${value}px`

export const Form = styled.View`
  padding-top: ${({ theme }: any) => spaceCss(theme, 'xs')};
  padding-bottom: ${({ theme }: any) => spaceCss(theme, 'xl')};
`

export const Field = styled.View`
  margin-bottom: ${({ theme }: any) => px(field(theme).gap)};
`

/** A field's label: the `field` label text, color and gap of the theme. */
export const Label = ({ children }: { children?: React.ReactNode }) => {
  const theme: any = useTheme()
  const base = field(theme)
  return (
    <OText style={{ ...nativeTextStyle(base.label), marginBottom: base.label_gap }} color={base.label_color}>
      {children}
    </OText>
  )
}

export const ReadonlyField = styled.View.attrs(({ theme }: any) => ({
  style: nativeBoxStyle(input(theme).base)
}))`
  justify-content: center;
  min-height: ${({ theme }: any) => px(input(theme).sizes.md.height)};
  padding-horizontal: ${({ theme }: any) => px(input(theme).base.padding_x)};
  border-radius: ${({ theme }: any) => px(input(theme).base.radius)};
`

export const ChipGroup = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${({ theme }: any) => px(chip(theme).base.gap)};
`

/** A chip at its `sm` size (look painted by the component; touch target grown by `hitSlop`). */
export const Chip = styled.View`
  justify-content: center;
  min-height: ${({ theme }: any) => px(chip(theme).sizes.sm.height)};
  padding-horizontal: ${({ theme }: any) => px(chip(theme).sizes.sm.padding_x)};
  border-radius: ${({ theme }: any) => px(chip(theme).base.radius)};
`

export const Actions = styled.View`
  margin-top: ${({ theme }: any) => spaceCss(theme, 'sm')};
`
