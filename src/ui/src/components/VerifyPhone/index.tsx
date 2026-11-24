import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { useTheme } from 'styled-components/native';
import { LoadingOverlay } from '../LoadingOverlay';

import {
  Container,
  CountDownContainer,
  ResendSection,
  WrappCountdown,
  InputsSection,
  ErrorSection
} from './styles'

import { useLanguage } from '@components';
import { getTraduction } from '../../utils'
import { OText } from '@ui';
import { nativeBoxStyle, nativeTextStyle, themeControlHeight, themePart } from '@/theme/helpers';

const TIME_COUNTDOWN = 60 * 10 // 10 minutes

export const VerifyPhone = (props: any) => {
  const {
    phone,
    formValues,
    verifyPhoneState,
    checkPhoneCodeState,
    setCheckPhoneCodeState,
    handleCheckPhoneCode,
    handleVerifyCodeClick
  } = props

  const theme: any = useTheme();
  const [focused, setFocused] = useState<number | null>(null)

  const styles = React.useMemo(() => {
    const input = theme.native.components.input
    const code = input.sizes.code
    const countdown = theme.native.components.timer.base
    const field = theme.native.components.field.base
    const link = theme.native.components.link
    const resend = themePart(theme, 'auth_form', 'slots.resend')
    const linkText = link.sizes[resend.size].text
    return StyleSheet.create({
      title: { textAlign: 'left' },
      code: {
        width: code.width,
        height: code.height,
        borderRadius: input.base.radius,
        ...nativeBoxStyle(input.base),
        ...nativeTextStyle(code.text),
        color: input.base.text_color,
        textAlign: 'center',
      },
      codeFocus: nativeBoxStyle(input.variants.default.states.focus),
      codeError: nativeBoxStyle(input.variants.default.states.error),
      codes: { gap: code.gap },
      countdown: {
        backgroundColor: countdown.background,
        borderRadius: countdown.radius,
        paddingHorizontal: countdown.padding_x,
      },
      countdownText: { ...nativeTextStyle(countdown.text), color: countdown.color },
      countdownExpired: { color: countdown.expired_color },
      error: { ...nativeTextStyle(field.error), color: field.error_color },
      link: { ...nativeTextStyle(linkText), color: link.variants[resend.variant].color ?? link.base.color },
      linkPressed: { opacity: link.variants[resend.variant].states.pressed.opacity },
      linkTarget: { minHeight: themeControlHeight(theme, 'md'), justifyContent: 'center' },
    })
  }, [theme])

  const [, t] = useLanguage()

  const [timer, setTimer] = useState(`${TIME_COUNTDOWN / 60}:00`)
  const [verifyCode, setVerifyCode] = useState({ 0: '', 1: '', 2: '', 3: '' })
  const [isSendCodeAgain, setIsSendCodeAgain] = useState(false)
  const inputRefs: any = [
    React.createRef(),
    React.createRef(),
    React.createRef(),
    React.createRef()
  ]

  const lastNumbers = phone?.cellphone &&
    `${phone?.cellphone.charAt(phone?.cellphone.length - 2)}${phone?.cellphone.charAt(phone?.cellphone.length - 1)}`

  const goNextAfterEdit = (val: number, i: number) => {
    setVerifyCode({ ...verifyCode, [i]: val })
    if(val && i < inputRefs.length - 1) {
      inputRefs[i+1].focus()
    }
  }

  const checkResult = (result: any) => {
    if (!result) return
    return typeof result === 'string'
      ? [result]
      : result
  }

  const handleSendCodeAgain = () => {
    setCheckPhoneCodeState && setCheckPhoneCodeState()
    setTimer(`${TIME_COUNTDOWN / 60}:00`)
    setIsSendCodeAgain(true)
    handleVerifyCodeClick && handleVerifyCodeClick()
  }

  useEffect(() => {
    let _timer = TIME_COUNTDOWN - 1;
    let minutes = 0;
    let seconds = 0;
    const interval = setInterval(() => {
      minutes = _timer / 60;
      seconds = _timer % 60;

      minutes = minutes < 10 ? 0 + minutes : minutes;
      seconds = seconds < 10 ? 0 + seconds : seconds;

      const formatMinutes = parseInt(minutes.toString()) < 10
        ? `0${parseInt(minutes.toString())}`
        : parseInt(minutes.toString());

      const formatseconds = parseInt(seconds.toString()) < 10
        ? `0${parseInt(seconds.toString())}`
        : parseInt(seconds.toString());

      setTimer(`${formatMinutes}:${formatseconds}`);

      if (--_timer < 0) {
        clearInterval(interval);
      }

      if (timer === `${TIME_COUNTDOWN / 60}:00` && isSendCodeAgain) {
        setIsSendCodeAgain(false)
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval)
  }, [isSendCodeAgain])

  useEffect(() => {
    const codes = Object.keys(verifyCode).length
    const isFullInputs = codes && Object.values(verifyCode).every(val => val)
    if (codes === 4 && isFullInputs) {
      const values = {
        ...formValues,
        cellphone: phone.cellphone,
        country_phone_code: `+${phone.country_phone_code}`,
        code: Object.values(verifyCode).join().replace(/,/g, '')
      }
      handleCheckPhoneCode && handleCheckPhoneCode(values)
    }
  }, [verifyCode])

  const codeState = verifyPhoneState?.result?.error ? verifyPhoneState : checkPhoneCodeState
  const hasError = !!(codeState && !codeState.loading && codeState.result?.error && codeState.result?.result)

  return (
    <Container>
      <OText preset='h2' weight={600} mTop='sm' mBottom='xl' style={styles.title}>
        {t('ENTER_VERIFICATION_CODE', 'Enter verification code')}
      </OText>
      {lastNumbers && (
        <OText preset='body_lg' color='text_muted'>
          {`${t('MESSAGE_ENTER_VERIFY_CODE', 'Please, enter the verification code we sent to your mobile ending with')} **${lastNumbers}`}
        </OText>
      )}
      <WrappCountdown>
        <CountDownContainer style={styles.countdown}>
          <OText style={[styles.countdownText, timer === '00:00' && styles.countdownExpired]}>
            {timer}
          </OText>
        </CountDownContainer>
      </WrappCountdown>
      <InputsSection style={styles.codes}>
        {inputRefs.map((k: any, idx: number) => (
          <TextInput
            key={idx}
            keyboardType='number-pad'
            ref={r => { inputRefs[idx] = r }}
            maxLength={1}
            style={[styles.code, focused === idx && styles.codeFocus, hasError && styles.codeError]}
            placeholder={'0'}
            placeholderTextColor={theme.native.components.input.base.placeholder}
            maxFontSizeMultiplier={1.3}
            onFocus={() => setFocused(idx)}
            onBlur={() => setFocused(null)}
            onChangeText={(val: any) => goNextAfterEdit(val, idx)}
            editable={timer !== '00:00'}
          />
        ))}
      </InputsSection>
      {(verifyPhoneState?.result?.error ? verifyPhoneState : checkPhoneCodeState) &&
        !(verifyPhoneState?.result?.error ? verifyPhoneState : checkPhoneCodeState)?.loading &&
        (verifyPhoneState?.result?.error ? verifyPhoneState : checkPhoneCodeState)?.result?.error &&
        (verifyPhoneState?.result?.error ? verifyPhoneState : checkPhoneCodeState).result?.result &&
        (
          <ErrorSection>
            {checkResult((
              verifyPhoneState?.result?.error ? verifyPhoneState : checkPhoneCodeState
            ).result?.result)?.map((e: any, i: number) => (
              <OText key={i} style={styles.error}>
                {`* ${t(getTraduction(e, t))}`}
              </OText>
            ))}
          </ErrorSection>
        )}
      <ResendSection>
        <Pressable
          onPress={() => handleSendCodeAgain()}
          style={({ pressed }) => [styles.linkTarget, pressed && styles.linkPressed]}
        >
          <OText style={styles.link}>
            {t('RESEND_CODE', 'Resend code')}
          </OText>
        </Pressable>
      </ResendSection>
      <LoadingOverlay visible={checkPhoneCodeState.loading} />
    </Container>
  )
}
