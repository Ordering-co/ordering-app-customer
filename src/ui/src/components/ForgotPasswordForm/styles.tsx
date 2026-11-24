import styled from 'styled-components/native';
import { spaceCss } from '@/theme/helpers';

export const Container = styled.View`
  padding-bottom: ${({ theme }: any) => spaceCss(theme, 'xxl')};
`
