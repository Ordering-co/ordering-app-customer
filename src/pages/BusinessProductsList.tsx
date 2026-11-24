import React from 'react';
import { StackActions } from '@react-navigation/native';
import { getSingleBusiness } from '../utils/singleBusiness';

import { useApi } from '@components';
import { BusinessProductsListing as BusinessProductsListController, NavBar, SafeAreaViewWrapper } from '@ui';
import { leaveToCheckoutOrBack, openFromCheckout } from '@/utils/checkoutReturn';
import { goHome, openScreen } from '@/navigators/appNavigation'

const BusinessProductsList = (props: any) => {
  const [ordering] = useApi();
  const singleBusiness = getSingleBusiness();
  const store =
    singleBusiness || (props.route.params?.store ?? props.route.params?.productLogin?.store_slug);
  const header = props.route.params?.header;
  const logo = props.route.params?.logo;
  const product = props.route.params?.productId ? {
    categoryId: props.route?.params?.categoryId,
    businessId: parseInt(props.route?.params?.store),
    id: props.route?.params?.productId
  } : props.route.params?.productLogin;

  const fromMulti = props.route.params?.fromMulti
  const businessProductsProps = {
    ...props,
    ordering,
    isSearchByName: true,
    isSearchByDescription: true,
    slug: typeof store === 'number' ? String(store) : store,
    businessSingleId: singleBusiness,
    businessProps: [
      'id',
      'name',
      'header',
      'logo',
      'name',
      'open',
      'about',
      'ribbon',
      'description',
      'address',
      'address_notes',
      'location',
      'timezone',
      'schedule',
      'service_fee',
      'delivery_price',
      'distance',
      'delivery_time',
      'gallery',
      'pickup_time',
      'reviews',
      'featured',
      'offers',
      'food',
      'laundry',
      'alcohol',
      'groceries',
      'slug',
      'vertical',
      'products',
      'zones',
      'professionals',
      'facebook_profile',
      'instagram_profile',
      'tiktok_profile',
      'pinterest_profile',
      'whatsapp_number',
      'snapchat_profile',
      'city',
      'city_id',
      'previously_products',
      'available_products_count',
      'today',
      'lazy_load_products_recommended',
      'minimum',
      'valid_service',
      'configs'
    ],
    handleSearchRedirect: () => {
      goHome(props.navigation, { screen: 'Home' });
    },
    onProductRedirect: ({ slug, category, product }: any) => { },
    onCheckoutRedirect: (cartUuid: any) => { },
    onGoBack: () => leaveToCheckoutOrBack(props.navigation, props.route),
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
    onBusinessClick: (business: any) => {
      openScreen(props.navigation, 'Business', {
        store: business.slug,
        header: business.header,
        logo: business.logo,
      });
    },
    logo,
    header,
    product,
    fromMulti
  };

  return (
    <SafeAreaViewWrapper pt headerInset='band' disableScrollView>
      <BusinessProductsListController {...businessProductsProps} />
    </SafeAreaViewWrapper>
  );
};

export default BusinessProductsList;
