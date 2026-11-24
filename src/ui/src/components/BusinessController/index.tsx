import React from 'react';
import { useTheme } from 'styled-components/native';
import FastImage from 'react-native-fast-image'
import ReactNativeHapticFeedback from "react-native-haptic-feedback";

import { BusinessControllerParams } from '../../types';
import { convertHoursToMinutes } from '../../utils';
import { themeImage } from '@/theme/helpers';

import { BusinessSearchCard } from './BusinessSearchCard';
import { BusinessCard } from './BusinessCard';
import { preorderParams } from '@/navigators/appNavigation'

import {
  BusinessController as BusinessSingleCard,
  useUtils,
  useLanguage,
  useConfig,
  useToast,
  useSession,
  ToastType,
  useOrderState
} from '@components';
import { Dimensions } from 'react-native'
import { imageUrl } from '@/utils/imageUrl'

function BusinessControllerPropsAreEqual(prevProps: any, nextProps: any) {
  // The list and the controller update a business immutably: identity is enough (two
  // serializations of the whole business per card and render were not).
  return prevProps.business === nextProps.business &&
    prevProps.isBusinessOpen === nextProps.isBusinessOpen &&
    prevProps.hideDistance === nextProps.hideDistance &&
    prevProps.onCardSelect === nextProps.onCardSelect &&
    prevProps.onBusinessClick === nextProps.onBusinessClick
}

const deliveryTypes = [1, 7]

export const BusinessControllerUI = React.memo((props: BusinessControllerParams) => {
  const {
    business,
    handleClick,
    navigation,
    isBusinessOpen,
    businessHeader,
    businessLogo,
    businessReviews,
    businessDeliveryPrice,
    businessDeliveryTime,
    businessPickupTime,
    businessDistance,
    hideDistance,
    handleFavoriteBusiness,
    getBusinessOffer,
    simpleView,
    favoriteView,
    isHighestRatedBusiness,
    businessListingSearchview
  } = props;

  const [{ parsePrice, parseDistance, parseNumber, optimizeImage }] = useUtils();
  const [, { showToast }] = useToast()
  const orderState = useOrderState();
  const [{ auth }] = useSession()
  const [configState] = useConfig();
  const [, t] = useLanguage();
  const theme: any = useTheme()

  // The header image: the business's own, else the theme's placeholder (`placeholder.business_header`).
  const placeholderHeader: any = themeImage(theme, 'placeholder.business_header')
  const resolvedHeader = businessHeader || business?.header || placeholderHeader?.uri || ''
  const localHeaderAsset = !businessHeader && !business?.header && typeof placeholderHeader === 'number'
    ? placeholderHeader
    : null
  const headerImageUri = resolvedHeader ? imageUrl(resolvedHeader, { width: Dimensions.get('window').width }) : null
  const isPreorder = !isBusinessOpen && configState?.configs?.preorder_status_enabled?.value === '1'
  const isDelivery = deliveryTypes.includes(orderState?.options?.type)
  const reviewsTotal = businessReviews?.reviews?.total ?? business?.reviews?.total
  const offerValue = getBusinessOffer?.(business?.offers)

  const vibrateApp = (impact?: any) => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false
    };
    ReactNativeHapticFeedback.trigger(impact || "impactLight", options);
  }

  const handleBusinessClick = (selectedBusiness: any) => {
    vibrateApp()
    if (business?.open) handleClick && handleClick(selectedBusiness)
    else {
      if (configState?.configs?.preorder_status_enabled?.value === '1') {
        navigation.navigate('MomentOption', preorderParams(selectedBusiness, 'business'))
        return
      }
      showToast(ToastType.Info, t('ERROR_ADD_PRODUCT_BUSINESS_CLOSED', 'The business is closed at the moment'));
    }
  }

  const handleChangeFavorite = () => {
    if (auth) {
      handleFavoriteBusiness && handleFavoriteBusiness(!business?.favorite)
    } else {
      navigation && navigation.navigate('Login');
    }
  }

  if (businessListingSearchview) {
    return (
      <BusinessSearchCard
        {...props}
      />
    );
  }

  const cardProps = {
    name: business?.name,
    logoUri: businessLogo || business?.logo,
    ribbon: business?.ribbon,
    rating: reviewsTotal > 0 ? parseNumber(reviewsTotal, { separator: '.' }) : null,
    time: convertHoursToMinutes(isDelivery
      ? (businessDeliveryTime ?? business?.delivery_time)
      : (businessPickupTime ?? business?.pickup_time)),
    fee: isDelivery ? parsePrice(businessDeliveryPrice ?? business?.delivery_price) : null,
    // Without an address the API measures from the project's default location: not the user's distance.
    distance: !hideDistance && (businessDistance ?? business?.distance) != null ? parseDistance(businessDistance ?? business?.distance) : null,
    isOpen: isBusinessOpen,
    offer: offerValue ? `${t('DISCOUNT', 'Discount')} ${offerValue}` : null,
    preorder: isPreorder ? t('PREORDER', 'Preorder') : null,
    closedLabel: t('CLOSED', 'Closed'),
    optimizeImage
  }

  if (simpleView) {
    return (
      <BusinessCard
        {...cardProps}
        variant='compact'
        onPress={() => handleClick && handleClick(business)}
      />
    );
  }

  const hasBanner = !!(headerImageUri || localHeaderAsset)

  return (
    <BusinessCard
      {...cardProps}
      headerSource={hasBanner
        ? (headerImageUri ? { uri: headerImageUri, priority: FastImage.priority.normal } : localHeaderAsset)
        : null}
      headerSize={isHighestRatedBusiness || favoriteView ? 'card' : 'listing'}
      narrow={isHighestRatedBusiness}
      favorite={{ active: business?.favorite, onToggle: handleChangeFavorite, animated: auth }}
      onPress={() => handleBusinessClick(business)}
    />
  );
}, BusinessControllerPropsAreEqual);

export const BusinessController = (props: BusinessControllerParams) => {
  const BusinessControllerProps = {
    ...props,
    UIComponent: BusinessControllerUI,
  };

  return <BusinessSingleCard {...BusinessControllerProps} />;
};
