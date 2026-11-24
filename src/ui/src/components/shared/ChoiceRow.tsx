import React, { useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useTheme } from 'styled-components/native'
import { nativeBoxStyle, reservedBorder, themeOpacity, themeScoped, themeSpace } from '@/theme/helpers'
import ChoiceMark from './ChoiceMark'

interface Props {
  kind: 'radio' | 'check'
  selected: boolean
  /** The row cannot be changed (sold out, or its group reached its maximum): the theme's disabled look. */
  disabled?: boolean
  /** The disabled look of a row that still answers its tap (a group at its maximum shows why). */
  dimmed?: boolean
  /** The row's own action. Without it the row is a plain box (its controls apart). */
  onPress?: () => void
  /** What follows the indicator: the image, the name and the price. */
  children: React.ReactNode
  /** The row's end: a quantity stepper. */
  trailing?: React.ReactNode
  /** Under the content, in the row's box: the halves. */
  footer?: React.ReactNode
  testID?: string
  accessibilityLabel?: string
}

/**
 * An option of a list of choices: `components.choice` (its box, text, selected
 * state and disabled opacity) with the indicator first (`ChoiceMark`), as the web's
 * options. The whole row is the touch target; a state never changes its size (the
 * border's room is reserved in every state).
 */
const ChoiceRow = ({ kind, selected, disabled, dimmed, onPress, children, trailing, footer, testID, accessibilityLabel }: Props) => {
  const theme: any = useTheme()
  const choice = themeScoped(theme, 'product_option', 'choice')
  const styles = useMemo(() => {
    const { selected: on, disabled: off } = choice.variants.default.states
    const ring = reservedBorder([choice.base, on])
    return StyleSheet.create({
      box: {
        minHeight: choice.sizes.md.height,
        borderRadius: choice.base.radius,
        paddingVertical: themeSpace(theme, 'sm'),
        paddingHorizontal: themeSpace(theme, 'lg'),
        marginVertical: themeSpace(theme, 'xs'),
        ...nativeBoxStyle({ background: choice.base.background, shadow: choice.base.shadow }),
        ...ring(choice.base)
      },
      selected: { ...nativeBoxStyle({ background: on.background }), ...ring(on, choice.base) },
      disabled: { opacity: off.opacity },
      row: { flexDirection: 'row', alignItems: 'center', gap: choice.base.gap },
      content: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: choice.base.gap },
      footer: { marginTop: themeSpace(theme, 'sm') }
    })
  }, [theme, choice])
  const pressed = themeOpacity(theme, 'pressed')

  return (
    <Pressable
      testID={testID}
      accessibilityRole={kind === 'radio' ? 'radio' : 'checkbox'}
      accessibilityState={{ checked: selected, disabled: !!disabled }}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled || !onPress}
      onPress={onPress}
      style={({ pressed: isPressed }) => [styles.box, selected && styles.selected, (disabled || dimmed) && styles.disabled, isPressed && { opacity: pressed }]}
    >
      <View style={styles.row}>
        <ChoiceMark kind={kind} checked={selected} group='product_option' />
        <View style={styles.content}>{children}</View>
        {trailing}
      </View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </Pressable>
  )
}

export default ChoiceRow
