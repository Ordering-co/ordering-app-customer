import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, Linking, Modal, ScrollView } from 'react-native';
import { useTheme } from 'styled-components/native';
import { useForm, Controller } from 'react-hook-form';
import { LoadingOverlay } from '../LoadingOverlay';
import Recaptcha from 'react-native-recaptcha-that-works'
import { RecaptchaV3 } from '../RecaptchaV3'
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import RNRestart from 'react-native-restart'

import { projectCountryOf } from '../PhoneInputNumber/calling'
import { themeBrandColor } from '@/utils/themeBrandColor'

import { SignupParams } from '../../types';
import { sortInputFields } from '../../utils';
import { Tabs } from '../../Forms/Tabs'
import { SocialButtons } from '../../Forms/SocialButtons'
import { Otp } from '../LoginForm/Otp'
import { FormSide, FormInput, ContainerFloatBtns } from './styles';
import Icon from '../shared/Icon';
import OCheckbox from '../shared/OCheckbox';
import { AuthLink, FieldError, RecaptchaCheckbox, useAuthStyles } from '../LoginForm/AuthPieces';
import { themeControlHeight, themePart, themeSpace, themeVisible } from '@/theme/helpers';

import {
  SignupForm as SignUpController,
  useLanguage,
  useConfig,
  useSession,
  ToastType,
  useToast,
} from '@components';

import {
  NavBar,
  Alert,
  OText,
  OButton,
  OInput,
  PhoneInputNumber,
} from '@ui'

/** The form's values: its text fields and checkboxes. */
type FormValues = Record<string, string | boolean>

const notValidationFields = [
  'coupon',
  'driver_tip',
  'mobile_phone',
  'address',
  'address_notes',
];

