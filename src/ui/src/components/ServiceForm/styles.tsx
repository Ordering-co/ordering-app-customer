import styled from 'styled-components/native'
import { borderCss, gutterCss, radiusCss, spaceCss } from '@/theme/helpers'
import { PressableScale } from '../shared/PressableScale'
import OImageBackground from '../shared/OImageBackground'

const px = (value: number) => `${value}px`
// `components.divider`: the band between blocks, the line between rows.
const band = (theme: any) => theme.native.components.divider.variants.band.line
const line = (theme: any) => theme.native.components.divider.variants.item.line

export const Container = styled.ScrollView``

export const ProfessionalPhoto = styled(OImageBackground)`
  width: 100%;
  position: relative;
  max-height: 258px;
  height: 258px;
  resize-mode: cover;
`;

export const InfoWrapper = styled.View`
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
  margin-vertical: ${({ theme }: any) => spaceCss(theme, 'xl')};
`

export const Divider = styled.View`
  width: 100%;
  height: ${({ theme }: any) => px(band(theme).borderWidth)};
  background-color: ${({ theme }: any) => band(theme).borderColor};
`

export const ProfessionalWrapper = styled.View`
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
  margin-top: ${({ theme }: any) => spaceCss(theme, 'xl')};
`

export const ScheduleWrapper = styled(ProfessionalWrapper)``

export const CalendarWrapper = styled.View`
  flex: 1;
  ${({ theme }: any) => borderCss(theme, 'thin', 'border')}
  border-radius: ${({ theme }: any) => radiusCss(theme, 'sm')};
  padding: ${({ theme }: any) => spaceCss(theme, 'md')};
`

export const ButtonWrapper = styled.View`
  justify-content: space-between;
  align-items: center;
  flex-direction: row;
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'md')};
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
  margin-top: ${({ theme }: any) => spaceCss(theme, 'xl')};
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'xxl')};
  width: 100%;
  border-top-width: ${({ theme }: any) => px(line(theme).borderWidth)};
  border-top-color: ${({ theme }: any) => line(theme).borderColor};
`

export const TitleRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
`

// The professional select: an input-like box that opens the list.
export const ProfessionalSelect = styled(PressableScale)`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  min-height: ${({ theme }: any) => px(theme.native.components.input.sizes.md.height)};
  padding: ${({ theme }: any) => spaceCss(theme, 'sm')};
  ${({ theme }: any) => borderCss(theme, 'thin', 'border')}
  border-radius: ${({ theme }: any) => px(theme.native.components.input.base.radius)};
`

export const ProfessionalRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }: any) => spaceCss(theme, 'md')};
`
