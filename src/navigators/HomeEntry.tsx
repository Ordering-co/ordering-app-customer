import React from 'react';

import BusinessList from '../pages/BusinessesListing';
import BusinessProductsList from '../pages/BusinessProductsList';
import AddressList from '../pages/AddressList';
import { useOrderState, useConfig } from '@components';
import { isOrderTypeUnaddressed } from '../utils/unaddressedOrderTypes';
import { isSingleBusiness } from '../utils/singleBusiness';

/**
 * What Home shows once signed in: the address list until the order has an address, then the
 * businesses; also without one when the project lets this order type list that way
 * (`unaddressed_order_types_allowed`: pickup by city). It reads the order and the configs
 * itself, so the tab bar does not render again with them.
 */
export const HomeEntry = ({ propsToPass }: any) => {
  const { options } = useOrderState()
  const [{ configs }] = useConfig()
  return !options?.address_id && !isOrderTypeUnaddressed(configs, options?.type)
    ? <AddressList {...propsToPass} />
    : isSingleBusiness()
      ? <BusinessProductsList {...propsToPass} isHome />
      : <BusinessList {...propsToPass} />
}
