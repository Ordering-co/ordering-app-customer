import styled from 'styled-components/native';
import { gutterCss, spaceCss } from '@/theme/helpers';

export const Container = styled.View`
  width: 100%;
  padding-top: ${({ theme }: any) => spaceCss(theme, 'lg')};
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
`

export const CountDownContainer = styled.View`
  align-self: center;
  justify-content: center;
`

export const ResendSection = styled.View`
  flex-direction: row;
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'xl')};
`

export const WrappCountdown = styled.View`
  padding-top: ${({ theme }: any) => spaceCss(theme, 'lg')};
  padding-bottom: ${({ theme }: any) => spaceCss(theme, 'xxl')};
`

export const InputsSection = styled.View`
  flex-direction: row;
  justify-content: center;
`

export const ErrorSection = styled.View`
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
  width: 100%;
  justify-content: center;
`
