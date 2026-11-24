import styled from 'styled-components/native';
import { spaceCss } from '@/theme/helpers';

export const CContainer = styled.View``

export const CheckoutAction = styled.View`
  width: 100%;
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  margin-vertical: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const DriverTipsContainer = styled.View`
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'xs')};
`

export const BillLabel = styled.View`
  flex: 1;
  flex-direction: row;
  align-items: center;
  margin-right: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const BillLabelText = styled.View`
  flex-shrink: 1;
`

export const BillAmount = styled.View`
  flex-direction: row;
  align-items: center;
  flex-shrink: 0;
  gap: ${({ theme }: any) => spaceCss(theme, 'xs')};
`

export const BillToggle = styled.TouchableOpacity`
  flex: 1;
  flex-direction: row;
  align-items: center;
  margin-right: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const BillToggleIcon = styled.View`
  margin-left: ${({ theme }: any) => spaceCss(theme, 'xs')};
  transform: ${(props: any) => props.open ? 'rotate(180deg)' : 'rotate(0deg)'};
`

export const SpotRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-top: ${({ theme }: any) => spaceCss(theme, 'md')};
`

export const InvalidProducts = styled.View`
  align-items: center;
  width: 100%;
  margin-top: ${({ theme }: any) => spaceCss(theme, 'xs')};
`
