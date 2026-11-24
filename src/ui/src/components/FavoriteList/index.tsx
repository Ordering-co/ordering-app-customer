import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import moment from 'moment';
import { Fade, Placeholder, PlaceholderLine } from '@/ui/src/components/shared/Skeleton';
import { useTheme } from 'styled-components/native';

import { FavoriteParams } from '../../types';
import { Container, WrappButton } from './styles'
import { getOrderStatus } from '../../utils'
import { BusinessCardSkeleton } from '../BusinessController/BusinessCardSkeleton'
import { nativeBoxStyle, nativeTextStyle, themeSpace } from '@/theme/helpers'

import {
  FavoriteList as FavoriteListController,
  useOrder,
  useLanguage
} from '@components';

import {
  _setStoreData,
  OButton,
  BusinessController,
  SingleProductCard,
  NotFoundSource,
  SingleOrderCard
} from '@ui'

type SkeletonLook = { color: string } & Record<'card' | 'row' | 'grow' | 'line' | 'image', any>

const LineSkeleton = ({ lines, skeleton }: { lines: number[], skeleton: SkeletonLook }) => (
  <View style={skeleton.grow}>
    {lines.map((width, i) => (
      <PlaceholderLine key={i} width={width} noMargin color={skeleton.color} style={skeleton.line} />
    ))}
  </View>
)

const ProductSkeleton = ({ skeleton }: { skeleton: SkeletonLook }) => (
  <View style={skeleton.card}>
    <Placeholder Animation={Fade}>
      <View style={skeleton.row}>
        <LineSkeleton lines={[70, 90, 80, 40]} skeleton={skeleton} />
        <View style={skeleton.image} />
      </View>
    </Placeholder>
  </View>
)

const OrderSkeleton = ({ skeleton }: { skeleton: SkeletonLook }) => (
  <View style={skeleton.card}>
    <Placeholder Animation={Fade}>
      <LineSkeleton lines={[50, 80, 60]} skeleton={skeleton} />
    </Placeholder>
  </View>
)

