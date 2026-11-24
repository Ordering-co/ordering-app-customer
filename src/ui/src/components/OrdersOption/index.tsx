import React, { useState, useEffect, useRef } from 'react'
import { View } from 'react-native'
import { useIsFocused } from '@react-navigation/native'

import { OrdersOptionParams, OrdersLengthKey } from '../../types'
import { getOrderStatus, flatArray } from '../../utils'

import { OptionTitle, NoOrdersWrapper } from './styles'
import { SectionTitle } from '../shared/SectionTitle'
import { useSkeletonCard } from './skeleton'
import { PreviousBusinessOrdered } from './PreviousBusinessOrdered'
import { PreviousProductsOrdered } from './PreviousProductsOrdered'

import {
  Placeholder,
  PlaceholderLine,
  Fade
} from "../shared/Skeleton";

import { OrderList, useLanguage, useOrder, ToastType, useToast } from '@components'
import {
  OText,
  ActiveOrders,
  PreviousOrders,
  _setStoreData,
  NotFoundSource
} from '@ui'
import { openScreen } from '@/navigators/appNavigation'

/** The count of `ordersLength` a section of the orders tab reports. */
export const ordersLengthKey = ({ activeOrders, preOrders }: { activeOrders?: boolean, preOrders?: boolean }): OrdersLengthKey =>
  activeOrders ? 'activeOrdersLength' : preOrders ? 'preordersLength' : 'previousOrdersLength'

