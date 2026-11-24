import React, { useState, useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { useOrder, useLanguage, useUtils, useConfig, useEvent } from '@components';
import { useTheme } from 'styled-components/native';
import {
  BIContainer,
  BIHeader,
  BIContent,
  BIInfo,
  BIContentInfo,
  BILinks,
  BITotal,
  BIActions,
  PriceContainer
} from './styles';
import { OAlert, OButton, OText } from '../shared';
import Icon from '../shared/Icon';
import { PressableScale } from '../shared/PressableScale';
import { nativeTextStyle, themePart, themeSpace, themeVisible } from '@/theme/helpers';
import momentjs from 'moment'

export const BusinessItemAccordion = (props: any) => {
  const {
    cart,
    moment,
    handleClearProducts,
    handleClickCheckout,
    checkoutButtonDisabled,
    isMultiCheckout,
    isFromUpselling,
    changeActiveState,
    isActive,
    isGiftCart,
    cartReservation,
    hasCartReservation
  } = props

  const [orderState] = useOrder();
  const [, t] = useLanguage();
  const [{ parsePrice, is12Hours }] = useUtils();
  const [{ configs }] = useConfig()
  const theme: any = useTheme();
  const [events] = useEvent()
  const cartTheme = themePart(theme, 'cart', 'base')
  const storeSlot = themePart(theme, 'cart', 'slots.store')
  const clearSlot = themePart(theme, 'cart', 'slots.clear')
  // A ghost link has no box: its label, not its padding, starts where the business name starts.
  const firstLink = props.onNavigationRedirect && themeVisible(theme, 'cart.go_to_store') ? storeSlot : clearSlot
  const linksPull = useMemo(() => {
    const padding = themePart(theme, 'button', `sizes.${firstLink.size}.padding_x`)
    return { marginLeft: firstLink.appearance === 'ghost' ? -padding : themeSpace(theme, 'none') }
  }, [theme, firstLink])

  const isCartPending = cart?.status === 2
  const isClosed = !cart?.valid_schedule
  const isProducts = cart?.products?.length
  const isBusinessChangeEnabled = configs?.cart_change_business_validation?.value === '1' && orderState?.options?.type !== 9
  const is12hours = is12Hours
  const isValidReservation = cartReservation && momentjs(cartReservation?.reserve_date).format('YYYY-MM-DD HH:mm:ss') > momentjs().format('YYYY-MM-DD HH:mm:ss')
  const [viewedCart, setViewedCart] = useState<any>(null)
  useEffect(() => {
    const cartsArray = Object.values(orderState?.carts)
    const cartsLength = cartsArray.filter((cart: any) => cart?.products?.length > 0)?.length ?? 0
    if (cartsLength === 1) {
      changeActiveState && changeActiveState(!isClosed, cart?.uuid)
    }
  }, [orderState?.carts?.length, isClosed])

  useEffect(() => {
    if (isActive && !isFromUpselling) {
      if (cart?.uuid !== viewedCart?.uuid) {
        setViewedCart(cart)
        events.emit('cart_viewed', cart)
      }
    }
  }, [isActive, viewedCart])

  const handleGoToStore = () => {
    props.onNavigationRedirect('Business', { store: cart?.business?.slug })
  }

  return (
    <BIContainer isClosed={isClosed} isMultiCheckout={isMultiCheckout} checkoutVisible={!isActive && !isClosed && !!isProducts && !checkoutButtonDisabled}>
      <PressableScale
        disabled={isClosed}
        onPress={() => changeActiveState && changeActiveState(!isClosed, cart?.uuid)}
      >
        <BIHeader>
          <BIInfo>
            <BIContentInfo>
              {isGiftCart && (
                <OText style={nativeTextStyle(cartTheme.business_name)}>{t('GIFT_CARD_CHECKOUT', 'Gift card checkout')}</OText>
              )}
              {!!cart?.business?.name && themeVisible(theme, 'cart.business_name') && (
                <OText style={nativeTextStyle(cartTheme.business_name)}>{cart?.business?.name}</OText>
              )}
              <BILinks style={linksPull}>
                {props.onNavigationRedirect && !isClosed && !isGiftCart && themeVisible(theme, 'cart.go_to_store') && (
                  <OButton
                    text={t('GO_TO_STORE', 'Go to store')}
                    color={storeSlot.color}
                    appearance={storeSlot.appearance}
                    size={storeSlot.size}
                    onClick={() => handleGoToStore()}
                  />
                )}
                {!isCartPending && themeVisible(theme, 'cart.clear') && (
                  <OAlert
                    title={t('DELETE_CART', 'Delete Cart')}
                    message={t('QUESTION_DELETE_CART', 'Are you sure to you wants delete the selected cart')}
                    onAccept={() => handleClearProducts()}
                  >
                    {/* The alert is the touchable: the button only paints the `clear` slot. */}
                    <View pointerEvents='none'>
                      <OButton
                        text={t('CLEAR_CART', 'Clear cart')}
                        color={clearSlot.color}
                        appearance={clearSlot.appearance}
                        size={clearSlot.size}
                      />
                    </View>
                  </OAlert>
                )}
                {isBusinessChangeEnabled && props.handleChangeStore && !isGiftCart && !isCartPending && (
                  <OButton
                    text={t('CHANGE_STORE', 'Change store')}
                    color={storeSlot.color}
                    appearance={storeSlot.appearance}
                    size={storeSlot.size}
                    onClick={props.handleChangeStore}
                  />
                )}
              </BILinks>
            </BIContentInfo>
          </BIInfo>

          {isClosed && (
            <BITotal>
              <OText preset='body_sm' color='danger_text'>{t('CLOSED', 'Closed')} {moment}</OText>
            </BITotal>
          )}

          {!isClosed && !isProducts && (
            <BITotal>
              <OText>{cartReservation && orderState?.options?.type === 9 ? t('ONLY_TABLE', 'Only table') : t('NO_PRODUCTS', 'No products')}</OText>
            </BITotal>
          )}

          <BIActions>
            {!isClosed && (!!isProducts || cartReservation && orderState?.options?.type === 9) && (
              <Icon name={!isActive ? 'chevron-down' : 'chevron-up'} size='sm' color='text_muted' />
            )}
          </BIActions>
        </BIHeader>
      </PressableScale>
      {!isActive && !isClosed && !!isProducts && !isMultiCheckout && ((hasCartReservation && isValidReservation)) && (
        <PriceContainer>
          <OText>{parsePrice(cart?.total)}</OText>
          {cart?.valid_products && (
            <OButton
              onClick={handleClickCheckout}
              text={t('CHECKOUT', 'Checkout')}
              disabled={checkoutButtonDisabled}
            />
          )}
        </PriceContainer>
      )}
      {isActive && cartReservation && orderState?.options?.type === 9 && (
        <View>
          <OText preset='body_sm' color={!isValidReservation ? 'danger_text' : 'text'}>
            {t('RESERVATION', 'Reservation')} • {is12hours ? momentjs(cartReservation?.reserve_date).format('YYYY-MM-DD hh:mm a') : cartReservation?.reserve_date} • {cartReservation?.guests_reservation} {t('GUESTS', 'Guests')}
          </OText>
        </View>
      )}
      <BIContent style={{ display: isActive ? 'flex' : 'none' }}>
        {props.children}
      </BIContent>
    </BIContainer>
  )
}
