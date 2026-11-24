import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from 'styled-components/native';
import { Pressable, StyleSheet, View, TextInput, ScrollView, type TextInputInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Container,
  InputsSection,
  WrapperText,
  InputWrapper,
  WrappCountdown,
  CountDownContainer,
  OtpSection,
  DigitInput,
  WrapperActions,
  ButtonsActions
} from './styles'

import {
  UserVerification as UserVerificationController,
  UserFormDetails as UserFormController,
  useToast,
  useSession,
  useLanguage,
  ToastType,
  useConfig
} from '@components';

import {
  OText, OInput, OButton,
  UserFormDetailsUI,
  PhoneInputNumber
} from '@ui';
import Icon from '../shared/Icon';
import { nativeBoxStyle, nativeShadowStyle, nativeTextStyle, themeControlHeight, themeGutter, themePart, themeSpace } from '@/theme/helpers';

const CONDITIONAL_CODES = [1787]
const TIME_COUNTDOWN = 60 * 10 // 10 minutes

const UserDetails = (props: any) => {
  const userDetailsProps = {
    ...props,
    isEdit: true,
    useValidationFields: true,
    useDefualtSessionManager: true,
    UIComponent: UserFormDetailsUI
  }

  return <UserFormController {...userDetailsProps} />
}

