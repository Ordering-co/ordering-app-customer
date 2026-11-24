import React, { useState, useEffect, useMemo } from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import moment from 'moment'
import uuid from 'react-native-uuid';
import { useTheme } from 'styled-components/native'
import FastImage from 'react-native-fast-image'
import { OCalendar } from '../shared/OCalendar'
import { Placeholder, PlaceholderLine, Fade } from '@/ui/src/components/shared/Skeleton';

import { isGuestCheckoutAllowed } from '../../../../utils/guestCheckout'
import { ServiceFormParams } from '../../types'

import {
  Container,
  ProfessionalPhoto,
  InfoWrapper,
  Divider,
  ProfessionalWrapper,
  ScheduleWrapper,
  CalendarWrapper,
  ButtonWrapper,
  TitleRow,
  ProfessionalSelect,
  ProfessionalRow
} from './styles'
import { themeImage, themePart, themeRadius, themeSpace } from '@/theme/helpers'

import {
  ProductForm as ProductFormController,
  useUtils,
  useLanguage,
  useConfig,
  useOrder,
  useSession
} from '@components'

import { OText, OButton, OIcon } from '@ui'
import OSelect from '../shared/OSelect'
import Icon from '../shared/Icon'
import { IMAGE_REQUEST, imageUrl } from '@/utils/imageUrl'

const screenWidth = Dimensions.get('window').width

