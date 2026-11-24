import styled from 'styled-components/native';
import { spaceCss } from '@/theme/helpers';

export const Card = styled.View`
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
  border-radius: ${({ theme }: any) => `${theme.native.components.cart.base.radius}px`};
  width: 100%;
  position: relative;
`

export const BusinessContent = styled.View`
  border-radius: ${({ theme }: any) => `${theme.native.components.cart.base.radius}px`};
  overflow: visible;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
`;

export const BusinessInfo = styled.View`
  width: 70%;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
`;

export const BusinessActions = styled.View`
  width: 30%;
  flex-direction: column;
  align-items: flex-end;
`

export const Metadata = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
`;

export const Reviews = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }: any) => spaceCss(theme, 'xxs')};
  margin-top: ${({ theme }: any) => spaceCss(theme, 'xs')};
`

export const BtnWrapper = styled.View`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`
