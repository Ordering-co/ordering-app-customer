import React from 'react'
import { ListWrapper } from './styles'
import { BusinessCardSkeleton } from '../../../BusinessController/BusinessCardSkeleton'

/** The loading business cards under the listing (the card's own shape). */
export const FlatListBusinessListFooter = (props: any) => {
  const {
    businessesList,
    paginationProps
  } = props

  return (
    <ListWrapper>
      {(businessesList.loading || !businessesList?.fetched) && (
        <BusinessCardSkeleton
          headerSize='listing'
          count={paginationProps.nextPageItems > 0 ? paginationProps.nextPageItems : 8}
        />
      )}
    </ListWrapper>
  )
}
