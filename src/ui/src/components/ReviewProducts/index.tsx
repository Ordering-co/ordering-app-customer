import React, { useState, useEffect, useRef } from 'react'

import { ReviewProductParams } from '../../types'
import { Content, ProductsReviewsContainer } from './styles'

import { useLanguage, useToast, ToastType, ReviewProduct as ReviewProductController } from '@components'
import { SingleProductReview } from '@ui'
import { ReviewContinue, useReviewContentStyle } from '../ReviewOrder/ReviewForm'

const ReviewProductsUI = (props: ReviewProductParams) => {
  const {
    order,
    onNavigationRedirect,
    formState,
    handleChangeFormState,
    handleSendProductReview
  } = props

  const [, t] = useLanguage()
  const contentStyle = useReviewContentStyle()
  const [, { showToast }] = useToast()
  const scrollref = useRef<any>(null)

  const [alertState, setAlertState] = useState<{ open: boolean, content: Array<any>, success?: boolean }>({ open: false, content: [], success: false })

  const handleContinueClick = () => {
    setAlertState({ ...alertState, success: true })
    handleSendProductReview()
  }

  useEffect(() => {
    if (alertState.open) {
      alertState.content && showToast(ToastType.Error, alertState.content)
    }
  }, [alertState.content])

  useEffect(() => {
    if (!formState.loading && formState.result?.error) {
      setAlertState({
        open: true,
        success: false,
        content: formState.result?.result || [t('ERROR', 'Error')]
      })
    }
    if (!formState.loading && !formState.result?.error && alertState.success) {
      if (order?.driver && !order?.user_review) {
        onNavigationRedirect('ReviewDriver', { order: order })
      } else {
        onNavigationRedirect('BottomTab', { screen: 'MyOrders' })
      }
    }
  }, [formState])

  return (
    <>
      <Content
        showsVerticalScrollIndicator={false}
        contentContainerStyle={contentStyle}
        ref={scrollref}
      >
        <ProductsReviewsContainer>
          {order?.products && order.products.length > 0 && order?.products?.filter((product: any, j: number, hashKey: any) => hashKey.findIndex((item: any) => item.id === product.id) === j).map((productsOrder, index) => (
            productsOrder?.length
              ? productsOrder?.map((product: any, i: any) => !product?.deleted ?
                <SingleProductReview
                  key={product?.id}
                  product={product}
                  formState={formState}
                  handleChangeFormState={handleChangeFormState}
                  order={order}
                /> : null
              ) : (!productsOrder?.deleted ? (
                <SingleProductReview
                  key={index}
                  product={productsOrder}
                  formState={formState}
                  handleChangeFormState={handleChangeFormState}
                  order={order}
                />
              ) : null
              )
          ))}
        </ProductsReviewsContainer>
      </Content>
      <ReviewContinue
        text={t('CONTINUE', 'Continue')}
        disabled={formState.loading || formState?.changes?.length === 0}
        onClick={() => handleContinueClick()}
      />
    </>
  )
}

export const ReviewProducts = (props: any) => {
  const reviewProductProps = {
    ...props,
    UIComponent: ReviewProductsUI,
    isToast: true
  }
  return <ReviewProductController {...reviewProductProps} />
}
