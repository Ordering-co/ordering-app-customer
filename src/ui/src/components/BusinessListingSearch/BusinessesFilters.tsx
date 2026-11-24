import React, { useEffect, useRef, useState } from 'react'
import { View } from 'react-native'

import { MaxSectionItem } from './MaxSectionItem'
import { FilterChip } from './FilterChip'
import { BusinessCardSkeleton } from '../BusinessController/BusinessCardSkeleton'

import {
  BrandContainer,
  BrandItem,
  BrandList,
  PriceFilterWrapper,
  WrapperButtons,
  FiltersActionBar,
  PriceContainer,
  WrapperResults,
  SheetContent
} from './styles'

import { useLanguage, useOrder, useConfig } from '@components'
import OButton from '../shared/OButton'
import OText from '../shared/OText'
import ChoiceMark from '../shared/ChoiceMark'
import OBottomPopup from '../shared/OBottomPopup'
import Icon from '../shared/Icon'
import OSelect from '../shared/OSelect'
import { usePageSections } from '@/theme/sections'
import { themeVisible } from '@/theme/helpers'
import { useTheme } from 'styled-components/native'

export const BusinessesFilters = (props: any) => {
  const {
    businessesSearchList,
    handleChangeFilters,
    brandList,
    filters,
    handleChangeBrandFilter,
    handleChangePriceRange,
    handleApplyFilters,
    clearFilters,
    termValue,
    paginationProps,
  } = props

  const theme: any = useTheme()
  // The filter bar's chips: `filters.slots.chip` (size).
  const filterChipSize = theme.native.components.filters.slots.chip.size
  const [orderState] = useOrder()
  const [, t] = useLanguage()
  const [{ configs }] = useConfig()

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const defaultFilters = {
    orderBy: 'distance',
    franchise_ids: [],
    price_level: null,
    business_types: [],
    max_delivery_price: null,
    max_eta: null,
    max_distance: null
  };

  const isFilterActive = (filterName: string) => {
    switch (filterName) {
      case 'sort':
        return filters.orderBy !== defaultFilters.orderBy;
      case 'brands':
        return filters.franchise_ids && filters.franchise_ids.length > 0;
      case 'price_range':
        return filters.price_level !== defaultFilters.price_level;
      case 'max_delivery_fee':
        return !!filters.max_delivery_price && filters.max_delivery_price !== 'default';
      case 'max_delivery_time':
        return !!filters.max_eta && filters.max_eta !== 'default';
      case 'max_distance':
        return !!filters.max_distance && filters.max_distance !== 'default';
      case 'business_categories':
        return filters.business_types && filters.business_types.length > 0;
      default:
        return false;
    }
  };

  const maxDeliveryFeeOptions = [15, 25, 35, 'default']
  const maxDistanceOptions = [1000, 2000, 5000, 'default']
  const maxTimeOptions = [5, 15, 30, 'default']
  const sortItems = [
    { text: t('PICKED_FOR_YOU', 'Picked for you (default)'), value: 'distance' },
    { text: t('DELIVERY_TIME', 'Delivery time'), value: 'delivery_time' },
    { text: t('PICKUP_TIME', 'Pickup time'), value: 'pickup_time' }
  ]
  const priceList = [
    { level: '1', content: '$' },
    { level: '2', content: '$$' },
    { level: '3', content: '$$$' },
    { level: '4', content: '$$$$' },
    { level: '5', content: '$$$$$' }
  ]
  // A sort chosen in the select searches again once the filters hold it.
  const sortChosen = useRef(false)
  useEffect(() => {
    if (!sortChosen.current) return
    sortChosen.current = false
    handleApplyFilters()
  }, [filters?.orderBy])

  const sortOptions = sortItems
    .filter(item => !(orderState?.options?.type === 1 && item?.value === 'pickup_time') && !(orderState?.options?.type === 2 && item?.value === 'delivery_time'))
    .map(item => ({ value: item.value, label: item.text }))
  const filterOptionsEnabled = configs?.filter_search_options?.value?.split('|') || []

  const openFilter = (filterName: string) => {
    setActiveFilter(filterName);
    setIsModalVisible(true);
  };

  const onApply = () => {
    handleApplyFilters();
    setIsModalVisible(false);
    setActiveFilter(null);
  }

  const onClear = () => {
    clearFilters();
    setIsModalVisible(false);
    setActiveFilter(null);
  }

  const getModalTitle = () => {
    switch (activeFilter) {
      case 'sort': return t('SORT', 'Sort');
      case 'brands': return t('BRANDS', 'Brands');
      case 'price_range': return t('PRICE', 'Price');
      case 'max_delivery_fee': return t('MAX_DELIVERY_FEE', 'Max delivery fee');
      case 'max_delivery_time': return orderState?.options?.type === 1 ? t('DELIVERY_TIME', 'Delivery time') : t('PICKUP_TIME', 'Pickup time');
      case 'max_distance': return t('MAX_DISTANCE', 'Max distance');
      default: return t('FILTERS', 'Filters');
    }
  }

  const filterButtons = [
    { name: 'sort', icon: 'funnel-outline', text: t('SORT', 'Sort'), enabled: filterOptionsEnabled.includes('sort') },
    { name: 'brands', icon: 'storefront-outline', text: t('BRANDS', 'Brands'), enabled: filterOptionsEnabled.includes('brands') },
    { name: 'price_range', icon: 'cash-outline', text: t('PRICE', 'Price'), enabled: filterOptionsEnabled.includes('price_range') },
    { name: 'max_delivery_fee', icon: 'truck-delivery-outline', iconSet: 'mci' as const, text: t('DELIVERY_FEE', 'Delivery Fee'), enabled: orderState?.options?.type === 1 && filterOptionsEnabled.includes('max_delivery_fee') },
    { name: 'max_delivery_time', icon: 'time-outline', text: orderState?.options?.type === 1 ? t('DELIVERY_TIME', 'Delivery time') : t('PICKUP_TIME', 'Pickup time'), enabled: [1, 2].includes(orderState?.options?.type) && filterOptionsEnabled.includes('max_delivery_time') },
    { name: 'max_distance', icon: 'map-outline', text: t('DISTANCE', 'Distance'), enabled: filterOptionsEnabled.includes('max_distance') },
  ];

  const processedFilterButtons = filterButtons
    .filter(btn => btn.enabled)
    .map(btn => ({ ...btn, isActive: isFilterActive(btn.name) }))
    .sort((a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0));

  const anyFilterIsActive = processedFilterButtons.some(btn => btn.isActive);
  const hasSearchTerm = termValue?.length >= 3;
  const { isVisible } = usePageSections('business_search')
  const showResultsCount = (anyFilterIsActive || hasSearchTerm) && isVisible('results') && themeVisible(theme, 'business_search.results_count');

  return (
    <>
      {(!businessesSearchList?.loading || businessesSearchList?.businesses?.length > 0) && (
        <>
          {isVisible('filters') && (
            <FiltersActionBar>
              {anyFilterIsActive && (
                <OButton
                  text={t('CLEAR', 'Clear')}
                  appearance='ghost'
                  size='sm'
                  onClick={onClear}
                />
              )}
              {processedFilterButtons.map(btn => btn.name === 'sort' ? (
                // Sorting is a choice of one: the app's select, opened from its chip.
                <OSelect
                  key={btn.name}
                  title={t('SORT', 'Sort')}
                  options={sortOptions}
                  value={filters?.orderBy}
                  onSelect={(value: string) => { sortChosen.current = true; handleChangeFilters('orderBy', value) }}
                  renderTrigger={({ open }) => (
                    <FilterChip size={filterChipSize} icon={btn.icon} iconSet={btn.iconSet} text={btn.text} selected={btn.isActive} onPress={open} />
                  )}
                />
              ) : (
                <FilterChip
                  key={btn.name}
                  size={filterChipSize}
                  icon={btn.icon}
                  iconSet={btn.iconSet}
                  text={btn.text}
                  selected={btn.isActive}
                  onPress={() => openFilter(btn.name)}
                />
              ))}
            </FiltersActionBar>
          )}

          {showResultsCount && (
            <WrapperResults>
              <OText preset='h4'>
                {`${paginationProps?.totalItems ?? businessesSearchList?.businesses?.length} ${t('RESULTS', 'Results')}`}
              </OText>
            </WrapperResults>
          )}

          <OBottomPopup
            open={isModalVisible}
            transparent={true}
            onClose={() => setIsModalVisible(false)}
            title={getModalTitle()}
            closeIcon
            presentationStyle='overFullScreen'
          >
            <SheetContent>
              {activeFilter === 'brands' && (
                <BrandContainer>
                  {!brandList?.loading && !brandList?.error && brandList?.brands?.length > 0 && (
                    <BrandList>
                      {brandList?.brands.map((brand: any) => brand?.enabled && (
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
                  )}
                  {!brandList?.loading && ((brandList?.brands?.filter((brand: any) => brand?.enabled))?.length === 0) && (
                    <OText mBottom='lg'>{t('NO_RESULTS_FOUND', 'Sorry, no results found')}</OText>
                  )}
                </BrandContainer>
              )}

              {activeFilter === 'price_range' && (
                <PriceFilterWrapper>
                  <PriceContainer>
                    {priceList.map((price: any, i: number) => (
                      <FilterChip
                        key={i}
                        size='md'
                        text={price.content}
                        selected={filters?.price_level === price?.level}
                        onPress={() => handleChangePriceRange(price?.level)}
                      />
                    ))}
                  </PriceContainer>
                </PriceFilterWrapper>
              )}

              {activeFilter === 'max_delivery_fee' && (
                <MaxSectionItem
                  filters={filters}
                  options={maxDeliveryFeeOptions}
                  filter='max_delivery_price'
                  handleChangeFilters={handleChangeFilters}
                />
              )}

              {activeFilter === 'max_delivery_time' && (
                <MaxSectionItem
                  filters={filters}
                  options={maxTimeOptions}
                  filter='max_eta'
                  handleChangeFilters={handleChangeFilters}
                />
              )}

              {activeFilter === 'max_distance' && (
                <MaxSectionItem
                  filters={filters}
                  options={maxDistanceOptions}
                  filter='max_distance'
                  handleChangeFilters={handleChangeFilters}
                />
              )}
            </SheetContent>
            <WrapperButtons>
              <OButton
                text={t('VIEW_RESULTS', 'View results')}
                onClick={onApply}
              />
              <OButton
                text={t('RESET_FILTERS', 'Reset')}
                appearance='ghost'
                color='neutral'
                onClick={onClear}
              />
            </WrapperButtons>
          </OBottomPopup>
        </>
      )}

      {businessesSearchList?.loading && (
        <View>
          <BusinessCardSkeleton variant='compact' count={3} />
        </View>
      )}
    </>
  )
}
