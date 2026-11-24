import React, { useState, useEffect, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { nativeBoxStyle, themeImage, themeSpace } from '@/theme/helpers'
import { useTheme } from 'styled-components/native';
import { useFocusEffect } from '@react-navigation/native'

import {
  Placeholder,
  PlaceholderLine,
  Fade
} from "../shared/Skeleton";

import { MessageListingWrapper } from './styles';
import { getOrderStatus } from '../../utils'
import { MessageListingParams, OrdersOptionParams } from '../../types'

import { useLanguage, OrderList, useBusiness } from '@components'
import {
  NotFoundSource,
  ActiveOrders,
} from '@ui'
import { plainParams } from '@/navigators/appNavigation'

const OrdersOptionUI = (props: OrdersOptionParams) => {
  const {
    navigation,
    activeOrders,
    orderList,
    pagination,
    customArray,
    onNavigationRedirect,
    orderStatus,
    loadMoreOrders,
    loadOrders,
    setOrderListState,
    setRefreshOrders,
    refreshOrders,
    onClickOrder
  } = props

  const theme: any = useTheme();
  const skeleton = theme.native.components.skeleton.base
  const styles = useMemo(() => {
    const card = theme.native.components.order_card.base
    return StyleSheet.create({
      skeletons: { gap: themeSpace(theme, 'sm') },
      skeletonCard: {
        width: '100%',
        flexDirection: 'row',
        padding: theme.native.components.card.base.padding,
        borderRadius: card.radius,
        ...nativeBoxStyle(card),
      },
      line: { borderRadius: skeleton.radius },
      thumbLine: { marginRight: themeSpace(theme, 'lg'), marginBottom: 0 },
      firstLine: { marginTop: themeSpace(theme, 'xs'), marginBottom: themeSpace(theme, 'sm') },
      lastLine: { marginBottom: 0 },
    })
  }, [theme])
  const [, t] = useLanguage()
  const { loading, error, orders: values } = orderList
  const orders = customArray || values || []

  useFocusEffect(
    React.useCallback(() => {
      loadOrders()
    }, [navigation])
  )

  useEffect(() => {
    if (loading) return
    setOrderListState(orderList)
  }, [orderList, loading])

  useEffect(() => {
    if (refreshOrders) {
      const fetchOrders = async () => {
        await loadOrders(false, false, false, true)
        setRefreshOrders && setRefreshOrders(false)
      }
      fetchOrders()
    }
  }, [refreshOrders])

  return (
    <>
      {!loading && orders.length === 0 && (
        <NotFoundSource
          srcImage={themeImage(theme, 'empty.not_found')}
          content={t('NO_RESULTS_FOUND', 'Sorry, no results found')}
        />
      )}

      {loading && (
        <View style={styles.skeletons}>
          {[...Array(6)].map((_, i) => (
            <Placeholder key={i} Animation={Fade}>
              <View style={styles.skeletonCard}>
                <PlaceholderLine width={20} height={70} color={skeleton.color} style={[styles.line, styles.thumbLine]} />
                <Placeholder>
                  <PlaceholderLine width={30} color={skeleton.color} style={[styles.line, styles.firstLine]} />
                  <PlaceholderLine width={50} color={skeleton.color} style={styles.line} />
                  <PlaceholderLine width={20} color={skeleton.color} style={[styles.line, styles.lastLine]} />
                </Placeholder>
              </View>
            </Placeholder>
          ))}
        </View>
      )}

      {!loading && !error && orders.length > 0 && (
        <ActiveOrders
          orders={orders.filter((order: any) => orderStatus.includes(order.status) && order.business_id)}
          pagination={pagination}
          loadMoreOrders={loadMoreOrders}
          customArray={customArray}
          getOrderStatus={getOrderStatus}
          onNavigationRedirect={onNavigationRedirect}
          isMessageView
          handleClickOrder={onClickOrder}
        />
      )}

    </>
  )
}

export const OrderListing = (props: OrdersOptionParams) => {
  const [businessState] = useBusiness();
  const OrderListingProps = {
    ...props,
    UIComponent: OrdersOptionUI,
    orderStatus: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26],
    useDefualtSessionManager: true,
    paginationSettings: {
      initialPage: 1,
      pageSize: 10,
      controlType: 'infinity'
    },
    businessId: businessState?.business?.id,
    profileMessages: true,
    orderBy: 'last_direct_message_at',
    orderDirection: 'asc'
  }
  return <OrderList {...OrderListingProps} />
}

export const MessageListing = (props: MessageListingParams) => {
  const { setRefreshOrders, onNavigationRedirect, refreshOrders } = props

  const [orderListStatus, setOrderListStatus] = useState({
    error: null,
    loading: false,
    orders: []
  })

  return (
    <MessageListingWrapper>
      <OrderListing
        ordersLength={{ activeOrdersLength: 0, previousOrdersLength: 0 }}
        setOrderListState={setOrderListStatus}
        franchiseId={props.franchiseId}
        setRefreshOrders={setRefreshOrders}
        refreshOrders={refreshOrders}
        onClickOrder={(id: string) => onNavigationRedirect('MessageView', {
          order: plainParams(orderListStatus?.orders?.find?.((order: any) => order?.uuid === id)),
          orderId: id
        })}
      />
    </MessageListingWrapper>
  )
}