const SignupFormUI = (props: SignupParams) => {
  const {
    navigation,
    loginButtonText,
    signupButtonText,
    onNavigationRedirect,
    formState,
    validationFields,
    showField,
    isRequiredField,
    useChekoutFileds,
    handleSuccessSignup,
    handleButtonSignupClick,
    verifyPhoneState,
    checkPhoneCodeState,
    notificationState,
    handleChangePromotions,
    enableReCaptcha,
    handleReCaptcha,
    generateOtpCode,
    numOtpInputs,
    setWillVerifyOtpState,
    handleChangeInput,
    willVerifyOtpState,
    setOtpState,
    setSignUpTab,
    signUpTab,
    useSignUpFullDetails,
    useSignUpOtpEmail,
    useSignUpOtpCellphone,
    useSignUpOtpWhatsapp,
    isGuest,
    setCellphoneStartZero,
    projectChanged,
    embedded
  } = props;

  const theme: any = useTheme();
  const authStyles = useAuthStyles();
  const submitSlot = themePart(theme, 'auth_form', 'slots.submit');
  const brandButtonStyle = embedded
    ? { backgroundColor: themeBrandColor(theme), borderColor: themeBrandColor(theme) }
    : undefined

  const style = React.useMemo(() => StyleSheet.create({
    scroll: { paddingTop: embedded ? 0 : themeSpace(theme, 'lg'), paddingBottom: embedded ? themeSpace(theme, 'sm') : 0 },
    wrappText: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: themeSpace(theme, 'xs'),
      // The same space before the main button as on the login form.
      marginBottom: themeSpace(theme, 'md'),
    },
    checkRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: themePart(theme, 'field', 'base.label_gap'),
      minHeight: themeControlHeight(theme, 'md'),
      marginBottom: themePart(theme, 'field', 'base.gap'),
    },
    recaptchaV3: { height: themePart(theme, 'input', 'sizes.md.height') },
    pair: { flexDirection: 'row', gap: themeSpace(theme, 'sm') },
    grow: { flex: 1 },
  }), [theme, embedded]);
  const [, { showToast }] = useToast();
  const [, t] = useLanguage();
  const [{ configs }] = useConfig();
  const { control, handleSubmit, clearErrors, register, unregister, setValue, formState: { errors } } = useForm<FormValues>();

  const [passwordSee, setPasswordSee] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoadingVerifyModal, setIsLoadingVerifyModal] = useState(false);
  const [isFBLoading, setIsFBLoading] = useState(false);
  const [phoneInputData, setPhoneInputData] = useState({
    error: '',
    phone: {
      country_phone_code: null,
      cellphone: null,
      country_code: null as string | null
    },
  });
  const [alertState, setAlertState] = useState({ open: false, title: '', content: [] })
  const [recaptchaConfig, setRecaptchaConfig] = useState<any>({})
  const [recaptchaVerified, setRecaptchaVerified] = useState(false)
  const [tabLayouts, setTabLayouts] = useState<any>({})
  const [isCheckingCode, setCheckingCode] = useState(false)
  const [otpError, setOtpError] = useState(null)

  const tabsRef = useRef<any>(null)
  const nameRef = useRef<any>(null);
  const lastnameRef = useRef<any>(null);
  const middleNameRef = useRef<any>(null);
  const secondLastnameRef = useRef<any>(null);
  const emailRef = useRef<any>(null);
  const phoneRef = useRef<any>(null);
  const passwordRef = useRef<any>(null);
  const recaptchaRef = useRef<any>({});
  const scrollViewRef = useRef<any>(null);

  const inputsLayoutsRef = useRef<any>({});
  const otpChannelRef = useRef<number>(2);
  const showInputPhoneNumber = (validationFields?.fields?.checkout?.cellphone?.enabled ?? false) || configs?.verification_phone_required?.value === '1'

  const closeAlert = () => {
    setAlertState({
      open: false,
      title: '',
      content: []
    })
  }

  const vibrateApp = (impact?: any) => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false
    };
    ReactNativeHapticFeedback.trigger(impact || "impactLight", options);
  }

  const handleRefs = (ref: any, code: string) => {
    switch (code) {
      case 'name': {
        nameRef.current = ref;
        break;
      }
      case 'middle_name': {
        middleNameRef.current = ref;
        break;
      }
      case 'lastname': {
        lastnameRef.current = ref;
        break;
      }
      case 'second_lastname': {
        secondLastnameRef.current = ref;
        break;
      }
      case 'email': {
        emailRef.current = ref;
        break;
      }
    }
  };

  const handleOnLayout = (event: any, opc: string) => {
    const _tabLayouts = { ...tabLayouts }
    const categoryKey = opc
    _tabLayouts[categoryKey] = event.nativeEvent.layout
    setTabLayouts(_tabLayouts)
  }

  const handleFocusRef = (code: string) => {
    switch (code) {
      case 'name': {
        nameRef?.current?.focus();
        break;
      }
      case 'middle_name': {
        middleNameRef?.current?.focus();
        break;
      }
      case 'lastname': {
        lastnameRef?.current?.focus();
        break;
      }
      case 'second_lastname': {
        secondLastnameRef?.current?.focus();
        break;
      }
      case 'email': {
        emailRef?.current?.focus();
        break;
      }
    }
  };

  const handleScrollToField = (code: string) => {
    scrollViewRef.current?.scrollTo({ y: inputsLayoutsRef.current[code]?.y, animated: true });
  }

  const getNextFieldCode = (index: number) => {
    const fields = sortInputFields({
      values: validationFields?.fields?.checkout,
    })?.filter(
      (field: any) =>
        !notValidationFields.includes(field.code) && showField(field.code),
    );
    return fields[index + 1]?.code;
  };

  const handleSignUpTab = (tab: string) => {
    setSignUpTab && setSignUpTab(tab)
    clearErrors()
  }

  const onSubmit = (values?: any) => {
    if (phoneInputData.error && signUpTab !== 'otpEmail') {
      showToast(ToastType.Error, phoneInputData.error);
      vibrateApp()
      return;
    }
    if (
      !phoneInputData.phone.country_phone_code &&
      !phoneInputData.phone.cellphone &&
      ((validationFields?.fields?.checkout?.cellphone?.enabled &&
        validationFields?.fields?.checkout?.cellphone?.required) ||
        configs?.verification_phone_required?.value === '1') &&
      signUpTab !== 'otpEmail'
    ) {
      showToast(
        ToastType.Error,
        t(
          'VALIDATION_ERROR_MOBILE_PHONE_REQUIRED',
          'The field Mobile phone is required.',
        ),
      );
      vibrateApp()
      return;
    }
    if (signUpTab === 'otpEmail' || signUpTab === 'otpCellphone') {
      generateOtpCode && generateOtpCode({
        ...values,
        ...((phoneInputData.phone.cellphone !== null && phoneInputData.phone.country_phone_code !== null) && { ...phoneInputData.phone }),
        country_code: phoneInputData.phone.country_code
      }, otpChannelRef.current)
      return
    }
    handleButtonSignupClick &&
      handleButtonSignupClick({
        ...values,
        ...((phoneInputData.phone.cellphone !== null && phoneInputData.phone.country_phone_code !== null) && { ...phoneInputData.phone }),
        country_code: phoneInputData.phone.country_code
      });
    if (!formState.loading && formState.result.result && !formState.result.error) {
      handleSuccessSignup && handleSuccessSignup(formState.result.result);
    }
  };

  const handleSingUpOtp = (value: string) => {
    setOtpState && setOtpState(value)
  }

  // get object with rules for hook form inputs
  const getInputRules = (field: any) => {
    const isEmailForOtp = field.code === 'email' && signUpTab === 'otpEmail';
    const rules: any = {
      required: (isRequiredField(field.code) || isEmailForOtp)
        ? t(
          `VALIDATION_ERROR_${field.code.toUpperCase()}_REQUIRED`,
          `${field.name} is required`,
        ).replace('_attribute_', t(field.name, field.code))
        : null,
    };
    if (field.code && field.code === 'email') {
      rules.pattern = {
        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
        message: t('INVALID_ERROR_EMAIL', 'Invalid email address').replace(
          '_attribute_',
          t('EMAIL', 'Email'),
        ),
      };
    }
    return rules;
  };

  const handleChangeInputEmail = (value: string, onChange: any) => {
    onChange(value.toLowerCase().trim().replace(/[&,()%";:ç?<>{}\\[\]\s]/g, ''));
  };

  const handleOpenTermsUrl = async (url: any) => {
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      showToast(ToastType.Error, t('VALIDATION_ERROR_ACTIVE_URL', 'The _attribute_ is not a valid URL.').replace('_attribute_', t('URL', 'URL')))
      vibrateApp()
    }
  }

  const handleOpenRecaptcha = () => {
    setRecaptchaVerified(false)
    if (!recaptchaConfig?.siteKey) {
      showToast(ToastType.Error, t('NO_RECAPTCHA_SITE_KEY', 'The config doesn\'t have recaptcha site key'));
      vibrateApp()
      return
    }
    if (!recaptchaConfig?.baseUrl) {
      showToast(ToastType.Error, t('NO_RECAPTCHA_BASE_URL', 'The config doesn\'t have recaptcha base url'));
      vibrateApp()
      return
    }
    recaptchaRef.current.open()
  }

  const onRecaptchaVerify = (token: any) => {
    setRecaptchaVerified(true)
    handleReCaptcha && handleReCaptcha({ code: token, version: recaptchaConfig?.version })
  }

  const handleChangePhoneNumber = (number: any, rawNumber: any) => {
    setPhoneInputData({
      ...phoneInputData,
      ...number,
      phone: {
        ...phoneInputData.phone,
        ...number.phone,
        country_code: phoneInputData.phone.country_code
      }
    })
    setCellphoneStartZero && setCellphoneStartZero(rawNumber?.number && rawNumber?.countryCallingCode ? rawNumber?.number : null)
  }

  const handleOnLayoutInput = (event: any, field: string) => {
    inputsLayoutsRef.current[field] = event.nativeEvent.layout;
  }

  useEffect(() => {
    if (configs && Object.keys(configs).length > 0 && enableReCaptcha) {
      if (configs?.security_recaptcha_type?.value === 'v3' &&
        configs?.security_recaptcha_score_v3?.value > 0 &&
        configs?.security_recaptcha_site_key_v3?.value
      ) {
        setRecaptchaConfig({
          version: 'v3',
          siteKey: configs?.security_recaptcha_site_key_v3?.value || null,
          baseUrl: configs?.security_recaptcha_base_url?.value || null
        })
        return
      }
      if (configs?.security_recaptcha_site_key?.value) {
        setRecaptchaConfig({
          version: 'v2',
          siteKey: configs?.security_recaptcha_site_key?.value || null,
          baseUrl: configs?.security_recaptcha_base_url?.value || null
        })
      }
    }
  }, [configs, enableReCaptcha])

  useEffect(() => {
    if (!formState.loading && formState.result?.error) {
      if (formState.result?.result?.[0] === 'ERROR_AUTH_VERIFICATION_CODE') {
        setRecaptchaVerified(false)
        setRecaptchaConfig({
          version: 'v2',
          siteKey: configs?.security_recaptcha_site_key?.value || null,
          baseUrl: configs?.security_recaptcha_base_url?.value || null
        })
        showToast(ToastType.Info, t('TRY_AGAIN', 'Please try again'))
        vibrateApp()
        return
      }
      formState.result?.result && formState.result?.result[0]?.includes("_") ?
        showToast(ToastType.Error, t(`${formState.result?.result[0]}`, 'Phone number already used')) :
        showToast(ToastType.Error, formState.result?.result[0])
      formState.result?.result && vibrateApp()
      setIsLoadingVerifyModal(false);
    }
  }, [formState]);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setIsLoadingVerifyModal(false);
      vibrateApp()
    }
  }, [errors])

  useEffect(() => {
    if (signUpTab === 'default' || signUpTab === 'otpCellphone') {
      register('cellphone', {
        required: isRequiredField('cellphone')
          ? t('VALIDATION_ERROR_MOBILE_PHONE_REQUIRED', 'The field Mobile phone is required').replace('_attribute_', t('CELLPHONE', 'Cellphone'))
          : null
      })
    } else {
      unregister('cellphone')
    }
  }, [signUpTab])

  useEffect(() => {
    if (phoneInputData?.phone?.cellphone) setValue('cellphone', phoneInputData?.phone?.cellphone)
    else setValue('cellphone', '')
  }, [phoneInputData?.phone?.cellphone])

  useEffect(() => {
    if (verifyPhoneState && !verifyPhoneState?.loading) {
      if (verifyPhoneState.result?.error) {
        const message =
          typeof verifyPhoneState?.result?.result === 'string'
            ? verifyPhoneState?.result?.result
            : verifyPhoneState?.result?.result?.[0];
        verifyPhoneState.result?.result && showToast(ToastType.Error, message);
        verifyPhoneState.result?.result && vibrateApp()
        setIsLoadingVerifyModal(false);
        return;
      }

      const okResult = verifyPhoneState.result?.result === 'OK';
      if (okResult) {
        !isModalVisible && setIsModalVisible(true);
        setIsLoadingVerifyModal(false);
      }
    }
  }, [verifyPhoneState]);

  useEffect(() => {
    setPhoneInputData({
      ...phoneInputData,
      phone: {
        ...phoneInputData.phone,
        country_code: projectCountryOf(configs?.default_country_code?.value) ?? null
      }
    })
  }, [configs])

  useEffect(() => {
    if (checkPhoneCodeState?.result?.error) {
      const titleText = (
        typeof checkPhoneCodeState?.result?.result === 'string'
          ? checkPhoneCodeState?.result?.result
          : checkPhoneCodeState?.result?.result[0].toString()
      ) || t('ERROR', 'Error')
      setCheckingCode(false)
      setOtpError(titleText)
      checkPhoneCodeState?.generate && setAlertState({
        open: true,
        title: titleText,
        content: []
      })
    }
  }, [checkPhoneCodeState])

  return (
    <>
      <ScrollView
        scrollEnabled={!embedded}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={style.scroll}
        renderToHardwareTextureAndroid
        ref={scrollViewRef}
      >
        <FormSide>
          {(useSignUpOtpEmail || useSignUpOtpCellphone || useSignUpFullDetails) && (
            <Tabs
              tabsRef={tabsRef}
              group='auth_form'
              slot='method_tabs'
              defaultTab={signUpTab}
              defaultTabs={[
                { tab: 'email', type: 'default', enabled: useSignUpFullDetails, text: t('DEFAULT', 'Default') },
                { tab: 'email', type: 'otpEmail', enabled: useSignUpOtpEmail, text: t('LOGIN_FOR_OTP_EMAIL', 'For OTP Email') },
                { tab: 'cellphone', type: 'otpCellphone', enabled: useSignUpOtpCellphone, text: t('LOGIN_FOR_OTP_PHONE', 'For OTP Phone') }
              ]}
              handleChangeTab={handleSignUpTab}
              handleOnLayout={handleOnLayout}
            />
          )}
          <FormInput>
            {!(useChekoutFileds && validationFields?.loading) ? (
              <>
                {sortInputFields({ values: validationFields?.fields?.checkout }).map(
                  (item: any, i: number) => {
                    const field = item?.validation_field || item
                    return (!notValidationFields.includes(field.code) &&
                      showField &&
                      showField(field.code) &&
                      (signUpTab === 'default' || (signUpTab === 'otpEmail' && field.code === 'email')) && (
                        <View key={`${field.id} + ${i}`} onLayout={(event: any) => handleOnLayoutInput(event, field.code)}>
                          {errors?.[`${field.code}`] && (
                            <FieldError>
                              {errors?.[`${field.code}`]?.message} {errors?.[`${field.code}`]?.type === 'required' && '*'}
                            </FieldError>
                          )}
                          <Controller
                            control={control}
                            render={({ field: { onChange, value } }: any) => (
                              <OInput
                                placeholder={t(field.code?.toUpperCase(), field.name)}
                                value={value}
                                autoCapitalize={field.code === 'email' ? 'none' : 'sentences'}
                                autoCorrect={field.code === 'email' && false}
                                type={field.code === 'email' ? 'email-address' : 'default'}
                                autoCompleteType={field.code === 'email' ? 'email' : 'off'}
                                returnKeyType="next"
                                blurOnSubmit={false}
                                forwardRef={(ref: any) => handleRefs(ref, field.code)}
                                onFocus={() => handleScrollToField(field.code)}
                                hasError={!!errors?.[`${field.code}`]}
                                onChange={(val: any) =>
                                  field.code !== 'email'
                                    ? (onChange(val))
                                    : handleChangeInputEmail(val, onChange)
                                }
                                onSubmitEditing={() =>
                                  field.code === 'email'
                                    ? phoneRef?.current?.focus?.()
                                    : handleFocusRef(getNextFieldCode(i))
                                }
                              />
                            )}
                            name={field.code}
                            rules={getInputRules(field)}
                            defaultValue=""
                          />
                        </View>
                      ))
                  }
                )}

                {(!!showInputPhoneNumber && (signUpTab === 'default' || signUpTab === 'otpCellphone')) && (
                  <View>
                    <PhoneInputNumber
                      data={phoneInputData}
                      handleData={handleChangePhoneNumber}
                      forwardRef={phoneRef}
                      changeCountry={(val: any) => setPhoneInputData({
                        ...phoneInputData,
                        phone: {
                          ...phoneInputData.phone,
                          country_code: val.cca2
                        }
                      })}
                      textInputProps={{
                        returnKeyType: 'next',
                        onSubmitEditing: () => {
                          passwordRef?.current?.focus?.()
                          scrollViewRef.current?.scrollToEnd()
                        },
                      }}
                      isStartValidation={errors?.cellphone}
                    />
                  </View>
                )}

                {(enableReCaptcha && recaptchaConfig?.version) && (
                  <>
                    {recaptchaConfig?.version === 'v3' ? (
                      <RecaptchaV3
                        url={recaptchaConfig?.baseUrl}
                        siteKey={recaptchaConfig?.siteKey}
                        containerStyle={style.recaptchaV3}
                        onExecute={onRecaptchaVerify}
                      />
                    ) : (
                      <>
                        <RecaptchaCheckbox
                          checked={recaptchaVerified}
                          onPress={handleOpenRecaptcha}
                          label={t('VERIFY_ReCAPTCHA', 'Verify reCAPTCHA')}
                        />
                        <Recaptcha
                          ref={recaptchaRef}
                          siteKey={recaptchaConfig?.siteKey}
                          baseUrl={recaptchaConfig?.baseUrl}
                          onVerify={onRecaptchaVerify}
                          onExpire={() => setRecaptchaVerified(false)}
                        />
                      </>
                    )}

                  </>
                )}

                {signUpTab === 'default' && (
                  <>
                    {errors?.password && (
                      <FieldError>
                        {errors?.password?.message} {errors?.password?.type === 'required' && '*'}
                      </FieldError>
                    )}
                    <Controller
                      control={control}
                      render={({ field: { onChange, value } }: any) => (
                        <OInput
                          isSecured={!passwordSee ? true : false}
                          placeholder={t('PASSWORD', 'Password')}
                          iconCustomRight={
                            <Pressable onPress={() => setPasswordSee(!passwordSee)} hitSlop={themeSpace(theme, 'sm')}>
                              <Icon
                                set='mci'
                                name={passwordSee ? 'eye-off-outline' : 'eye-outline'}
                                size={themePart(theme, 'input', 'base.icon_size')}
                                color={themePart(theme, 'input', 'base.icon_color')}
                              />
                            </Pressable>
                          }
                          autoCapitalize='none'
                          value={value}
                          onChange={(val: any) => onChange(val)}
                          returnKeyType="done"
                          onSubmitEditing={() => handleSubmit(onSubmit)()}
                          blurOnSubmit
                          forwardRef={passwordRef}
                          onFocus={() => scrollViewRef.current?.scrollToEnd()}
                          hasError={!!errors?.password}
                        />
                      )}
                      name="password"
                      rules={{
                        required: isRequiredField('password')
                          ? t(
                            'VALIDATION_ERROR_PASSWORD_REQUIRED',
                            'The field Password is required',
                          ).replace('_attribute_', t('PASSWORD', 'password'))
                          : null,
                        minLength: {
                          value: 8,
                          message: t(
                            'VALIDATION_ERROR_PASSWORD_MIN_STRING',
                            'The Password must be at least 8 characters.',
                          )
                            .replace('_attribute_', t('PASSWORD', 'Password'))
                            .replace('_min_', 8),
                        },
                      }}
                      defaultValue=""
                    />
                  </>

                )}

                {(signUpTab === 'default') && themeVisible(theme, 'signup.promotions_optin') && (
                  <View style={style.checkRow}>
                    <Controller
                      control={control}
                      render={({ field: { onChange, value } }: any) => (
                        <OCheckbox
                          value={value}
                          onValueChange={(newValue: boolean) => {
                            onChange(newValue)
                            handleChangePromotions()
                          }}
                        />
                      )}
                      name='promotions'
                      defaultValue={false}
                    />
                    <OText style={authStyles.checkboxLabel}>
                      {t('RECEIVE_NEWS_EXCLUSIVE_PROMOTIONS', 'Receive newsletters and exclusive promotions')}
                    </OText>
                  </View>
                )}

                {configs?.terms_and_conditions?.value === 'true' && configs?.terms_and_conditions_url?.value?.includes('http') && (
                  <>
                    {errors?.termsAccept && (
                      <FieldError>
                        {errors?.termsAccept?.message}*
                      </FieldError>
                    )}
                    <View style={style.checkRow}>
                      <Controller
                        control={control}
                        render={({ field: { onChange, value } }: any) => (
                          <OCheckbox
                            value={value}
                            onValueChange={(newValue: boolean) => onChange(newValue)}
                          />
                        )}
                        name='termsAccept'
                        rules={{
                          required: t('VALIDATION_ERROR_ACCEPTED', 'The _attribute_ must be accepted.').replace('_attribute_', t('TERMS_AND_CONDITIONS', 'Terms & Conditions'))
                        }}
                        defaultValue={false}
                      />
                      <OText style={authStyles.checkboxLabel}>{t('TERMS_AND_CONDITIONS_TEXT', 'I agree with')}</OText>
                      <AuthLink
                        text={t('TERMS_AND_CONDITIONS', 'Terms & Conditions')}
                        onPress={() => handleOpenTermsUrl(configs?.terms_and_conditions_url?.value)}
                      />
                    </View>
                  </>

                )}
              </>
            ) : (
              <LoadingOverlay visible />
            )}
          </FormInput>

          {
            onNavigationRedirect && loginButtonText && themeVisible(theme, 'auth.login_link') && (
              <View style={style.wrappText}>
                <OText style={authStyles.redirect}>
                  {t('MOBILE_FRONT_ALREADY_HAVE_AN_ACCOUNT', 'Already have an account?')}
                </OText>
                <AuthLink text={loginButtonText} onPress={() => props.onNavigateToLogin?.()} />
              </View>
            )
          }
        </FormSide>
        <Modal
          visible={willVerifyOtpState}
          onDismiss={() => setWillVerifyOtpState && setWillVerifyOtpState(false)}
          animationType='slide'
        >
          <Otp
            isCheckingCode={isCheckingCode}
            setCheckingCode={setCheckingCode}
            otpError={otpError}
            setOtpError={setOtpError}
            pinCount={numOtpInputs || 6}
            willVerifyOtpState={willVerifyOtpState || false}
            setWillVerifyOtpState={() => setWillVerifyOtpState && setWillVerifyOtpState(false)}
            handleLoginOtp={handleSingUpOtp}
            onSubmit={onSubmit}
            setAlertState={setAlertState}
          />
        </Modal>
        <LoadingOverlay
          visible={formState.loading || validationFields.loading || isFBLoading}
        />
        <Alert
          open={alertState.open}
          content={alertState.content}
          title={alertState.title || ''}
          onAccept={closeAlert}
          onClose={closeAlert}
        />
        <ContainerFloatBtns>
          {(signUpTab === 'otpCellphone' && useSignUpOtpWhatsapp)
            ? (
            <View style={style.pair}>
              <OButton
                size={submitSlot.size}
                color={submitSlot.color}
                appearance={submitSlot.appearance}
                text={t('SEND_BY_SMS', 'Send by SMS')}
                loading={formState.loading || validationFields.loading || isLoadingVerifyModal || checkPhoneCodeState?.loading}
                onClick={() => { otpChannelRef.current = 2; handleSubmit(onSubmit)() }}
                parentStyle={style.grow}
                style={embedded ? { ...brandButtonStyle, ...style.grow } : style.grow}
              />
              <OButton
                size={submitSlot.size}
                color={submitSlot.color}
                appearance={submitSlot.appearance}
                text={t('SEND_BY_WHATSAPP', 'Send by WhatsApp')}
                loading={formState.loading || validationFields.loading || isLoadingVerifyModal || checkPhoneCodeState?.loading}
                onClick={() => { otpChannelRef.current = 4; handleSubmit(onSubmit)() }}
                parentStyle={style.grow}
                style={embedded ? { ...brandButtonStyle, ...style.grow } : style.grow}
              />
            </View>
              )
            : (
            <OButton
              size={submitSlot.size}
              color={submitSlot.color}
              appearance={submitSlot.appearance}
              text={(signUpTab === 'otpEmail' || signUpTab === 'otpCellphone') ? t('GET_VERIFY_CODE', 'Get verify code') : signupButtonText}
              loading={formState.loading || validationFields.loading || isLoadingVerifyModal}
              onClick={() => {
                if (signUpTab === 'otpCellphone') {
                  otpChannelRef.current = 2
                }
                handleSubmit(onSubmit)()
              }}
              style={brandButtonStyle}
            />
              )}
          {!embedded && themeVisible(theme, 'auth.social') && (
            <SocialButtons
              isGuest={isGuest}
              notificationState={notificationState}
              setIsFBLoading={setIsFBLoading}
              onHandleSuccess={() => {
                if (projectChanged) {
                  setTimeout(() => {
                    RNRestart.restart()
                  }, 300)
                }
              }}
            />
          )}
        </ContainerFloatBtns>
      </ScrollView>
    </>
  );
};

export const SignupForm = (props: any) => {
  const _numOtpInputs = 6
  const signupProps = {
    ...props,
    numOtpInputs: _numOtpInputs,
    isRecaptchaEnable: true,
    UIComponent: SignupFormUI,
  };
  return <SignUpController {...signupProps} />;
};
