import React, { memo, useCallback, useMemo, useRef, useState } from 'react'
import { FlatList, Platform, RefreshControl, View } from 'react-native'
import { useTheme } from 'styled-components/native'

import { FlatListBusinessListHeader } from './FlatListBusinessListHeader'
import { FlatListBusinessListFooter } from './FlatListBusinessListFooter'

import { useOrderState } from '@components';
import { BusinessController, PageBanner } from '@ui';
import { themeGutter, themePart } from '@/theme/helpers'
import { usePageSections } from '@/theme/sections'

/**
 * One business of the list, re-rendered only when its business (the list updates them
 * immutably), the order type, the listing without an address (no distance) or the favorites
 * change: a page of results, a refresh or an order update no longer renders every mounted card again.
 */
const BusinessCell = memo(({ business, itemStyle, orderType, hideDistance, navigation, favoriteIds, setFavoriteIds, onBusinessClick, onUpdateBusinessList }: any) => (
  <View style={itemStyle}>
    <BusinessController
      business={business}
      isBusinessOpen={business.open}
      handleCustomClick={onBusinessClick}
      orderType={orderType}
      navigation={navigation}
      businessHeader={business?.header}
      businessFeatured={business?.featured}
      businessLogo={business?.logo}
      businessReviews={business?.reviews}
      businessDeliveryPrice={business?.delivery_price}
      businessDeliveryTime={business?.delivery_time}
      businessPickupTime={business?.pickup_time}
      businessDistance={business?.distance}
      hideDistance={hideDistance}
      handleUpdateBusinessList={onUpdateBusinessList}
      favoriteIds={favoriteIds}
      setFavoriteIds={setFavoriteIds}
    />
  </View>
))

const NO_BUSINESSES: any[] = []
const INLINE_BANNER = { id: 'inline-banner', inlineBanner: true }

export const FlatListBusinessListing = (props: any) => {
  const {
    handleScroll,
    businessesList,
    handleBusinessClick,
    navigation,
    handleUpdateBusinessList,
    favoriteIds,
    setFavoriteIds,
    handleOnRefresh,
    isUnaddressedListing,
    businessTypeScreen
  } = props

  const orderState = useOrderState()
  const [refreshing] = useState(false);
  const theme: any = useTheme()
  const itemStyle = useMemo(() => ({ paddingHorizontal: themeGutter(theme) }), [theme])
  const orderType = orderState?.options?.type
  const { isVisible } = usePageSections('business_listing')
  const listHidden = !businessTypeScreen && themePart(theme, 'business_types', 'base.on_select') === 'page' && !isVisible('all_businesses')

  // The parent's handlers change identity on every render: the cells call the latest ones.
  const latest = useRef({ handleBusinessClick, handleUpdateBusinessList })
  latest.current = { handleBusinessClick, handleUpdateBusinessList }
  const onBusinessClick = useCallback((...args: any[]) => latest.current.handleBusinessClick?.(...args), [])
  const onUpdateBusinessList = useCallback((...args: any[]) => latest.current.handleUpdateBusinessList?.(...args), [])

  const bannerAfter = themePart(theme, 'banner', 'base.listing_after')
  const data = useMemo(() => {
    if (listHidden) return NO_BUSINESSES
    const businesses = businessesList.businesses ?? NO_BUSINESSES
    if (!bannerAfter || businesses.length < bannerAfter) return businesses
    return [...businesses.slice(0, bannerAfter), INLINE_BANNER, ...businesses.slice(bannerAfter)]
  }, [listHidden, bannerAfter, businessesList.businesses])

  const renderItem = useCallback(({ item }: any) => item?.inlineBanner ? (
    <PageBanner position='app_home_page' navigation={navigation} />
  ) : (
    <BusinessCell
      business={item}
      itemStyle={itemStyle}
      orderType={orderType}
      hideDistance={!!isUnaddressedListing}
      navigation={navigation}
      favoriteIds={favoriteIds}
      setFavoriteIds={setFavoriteIds}
      onBusinessClick={onBusinessClick}
      onUpdateBusinessList={onUpdateBusinessList}
    />
  ), [itemStyle, orderType, isUnaddressedListing, navigation, favoriteIds, setFavoriteIds, onBusinessClick, onUpdateBusinessList])

  return (
    <FlatList
      ListHeaderComponent={<FlatListBusinessListHeader {...props} listHidden={listHidden} />}
      ListFooterComponent={listHidden ? undefined : <FlatListBusinessListFooter {...props} />}
      renderItem={renderItem}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      data={data}
      keyExtractor={(item: any, i: number) => `${item?.id ?? i}`}
      removeClippedSubviews={Platform.OS === 'android'}
      initialNumToRender={8}
      maxToRenderPerBatch={10}
      windowSize={5}
      updateCellsBatchingPeriod={50}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => handleOnRefresh()}
        />
      }
    />
  )
}
