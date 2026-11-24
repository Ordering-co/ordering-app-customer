import React, { useMemo } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import { useTheme } from 'styled-components/native'

import OText from './OText'
import OButton from './OButton'
import Icon from './Icon'
import { nativeBoxStyle, nativeTextStyle, themeOpacity, themeSpace } from '@/theme/helpers'

interface Props {
  text: string
  onPress?: () => void
  /** Without a chevron when it opens nothing (the moment without pre-orders). */
  showChevron?: boolean
  disabled?: boolean
  numberOfLines?: number
  testID?: string
}

/**
 * The order's options (order type, moment): one control on every screen that
 * shows them (the head of the listing and the storefront, the checkout). Its
 * box is the header's `moment` slot's input look, its text `header.context_text`.
 */
export const OrderContextPill = ({ text, onPress, showChevron = true, disabled, numberOfLines = 1, testID }: Props) => {
  const theme: any = useTheme()
  const styles = useMemo(() => {
    const input = theme.native.components.input
    const header = theme.native.components.header
    const size = input.sizes[header.slots.moment.size]
    return {
      ...StyleSheet.create({
        pill: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: size.height,
          // Two pills share a phone's width: the tighter side (`space.md`) keeps "Delivery" whole at 360 pt.
          paddingHorizontal: Math.min(input.base.padding_x, themeSpace(theme, 'md')),
          gap: input.base.icon_gap,
          borderRadius: input.base.radius,
          ...nativeBoxStyle(input.base)
        },
        pressed: { opacity: themeOpacity(theme, 'pressed') },
        text: { ...nativeTextStyle(header.base.context_text), color: input.base.text_color, flexShrink: 1 }
      }),
      iconColor: input.base.icon_color,
      iconSize: input.base.icon_size
    }
  }, [theme])

  const header = theme.native.components.header
  if (header.base.context_style === 'button') {
    const slot = header.slots.context
    return (
      <OButton
        testID={testID}
        text={text}
        size={slot.size}
        color={slot.color}
        appearance={slot.appearance}
        disabled={disabled}
        onClick={onPress}
      />
    )
  }

  return (
    <Pressable
      testID={testID}
      accessibilityRole='button'
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
    >
      <OText style={styles.text} numberOfLines={numberOfLines} ellipsizeMode='tail'>{text}</OText>
      {showChevron && <Icon name='chevron-down' size={styles.iconSize} color={styles.iconColor} />}
    </Pressable>
  )
}

export default OrderContextPill