const OrdersOptionUI = (props: OrdersOptionParams) => {
  const {
    navigation,
    activeOrders,
    preOrders,
    orderList,
    pagination,
    titleContent,
    customArray,
    onNavigationRedirect,
    orderStatus,
    loadMoreStatus,
    loadMoreOrders,
    loadOrders,
    setOrdersLength,
    ordersLength,
    refreshOrders,
    setRefreshOrders,
    reorderState,
    handleReorder,
    handleUpdateOrderList,
    isBusiness,
    isProducts,
    businessOrderIds,
    products,
    businessesSearchList,
    hideOrders,
    businesses,
    handleUpdateProducts,
    handleUpdateBusinesses,
    businessId
  } = props

  const { styles, color: skeletonColor } = useSkeletonCard()

  const [, t] = useLanguage()
  const [{ carts }] = useOrder()
  const [, { showToast }] = useToast()
  const { loading, error, orders: values } = orderList
  const [businessLoading, setBusinessLoading] = useState(true)
  const [orders, setOrders] = useState<any>([])

  const _orders = customArray || values || []
  const uniqueOrders: any = []

  const showTitle = (ordersLength?.[ordersLengthKey({ activeOrders, preOrders })] ?? 0) > 0

  const availableProducts = products?.filter((product: any) => product?.business?.available) ?? []
  const isBusinessEmpty = isBusiness && !businesses?.loading && !businesses?.result?.length
  const isProductsEmpty = isProducts && !loading && !availableProducts.length

  useEffect(() => {
    if (loading || error) return
    const ordersReduced = _orders.map((order: any) => order?.cart_group_id
      ? _orders
        .filter((_order: any) => _order?.cart_group_id === order?.cart_group_id)
        .map((_o: any, _: any, _ordersList: any) => {
          const obj = {
            ..._o,
            id: _ordersList.map((o: any) => o.id),
            review: _o.review,
            user_review: _o.user_review,
            total: _ordersList.reduce((acc: any, o: any) => acc + o.summary.total, 0),
            business: _ordersList.map((o: any) => o.business),
            business_id: _ordersList.map((o: any) => o.business_id),
            products: _ordersList.map((o: any) => o.products)
          }
          return obj
        }).find((o: any) => o)
      : order)
    const orders = ordersReduced?.filter((order: any) => {
      if (!order?.cart_group_id) return true
      const isDuplicate = uniqueOrders.includes(order?.cart_group_id)
      if (!isDuplicate) {
        uniqueOrders.push(order?.cart_group_id)
        return true
      }
      return false
    })
    setOrders(orders)
  }, [JSON.stringify(_orders)])

  const onProductClick = (product: any) => {
    if (product?.product_id && product?.category_id && product?.businessId &&
      product?.business.slug && product?.business.header && product?.business.logo) {
      onNavigationRedirect('ProductDetails', {
        isRedirect: 'business',
        businessId: product?.businessId,
        categoryId: product?.category_id,
        productId: product?.product_id,
        business: {
          store: product?.business.slug,
          header: product?.business.header,
          logo: product?.business.logo,
        }
      })
    } else {
      showToast(ToastType.Error, t('ERROR_FAILED_REDIRECT_IDS', 'Failed to redirect product for ids'))
    }
  }

  useEffect(() => {
    if (reorderState?.loading) return
    const _businessId = 'businessId:' + reorderState?.result?.business_id
    if (reorderState?.error) {
      if (reorderState?.result?.business_id) {
        _setStoreData('adjust-cart-products', JSON.stringify(_businessId))
        openScreen(navigation, 'Business', { store: reorderState?.result?.business?.slug })
      }
    }
    if (!reorderState?.error && !reorderState.loading && reorderState?.result?.business_id) {
      const cartProducts = carts?.[_businessId]?.products

      const available = cartProducts.every((product: any) => product.valid)
      const orderProducts = orders.find(
        (order: any) => Array.isArray(order?.id)
          ? order?.id?.includes(reorderState?.result?.orderId)
          : order?.id === reorderState?.result?.orderId
      )?.products

      const productsFlatten = orderProducts?.length && flatArray(orderProducts)?.filter((product: any) => product?.order_id === reorderState?.result?.orderId)

      if (available && reorderState?.result?.uuid && (cartProducts?.length === productsFlatten?.length)) {
        const multiOrders = new Set(flatArray(orderProducts)?.map((product: any) => product.order_id))
        if (multiOrders.size > 1) {
          onNavigationRedirect && onNavigationRedirect('Cart')
        } else {
          onNavigationRedirect && onNavigationRedirect('CheckoutPage', { cartUuid: reorderState?.result.uuid })
        }
      } else {
        _setStoreData('adjust-cart-products', JSON.stringify(_businessId))
        cartProducts?.length !== productsFlatten?.length && _setStoreData('already-removed', JSON.stringify('removed'))
        openScreen(navigation, 'Business', { store: reorderState?.result?.business?.slug })
      }
    }
  }, [reorderState])

  useEffect(() => {
    if (reorderState?.error) {
      const errorMessage = (Array.isArray(reorderState?.result) || typeof reorderState?.result === 'string')
        ? reorderState?.result
        : t('CANT_REORDER_FOR_THIS_BUSINESS', 'Can’t reorder for this store, please create order manually.')
      showToast(ToastType.Error, errorMessage)
    }
  }, [reorderState])

  useEffect(() => {
    const hasMore = pagination?.totalPages && pagination?.currentPage !== pagination?.totalPages
    if (loadMoreStatus && hasMore && !loading) {
      loadMoreOrders()
    }
  }, [loadMoreStatus, loading, pagination])

  // Each section (upcoming, active, past) reports its count, and whether its list failed, to the
  // screen: an update from the previous state, since the three report at once (a copy of the
  // state they rendered with lost the others' counts, and the screen never knew they were empty).
  useEffect(() => {
    if (loading) return

    const count = error ? 0 : _orders.filter((order: any) => orderStatus.includes(order.status)).length
    const key = ordersLengthKey({ activeOrders, preOrders })
    const failed = !!error
    setOrdersLength?.((prev) => (prev?.[key] === count && !!prev?.errors?.[key] === failed
      ? prev
      : { ...prev, [key]: count, errors: { ...prev?.errors, [key]: failed } }))
  }, [_orders, loading, error, activeOrders, preOrders])

  useEffect(() => {
    if (refreshOrders) {
      loadOrders(false, false, false, true)
      setRefreshOrders && setRefreshOrders(false)
    }
  }, [refreshOrders])

  // Back on the tab (from an order, from another tab), its lists load again: an order placed or
  // one whose status changed shows up. Quietly: what is on screen stays, with no skeleton over it.
  const isFocused = useIsFocused()
  const wasFocused = useRef(isFocused)
  const [quietRefresh, setQuietRefresh] = useState(false)

  useEffect(() => {
    const cameBack = isFocused && !wasFocused.current
    wasFocused.current = isFocused
    if (!cameBack || hideOrders || loading) return
    setQuietRefresh(true)
    loadOrders(false, false, false, true)
  }, [isFocused])

  // Quiet until that reload ends.
  const wasLoading = useRef(loading)
  useEffect(() => {
    if (wasLoading.current && !loading) setQuietRefresh(false)
    wasLoading.current = loading
  }, [loading])

  const showLoading = loading && !quietRefresh

  return (
    <>
      {isBusinessEmpty && (
        <NoOrdersWrapper>
          <NotFoundSource
            iconName='storefront-outline'
            content={t('YOU_DONT_HAVE_BUSINESSES', 'You don\'t have any businesses')}
          />
        </NoOrdersWrapper>
      )}

      {isProductsEmpty && (
        <NoOrdersWrapper>
          <NotFoundSource
            iconName='fast-food-outline'
            content={t('YOU_DONT_HAVE_PRODUCTS', 'You don\'t have any products')}
          />
        </NoOrdersWrapper>
      )}

      {showTitle && (
        <>
          {((titleContent && ((isBusiness && businessOrderIds?.length > 0) || isProducts)) || !titleContent) && (
            <OptionTitle titleContent={!!titleContent} isBusinessesSearchList={!!businessesSearchList}>
              <SectionTitle>
                {titleContent || (activeOrders
                  ? t('ACTIVE', 'Active')
                  : preOrders
                    ? t('PREORDERS', 'Preorders')
                    : t('PAST', 'Past'))}
              </SectionTitle>
            </OptionTitle>
          )}
        </>
      )}

      {isBusiness && !isBusinessEmpty && (
        <PreviousBusinessOrdered
          onNavigationRedirect={onNavigationRedirect}
          isBusinessesSearchList={!!businessesSearchList}
          businesses={businesses}
          handleUpdateBusinesses={handleUpdateBusinesses}
        />
      )}
      {isProducts && !loading && !isProductsEmpty && (
        <PreviousProductsOrdered
          fullWidth
          products={products}
          onProductClick={onProductClick}
          handleUpdateProducts={handleUpdateProducts}
          isBusinessesSearchList={!!businessesSearchList}
        />
      )}
      {loading && isProducts && (
        <View style={showTitle ? styles.listUnderTitle : styles.list}>
          {[...Array(!!businessesSearchList ? 1 : 6).keys()].map(
            (_, i) => (
              <Placeholder
                key={i}
                Animation={Fade}
                style={styles.card}
              >
                <View style={styles.row}>
                  <PlaceholderLine width={45} color={skeletonColor} style={styles.line} />
                  <PlaceholderLine width={20} color={skeletonColor} style={styles.line} />
                </View>
                <PlaceholderLine width={70} color={skeletonColor} style={styles.lineSpacedMd} />
                <PlaceholderLine width={70} color={skeletonColor} style={styles.lineLast} />
              </Placeholder>
            ),
          )}
        </View>
      )}
      {!error && orders.length > 0 && !hideOrders && (
        preOrders ? (
          <ActiveOrders
            orders={orders.filter((order: any) => orderStatus.includes(order.status))}
            pagination={pagination}
            loadMoreOrders={loadMoreOrders}
            reorderLoading={reorderState?.loading}
            customArray={customArray}
            getOrderStatus={getOrderStatus}
            onNavigationRedirect={onNavigationRedirect}
            handleUpdateOrderList={handleUpdateOrderList}
          />
        ) : activeOrders ? (
          <ActiveOrders
            orders={orders.filter((order: any) => orderStatus.includes(order.status))}
            pagination={pagination}
            loadMoreOrders={loadMoreOrders}
            loading={showLoading}
            reorderLoading={reorderState?.loading}
            customArray={customArray}
            getOrderStatus={getOrderStatus}
            onNavigationRedirect={onNavigationRedirect}
            handleUpdateOrderList={handleUpdateOrderList}
          />
        ) : (
          <PreviousOrders
            reorderLoading={reorderState?.loading}
            orders={orders.filter((order: any) => orderStatus.includes(order.status)).sort((a: any, b: any) => (a?.id < b?.id) ? -1 : 1)}
            pagination={pagination}
            loadMoreOrders={loadMoreOrders}
            getOrderStatus={getOrderStatus}
            onNavigationRedirect={onNavigationRedirect}
            handleReorder={handleReorder}
            handleUpdateOrderList={handleUpdateOrderList}
            loading={showLoading}
          />
        )
      )}
      {showLoading && !hideOrders && !preOrders && (
        <View style={showTitle ? styles.listUnderTitle : styles.list}>
          {[...Array(5)].map((_, i) => (
            <Placeholder
              key={i}
              testID='orders-skeleton-card'
              style={styles.card}
              Animation={Fade}>
              <View style={styles.fullRow}>
                <Placeholder style={styles.inner}>
                  <PlaceholderLine width={30} color={skeletonColor} style={styles.line} />
                  <PlaceholderLine width={50} color={skeletonColor} style={styles.line} />
                  <PlaceholderLine width={70} color={skeletonColor} style={styles.lineLast} />
                </Placeholder>
              </View>
            </Placeholder>
          ))}
        </View>
      )}
    </>
  )
}

export const OrdersOption = (props: OrdersOptionParams) => {
  const getAllOrders = props.activeOrders && props.pastOrders && props.preOrders

  const MyOrdersProps = {
    ...props,
    UIComponent: OrdersOptionUI,
    noGiftCardOrders: true,
    orderStatus: getAllOrders
      ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26]
      : props.preOrders ? [13] : props.activeOrders
        ? [0, 3, 4, 7, 8, 9, 14, 18, 19, 20, 21, 22, 23, 24, 25, 26]
        : [1, 2, 5, 6, 10, 11, 12, 15, 16, 17],
    useDefualtSessionManager: true,
    paginationSettings: {
      initialPage: 1,
      pageSize: getAllOrders ? 30 : 10,
      controlType: 'infinity'
    }
  }

  return <OrderList {...MyOrdersProps} />

}
