import styled, { css } from 'styled-components/native';
import { themeColor } from '@/theme/helpers';

export const Container = styled.View`
  width: 100%;
  justify-content: space-between;
`

export const ErrorMessage = styled.View`
  color: ${(props: any) => themeColor(props.theme, 'danger')};
  font-size: 24px;
  padding-left: 10px;
  font-weight: bold;
  opacity: 0.8;
`;
