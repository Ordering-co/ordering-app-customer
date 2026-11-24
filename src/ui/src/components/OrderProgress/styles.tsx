import styled from 'styled-components/native';
import { spaceCss } from '@/theme/helpers';

const px = (value: number) => `${value}px`
// `components.order_card` (the box) and `components.progress` (the bar, size `md`).
const card = (theme: any) => theme.native.components.order_card.base
const progress = (theme: any) => theme.native.components.progress

export const CardContainer = styled.View`
  border-radius: ${({ theme }: any) => px(card(theme).radius)};
  padding: ${({ theme }: any) => px(theme.native.components.card.base.padding)};
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
`;

export const TopRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
`;

export const InfoContainer = styled.View`
  flex: 1;
  gap: ${({ theme }: any) => spaceCss(theme, 'xxs')};
`;

export const ProgressBarTrack = styled.View`
  height: ${({ theme }: any) => px(progress(theme).sizes.sm.height)};
  width: 100%;
  border-radius: ${({ theme }: any) => px(progress(theme).base.radius)};
  background-color: ${({ theme }: any) => progress(theme).base.track};
  overflow: hidden;
`;

export const ProgressBarFill = styled.View`
  height: 100%;
  background-color: ${({ theme }: any) => progress(theme).base.fill};
  border-radius: ${({ theme }: any) => px(progress(theme).base.radius)};
`;

export const BottomRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  column-gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
  row-gap: ${({ theme }: any) => spaceCss(theme, 'xxs')};
`;

/** The order in progress's own box: the space around it is the listing's gap. */
export const OrderProgressWrapper = styled.View``
