import { StackActions } from '@react-navigation/native'
import { returnTo } from '@/navigators/appNavigation'

export const checkoutReturnParams = (route: any) => (
  route?.params?.fromCheckout
    ? { fromCheckout: true, cartUuid: route.params.cartUuid }
    : null
)

/** Back to the checkout the screen was opened from, or one screen back. */
export const leaveToCheckoutOrBack = (navigation: any, route: any) => {
  if (route?.params?.fromCheckout) {
    returnTo(navigation, 'CheckoutPage', { cartUuid: route.params.cartUuid })
    return
  }
  if (navigation?.canGoBack?.()) navigation.goBack()
}

export const openFromCheckout = (navigation: any, route: any, name: string, params?: any) => {
  const stamp = checkoutReturnParams(route)
  if (!stamp) {
    navigation.navigate(name, params)
    return
  }
  if (name === 'CheckoutPage' || name === 'MultiCheckout') {
    returnTo(navigation, 'CheckoutPage', { cartUuid: route.params.cartUuid })
    return
  }
  navigation.dispatch(StackActions.replace(name, { ...params, ...stamp }))
}
