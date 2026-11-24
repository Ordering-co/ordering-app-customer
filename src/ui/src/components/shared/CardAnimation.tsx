import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { PressableScale } from './PressableScale'

interface Props {
  children: React.ReactNode,
  style?: StyleProp<ViewStyle>,
  onClick?: () => void,
  testID?: string
}

/** A tappable card: the shared press feedback (`PressableScale`). */
export const CardAnimation = ({ children, onClick, style, testID }: Props) => (
  <PressableScale onPress={onClick} style={style} testID={testID}>
    {children}
  </PressableScale>
)
