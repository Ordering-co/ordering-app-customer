import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import styled, { css, useTheme } from 'styled-components/native';
import { gutterCss, spaceCss, themeColor } from '@/theme/helpers';

const ContainerStyled = styled.ScrollView`
  ${(props: any) => !props.disableFlex && css`
    flex: 1;
  `}
  ${(props: any) => !props.noPadding && css`
    /* The page's sides (the gutter) and a top under the bar, the same on both platforms. */
    padding-horizontal: ${(p: any) => gutterCss(p.theme)};
    padding-top: ${(p: any) => spaceCss(p.theme, 'lg')};
  `}
  background-color: ${(props: any) => themeColor(props.theme, 'background')};
`;

export const Container = (props: any) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <View
      style={{
        flex: props.disableFlex ? undefined : 1,
        paddingTop: props.pt ?? insets.top,
        backgroundColor: themeColor(theme, 'background')
      }}
    >
      <ContainerStyled {...props} ref={props?.forwardRef} keyboardShouldPersistTaps='handled' style={{...props.style}}>
        {props.children}
      </ContainerStyled>
    </View>
  )
}
