import React, { useRef, useState } from 'react'
import Lottie from 'lottie-react-native';
import { TouchableOpacity, Easing, ViewStyle, Animated } from 'react-native';
import Icon from '../shared/Icon'
import { useTheme } from 'styled-components/native';
import { BUNDLED_IMAGES } from '@/theme/bundledImages';

// LottieView takes its progress as a number: animated, it follows the
// Animated.Value the press drives.
const AnimatedLottie = Animated.createAnimatedComponent(Lottie)

interface Props {
  initialValue: number,
  onClick: any,
  disableAnimation?: boolean
  toValue: number,
  style?: ViewStyle,
  duration?: number,
  type: 'favorite', // animation types
  isActive: boolean,
  animationType?: ((value: number) => number);
  useNativeDriver?: boolean,
  iconProps?: { color?: string, size?: number, style?: ViewStyle }
}

export const LottieAnimation = (props: Props) => {
  const {
    initialValue,
    onClick,
    disableAnimation,
    toValue,
    style,
    duration,
    type,
    isActive,
    useNativeDriver,
    animationType,
    iconProps
  } = props

  const theme: any = useTheme()
  const animationProgress = useRef(new Animated.Value(initialValue))
  const favRef = useRef<Lottie>(null)
  const [isHide, setIsHide] = useState(true)

  // The favorite heart, the web's (filled when active), in the `favorite` component's color and size.
  const favoriteArray = ['heart', 'heart-outline']
  const favoriteLook = theme.native.components.favorite.base
  const icon = type === 'favorite' ? favoriteArray : []
  const animationGif = type === 'favorite' ? BUNDLED_IMAGES.general.heart : ''

  const onPressLottie = () => {
    if (!disableAnimation) {
      if (type === 'favorite') {
        favRef.current?.play()
      } else {
        setIsHide(false)
        Animated.timing(animationProgress.current, {
          toValue,
          duration: duration || 5000,
          easing: animationType || Easing.linear,
          useNativeDriver: useNativeDriver ?? true
        }).start();
        hideLottie()
      }
    }
    onClick()
  }

  const hideLottie = () => {
    setTimeout(() => setIsHide(true), 4500)
  }

  return (
    <TouchableOpacity
      onPress={onPressLottie}
      style={style}
    >
      {type === 'favorite' ? (
        // <Lottie
        //   ref={favRef}
        //   progress={initialValue}
        //   style={{ width: 20, height: 20 }}
        //   source={animationGif}
        // />
        <Icon
          name={isActive ? icon[0] : icon[1]}
          color={iconProps?.color || favoriteLook.color}
          size={iconProps?.size || favoriteLook.icon_size}
          style={iconProps?.style}
        />
      ) : (
        <>
          {!isHide &&
            <AnimatedLottie
              progress={animationProgress.current}
              source={animationGif}
            />
          }
          <Icon
            name={isActive ? icon[0] : icon[1]}
            color={iconProps?.color || favoriteLook.color}
            size={iconProps?.size || favoriteLook.icon_size}
            style={iconProps?.style}
          />
        </>
      )}
    </TouchableOpacity>
  )
}
