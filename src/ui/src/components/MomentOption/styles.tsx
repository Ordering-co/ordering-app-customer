import styled from 'styled-components/native'
import { controlHeightCss, spaceCss } from '@/theme/helpers'

const px = (value: number) => `${value}px`
// `components.date_strip` (the days) and `components.list_row` (time rows).
const row = (theme: any) => theme.native.components.list_row.base

export const Container = styled.ScrollView`
  flex: 1;
  background-color: ${({ theme }: any) => theme.native.tokens.color.background};
`

export const HeaderWrapper = styled.View`
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
`

/** The strip of days (`components.date_strip`: the gap between days is its `gap`). */
export const DayTabsRow = styled.View`
  flex-grow: 1;
  flex-direction: row;
  gap: ${({ theme }: any) => px(theme.native.components.date_strip.base.gap)};
`

/** A day or the ASAP card: `date_strip` at rest (the selected look comes from `useMomentLooks`). */
export const DayTabCard = styled.View`
  align-items: center;
  justify-content: center;
  padding-horizontal: ${({ theme }: any) => spaceCss(theme, 'md')};
`

/** One cell of the strip: the "Today" tag above its card, both centered. */
export const DayCell = styled.View`
  align-items: center;
`

/** The "Today" tag's room: its own text is `OText preset='caption' color='primary'`, no fill. */
export const DayTag = styled.View`
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'xxs')};
`

/** The "First available day" hint under the strip. */
export const StripHint = styled.View`
  margin-top: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const SectionWrapper = styled.View`
  margin-top: ${({ theme }: any) => spaceCss(theme, 'xl')};
`

export const OptionRow = styled.View`
  flex-direction: row;
  align-items: center;
  min-height: ${({ theme }: any) => controlHeightCss(theme, 'xl')};
  gap: ${({ theme }: any) => px(row(theme).gap)};
  padding-vertical: ${({ theme }: any) => px(row(theme).padding_y)};
`

export const OptionLabels = styled.View`
  flex: 1;
`

export const EmptyWrapper = styled.View`
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'xxxl')};
  align-items: center;
`
