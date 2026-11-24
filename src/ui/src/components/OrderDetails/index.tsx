import React, { useState, useEffect, useMemo } from 'react';
import { SectionTitle } from '../shared/SectionTitle'
import { View, StyleSheet, BackHandler, Linking, RefreshControl } from 'react-native';
import { useTheme } from 'styled-components/native';
import { Placeholder, PlaceholderLine } from '@/ui/src/components/shared/Skeleton';
import FastImage from 'react-native-fast-image'
import { showLocation } from 'react-native-map-link'

import {
  OrderDetailsContainer,
  Header,
  OrderContent,
  OrderBusiness,
  OrderData,
  OrderInfo,
  StaturBar,
  OrderSection,
  InfoBlock,
  Customer,
  Icons,
  OrderDriver,
  Map,
  PlaceSpotWrapper,
  HeaderTitle,
  WrapperOptions,
  WrapperPhoto,
  WrapperAddress,
  WrapperFullTotal,
  ProgressInfo,
  BusinessInfoContainer,
  BusinessTextContainer,
  StatusCheckmark,
  Separator,
  ReviewContainer,
  ReviewSection,
  OrderLoadError,
} from './styles'

import { getOrderStatuPickUp, getOrderStatus, getGoogleMapImage } from '../../utils'
import { OrderDetailsParams } from '../../types';
import { OrderEta } from './OrderEta'
import { Bill } from './Bill'
import { OrderProgressBar } from './OrderProgressBar'
import { OrderProgressSteps } from './OrderProgressSteps'
import { OrderStatusBadge, orderStatusTone } from '../SingleOrderCard/orderStatus'
import { BusinessLogo } from '../shared/BusinessLogo'
import Icon from '../shared/Icon'
import { nativeTextStyle, themeGutter, themeImage, themePart, themeSpace, themeVisible } from '@/theme/helpers'
import { usePageSections } from '@/theme/sections'
import { DeliveryPin } from './DeliveryPin'

import {
  useLanguage,
  OrderDetails as OrderDetailsController,
  useToast,
  ToastType,
  useUtils,
  useConfig,
  useSession
} from '@components';

import {
  _setStoreData,
  OIcon, OText,
  GoogleMap,
  PlaceSpot,
  SendGiftCard,
  FloatingButton,
  REVIEW_STATUS,
  REORDER_STATUS,
  OButton,
  OrderStudentInfo,
  NotFoundSource
} from '@ui'
import { useDriverInterpolation } from '../../hooks/useDriverInterpolation';
import { plainParams } from '@/navigators/appNavigation'
import { isGoogleMapsAvailable } from '@/utils/nativeKeys'