const UserVerificationUI = (props: any) => {
  const {
    verifyEmailState,
    verifyPhoneState,
    sendVerifyEmailCode,
    sendVerifyPhoneCode,
    checkVerifyEmailCode,
    checkVerifyPhoneCode,
    cleanErrorsState,
    useWhatsappVerification,
  } = props

  const theme: any = useTheme();
  const [, t] = useLanguage()
  const [{ configs }] = useConfig()
  const [{ auth, user }, { logout }] = useSession()
  const [, { showToast }] = useToast();

  const isEmailVerifyRequired = auth && configs?.verification_email_required?.value === '1' && !user?.email_verified
  const isPhoneVerifyRequired = auth && configs?.verification_phone_required?.value === '1' && !user?.phone_verified

  const CODE_LENGTH = isEmailVerifyRequired ? 6 : 4

  const ref = useRef<TextInputInstance>(null);

  const [otpState, setOtpState] = useState('')

  const [timer, setTimer] = useState(`${TIME_COUNTDOWN / 60}:00`)
  const [isSendCodeAgain, setIsSendCodeAgain] = useState(false)
  const [containerIsFocused, setContainerIsFocused] = useState(false);

  const [phoneState, setPhoneState] = useState<any>(null)
  const [verificationState, setVerificationState] = useState({ email: false, phone: false })
  const [selectedChannel, setSelectedChannel] = useState(2)

  const codeDigitsArray = new Array(CODE_LENGTH).fill(0);

  const phoneLength = phoneState?.cellphone && phoneState?.country_phone_code && phoneState?.cellphone?.split('')?.length
  const lastNumbers = phoneState?.cellphone && phoneState?.country_phone_code && phoneState?.cellphone?.split('').fill('*', 0, phoneLength - 2).join('')

  const style = React.useMemo(() => {
    const input = theme.native.components.input
    const code = input.sizes.code
    const countdown = theme.native.components.timer.base
    const link = theme.native.components.link
    const resend = themePart(theme, 'auth_form', 'slots.resend')
    return StyleSheet.create({
      code: {
        width: code.width,
        height: code.height,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: input.base.radius,
        ...nativeBoxStyle(input.base),
      },
      codeFocus: nativeBoxStyle(input.variants.default.states.focus),
      codeText: { ...nativeTextStyle(code.text), color: input.base.text_color },
      codeEmpty: { color: input.base.placeholder },
      codes: { gap: code.gap },
      hiddenCodeInput: {
        position: 'absolute',
        height: 0,
        width: 0,
      },
      countdown: {
        backgroundColor: countdown.background,
        borderRadius: countdown.radius,
        paddingHorizontal: countdown.padding_x,
      },
      countdownText: { ...nativeTextStyle(countdown.text), color: countdown.color },
      countdownExpired: { color: countdown.expired_color },
      lead: { textAlign: 'center', paddingVertical: themeSpace(theme, 'lg') },
      logout: { position: 'absolute', top: 0, right: 0 },
      link: { ...nativeTextStyle(link.sizes[resend.size].text), color: link.variants[resend.variant].color ?? link.base.color },
      linkDisabled: { color: link.variants[resend.variant].states.disabled.color },
      linkPressed: { opacity: link.variants[resend.variant].states.pressed.opacity },
      linkTarget: { minHeight: themeControlHeight(theme, 'md'), justifyContent: 'center' },
      details: { paddingHorizontal: themeGutter(theme), paddingBottom: themeSpace(theme, 'lg') },
      full: { width: '100%' },
      pair: { flexDirection: 'row', gap: themeSpace(theme, 'sm'), width: '100%' },
      half: { flex: 1 },
      bar: nativeShadowStyle(theme.native.components.bottom_bar.base.shadow),
    })
  }, [theme])
  const submitSlot = themePart(theme, 'auth_form', 'slots.submit')
  const cancelSlot = themePart(theme, 'auth_form', 'slots.cancel')
  const isPhoneBusy = verifyPhoneState?.loadingSendCode || verifyPhoneState?.loadingCheckCode

  const handleOnPress = () => {
    setContainerIsFocused(true);
    ref?.current?.focus();
  };

  const handleOnBlur = () => {
    setContainerIsFocused(false);
  };

  const toDigitInput = (_value: number, idx: number) => {
    const emptyInputChar = '0';
    const digit = otpState[idx] || emptyInputChar;

    const isCurrentDigit = idx === otpState.length;
    const isLastDigit = idx === CODE_LENGTH - 1;
    const isCodeFull = otpState.length === CODE_LENGTH;

    const isFocused = isCurrentDigit || (isLastDigit && isCodeFull);

    return (
      <View key={idx} style={[style.code, containerIsFocused && isFocused && style.codeFocus]}>
        <OText style={[style.codeText, !otpState[idx] && style.codeEmpty]}>
          {digit}
        </OText>
      </View>
    );
  };

  const handleSendOtp = (opt: string = '', channel?: number) => {
    setTimer(`${TIME_COUNTDOWN / 60}:00`)
    setIsSendCodeAgain(true)
    if (opt === 'phone') {
      const ch = channel || 2
      setSelectedChannel(ch)
      let cellphone = phoneState?.cellphone
      let country_phone_code = phoneState?.country_phone_code

      if (CONDITIONAL_CODES.includes(Number(country_phone_code))) {
        if (Number(country_phone_code) === 1787) {
          cellphone = `787${cellphone}`
          country_phone_code = '1'
        }
      }
      sendVerifyPhoneCode({
        cellphone,
        country_phone_code,
        channel: ch
      })
      return
    }
    sendVerifyEmailCode({ email: user?.email })
  }

  const setupUserPhoneNumber = () => {
    if (!user || !user?.cellphone || !user?.country_phone_code) return
    setPhoneState({
      cellphone: user?.country_code === "PR" ? user?.cellphone.replace('787', '') : user?.cellphone,
      country_phone_code: user?.country_code === "PR" ? '1787' : user?.country_phone_code,
      formatted: `+${user?.country_phone_code} ${user?.cellphone}`
    })
  }

  useEffect(() => {
    if (verificationState.phone) {
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
    }
  }, [isSendCodeAgain, verificationState.phone])

  useEffect(() => {
    if (otpState?.length === CODE_LENGTH) {
      if (verificationState.email) {
        checkVerifyEmailCode({ code: otpState })
        return
      }
      if (verificationState.phone) {
        checkVerifyPhoneCode({
          cellphone: phoneState?.cellphone,
          country_phone_code: +(phoneState?.country_phone_code),
          code: otpState,
          channel: selectedChannel
        })
        return
      }
    }
  }, [otpState])

  useEffect(() => {
    if (verifyEmailState?.errorSendCode || verifyEmailState?.errorCheckCode) {
      showToast(
        ToastType.Error,
        verifyEmailState?.errorSendCode?.[0]
        ?? verifyEmailState?.errorCheckCode?.[0]
        ?? t('ERROR', 'Error'),
      );
      setTimeout(() => {
        cleanErrorsState();
        cleanErrorsState('phone');
        setOtpState('');
      }, 2000);
    }

    if (verifyPhoneState?.errorSendCode || verifyPhoneState?.errorCheckCode) {
      showToast(
        ToastType.Error,
        verifyPhoneState?.errorSendCode?.[0]
        ?? verifyPhoneState?.errorCheckCode?.[0]
        ?? t('ERROR', 'Error'),
      );
      setTimeout(() => {
        cleanErrorsState();
        cleanErrorsState('phone');
        setOtpState('');
      }, 2000);
    }
  }, [verifyEmailState, verifyPhoneState])

  useEffect(() => {
    if (!verifyEmailState?.loadingSendCode && isEmailVerifyRequired) {
      setVerificationState({
        ...verificationState,
        email: !!verifyEmailState?.resultSendCode
      })
    }
    if (!verifyPhoneState?.loadingSendCode && isPhoneVerifyRequired && !isEmailVerifyRequired) {
      setVerificationState({
        ...verificationState,
        phone: !!verifyPhoneState?.resultSendCode
      })
    }
  }, [verifyEmailState, verifyPhoneState])

  useEffect(() => {
    setupUserPhoneNumber()
  }, [user?.cellphone, user?.country_phone_code])

  return (
    <SafeAreaView style={style.half}>
      <ScrollView>
        <Container>
          <WrapperActions>
            <WrapperText>
              <OText preset='h2' mBottom='sm'>
                {t('VERIFICATION_CODE', 'Verification Code')}
              </OText>
              {isEmailVerifyRequired && (
                <OText color='text_muted' style={style.lead}>
                  {!verificationState.email ? (
                    t('VERIFICATION_EMAIL_CODE_MESSAGE', 'In order to continue using our platform please verify your email')
                  ) : (
                    t('VERIFICATION_EMAIL_CODE_SENT_MESSAGE', 'Please type the verification code sent to your email')
                  )}
                </OText>
              )}

              {isPhoneVerifyRequired && !isEmailVerifyRequired && (
                <OText color='text_muted' style={style.lead}>
                  {!verificationState.phone ? (
                    t('VERIFICATION_PHONE_CODE_MESSAGE', 'In order to continue using our platform please verify your phone number')
                  ) : (
                    t('VERIFICATION_PHONE_CODE_SENT_MESSAGE', 'Please, enter the verification code we sent to your mobile ending with :number').replace(':number', lastNumbers)
                  )}
                </OText>
              )}
            </WrapperText>
            <View style={style.logout}>
              <OButton
                iconOnly
                appearance='ghost'
                color='neutral'
                accessibilityLabel={t('LOGOUT', 'Logout')}
                onClick={() => logout()}
                icon={<Icon name='log-out-outline' />}
              />
            </View>
          </WrapperActions>

          {isEmailVerifyRequired && (
            !verificationState.email ? (
              <InputWrapper>
                <OInput
                  placeholder={user?.email}
                  vertorIcon='email-outline'
                  isDisabled
                />
              </InputWrapper>
            ) : (
              <>
                <WrappCountdown>
                  <CountDownContainer style={style.countdown}>
                    <OText style={[style.countdownText, timer === '00:00' && style.countdownExpired]}>
                      {timer}
                    </OText>
                  </CountDownContainer>
                </WrappCountdown>

                <InputsSection>
                  <OtpSection>
                    <DigitInput
                      style={style.codes}
                      disabled={otpState.length === CODE_LENGTH}
                      onPress={handleOnPress}
                    >
                      {codeDigitsArray.map(toDigitInput)}
                    </DigitInput>
                    <TextInput
                      ref={ref}
                      value={otpState}
                      placeholder='0'
                      onChangeText={setOtpState}
                      onSubmitEditing={handleOnBlur}
                      keyboardType="number-pad"
                      returnKeyType="done"
                      textContentType="oneTimeCode"
                      maxLength={CODE_LENGTH}
                      style={style.hiddenCodeInput}
                    />
                  </OtpSection>
                </InputsSection>

                <WrapperText>
                  <Pressable
                    onPress={() => handleSendOtp()}
                    style={({ pressed }) => [style.linkTarget, pressed && style.linkPressed]}
                  >
                    <OText style={style.link}>
                      {t('RESEND_AGAIN', 'Resend again?')}
                    </OText>
                  </Pressable>
                </WrapperText>
              </>
            )
          )}

          {isPhoneVerifyRequired && !isEmailVerifyRequired && (
            !verificationState.phone ? (
              phoneState?.formatted ? (
                <>
                  <InputWrapper phone>
                    <PhoneInputNumber
                      handleData={() => { }}
                      defaultValue={phoneState?.cellphone}
                      defaultCode={phoneState?.country_phone_code.replace('+', '')}
                      noDropIcon
                      isDisabled
                      updateStateWithSubmit
                    />
                  </InputWrapper>
                </>
              ) : (
                <OText color='text_muted' style={style.lead}>
                  {t('WARNING_PHONE_CODE_VALIDATION', 'Please update your phone number to continue')}
                </OText>
              )
            ) : (
              <>
                <WrappCountdown>
                  <CountDownContainer style={style.countdown}>
                    <OText style={[style.countdownText, timer === '00:00' && style.countdownExpired]}>
                      {timer}
                    </OText>
                  </CountDownContainer>
                </WrappCountdown>

                <InputsSection>
                  <OtpSection>
                    <DigitInput
                      style={style.codes}
                      disabled={otpState.length === CODE_LENGTH}
                      onPress={handleOnPress}
                    >
                      {codeDigitsArray.map(toDigitInput)}
                    </DigitInput>
                    <TextInput
                      ref={ref}
                      value={otpState}
                      placeholder='0'
                      onChangeText={setOtpState}
                      onSubmitEditing={handleOnBlur}
                      keyboardType="number-pad"
                      returnKeyType="done"
                      textContentType="oneTimeCode"
                      maxLength={CODE_LENGTH}
                      style={style.hiddenCodeInput}
                    />
                  </OtpSection>
                </InputsSection>

                <WrapperText>
                  <Pressable
                    onPress={() => handleSendOtp('phone', selectedChannel)}
                    disabled={isPhoneBusy}
                    style={({ pressed }) => [style.linkTarget, pressed && style.linkPressed]}
                  >
                    <OText style={[style.link, isPhoneBusy && style.linkDisabled]}>
                      {t('RESEND_AGAIN', 'Resend again?')}
                    </OText>
                  </Pressable>
                </WrapperText>
              </>
            )
          )}

        </Container>
        <View style={style.details}>
          <UserDetails
            user={user}
            isEdit
            isVerifiedPhone
            dontToggleEditMode
            showUpdateButtonOnlyWithChanges
          />
        </View>
      </ScrollView>
      {!!phoneState?.cellphone && (
        <ButtonsActions style={style.bar}>
          {(verificationState.email || verificationState.phone) ? (
            <View style={style.full}>
              <OButton
                onClick={() => setVerificationState({ email: false, phone: false })}
                text={t('CANCEL', 'Cancel')}
                size={cancelSlot.size}
                color={cancelSlot.color}
                appearance={cancelSlot.appearance}
                loading={verifyEmailState?.loadingSendCode || verifyEmailState?.loadingCheckCode || verifyPhoneState?.loadingSendCode || verifyPhoneState?.loadingCheckCode}
              />
            </View>
          ) : useWhatsappVerification && isPhoneVerifyRequired && !isEmailVerifyRequired ? (
            <View style={style.pair}>
              <OButton
                onClick={() => handleSendOtp('phone', 2)}
                text={t('SEND_BY_SMS', 'Send by SMS')}
                size={submitSlot.size}
                color={submitSlot.color}
                appearance={submitSlot.appearance}
                disabled={isPhoneBusy}
                parentStyle={style.half}
              />
              <OButton
                onClick={() => handleSendOtp('phone', 4)}
                text={t('SEND_BY_WHATSAPP', 'Send by WhatsApp')}
                size={submitSlot.size}
                color={submitSlot.color}
                appearance={submitSlot.appearance}
                disabled={isPhoneBusy}
                parentStyle={style.half}
              />
            </View>
          ) : (
            <View style={style.full}>
              <OButton
                onClick={() => handleSendOtp(isPhoneVerifyRequired && !isEmailVerifyRequired ? 'phone' : '')}
                text={t('SEND_CODE', 'Send code')}
                size={submitSlot.size}
                color={submitSlot.color}
                appearance={submitSlot.appearance}
                disabled={verifyEmailState?.loadingSendCode || verifyEmailState?.loadingCheckCode || isPhoneBusy}
              />
            </View>
          )}
        </ButtonsActions>
      )}
    </SafeAreaView>
  )
}

export const UserVerification = (props: any) => {
  const verifyProps = {
    ...props,
    UIComponent: UserVerificationUI
  }
  return (
    <UserVerificationController {...verifyProps} />
  )
}
