import styled from 'styled-components/native'
import { themeColor } from '@/theme/helpers'

export const ListWrapper = styled.View`
  background-color: ${({ theme }: any) => themeColor(theme, 'surface')};
`;
