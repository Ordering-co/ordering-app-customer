import React, { useMemo } from 'react'
import { View, StyleSheet, Linking } from 'react-native'
import { useTheme } from 'styled-components/native'

import { getOrderStatus } from '../../utils'
import { isBusinessContactHidden } from '../../utils/contactVisibility'
import { nativeTextStyle, themePart, themeSpace } from '@/theme/helpers'
import { OrderProgressBar } from '../OrderDetails/OrderProgressBar'
import { OrderStatusBadge } from '../SingleOrderCard/orderStatus'

import {
  SingleOrderContainer,
  StaturBar,
  Icons
} from './styles'

import {
  useLanguage,
  useUtils,
  useConfig,
  OrderDetails as OrderDetailsController
} from '@components'
import { OText, OButton, Icon } from '../shared'
import { plainParams } from '@/navigators/appNavigation'

const SingleOrderCardUI = (props: any) => {
  const {
    navigation,
    orderTypes,
    readMessages,
    handleGoToOrderDetails,
    showProgressBar
  } = props

  const { order } = props.order
  const theme: any = useTheme()
  const [, t] = useLanguage()
  const [{ parseDate, parsePrice }] = useUtils()
  const [{ configs }] = useConfig()

  const hideIndividualButton = configs.multi_business_checkout_remove_individual_buttons?.value === '1'
  const hideBusinessContact = isBusinessContactHidden(configs)
  const status = getOrderStatus(order?.status, t, theme)
  // Contact icons are ghost icon buttons: their glyph takes the button's ink.
  const contactInk = themePart(theme, 'button', 'variants.neutral.ghost.color')

  const styles = useMemo(() => {
    const bill = themePart(theme, 'bill', 'base')
    return StyleSheet.create({
      header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: themeSpace(theme, 'xl') },
      title: { flex: 1, marginRight: themeSpace(theme, 'sm') },
      row: { flexDirection: 'row' },
      grow: { flex: 1 },
      business: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
      status: { marginTop: themeSpace(theme, 'xs') },
      totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: themeSpace(theme, 'lg') },
      total: { ...nativeTextStyle(bill.total), color: bill.total_color }
    })
  }, [theme])

  const handleGoToMessages = (type: string) => {
    readMessages && readMessages();
    navigation.navigate(
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

  return (
    <SingleOrderContainer>
      <View style={styles.header}>
        <View style={styles.title}>
          <OText preset='body_lg' weight={500} mBottom='xs'>
            {t('ORDER', 'Order')} #{order.id}
          </OText>
          <View style={styles.row}>
            <OText preset='body_sm'>{orderTypes?.find((type: any) => order?.delivery_type === type?.value)?.text}:</OText>
            <View style={styles.grow}>
              <OText mLeft='xs' preset='body_sm'>
                {
                  order?.delivery_datetime_utc
                    ? parseDate(order?.delivery_datetime_utc)
                    : parseDate(order?.delivery_datetime, { utc: false })
                }
              </OText>
            </View>
          </View>
        </View>
        {!hideIndividualButton && (
          <OButton
            onClick={() => handleGoToOrderDetails(order?.uuid)}
            text={t('ORDER_DETAILS', 'Order Details')}
            appearance='outline'
          />
        )}
      </View>
      <OText preset='body_lg' weight={500} mBottom='md'>
        {t('FROM', 'From')}
      </OText>
      <View style={styles.business}>
        <OText preset='body_sm'>
          {order?.business?.name}
        </OText>
        <Icons>
          {!hideBusinessContact && !!order?.business?.cellphone && (
            <OButton
              iconOnly
              color='neutral'
              appearance='ghost'
              accessibilityLabel={t('CALL', 'Call')}
              icon={<Icon name='call-outline' size='sm' color={contactInk} />}
              onClick={() => order?.business?.cellphone &&
                Linking.openURL(`tel:${order?.business?.cellphone}`)
              }
            />
          )}
          <OButton
            iconOnly
            color='neutral'
            appearance='ghost'
            accessibilityLabel={t('MESSAGES', 'Messages')}
            icon={<Icon name='chatbubble-ellipses-outline' size='sm' color={contactInk} />}
            onClick={() => handleGoToMessages('business')}
          />
        </Icons>
      </View>
      {!hideBusinessContact && (
        <OText preset='body_sm'>
          {order?.business?.email}
        </OText>
      )}
      {!hideBusinessContact && !!order?.business?.cellphone && (
        <OText preset='body_sm'>
          {order?.business?.cellphone}
        </OText>
      )}
      <OText preset='body_sm'>
        {order?.business?.address}
      </OText>
      {showProgressBar && (
        <>
          <StaturBar>
            <OrderProgressBar percentage={status?.percentage || 0} status={order?.status} />
          </StaturBar>
          {!!status?.value && (
            <View style={styles.status}>
              <OrderStatusBadge status={order?.status} label={status.value} />
            </View>
          )}
        </>
      )}
      <View style={styles.totalRow}>
        <OText style={styles.total} weight={600}>
          {t('EXPORT_ORDER_TOTAL', 'Order total')}: {parsePrice(order?.summary?.total ?? order?.total)}
        </OText>
      </View>
    </SingleOrderContainer>
  )
}

export const SingleOrderCard = (props: any) => {
  const [, t] = useLanguage()
  const orderDetailsProps = {
    ...props,
    orderTypes: props.orderTypes || [
      { value: 1, text: t('DELIVERY', 'Delivery') },
      { value: 2, text: t('PICKUP', 'Pickup') },
      { value: 3, text: t('EAT_IN', 'Eat in') },
      { value: 4, text: t('CURBSIDE', 'Curbside') },
      { value: 5, text: t('DRIVE_THRU', 'Drive thru') }
    ],
    UIComponent: SingleOrderCardUI
  }

  return (
    <OrderDetailsController {...orderDetailsProps} />
  )
}
