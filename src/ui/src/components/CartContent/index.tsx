import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from 'styled-components/native';
import { LoadingOverlay } from '../LoadingOverlay';
import { Fade, Placeholder, PlaceholderLine } from '@/ui/src/components/shared/Skeleton';
import { BillLine, CCContainer, CCNotCarts, CCList, ChCartsTotal, GroupDivider, GroupHeader, GroupMessage } from './styles';
import { BillText } from '../OrderSummary/BillText';
import { themeColor, themePart } from '@/theme/helpers';
import { usePageSections } from '@/theme/sections';

import { useLanguage, useConfig, useUtils, useOrder } from '@components';
import {
  Cart,
  OButton,
  OText,
  NotFoundSource
} from '@ui'
import { useCartGroupPreview } from '../../hooks/useCartGroupPreview'

// Skeleton boxes are layout (the size of the price they stand for).
const PRICE_SKELETON_HEIGHT = 14
const skeleton = StyleSheet.create({ line: { marginBottom: 0 } })

const PriceSkeleton = ({ width }: { width: number }) => (
  <Placeholder Animation={Fade} style={{ width }}>
    <PlaceholderLine height={PRICE_SKELETON_HEIGHT} style={skeleton.line} />
  </Placeholder>
)

const CartGroup = React.memo(({ group, index, renderCart, handleClickCheckout, groupCartsByUuid, isGroupPricingPending }: {
  group: any[],
  index: number,
  renderCart: (cart: any) => React.JSX.Element,
  handleClickCheckout: (group: any[], uuid: string | null) => void,
  groupCartsByUuid?: Record<string, any>,
  isGroupPricingPending?: boolean
}) => {
  const [, t] = useLanguage()
  const [{ parsePrice }] = useUtils()

  const validCarts = useMemo(() => group.filter((cart: any) => cart?.valid), [group])
  const hasPending = useMemo(() => validCarts.some((cart: any) => cart?.status === 2), [validCarts])
  const totalForCart = useMemo(() => validCarts.reduce((total: number, cart: any) => total + (groupCartsByUuid?.[cart?.uuid] ?? cart)?.total, 0), [validCarts, groupCartsByUuid])

  return (
    <>
      <GroupHeader>
        <OText preset='h4' weight={700}>
          {t('CART', 'Cart')} #{index + 1}
          {hasPending && (
            <OText preset='body_sm' color='primary_text'>
              {' '}({t('PENDING', 'Pending')})
            </OText>
          )}
        </OText>
        {validCarts?.length > 0 && (
          <OButton
            size='sm'
            onClick={() => handleClickCheckout(group, validCarts?.length === 1 ? group[0]?.uuid : null)}
            text={t('CHECKOUT', 'Checkout')}
          />
        )}
      </GroupHeader>
      {group?.map(renderCart)}
      {validCarts?.length > 0 && (
        <BillLine>
          <BillText total>{t('TOTAL_FOR', 'Total for')} {t('CART', 'Cart')} #{index + 1}</BillText>
          {isGroupPricingPending && !hasPending ? <PriceSkeleton width={80} /> : <BillText total>{parsePrice(totalForCart)}</BillText>}
        </BillLine>
      )}
    </>
  )
})

interface CartItemProps {
  cart: any;
  singleBusiness: boolean;
  isFranchiseApp: boolean;
  onNavigationRedirect: (screen: string, params?: any) => void;
  isCartsLoading: boolean;
  setIsCartsLoading: (loading: boolean) => void;
  isMultiCheckout: boolean;
  cartsOpened: string[];
  setCartsOpened: (carts: string[]) => void;
  changeActiveState: (isClosed: boolean, uuid: string) => void;
  hasCartReservation: boolean;
  hideCouponInput?: boolean;
  hideDeliveryFee?: boolean;
  hideDriverTip?: boolean;
}

const CartItem = React.memo(({
  cart,
  singleBusiness,
  isFranchiseApp,
  onNavigationRedirect,
  isCartsLoading,
  setIsCartsLoading,
  isMultiCheckout,
  cartsOpened,
  setCartsOpened,
  changeActiveState,
  hasCartReservation,
  hideCouponInput,
  hideDeliveryFee,
  hideDriverTip
}: CartItemProps) => {
  const [orderState] = useOrder()

  if (!(cart.products.length > 0 || (cart?.reservation && orderState?.options?.type === 9))) {
    return null
  }

  return (
    <Cart
      forceHideCheckoutButton
      singleBusiness={singleBusiness}
      isFranchiseApp={isFranchiseApp}
      cart={cart}
      cartuuid={cart.uuid}
      onNavigationRedirect={onNavigationRedirect}
      isCartsLoading={isCartsLoading}
      setIsCartsLoading={setIsCartsLoading}
      isMultiCheckout={isMultiCheckout}
      hideUpselling
      businessConfigs={cart?.business?.configs}
      hideCouponInput={hideCouponInput}
      hideDeliveryFee={hideDeliveryFee}
      hideDriverTip={hideDriverTip}
      cartsOpened={cartsOpened}
      setCartsOpened={setCartsOpened}
      changeActiveState={changeActiveState}
      isActive={cartsOpened?.includes?.(cart?.uuid) || !!singleBusiness}
      hasCartReservation={hasCartReservation}
    />
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.cart.uuid === nextProps.cart.uuid &&
    prevProps.cart.products === nextProps.cart.products &&
    prevProps.cart.total === nextProps.cart.total &&
    prevProps.isCartsLoading === nextProps.isCartsLoading &&
    prevProps.cartsOpened === nextProps.cartsOpened &&
    prevProps.hasCartReservation === nextProps.hasCartReservation
  )
})

