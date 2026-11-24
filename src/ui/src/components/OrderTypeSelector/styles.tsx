import styled from 'styled-components/native'
import { gutterCss, spaceCss } from '@/theme/helpers'

const px = (value: number) => `${value}px`

export const GridContainer = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: flex-start;
  /* One gap between cards, across and down (the card width leaves room for it). */
  gap: ${({ theme }: any) => spaceCss(theme, 'lg')};
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
  padding-top: ${({ theme }: any) => spaceCss(theme, 'lg')};
`;

// A selectable card: `components.choice` (its resting box here, the selected
// and disabled states from the screen).
export const TypeCard = styled.View`
  aspect-ratio: 1;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }: any) => spaceCss(theme, 'sm')};
  border-radius: ${({ theme }: any) => px(theme.native.components.choice.base.radius)};
`;

export const TypeIconWrapper = styled.View`
  margin-bottom: ${({ theme }: any) => px(theme.native.components.choice.base.gap)};
`;

export const EmptyWrapper = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

export const Filler = styled.View`
  flex: 1;
`;
