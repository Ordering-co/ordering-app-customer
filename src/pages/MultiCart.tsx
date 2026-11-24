import React from 'react'
import { MultiCart as MultiCartController } from '@ui'
import { openScreen } from '@/navigators/appNavigation'

const MultiCart = (props: any) => {

  const multiCheckoutProps = {
    ...props,
    handleOnRedirectMultiCheckout: (cartUuid: string) => {
      openScreen(props.navigation, 'MultiCheckout', {
        cartUuid: cartUuid
      })
    },
    handleOnRedirectCheckout: (cartUuid: string) => {
      openScreen(props.navigation, 'CheckoutPage', {
        cartUuid: cartUuid
      })
    },
    cartUuid: props.route?.params?.cartUuid,
    cartGroup: props.route?.params?.cartGroup
  }

  return (
    <>
      <MultiCartController {...multiCheckoutProps} />
    </>
  )
}

export default MultiCart
