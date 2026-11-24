import styled from 'styled-components/native'
import { borderCss, gutterCss, radiusCss, spaceCss } from '@/theme/helpers'
import OImageBackground from '../shared/OImageBackground'

const px = (value: number) => `${value}px`
// `components.divider`: the band between blocks, the line above the actions.
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
  margin-vertical: ${({ theme }: any) => spaceCss(theme, 'xl')};
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
`

export const Divider = styled.View`
  width: 100%;
  height: ${({ theme }: any) => px(band(theme).borderWidth)};
  background-color: ${({ theme }: any) => band(theme).borderColor};
`

export const ScheduleWrapper = styled.View`
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
  margin-top: ${({ theme }: any) => spaceCss(theme, 'xl')};
`

export const ButtonWrapper = styled.View`
  justify-content: center;
  flex-direction: row;
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'md')};
  margin-top: ${({ theme }: any) => spaceCss(theme, 'xl')};
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'xxl')};
  width: 100%;
  border-top-width: ${({ theme }: any) => px(line(theme).borderWidth)};
  border-top-color: ${({ theme }: any) => line(theme).borderColor};
`

export const CalendarWrapper = styled.View`
  flex: 1;
  ${({ theme }: any) => borderCss(theme, 'thin', 'border')}
  border-radius: ${({ theme }: any) => radiusCss(theme, 'sm')};
  padding: ${({ theme }: any) => spaceCss(theme, 'md')};
`

export const TitleRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
`
