import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Keyboard, ScrollView, View } from 'react-native'
import { useTheme } from 'styled-components/native'
import { Placeholder, PlaceholderLine } from '@/ui/src/components/shared/Skeleton'

import {
  BrandList,
  FilterContainer,
  FilterRow,
  GoogleMapContainer,
  HeaderContainer,
  HeaderRow,
  NoResult,
  PriceListContainer,
  SearchAreaWrapper,
  SheetFooter,
  WrapperNotFound
} from './styles'
import { BrandItem } from '../BusinessListingSearch/styles'
import { FilterChip } from '../BusinessListingSearch/FilterChip'

import { useLanguage, BusinessSearchList, useConfig, useOrder } from '@components'
import { OBottomPopup, OButton, OText, GoogleMap, BusinessTypeFilter, NotFoundSource, SearchBar } from '@ui'
import Icon from '../shared/Icon'
import ChoiceMark from '../shared/ChoiceMark'
import { GoogleMapHandle } from '../../types'
import { MapBottomSheet, MapBottomSheetHandle } from './MapBottomSheet'
import { MaxSectionItem } from '../BusinessListingSearch/MaxSectionItem'
import { themeImage, themeVisible } from '@/theme/helpers'

// Neighborhood-level zoom (~9km N-S) so the user sees the stores around their
// address, not a street/building-level view nor a continental fit.
const MAP_NEIGHBORHOOD_DELTA = 0.08

