import { Animated } from 'react-native'
import styled from 'styled-components/native'

/** Over the whole app, status bar included (it is mounted last, outside the theme). */
export const SplashLayer = styled(Animated.View)`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
`

export const SplashImage = styled.Image`
  width: 100%;
  height: 100%;
`
