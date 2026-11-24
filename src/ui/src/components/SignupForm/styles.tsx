import styled from 'styled-components/native';
import { gutterCss, spaceCss, themeColor } from '@/theme/helpers';

export const FormSide = styled.View`
  display: flex;
  width: 100%;
  flex-direction: column;
  /* Everything on the page's start edge (tabs, links), as the rest of the app. */
  align-items: stretch;
  margin: auto;
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
`;
export const FormInput = styled.View`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-top: ${({ theme }: any) => spaceCss(theme, 'lg')};
`

export const ContainerFloatBtns = styled.View`
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'sm')};
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
  flex-direction: column;
  width: 100%;
  justify-content: space-between;
  background-color: ${({ theme }: any) => themeColor(theme, 'background')};
`
