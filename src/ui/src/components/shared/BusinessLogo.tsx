import React, { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { useTheme } from 'styled-components/native'

import { nativeShadowStyle, themeColor, themeImage, themeSpace } from '@/theme/helpers'

interface Props {
  /** The logo's address; without one, or when it does not load, the theme's placeholder. */
  uri?: string | null
  size: number
  radius: number
  /** What is under the logo (a transparent logo shows it), and its shadow. */
  background: string
  shadow?: Record<string, any> | null
  objectFit?: 'cover' | 'contain'
  priority?: 'low' | 'normal' | 'high'
  testID?: string
}

/**
 * A business's logo: a box with a background that carries the shadow, and the
 * picture clipped inside. The shadow is never on the picture itself: on
 * Android a shadow under a transparent picture (the placeholder, a PNG logo)
 * shows through it as a grey box, and under a picture that failed to load it
 * is all there is.
 */
export const BusinessLogo = ({ uri, size, radius, background, shadow, objectFit = 'cover', priority = 'normal', testID }: Props) => {
  const theme: any = useTheme()
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [uri])

  const placeholder = themeImage(theme, 'placeholder.business_logo')
  const showsLogo = !!uri && !failed
  const source = showsLogo ? { uri, priority: FastImage.priority[priority] } : placeholder
  const box = { width: size, height: size, borderRadius: radius }
  // Without a logo, the placeholder sits inside the frame on the quiet fill, with
  // room around it: a frame of the logo's size, never a glyph filling the card.
  const inset = themeSpace(theme, 'sm')
  const art = { width: size - 2 * inset, height: size - 2 * inset }

  return (
    <View testID={testID} style={[box, { backgroundColor: showsLogo ? background : themeColor(theme, 'surface_alt') }, nativeShadowStyle(shadow)]}>
      {!!source && (
        <View style={[box, styles.clip, !showsLogo && styles.center]}>
          <FastImage
            style={showsLogo ? box : art}
            source={source}
            objectFit={showsLogo ? objectFit : 'contain'}
            onError={() => setFailed(true)}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({ clip: { overflow: 'hidden' }, center: { alignItems: 'center', justifyContent: 'center' } })

export default BusinessLogo
