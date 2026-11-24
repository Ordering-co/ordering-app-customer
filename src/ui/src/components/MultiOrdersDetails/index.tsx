import React, { useEffect, useMemo } from 'react'
import { SectionTitle } from '../shared/SectionTitle'
import { BackHandler, StyleSheet, View } from 'react-native'
import { useTheme } from 'styled-components/native'
import { Placeholder, PlaceholderLine, Fade } from '@/ui/src/components/shared/Skeleton'

import { getOrderStatus } from '../../utils'
import { nativeTextStyle, themeGutter, themePart, themeSpace, themeVisible } from '@/theme/helpers'
import { usePageSections } from '@/theme/sections'
import { OrderProgressBar } from '../OrderDetails/OrderProgressBar'
import { OrderStatusBadge } from '../SingleOrderCard/orderStatus'

import {
  OrdersDetailsContainer,
  Header,
  Divider,
  Section,
  Customer,
  InfoBlock,
  Row,
  OrdersSummary,
  BorderLine,
  StaturBar
} from './styles'
import { SingleOrderCard } from './SingleOrderCard'

import {
  MultiOrdersDetails as MultiOrdersDetailsController,
  useLanguage,
  useUtils,
  useToast,
  ToastType,
  useConfig
} from '@components'
import { NotFoundSource, OText } from '@ui'
import { goHome } from '@/navigators/appNavigation'

/** A skeleton line of the theme's `skeleton` (color, radius). */
const SkeletonLine = (lineProps: any) => {
  const theme: any = useTheme()
  const skeleton = themePart(theme, 'skeleton', 'base')
  return <PlaceholderLine noMargin color={skeleton.color} {...lineProps} style={[{ borderRadius: skeleton.radius }, lineProps.style]} />
}

