import React, { useRef } from 'react'
import { useTheme } from 'styled-components/native'
import { SectionTitle } from '../../../shared/SectionTitle'
import { useIsFocused } from '@react-navigation/native';

import { ListWrapper } from './styles';
import { HeaderContent } from './HeaderContent';
import { CityFilter } from './CityFilter';

import { useLanguage, useOrderState, useOrderActions } from '@components';
import { usePageSections } from '@/theme/sections'
import { themePart, themeVisible } from '@/theme/helpers'
import { PICKUP_ORDER_TYPE } from '@/utils/unaddressedOrderTypes'


import {
  HighestRatedBusinesses,
  PageBanner,
  NotFoundSource,
  BusinessTypeFilter,
  OrderProgress
} from '@ui'
import { openScreen } from '@/navigators/appNavigation'
import { businessTypeLabel } from '../../../BusinessTypeFilter/typeLabel'

/**
 * The head of the listing (`pages.business_listing`): the order in progress,
 * the banner, the top businesses and the categories in the theme's order and
 * visibility; "All business" stays last, above the cards.
 */
export const FlatListBusinessListHeader = (props: any) => {
  const {
    navigation,
    businessesList,
    businessTypeSelected,
    handleChangeBusinessType,
    handleBusinessClick,
    businessId,
    isGuestUser,
    orderTypeValue,
    favoriteIds,
    setFavoriteIds,
    citiesState,
    allCitiesDisabled,
    isUnaddressedListing,
    businessTypeScreen,
    listHidden
  } = props

  const theme: any = useTheme()
  const [, t] = useLanguage()
  const { options, loading: orderLoading } = useOrderState()
  const { changeCityFilter } = useOrderActions()
  const isFocused = useIsFocused()
  const { render, isVisible } = usePageSections('business_listing')
  const opensTypePage = themePart(theme, 'business_types', 'base.on_select') === 'page'

  const businessTypes = useRef<any[]>([])

  const handleSelectBusinessType = (typeId: any) => {
    if (!opensTypePage || typeId == null) {
      handleChangeBusinessType(typeId)
      return
    }
    const type = businessTypes.current.find((item: any) => item?.id === typeId)
    navigation.navigate('BusinessTypeListing', {
      businessTypeId: typeId,
      businessTypeName: type ? businessTypeLabel(type, t) : undefined
    })
  }

  // The city filter: pickup without an address, with a city to choose and the theme not hiding it.
  const showCityFilter = isUnaddressedListing && options?.type === PICKUP_ORDER_TYPE &&
    !allCitiesDisabled && !!citiesState?.cities?.length && themeVisible(theme, 'order_context.city')

  const renderOrderProgress = () => <OrderProgress {...props} isFocused={isFocused} />

  const renderCustomOrderBanner = () => (
    <PageBanner position='app_business_listing' navigation={navigation} flush />
  )

  const renderHighestRated = () => !businessId && !props.franchiseId && (
    <HighestRatedBusinesses
      propsToFetch={props.propsToFetch}
      onBusinessClick={handleBusinessClick}
      navigation={navigation}
      favoriteIds={favoriteIds}
      setFavoriteIds={setFavoriteIds}
      isOrderStateReady={props.isOrderStateReady}
    />
  )

  const renderCategories = () => !businessId && (
    <BusinessTypeFilter
      images={props.images}
      businessTypes={props.businessTypes}
      defaultBusinessType={props.defaultBusinessType}
      handleChangeBusinessType={handleSelectBusinessType}
      setBusinessTypes={(types: any[]) => { businessTypes.current = types ?? [] }}
      grid
    />
  )

  const renderAllBusinesses = () => (
    <>
      {!businessTypeSelected && !businessTypeScreen && (
        <SectionTitle>{t('ALL_BUSINESS', 'All business')}</SectionTitle>
      )}
      {!businessesList.loading && businessesList.businesses.length === 0 && businessesList?.fetched && (
        <NotFoundSource
          content={isUnaddressedListing
            ? t('NO_BUSINESSES_AVAILABLE_WITHOUT_ADDRESS_DESC', 'Try another city or add your address to see businesses near you.')
            : t(
              'NOT_FOUND_BUSINESSES',
              'No businesses to delivery / pick up at this address, please change filters or change address.',
            )}
        />
      )}
    </>
  )

  if (businessTypeScreen) {
    return (
      <>
        <HeaderContent
          navigation={navigation}
          title={businessTypeScreen.name}
          onGoBack={() => navigation.goBack()}
          onHandleCart={() => openScreen(navigation, 'Cart')}
          hideAddress
          hideOrderControl
          fillable
        />
        <ListWrapper>{renderAllBusinesses()}</ListWrapper>
      </>
    )
  }

  return (
    <>

      <HeaderContent
        navigation={navigation}
        showAwayAddressPopover={props.showAwayAddressPopover}
        showBusinessSearchMap
        isGuestUser={isGuestUser}
        orderTypeValue={orderTypeValue}
        onHandleCart={themeVisible(theme, 'business_listing.cart') ? () => openScreen(navigation, 'Cart') : undefined}
        hideAddress={!themeVisible(theme, 'business_listing.address')}
        hideOrderControl={!themeVisible(theme, 'business_listing.order_options')}
        fillable
        showLogo={themeVisible(theme, 'business_listing.logo')}
        showSearch={themeVisible(theme, 'business_listing.search')}
      />

      {showCityFilter && (
        <CityFilter
          cities={citiesState.cities}
          cityId={options?.city_id}
          disabled={orderLoading}
          onChange={changeCityFilter}
        />
      )}

      <ListWrapper>
        {render({
          order_progress: renderOrderProgress,
          custom_order_banner: renderCustomOrderBanner,
          highest_rated: renderHighestRated,
          categories: renderCategories,
          all_businesses: renderAllBusinesses
        })}
        {!listHidden && !isVisible('all_businesses') && renderAllBusinesses()}
      </ListWrapper>
    </>
  )
}
