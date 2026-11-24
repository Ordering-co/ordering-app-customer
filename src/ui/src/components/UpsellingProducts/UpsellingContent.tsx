import React, { useEffect } from 'react'
import { SectionTitle } from '../shared/SectionTitle'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from 'styled-components/native';
import { isOpaque, themeImage, themeSpace, bottomBarClearance } from '@/theme/helpers';
import { ScrollView } from 'react-native-gesture-handler';
import { useIsFocused } from '@react-navigation/native';

import { UpsellingLayout } from './UpsellingLayout';
import { HeaderContent } from '../BusinessesListing/Layout/Original/HeaderContent';
import { CartBarImage } from '../BusinessProductsListing/CartBarImage';

import { Divider, SummaryWrapper, ComplementWrapper, IllustrationWrapper } from './styles'

import { useLanguage, useOrder } from '@components'
import { OrderSummary, FloatingButton, CartStudentAlert } from '@ui'
import { openScreen } from '@/navigators/appNavigation'

export const UpsellingContent = (props: any) => {
  const {
    navigation,
    businessId,
    handleUpsellingPage,
    onNavigationRedirect,
    productsList
  } = props

  const theme: any = useTheme();
  const insets = useSafeAreaInsets()
  const [, t] = useLanguage()
  const [{ carts, loading }] = useOrder()
  const isFocused = useIsFocused()

  const cartExists = !!carts?.[`businessId:${businessId}`]
  const cart = carts?.[`businessId:${businessId}`] ?? {}

  useEffect(() => {
    if (loading || !isFocused) return
    if (!cartExists) return
    if (cart?.products?.length === 0 || !cart?.products) {
      navigation.goBack()
    }
  }, [cart?.products, loading, isFocused, cartExists])

  const handleClickCheckout = () => {
    if (handleUpsellingPage) {
      handleUpsellingPage(cart)
    } else {
      openScreen(navigation, 'CheckoutPage', {
        cartUuid: cart?.uuid
      })
    }
  }

  return (
    <>
      {cart?.business?.vertical === 'school' && (
        <CartStudentAlert cart={cart} />
      )}
      <HeaderContent
        isCart
        navigation={navigation}
        onGoBack={() => navigation.goBack()}
        fillable
        coversInset
      />
      <ScrollView
        // Clears the footer (the bottom bar).
        style={{ marginTop: themeSpace(theme, 'lg'), marginBottom: bottomBarClearance(theme, insets.bottom) }}
        showsVerticalScrollIndicator={false}
      >
        <SummaryWrapper>
          <OrderSummary
            cart={cart}
            isCartProductView
            showOnlyProducts
            isCartPending={cart?.status === 2}
            onNavigationRedirect={onNavigationRedirect}
          />
        </SummaryWrapper>
        {!!themeImage(theme, 'icons.cart_page') && (
          <IllustrationWrapper>
            <CartBarImage
              image='icons.cart_page'
              size={theme.native.components.cart.base.illustration_size}
              count={cart?.products?.reduce((sum: number, product: any) => sum + (product?.quantity || 0), 0) || 0}
            />
          </IllustrationWrapper>
        )}
        {productsList.length > 0 && (
          <>
            <Divider />
            <ComplementWrapper>
              <SectionTitle description={t('COMPLEMENT_YOUR_ORDER_DESCRIPTION', 'Users often include these products in their orders.')}>
                {t('COMPLEMENT_YOUR_ORDER', 'Complement your order')}
              </SectionTitle>
              <UpsellingLayout {...props} />
            </ComplementWrapper>
          </>
        )}
      </ScrollView>
      <FloatingButton
        text={t('CHECKOUT', 'Checkout')}
        text2nd={t('ADD_MORE_PRODUCTS', 'Add more products')}
        reverseOrder
        flexDirection='row'
        classBtn2='secondary'
        containerStyle={isOpaque(theme.native.components.cart.base.bar_background)
          ? { backgroundColor: theme.native.components.cart.base.bar_background }
          : undefined}
        handle2ndClick={() => navigation.goBack()}
        handleClick={() => handleClickCheckout()}
      />
    </>
  )
}
