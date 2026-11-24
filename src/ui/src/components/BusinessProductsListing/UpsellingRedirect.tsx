import React, { useEffect } from 'react'
import { UpsellingPage as UpsellingPageController } from '@components'

const UpsellingRedirectUI = (props: any) => {
  const {
    businessId,
    business,
    cartProducts,
    setOpenUpselling,
    upsellingProducts,
    onRedirect
  } = props

  useEffect(() => {
    if (!upsellingProducts.loading) {
      // Plain data only: the page opens the checkout itself (by the cart's uuid).
      onRedirect &&
        onRedirect('UpsellingPage', {
          businessId,
          business: { slug: business?.slug },
          cartProducts,
          products: upsellingProducts?.products || []
        })
      setOpenUpselling(false)
    }
  }, [upsellingProducts.loading, upsellingProducts?.products.length])

  return (<>{null}</>)
}

export const UpsellingRedirect = (props: any) => {
  const upsellingProps = {
    ...props,
    useSuggestiveUpselling: !!props.cartProducts?.length,
    UIComponent: UpsellingRedirectUI
  }
  return (
    <UpsellingPageController {...upsellingProps} />
  )
}
