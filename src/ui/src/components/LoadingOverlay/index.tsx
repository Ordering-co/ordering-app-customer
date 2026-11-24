import React from 'react'
import { ActivityIndicator, Modal } from 'react-native'
import { useTheme } from 'styled-components/native'
import { themeColor } from '@/theme/helpers'

import { OverlayScrim } from './styles'

/**
 * A blocking loading overlay (a transparent Modal, a scrim and a large
 * spinner), in place of react-native-loading-spinner-overlay. It covers the
 * whole window, status bar included, while `visible`; the back button does
 * not close it. Colors: the theme's overlay scrim and the color on it,
 * unless a screen gives its own (`color`, `overlayColor`).
 */
type LoadingOverlayProps = {
  visible?: boolean
  color?: string
  overlayColor?: string
  testID?: string
}

export const LoadingOverlay = ({ visible = false, color, overlayColor, testID = 'loading-overlay' }: LoadingOverlayProps) => {
  const theme: any = useTheme()
  if (!visible) return null
  return (
    <Modal
      transparent
      visible
      animationType='none'
      statusBarTranslucent
      supportedOrientations={['portrait', 'landscape']}
      onRequestClose={() => {}}
    >
      <OverlayScrim $color={overlayColor ?? themeColor(theme, 'overlay')} testID={testID}>
        <ActivityIndicator size='large' color={color ?? themeColor(theme, 'on_overlay')} />
      </OverlayScrim>
    </Modal>
  )
}

export default LoadingOverlay