const FavoriteListUI = (props: FavoriteParams) => {
  const {
    favoriteList,
    handleUpdateFavoriteList,
    pagination,
    getFavoriteList,
    navigation,
    onNavigationRedirect,
    reorderState,
    handleReorder,
    isBusiness,
    isOrder,
    isProduct
  } = props

  const theme: any = useTheme();
  const [, t] = useLanguage()
  const [orderState] = useOrder();
  const [{ carts }] = useOrder()

  const pastOrders = [1, 2, 5, 6, 10, 11, 12, 15, 16, 17]

  const onProductClick = (product: any) => {
    const categoryId = product?.category?.id
    const businessId = product?.category?.business?.id
    if (!categoryId || !businessId) return
    onNavigationRedirect && onNavigationRedirect('ProductDetails', {
      isRedirect: 'business',
      productId: product?.id,
      businessId: businessId,
      categoryId: categoryId,
      business: {
        store: product?.category?.business.slug,
        header: product?.category?.header,
      }
    })
  }

  useEffect(() => {
    const _businessId = 'businessId:' + reorderState?.result?.business_id
    if (reorderState?.error) {
      if (reorderState?.result?.business_id) {
        _setStoreData('adjust-cart-products', JSON.stringify(_businessId))
        onNavigationRedirect && onNavigationRedirect('Business', { store: reorderState?.result?.business?.slug })
      }
    }
    if (!reorderState?.error && reorderState.loading === false && reorderState?.result?.business_id) {
      const cartProducts = carts?.[_businessId]?.products
      const available = cartProducts.every((product: any) => product.valid === true)
      const orderProducts = favoriteList?.favorites.find((order: any) => order?.id === reorderState?.result?.orderId)?.products

      if (available && reorderState?.result?.uuid && (cartProducts?.length === orderProducts?.length)) {
        onNavigationRedirect && onNavigationRedirect('CheckoutPage', { cartUuid: reorderState?.result.uuid })
      } else {
        _setStoreData('adjust-cart-products', JSON.stringify(_businessId))
        cartProducts?.length !== orderProducts?.length && _setStoreData('already-removed', JSON.stringify('removed'))
        onNavigationRedirect && onNavigationRedirect('Business', { store: reorderState?.result?.business?.slug })
      }
    }
  }, [reorderState])

  const handleBusinessClick = (business: any) => {
    onNavigationRedirect && onNavigationRedirect('Business', {
      store: business.slug,
      header: business.header,
      logo: business.logo,
    });
  }

  // Loading rows of products and orders: the card's box, lines of the skeleton's look.
  const skeleton = useMemo(() => {
    const card = theme.native.components.card.base
    const look = theme.native.components.skeleton.base
    const product = theme.native.components.product_card.base
    const body = nativeTextStyle(theme.native.tokens.typography.body)
    return {
      color: look.color,
      ...StyleSheet.create({
        card: { ...nativeBoxStyle(card), borderRadius: card.radius, padding: card.padding, marginBottom: themeSpace(theme, 'lg') },
        row: { flexDirection: 'row', alignItems: 'center', gap: themeSpace(theme, 'sm') },
        grow: { flex: 1 },
        line: { height: body.lineHeight, borderRadius: look.radius, marginBottom: themeSpace(theme, 'xs') },
        image: { width: product.image_size, height: product.image_size, borderRadius: product.image_radius, backgroundColor: look.color }
      })
    }
  }, [theme])

  return (
    <Container>
      {isBusiness && (
        <>
          {favoriteList?.favorites?.length > 0 && (
            favoriteList.favorites?.sort((a: any, b: any) => a?.name?.toLowerCase() > b?.name?.toLowerCase()).map((business: any, i: number) => (
              <BusinessController
                key={`${business.id}_` + i}
                favoriteView
                business={business}
                isBusinessOpen={business.open}
                handleCustomClick={handleBusinessClick}
                orderType={orderState?.options?.type}
                navigation={navigation}
                businessHeader={business?.header}
                businessFeatured={business?.featured}
                businessLogo={business?.logo}
                businessReviews={business?.reviews}
                businessDeliveryPrice={business?.delivery_price}
                businessDeliveryTime={business?.delivery_time}
                businessPickupTime={business?.pickup_time}
                businessDistance={business?.distance}
                handleUpdateBusinessList={handleUpdateFavoriteList}
              />
            ))
          )}
          {favoriteList?.loading && (
            <BusinessCardSkeleton count={5} />
          )}
          {!favoriteList?.loading && !favoriteList?.favorites?.length && (
            <NotFoundSource
              iconName='heart-outline'
              content={t('NOT_FOUND_FAVORITES_LIST', 'No favorites to show at this time.')}
            />
          )}
        </>
      )}

      {isProduct && (
        <>
          {favoriteList?.favorites?.length > 0 && (
            favoriteList.favorites?.sort((a: any, b: any) => a?.name?.toLowerCase() > b?.name?.toLowerCase()).map((product: any, i: number) => (
              <SingleProductCard
                key={`${product?.id}_${i}`}
                isSoldOut={product?.inventoried && !product?.quantity}
                product={product}
                onProductClick={onProductClick}
                handleUpdateProducts={handleUpdateFavoriteList}
              />
            ))
          )}
          {favoriteList?.loading && (
            [...Array(5).keys()].map(i => (
              <ProductSkeleton key={i} skeleton={skeleton} />
            ))
          )}
          {!favoriteList?.loading && !favoriteList?.favorites?.length && (
            <NotFoundSource
              iconName='heart-outline'
              content={t('NOT_FOUND_FAVORITES_LIST', 'No favorites to show at this time.')}
            />
          )}
        </>
      )}

      {isOrder && (
        <>
          {favoriteList?.favorites?.length > 0 && (
            favoriteList.favorites?.sort((a: any, b: any) => moment(a?.delivery_datetime_utc).valueOf() - moment(b?.delivery_datetime_utc).valueOf())
              .map((order: any, i: number) => (
                <SingleOrderCard
                  key={`${order?.id}_${i}`}
                  order={order}
                  getOrderStatus={getOrderStatus}
                  onNavigationRedirect={onNavigationRedirect}
                  pastOrders={pastOrders.includes(order?.status)}
                  handleUpdateOrderList={handleUpdateFavoriteList}
                  handleUpdateFavoriteList={handleUpdateFavoriteList}
                  handleReorder={handleReorder}
                  reorderLoading={reorderState?.loading}
                />
              ))
          )}
          {favoriteList?.loading && (
            [...Array(5).keys()].map(i => (
              <OrderSkeleton key={i} skeleton={skeleton} />
            ))
          )}
          {!favoriteList?.loading && !favoriteList?.favorites?.length && (
            <NotFoundSource
              iconName='heart-outline'
              content={t('NOT_FOUND_FAVORITES_LIST', 'No favorites to show at this time.')}
            />
          )}
        </>
      )}

      {!favoriteList?.loading && pagination.totalPages && pagination.currentPage < pagination.totalPages && (
        <WrappButton>
          <OButton
            onClick={() => getFavoriteList(pagination?.currentPage + 1)}
            text={t('LOAD_MORE_ITEMS', 'Load more items')}
          />
        </WrappButton>
      )}
    </Container>
  )
}

export const FavoriteList = (props: any) => {
  const favoriteBusinessesProps = {
    ...props,
    UIComponent: FavoriteListUI,
    enableLoadingAtRender: true
  }
  return <FavoriteListController {...favoriteBusinessesProps} />
}
