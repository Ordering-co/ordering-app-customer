import React from 'react';

import {
  Container,
  ItemListing
} from './styles';

import {
  CartStoresListing as StoresListingController,
  useOrder,
  useLanguage
} from '@components'

import {
  NotFoundSource,
  BusinessCart
} from '@ui'

const CartStoresListingUI = (props: any) => {
  const {
    businessIdSelect,
    storesState,
    changeStoreState,
    handleCartStoreChange,
  } = props

  const [, t] = useLanguage()
  const [orderState] = useOrder()
  const business: any = (orderState?.carts && Object.values(orderState.carts).find((_cart: any) => _cart?.uuid === props.cartuuid)) ?? {}
  const businessId = business?.business_id ?? null

  return(
    <>
      {/* The OModal around this list already has the close button. */}
      <Container>
        {!storesState?.loading && !storesState?.error && storesState?.result && (
          <>
            {storesState?.result?.length > 0 ? (
              <ItemListing
                horizontal={false}
              >
                {storesState?.result.map((store: any) => (
                  <BusinessCart
                    key={store.id}
                    business={store}
                    isLoading={changeStoreState.loading && businessIdSelect === store.id}
                    isDisabled={(changeStoreState?.result?.business_id ?? businessId) === store.id}
                    handleCartStoreClick={handleCartStoreChange}
                  />
                ))}
              </ItemListing>
            ) : (
              <NotFoundSource
                content={t('NOT_FOUND_CART_STORES', 'No businesses to show at this time.')}
              />
            )}
          </>
        )}

        {storesState?.loading && (
          <ItemListing>
            {[...Array(8).keys()].map(i => (
              <BusinessCart
                key={i}
                business={{}}
                isSkeleton
              />
            ))}
          </ItemListing>
        )}

        {!storesState?.loading && storesState?.error && (
          <NotFoundSource
            content={t('ERROR_NOT_FOUND_CART_STORES', 'Sorry, an error has occurred')}
          />
        )}
      </Container>
    </>
  )
}

export const CartStoresListing = (props: any) => {
  const storeProps = {
    ...props,
    UIComponent: CartStoresListingUI
  }

  return (
    <StoresListingController {...storeProps} />
  )
}
