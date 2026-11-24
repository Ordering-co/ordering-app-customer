import React, { useEffect, useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import { useTheme } from 'styled-components/native'
import {
  Placeholder,
  PlaceholderLine,
  Fade
} from "../shared/Skeleton";

import { LastOrdersParams } from '../../types'
import { OrderContainer, OrderInfo } from './styles'
import { PressableScale } from '../shared/PressableScale'
import { themeRadius, themeSpace } from '@/theme/helpers'

import {
  OrderList as OrderListController,
  useUtils,
  useLanguage
} from '@components'
import { OIcon, OText, NotFoundSource } from '@ui'
import { IMAGE_REQUEST, imageUrl } from '@/utils/imageUrl'

const LastOrdersUI = (props: LastOrdersParams) => {
  const {
    orderList,
    onRedirect,
    loadOrders,
    refresh,
    setRefresh
  } = props
  const { loading, orders } = orderList

  const [{ parseDate }] = useUtils()
  const [, t] = useLanguage()
  const theme: any = useTheme()

  const styles = useMemo(() => StyleSheet.create({
    headerLogo: {
      borderRadius: themeRadius(theme, 'md'),
      width: '100%',
      height: 100
    },
    skeleton: {
      marginBottom: themeSpace(theme, 'lg'),
      borderRadius: themeRadius(theme, 'md')
    },
    completedTimeStyle: {
      flexDirection: 'row',
      alignItems: 'center'
    }
  }), [theme])

  const handleClickViewOrder = (uuid: string) => {
    onRedirect && onRedirect('OrderDetails', { orderId: uuid })
  }

  useEffect(() => {
    if(refresh){
      loadOrders && loadOrders(false, false, false, true)
      setRefresh && setRefresh(false)
    }
  }, [refresh])

  return (
    <>
      {loading ? (
        <>
          {[...Array(3)].map((item, i) => (
            <Placeholder key={i} Animation={Fade}>
              <PlaceholderLine height={100} color={theme.native.components.skeleton.base.color} style={styles.skeleton} />
            </Placeholder>
          ))}
        </>
      ) : (
        <>
          {orders.map((order: any) => (
            <PressableScale
              key={order.id}
              onPress={() => handleClickViewOrder(order?.uuid)}
            >
            <OrderContainer>
              <OIcon
                url={imageUrl(order.business?.header, { height: IMAGE_REQUEST.cover })}
                style={styles.headerLogo}
                cover
              />
              <OrderInfo>
                <OText preset='body_lg' weight={700} color='on_overlay'>{order?.business?.name}</OText>
                {(order.delivery_datetime_utc || order?.delivery_datetime) && (
                  <View style={styles.completedTimeStyle}>
                    <OText preset='body_sm' color='on_overlay' space>{t('TUTORIAL_ORDER_COMPLETED', 'Order Completed')}</OText>
                    <OText preset='body_sm' color='on_overlay'>
                      {order.delivery_datetime_utc
                        ? parseDate(order?.delivery_datetime_utc, { outputFormat: 'MMM DD, YY - hh:mm A' })
                        : parseDate(order?.delivery_datetime, { utc: false })}
                    </OText>
                  </View>
                )}
              </OrderInfo>
            </OrderContainer>
            </PressableScale>
          ))}
        </>
      )}
      {!loading && orders.length === 0 && (
        <NotFoundSource
          content={t('NO_RESULTS_FOUND', 'Sorry, no results found')}
          iconName='receipt-outline'
          conditioned
        />
      )}
    </>
  )
}

export const LastOrders = (props: any) => {
  const helpProps = {
    ...props,
    UIComponent: LastOrdersUI,
    orderStatus: [1, 11, 15],
    useDefualtSessionManager: true,
    paginationSettings: {
      initialPage: 1,
      pageSize: 3,
      controlType: 'infinity'
    },
    noGiftCardOrders: true
  }
  return <OrderListController {...helpProps} />
}
