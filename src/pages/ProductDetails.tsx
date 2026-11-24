import * as React from 'react';
import { useTheme } from 'styled-components/native';
import { ProductForm as ProductFormController, SafeAreaViewWrapper } from '@ui';
import { leaveToCheckoutOrBack } from '@/utils/checkoutReturn';
import { goHome, useSendResult } from '@/navigators/appNavigation'
import { themeVisible } from '@/theme/helpers'

interface Props {
  navigation: any;
  route: any;
}
const ProductDetails = (props: Props) => {
  // Read on mount: the form goes back before it reports the saved product.
  const tellOpener = useSendResult(props.navigation)
  const theme: any = useTheme()
  const productProps = {
    ...props,
    isCartProduct: props.route.params?.isCartProduct,
    isFromCheckout: props.route.params?.isFromCheckout,
    productCart: props.route.params?.productCart,
    product: props.route.params?.product,
    business: props.route.params?.business,
    businessSlug: props.route.params?.businessSlug,
    businessId: props.route.params?.businessId,
    categoryId: props.route.params?.categoryId,
    productId: props.route.params?.productId,
    // A cart's product, edited: the screen that opened it (the multi checkout) reloads its carts.
    callbackAfterUpdateCart: props.route.params?.isCartProduct
      ? () => tellOpener({ cartUpdatedAt: Date.now() })
      : undefined,
    productAddedToCartLength: props.route.params?.productAddedToCartLength || 0,
    onSave: props.route?.params?.fromCheckout
      ? () => leaveToCheckoutOrBack(props.navigation, props.route)
      : props?.navigation?.canGoBack()
        ? (props?.route?.params?.isRedirect === 'business' && !props?.route?.params?.alreadyInBusinessListing ? () => props?.navigation?.replace('Business', {
          store: props?.route?.params?.business?.store,
          header: props?.route?.params?.business?.header,
          logo: props?.route?.params?.business?.logo,
        }) : () => props?.navigation?.goBack())
        : () => goHome(props.navigation),
    onGoBack: props.route?.params?.fromCheckout
      ? () => leaveToCheckoutOrBack(props.navigation, props.route)
      : props?.navigation?.canGoBack()
        ? () => props?.navigation?.goBack()
        : () => goHome(props.navigation),
  };

  return (
    <SafeAreaViewWrapper pt={!themeVisible(theme, 'product.header')} disableScrollView>
      <ProductFormController {...productProps} />
    </SafeAreaViewWrapper>
  );
};

export default ProductDetails;
