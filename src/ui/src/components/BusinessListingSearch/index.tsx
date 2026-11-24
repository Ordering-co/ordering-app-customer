import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ScrollView, FlatList, StyleSheet, View, useWindowDimensions } from 'react-native'
import { useTheme } from 'styled-components/native'

import { convertHoursToMinutes } from '../../utils'
import { BusinessSearchParams } from '../../types'
import { BusinessSearchHeader } from './BusinessSearchHeader'
import { HeaderContent } from '../BusinessesListing/Layout/Original/HeaderContent';
import { BusinessCard } from '../BusinessController/BusinessCard'
import { BusinessCardSkeleton } from '../BusinessController/BusinessCardSkeleton'
import { usePageSections } from '@/theme/sections'
import { themeGutter, themeSpace } from '@/theme/helpers'

import { useLanguage, BusinessSearchList, useOrder, useUtils, useEvent, useToast, ToastType } from '@components'
import { SingleProductCard } from '@ui'
import { openScreen } from '@/navigators/appNavigation'

const deliveryTypes = [1, 7]

const businessHasProducts = (business: any) => business?.categories?.some((category: any) => category?.products?.length > 0)

/** The page sides and the space between rows and products of the results. */
const searchStyles = (theme: any) => StyleSheet.create({
  row: { paddingHorizontal: themeGutter(theme), paddingBottom: themeSpace(theme, 'lg') },
  products: { gap: themeSpace(theme, 'lg') }
})

const PaginationFooter = () => {
  const theme: any = useTheme()
  const styles = useMemo(() => searchStyles(theme), [theme])
  return (
    <View style={styles.row}>
      <BusinessCardSkeleton variant='compact' />
    </View>
  )
}

