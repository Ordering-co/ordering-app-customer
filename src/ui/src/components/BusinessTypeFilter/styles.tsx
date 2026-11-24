import styled from 'styled-components/native'
import { spaceCss, themeColor, themeSpace } from '@/theme/helpers';

export const CategoriesContainer = styled.View`
  background-color: ${({ theme }: any) => themeColor(theme, 'background')};
`;

export const CategoryRowScrollView = styled.ScrollView.attrs(({ isCardMode, theme }: any) => ({
  horizontal: true,
  showsHorizontalScrollIndicator: false,
  contentContainerStyle: isCardMode
    ? {
      paddingVertical: themeSpace(theme, 'sm'),
      gap: theme.native.components.business_types.base.gap
    }
    : {
      paddingVertical: themeSpace(theme, 'xs'),
      alignItems: 'center',
      gap: theme.native.components.business_types.base.gap
    },
}))``;
