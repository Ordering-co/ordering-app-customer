import React, { useEffect, useMemo, useRef } from 'react'
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { OtpInput, OtpInputRef } from 'react-native-otp-entry';
import { useTheme } from 'styled-components/native';

import { formatSeconds } from '../../../utils'
import { otpParams } from '../../../types'

import { OTPContainer } from './styles';
import { useCountdownTimer, OButton } from '@ui';
import { AuthLink, AuthTimer, FieldError } from '../AuthPieces';
import { nativeBoxStyle, nativeTextStyle, themeColor, themePart, themeSpace } from '@/theme/helpers';

import { useLanguage } from '@components';

export const Otp = (props: otpParams) => {
  const {
    pinCount = 6,
    otpError,
    setOtpError,
    setAlertState,
    willVerifyOtpState,
    isCheckingCode,
    setCheckingCode,
    setWillVerifyOtpState,
    handleLoginOtp,
    onSubmit,
  } = props

  const theme: any = useTheme();
  const [, t] = useLanguage();
  const [otpLeftTime, _, resetOtpLeftTime]: any = useCountdownTimer(
    600, willVerifyOtpState)

  const inputRef = useRef<OtpInputRef>(null)

  const handleOnSubmit = () => {
    setAlertState({
      open: true,
      title: t('CODE_SENT', 'The code has been sent'),
    })
    resetOtpLeftTime()
    onSubmit()
  }

  const handleChangeCode = (code: string) => {
    if (code?.length === pinCount) {
      setCheckingCode && setCheckingCode(true)
      handleLoginOtp(code)
      inputRef.current?.clear()
      setTimeout(() => inputRef.current?.focus(), 100)
    }
    setOtpError && setOtpError(null)
  }

  const handleCloseOtp = () => {
    setWillVerifyOtpState(false)
    setOtpError && setOtpError(null)
  }

  useEffect(() => {
    if (otpLeftTime === 0) {
      setAlertState({
        open: true,
        title: t('TIME_IS_UP', 'Time is up'),
        content: t('PLEASE_RESEND_CODE', 'Please resend code again')
      })
    }
  }, [otpLeftTime])

  const resendSlot = themePart(theme, 'auth_form', 'slots.resend');
  const cancelSlot = themePart(theme, 'auth_form', 'slots.cancel');
  const loginStyle = useMemo(() => {
    const input = theme.native.components.input;
    const code = input.sizes.code;
    const states = input.variants.default.states;
    return StyleSheet.create({
      screen: { flex: 1, backgroundColor: themeColor(theme, 'background') },
      container: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: code.gap,
        marginVertical: themeSpace(theme, 'xl')
      },
      box: {
        width: code.width,
        height: code.height,
        borderRadius: input.base.radius,
        ...nativeBoxStyle(input.base)
      },
      digit: {
        ...nativeTextStyle(code.text),
        color: input.base.text_color,
        textAlign: 'center'
      },
      focus: nativeBoxStyle(states.focus),
      error: nativeBoxStyle(states.error),
      checkingCode: {
        height: code.height,
        width: '100%',
        marginVertical: themeSpace(theme, 'xl'),
        justifyContent: 'center',
        alignItems: 'center'
      },
      resend: { marginBottom: themeSpace(theme, 'xl') },
      cancel: { alignSelf: 'stretch' }
    });
  }, [theme]);

  return (
    // The native Modal is a separate view hierarchy, so it needs its own provider
    // or the safe area insets resolve to zero.
    <SafeAreaProvider>
      <SafeAreaView style={loginStyle.screen}>
        <OTPContainer>
          <AuthTimer text={formatSeconds(otpLeftTime)} expired={otpLeftTime === 0} />
          {isCheckingCode && (
            <View style={loginStyle.checkingCode}>
              <ActivityIndicator size="large" color={themeColor(theme, 'primary')} />
            </View>
          )}
          {!isCheckingCode && (
            <OtpInput
              ref={inputRef}
              numberOfDigits={pinCount}
              autoFocus={false}
              focusColor={loginStyle.focus.borderColor ?? themeColor(theme, 'primary')}
              textInputProps={{ returnKeyType: 'done' }}
              theme={{
                containerStyle: loginStyle.container,
                pinCodeContainerStyle: otpError ? { ...loginStyle.box, ...loginStyle.error } : loginStyle.box,
                pinCodeTextStyle: loginStyle.digit,
                focusedPinCodeContainerStyle: loginStyle.focus
              }}
              onTextChange={handleChangeCode}
            />
          )}
          {!!otpError && (
            <FieldError>
              {t(otpError, otpError)}
            </FieldError>
          )}
          <View style={loginStyle.resend}>
            <AuthLink
              text={t('RESEND_CODE', 'Resend code')}
              onPress={() => handleOnSubmit()}
              disabled={otpLeftTime > 520}
              size={resendSlot.size}
              variant={resendSlot.variant ?? 'default'}
            />
          </View>
          <OButton
            size={cancelSlot.size}
            color={cancelSlot.color}
            appearance={cancelSlot.appearance}
            parentStyle={loginStyle.cancel}
            onClick={() => handleCloseOtp()}
            text={t('CANCEL', 'Cancel')}
          />
        </OTPContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  )
}
