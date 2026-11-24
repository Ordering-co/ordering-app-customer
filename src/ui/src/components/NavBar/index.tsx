import * as React from 'react'
import { TextStyle, View, ViewStyle } from 'react-native'
import { useTheme } from 'styled-components/native'
import FastImage from 'react-native-fast-image'

import { OText } from '../shared'
import { BackButton } from '../shared/styles'
import { nativeTextStyle, themeImage, themeHeaderTitleAlign } from '@/theme/helpers'
import { navBarStyles } from './styles'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
interface Props {
  title?: string,
  subtitle?: any,
  route?: any,
  children?: any,
  right?: any,
  onActionLeft?: () => void,
  textStyle?: TextStyle,
  textSubTitleStyle?: TextStyle,
  style?: ViewStyle,
  noTitle?: boolean,
  pt?: number,
  pb?: number,
  centerTitle?: boolean,
}

const NavBar = (props: Props) => {
  const theme: any = useTheme()
  const insets = useSafeAreaInsets()
  const styles = React.useMemo(() => navBarStyles(theme), [theme])
  const header = theme.native.components.header.base
  // The bar is `header.height` below the safe-area inset.
  const top = props.pt ?? insets.top
  const bottom = props.pb ?? 0
  // The title aligns as every title of the app (`section_header.base.align`).
  const align: TextStyle = { textAlign: themeHeaderTitleAlign(theme, props.centerTitle) }
  const [backWidth, setBackWidth] = React.useState(0)
  const ownCenter = header.title_align === 'center' || (header.title_align === 'center_business' && !!props.centerTitle)
  const balance = ownCenter && align.textAlign === 'center' && !!props.onActionLeft && !props.right && !props.children && !props.noTitle

  return (
    <View style={[styles.wrapper, props.style, { paddingTop: top, paddingBottom: bottom, minHeight: header.height + top + bottom }]}>
      {props.onActionLeft && (
        <View onLayout={balance ? (event: any) => setBackWidth(event.nativeEvent.layout.width) : undefined}>
          <BackButton onPress={props.onActionLeft} />
        </View>
      )}
      {!props.children && !props.noTitle && (
        <View style={[styles.titleWrapper, !!props.onActionLeft && styles.afterBack, !props.title && styles.logoRow]}>
          {props.title ? (
            <View style={[styles.titleBlock, styles.titleFill]}>
              <OText
                preset={props.subtitle ? 'body_lg' : undefined}
                weight={props.subtitle ? 700 : undefined}
                style={[props.subtitle ? null : nativeTextStyle(header.title), { color: header.color }, align, props.textStyle]}
                numberOfLines={1}
              >
                {props.title}
              </OText>
              {!!props.subtitle && (
                <OText preset='body_sm' color='text_muted' style={[align, props.textSubTitleStyle]} numberOfLines={1}>
                  {props.subtitle}
                </OText>
              )}
            </View>)
            : (
              <FastImage
                style={styles.logo}
                source={themeImage(theme, 'logotype')}
                objectFit='contain'
              />
            )}
        </View>
      )}
      {props.children}
      {balance && <View testID='navbar-title-balance' style={[styles.afterBack, { width: backWidth }]} />}
      {!!props.right && (
        <View style={styles.right}>
          {props.right}
        </View>
      )}
    </View>
  )
}

const areEqual = (prevProps: Props, nextProps: Props) => {
  return prevProps.route === nextProps.route &&
    JSON.stringify(prevProps.title) === JSON.stringify(nextProps.title) &&
    prevProps.subtitle === nextProps.subtitle &&
    prevProps.right === nextProps.right
}

export default React.memo(NavBar, areEqual);