export const OrderDetailsUI = (props: OrderDetailsParams) => {
  const {
    readMessages,
    reorderState,
    driverLocation,
    getOrder,
    handleReorder,
    onNavigationRedirect
  } = props

  const theme: any = useTheme()
  // The page's hideable sections (map, address, driver); not movable (status/type if-chain).
  const { isVisible: isSectionVisible } = usePageSections('order_details')
  const [, t] = useLanguage()
  const [{ parsePrice, parseDate, timeFormat, dateFormat }] = useUtils()
  const [, { showToast }] = useToast()
  const [{ configs }] = useConfig()
  const googleMapsApiKey = configs?.google_maps_api_key?.value

  const { order, loading } = props.order
  const declaredValueMeta = order?.metafields?.find?.((m: any) => m?.key === 'declared_value')
  const declaredValue = declaredValueMeta
    ? parseFloat(declaredValueMeta.value)
    : (order?.declared_value != null ? parseFloat(order.declared_value) : null)
  const isCustomOrder = declaredValue != null && declaredValue > 0
  const isGiftCardOrder = !order?.business_id && !isCustomOrder
  const isReservation = order?.delivery_type === 9

  const isOrderCompleted = REORDER_STATUS.includes(parseInt(order?.status, 10))
  const showDeliveryPin = !!order?.delivery_pin && order?.delivery_pin_status === 'requested' && !isOrderCompleted
  const orderDisplayTotal = (order?.summary?.total ?? order?.total ?? 0) + (isCustomOrder ? (declaredValue || 0) : 0)
  const hideOrderPrices = Number(orderDisplayTotal) === 0

  // Set by ReviewOrder once the review is sent (`useSendResult`).
  const isReviewed = !!props.reviewed
  const [isGiftCardSent, setIsGiftCardSent] = useState(false)
  const [refreshing] = useState(false);

  const isExternalDriver = !!order?.external_driver_id
  const externalDriverAsDriver = order?.external_driver
    ? {
        id: order.external_driver.id,
        name: order.external_driver.name,
        lastname: '',
        photo: order.external_driver.photo,
        cellphone: order.external_driver.phone,
        phone: order.external_driver.phone,
        location: (order.external_driver.latitude != null && order.external_driver.longitude != null)
          ? { lat: Number(order.external_driver.latitude), lng: Number(order.external_driver.longitude) }
          : null
      }
    : null
  const displayDriver = isExternalDriver ? externalDriverAsDriver : order?.driver

  const initialDriverLocation = useMemo(() => {
    const loc = displayDriver?.location
    if (!loc) return null
    if (typeof loc?.location === 'string') {
      const parts = loc.location.split(',')
      return {
        lat: parseFloat(parts[0].replace(/[^-.0-9]/g, '')),
        lng: parseFloat(parts[1].replace(/[^-.0-9]/g, ''))
      }
    }
    return loc?.lat && loc?.lng ? { lat: loc.lat, lng: loc.lng } : null
  }, [order?.id, isExternalDriver])
  const effectiveDriverLocation = driverLocation || displayDriver?.location

  const driverAnimatedCoordinate = useDriverInterpolation(driverLocation, initialDriverLocation)

  const mapValidStatuses = [9, 18, 19, 23, 26]
  const placeSpotTypes = [3, 4, 5]
  const deliveryTypes = [1, 7]
  const [isPickup, setIsPickup] = useState(order?.delivery_type === 2)
  // What the theme shows (visibility keys `confirmation.*`, docs/theme/pages-and-visibility.md).
  const hideDeliveryProgress = !themeVisible(theme, 'confirmation.order.progress')
  const showEta = themeVisible(theme, 'confirmation.order.eta')
  const showHelp = themeVisible(theme, 'confirmation.order.help') && themeVisible(theme, 'confirmation.business.messages')
  const showDirections = themeVisible(theme, 'confirmation.order.directions')
  const showTotal = themeVisible(theme, 'confirmation.order.total')
  const showDriverPhoto = themeVisible(theme, 'confirmation.driver.photo')
  const hideDriverName = !themeVisible(theme, 'confirmation.driver.name')
  const hideDriverPhone = !themeVisible(theme, 'confirmation.driver.phone')
  // The driver's chat has no key of its own (v1 `driver.messages` is not mapped).
  const hideDriverMessages = false
  const _formatTime = timeFormat

  const progressBarObjt = isPickup ? getOrderStatuPickUp : getOrderStatus
  const currentOrderStatus = progressBarObjt(order?.status, t, theme)
  const isReservationPreorder = isReservation && parseInt(order?.status, 10) === 13
  const currentOrderStatusText = isReservationPreorder
    ? t('RESERVATION', 'Reservation')
    : (currentOrderStatus?.value || t('YOUR_ORDER_IS_IN_PROGRESS', 'Your order is in progress'))
  const isDriverOnWayToCustomer = order?.delivery_position === 1 || order?.delivery_position == null
  // The driver's map needs a Google Maps key (src/utils/nativeKeys.ts).
  const showDriverMap = !!(
    isGoogleMapsAvailable() &&
    displayDriver &&
    effectiveDriverLocation &&
    !isOrderCompleted &&
    mapValidStatuses.includes(parseInt(order?.status))
  )
  // `order_details` of the theme: its texts, its slots (help, directions,
  // review) and the driver's avatar size (smaller once the order is finished).
  const details = themePart(theme, 'order_details', 'base')
  // The business logo of the completed card: the business cards' frame.
  const logoFrame = themePart(theme, 'business_card', 'base')
  const statusTone = orderStatusTone(order?.status)
  const slots = themePart(theme, 'order_details', 'slots')
  const helpInk = themePart(theme, 'button', `variants.${slots.help.color}.${slots.help.appearance}.color`)
  const skeletonColor = themePart(theme, 'skeleton', 'base.color')
  const styles = useMemo(() => {
    const avatar = themePart(theme, 'avatar', `sizes.${isOrderCompleted ? details.finished_driver_avatar_size : details.driver_avatar_size}`)
    return StyleSheet.create({
      photo: {
        height: avatar.size,
        width: avatar.size,
        borderRadius: themePart(theme, 'avatar', 'base.radius')
      },
      statusText: { ...nativeTextStyle(details.status_text), color: details.status_color, flex: 1 },
      infoText: nativeTextStyle(details.info_text),
      totalText: nativeTextStyle(details.total_text),
      // The estimate: the highlighted value, in the status's look (at most h3 by default).
      etaText: { ...nativeTextStyle(details.status_text), color: details.status_color },
      // The business's name: a card title, as on the business and order cards.
      businessName: { ...nativeTextStyle(themePart(theme, 'order_card', 'base.name')), color: themePart(theme, 'order_card', 'base.name_color') },
      // The page starts under the bar as every screen does.
      top: { paddingTop: themeSpace(theme, 'lg'), flexGrow: 1 },
      page: { marginHorizontal: themeGutter(theme) },
      reservationMap: { marginHorizontal: themeGutter(theme), marginBottom: themeSpace(theme, 'lg') },
      staticMap: { width: '100%', height: 190, borderRadius: themePart(theme, 'card', 'base.radius') },
      directions: { marginTop: themeSpace(theme, 'sm') },
      // The space after the last block (it was the Powered By line's).
      pageEnd: { height: themeSpace(theme, 'lg') + themeSpace(theme, isGiftCardOrder ? 'lg' : 'xxxl') },
      halfStart: { width: '50%', alignItems: 'flex-start' },
      fullStart: { width: '100%', alignItems: 'flex-start' }
    })
  }, [theme, isGiftCardOrder, isOrderCompleted])

  const resfreshOrder = () => getOrder && getOrder()

  const handleGoToMessages = (type: string) => {
    readMessages && readMessages()
    onNavigationRedirect(
      'MessageView',
      {
        type,
        order: plainParams(order),
        orderId: order?.id,
        business: type === 'business',
        driver: type === 'driver'
      }
    )
  }

  const handleClickOrderReview = (order: any) => {
    onNavigationRedirect('ReviewOrder', { order })
  }

  const handleRedirectToCheckout = async (id: number) => {
    const result = await handleReorder(id)
    onNavigationRedirect('CheckoutPage', { cartUuid: result?.uuid })
  }

  useEffect(() => {
    const handleArrowBack: () => any = () => {
      if (props.isFromCheckout) {
        onNavigationRedirect('BottomTab', { screen: 'Home' })
        return true
      }
    }
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleArrowBack)
    return () => {
      backHandler.remove()
    }
  }, [])

  const driverLocationString = typeof order?.driver?.location?.location === 'string' && order?.driver?.location?.location?.split(',').map((l: string) => l.replace(/[^-.0-9]/g, ''))

  const parseLocationString = (loc: any) => {
    if (typeof loc?.location === 'string') {
      return {
        ...loc,
        lat: parseFloat(loc.location.split(',')[0].replace(/[^-.0-9]/g, '')),
        lng: parseFloat(loc.location.split(',')[1].replace(/[^-.0-9]/g, ''))
      }
    }
    return loc
  }

  const parsedLocations = useMemo(() => {
    const driverLoc = effectiveDriverLocation
    return [
      parseLocationString({
        ...driverLoc,
        title: t('DRIVER', 'Driver'),
        icon: displayDriver?.photo || themeImage(theme, 'map.driver'),
      }),
      parseLocationString({
        ...order?.business?.location,
        title: order?.business?.name,
        icon: order?.business?.logo || themeImage(theme, 'placeholder.business_logo'),
      }),
      parseLocationString({
        ...order?.customer?.location,
        title: t('YOUR_LOCATION', 'Your Location'),
        // The customer's photo, else the theme's marker (`map.customer`), else the generic avatar.
        icon: order?.customer?.photo || themeImage(theme, 'map.customer')?.uri || 'https://res.cloudinary.com/demo/image/upload/c_thumb,g_face,r_max/d_avatar.png/non_existing_id.png',
      })
    ]
  }, [order?.id, driverLocation?.lat, driverLocation?.lng]);

  // An order that could not load stays on this screen with its error and a retry (below); one
  // already shown whose refresh failed keeps showing, with the error in a toast.
  const hasOrder = !!order && Object.keys(order).length > 0
  const loadFailed = !loading && !!props?.order?.error && !hasOrder

  useEffect(() => {
    if (props?.order?.error && !props?.order?.loading && hasOrder) {
      showToast(ToastType.Error, props?.order?.error)
    }
  }, [props?.order?.error, props?.order?.loading])

  useEffect(() => {
    if (!order?.delivery_type) return
    setIsPickup(order?.delivery_type === 2)
  }, [order?.delivery_type])

  // The screen's title is the order's number: the page learns it here when it was opened with
  // the order's uuid only.
  useEffect(() => {
    if (order?.id) props.onOrderNumber?.(order.id)
  }, [order?.id])

  return (
    <OrderDetailsContainer
      keyboardShouldPersistTaps="handled"
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.top}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { resfreshOrder() }}
        />
      }
    >
      {!loading && order && Object.keys(order).length > 0 && (
        <View style={{ flex: 1, justifyContent: isGiftCardOrder ? 'space-between' : 'flex-start' }}>
          <OrderContent>
            {!isOrderCompleted && (
              <Header>
                {showDeliveryPin && (
                  <DeliveryPin pin={String(order.delivery_pin)} />
                )}
                <ProgressInfo>
                  <OText style={styles.statusText}>
                    {currentOrderStatusText}
                  </OText>
                  {showHelp && (
                    <OButton
                      iconOnly
                      testID='order-help-button'
                      accessibilityLabel={t('HELP', 'Help')}
                      color={slots.help.color}
                      appearance={slots.help.appearance}
                      size={slots.help.size}
                      icon={<Icon name='chatbubble-ellipses-outline' color={helpInk} />}
                      onClick={() => handleGoToMessages('business')}
                    />
                  )}
                </ProgressInfo>
                {showEta && (
                  <OText style={styles.infoText}>
                    <OrderEta order={order} outputFormat={dateFormat} />
                  </OText>
                )}
                {!hideDeliveryProgress && (
                  <StaturBar>
                    {details.progress_layout === 'segments' ? (
                      <OrderProgressSteps
                        status={order?.status}
                        delivery={[1, 7].includes(order?.delivery_type)}
                        size={details.progress_size}
                      />
                    ) : (
                      <OrderProgressBar
                        percentage={currentOrderStatus?.percentage || 0}
                        status={order?.status}
                        size={details.progress_size}
                      />
                    )}
                  </StaturBar>
                )}
                {parseInt(order?.status) === 23 && !isDriverOnWayToCustomer && (
                  <OText align='center' mTop='sm'>
                    {t('DRIVER_ATTENDING_ANOTHER_ORDER', 'Driver is attending another order')}
                  </OText>
                )}
                {isReservation
                  ? (
                    order?.reservation && (
                      <HeaderTitle>
                        <View style={styles.fullStart}>
                          {parseInt(order?.status) === 0 && (
                            <OText preset='label' weight='bold' mBottom='xs'>
                              {t('WE_ARE_REVIEWING_YOUR_RESERVATION', 'We are reviewing your reservation')}
                            </OText>
                          )}
                          <OText preset='label' weight='bold'>
                            {t('DATE_AND_TIME_RESERVATION', 'Date and time of reservation')}: {parseDate(order?.reservation?.reserve_date, { utc: false, outputFormat: `YYYY-MM-DD ${timeFormat}` })}
                          </OText>
                          <OText preset='body'>
                            {t('NUMBER_OF_GUESTS', 'Number of guests')}: {order?.reservation?.guests_reservation}
                          </OText>
                        </View>
                      </HeaderTitle>
                    )
                    )
                  : showEta && (
                    <>
                      <HeaderTitle>
                        <OText style={styles.etaText}>
                          <OrderEta order={order} outputFormat={_formatTime} />
                        </OText>
                      </HeaderTitle>
                      <HeaderTitle>
                        <View style={styles.halfStart}>
                          <OText preset='body'>
                            {isPickup ? t('PICKUP_ORDER', 'Pickup Order') : t('ESTIMATED_TIME', 'Estimated Time')}
                          </OText>
                        </View>
                      </HeaderTitle>
                    </>
                    )}
              </Header>
            )}

            {isOrderCompleted && (
              <BusinessInfoContainer>
                {themeVisible(theme, 'confirmation.business.logo') && (
                  <BusinessLogo
                    uri={order?.business?.logo || null}
                    size={details.business_logo_size}
                    radius={logoFrame.radius}
                    background={logoFrame.background}
                    shadow={logoFrame.logo_shadow}
                  />
                )}
                <BusinessTextContainer>
                  <OText style={styles.businessName} numberOfLines={1}>{order.business.name}</OText>
                  {themeVisible(theme, 'confirmation.order.date') && (
                    <OText style={styles.infoText} color='text_muted'>
                      {/* The same date the order's card shows, in the project's format. */}
                      {order?.delivery_datetime_utc ? parseDate(order?.delivery_datetime_utc) : parseDate(order?.delivery_datetime, { utc: false })}
                    </OText>
                  )}
                  <OrderStatusBadge
                    status={order?.status}
                    label={isReservationPreorder
                      ? t('RESERVATION', 'Reservation')
                      : (currentOrderStatus?.value || getOrderStatus(order?.status, t, theme)?.value)}
                  />
                </BusinessTextContainer>
                {/* The finished mark in the status's tone: a check when completed, a cross when stopped. */}
                <StatusCheckmark tone={statusTone}>
                  <Icon name={statusTone === 'danger' ? 'close-outline' : 'checkmark-outline'} size='lg' color={`on_${statusTone}`} />
                </StatusCheckmark>
              </BusinessInfoContainer>
            )}

            {showDriverMap && isSectionVisible('map') && (
                <View style={styles.page}>
                  <Map>
                    <GoogleMap
                      readOnly
                      manualZoom
                      locations={parsedLocations}
                      location={typeof order?.driver?.location?.location === 'string'
                        ? {
                          lat: parseFloat(driverLocationString[0]),
                          lng: parseFloat(driverLocationString[1]),
                        } : effectiveDriverLocation
                      }
                      driverAnimatedCoordinate={driverAnimatedCoordinate}
                    />
                  </Map>
                </View>
            )}
            {isReservation && order?.business?.location?.lat != null && googleMapsApiKey && (
              <View style={styles.reservationMap}>
                <FastImage
                  source={{ uri: getGoogleMapImage(order?.business?.location, googleMapsApiKey), priority: FastImage.priority.normal }}
                  style={styles.staticMap}
                  objectFit='cover'
                />
                {showDirections && (
                <OButton
                  text={t('GET_DIRECTIONS', 'Get Directions')}
                  color={slots.directions.color}
                  appearance={slots.directions.appearance}
                  size={slots.directions.size}
                  style={styles.directions}
                  onClick={() => showLocation({
                    latitude: order?.business?.location?.lat,
                    longitude: order?.business?.location?.lng,
                    title: order?.business?.name,
                    dialogTitle: t('OPEN_IN_MAPS', 'Open in Maps'),
                    dialogMessage: t('CHOOSE_MAPS_APP_DIRECTIONS', 'Choose an app to get directions'),
                    cancelText: t('CANCEL', 'Cancel')
                  })}
                />
                )}
              </View>
            )}

            {!isGiftCardOrder && placeSpotTypes.includes(order?.delivery_type) && !isOrderCompleted && (
              <PlaceSpotWrapper>
                <PlaceSpot
                  isInputMode
                  cart={order}
                  spotNumberDefault={order?.spot_number}
                  vehicleDefault={order?.vehicle}
                />
              </PlaceSpotWrapper>
            )}

            {!isOrderCompleted &&
              (
                (!isGiftCardOrder && order?.delivery_option !== undefined && deliveryTypes?.includes?.(order?.delivery_type)) ||
                !!order?.comment
              ) && (
                <OrderSection>
                  {!isGiftCardOrder && order?.delivery_option !== undefined && deliveryTypes?.includes?.(order?.delivery_type) && (
                    <View>
                      <SectionTitle text={theme.native.components.order_details.base.address_title}>{t('DELIVERY_PREFERENCE', 'Delivery preference')}</SectionTitle>
                      <OText style={styles.infoText} align='left'>
                        {order?.delivery_option?.name ? t(order?.delivery_option?.name.toUpperCase().replace(/\s/g, '_'), order?.delivery_option?.name) : t('EITHER_WAY', 'Either way')}
                      </OText>
                    </View>
                  )}
                  {!!order?.comment && (
                    <View>
                      <SectionTitle text={theme.native.components.order_details.base.address_title} style={{ marginTop: themeSpace(theme, 'lg') }}>{t('COMMENT', 'Comment')}</SectionTitle>
                      <OText style={styles.infoText} align='left'>{order?.comment}</OText>
                    </View>
                  )}
                  <Separator />
                </OrderSection>
              )}

            {/* A custom order's estimate (the bill shows every other total). */}
            {!isOrderCompleted && !hideOrderPrices && showTotal && isCustomOrder && (
              <WrapperFullTotal>
                <OText style={styles.totalText}>
                  {t('ESTIMATED_TOTAL', 'Estimated Total')}:
                </OText>
                <OText style={styles.totalText}>
                  ~ {parsePrice((order?.summary?.total ?? order?.total ?? 0) + (declaredValue || 0))}
                </OText>
              </WrapperFullTotal>
            )}

            {(order?.student_id || order?.student?.id) && (
              <OrderStudentInfo order={order} />
            )}
            {!hideOrderPrices && (
              <Bill
                hideTotal={(isCustomOrder && !isOrderCompleted) || (!showTotal && !isOrderCompleted)}
                order={order}
                isPickup={isPickup}
                isGiftCardOrder={isGiftCardOrder}
                isCustomOrder={isCustomOrder}
                declaredValue={declaredValue}
              />
            )}
            {(
              parseInt(order?.status) === 1 ||
              parseInt(order?.status) === 11 ||
              parseInt(order?.status) === 15
            ) && !order.review && !isReviewed && !isGiftCardOrder && isSectionVisible('review_actions') && (
                <ReviewSection>
                  <SectionTitle text={theme.native.components.order_details.base.address_title}>{order?.review ? t('ORDER_REVIEWED', 'Order Reviewed') : t('REVIEW_YOUR_ORDER', 'Review your order')}</SectionTitle>
                  {!order?.review && (
                    <ReviewContainer>
                      <OButton
                        text={t('REVIEW', 'Review')}
                        color={slots.review.color}
                        appearance={slots.review.appearance}
                        size={slots.review.size}
                        onClick={() => handleClickOrderReview(order)}
                      />
                    </ReviewContainer>
                  )}
                  <Separator />
                </ReviewSection>
              )}
            {isCustomOrder && !!order?.business?.address && isSectionVisible('address') && (
              <OrderSection>
                <SectionTitle text={theme.native.components.order_details.base.address_title}>{t('PICKUP_ADDRESS', 'Pickup address')}</SectionTitle>
                <WrapperAddress>
                  {!!order?.business?.name && <OText style={styles.infoText}>{order.business.name}</OText>}
                  <OText style={styles.infoText}>{order.business.address}</OText>
                </WrapperAddress>
              </OrderSection>
            )}
            {!isCustomOrder && !!order?.business?.address && isSectionVisible('address') && (
              <OrderSection>
                <SectionTitle text={theme.native.components.order_details.base.address_title}>
                  {isReservation
                    ? t('RESERVATION_ADDRESS', 'Reservation Address')
                    : isPickup ? t('PICKUP_ADDRESS', 'Pickup address') : t('DELIVERY_ADDRESS', 'Delivery address')}
                </SectionTitle>
                <WrapperAddress>
                  {isPickup && <OText style={styles.businessName}>{order?.business?.name}</OText>}
                  <OText style={styles.infoText}>
                    {(isPickup || isReservation) ? order?.business?.address : order?.customer?.address}
                  </OText>
                </WrapperAddress>
              </OrderSection>
            )}
            {isCustomOrder && !!order?.customer?.address && isSectionVisible('address') && (
              <OrderSection>
                <SectionTitle text={theme.native.components.order_details.base.address_title}>{t('DELIVERY_ADDRESS', 'Delivery address')}</SectionTitle>
                <WrapperAddress>
                  <OText style={styles.infoText}>{order.customer.address}</OText>
                </WrapperAddress>
              </OrderSection>
            )}

            {displayDriver && isSectionVisible('driver') && (
              <OrderDriver>
                <Separator />
                <Customer>
                  {!!displayDriver?.photo && showDriverPhoto && (
                    <WrapperPhoto>
                      <FastImage
                        style={styles.photo}
                        source={{
                          uri: displayDriver?.photo,
                          priority: FastImage.priority.normal,
                        }}
                        objectFit='cover'
                      />
                    </WrapperPhoto>
                  )}
                  <InfoBlock>
                    <WrapperOptions>
                      {!hideDriverName && (
                        <OText preset='label' mBottom='xxs'>
                          {displayDriver?.name} {displayDriver?.lastname}
                        </OText>
                      )}
                      {!hideDriverMessages && (
                        <Icons>
                          {!isExternalDriver && (
                            <OButton
                              iconOnly
                              testID='order-driver-chat'
                              accessibilityLabel={t('MESSAGES', 'Messages')}
                              color={slots.help.color}
                              appearance={slots.help.appearance}
                              size={slots.help.size}
                              icon={<Icon name='chatbubble-ellipses-outline' color={helpInk} />}
                              onClick={() => handleGoToMessages('driver')}
                            />
                          )}
                          {!!displayDriver?.cellphone && !hideDriverPhone && (
                            <OButton
                              iconOnly
                              testID='order-driver-call'
                              accessibilityLabel={t('CALL', 'Call')}
                              color={slots.help.color}
                              appearance={slots.help.appearance}
                              size={slots.help.size}
                              icon={<Icon name='call-outline' color={helpInk} />}
                              onClick={() => displayDriver?.cellphone && Linking.openURL(`tel:${displayDriver.cellphone}`)}
                            />
                          )}
                        </Icons>
                      )}
                    </WrapperOptions>
                    <OText mBottom='xxs'>{t('YOUR_DRIVER', 'Your Driver')}</OText>
                  </InfoBlock>
                </Customer>
              </OrderDriver>
            )}

            {isGiftCardOrder && order?.products[0]?.gift_card?.status === 'pending' && !isGiftCardSent && (
              <SendGiftCard
                giftCardId={order?.products[0]?.gift_card?.id}
                setIsGiftCardSent={setIsGiftCardSent}
              />
            )}
          </OrderContent>
          <View style={styles.pageEnd} />
        </View>
      )}

      {loadFailed && (
        <OrderLoadError>
          <NotFoundSource
            iconName='receipt-outline'
            content={t('ERROR_LOADING_ORDER', 'We couldn\'t load this order')}
            btnTitle={t('RETRY', 'Retry')}
            onClickButton={resfreshOrder}
          />
        </OrderLoadError>
      )}

      {loading && (
        <Placeholder>
          <Header>
            <OrderInfo style={{ paddingBottom: 0 }}>
              <OrderData>
                <PlaceholderLine color={skeletonColor} width={60} height={15} />
                <PlaceholderLine color={skeletonColor} width={60} height={10} />
                <StaturBar style={{ marginBottom: 0 }}>
                  <PlaceholderLine color={skeletonColor} height={15} />
                  <PlaceholderLine color={skeletonColor} width={40} height={20} />
                </StaturBar>
              </OrderData>
            </OrderInfo>
          </Header>
          <OrderContent>
            <OrderBusiness>
              <PlaceholderLine color={skeletonColor} width={30} height={20} />
              <PlaceholderLine color={skeletonColor} width={60} height={15} />
              <PlaceholderLine color={skeletonColor} width={75} height={10} />
              <PlaceholderLine color={skeletonColor} width={40} height={10} />
              <PlaceholderLine color={skeletonColor} width={95} height={10} />
              <PlaceholderLine color={skeletonColor} width={20} height={20} />
              <PlaceholderLine color={skeletonColor} width={70} height={15} />
              <PlaceholderLine color={skeletonColor} width={65} height={10} />
              <PlaceholderLine color={skeletonColor} width={80} height={10} />
              <PlaceholderLine color={skeletonColor} width={70} height={10} />
              <View>
                <PlaceholderLine color={skeletonColor} width={60} height={20} />
                <PlaceholderLine color={skeletonColor} width={40} height={10} />
              </View>
              <PlaceholderLine color={skeletonColor} width={20} height={20} />
              <PlaceholderLine color={skeletonColor} width={70} height={15} />
              <PlaceholderLine color={skeletonColor} width={65} height={10} />
              <PlaceholderLine color={skeletonColor} width={80} height={10} />
              <PlaceholderLine color={skeletonColor} width={70} height={10} />
              <View>
                <PlaceholderLine color={skeletonColor} width={60} height={20} />
                <PlaceholderLine color={skeletonColor} width={40} height={10} />
              </View>
            </OrderBusiness>
          </OrderContent>
        </Placeholder>
      )}
    </OrderDetailsContainer>
  )
}

export const OrderDetails = (props: OrderDetailsParams) => {
  const [{ auth, loading: sessionLoading }] = useSession()
  const [, t] = useLanguage()

  // An order link opened without a session (a deep link): the order cannot be asked for yet.
  // It stays under the login, which comes back to it.
  if (!auth) {
    return sessionLoading ? null : (
      <OrderLoadError>
        <NotFoundSource
          iconName='receipt-outline'
          content={t('LOGIN_TO_SEE_ORDER', 'Log in to see this order')}
          btnTitle={t('LOG_IN', 'Log in')}
          onClickButton={() => props.onNavigationRedirect?.('Login')}
        />
      </OrderLoadError>
    )
  }

  const orderDetailsProps = {
    ...props,
    disabledLeaveOrderSocket: true,
    UIComponent: OrderDetailsUI,
  }

  return <OrderDetailsController {...orderDetailsProps} />;
}