export const BusinessListingSearchUI = (props: BusinessSearchParams) => {
  const {
    navigation,
    businessesSearchList,
    onBusinessClick,
    handleChangeTermValue,
    termValue,
    handleSearchbusinessAndProducts,
    handleChangeFilters,
    filters,
    businessTypes,
    setFilters,
    brandList,
    paginationProps,
    handleUpdateProducts,
    shouldClearSearchTerm,
    setShouldClearSearchTerm
  } = props

  const theme: any = useTheme()
  const styles = useMemo(() => searchStyles(theme), [theme])
  // Two products per screen width in each row's carousel (layout).
  const productWidth = useWindowDimensions().width * 0.5
  const { isVisible } = usePageSections('business_search')
  const [orderState] = useOrder()
  const [events] = useEvent()
  const [, { showToast }] = useToast()
  const [, t] = useLanguage()
  const [{ parsePrice, parseDistance, parseNumber, optimizeImage }] = useUtils();

  const [openFilters, setOpenFilters] = useState(false)
  const isFetchingRef = useRef(false)
  const listRef = useRef<any>(null)
  const scrollOffsetRef = useRef(0)
  const contentSizeRef = useRef(0)
  const viewportHeightRef = useRef(0)
  const prevBusinessesCountRef = useRef(0)

  useEffect(() => {
    const count = businessesSearchList?.businesses?.length ?? 0
    const prev = prevBusinessesCountRef.current
    prevBusinessesCountRef.current = count
    if (count > prev && prev > 0) {
      const maxOffset = Math.max(0, contentSizeRef.current - viewportHeightRef.current)
      if (scrollOffsetRef.current > maxOffset) {
        listRef.current?.scrollToOffset?.({ offset: maxOffset, animated: false })
      }
    }
  }, [businessesSearchList?.businesses?.length])

  useEffect(() => {
    if (businessesSearchList.loading && (businessesSearchList?.businesses?.length ?? 0) === 0) {
      listRef.current?.scrollToOffset?.({ offset: 0, animated: false })
    }
  }, [businessesSearchList.loading, businessesSearchList?.businesses?.length])

  useEffect(() => {
    if (!businessesSearchList.loading) {
      isFetchingRef.current = false
    }
  }, [businessesSearchList.loading])

  const clearFilters = () => {
    setFilters({ business_types: [], orderBy: 'distance', franchise_ids: [], price_level: null })
  }

  const handleChangeActiveBusinessType = (type: any) => {
    if (type?.id === null) {
      handleChangeFilters('business_types', [])
      return
    }
    if (filters?.business_types?.includes(type?.id)) {
      const arrayAux = filters?.business_types
      const index = arrayAux?.indexOf(type?.id)
      arrayAux.splice(index, 1)
      handleChangeFilters('business_types', arrayAux)
    } else {
      handleChangeFilters('business_types', [...filters?.business_types, type?.id])
    }
  }

  const handleChangeBrandFilter = (brandId: number) => {
    let franchiseIds = [...filters?.franchise_ids]
    if (filters?.franchise_ids?.includes(brandId)) franchiseIds = filters?.franchise_ids?.filter((item: any) => item !== brandId)
    else franchiseIds.push(brandId)
    handleChangeFilters && handleChangeFilters('franchise_ids', franchiseIds)
  }

  const handleChangePriceRange = (value: string) => {
    if (value === filters?.price_level) handleChangeFilters('price_level', null)
    else handleChangeFilters('price_level', value)
  }

  const handleApplyFilters = () => {
    handleSearchbusinessAndProducts(true)
    setOpenFilters(false)
  }

  const isInteger = (val: any) => Number.isInteger(Number(val)) && !!val

  const onProductClick = (business: any, categoryId: any, productId: any, product: any) => {
    if (!isInteger(business?.id) ||
      !isInteger(categoryId) ||
      !isInteger(productId) ||
      !business.slug || !business.header || !business.logo) {
      showToast(ToastType.Error, t('NOT_AVAILABLE', 'Not Available'))
      return
    }
    const currentCart: any = Object.values(orderState.carts).find((cart: any) => cart?.business?.slug === business?.slug) ?? {}
    const productAddedToCartLength = currentCart?.products?.reduce((productsLength: number, Cproduct: any) => { return productsLength + (Cproduct?.id === productId ? Cproduct?.quantity : 0) }, 0) || 0
    navigation.navigate('ProductDetails', {
      isRedirect: 'business',
      businessId: business?.id,
      categoryId: categoryId,
      productId: productId,
      product: product,
      business: {
        store: business.slug,
        header: business.header,
        logo: business.logo,
      },
      productAddedToCartLength
    })
  }

  const handleEndReached = useCallback(() => {
    const hasMore = !(
      paginationProps.totalPages === paginationProps.currentPage
    );
    if (businessesSearchList.loading || isFetchingRef.current || !hasMore || !(businessesSearchList?.businesses?.length > 0)) return
    isFetchingRef.current = true
    handleSearchbusinessAndProducts(false, {}, termValue);
  }, [businessesSearchList.loading, businessesSearchList?.businesses?.length, paginationProps, termValue]);

  const rowContextRef = useRef<any>({})
  rowContextRef.current = {
    theme,
    t,
    parsePrice,
    parseDistance,
    parseNumber,
    optimizeImage,
    orderType: orderState?.options?.type,
    onBusinessClick,
    onProductClick,
    handleUpdateProducts,
    styles,
    productWidth,
    showProducts: isVisible('products')
  }

  const renderBusinessItem = useCallback(({ item: business }: any) => (
    <BusinessRow business={business} rowContext={rowContextRef.current} />
  ), [])


  const onChangeTermValue = (query: any) => {
    handleChangeTermValue(query)
    if (query) {
      events.emit('products_searched', query)
    }
  }

  useEffect(() => {
    if (filters.business_types?.length === 0 && filters.orderBy === 'default' && Object.keys(filters)?.length === 2 && !openFilters) {
      handleSearchbusinessAndProducts(true)
    }
  }, [filters, openFilters])

  useEffect(() => {
    handleSearchbusinessAndProducts(true)
  }, [filters.business_types])

  useEffect(() => {
    if (shouldClearSearchTerm) {
      handleChangeTermValue('')
      setShouldClearSearchTerm(false)
    }
  }, [shouldClearSearchTerm, handleChangeTermValue, setShouldClearSearchTerm]);


  const hasMorePages = businessesSearchList?.businesses?.length > 0 &&
    (paginationProps?.totalPages == null || paginationProps?.currentPage < paginationProps?.totalPages)

  const businessFiltered = useMemo(() => {
    return businessesSearchList.businesses ?? []
  }, [businessesSearchList.businesses])

  return (
    <>
      <HeaderContent
        hideAddress
        hideOrderControl
        title={t('SEARCH', 'Search')}
        navigation={navigation}
        onHandleCart={() => openScreen(navigation, 'Cart', {
          businessId: businessesSearchList?.businesses?.[0]?.id,
          business: businessesSearchList?.businesses?.[0]
        })}
      />
      <FlatList
        ref={listRef}
        data={businessFiltered}
        ListHeaderComponent={<BusinessSearchHeader
          businessesSearchList={businessesSearchList}
          paginationProps={paginationProps}
          termValue={termValue}
          brandList={brandList}
          filters={filters}
          openFilters={openFilters}
          businessTypes={businessTypes}
          onChangeTermValue={onChangeTermValue}
          handleChangeBrandFilter={handleChangeBrandFilter}
          handleChangePriceRange={handleChangePriceRange}
          handleApplyFilters={handleApplyFilters}
          clearFilters={clearFilters}
          handleChangeFilters={handleChangeFilters}
          handleChangeActiveBusinessType={handleChangeActiveBusinessType}
        />}
        onEndReached={handleEndReached}
        onEndReachedThreshold={1}
        onContentSizeChange={(w: number, h: number) => { contentSizeRef.current = h }}
        onLayout={(e: any) => { viewportHeightRef.current = e.nativeEvent.layout.height }}
        ListFooterComponent={hasMorePages ? <PaginationFooter /> : undefined}
        removeClippedSubviews={false}
        initialNumToRender={8}
        maxToRenderPerBatch={25}
        windowSize={9}
        updateCellsBatchingPeriod={50}
        onScroll={(e: any) => { scrollOffsetRef.current = e.nativeEvent.contentOffset.y }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        keyExtractor={(business: any, index: number) => `card-${business?.id}-${index}`}
        renderItem={renderBusinessItem}
      />
    </>
  )
}

const BusinessRow = ({ business, rowContext }: any) => {
  const {
    t,
    parsePrice,
    parseDistance,
    parseNumber,
    optimizeImage,
    orderType,
    onBusinessClick,
    onProductClick,
    handleUpdateProducts,
    styles,
    productWidth,
    showProducts
  } = rowContext
  const isDelivery = deliveryTypes.includes(orderType)
  const productsScrollRef = useRef<any>(null)

  useEffect(() => {
    productsScrollRef.current?.scrollTo?.({ x: 0, animated: false })
  }, [business?.id])

  return (
    <View style={styles.row}>
      <BusinessCard
        variant='compact'
        name={business?.name}
        logoUri={business?.logo}
        ribbon={business?.ribbon}
        rating={business?.reviews?.total > 0 ? parseNumber(business?.reviews?.total, { separator: '.' }) : null}
        time={convertHoursToMinutes(isDelivery ? business?.delivery_time : business?.pickup_time)}
        fee={isDelivery ? parsePrice(business?.delivery_price) : null}
        distance={business?.distance != null ? parseDistance(business?.distance) : null}
        isOpen={business?.open}
        closedLabel={t('CLOSED', 'Closed')}
        optimizeImage={optimizeImage}
        accessibilityLabel={t('GO_TO_STORE', 'Go to store')}
        onPress={() => onBusinessClick(business)}
      >
        {showProducts && businessHasProducts(business) && (
          <ScrollView
            ref={productsScrollRef}
            horizontal
            contentContainerStyle={styles.products}
            showsHorizontalScrollIndicator={false}
          >
            {business?.categories?.map((category: any) => category?.products?.map((product: any, i: number) => (
              <View key={'prod_' + product.id + `_${i}`} style={{ width: productWidth }}>
                <SingleProductCard
                  key={product?.id}
                  isPreviously
                  isSoldOut={(product.inventoried && !product.quantity)}
                  product={product}
                  businessId={business?.id}
                  onProductClick={(product: any) => onProductClick(business, category?.id, product?.id, product)}
                  productAddedToCartLength={0}
                  handleUpdateProducts={(productId: number, changes: any) => handleUpdateProducts(productId, category?.id, business?.id, changes)}
                />
              </View>
            )))}
          </ScrollView>
        )}
      </BusinessCard>
    </View>
  )
}

export const BusinessListingSearch = (props: BusinessSearchParams) => {
  const BusinessListSearchProps = {
    ...props,
    UIComponent: BusinessListingSearchUI,
    lazySearch: true
  }
  return <BusinessSearchList {...BusinessListSearchProps} />
}
