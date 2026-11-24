import styled from 'styled-components/native';
import { spaceCss } from '@/theme/helpers';

export const PCContainer = styled.View`
  margin-top: ${({ theme }: any) => spaceCss(theme, 'lg')};
`;

export const PCForm = styled.View`
  display: flex;
  flex-direction: column;
  align-items: center;
`

export const PCWrapper = styled.View`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`
