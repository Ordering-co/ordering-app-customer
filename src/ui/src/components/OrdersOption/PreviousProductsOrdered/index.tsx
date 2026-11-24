import React from 'react'
import { ScrollView, Dimensions } from 'react-native'
import { useTheme } from 'styled-components/native'
import { themeSpace } from '@/theme/helpers'
import { ListWrapper } from './styles'

import { PreviousProductsOrderedParams } from '../../../types'
import { SingleProductCard } from '../../SingleProductCard'

export const PreviousProductsOrdered = (props: PreviousProductsOrderedParams) => {
  const {
    products,
    fullWidth,
    onProductClick,
    handleUpdateProducts,
    isBusinessesSearchList
  } = props

  const windowWidth = Dimensions.get('window').width;
  const theme: any = useTheme()

  const productList = (
    <>
      {products?.filter((product: any) => product?.business?.available)?.map((product: any) => (
        <SingleProductCard
          key={product?.id}
          isProductId
          isSoldOut={(product.inventoried && !product.quantity)}
          product={product}
          businessId={product?.business?.id}
          onProductClick={onProductClick}
          style={{ width: fullWidth ? '100%' : (windowWidth - (products?.length > 1 ? 120 : 80)), marginRight: themeSpace(theme, 'lg') }}
          productAddedToCartLength={0}
          handleUpdateProducts={handleUpdateProducts}
        />
      ))}
    </>
  )

  return (
    <ScrollView
      horizontal={isBusinessesSearchList}
      showsVerticalScrollIndicator={false}
    >
      {isBusinessesSearchList ? (
        productList
      ) : (
        <ListWrapper isBusinessesSearchList={isBusinessesSearchList}>
          {productList}
        </ListWrapper>
      )}
    </ScrollView>
  )
}
