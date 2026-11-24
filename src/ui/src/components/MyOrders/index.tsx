import React, { useState } from 'react'
import { useTheme } from 'styled-components/native';

import { Container, TabsWrapper, EmptyWrapper } from './styles'
import type { OrdersLength, OrdersLengthKey } from '../../types'
import { themeVisible } from '@/theme/helpers'
import { usePageSections } from '@/theme/sections'

import { GiftCardOrdersList } from '../GiftCard/GiftCardOrdersList'
import { Tabs } from '../../Forms/Tabs'

import { useConfig, useLanguage } from '@components';
import { NotFoundSource, OrdersOption } from '@ui'

/** The sections of the orders tab and the count each one reports. */
const ORDER_SECTIONS: Array<[string, OrdersLengthKey]> = [
  ['upcoming_orders', 'preordersLength'],
  ['active_orders', 'activeOrdersLength'],
  ['past_orders', 'previousOrdersLength']
]

/**
 * What the orders tab shows when its sections have no order: nothing while
 * one of them is still loading, `error` when one could not load its list, and
 * `empty` when all of them loaded and none has an order.
 */
export const ordersEmptyState = (ordersLength: OrdersLength, sections: string[]): 'empty' | 'error' | null => {
  const counted = ORDER_SECTIONS.filter(([section]) => sections.includes(section))
  if (!counted.length || !counted.every(([, key]) => ordersLength[key] === 0)) return null
  return counted.some(([, key]) => ordersLength.errors?.[key]) ? 'error' : 'empty'
}

export const MyOrders = (props: any) => {
  const {
    hideOrders,
    businessesSearchList,
    refreshOrders,
    setRefreshOrders
  } = props

  const [{ configs }] = useConfig()
  const [, t] = useLanguage()
  const theme: any = useTheme()
  const { render, sections } = usePageSections('orders')
  const [businessOrderIds, setBusinessOrderIds] = useState([])
  // Null until each section's list has loaded: the empty state waits for all of them.
  const [ordersLength, setOrdersLength] = useState<OrdersLength>({
    activeOrdersLength: null,
    previousOrdersLength: null,
    preordersLength: null
  });
  const [selectedOption, setSelectedOption] = useState(!hideOrders ? 'orders' : 'business')

  const emptyState = ordersEmptyState(ordersLength, sections.filter((section) => section.visible).map((section) => section.key))

  const hideProductsTab = !themeVisible(theme, 'orders.products_tab')
  const hideBusinessTab = !themeVisible(theme, 'orders.business_tab')

  const isGiftCardDisabled = configs?.platform_store_giftcard_enabled?.value === '0' || configs?.platform_store_giftcard_enabled?.value === false

  const tabs = [
    { tab: 'orders', type: 'orders', text: t('ORDERS', 'Orders'), enabled: true },
    { tab: 'business', type: 'business', text: t('BUSINESS', 'Business'), enabled: !hideBusinessTab },
    { tab: 'products', type: 'products', text: t('PRODUCTS', 'Products'), enabled: !hideProductsTab },
    { tab: 'giftCards', type: 'giftCards', text: t('GIFT_CARD', 'Gift card'), enabled: !isGiftCardDisabled && themeVisible(theme, 'orders.gift_cards_tab') }
  ]

  const ordersOption = (option: Record<string, boolean>) => (
    <OrdersOption
      {...props}
      {...option}
      ordersLength={ordersLength}
      setOrdersLength={setOrdersLength}
      setRefreshOrders={setRefreshOrders}
      refreshOrders={refreshOrders}
    />
  )

  const renderTabs = () => (
    <TabsWrapper>
      <Tabs
        group='orders_page'
        slot='tabs'
        defaultTab={selectedOption}
        defaultTabs={tabs}
        handleChangeTab={setSelectedOption}
      />
    </TabsWrapper>
  )

  return (
    <Container>
      {render({
        tabs: renderTabs
      })}
      {selectedOption === 'orders' && render({
        upcoming_orders: () => ordersOption({ preOrders: true }),
        active_orders: () => ordersOption({ activeOrders: true }),
        past_orders: () => ordersOption({})
      })}
      {selectedOption === 'orders' && !!emptyState && (
        <EmptyWrapper>
          {emptyState === 'error' ? (
            <NotFoundSource
              iconName='alert-circle-outline'
              content={t('ERROR_LOADING_ORDERS', 'We couldn\'t load your orders')}
              btnTitle={t('RETRY', 'Retry')}
              onClickButton={() => setRefreshOrders?.(true)}
            />
          ) : (
            <NotFoundSource
              iconName='receipt-outline'
              content={t('YOU_DONT_HAVE_ORDERS', 'You don\'t have any orders')}
            />
          )}
        </EmptyWrapper>
      )}
      {selectedOption === 'business' && (
        <OrdersOption
          {...props}
          isBusiness
          titleContent={t('PRE_ORDERED', 'Pre-ordered')}
          hideOrders
          horizontal
          activeOrders
          pastOrders
          preOrders
          businessesSearchList={businessesSearchList}
          businessOrderIds={businessOrderIds}
          setBusinessOrderIds={setBusinessOrderIds}
          ordersLength={ordersLength}
          setOrdersLength={setOrdersLength}
        />
      )}
      {selectedOption === 'products' && (
        <OrdersOption
          {...props}
          isProducts
          titleContent={t('PRE_ORDERED', 'Pre-ordered')}
          hideOrders
          horizontal
          activeOrders
          pastOrders
          preOrders
          businessesSearchList={businessesSearchList}
          businessOrderIds={businessOrderIds}
          setBusinessOrderIds={setBusinessOrderIds}
          ordersLength={ordersLength}
          setOrdersLength={setOrdersLength}
        />
      )}

      {selectedOption === 'giftCards' && (
        <GiftCardOrdersList
          onNavigationRedirect={props?.onNavigationRedirect}
          refreshOrders={refreshOrders}
          setRefreshOrders={setRefreshOrders}
        />
      )}
    </Container>
  )
}
