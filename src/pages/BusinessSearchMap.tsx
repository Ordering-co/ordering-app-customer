import React, { useCallback } from 'react'
import { SafeAreaViewWrapper } from '@ui'
import { BusinessSearchMap as BusinessSearchMapController } from '@ui'
import { Platform } from 'react-native';
import settings from '../config.json'
import { openScreen } from '@/navigators/appNavigation'

const BusinessSearchMap = (props: any) => {

  const onBusinessClick = useCallback((business: any) => {
    openScreen(props.navigation, 'Business', {
      store: props?.route?.params?.store || business.slug,
      header: business.header,
      logo: business.logo,
    });
  }, [props.navigation, props?.route?.params?.store])

  const BusinessesListingSearchProps = {
    ...props,
    onBusinessClick,
    businessTypes: props?.route?.params?.businessTypes || [],
    defaultTerm: props?.route?.params?.defaultTerm || '',
    onNavigationRedirect: (page: string, params: any) => {
      if (!page) {
        return;
      }
      openScreen(props.navigation, page, params);
    },
    brandId: settings.franchiseSlug,
    isIos: Platform.OS === 'ios'
  };

  return (
    <SafeAreaViewWrapper pt disableScrollView>
      <BusinessSearchMapController {...BusinessesListingSearchProps} />
    </SafeAreaViewWrapper>
  )
}

export default BusinessSearchMap
