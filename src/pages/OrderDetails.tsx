import React, { useState } from 'react';
import { SafeAreaViewWrapper } from '../layouts/SafeAreaViewWrapper'
import { useSuppressProfileGate } from '../contexts/CheckoutFieldsContext';

import { useLanguage } from '@components'
import { NavBar, OrderDetails as OrderDetailsController } from '@ui';
import { goHome, openScreen } from '@/navigators/appNavigation'

const OrderDetails = ({ navigation, route }: any) => {
  useSuppressProfileGate();
  const isFromCheckout = route.params?.isFromCheckout
  // The order's number: from whoever opened the screen, or from the order once it loads (a deep
  // link and a push only bring its uuid).
  const [orderNumberId, setOrderNumberId] = useState(route.params?.orderNumberId)
  const fromHome = route.params?.fromHome

  const [, t] = useLanguage()

  const orderDetailsProps = {
    navigation,
    ...route.params,
    onGoBack: () => navigation?.canGoBack?.() && navigation.goBack(),
    onOrderNumber: setOrderNumberId,
    onNavigationRedirect: (page: string, params: any) => {
      if (!page) return
      openScreen(navigation, page, params)
    }
  }

  return (
    <>
      <NavBar
        title={orderNumberId ? `${t('ORDER_SHORT_TEXT', 'Order')} No. ${orderNumberId}` : t('ORDER', 'Order')}
        onActionLeft={() => (isFromCheckout || fromHome)
          ? goHome(navigation, { screen: 'Home' })
          : navigation?.canGoBack()
            ? navigation.goBack()
            : goHome(navigation, { screen: 'MyOrders' })}
      />
      <SafeAreaViewWrapper disableScrollView>
        <OrderDetailsController {...orderDetailsProps} />
      </SafeAreaViewWrapper>
    </>
  );
};

export default OrderDetails;
