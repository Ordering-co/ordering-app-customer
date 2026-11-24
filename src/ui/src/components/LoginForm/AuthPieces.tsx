import React, { useMemo } from 'react'
import { Pressable, StyleSheet, StyleProp, TextStyle, View } from 'react-native'
import { useTheme } from 'styled-components/native'
import OText from '../shared/OText'
import Icon from '../shared/Icon'
import ChoiceMark from '../shared/ChoiceMark'
import { nativeTextStyle, themeControlHeight } from '@/theme/helpers'

/**
 * Pieces shared by the auth forms (login, sign-up, forgot password, OTP):
 * `components.auth_form` and what it scopes (`field`, `link`, `timer`).
 */
export const useAuthStyles = () => {
  const theme: any = useTheme()
  return useMemo(() => {
    const auth = theme.native.components.auth_form.base
    const field = theme.native.components.field.base
    const timer = theme.native.components.timer.base
    return StyleSheet.create({
      fieldError: { ...nativeTextStyle(field.error), color: field.error_color, marginBottom: field.message_gap },
      redirect: { ...nativeTextStyle(auth.redirect_text), color: auth.redirect_color },
      checkboxLabel: { ...nativeTextStyle(auth.checkbox_label_text), color: auth.checkbox_label_color, flexShrink: 1 },
      checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: field.label_gap, minHeight: themeControlHeight(theme, 'md'), marginBottom: field.message_gap },
      timer: {
        ...nativeTextStyle(timer.text),
        color: timer.color,
        backgroundColor: timer.background,
        borderRadius: timer.radius,
        paddingHorizontal: timer.padding_x,
        overflow: 'hidden',
        textAlign: 'center',
      },
      timerExpired: { color: timer.expired_color },
    })
  }, [theme])
}

/** A field's error message (`field.error`, `field.error_color`). */
export const FieldError = ({ children }: { children: React.ReactNode }) => {
  const styles = useAuthStyles()
  return <OText style={styles.fieldError}>{children}</OText>
}

type LinkVariant = 'default' | 'muted' | 'danger'
type LinkSize = 'sm' | 'md' | 'lg'

/** A text link (`components.link`): a size, a variant and its pressed and disabled states. */
export const AuthLink = ({
  text,
  onPress,
  disabled = false,
  variant = 'default',
  size = 'md',
  style,
  testID,
}: {
  text: React.ReactNode
  onPress?: () => void
  disabled?: boolean
  variant?: LinkVariant
  size?: LinkSize
  style?: StyleProp<TextStyle>
  testID?: string
}) => {
  const theme: any = useTheme()
  const styles = useMemo(() => {
    const link = theme.native.components.link
    const look = link.variants[variant]
    const textLook = nativeTextStyle(link.sizes[size].text)
    // The target reaches the control height `md` (44 pt) around the text.
    const slop = Math.max(0, (themeControlHeight(theme, 'md') - textLook.lineHeight) / 2)
    return {
      slop: { top: slop, bottom: slop, left: slop, right: slop },
      pressed: look.states.pressed.opacity,
      sheet: StyleSheet.create({
        // `underline`: always, or never (a phone has no hover, so `hover` draws none).
        text: { ...textLook, color: look.color ?? link.base.color, ...(link.base.underline === 'always' && { textDecorationLine: 'underline' }) },
        disabled: { color: look.states.disabled.color },
      }),
    }
  }, [theme, variant, size])
  return (
    <Pressable
      testID={testID}
      accessibilityRole='link'
      onPress={onPress}
      disabled={disabled}
      hitSlop={styles.slop}
      style={({ pressed }) => pressed ? { opacity: styles.pressed } : null}
    >
      <OText style={[styles.sheet.text, disabled && styles.sheet.disabled, style as any]}>{text}</OText>
    </Pressable>
  )
}

/** The reCAPTCHA v2 check row (one look for login, sign-up and forgot password). */
export const RecaptchaCheckbox = ({ checked, onPress, label }: { checked: boolean, onPress: () => void, label: string }) => {
  const theme: any = useTheme()
  const styles = useAuthStyles()
  return (
    <Pressable onPress={onPress} accessibilityRole='checkbox' accessibilityState={{ checked }}>
      <View style={styles.checkboxRow}>
        <ChoiceMark kind='check' checked={checked} />
        <OText style={styles.checkboxLabel}>{label}</OText>
      </View>
    </Pressable>
  )
}

/** The countdown (`components.timer`). */
export const AuthTimer = ({ text, expired = false }: { text: string, expired?: boolean }) => {
  const styles = useAuthStyles()
  return <OText style={[styles.timer, expired && styles.timerExpired]}>{text}</OText>
}
