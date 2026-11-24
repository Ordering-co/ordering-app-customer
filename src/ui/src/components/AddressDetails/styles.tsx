import styled from 'styled-components/native';
import { spaceCss } from '@/theme/helpers';

export const ADContainer = styled.View`
  display: flex;
  flex-direction: column;
  width: 100%;
`

export const ADHeader = styled.View`
  display: flex;
  justify-content: flex-start;
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const ADAddress = styled.View`
  flex-direction: row;
  justify-content: space-between;
  /* The address beside its edit button, on one line. */
  align-items: center;
`

export const ADMap = styled.View`
  width: 100%;
`
