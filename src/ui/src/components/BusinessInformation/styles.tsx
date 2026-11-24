import styled from 'styled-components/native'
import { radiusCss, spaceCss, themeColor } from '@/theme/helpers'

const px = (value: number) => `${value}px`

export const BusinessInformationContainer = styled.View`
  width: 100%;
  height: 100%;
`
export const WrapMainContent = styled.ScrollView``

export const MediaWrapper = styled.ScrollView`
  margin-top: ${({ theme }: any) => spaceCss(theme, 'sm')};
  height: 127px;
`
export const InnerContent = styled.View`
  padding: ${({ theme }: any) => spaceCss(theme, 'lg')};
`
export const WrapBusinessMap = styled.View`
  flex: 1;
  height: 135px;
  border-radius: ${({ theme }: any) => radiusCss(theme, 'xxl')};
  margin-top: ${({ theme }: any) => spaceCss(theme, 'lg')};
  overflow: hidden;
`
/** Between the blocks of the modal: the `section` divider's line. */
export const DivideView = styled.View`
  margin-vertical: ${({ theme }: any) => spaceCss(theme, 'lg')};
  ${({ theme }: any) => {
    const line = theme.native.components.divider.variants.section.line
    return line.borderWidth ? `border-top-width: ${px(line.borderWidth)}; border-top-color: ${line.borderColor};` : ''
  }}
`

export const ScheduleContainer = styled.View``

/** The opening hours: a soft block. */
export const ScheduleCard = styled.View`
  background-color: ${({ theme }: any) => themeColor(theme, 'surface_alt')};
  border-radius: ${({ theme }: any) => radiusCss(theme, 'xl')};
  padding: ${({ theme }: any) => spaceCss(theme, 'lg')};
  margin-top: ${({ theme }: any) => spaceCss(theme, 'lg')};
`

export const DayRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'sm')};
`
