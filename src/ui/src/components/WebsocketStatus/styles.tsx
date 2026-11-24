import styled from 'styled-components/native'
import { spaceCss } from '@/theme/helpers'

export const Container = styled.View`
  display: flex;
  flex-direction: column;
`
export const ModalContainer = styled.ScrollView`
  padding: 0px ${({ theme }: any) => spaceCss(theme, 'xl')};
`
export const ContentWrapper = styled.View`
  align-items: center;
  width: 100%;
`
export const CurrentStatusRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'md')};
`
export const LegendWrapper = styled.View`
  align-self: center;
`
export const StatusItemWrapper = styled.View`
  flex-direction: row;
  gap: ${({ theme }: any) => spaceCss(theme, 'md')};
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'md')};
`
export const StatusDot = styled.View`
  margin-top: ${({ theme }: any) => spaceCss(theme, 'xs')};
`
export const StatusBody = styled.View`
  flex-shrink: 1;
`
export const ButtonRow = styled.View`
  flex-direction: row;
  justify-content: center;
  width: 100%;
  margin-top: ${({ theme }: any) => spaceCss(theme, 'xl')};
`
export const ReloadButtonWrapper = styled.View`
  width: 60%;
`
