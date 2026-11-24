import styled from 'styled-components/native';
import { spaceCss } from '@/theme/helpers';

const px = (value: number) => `${value}px`

export const UDForm = styled.View`
  align-items: center;
  width: 100%;
  margin-top: ${({ theme }: any) => spaceCss(theme, 'lg')};
`

export const UDWrapper = styled.View`
  align-items: center;
  width: 100%;
  margin-top: ${({ theme }: any) => spaceCss(theme, 'lg')};
`

export const UDLoader = styled.View`
  width: 100%;
  justify-content: center;
  flex-wrap: wrap;
`

export const WrapperPhone = styled.View`
  margin-bottom: ${({ theme }: any) => px(theme.native.components.field.base.gap)};
  width: 100%;
`
