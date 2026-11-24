import React from 'react'
import { Image, StyleSheet, View, type ImageProps, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native'

type Props = Omit<ImageProps, 'style'> & {
  /** The box: its size, layout and border (a `resizeMode` here sets the image's). */
  style?: StyleProp<ViewStyle & { resizeMode?: ImageStyle['resizeMode'] }>
  imageStyle?: StyleProp<ImageStyle>
  children?: React.ReactNode
}

/**
 * An image filling a box, under the box's children: what React Native's
 * ImageBackground drew (deprecated since 0.87), as the View with an absolutely
 * positioned Image React Native recommends instead.
 */
const OImageBackground = ({ children, style, imageStyle, resizeMode, testID, ...imageProps }: Props) => {
  const { resizeMode: styleResizeMode, ...boxStyle } = (StyleSheet.flatten(style) || {}) as any
  return (
    <View accessibilityIgnoresInvertColors style={boxStyle} testID={testID}>
      <Image
        {...imageProps}
        resizeMode={resizeMode ?? styleResizeMode}
        // As ImageBackground: the image takes the box's own size too.
        style={[StyleSheet.absoluteFill, { width: boxStyle.width, height: boxStyle.height }, imageStyle]}
      />
      {children}
    </View>
  )
}

export default OImageBackground
