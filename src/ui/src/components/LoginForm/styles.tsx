import styled from 'styled-components/native';
import { gutterCss, spaceCss, themeColor } from '@/theme/helpers';

export const Container = styled.ScrollView`
  padding-top: ${({ theme }: any) => spaceCss(theme, 'lg')};
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
`

export const FormSide = styled.View`
  display: flex;
  width: 100%;
  flex-direction: column;
  /* Everything on the page's start edge (tabs, links), as the rest of the app. */
  align-items: stretch;
  margin: auto;
`;

export const FormInput = styled.View`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-top: ${({ theme }: any) => spaceCss(theme, 'lg')};
  padding-bottom: ${({ theme }: any) => spaceCss(theme, 'md')};
`

export const ButtonsWrapper = styled.View`
  margin-top: ${({ theme }: any) => spaceCss(theme, 'sm')};
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
  width: 100%;
  display: flex;
  flex-direction: column;
`

export const ContainerFloatBtns = styled.View`
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'sm')};
  flex-direction: column;
  width: 100%;
  justify-content: space-between;
  background-color: ${({ theme }: any) => themeColor(theme, 'background')};
`