export const MultiOrdersDetailsUI = (props: any) => {
  const {
    navigation,
    customer,
    paymentEvents,
    ordersSummary,
    isFromMultiCheckout
  } = props

  const theme: any = useTheme()
  // `visibility.confirmation.customer.*`: the customer's address and phone.
  const showCustomerAddress = themeVisible(theme, 'confirmation.customer.address')
  const { render } = usePageSections('multi_orders')
  // Summary lines are the `bill` rows; skeletons are the theme's `skeleton`.
  const styles = useMemo(() => {
    const bill = themePart(theme, 'bill', 'base')
    return StyleSheet.create({
      content: { paddingHorizontal: themeGutter(theme) },
      row: { ...nativeTextStyle(bill.row), color: bill.row_color },
      total: { ...nativeTextStyle(bill.total), color: bill.total_color },
      skeletonBlock: { marginBottom: themeSpace(theme, 'sm') },
      status: { marginBottom: themeSpace(theme, 'sm') },
      summaryTotal: { marginTop: themeSpace(theme, 'sm') }
    })
  }, [theme])

  const { loading, orders, error } = props.ordersList
  const [, t] = useLanguage()
  const [{ parsePrice }] = useUtils();
  const [, { showToast }] = useToast();
  const [{ configs }] = useConfig()

  const isTaxIncludedOnPrice = orders.every((_order: any) => _order.taxes?.length ? _order.taxes?.every((_tax: any) => _tax.type === 1) : true)
  const deliveryType = orders.find((order: any) => order.delivery_type)?.delivery_type
  const progressBarStyle = configs.multi_business_checkout_progress_bar_style?.value
  const showBarInOrder = ['group', 'both']
  const showBarInIndividual = ['individual', 'both']
  const groupStatus = getOrderStatus(orders[0]?.status, t, theme)

  const walletName: any = {
    cash: {
      name: t('PAY_WITH_CASH_WALLET', 'Pay with Cash Wallet')
    },
    credit_point: {
      name: t('PAY_WITH_CREDITS_POINTS_WALLET', 'Pay with Credit Points Wallet')
    }
  }

  const handleArrowBack: any = () => {
    if (!isFromMultiCheckout) {
      navigation?.canGoBack() && navigation.goBack();
      return;
    }
    goHome(navigation);
    return true
  }

  const handleGoToOrderDetails = (uuid: any) => {
    navigation.navigate('OrderDetails', { orderId: uuid })
  }

  useEffect(() => {
    if (error) {
      showToast(ToastType.Error, error)
    }
  }, [error])

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleArrowBack)
    return () => {
      backHandler.remove()
    }
  }, [])

  const renderGreeting = () => (
    <>
      <Header>
        {loading ? (
          <Placeholder Animation={Fade}>
            <SkeletonLine width={20} height={30} style={styles.skeletonBlock} />
            <SkeletonLine height={18} />
          </Placeholder>
        ) : (
          <>
            <OText preset='h3' weight='normal' mBottom='sm'>
              {t('HEY', 'Hey')} <OText preset='h3' weight={700}>{customer?.name} {customer?.lastname}</OText>
            </OText>
            <OText preset='body_sm'>{t('ORDER_MESSAGE_HEADER_TEXT', 'Once business accepts your order, we will send you an email, thank you!')}</OText>
          </>
        )}
      </Header>
      <Divider />
    </>
  )

  const renderCustomer = () => (
    <>
      <Section>
        <SectionTitle>{t('CUSTOMER_DETAILS', 'Customer Details')}</SectionTitle>
        {loading ? (
          <Customer>
            <SkeletonLine height={18} />
            <SkeletonLine height={18} />
            <SkeletonLine height={18} />
          </Customer>
        ) : (
          <Customer>
            <InfoBlock>
              <OText preset='body_sm' mBottom='xxs'>
                {customer?.name} {customer?.lastname}
              </OText>
              {showCustomerAddress && (
                <OText preset='body_sm' mBottom='xxs'>
                  {customer?.address}
                </OText>
              )}
              {themeVisible(theme, 'confirmation.customer.phone') && (
                <OText preset='body_sm' mBottom='xxs'>
                  {customer?.cellphone}
                </OText>
              )}
            </InfoBlock>
          </Customer>
        )}
      </Section>
      <Divider />
      <Section>
        <SectionTitle>{t('PAYMETHOD', 'Payment method')}</SectionTitle>
        {paymentEvents.map((event: any) => (
          <OText key={event.id} preset='body_sm'>
            {event?.wallet_event
              ? walletName[event?.wallet_event?.wallet?.type]?.name
              : t(event?.paymethod?.name.toUpperCase()?.replace(/ /g, '_'), event?.paymethod?.name)}
          </OText>
        ))}
      </Section>
      <Divider />
      {deliveryType === 1 && showCustomerAddress && (
        <>
          <Section>
            <SectionTitle>{t('DELIVERYA_V21', 'Delivery address')}</SectionTitle>
            {loading ? (
              <SkeletonLine height={18} />
            ) : (
              <OText preset='body_sm' mBottom='xxs'>
                {customer?.address}
              </OText>
            )}
          </Section>
          <Divider />
        </>
      )}
    </>
  )

  const renderSummary = () => loading ? (
    <Placeholder Animation={Fade}>
      <SkeletonLine height={300} style={styles.skeletonBlock} />
    </Placeholder>
  ) : (
    <OrdersSummary>
      <SectionTitle>{t('ORDER_SUMMARY', 'Order summary')}</SectionTitle>
      {(showBarInOrder.includes(progressBarStyle)) && (
        <StaturBar isOrderDetails>
          <OrderProgressBar percentage={groupStatus?.percentage || 0} status={orders[0]?.status} />
        </StaturBar>
      )}
      {!!groupStatus?.value && (
        <View style={styles.status}>
          <OrderStatusBadge status={orders[0]?.status} label={groupStatus.value} />
        </View>
      )}
      {orders.map((order: any) => (
        <Row key={order.id}>
          <OText style={styles.row}>
            {t('ORDER', 'Order')} #{order.id}
          </OText>
          <OText style={styles.row}>
            {parsePrice(order?.summary?.total ?? order?.total)}
          </OText>
        </Row>
      ))}
      <BorderLine />
      {!isTaxIncludedOnPrice && (
        <>
          <Row>
            <OText style={styles.row}>
              {t('TOTAL_BEFORE_TAX', 'Total before tax')}:
            </OText>
            <OText style={styles.row}>
              {parsePrice(ordersSummary?.subtotal)}
            </OText>
          </Row>
          <Row>
            <OText style={styles.row}>
              {t('ESTIMATED_TAX_TO_BE_COLLECTED', 'Estimated tax to be collected')}:
            </OText>
            <OText style={styles.row}>
              {parsePrice(ordersSummary?.tax)}
            </OText>
          </Row>
          <BorderLine />
        </>
      )}
      <Row style={styles.summaryTotal}>
        <OText style={styles.total} weight={500}>
          {t('PAYMENT_TOTAL', 'Payment total')}:
        </OText>
        <OText style={styles.total} weight={500}>
          {parsePrice(ordersSummary?.total)}
        </OText>
      </Row>
    </OrdersSummary>
  )

  const renderOrders = () => loading ? (
    [...Array(3).keys()].map(i => (
      <Placeholder Animation={Fade} key={i}>
        <SkeletonLine height={300} style={styles.skeletonBlock} />
      </Placeholder>
    ))
  ) : (
    <>
      {orders.map((order: any) => (
        <React.Fragment key={order.id}>
          <SingleOrderCard
            navigation={navigation}
            order={order}
            handleGoToOrderDetails={handleGoToOrderDetails}
            showProgressBar={showBarInIndividual.includes(progressBarStyle)}
          />
          <Divider />
        </React.Fragment>
      ))}
    </>
  )

  return (
    <OrdersDetailsContainer keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      {render({
        greeting: renderGreeting,
        customer: renderCustomer,
        summary: renderSummary,
        orders: renderOrders
      })}
      {!loading && (error || orders?.length === 0) && (
        error?.includes('ERROR_ACCESS_EXPIRED') ? (
          <NotFoundSource
            content={t(error[0], 'Sorry, the order has expired.')}
          />
        ) : (
          <NotFoundSource
            content={t('NOT_FOUND_ORDER', 'Sorry, we couldn\'t find the requested order.')}
            btnTitle={t('ORDERS_REDIRECT', 'Go to Orders')}
            onClickButton={() => goHome(navigation, { screen: 'MyOrders' })}
          />
        )
      )}
      <Divider />
    </OrdersDetailsContainer>
  )
}

export const MultiOrdersDetails = (props: any) => {
  const MultiOrdersDetails = {
    ...props,
    UIComponent: MultiOrdersDetailsUI
  }
  return <MultiOrdersDetailsController {...MultiOrdersDetails} />
}
