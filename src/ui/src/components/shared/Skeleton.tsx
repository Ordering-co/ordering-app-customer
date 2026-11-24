import React, { createContext, useContext, useEffect, useRef } from 'react'
import { Animated, StyleProp, ViewStyle } from 'react-native'
import { useTheme } from 'styled-components/native'
import { themeColor, themeMotion } from '@/theme/helpers'

import { SkeletonBlock, SkeletonFull, SkeletonPulse, SkeletonRow } from './styles'

/**
 * The loading placeholders, in place of rn-placeholder and with its API
 * (`Placeholder` with `Animation={Fade}`, `PlaceholderLine`, `PlaceholderMedia`):
 * each block takes the theme's skeleton color and radius
 * (`components.skeleton.base`) unless a screen passes its own color, and
 * `Fade` pulses a highlight in the theme's border color over it. No motion
 * when the theme turns it off or the system asks to reduce it.
 */

/** The pulse's opacity, shared by the blocks of one placeholder (none: still). */
const PulseContext = createContext<Animated.Value | null>(null)

/** Line and media defaults (rn-placeholder's): a 12 high line, a 40 square media. */
const LINE_HEIGHT = 12
const MEDIA_SIZE = 40
/** The pulse goes from half to full opacity and back. */
const PULSE_FROM = 0.5
const PULSE_TO = 1

type AnimationProps = { children?: React.ReactNode, duration?: number }

/** The pulsing animation: give it to `Placeholder` (`Animation={Fade}`). */
export const Fade = ({ children, duration }: AnimationProps) => {
  const theme: any = useTheme()
  const value = useRef(new Animated.Value(PULSE_FROM)).current
  // rn-placeholder's half cycle was 500 ms: the theme's slow motion, longer.
  const halfCycle = duration ?? themeMotion(theme, 'slow').duration * 5 / 3

  useEffect(() => {
    const { easing } = themeMotion(theme, 'slow')
    if (!halfCycle) {
      value.setValue(PULSE_TO)
      return
    }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(value, { toValue: PULSE_TO, duration: halfCycle, easing, useNativeDriver: true, isInteraction: false }),
      Animated.timing(value, { toValue: PULSE_FROM, duration: halfCycle, easing, useNativeDriver: true, isInteraction: false })
    ]))
    loop.start()
    return () => loop.stop()
  }, [value, halfCycle, theme])

  return <PulseContext.Provider value={value}>{children}</PulseContext.Provider>
}

type PlaceholderProps = {
  children?: React.ReactNode
  style?: StyleProp<ViewStyle>
  Animation?: React.ComponentType<AnimationProps>
  Left?: React.ComponentType<{ style?: StyleProp<ViewStyle> }>
  Right?: React.ComponentType<{ style?: StyleProp<ViewStyle> }>
  testID?: string
}

/** A row: an optional `Left`, the lines in the middle, an optional `Right`. */
export const Placeholder = ({ children, style, Animation, Left, Right, testID = 'placeholder' }: PlaceholderProps) => {
  const content = (
    <SkeletonRow style={style} testID={testID}>
      {Left && <Left />}
      <SkeletonFull>{children}</SkeletonFull>
      {Right && <Right />}
    </SkeletonRow>
  )
  return Animation ? <Animation>{content}</Animation> : content
}

/** The block and its pulse (when the placeholder animates). */
const Block = ({ style, color, radius, testID }: { style: StyleProp<ViewStyle>, color?: string, radius: number, testID: string }) => {
  const theme: any = useTheme()
  const pulse = useContext(PulseContext)
  const skeleton = theme.native.components.skeleton.base
  return (
    <SkeletonBlock testID={testID} style={[{ backgroundColor: color ?? skeleton.color, borderRadius: radius }, style]}>
      {pulse && <SkeletonPulse style={{ backgroundColor: themeColor(theme, 'border'), opacity: pulse }} />}
    </SkeletonBlock>
  )
}

type LineProps = {
  /** Percent of the row. */
  width?: number
  height?: number
  noMargin?: boolean
  color?: string
  style?: StyleProp<ViewStyle>
}

/** A text line: a share of the row's width, the theme's radius, its height below it. */
export const PlaceholderLine = ({ width = 100, height = LINE_HEIGHT, noMargin = false, color, style }: LineProps) => {
  const theme: any = useTheme()
  const gapBelow = noMargin ? 0 : height
  return (
    <Block
      color={color}
      testID='placeholder-line'
      radius={theme.native.components.skeleton.base.radius}
      style={[{ width: `${width}%`, height, marginBottom: gapBelow }, style]}
    />
  )
}

type MediaProps = {
  size?: number
  isRound?: boolean
  color?: string
  style?: StyleProp<ViewStyle>
}

/** A square (or round) picture. */
export const PlaceholderMedia = ({ size = MEDIA_SIZE, isRound = false, color, style }: MediaProps) => {
  const theme: any = useTheme()
  return (
    <Block
      color={color}
      testID='placeholder-media'
      radius={isRound ? size / 2 : theme.native.components.skeleton.base.radius}
      style={[{ width: size, height: size }, style]}
    />
  )
}
