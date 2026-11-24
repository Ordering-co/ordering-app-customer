import React, { useEffect, useState } from 'react';
import { useTheme } from 'styled-components/native';
import { LoadingOverlay } from '../LoadingOverlay';
import { Fade, Placeholder, PlaceholderLine } from '@/ui/src/components/shared/Skeleton';

import { UDContainer, UDHeader, UDInfo } from './styles';
import {
  UserFormDetails as UserFormController,
  useLanguage,
  useSession,
  ToastType,
  useToast
} from '@components';

import {
  OText,
  OModal,
  VerifyPhone,
  UserFormDetailsUI
} from '@ui';
import { EditButton } from '../shared/EditButton';
import { nativeTextStyle, themeSpace } from '@/theme/helpers';

const UserDetailsUI = (props: any) => {
  const {
    isEdit,
    formState,
    cleanFormState,
    requiredFields,
    onClose,
    cartStatus,
    toggleIsEdit,
    validationFields,
    isUserDetailsEdit,
    phoneUpdate,
    togglePhoneUpdate,
    isCheckout,
    handleSendVerifyCode,
    verifyPhoneState,
    setFormState,
    setIsOpen,
    isCheckoutPlace
  } = props

  const theme: any = useTheme();
  const styles = React.useMemo(() => {
    const field = theme.native.components.field.base
    return {
      skeletonTitle: themeSpace(theme, 'lg'),
      skeletonLine: themeSpace(theme, 'md'),
      skeletonLast: { marginBottom: themeSpace(theme, 'lg') },
      error: { ...nativeTextStyle(field.error), color: field.error_color, textAlign: 'center' as const },
    }
  }, [theme])

  const [, t] = useLanguage()
  const [{ user }] = useSession()
  const [, { showToast }] = useToast();

  const userData = props.userData || (!formState.result.error && formState.result?.result) || user

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmit, setIsSubmit] = useState(false)
  const [willVerifyOtpState, setWillVerifyOtpState] = useState(false);
  const [checkPhoneCodeState, setCheckPhoneCodeState] = useState({ loading: false, result: { error: false } })
  const [phoneInputData, setPhoneInputData] = useState({
    error: '',
    phone: {
      country_phone_code: null,
      cellphone: null,
    },
  });

  useEffect(() => {
    if (isUserDetailsEdit) {
      !isEdit && toggleIsEdit()
    }
  }, [isUserDetailsEdit])

  const toggleEditState = () => {
    toggleIsEdit()
    cleanFormState({ changes: {} })
  }

  useEffect(() => {
    if (isSubmit && !isEdit && requiredFields) {
      onClose && onClose()
    }
  }, [isSubmit, requiredFields, isEdit])

  useEffect(() => {
    if (user?.cellphone && !user?.country_phone_code) {
      togglePhoneUpdate(true)
    } else {
      togglePhoneUpdate(false)
    }
  }, [user?.country_phone_code])

  const handleVerifyCodeClick = () => {
    if (formState?.changes?.cellphone && formState?.changes?.country_phone_code) {
      const { cellphone, country_phone_code: countryPhoneCode } = formState?.changes

      setPhoneInputData({
        error: '',
        phone: {
          country_phone_code: countryPhoneCode,
          cellphone: cellphone,
        },
      });
      handleSendVerifyCode({
        cellphone: cellphone,
        country_phone_code: countryPhoneCode
      })
    }
  }

  const handleSendPhoneCode = (values: any) => {
    setWillVerifyOtpState(false)
    setIsModalVisible(false)
    setFormState({
      ...formState,
      changes: {
        ...formState?.changes,
        verification_code: values?.code
      }
    })
  }

  useEffect(() => {
    if (willVerifyOtpState) handleVerifyCodeClick()
  }, [willVerifyOtpState])

  useEffect(() => {
    if (verifyPhoneState && !verifyPhoneState?.loading) {
      if (verifyPhoneState.result?.error) {
        const message = typeof verifyPhoneState?.result?.result === 'string'
          ? verifyPhoneState?.result?.result
          : verifyPhoneState?.result?.result[0]
        verifyPhoneState.result?.result && showToast(
          ToastType.Error,
          message
        )
        setWillVerifyOtpState(false)
        return
      }

      const okResult = verifyPhoneState.result?.result === 'OK'
      if (okResult) {
        !isModalVisible && setIsModalVisible(true)
        setWillVerifyOtpState(false)
      }
    }
  }, [verifyPhoneState])

  return (
    <>
      {(validationFields.loading || formState.loading) && (
        <Placeholder Animation={Fade}>
          <PlaceholderLine height={styles.skeletonTitle} width={70} />
          <PlaceholderLine height={styles.skeletonLine} width={60} />
          <PlaceholderLine height={styles.skeletonLine} width={60} />
          <PlaceholderLine height={styles.skeletonLine} width={80} style={styles.skeletonLast} />
        </Placeholder>
      )}

      {!(validationFields.loading || formState.loading) && (
        <UDContainer>
          <UDHeader>
            {props.HeaderTitle ?? (
              <OText preset='body_lg' weight={500}>
                {t('CUSTOMER_DETAILS', 'Customer Details')}
              </OText>
            )}
            {cartStatus !== 2 && cartStatus !== 'payment_incomplete' && !isCheckoutPlace && (
              <EditButton
                accessibilityLabel={isEdit ? t('CLOSE', 'Close') : t('EDIT', 'Edit')}
                onClick={() => isEdit ? toggleEditState() : toggleIsEdit()}
                icon={isEdit ? 'close' : 'pencil-outline'}
              />
            )}
          </UDHeader>

          {!isEdit ? (
            <UDInfo>
              <OText preset='body'>
                {userData?.name} {userData?.middle_name} {userData?.lastname} {userData?.second_lastname}
              </OText>
              <OText preset='body'>
                {userData?.guest_id ? userData?.guest_email : userData?.email}
              </OText>
              {!!((userData?.cellphone ?? userData?.guest_cellphone) || (user?.cellphone ?? user?.guest_cellphone)) && (
                <>
                  <OText preset='body'>
                    {(userData?.country_phone_code) && `+${(userData?.country_phone_code)} `}{(userData?.guest_id ? user?.guest_cellphone : userData?.cellphone)}
                  </OText>
                  {!!phoneUpdate && (
                    <OText style={styles.error}>{t('NECESSARY_UPDATE_COUNTRY_PHONE_CODE', 'It is necessary to update your phone number')}</OText>
                  )}
                </>
              )}
            </UDInfo>
          ) : (
            <UserFormDetailsUI
              {...props}
              phoneUpdate={phoneUpdate}
              togglePhoneUpdate={togglePhoneUpdate}
              isCheckout={isCheckout}
              setWillVerifyOtpState={setWillVerifyOtpState}
              setIsSubmit={setIsSubmit}
              setIsOpen={setIsOpen}
            />
          )}
        </UDContainer>
      )}
      <OModal
        open={isModalVisible}
        onClose={() => setIsModalVisible(false)}
      >
        <VerifyPhone
          phone={phoneInputData.phone}
          verifyPhoneState={verifyPhoneState}
          checkPhoneCodeState={checkPhoneCodeState}
          handleCheckPhoneCode={handleSendPhoneCode}
          handleVerifyCodeClick={handleVerifyCodeClick}
          onClose={() => setIsModalVisible(false)}
        />
      </OModal>
      <LoadingOverlay visible={verifyPhoneState?.loading} />
    </>
  )
}

export const UserDetails = (props: any) => {
  const userDetailsProps = {
    ...props,
    UIComponent: UserDetailsUI
  }

  return <UserFormController {...userDetailsProps} />
}