export const CartContent = React.memo((props: any) => {
  const {
    onNavigationRedirect,
    singleBusiness,
    businessSlug,
    navigation,
    isFranchiseApp
  } = props

  const theme: any = useTheme();
  // With multi checkout, the carts page is the theme's `multi_cart` (carts, then their totals).
  const { render } = usePageSections('multi_cart')
  const [, t] = useLanguage()
  const [{ configs }] = useConfig()
  const [{ parsePrice }] = useUtils();
  const [isCartsLoading, setIsCartsLoading] = useState(false)
  const [cartsOpened, setCartsOpened] = useState<string[]>([])
  const [{ carts: cartsContext, options }, { confirmCart }] = useOrder();

  const cartsList = useMemo(() => {
    return (cartsContext &&
      Object.values(cartsContext).filter((cart: any) =>
        cart.products?.length > 0 || (cart?.reservation && options?.type === 9)
      )) ?? [];
  }, [cartsContext, options?.type]);

  const carts = useMemo(() => {
    return businessSlug
      ? cartsList.filter((cart: any) =>
        cart?.business?.slug === businessSlug ||
        parseInt(businessSlug) === cart?.business_id
      )
      : cartsList
  }, [cartsList, businessSlug]);

  const isOrderStateCarts = !!carts
  const isMultiCheckout = configs?.checkout_multi_business_enabled?.value === '1' && options?.type !== 9
  const hasCartReservation = carts?.some((cart: any) => cart?.reservation)

  const cartsAvailable: any = useMemo(() => Object.values(carts || {})?.filter?.((cart: any) => cart?.valid), [carts])
  const { cartGroup, isPending: isGroupPricingPending } = useCartGroupPreview({ enabled: isMultiCheckout && !hasCartReservation })
  const groupCartsByUuid = useMemo(
    () => (cartGroup?.carts || []).reduce((map: Record<string, any>, cart: any) => ({ ...map, [cart?.uuid]: cart }), {}),
    [cartGroup]
  )
  const pricedCarts: any[] = useMemo(
    () => cartsAvailable.map((cart: any) => groupCartsByUuid[cart?.uuid] ?? cart),
    [cartsAvailable, groupCartsByUuid]
  )
  const totalCartsPrice = pricedCarts?.length && pricedCarts.reduce((total: any, cart: any) => { return total + cart?.total }, 0)
  const totalCartsFee = pricedCarts?.length && pricedCarts
    ?.filter((cart: any) => cart?.status !== 1 && cart?.valid && cart?.products?.length)
    ?.reduce((total: any, cart: any) => { return total + (cart?.delivery_price_with_discount) }, 0)
  const totalDriverTip = pricedCarts.reduce((sum: any, cart: any) => sum + (cart?.driver_tip || 0), 0)

  const cartGroups = useMemo(() => {
    if (!carts?.length) return {}
    return carts.sort((a: any, b: any) => b?.status - a?.status).reduce((groups: any, cart: any) => {
      const groupId: any = cart?.status === 2 ? [`pending:${cart?.group?.uuid || cart?.uuid}`] : ['active']
      groups[groupId] = [...(groups[groupId] || []), cart]
      return groups
    }, {})
  }, [carts])

  const renderCart = useCallback((cart: any) => (
    <CCList nestedScrollEnabled={true} key={cart.uuid}>
      <CartItem
        singleBusiness={singleBusiness}
        isFranchiseApp={isFranchiseApp}
        cart={cart}
        onNavigationRedirect={onNavigationRedirect}
        isCartsLoading={isCartsLoading}
        setIsCartsLoading={setIsCartsLoading}
        isMultiCheckout={isMultiCheckout}
        hideCouponInput={configs?.multi_business_checkout_coupon_input_style?.value === 'group'}
        hideDeliveryFee={isMultiCheckout && configs?.multi_business_checkout_show_combined_delivery_fee?.value === '1'}
        hideDriverTip={isMultiCheckout && configs?.multi_business_checkout_show_combined_driver_tip?.value === '1'}
        cartsOpened={cartsOpened}
        setCartsOpened={setCartsOpened}
        changeActiveState={changeActiveState}
        hasCartReservation={hasCartReservation}
      />
    </CCList>
  ), [cartsOpened, singleBusiness, hasCartReservation, configs])

  const handleCheckoutRedirect = useCallback((group: any[], singleUuid: string | null) => {
    const isSingleCart = cartsAvailable.length === 1
    const groupValidCarts = group.filter((cart: any) => cart?.valid)
    const previewGroupUuid = cartGroup?.uuid && groupValidCarts.length && groupValidCarts.every((cart: any) => groupCartsByUuid[cart?.uuid]) ? cartGroup.uuid : null
    const hasNotGroup = !previewGroupUuid && group.some((cart: any) => !cart?.group?.uuid)
    const cartGroupUuid = previewGroupUuid ?? group[0]?.group?.uuid

    if (isSingleCart || singleUuid) {
      onNavigationRedirect('CheckoutPage', {
        cartUuid: singleUuid
      })
    } else if (hasNotGroup) {
      onNavigationRedirect('MultiCheckout', {
        checkCarts: true
      })
    } else {
      onNavigationRedirect('MultiCheckout', {
        cartUuid: cartGroupUuid
      })
    }
  }, [cartsAvailable, onNavigationRedirect, cartGroup, groupCartsByUuid])

  const changeActiveState = useCallback((isClosed: boolean, uuid: string) => {
    const isActive = cartsOpened?.includes?.(uuid) || !!singleBusiness
    if (isActive || !isClosed) {
      setCartsOpened(cartsOpened?.filter?.((_uuid: any) => _uuid !== uuid))
    } else {
      setCartsOpened([
        ...cartsOpened,
        uuid
      ])
    }
  }, [cartsOpened])

  useEffect(() => {
    const unsuscribe = navigation.addListener('focus', () => {
      const cartsListBlockedByPaypal = carts?.filter((cart: any) => cart?.status === 2 && cart?.paymethod_data?.gateway === 'paypal')
      if (cartsListBlockedByPaypal?.length > 0) {
        cartsListBlockedByPaypal.map(async (cart: any) => {
          await confirmCart(cart?.uuid)
        })
      }
    })
    return () => {
      return unsuscribe()
    }
  }, [carts, navigation])

  const renderGroupTotals = () => isMultiCheckout && (
    <>
      {!!cartsAvailable.length && (
        <>
          <ChCartsTotal>
            {(isGroupPricingPending || !!totalCartsFee) && configs?.multi_business_checkout_show_combined_delivery_fee?.value === '1' && (
              <BillLine>
                <BillText>
                  {t('TOTAL_DELIVERY_FEE', 'Total delivery fee')}
                </BillText>
                {isGroupPricingPending ? <PriceSkeleton width={60} /> : (
                  <BillText>
                    {parsePrice(totalCartsFee)}
                  </BillText>
                )}
              </BillLine>
            )}
            {totalDriverTip > 0 &&
              configs?.multi_business_checkout_show_combined_driver_tip?.value === '1' && (
                <BillLine>
                  <BillText>
                    {t('DRIVER_TIP', 'Driver tip')}
                  </BillText>
                  <BillText>
                    {parsePrice(totalDriverTip)}
                  </BillText>
                </BillLine>
              )}
            <BillLine>
              <BillText total weight={500}>
                {t('TOTAL_FOR_ALL_CARTS', 'Total for all Carts')}
              </BillText>
              {isGroupPricingPending ? <PriceSkeleton width={90} /> : (
                <BillText total weight={500}>{parsePrice(totalCartsPrice)}</BillText>
              )}
            </BillLine>
            <GroupMessage>
              <OText preset='body' align='center'>
                {t('CART_GROUP_MESSAGE_ALERT', 'Discounts may be applied at the time of payment for this group.')}
              </OText>
            </GroupMessage>
          </ChCartsTotal>
        </>
      )}
    </>
  )

  return (
    <CCContainer>
      {isOrderStateCarts && carts?.length > 0 && (
        <>
          {render({
            carts: () => (
              Object.keys(cartGroups)?.length > 0 && isMultiCheckout
                ? (
                  Object.entries(cartGroups).map(([group, _], i) => (
                    <React.Fragment key={group}>
                      <CartGroup
                        group={cartGroups[group]}
                        index={i}
                        renderCart={renderCart}
                        handleClickCheckout={handleCheckoutRedirect}
                        groupCartsByUuid={groupCartsByUuid}
                        isGroupPricingPending={isGroupPricingPending}
                      />
                      <GroupDivider />
                    </React.Fragment>
                  ))
                )
                : (
                  carts?.map(renderCart)
                )
            ),
            group_totals: renderGroupTotals
          })}
        </>
      )}
      {(!carts || carts?.length === 0) && (
        <CCNotCarts>
          <NotFoundSource
            hideImage
            content={t('CARTS_NOT_FOUND', 'You don\'t have carts available')}
            btnTitle={t('START_SHOPPING', 'Start shopping')}
            onClickButton={() => singleBusiness ? onNavigationRedirect('Business') : onNavigationRedirect('AddressList')}
          />
        </CCNotCarts>
      )}
      <LoadingOverlay
        visible={isCartsLoading}
        color={themePart(theme, 'spinner', 'base.color')}
        overlayColor={themeColor(theme, 'overlay')}
      />
    </CCContainer>
  )
})
