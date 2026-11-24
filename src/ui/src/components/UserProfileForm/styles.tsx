import FastImage from 'react-native-fast-image';
import styled from 'styled-components/native'
import { gutterCss, spaceCss, themeColor } from '@/theme/helpers';

export const Container = styled.ScrollView`
  position: relative;
  flex: 1;
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'xxl')};
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
`

export const ProfileHeader = styled.View`
  margin-top: ${({ theme }: any) => spaceCss(theme, 'lg')};
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  border-radius: ${({ theme }: any) => `${theme.native.components.card.base.radius}px`};
  background-color: ${({ theme }: any) => themeColor(theme, 'surface_alt')};
  padding: ${({ theme }: any) => spaceCss(theme, 'sm')} ${({ theme }: any) => spaceCss(theme, 'md')};
`;

export const ProfileImage = styled(FastImage)``;

export const EditIconWrapper = styled.View`
  position: absolute;
  bottom: 0;
  right: 0;
`;
