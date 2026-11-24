import styled from 'styled-components/native';
import { gutterCss, spaceCss } from '@/theme/helpers';
import OImageBackground from '../shared/OImageBackground'

export const BackgroundImage = styled(OImageBackground)`
  flex: 1;
  justify-content: center;
`;

// The hero's overlay over the photo (`home_hero.overlay`).
export const Overlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ theme }: any) => theme.native.components.home_hero.base.overlay};
`;

export const SafeContainer = styled.View`
  flex: 1;
  align-items: center;
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
`;

export const TopContent = styled.View`
  width: 100%;
  align-items: flex-start;
`;

export const WrapperBtn = styled.View`
  width: 100%;
  margin-top: auto;
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
`;