const ServiceFormUI = (props: ServiceFormParams) => {
  const {
    professionalSelected,
    productObject,
    handleSave,
    productCart,
    navigation,
    isSoldOut,
    maxProductQuantity,
    onClose,
    professionalListState,
    isCartProduct,
    actionStatus,
    handleCreateGuestUser
  } = props

  const theme: any = useTheme()
  const [, t] = useLanguage()
  const [{ parsePrice, parseDate, is12Hours }] = useUtils()
  const [{ configs }] = useConfig()
  const [orderState] = useOrder()
  const [{ auth }] = useSession()
  const { product, loading, error } = productObject;

  const [selectDate, setSelectedDate] = useState<any>(new Date())
  const [timeList, setTimeList] = useState<any>([])
  const [isEnabled, setIsEnabled] = useState(false)
  const [timeSelected, setTimeSelected] = useState<string | null>(null)
  const [dateSelected, setDateSelected] = useState<any>(null)
  const [currentProfessional, setCurrentProfessional] = useState<any>(null)

  const guestCheckoutEnabled = isGuestCheckoutAllowed(configs, orderState?.options?.type)
  const orderTypeEnabled = guestCheckoutEnabled


  const styles = useMemo(() => StyleSheet.create({
    photoStyle: {
      width: themePart(theme, 'avatar', 'sizes.md.size'),
      height: themePart(theme, 'avatar', 'sizes.md.size'),
      borderRadius: themeRadius(theme, 'sm')
    },
    select: { marginBottom: themeSpace(theme, 'xl') },
    skeletonHero: { borderRadius: 0 },
    centered: { alignSelf: 'center' },
    centeredText: { textAlign: 'center' },
    texts: { flexShrink: 1 },
  }), [theme])

  const getMomentTime = (time: any) => {
    const _moment = moment(`${moment(selectDate).format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD HH:mm').toDate()
    return _moment
  }

  const isBusyTime = (professional: any, selectedMoment: any) => {
    if (!selectedMoment) return false
    const startDay = moment(selectedMoment).utc().format('d')
    const isStartScheduleEnabled = professional?.schedule?.[startDay]?.enabled
    const duration = product?.duration ?? 0
    const endDay = moment(selectedMoment).add(duration - 1, 'minutes').utc().format('d')
    const isEndScheduleEnabled = professional?.schedule?.[endDay]?.enabled
    if (!isStartScheduleEnabled || !isEndScheduleEnabled) return true

    if (professional?.busy_times?.length === 0) return false

    const busyTimes = isCartProduct
      ? professional?.busy_times.filter((item: any) => !(item.start === productCart?.calendar_event?.start && item.end === productCart?.calendar_event?.end))
      : [...professional?.busy_times]
    const valid = busyTimes.some((item: any) => {
      return (moment.utc(item?.start).local().valueOf() <= moment(selectedMoment).valueOf() &&
        moment(selectedMoment).valueOf() < moment.utc(item?.end).local().valueOf()) ||
        (moment.utc(item?.start).local().valueOf() < moment(selectedMoment).valueOf() &&
          moment(selectedMoment).add(duration, 'minutes').valueOf() < moment.utc(item?.end).local().valueOf())
    })
    return valid
  }

  const onDateChange = (date: any) => {
    setSelectedDate(date)
    setTimeSelected(null)
  }

  const handleUpdateGuest = () => {
    if (!isGuestCheckoutAllowed(configs, orderState?.options?.type)) return
    const guestToken = uuid.v4()
    if (guestToken) handleCreateGuestUser({ guest_token: guestToken })
  }

  const handleSaveService = () => {
    const updated = {
      serviceTime: moment(dateSelected).utc().format('YYYY-MM-DD HH:mm:00'),
      professional: currentProfessional
    }
    handleSave && handleSave(updated)
  }

  const validateSelectedDate = (curdate: any, menu: any) => {
    const day = moment(curdate).format('d')
    setIsEnabled(menu?.schedule?.[day]?.enabled || false)
  }

  const handleRedirectLogin = () => {
    navigation && navigation.navigate('Login', {
      store_slug: props.businessSlug
    });
    onClose && onClose()
  };

  const getTimes = (curdate: any, menu: any) => {
    validateSelectedDate(curdate, menu)
    const date = new Date()
    var dateSeleted = new Date(curdate)
    var times = []
    for (var k = 0; k < menu.schedule[dateSeleted.getDay()].lapses.length; k++) {
      var open = {
        hour: menu.schedule[dateSeleted.getDay()].lapses[k].open.hour,
        minute: menu.schedule[dateSeleted.getDay()].lapses[k].open.minute
      }
      var close = {
        hour: menu.schedule[dateSeleted.getDay()].lapses[k].close.hour,
        minute: menu.schedule[dateSeleted.getDay()].lapses[k].close.minute
      }
      for (var i = open.hour; i <= close.hour; i++) {
        if (date.getDate() !== dateSeleted.getDate() || i >= date.getHours()) {
          let hour = ''
          let meridian = ''
          if (is12Hours) {
            if (i === 0) {
              hour = '12'
              meridian = ' ' + t('AM', 'AM')
            } else if (i > 0 && i < 12) {
              hour = (i < 10 ? '0' + i : i)
              meridian = ' ' + t('AM', 'AM')
            } else if (i === 12) {
              hour = '12'
              meridian = ' ' + t('PM', 'PM')
            } else {
              hour = ((i - 12 < 10) ? '0' + (i - 12) : `${(i - 12)}`)
              meridian = ' ' + t('PM', 'PM')
            }
          } else {
            hour = i < 10 ? '0' + i : i
          }
          for (let j = (i === open.hour ? open.minute : 0); j <= (i === close.hour ? close.minute : 59); j += 15) {
            if (i !== date.getHours() || j >= date.getMinutes() || date.getDate() !== dateSeleted.getDate()) {
              times.push({
                text: hour + ':' + (j < 10 ? '0' + j : j) + meridian,
                value: (i < 10 ? '0' + i : i) + ':' + (j < 10 ? '0' + j : j)
              })
            }
          }
        }
      }
    }
    return times
  }

  const addressRedirect = () => {
    navigation && navigation.navigate('AddressList', { isGoBack: true })
    onClose && onClose()
  }

  const renderPhoto = (professional: any) => professional?.photo ? (
    <FastImage
      style={styles.photoStyle}
      source={{
        uri: imageUrl(professional?.photo, { height: IMAGE_REQUEST.thumbnail }),
        priority: FastImage.priority.normal,
      }}
      objectFit='cover'
    />
  ) : (
    // No photo: the avatar glyph (as the profile's), the box's size.
    <Icon name='person-circle-outline' size={styles.photoStyle.width} color='text_muted' />
  )

  // The professionals in the select's sheet: photo, name and availability at the chosen time.
  const professionalOptions = (professionalListState?.professionals ?? []).map((professional: any) => {
    const busy = isBusyTime(professional, dateSelected)
    return {
      value: professional?.id,
      label: `${professional?.name} ${professional?.lastname}`,
      leading: renderPhoto(professional),
      content: (
        <>
          {professional?.name} {professional?.lastname}{' · '}
          <OText preset='body_sm' color={busy ? 'danger_text' : 'success_text'}>
            {busy ? t('BUSY_ON_SELECTED_TIME', 'Busy on selected time') : t('AVAILABLE', 'Available')}
          </OText>
        </>
      )
    }
  })

  const handleChangeProfessional = (professional: any) => {
    setCurrentProfessional(professional)
  }

  useEffect(() => {
    if (selectDate === null || !currentProfessional?.schedule) return
    const _times = getTimes(selectDate, currentProfessional)
    setTimeList(_times)
  }, [selectDate, currentProfessional])

  useEffect(() => {
    if (!selectDate || !timeSelected) {
      setDateSelected(null)
      return
    }
    const date = `${moment(selectDate).format('YYYY-MM-DD')} ${timeSelected}:00`
    setDateSelected(date)
  }, [selectDate, timeSelected])

  useEffect(() => {
    if (!professionalSelected?.schedule) return
    setCurrentProfessional(professionalSelected)
  }, [professionalSelected])

  useEffect(() => {
    if (isCartProduct && professionalListState?.professionals?.length > 0) {
      const professional = professionalListState?.professionals?.find((item: any) => item.id === professionalSelected?.id)
      setCurrentProfessional(professional)
    }
  }, [isCartProduct, professionalListState?.professionals])

  useEffect(() => {
    if (!productCart?.calendar_event?.start) return
    setSelectedDate(moment.utc(productCart?.calendar_event?.start).local())
    setTimeSelected(moment.utc(productCart?.calendar_event?.start).local().format('HH:mm'))
  }, [productCart])

  return (
    <>
      {loading && !error && (
        <Placeholder Animation={Fade}>
          <PlaceholderLine
            height={258}
            style={styles.skeletonHero}
            width={screenWidth}
          />
        </Placeholder>
      )}
      {!loading && !error && (
        <Container>
          {product?.images ? (
            <ProfessionalPhoto
              source={{
                uri: product?.images
              }}
            />
          ) : (
            <OIcon
              src={themeImage(theme, 'placeholder.product')}
              cover={false}
              style={styles.centered}
              width={200}
              height={200}
            />
          )}
          <InfoWrapper>
            <OText preset='h3' mBottom='xs'>
              {product?.name}
            </OText>
            <OText preset='body_lg' mBottom='sm'>
              {parsePrice(product?.price)} • {product?.duration}min
            </OText>
            <OText preset='body' color='text_muted'>
              {product?.description}
            </OText>
          </InfoWrapper>
          <Divider />
          <ProfessionalWrapper>
            <TitleRow>
              <OText preset='body_lg' weight={600}>
                {t('PROFESSIONAL', 'Professional')}
              </OText>
              <OText preset='caption' color='danger_text'>
                {t('REQUIRED', 'Required')}
              </OText>
            </TitleRow>
            <OSelect
              title={t('PROFESSIONAL', 'Professional')}
              options={professionalOptions}
              value={currentProfessional?.id}
              onSelect={(value) => handleChangeProfessional(professionalListState?.professionals?.find((item: any) => item.id === value))}
              renderTrigger={({ open }) => (
            <ProfessionalSelect
              onPress={open}
            >
              {currentProfessional ? (
                <>
                  <ProfessionalRow>
                    {renderPhoto(currentProfessional)}
                    <View style={styles.texts}>
                      <OText preset='body'>
                        {currentProfessional?.name} {currentProfessional?.lastname}
                      </OText>
                      <OText
                        preset='body_sm'
                        color={isBusyTime(currentProfessional, dateSelected) ? 'danger_text' : 'success_text'}
                      >
                        {isBusyTime(currentProfessional, dateSelected)
                          ? t('BUSY_ON_SELECTED_TIME', 'Busy on selected time')
                          : t('AVAILABLE', 'Available')
                        }
                      </OText>
                    </View>
                  </ProfessionalRow>
                </>
              ) : (
                <OText preset='body_sm'>{t('SELECT_PROFESSIONAL', 'Select professional')}</OText>
              )}
              <Icon name='chevron-down' size={theme.native.components.input.base.icon_size} color={theme.native.components.input.base.icon_color} />
            </ProfessionalSelect>
              )}
            />
          </ProfessionalWrapper>
          <ScheduleWrapper>
            <TitleRow>
              <OText preset='body_lg' weight={600}>
                {t('SCHEDULE', 'Schedule')}
              </OText>
              <OText preset='caption' color='danger_text'>
                {t('REQUIRED', 'Required')}
              </OText>
            </TitleRow>
            {currentProfessional?.schedule ? (
              <CalendarWrapper>
                {(timeList?.length > 0 && isEnabled) ? (
                  <OSelect
                    title={t('AVAILABLE_TIME_CHOICE', 'Available time choice')}
                    placeholder={t('SELECT_A_TIME_OPTION', 'Select an option')}
                    options={timeList.map((item: any) => ({
                      value: item.value,
                      label: item.text,
                      // A busy time stays selectable (Book is then disabled), painted as unavailable.
                      content: isBusyTime(currentProfessional, getMomentTime(item.value)) ? <OText color='text_disabled'>{item.text}</OText> : undefined
                    }))}
                    value={timeSelected}
                    onSelect={(value) => setTimeSelected(value)}
                    style={styles.select}
                  />
                ) : (
                  <OText preset='body_sm' mBottom='xl' color='danger_text'>
                    {t('PROFESSIONAL_NOT_AVAILABLE', 'Professional is not available at the moment')}
                  </OText>
                )}
                <OCalendar
                  width={screenWidth - 110}
                  onDateChange={onDateChange}
                  minDate={new Date()}
                  selectedDate={selectDate}
                />
              </CalendarWrapper>
            ) : (
              <OText
                preset='body_lg'
                mBottom='xl'
                style={styles.centeredText}
                color='text_disabled'
                weight={600}
              >
                {t('NO_SCHEDULE', 'No schedule')}
              </OText>
            )}
          </ScheduleWrapper>
          <ButtonWrapper>
            <OText preset='label'>
              {dateSelected && moment(dateSelected).format('hh:mm A')}
            </OText>
            {((productCart &&
              auth &&
              orderState.options?.address_id)) && (
                <OButton
                  onClick={() => handleSaveService()}
                  text={orderState.loading
                    ? t('LOADING', 'Loading')
                    : ((isSoldOut || maxProductQuantity <= 0)
                      ? t('SOLD_OUT', 'Sold out')
                      : t('BOOK', 'Book'))}
                  disabled={isSoldOut || maxProductQuantity <= 0 || !currentProfessional?.id || !dateSelected || isBusyTime(currentProfessional, dateSelected)}
                />
              )}
            {auth &&
              !orderState.options?.address_id &&
              (orderState.loading ? (
                <OButton
                  disabled
                  loading
                  text={t('LOADING', 'Loading')}
                />
              ) : (
                <OButton testID="service-address-redirect" onClick={() => addressRedirect()} />
              ))}
            {!auth && (
              <OButton
                disabled={isSoldOut || maxProductQuantity <= 0}
                onClick={() => handleRedirectLogin()}
                text={
                  isSoldOut || maxProductQuantity <= 0
                    ? t('SOLD_OUT', 'Sold out')
                    : t('LOGIN_SIGNUP', 'Login / Sign Up')
                }
                appearance='outline'
              />
            )}
            {!auth && guestCheckoutEnabled && orderTypeEnabled && (
              actionStatus?.loading ? (
                <Placeholder Animation={Fade}>
                  <PlaceholderLine width={60} height={20} />
                </Placeholder>
              ) : (
                <OButton
                  text={t('AS_GUEST_USER', 'As guest user')}
                  appearance='ghost'
                  size='sm'
                  onClick={handleUpdateGuest}
                />
              )
            )}
          </ButtonWrapper>
        </Container>
      )}
    </>
  )
}

export const ServiceForm = (props: any) => {
  const serviceFormProps = {
    ...props,
    UIComponent: ServiceFormUI,
    isService: true
  }
  return <ProductFormController {...serviceFormProps} />
}
