import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, ScrollView, View } from 'react-native';
import moment from 'moment';
import { useTheme } from 'styled-components/native';
import { useForm, Controller } from 'react-hook-form';

import { sortInputFields } from '../../utils';
import { UDForm, UDLoader, UDWrapper, WrapperPhone } from './styles';
import { emitLogoutSuccess } from '../LogoutButton';

import { useSession, useLanguage, ToastType, useToast, useConfig, useEvent } from '@components';
import {
  OText,
  OButton,
  OInput,
  OModal,
  OAlertOriginal as OAlert,
  DatePickerUI,
  SignupForm,
  PhoneInputNumber
} from '@ui'
import Icon from '../shared/Icon';
import { calendarDate } from '../DatePicker/calendarDate';
import { nativeBoxStyle, nativeTextStyle, themeControlHeight, themeGutter, themeOpacity, themePart, themeSpace, themeVisible } from '@/theme/helpers';

const CONDITIONAL_CODES = ['PR']

export const UserFormDetailsUI = (props: any) => {
  const {
    isEdit,
    setIsEdit,
    formState,
    showField,
    requiredFields,
    setIsSubmit,
    cleanFormState,
    toggleIsEdit,
    onCloseProfile,
    isRequiredField,
    validationFields,
    handleChangeInput,
    handleButtonUpdateClick,
    phoneUpdate,
    hideUpdateButton,
    showUpdateButtonOnlyWithChanges,
    setWillVerifyOtpState,
    handlePlaceOrderAsGuest,
    isCheckout,
    setIsOpen,
    handleRemoveAccount,
    isProfile,
    isGuest,
    isOrderTypeValidationField,
    checkoutFields,
    isCheckoutPlace,
    setCellphoneStartZero,
    skipIncompletePhoneChange
  } = props;

  const theme: any = useTheme();
  const styles = React.useMemo(() => {
    const input = theme.native.components.input
    const field = theme.native.components.field.base
    const row = theme.native.components.list_row.base
    const link = theme.native.components.link
    return StyleSheet.create({
      birthdate: {
        justifyContent: 'center',
        width: '100%',
        minHeight: input.sizes.md.height,
        borderRadius: input.base.radius,
        paddingHorizontal: input.base.padding_x,
        marginBottom: field.gap,
        ...nativeBoxStyle(input.base),
      },
      birthdateDisabled: nativeBoxStyle(input.variants.default.states.disabled),
      birthdateText: { ...nativeTextStyle(input.base.text), color: input.base.text_color },
      birthdatePlaceholder: { color: input.base.placeholder },
      note: { ...nativeTextStyle(field.error), color: field.error_color, marginHorizontal: themeSpace(theme, 'sm'), textAlign: 'center' },
      removeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        gap: row.gap,
        paddingVertical: row.padding_y,
      },
      removeText: { ...nativeTextStyle(row.title), color: themePart(theme, 'link', 'variants.danger.color') },
      off: { opacity: themeOpacity(theme, 'disabled') },
      pressed: { opacity: themeOpacity(theme, 'pressed') },
      submit: { width: '100%', marginVertical: themeSpace(theme, 'lg') },
      link: { ...nativeTextStyle(link.sizes.md.text), color: link.base.color, textAlign: 'center' },
      linkTarget: { marginTop: themeSpace(theme, 'sm'), minHeight: themeControlHeight(theme, 'md'), justifyContent: 'center' },
      linkPressed: { opacity: link.variants.default.states.pressed.opacity },
      modalScroll: { paddingHorizontal: themeGutter(theme), width: '100%' },
    })
  }, [theme])
  const submitSlot = themePart(theme, 'auth_form', 'slots.submit')

  const [, t] = useLanguage();
  const [{ configs }] = useConfig();
  const [, { showToast }] = useToast();
  const { handleSubmit, control, setValue, formState: { errors } } = useForm();

  const [{ user }, { login, logout }] = useSession();
  const [events] = useEvent();
  const [userPhoneNumber, setUserPhoneNumber] = useState<any>(null);
  const [isValid, setIsValid] = useState(false)
  const [isChanged, setIsChanged] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [birthdate, setBirthdate] = useState(user?.birthdate ?? null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [phoneInputData, setPhoneInputData] = useState({
    error: '',
    phone: {
      country_phone_code: null,
      cellphone: null,
    },
  });
  const [confirm, setConfirm] = useState<any>({ open: false, content: null, handleOnAccept: null, id: null, title: null })

  const isAdmin = user?.level === 0
  const hasFormChanges = Object.keys(formState?.changes ?? {}).length > 0
  const showUpdateButton = !hideUpdateButton && (!showUpdateButtonOnlyWithChanges || hasFormChanges || formState?.loading)
  const showInputPhoneNumber = isOrderTypeValidationField ? checkoutFields?.find((field: any) => field?.validation_field?.code === 'mobile_phone')?.enabled : (validationFields?.fields?.checkout?.cellphone?.enabled ?? false)
  const showInputBirthday = isOrderTypeValidationField ? checkoutFields?.find((field: any) => field?.validation_field?.code === 'birthdate')?.enabled : (validationFields?.fields?.checkout?.birthdate?.enabled ?? false)

  const handleSuccessSignup = (user: any) => {
    login({
      user,
      token: user?.session?.access_token
    })
    handlePlaceOrderAsGuest && handlePlaceOrderAsGuest()
  }

  const getInputRules = (field: any) => {
    const rules: any = {
      required: isRequiredField(field.code)
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

  const cellphoneValue = () => {
    let cellphone = user?.guest_id ? user?.guest_cellphone : user?.cellphone
    if (cellphone && CONDITIONAL_CODES.includes(user?.country_code)) {
      if (user?.country_code === 'PR') {
        cellphone = user?.cellphone?.slice(3)
      }
    }
    return cellphone
  }

  const setUserCellPhone = (isEdit = false) => {
    if (userPhoneNumber && !userPhoneNumber.includes('null') && !isEdit) {
      setUserPhoneNumber(userPhoneNumber);
      return;
    }
    const cellphone = user?.guest_id ? user?.guest_cellphone : user?.cellphone

    if (cellphone) {
      let phone = null;
      if (user?.country_phone_code) {
        phone = `+${user?.country_phone_code} ${cellphone}`;
      } else {
        phone = user?.cellphone;
      }
      setUserPhoneNumber(phone);
      setPhoneInputData({
        ...phoneInputData,
        phone: {
          country_phone_code: user?.country_phone_code || null,
          cellphone: cellphoneValue()
        },
      });
      return;
    }
    setUserPhoneNumber(cellphone || '');
  };

  const onSubmit = () => {
    if (!isEdit) {
      // Only UserProfileForm passes setIsEdit; other callers rely on the controller's toggle.
      setIsEdit ? setIsEdit(true) : toggleIsEdit?.()
      return
    }
    let content = ''
    const isPhoneRequiredByOrderType = checkoutFields?.find((field: any) => field?.validation_field?.code === 'mobile_phone')?.required
    if (requiredFields?.includes?.('birthdate') && !birthdate) {
      content = content + `${t('VALIDATION_ERROR_BIRTHDATE_REQUIRED', 'Birthdate is required')}\n`
    }
    if (phoneInputData.error) {
      content = content + `${phoneInputData.error}\n`
      showToast(ToastType.Error, content);
      return;
    }
    if (Object.keys(formState.changes).length === 0) {
      if (content.length > 0) {
        showToast(ToastType.Error, content);
        return
      }
      if (requiredFields) {
        setIsSubmit && setIsSubmit(true)
        cleanFormState && cleanFormState({ changes: {} })
        toggleIsEdit && toggleIsEdit()
        return
      }
      showToast(ToastType.Info, t('NO_CHANGES_TO_SAVE', 'There are no changes to save'))
      return
    }
    if (Object.keys(formState.changes).length > 0) {
      if (
        formState.changes?.cellphone === null &&
        ((!isOrderTypeValidationField &&
          validationFields?.fields?.checkout?.cellphone?.enabled &&
          validationFields?.fields?.checkout?.cellphone?.required
        ) || (isOrderTypeValidationField && isPhoneRequiredByOrderType) ||
          (configs?.verification_phone_required?.value === '1' && !user?.guest_id))
      ) {
        content = content + `${t('VALIDATION_ERROR_MOBILE_PHONE_REQUIRED', 'The field Phone Number is required.',)}\n`
        showToast(ToastType.Error, content);
        return;
      }
      if (content.length > 0) {
        showToast(ToastType.Error, content);
        return
      }
      let changes = null;
      if (user?.cellphone && !userPhoneNumber) {
        changes = {
          country_phone_code: '',
          cellphone: '',
        };
      }
      setIsSubmit && setIsSubmit(true)
      handleButtonUpdateClick(changes);
      setIsEdit?.(false)
    }
  };

  const handleChangePhoneNumber = (number: any, rawNumber: any) => {
    setPhoneInputData(number);
    setIsChanged(true)
    if (skipIncompletePhoneChange && !number?.phone?.country_phone_code) {
      return
    }
    let phoneNumber = {
      country_phone_code: {
        name: 'country_phone_code',
        value: number.phone.country_phone_code,
      },
      cellphone: {
        name: 'cellphone',
        value: number.phone.cellphone,
      },
    };
    setCellphoneStartZero && setCellphoneStartZero(rawNumber?.number && rawNumber?.countryCallingCode ? rawNumber?.number : null)
    handleChangeInput(phoneNumber, true);
  };

  const changeCountry = (country: any) => {
    let countryCode = {
      country_code: {
        name: 'country_code',
        value: country.cca2
      }
    }
    handleChangeInput(countryCode, true);
  }

  const _handleChangeDate = (date: any) => {
    setBirthdate(date)
    const _birthdate = moment(date).format('YYYY-MM-DD')
    handleChangeInput({ target: { name: 'birthdate', value: _birthdate } })
    setShowDatePicker(false)
  }

  const onRemoveAccount = () => {
    setConfirm({
      open: true,
      content: [t('QUESTION_REMOVE_ACCOUNT', 'Are you sure that you want to remove your account?')],
      title: t('ACCOUNT_ALERT', 'Account alert'),
      handleOnAccept: async () => {
        setConfirm({ ...confirm, open: false })
        const response = await handleRemoveAccount?.(user?.id)
        if (response === 'OK') {
          await logout()
          await emitLogoutSuccess(events)
        }
      }
    })
  }

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const list = Object.values(errors);
      if (phoneInputData.error) {
        list.push({ message: phoneInputData.error });
      }
      let stringError = '';
      list.map((item: any, i: number) => {
        stringError +=
          i + 1 === list.length ? `- ${item.message}` : `- ${item.message}\n`;
      });
      showToast(ToastType.Error, stringError);
    }
  }, [errors]);

  useEffect(() => {
    if (!formState?.loading && formState?.result?.error) {
      formState.result?.result &&
        showToast(ToastType.Error, formState.result?.result[0]);
      if (isCheckout) {
        setIsOpen && setIsOpen(false)
        cleanFormState && cleanFormState({ changes: {} })
      }
    }
  }, [formState?.loading]);

  useEffect(() => {
    if (!isEdit && onCloseProfile) {
      onCloseProfile();
    }
    if ((user || !isEdit) && !formState?.loading) {
      setUserCellPhone();
      if (!isEdit && !formState?.loading) {
        cleanFormState && cleanFormState({ changes: {} });
        setUserCellPhone(true);
      }
    }
  }, [user, isEdit]);

  useEffect(() => {
    if (!phoneInputData.error &&
      phoneInputData?.phone?.country_phone_code &&
      phoneInputData?.phone?.cellphone &&
      configs?.verification_phone_required?.value === '1' &&
      formState?.changes?.cellphone &&
      isChanged) {
      setWillVerifyOtpState?.(true)
    }
  }, [phoneInputData, configs?.verification_phone_required?.value, isChanged])

  useEffect(() => {
    if (!validationFields.loading && birthdate) {
      setValue('birthdate', formState?.result?.result
        ? formState?.result?.result?.birthdate
        : formState?.changes?.birthdate ?? (user && user?.birthdate) ?? '')
    }
  }, [validationFields, birthdate])

  useEffect(() => {
    if (!requiredFields || formState?.changes?.length === 0) return
    const _isValid = requiredFields.every((key: any) => formState?.changes[key])
    setIsValid(_isValid)
  }, [formState?.changes, requiredFields])

  return (
    <>
      <UDForm>
        {!validationFields?.loading &&
          sortInputFields({ values: isOrderTypeValidationField ? checkoutFields : validationFields?.fields?.checkout })
            .length > 0 && (
            <UDWrapper>
              {sortInputFields({
                values: isOrderTypeValidationField ? checkoutFields : validationFields?.fields?.checkout,
              }).map(
                (item: any) => {
                  const field = item?.validation_field || item
                  return (
                    ((isOrderTypeValidationField ? item?.enabled : (showField && showField(field.code))) && ((requiredFields && requiredFields?.includes?.(field.code)) || !requiredFields || !isCheckoutPlace)) && (
                      <Controller
                        // The field's code: the profile's fields carry no id, and the form names each input by it.
                        key={field.code}
                        control={control}
                        render={() => (
                          <>
                          <OInput
                            name={field.code}
                            placeholder={t(field.code.toUpperCase(), field?.name)}
                            autoCapitalize={field.code === 'email' ? 'none' : 'sentences'}
                            isDisabled={formState?.loading || !isEdit}
                            value={
                              formState?.changes[field.code] ??
                              (user && user?.guest_id && field.code === 'email' ? user?.guest_email : user?.[field.code]) ??
                              ''
                            }
                            onChange={(val: any) => {
                              field.code !== 'email'
                                ? setValue(field.code, val.target.value)
                                : setValue(
                                  field.code,
                                  val.target.value
                                    .toLowerCase()
                                    .replace(
                                      /[&,()%";:ç?<>{}\\[\]\s]/g,
                                      '',
                                    ),
                                );
                              field.code !== 'email'
                                ? handleChangeInput(val)
                                : handleChangeInput({
                                  target: {
                                    name: 'email',
                                    value: val.target.value
                                      .toLowerCase()
                                      .replace(
                                        /[&,()%";:ç?<>{}\\[\]\s]/g,
                                        '',
                                      ),
                                  },
                                });
                            }}
                            hasError={!!errors?.[field.code]}
                            autoCorrect={field.code === 'email' && false}
                            type={field.code === 'email' ? 'email-address' : 'default'}
                            returnKeyType="done"
                            autoCompleteType={field.code === 'email' ? 'email' : 'off'}
                          />
                          </>
                        )}
                        name={field.code}
                        rules={getInputRules(field)}
                        defaultValue={user && (field.code === 'email' && user?.guest_id ? user?.guest_email : user?.[field.code])}
                      />
                    ))
                },
              )}

              {!requiredFields && themeVisible(theme, 'profile.password') && (
                <Controller
                  control={control}
                  render={() => (
                    <OInput
                      name='password'
                      placeholder={t('FRONT_VISUALS_PASSWORD', 'Password')}
                      autoCapitalize='none'
                      isDisabled={formState?.loading || !isEdit}
                      value={formState?.changes['password'] ?? (user && user['password']) ?? ''}
                      onChange={(val: any) => {
                        setValue('password', val.target.value)
                        handleChangeInput(val)
                      }}
                      autoCorrect
                      type='default'
                      returnKeyType="done"
                      autoCompleteType='off'
                      hasError={!!errors?.password}
                      isSecured
                    />
                  )}
                  name='password'
                  rules={getInputRules({ name: 'password', code: 'password' })}
                  defaultValue=''
                />
              )}
              {((!user?.guest_id && !!showInputPhoneNumber) || (isOrderTypeValidationField || user?.guest_id)) &&
                showInputPhoneNumber &&
                ((requiredFields && requiredFields?.includes?.('cellphone')) || !requiredFields || !isCheckoutPlace) &&
                (
                  <WrapperPhone>
                    <PhoneInputNumber
                      data={phoneInputData}
                      isDisabled={formState?.loading || !isEdit}
                      handleData={handleChangePhoneNumber}
                      changeCountry={(val: any) => changeCountry(val)}
                      defaultValue={phoneUpdate ? '' : cellphoneValue()}
                      defaultCode={user?.country_code ?? user?.country_phone_code ?? null}
                      defaultCodeFallback={user?.country_phone_code}
                      noDropIcon
                    />
                    {phoneUpdate && (
                      <OText style={styles.note}>
                        {t('YOUR_PREVIOUS_CELLPHONE', 'Your previous cellphone')}:{' '}
                        {cellphoneValue()}
                      </OText>
                    )}
                  </WrapperPhone>
                )}

              {((!user?.guest_id && showInputBirthday) || (isOrderTypeValidationField || user?.guest_id)) &&
                showInputBirthday &&
                ((requiredFields && requiredFields?.includes?.('birthdate')) || !requiredFields || !isCheckoutPlace) &&
                (
                  <>
                    <Pressable
                      disabled={formState?.loading || !isEdit}
                      onPress={() => setShowDatePicker(!showDatePicker)}
                      style={[styles.birthdate, (formState?.loading || !isEdit) && styles.birthdateDisabled]}
                    >
                      <OText style={[styles.birthdateText, !birthdate && styles.birthdatePlaceholder]}>
                        {birthdate ? moment(calendarDate(birthdate)).format('YYYY-MM-DD') : 'YYYY-MM-DD'}
                      </OText>
                    </Pressable>
                    <DatePickerUI
                      open={showDatePicker}
                      birthdate={birthdate}
                      onConfirm={_handleChangeDate}
                      onCancel={() => setShowDatePicker(false)}
                    />
                  </>
                )}
            </UDWrapper>
          )}
        {isProfile && (
          <Pressable
            disabled={isAdmin}
            onPress={() => onRemoveAccount()}
            accessibilityRole='button'
            style={({ pressed }) => [styles.removeRow, isAdmin && styles.off, pressed && styles.pressed]}
          >
            <Icon name='person-remove-outline' size={theme.native.components.list_row.base.icon_size} color='danger_text' />
            <OText style={styles.removeText}>{t('REMOVE_ACCOUNT', 'Remove account')}</OText>
          </Pressable>
        )}
        {validationFields?.loading && (
          <UDLoader>
            <OText preset='body_sm'>{t('LOADING', 'Loading')}</OText>
          </UDLoader>
        )}
      </UDForm>
      {showUpdateButton && (
        <View>
          <OButton
            text={formState.loading
              ? t('UPDATING', 'Updating...')
              : !isEdit
                ? t('EDIT', 'Edit')
                : t('UPDATE', 'Update')}
            color='primary'
            appearance={!isEdit ? 'tonal' : 'solid'}
            disabled={formState.loading}
            onClick={isEdit ? handleSubmit(onSubmit) : (() => setIsEdit(true))}
          />
        </View>
      )}
      {isCheckoutPlace && (
        <OButton
          text={
            formState.loading
              ? t('UPDATING', 'Updating...')
              : ((isCheckout && !!user?.guest_id)
                ? t('SIGN_UP_AND_PLACE_ORDER', 'Sign up and place order')
                : t('CONTINUE', 'Continue'))
          }
          size={submitSlot.size}
          color={submitSlot.color}
          appearance={submitSlot.appearance}
          disabled={!user?.guest_id && (formState.loading || !isValid)}
          style={styles.submit}
          onClick={handleSubmit(onSubmit)}
        />
      )}
      {isCheckout && !!user?.guest_id && !requiredFields && (
        <Pressable
          onPress={() => handlePlaceOrderAsGuest()}
          style={({ pressed }) => [styles.linkTarget, pressed && styles.linkPressed]}
        >
          <OText style={styles.link}>{t('PLACE_ORDER_AS_GUEST', 'Place order as guest')}</OText>
        </Pressable>
      )}
      <OModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <ScrollView style={styles.modalScroll}>
          <SignupForm
            handleSuccessSignup={handleSuccessSignup}
            isGuest
            signupButtonText={t('SIGNUP', 'Signup')}
            useSignupByEmail
            useChekoutFileds
          />
        </ScrollView>
      </OModal>
      <OAlert
        open={confirm.open}
        title={confirm.title}
        content={confirm.content}
        onAccept={confirm.handleOnAccept}
        onCancel={() => setConfirm({ ...confirm, open: false, title: null })}
        onClose={() => setConfirm({ ...confirm, open: false, title: null })}
      />
    </>
  );
};
