import styled from 'styled-components/native'
import { spaceCss } from '@/theme/helpers'

// `components.driver_tips` (gap, subtitle) and its tips are `chip`s of the theme.
const tips = (theme: any) => theme.native.components.driver_tips.base
const chip = (theme: any) => theme.native.components.chip
const px = (value: number) => `${value}px`

export const DTContainer = styled.View`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
`

/** The tips: one row from the page's start edge that scrolls sideways, as every row of chips. */
export const DTWrapperTips = styled.ScrollView.attrs(({ theme }: any) => ({
  horizontal: true,
  showsHorizontalScrollIndicator: false,
  contentContainerStyle: { gap: tips(theme).gap, alignItems: 'center' }
}))`
  width: 100%;
  flex-grow: 0;
  margin-top: ${({ theme }: any) => spaceCss(theme, 'md')};
`

/** A tip: the box of a `chip` at its `md` size (look painted by the component). */
export const DTCard = styled.View`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: ${({ theme }: any) => px(chip(theme).sizes.md.height)};
  padding-horizontal: ${({ theme }: any) => px(chip(theme).sizes.md.padding_x)};
  border-radius: ${({ theme }: any) => px(chip(theme).base.radius)};
`

export const DTForm = styled.View`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`

export const DTLabel = styled.View`
  align-self: flex-start;
  margin-top: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const DTWrapperInput = styled.View`
  gap: ${({ theme }: any) => px(tips(theme).gap)};
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  margin-top: ${({ theme }: any) => spaceCss(theme, 'md')};
`

export const DTCardLoader = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  justify-content: center;
  align-items: center;
`
