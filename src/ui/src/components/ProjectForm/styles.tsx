import styled from 'styled-components/native'
import { controlHeightCss, gutterCss } from '@/theme/helpers'

export const Container = styled.View`
  width: 100%;
  flex: 1;
  height: ${(props: any) =>
    props?.orientation === 'Portrait' && props?.height
      ? `${props.height}px`
      : 'auto'};
`;

export const FormInput = styled.View`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: ${({ theme }: any) => controlHeightCss(theme, 'lg')};
  flex: 1;
  padding: ${({ theme }: any) => gutterCss(theme)};
`;

export const LogoWrapper = styled.View`
  align-items: center;
`;

export const ButtonWrapper = styled.View`
  padding: ${({ theme }: any) => gutterCss(theme)};
`;
