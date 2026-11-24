import React from 'react'
import BusinessesListing from './BusinessesListing'

const BusinessTypeListing = (props: any) => {
  const { businessTypeId, businessTypeName } = props?.route?.params ?? {}
  return (
    <BusinessesListing
      {...props}
      initialBuisnessType={businessTypeId}
      businessTypeScreen={{ id: businessTypeId, name: businessTypeName }}
    />
  )
}

export default BusinessTypeListing