const BusinessSearchMapUI = (props: any) => {
  const {
    businessesSearchList,
    onBusinessClick,
    handleChangeFilters,
    filters,
    handleChangeTermValue,
    termValue,
    paginationProps,
    handleSearchbusinessAndProducts,
    brandList,
    handleUpdateBusinessList,
    navigation
  } = props

  const theme: any = useTheme()
  const [, t] = useLanguage()
  const [{ configs }] = useConfig()
  const [orderState] = useOrder()
  const googleMapRef = useRef<GoogleMapHandle>(null)
  const sheetRef = useRef<MapBottomSheetHandle>(null)

  const [openFilter, setOpenFilter] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [isKeyboardShow, setIsKeyboardShow] = useState(false)
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | string | null>(null)

  const defaultLocation = {
    lat: configs?.location_default_latitude?.value ? Number(configs?.location_default_latitude?.value) : 40.7744146,
    lng: configs?.location_default_longitude?.value ? Number(configs?.location_default_longitude?.value) : -73.9678064
  }
  const addressLocation = orderState?.options?.address?.location
  const mapCenter = (addressLocation?.lat != null && addressLocation?.lng != null)
    ? { lat: addressLocation.lat, lng: addressLocation.lng }
    : defaultLocation

  // "Search this area": surface the panned map center and re-query when it moves
  // far enough from the location the current results were fetched for.
  const [showSearchArea, setShowSearchArea] = useState(false)
  const pannedCenterRef = useRef<{ lat: number, lng: number } | null>(null)
  const searchedCenterRef = useRef(mapCenter)

  useEffect(() => {
    searchedCenterRef.current = mapCenter
    pannedCenterRef.current = null
    setShowSearchArea(false)
  }, [mapCenter.lat, mapCenter.lng])

  const handleMapRegionChange = useCallback((center: { latitude: number, longitude: number }) => {
    pannedCenterRef.current = { lat: center.latitude, lng: center.longitude }
    const searched = searchedCenterRef.current
    const moved = Math.abs(center.latitude - searched.lat) > 0.02 || Math.abs(center.longitude - searched.lng) > 0.02
    setShowSearchArea(moved)
  }, [])

  const handleSearchThisArea = () => {
    const center = pannedCenterRef.current
    if (!center) return
    searchedCenterRef.current = center
    setShowSearchArea(false)
    handleSearchbusinessAndProducts(true, { location: center })
  }

  const filterOptionsEnabled = configs?.filter_search_options?.value?.split('|') || []
  const currency = configs.format_number_currency?.value
  const orderType = orderState?.options?.type
  const maxDeliveryFeeOptions = [1, 2, 5, 'default']
  const maxDistanceOptions = configs?.distance_unit?.value === 'km' ? [1000, 2000, 5000, 'default'] : [1609, 3218, 8046, 'default']
  const maxTimeOptions = [5, 15, 30, 'default']

  const businesses = useMemo(() => businessesSearchList?.businesses ?? [], [businessesSearchList?.businesses])
  const isEmptyResult = businesses.length === 0 && !businessesSearchList.loading

  const locations = useMemo(() => businesses.map((business: any) => ({
    ...business,
    lat: business?.location?.lat,
    lng: business?.location?.lng,
    icon: business?.logo ?? themeImage(theme, 'map.store')
  })), [businesses])

  const priceList = [
    { level: '1', content: `${currency}` },
    { level: '2', content: `${Array(2).fill(currency).join('')}` },
    { level: '3', content: `${Array(3).fill(currency).join('')}` },
    { level: '4', content: `${Array(4).fill(currency).join('')}` },
    { level: '5', content: `${Array(5).fill(currency).join('')}` }
  ]

  const handleChangeBrandFilter = (brandId: any) => {
    let franchiseIds = [...filters?.franchise_ids]
    if (filters?.franchise_ids?.includes(brandId)) franchiseIds = filters?.franchise_ids?.filter((item: any) => item !== brandId)
    else franchiseIds.push(brandId)
    handleChangeFilters && handleChangeFilters('franchise_ids', franchiseIds)
  }

  const filterResetActions = {
    sort: () => handleChangeFilters('orderBy', null),
    price_range: () => handleChangeFilters('price_level', null),
    brands: () => handleChangeFilters('franchise_ids', []),
    max_delivery_fee: () => handleChangeFilters('max_delivery_price', null),
    max_delivery_time: () => handleChangeFilters('max_eta', null),
    max_distance: () => handleChangeFilters('max_distance', null),
    business_types: () => handleChangeFilters('business_types', [])
  }

  const handleCloseFilter = () => {
    setActiveFilter(null)
    setOpenFilter(null)
  }

  const handleResetActiveFilter = () => {
    filterResetActions[activeFilter as keyof typeof filterResetActions]?.()
    handleCloseFilter()
  }

  const handleOpenFilter = (filterType: string) => {
    setActiveFilter(filterType)
    const filter = filterType === 'max_delivery_time'
      ? orderType === 1
        ? 'max_delivery_time'
        : 'max_pickup_time'
      : filterType
    setOpenFilter(filter)
  }

  const handleChangePriceRange = (value: any) => {
    if (value === filters?.price_level) handleChangeFilters('price_level', null)
    else handleChangeFilters('price_level', value)
  }

  const handleEndReached = useCallback(() => {
    const hasMore = paginationProps?.totalPages !== paginationProps?.currentPage
    if (hasMore && !businessesSearchList.loading && businesses.length > 0) {
      handleSearchbusinessAndProducts()
    }
  }, [paginationProps?.totalPages, paginationProps?.currentPage, businessesSearchList.loading, businesses.length])

  const handleMarkerSelect = useCallback((business: any) => {
    setSelectedBusinessId(business?.id)
    sheetRef.current?.expand()
    const index = businesses.findIndex((item: any) => item.id === business?.id)
    if (index >= 0) sheetRef.current?.scrollToBusiness(index)
  }, [businesses])

  const handleCardPress = useCallback((business: any) => {
    setSelectedBusinessId(business?.id)
    const lat = business?.location?.lat
    const lng = business?.location?.lng
    if (lat != null && lng != null) googleMapRef.current?.focusOnCoordinate(lat, lng)
  }, [])

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardShow(true))
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardShow(false))
    return () => {
      keyboardDidShowListener.remove()
      keyboardDidHideListener.remove()
    }
  }, [])

  // A map control: the theme's neutral icon button.
  const mapControl = (icon: string, onPress: () => void, label: string) => (
    <OButton
      iconOnly
      color='neutral'
      icon={<Icon name={icon} />}
      onClick={onPress}
      accessibilityLabel={label}
    />
  )

  const filterChips = [
    { key: 'price_range', enabled: filterOptionsEnabled.includes('price_range'), active: !!filters?.price_level, icon: 'pricetag-outline', text: t('PRICE', 'Price') },
    { key: 'brands', enabled: filterOptionsEnabled.includes('brands'), active: filters?.franchise_ids?.length > 0, text: t('BRANDS', 'Brands') },
    { key: 'max_delivery_fee', enabled: orderType === 1 && filterOptionsEnabled.includes('max_delivery_fee'), active: !!filters?.max_delivery_price, text: t('DELIVERY_FEE', 'Delivery fee') },
    { key: 'max_delivery_time', enabled: [1, 2].includes(orderType) && filterOptionsEnabled.includes('max_delivery_time'), active: !!filters?.max_eta, text: orderType === 1 ? t('MAX_DELIVERY_TIME', 'Max delivery time') : t('MAX_PICKUP_TIME', 'Max pickup time') },
    { key: 'max_distance', enabled: filterOptionsEnabled.includes('max_distance'), active: !!filters?.max_distance, text: t('MAX_DISTANCE', 'Max distance') },
    { key: 'business_types', enabled: filterOptionsEnabled.includes('business_categories'), active: filters?.business_types?.length > 0, text: t('CATEGORIES', 'Categories') }
  ].filter(chip => chip.enabled)

  return (
    <View style={{ flex: 1 }}>
      <HeaderContainer>
        <HeaderRow>
          {mapControl('arrow-back', () => props.navigation.goBack(), t('GO_BACK', 'Go back'))}
          <SearchBar
            lazyLoad
            placeholder={t('SEARCH', 'Search')}
            onSearch={(text: string) => handleChangeTermValue(text)}
            searchValue={termValue}
            isCancelXButtonShow={termValue.length > 0}
          />
          {themeVisible(theme, 'business_map.recenter') && mapControl('locate', () => googleMapRef.current?.recenterToUserLocation(), t('RECENTER', 'Recenter'))}
        </HeaderRow>
        <FilterRow>
          {filterChips.map(chip => (
            <FilterChip
              key={chip.key}
              icon={chip.icon}
              text={chip.text}
              selected={chip.active}
              onPress={() => handleOpenFilter(chip.key)}
            />
          ))}
        </FilterRow>
        {showSearchArea && themeVisible(theme, 'business_map.search_area') && (
          <SearchAreaWrapper>
            <OButton
              size='sm'
              icon={<Icon name='refresh' size='sm' color='on_primary' />}
              text={t('SEARCH_THIS_AREA', 'Search this area')}
              onClick={handleSearchThisArea}
            />
          </SearchAreaWrapper>
        )}
      </HeaderContainer>

      <GoogleMapContainer>
        <GoogleMap
          ref={googleMapRef}
          location={mapCenter}
          delta={MAP_NEIGHBORHOOD_DELTA}
          locations={locations}
          manualZoom
          animateToRegion={false}
          useAllMapHeight
          zoomCustom
          showsUserLocation
          selectedBusinessId={selectedBusinessId}
          onMarkerSelect={handleMarkerSelect}
          onRegionChange={handleMapRegionChange}
          handleBusinessClick={(business: any) => onBusinessClick(business)}
        />
      </GoogleMapContainer>

      {isEmptyResult && (
        <WrapperNotFound pointerEvents='box-none'>
          <NotFoundSource
            simple
            content={t('NOT_FOUND_BUSINESSES_MAP', 'No businesses to delivery / pick up at this moment, please change filters or change address.')}
          />
        </WrapperNotFound>
      )}

      {!isEmptyResult && !isKeyboardShow && (
        <MapBottomSheet
          ref={sheetRef}
          businesses={businesses}
          loading={businessesSearchList.loading}
          title={`${businesses.length} ${t('STORES_NEARBY', 'stores nearby')}`}
          selectedBusinessId={selectedBusinessId}
          orderType={orderType}
          navigation={navigation}
          onCardPress={handleCardPress}
          onBusinessClick={onBusinessClick}
          handleUpdateBusinessList={handleUpdateBusinessList}
          onEndReached={handleEndReached}
        />
      )}

      <OBottomPopup
        open={Boolean(activeFilter)}
        presentationStyle='overFullScreen'
        title={activeFilter ? t(activeFilter.toUpperCase(), activeFilter.replace(/_/g, ' ')) : ''}
        closeIcon
        transparent={activeFilter !== 'business_types'}
        onClose={() => handleCloseFilter()}
      >
        {activeFilter === 'price_range' && (
          <FilterContainer>
            <PriceListContainer>
              {priceList.map((price, i) => (
                <FilterChip
                  key={i}
                  size='md'
                  text={price.content}
                  selected={filters?.price_level === price?.level}
                  onPress={() => handleChangePriceRange(price?.level)}
                />
              ))}
            </PriceListContainer>
          </FilterContainer>
        )}
        {activeFilter === 'brands' && (
          <FilterContainer>
            {brandList.loading && (
              <Placeholder>
                <>
                  {[...Array(5).keys()].map(index => (
                    <BrandItem key={index}>
                      <PlaceholderLine width={60} color={theme.native.components.skeleton.base.color} />
                    </BrandItem>
                  ))}
                </>
              </Placeholder>
            )}
            {!brandList.loading && (
              <View>
                <BrandList>
                  {brandList.brands.map((brand: any) => (
                    <BrandItem
                      key={brand.id}
                      onPress={() => handleChangeBrandFilter(brand?.id)}
                      active={filters?.franchise_ids?.includes(brand?.id)}
                    >
                      <OText style={{ flex: 1 }} color={filters?.franchise_ids?.includes(brand?.id) ? 'primary_text' : 'text'}>{brand.name}</OText>
                      {filters?.franchise_ids?.includes(brand?.id) && (
                        <ChoiceMark kind='check' checked />
                      )}
                    </BrandItem>
                  ))}
                </BrandList>
                {!brandList?.loading && ((brandList?.brands?.filter((brand: any) => brand?.enabled))?.length === 0) && (
                  <NoResult>
                    <OText>{t('NO_RESULTS_FOUND', 'Sorry, no results found')}</OText>
                  </NoResult>
                )}
              </View>
            )}
          </FilterContainer>
        )}
        {activeFilter === 'max_delivery_fee' && (
          <FilterContainer>
            <MaxSectionItem filters={filters} options={maxDeliveryFeeOptions} filter='max_delivery_price' handleChangeFilters={handleChangeFilters} />
          </FilterContainer>
        )}
        {activeFilter === 'max_delivery_time' && (
          <FilterContainer>
            <MaxSectionItem filters={filters} options={maxTimeOptions} filter='max_eta' handleChangeFilters={handleChangeFilters} />
          </FilterContainer>
        )}
        {activeFilter === 'max_distance' && (
          <FilterContainer>
            <MaxSectionItem filters={filters} options={maxDistanceOptions} filter='max_distance' handleChangeFilters={handleChangeFilters} />
          </FilterContainer>
        )}
        {activeFilter === 'business_types' && (
          <ScrollView style={{ maxHeight: '70%' }}>
            <FilterContainer>
              <BusinessTypeFilter isSearchMode filters={filters} handleChangeFilters={handleChangeFilters} />
            </FilterContainer>
          </ScrollView>
        )}
        {Boolean(activeFilter) && (
          <SheetFooter>
            <OButton onClick={handleCloseFilter} text={t('VIEW_RESULTS', 'View results')} />
            <OButton onClick={handleResetActiveFilter} text={t('RESET', 'Reset')} appearance='ghost' color='neutral' />
          </SheetFooter>
        )}
      </OBottomPopup>
    </View>
  )
}

export const BusinessSearchMap = (props: any) => {
  const BusinessListSearch = {
    ...props,
    UIComponent: BusinessSearchMapUI
  }
  return <BusinessSearchList {...BusinessListSearch} />
}
