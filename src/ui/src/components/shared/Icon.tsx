import React from 'react';
import { StyleProp, TextStyle } from 'react-native';
import { useTheme } from 'styled-components/native';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons/static';
import FontAwesome5 from '@react-native-vector-icons/fontawesome5/static';
import { themeColor, themeIconSize, type IconLevel } from '@/theme/helpers';

/**
 * The app's icon (decision D3): a glyph of Ionicons (`set='ion'`, the default)
 * MaterialCommunityIcons (`set='mci'`) or FontAwesome 5 solid (`set='fa5'`, for
 * the glyphs the web draws from it and the others lack: the wallets' coins), at
 * an icon size of the theme and in
 * a color role. A size or color the theme does not name is legacy and is
 * painted as given while the call sites are converted.
 *
 *   <Icon name='close' />
 *   <Icon set='mci' name='star' size='sm' color='rating' />
 */
export type IconSet = 'ion' | 'mci' | 'fa5';

interface Props {
  name: string;
  set?: IconSet;
  size?: IconLevel | number;
  color?: string;
  style?: StyleProp<TextStyle>;
  testID?: string;
}

const SETS: Record<IconSet, React.ComponentType<any>> = { ion: Ionicons, mci: MaterialCommunityIcons, fa5: FontAwesome5 };

// `set: iconSet`, not the shorthand `set = 'ion'`: Hermes V1 (React Native
// 0.84+) fails to compile a shorthand `set`/`get` with a default value.
const Icon = ({ name, set: iconSet = 'ion', size = 'md', color = 'text', style, testID }: Props): React.ReactElement => {
  const theme: any = useTheme();
  const Glyph = SETS[iconSet];
  const pt = typeof size === 'number' ? size : themeIconSize(theme, size);
  const paint = theme.native.tokens.color[color] !== undefined ? themeColor(theme, color) : color;
  return <Glyph name={name} size={pt} color={paint} style={style} testID={testID} {...(iconSet === 'fa5' && { iconStyle: 'solid' })} />;
};

export default Icon;
