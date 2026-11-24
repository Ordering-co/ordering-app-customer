import { Dimensions } from 'react-native';
import { useTheme } from 'styled-components/native';
import { themeSpace } from '@/theme/helpers';

/**
 * The landing title: the hero's own title style (`home_hero.title`), and the
 * space above it (layout of the landing: more on tall screens).
 */
export const useUtilsHome = () => {
  const theme: any = useTheme();
  const { height: screenHeight } = Dimensions.get('window');
  const title = theme.native.components.home_hero.base.title

  const getResponsiveSizes = () => ({
    fontSize: title.fontSize,
    lineHeight: title.lineHeight,
    titleMarginTop: screenHeight < 680 ? themeSpace(theme, 'xl') : themeSpace(theme, 'xxxl'),
  });

  return {
    getResponsiveSizes
  }
};
