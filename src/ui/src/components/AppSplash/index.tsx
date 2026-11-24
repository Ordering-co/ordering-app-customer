import React, { useEffect, useRef, useState } from 'react'
import { Animated } from 'react-native'
import { defaultAppTheme } from '@/theme/engine'
import { themeMotion } from '@/theme/helpers'
import {
  armSplashTimeout,
  onSplashDone,
  resetSplash,
  revealSplashImage,
  splashMode,
  type SplashMode
} from '@/utils/splash'
import { SplashLayer, SplashImage } from './styles'

// The brand's full-screen splash (image mode, docs/SPLASH.md): the same image
// iOS's launch screen shows (Images.xcassets/SplashFullImage).
const SPLASH_IMAGE = require('../../../../assets/splash/splash_image.png')

/**
 * The launch splash's JS side, mounted once at the root of the app (outside
 * the theme, which loads after it). It arms the splash's safety timeout and,
 * in image mode, paints the full-screen image: once it has loaded the native
 * splash fades out to it, and once the app is ready (`hideSplash()`) it fades
 * out itself. In logo mode it paints nothing (the native splash fades out to
 * the app).
 */
export const AppSplash = ({ mode = splashMode }: { mode?: SplashMode }) => {
  // A new launch (first mount, or a recreated activity or scene): the splash
  // is up again until the app says it is ready. Before any effect, so the
  // app's own hideSplash() of this launch counts.
  const [visible, setVisible] = useState(() => {
    resetSplash()
    return mode === 'image'
  })
  const opacity = useRef(new Animated.Value(1)).current

  useEffect(() => armSplashTimeout(), [])

  useEffect(() => {
    if (mode !== 'image') return
    return onSplashDone(() => {
      // The theme is not there yet: the default motion (the theme's own "base").
      const { duration, easing } = themeMotion(defaultAppTheme(), 'base')
      Animated.timing(opacity, { toValue: 0, duration, easing, useNativeDriver: true })
        .start(() => setVisible(false))
    })
  }, [mode, opacity])

  if (!visible) return null
  return (
    <SplashLayer style={{ opacity }} testID="app-splash">
      <SplashImage
        source={SPLASH_IMAGE}
        resizeMode="cover"
        onLoadEnd={revealSplashImage}
        // Android sends only onError when the image fails (iOS sends onLoadEnd too)
        onError={revealSplashImage}
        accessibilityIgnoresInvertColors
      />
    </SplashLayer>
  )
}
