import React, { useState } from 'react'
import { useTheme } from 'styled-components/native'

import { Container } from './styles'
import { Tabs } from '../../Forms/Tabs'

import { useLanguage, useOrder } from '@components'
import { FavoriteList } from '@ui'
import { usePageSections } from '@/theme/sections'
import { themeVisible } from '@/theme/helpers'

export const Favorite = (props: any) => {
  const {
    navigation,
    franchiseId,
    onRedirect
  } = props
  const [, t] = useLanguage()
  const theme: any = useTheme()
  const [orderState] = useOrder()
  const [tabSelected, setTabSelected] = useState('businesses')
  const { isVisible } = usePageSections('favorites')

  const tabList = [
    { tab: 'businesses', type: 'businesses', text: t('BUSINESSES', 'Businesses'), enabled: true },
    { tab: 'products', type: 'products', text: t('PRODUCTS', 'Products'), enabled: themeVisible(theme, 'favorites.products_tab') },
    { tab: 'orders', type: 'orders', text: t('ORDERS', 'Orders'), enabled: themeVisible(theme, 'favorites.orders_tab') }
  ]
  // Without the tabs (or with one left) only the businesses show.
  const showTabs = isVisible('tabs') && tabList.filter(tab => tab.enabled).length > 1

  return (
    <Container>
      {showTabs && (
        <Tabs
          defaultTab={tabSelected}
          defaultTabs={tabList}
          handleChangeTab={setTabSelected}
        />
      )}
      {tabSelected === 'businesses' && (
        <FavoriteList
          navigation={navigation}
          onNavigationRedirect={onRedirect}
          isBusiness
          favoriteURL='favorite_businesses'
          originalURL='business'
          location={`${orderState.options?.address?.location?.lat},${orderState.options?.address?.location?.lng}`}
          propsToFetch={['id', 'name', 'header', 'logo', 'location', 'address', 'ribbon', 'timezone', 'schedule', 'open', 'delivery_price', 'distance', 'delivery_time', 'pickup_time', 'reviews', 'featured', 'offers', 'food', 'laundry', 'alcohol', 'groceries', 'slug', 'today', 'enabled', 'disabled_reason', 'available_drivers_count', 'activated_orders']}
          franchiseId={franchiseId}
        />
      )}
      {tabSelected === 'products' && (
        <FavoriteList
          favoriteURL='favorite_products'
          originalURL='products'
          onNavigationRedirect={onRedirect}
          isProduct
          franchiseId={franchiseId}
        />
      )}
      {tabSelected === 'orders' && (
        <FavoriteList
          onNavigationRedirect={onRedirect}
          favoriteURL='favorite_orders'
          originalURL='orders'
          isOrder
          franchiseId={franchiseId}
        />
      )}
    </Container>
  )
}
