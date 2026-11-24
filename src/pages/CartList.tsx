import * as React from 'react';
import { StackActions } from '@react-navigation/native';
import settings from '../config.js'

import { useLanguage, useOrder } from '@components';
import { leaveToCheckoutOrBack, openFromCheckout } from '@/utils/checkoutReturn';
import {
  CartContent,
  NavBar,
  SafeAreaViewWrapper
} from '@ui';
import { openScreen } from '@/navigators/appNavigation'

interface Props {
  navigation: any;
  route: any;
  titleStyle?: any
}

const CartList = (props: Props) => {
  const [, t] = useLanguage();
  const [, { refreshOrderOptions }] = useOrder();
  const [refreshing] = React.useState(false);

  const handleOnRefresh = () => {
    refreshOrderOptions?.()
  }

  const cartProps = {
    ...props,
    isFranchiseApp: !!settings?.franchiseSlug,
    singleBusiness: settings?.businessSlug,
    onNavigationRedirect: (route: string, params: any, replace: boolean) => {
      if (props.route?.params?.fromCheckout) {
        openFromCheckout(props.navigation, props.route, route, params)
        return
      }
      if (replace) {
        props.navigation.dispatch(StackActions.replace(route, params))
        return
      }
      openScreen(props.navigation, route, params)
    },
  };

  return (
    <>
      <NavBar
        title={settings?.businessSlug
          ? t('CART', 'Cart')
          : t('MY_CARTS', 'My carts')}
        onActionLeft={() => leaveToCheckoutOrBack(props.navigation, props.route)}
      />
      <SafeAreaViewWrapper
        refreshing={refreshing}
        onRefresh={() => handleOnRefresh()}
      >
        <CartContent {...cartProps} />
      </SafeAreaViewWrapper>
    </>
  );
};

export default CartList;
