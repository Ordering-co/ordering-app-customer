import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Fade, Placeholder, PlaceholderLine } from '@/ui/src/components/shared/Skeleton';
import { useTheme } from 'styled-components/native';

import { Container, GiftCardCopy, GiftCardHeader, GiftCardItem, PurchaseButtonWrap } from './styles'
import { useApi, useLanguage, PurchaseGiftCard as PurchaseGiftCardController, useOrder, useSession, useUtils } from '@components'
import { listRemoteGiftCarts, purchaseGiftCard } from '../../../../../utils/giftCardCart'
import { OText, OButton, OIcon } from '@ui';
import { themeImage } from '@/theme/helpers'
import { BUNDLED_IMAGES } from '@/theme/bundledImages'

// Layout only (no theme values): safe at module level.
const purchaseButtonStyle = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch'
  },
  button: {
    alignSelf: 'stretch'
  },
  skeleton: {
    marginBottom: 0,
    width: '100%'
  }
})

/**
 * A card's artwork: the theme's gift card image when the theme sets one (for
 * every price), else the bundled artwork of the price (5, 10, 25, 50, 100),
 * else the bundled placeholder.
 */
const giftCardImage = (theme: any, price: number) =>
  theme.values.images['placeholder.gift_card']
    ? themeImage(theme, 'placeholder.gift_card')
    : (BUNDLED_IMAGES as any).general[`giftCard${price}`] ?? themeImage(theme, 'placeholder.gift_card')

const PurchaseGiftCardUI = (props: any) => {
  const {
    productsListState,
    handleCustomGoToCheckout,
  } = props

  const theme = useTheme()
  const [, t] = useLanguage()
  const [{ parsePrice }] = useUtils()
  const [ordering] = useApi()
  const [{ token }] = useSession()
  const [orderState, { clearCart, addProduct }] = useOrder()
  const [purchasingId, setPurchasingId] = useState<string | number | null>(null)

  const handlePurchase = async (product: any) => {
    if (purchasingId != null) return
    setPurchasingId(product.id)
    try {
      const outcome = await purchaseGiftCard({
        product,
        carts: orderState?.carts,
        listGiftCarts: () => listRemoteGiftCarts({
          getCarts: () => ordering.setAccessToken(token).carts().get()
        }),
        clearCart,
        addProduct
      })
      if (outcome.type === 'failed') return
      handleCustomGoToCheckout?.(outcome.uuid)
    } finally {
      setPurchasingId(null)
    }
  }

  return (
    <Container>
      <View>
        {productsListState.loading && (
          [...Array(5).keys()].map(i => (
            <GiftCardItem key={i}>
              <Placeholder
                Animation={Fade}
              >
                <PlaceholderLine height={70} style={purchaseButtonStyle.skeleton} />
              </Placeholder>
            </GiftCardItem>
          ))
        )}
        {productsListState.products.map((product: any) => (
          <GiftCardItem key={product.id}>
            <GiftCardHeader>
              <OIcon src={giftCardImage(theme, product.price)} width={70} height={70} />
              <GiftCardCopy>
                <OText color='text' preset='body_lg' weight={600}>{parsePrice(product.price)}</OText>
                <OText color='text_muted' preset='body_sm'>{product.name}</OText>
              </GiftCardCopy>
            </GiftCardHeader>
            <PurchaseButtonWrap>
              <OButton
                testID={`purchase-gift-${product.id}`}
                onClick={() => handlePurchase(product)}
                text={t('PURCHASE', 'Purchase')}
                parentStyle={purchaseButtonStyle.wrap}
                style={purchaseButtonStyle.button}
                color='primary'
                appearance='tonal'
                loading={purchasingId === product.id}
              />
            </PurchaseButtonWrap>
          </GiftCardItem>
        ))}
      </View>
    </Container>
  )
}

export const PurchaseGiftCard = (props: any) => {
  const purchaseGiftCardProps = {
    ...props,
    UIComponent: PurchaseGiftCardUI
  }
  return <PurchaseGiftCardController {...purchaseGiftCardProps} />
}
