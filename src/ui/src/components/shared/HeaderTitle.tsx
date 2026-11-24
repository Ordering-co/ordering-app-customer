import React from 'react';
import { StyleSheet, TextStyle } from 'react-native';
import { useTheme } from 'styled-components/native'
import { themeGutter, themeSpace } from '@/theme/helpers';
import OText from './OText';

/** A screen title inside the page (preset `h3`), on the page sides. */
const HeaderTitle = ({ text, style, ph, titleColor }: { text?: React.ReactNode, style?: TextStyle, ph?: number, titleColor?: string }) => {
  const theme: any = useTheme();
  const styles = React.useMemo(() => StyleSheet.create({
    title: { marginTop: themeSpace(theme, 'lg'), paddingHorizontal: themeGutter(theme), textTransform: 'capitalize' },
  }), [theme]);
  return (
    <OText
      preset='h3'
      color={titleColor ?? 'text'}
      style={style ?? [styles.title, ph !== undefined && { paddingHorizontal: ph }]}
    >
      {text}
    </OText>
  )
}

export default HeaderTitle
