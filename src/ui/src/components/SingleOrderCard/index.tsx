import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from 'styled-components/native';
import { useIsFocused } from '@react-navigation/native';

import { SingleOrderCardParams } from '../../types';
import { OrderEta } from '../OrderDetails/OrderEta'
import { OrderStatusBadge } from './orderStatus'
import { nativeBoxStyle, nativeTextStyle, themeControlHeight, themePart, themeSpace, themeVisible } from '@/theme/helpers'
import { BusinessLogo } from '../shared/BusinessLogo'
import {
  InnerContainer,
  CardInfoWrapper,
  ContentHeader,
  ButtonWrapper,
  ContentFooter,
  UnreadMessageCounter,
  MultiLogosContainer,
  InfoText
} from './styles';

import {
  SingleOrderCard as SingleOrderCardController,
  useUtils,
  useOrder,
  useLanguage,
  useConfig
} from '@components';

import { OAlertOriginal as OAlert, OText, OButton, CardAnimation, LottieAnimation } from '@ui'
import { IMAGE_REQUEST, imageUrl } from '@/utils/imageUrl'

const SingleOrderCardUI = (props: SingleOrderCardParams) => {
  const {
    order,
    reorderLoading,
    handleReorder,
    getOrderStatus,
    handleFavoriteOrder,
    onNavigationRedirect,
    pastOrders,
    isMessageView,
    handleClickOrder,
    handleRemoveCart,
    cartState
  } = props;

  const [{ parsePrice, parseDate }] = useUtils();
  const [, t] = useLanguage();
  const [{ carts }] = useOrder()
  const [{ configs }] = useConfig()
  const theme: any = useTheme();
  const isFocused = useIsFocused();

  let [reorderSelected, setReorderSelected] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<any>({ open: false, content: null, handleOnAccept: null, id: null, title: null })

  const allowedOrderStatus = [1, 2, 5, 6, 10, 11, 12, 15];
  const isCustomOrder = order?.declared_value != null || order?.metafields?.find?.((m: any) => m?.key === 'declared_value')
  const isGiftCardOrder = !order?.business_id && !isCustomOrder
  const changeIdToExternalId = configs?.change_order_id?.value === '1'

  // `order_card` (default variant): box, texts and action slots.
  const reviewSlot = themePart(theme, 'order_card', 'slots.review')
  const reorderSlot = themePart(theme, 'order_card', 'slots.reorder')
  const unreadSlot = themePart(theme, 'chat_bubble', 'slots.unread')
  const favorite = theme.native.components.favorite.base
  const logoFrame = theme.native.components.business_card.base
  const styles = useMemo(() => {
    const card = theme.native.components.order_card.base
    const badge = theme.native.components.badge
    const unread = badge.variants[unreadSlot.variant ?? 'primary']
    return StyleSheet.create({
      container: {
        ...nativeBoxStyle(card),
        borderRadius: card.radius,
        marginBottom: themeSpace(theme, 'lg'),
        padding: theme.native.components.card.base.padding,
      },
      logo: { width: themeControlHeight(theme, 'lg') },
      minilogo: { width: themePart(theme, 'avatar', 'sizes.md.size') },
      grow: { flex: 1 },
      name: { ...nativeTextStyle(card.name), color: card.name_color },
      meta: { ...nativeTextStyle(card.meta), color: card.meta_color },
      total: { ...nativeTextStyle(card.total), color: card.total_color },
      unread: {
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: themeSpace(theme, 'sm'),
        minWidth: badge.sizes[unreadSlot.size ?? 'md'].height,
        height: badge.sizes[unreadSlot.size ?? 'md'].height,
        borderRadius: badge.shapes.count.radius,
        backgroundColor: unread.background,
      },
      unreadText: { ...nativeTextStyle(badge.base.text), color: unread.color },
    })
  }, [theme, unreadSlot])

  const handleReorderClick = (order: any) => {
    setReorderSelected(null)
    reorderSelected = null
    const isMultiOrders = Array.isArray(order?.id)

    const isRemoveCart = isMultiOrders
      ? order?.business_id?.some((businessId: any) => !!carts[`businessId:${businessId}`]?.uuid)
      : carts[`businessId:${order?.business_id}`] && !!carts[`businessId:${order?.business_id}`]?.uuid

    if (isRemoveCart) {
      setConfirm({
        open: true,
        content: [t('QUESTION_DELETE_PRODUCTS_FROM_CART', 'Are you sure that you want to delete all products from cart?')],
        title: t('ORDER', 'Order'),
        handleOnAccept: async () => {
          handleRemoveCart(order)
          setConfirm({ ...confirm, open: false })
        }
      })
    } else {
      const orderId = Array.isArray(order?.id) ? order?.id[0] : order?.id
      setReorderSelected(orderId)
      reorderSelected = orderId
      handleReorder && handleReorder(order?.id)
    }
  };

  const handleClickOrderReview = (order: any) => {
    if (pastOrders) {
      onNavigationRedirect &&
        onNavigationRedirect('ReviewOrder', {
          order: {
            id: order?.id,
            business_id: order?.business_id,
            logo: order?.business?.length > 1 ? order?.business?.map?.((business: any) => business?.logo) : order?.business?.logo,
            driver: order?.driver,
            products: order?.products,
            review: order?.review,
            user_review: order?.user_review,
            business: order?.business
          },
        });
      return
    }
    if (isMessageView) {
      handleClickOrder(order?.uuid)
      return
    }
    onNavigationRedirect &&
      onNavigationRedirect('OrderDetails', { orderId: order?.uuid, orderNumberId: order?.id });
  };

  const handleClickViewOrder = (order: any) => {
    if (isMessageView) {
      handleClickOrder(order?.uuid)
      return
    }
    if (order?.cart_group_id) {
      onNavigationRedirect?.('MultiOrdersDetails', { orderId: order?.cart_group_id });
    } else {
      onNavigationRedirect?.('OrderDetails', { orderId: order?.uuid, orderNumberId: order?.id });
    }
  };

  const handleChangeFavorite = () => {
    handleFavoriteOrder && handleFavoriteOrder(!order?.favorite)
  };

  const handleOriginalReorder = () => {
    setConfirm({ ...confirm, open: false, title: null })
  }

  const hideBusinessLogo = !themeVisible(theme, 'orders.business_logo')
  const hideDate = !themeVisible(theme, 'orders.date')
  const hideBusinessName = !themeVisible(theme, 'orders.business_name')
  const hideOrderNumber = !themeVisible(theme, 'orders.order_number')
  const hideReviewOrderButton = !themeVisible(theme, 'orders.review_order_button')
  const hideReorderButton = !themeVisible(theme, 'orders.reorder_button')
  const hideFavorite = !themeVisible(theme, 'orders.favorite')
  const hideOrderStatus = !themeVisible(theme, 'orders.order_status')
  const hideTotal = !themeVisible(theme, 'orders.total')
  const showNumber = (!pastOrders || order?.business?.length > 1) && !hideOrderNumber
  const orderNumber = order?.business?.length > 1
    ? `${order?.business?.length} ${t('ORDERS', 'orders')}`
    : `${!(changeIdToExternalId && order?.external_id) ? `${t('ORDER_NO', 'Order No')}. ` : ''}${(changeIdToExternalId && order?.external_id) || order.id}`
  const isReservationPreorder = parseInt(order?.delivery_type, 10) === 9 && parseInt(order?.status, 10) === 13

  const orderDate = !hideDate && (
    pastOrders
      ? (order?.delivery_datetime_utc ? parseDate(order?.delivery_datetime_utc) : parseDate(order?.delivery_datetime, { utc: false }))
      : <OrderEta order={order} />
  )
  // The line is measured whole: when it wraps, the number and the date go on two lines.
  const [metaStacked, setMetaStacked] = useState(false)
  const handleMetaLayout = (event: any) => {
    if (event.nativeEvent.lines.length > 1) setMetaStacked(true)
  }

  useEffect(() => {
    if (isFocused) setReorderSelected(null)
  }, [isFocused])

  return (
    <>
      <CardAnimation
        onClick={() => handleClickViewOrder(order)}
        style={styles.container}
      >
        <InnerContainer>
          {/* The business cards' logo frame; a group order shows its first logos. */}
          {!hideBusinessLogo && (
            order?.business?.length > 1 ? (
              <MultiLogosContainer>
                {order?.business?.map((business: any, i: number) => i < 2 && (
                  <BusinessLogo
                    key={business?.id}
                    uri={business?.logo ? imageUrl(business?.logo, { height: IMAGE_REQUEST.logo }) : null}
                    size={styles.minilogo.width}
                    radius={logoFrame.radius}
                    background={logoFrame.background}
                    shadow={logoFrame.logo_shadow}
                  />
                ))}
                {(order?.business?.length - 2) > 0 && (
                  <OText style={styles.meta}>{`+ ${order?.business?.length - 2}`}</OText>
                )}
              </MultiLogosContainer>
            ) : (
              <BusinessLogo
                uri={order.business?.logo ? imageUrl(order.business?.logo, { height: IMAGE_REQUEST.logo }) : null}
                size={styles.logo.width}
                radius={logoFrame.radius}
                background={logoFrame.background}
                shadow={logoFrame.logo_shadow}
              />
            )
          )}
          <CardInfoWrapper>
            {/* The name and the favorite on one row, as on the business card. */}
            <ContentHeader>
              {((order?.business?.length > 1 && !hideOrderNumber) || (!order?.business?.length && !hideBusinessName)) && (
                <OText style={[styles.name, styles.grow]} numberOfLines={1} ellipsizeMode={'tail'}>
                  {order?.business?.length > 1 ? `${t('GROUP_ORDER', 'Group Order')} ${t('No', 'No')}. ${order?.cart_group_id}` : order.business?.name}
                </OText>
              )}
              {isMessageView ? (
                order?.unread_count > 0 && (
                  <UnreadMessageCounter style={styles.unread}>
                    <OText style={styles.unreadText}>{order?.unread_count}</OText>
                  </UnreadMessageCounter>
                )
              ) : !order?.business?.length && !hideFavorite && (
                <LottieAnimation
                  type='favorite'
                  onClick={handleChangeFavorite}
                  initialValue={order?.favorite ? 0.5 : 0}
                  toValue={order?.favorite ? 0 : 0.5}
                  iconProps={{ color: favorite.color, size: favorite.icon_size }}
                  isActive={order?.favorite}
                />
              )}
            </ContentHeader>
            {/* Number and date: the card's metadata, on one line; on two when they do not fit (never cut). */}
            <InfoText>
              {metaStacked ? (
                <>
                  {showNumber && <OText style={styles.meta} numberOfLines={1}>{orderNumber}</OText>}
                  {!hideDate && <OText style={styles.meta} numberOfLines={1}>{orderDate}</OText>}
                </>
              ) : (
                <OText style={styles.meta} onTextLayout={handleMetaLayout}>
                  {showNumber ? orderNumber : ''}
                  {showNumber && !hideDate ? '  \u00B7  ' : ''}
                  {orderDate}
                </OText>
              )}
            </InfoText>
            {/* The status and, for an order in progress, its total. */}
            <ContentFooter>
              {!hideOrderStatus ? (
                <OrderStatusBadge
                  status={order.status}
                  label={isReservationPreorder
                    ? t('RESERVATION', 'Reservation')
                    : getOrderStatus(order.status, t, theme)?.value}
                />
              ) : <View />}
              {!pastOrders && !isMessageView && !hideTotal && (
                <OText style={styles.total}>{parsePrice(order?.summary?.total ?? order?.total)}</OText>
              )}
            </ContentFooter>
            {!!pastOrders && !isGiftCardOrder && (
              <ButtonWrapper>
                {!hideReviewOrderButton &&
                  allowedOrderStatus.includes(parseInt(order?.status)) &&
                  !order.review && order?.cart && (
                    <OButton
                      text={t('REVIEW', 'Review')}
                      color={reviewSlot.color}
                      appearance={reviewSlot.appearance}
                      size={reviewSlot.size}
                      onClick={() => handleClickOrderReview(order)}
                    />
                  )}
                {!hideReorderButton && typeof order?.id === 'number' && order?.cart && !order?.cloned_order_id && (
                  <OButton
                    text={t('REORDER', 'Reorder')}
                    color={reorderSlot.color}
                    appearance={reorderSlot.appearance}
                    size={reorderSlot.size}
                    onClick={() => handleReorderClick(order)}
                    loading={(reorderLoading && order.id === reorderSelected) || cartState?.loading}
                  />
                )}
              </ButtonWrapper>
            )}
          </CardInfoWrapper>
        </InnerContainer>
      </CardAnimation>
      <OAlert
        open={confirm.open}
        title={confirm.title}
        content={confirm.content}
        onAccept={confirm.handleOnAccept}
        onCancel={() => handleOriginalReorder()}
        onClose={() => handleOriginalReorder()}
      />
    </>

  )
}

export const SingleOrderCard = (props: any) => {
  const singleOrderCardProps = {
    ...props,
    UIComponent: SingleOrderCardUI
  }
  return <SingleOrderCardController {...singleOrderCardProps} />
}
