import React, { useEffect, useMemo, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useTheme } from 'styled-components/native';

import { Block, IconControl } from './styles'
import { ReservationDateTimePicker } from './ReservationDateTimePicker'
import { RadioMark } from './pickerLook'
import { BusinessReservation as BusinessReservationController, useConfig, useCustomer, useLanguage, useOrder, useSession } from '@components'
import { OButton, OText, UserDetails } from '@ui'
import OSelect from '../shared/OSelect'
import { themeGutter, themeSpace } from '@/theme/helpers'
import { openScreen } from '@/navigators/appNavigation'

const HeaderTitle = (props: any) => {
  const { text } = props
  return (
    <OText
      preset='body_lg'
      weight={500}
      mBottom={props.mb ?? 'sm'}
      color='text'
    >
      {text}
    </OText>
  )
}

export const BusinessReservationUI = (props: any) => {
  const {
    navigation,
    cart,
    business,
    checkoutFieldsState,
    orderingMethod,
    setOrderingMethod,
    handleAddReservation,
    reservationSetting,
    reservationState,
    setReservationState,
    hoursList,
    reserveDate,
    setReserveDate,
    datesList,
    setOpenReservations,
    isCheckout
  } = props

  const theme: any = useTheme()
  const [{ options }] = useOrder()
  const [, t] = useLanguage()
  const [{ user, loading: userLoading }] = useSession()
  const [{ configs }] = useConfig()
  const [customerState] = useCustomer()
  const [requiredFields, setRequiredFields] = useState<string[]>([])
  const [personsList, setPersonsList] = useState([])
  const [phoneUpdate, setPhoneUpdate] = useState(false);

  const hidePlaceReservationButton = isCheckout &&
    !((reservationState?.changes?.guests_reservation !== cart?.reservation?.guests_reservation) ||
      (reservationState?.changes?.reserve_date !== cart?.reservation?.reserve_date)) ||
    (!!cart?.products?.length && !reservationSetting?.allow_preorder_reservation)
  const notFields = ['coupon', 'driver_tip', 'mobile_phone', 'address', 'zipcode', 'address_notes', 'comments']
  const checkoutFields = useMemo(() => checkoutFieldsState?.fields?.filter((field: any) => field.order_type_id === options?.type), [checkoutFieldsState, options])
  const onPlaceReservation = async () => {
    const result = await handleAddReservation(cart?.products)
    setOpenReservations?.(false)
    if (result?.uuid && orderingMethod === 1) {
      if (!isCheckout && navigation?.navigate) {
        openScreen(navigation, 'CheckoutPage', {
          cartUuid: result.uuid
        })
      }
    }
  }

  const checkValidationFields = () => {
    const userSelected = user
    const _requiredFields: Array<string> = []
    Object.values(checkoutFieldsState?.fields).map((field: any) => {
      if (options?.type === field?.order_type_id &&
        field?.enabled &&
        field?.required &&
        !notFields.includes(field?.validation_field?.code)
      ) {
        if (userSelected && !userSelected[field?.validation_field?.code]) {
          _requiredFields.push(field?.validation_field?.code)
        }
      }
    })
    const mobilePhoneField: any = Object.values(checkoutFieldsState?.fields)?.find((field: any) => field?.order_type_id === options?.type && field?.validation_field?.code === 'mobile_phone')
    if (
      userSelected &&
      !userSelected?.cellphone &&
      ((mobilePhoneField?.enabled &&
        mobilePhoneField?.required) ||
        configs?.verification_phone_required?.value === '1')
    ) {
      _requiredFields.push('cellphone')
    }
    setRequiredFields(_requiredFields)
  }

  const checkGuestValidationFields = () => {
    const userSelected = user
    const _requiredFields = checkoutFieldsState?.fields
      .filter((field: any) => (field?.order_type_id === options?.type) && field?.enabled && field?.required_with_guest &&
        !notFields.includes(field?.validation_field?.code) &&
        field?.validation_field?.code !== 'email' &&
        userSelected && !userSelected[field?.validation_field?.code])
    const requiredFieldsCode = _requiredFields.map((item: any) => item?.validation_field?.code)
    const guestCheckoutCellPhone = checkoutFieldsState?.fields?.find((field: any) => field.order_type_id === options?.type && field?.validation_field?.code === 'mobile_phone')
    const guestCheckoutEmail = checkoutFieldsState?.fields?.find((field: any) => field.order_type_id === options?.type && field?.validation_field?.code === 'email')
    if (
      userSelected &&
      !userSelected?.guest_cellphone &&
      ((guestCheckoutCellPhone?.enabled &&
        guestCheckoutCellPhone?.required_with_guest) ||
        configs?.verification_phone_required?.value === '1')
    ) {
      requiredFieldsCode.push('cellphone')
    }
    if (
      userSelected &&
      !userSelected?.guest_email &&
      guestCheckoutEmail?.enabled &&
      guestCheckoutEmail?.required_with_guest
    ) {
      requiredFieldsCode.push('email')
    }
    setRequiredFields(requiredFieldsCode)
  }

  const handleChangeDate = (date: string) => {
    setReserveDate({
      ...reserveDate,
      date,
      time: null
    })
  }

  const handleChangeTime = (time: string) => {
    setReserveDate({
      ...reserveDate,
      time
    })
    setReservationState({
      ...reservationState,
      changes: {
        ...reservationState?.changes,
        reserve_date: `${reserveDate.date} ${time}:00`
      }
    })
  }

  const togglePhoneUpdate = (val: boolean) => {
    setPhoneUpdate(val)
  }

  useEffect(() => {
    if (checkoutFieldsState?.loading || customerState.loading || userLoading) return
    if (user?.guest_id) {
      checkGuestValidationFields()
    } else {
      checkValidationFields()
    }
  }, [checkoutFieldsState, user, customerState, options?.type])

  useEffect(() => {
    const _menuList: any = []
    const minPersons = reservationSetting?.min_guests_reservation
    const maxPersons = reservationSetting?.max_guests_reservation
    for (let i = minPersons; i <= maxPersons; i++) {
      _menuList.push({
        value: i,
        text: `${i} ${t('GUESTS', 'Guests')}`
      })
    }
    setPersonsList(_menuList)
  }, [reservationSetting?.min_time_reserve_minutes, reservationSetting?.max_time_reserve_days])

  const guestOptions = useMemo(() => personsList.map((item: any) => ({ value: item.value, label: item.text })), [personsList])

  const ViewRender = isCheckout ? View : ScrollView

  return (
    <ViewRender>
      {!isCheckout && (
        <Block>
          <UserDetails
            HeaderTitle={<HeaderTitle text={t('CONTACT', 'Contact')} mb={0} />}
            cartStatus={cart?.status}
            businessId={cart?.business_id}
            useValidationFields
            useDefualtSessionManager
            useSessionUser
            isCheckout
            skipIncompletePhoneChange
            phoneUpdate={phoneUpdate}
            togglePhoneUpdate={togglePhoneUpdate}
            isOrderTypeValidationField
            requiredFields={requiredFields}
            checkoutFields={checkoutFields}
          />
        </Block>
      )}
      {!isCheckout && (
        <Block isCheckout={isCheckout}>
          <OText>{t('ORDERING_METHOD', 'Ordering Method')}</OText>
          {!cart?.products?.length && (
            <IconControl onPress={() => setOrderingMethod(1)}>
              <RadioMark on={orderingMethod === 1} />
              <OText mLeft='lg'>{t('TABLE_RESERVATION', 'Table reservation')}</OText>
            </IconControl>
          )}
          {reservationSetting?.allow_preorder_reservation && (
            <IconControl onPress={() => setOrderingMethod(2)}>
              <RadioMark on={orderingMethod === 2} />
              <OText mLeft='lg'>{t('TABLE_RESERVATION_AND_PREORDER', 'Table reservation & Preorder')}</OText>
            </IconControl>
          )}
          {(!!cart?.products?.length && !reservationSetting?.allow_preorder_reservation) && (
            <OText color='danger_text'>{t('MISSING_ORDERING_METHODS_ERROR', 'No ordering methods available, please remove the products of the cart to continue')}</OText>
          )}
        </Block>
      )}
      <Block isCheckout={isCheckout}>
        <OText>{t('TABLE_SIZE', 'Table Size')}</OText>
          <OSelect
            testID='reservation-guests-select'
            title={t('TABLE_SIZE', 'Table Size')}
            placeholder={t('GUESTS', 'Guests')}
            options={guestOptions}
            value={reservationState?.changes?.guests_reservation}
            onSelect={(value) => {
              setReservationState({
                ...reservationState,
                changes: {
                  ...reservationState?.changes,
                  guests_reservation: value
                }
              })
            }}
            style={{ marginVertical: themeSpace(theme, 'md') }}
          />
      </Block>
      <Block isCheckout={isCheckout}>
        <OText>{t('AVAILABLE_TIME_CHOICE', 'Available time choice')}</OText>
        <ReservationDateTimePicker
          business={business}
          datesList={datesList}
          hoursList={hoursList}
          dateSelected={reserveDate?.date}
          timeSelected={reserveDate?.time}
          handleChangeDate={handleChangeDate}
          handleChangeTime={handleChangeTime}
        />
      </Block>
      {isCheckout && (
        <OText color='text_muted' mBottom='sm'>{t('YOU_HAVE', 'You have')} {reservationSetting?.late_arrival_hold_minutes} {t('MINUTES_TOLERANCE_RESERVATION_INFO', 'min of tolerance after the time of your reservation to avoid being canceled')}</OText>
      )}
      {!hidePlaceReservationButton && (
        <OButton
          disabled={!reservationState?.changes?.guests_reservation || !reserveDate?.time || reservationState?.loading}
          onClick={onPlaceReservation}
          text={isCheckout ? t('UPDATE_RESERVATION', 'Update reservation') : orderingMethod === 1 ? t('PLACE_TABLE_RESERVATION_NOW', 'Place Table Reservation Now') : t('SET_TABLE_AND_CHOOSE_PRODUCTS', 'Set table and choose products')}
          style={{
            marginBottom: themeSpace(theme, 'xxxl'),
            marginHorizontal: themeGutter(theme)
          }}
        />
      )}
    </ViewRender>
  )
}

export const BusinessReservation = (props: any) => {
  const BusinessReservationProps = {
    ...props,
    UIComponent: BusinessReservationUI
  }

  return <BusinessReservationController {...BusinessReservationProps} />
}
