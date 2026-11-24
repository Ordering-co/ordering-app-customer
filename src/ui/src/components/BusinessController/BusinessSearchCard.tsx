import React from 'react';
import { useTheme } from 'styled-components/native';
import ReactNativeHapticFeedback from "react-native-haptic-feedback";

import { BusinessControllerParams } from '../../types';
import { convertHoursToMinutes } from '../../utils';
import { BusinessCard } from './BusinessCard';
import { preorderParams } from '@/navigators/appNavigation'

import {
  useUtils,
  useOrder,
  useLanguage,
  useConfig,
  useToast,
  useSession,
  ToastType
} from '@components';

import OButton from '../shared/OButton'

const deliveryTypes = [1, 7]

/** The business card of the map's sheet: the `compact` card with the card's `cta` slot. */
export const BusinessSearchCard = (props: BusinessControllerParams) => {
  const {
    business,
    handleClick,
    onCardSelect,
    navigation,
    isBusinessOpen,
    businessLogo,
    businessReviews,
    businessDeliveryPrice,
    businessDeliveryTime,
    businessPickupTime,
    businessDistance,
    handleFavoriteBusiness,
    getBusinessOffer,
  } = props;

  const [{ parsePrice, parseDistance, parseNumber, optimizeImage }] = useUtils();
  const [, { showToast }] = useToast()
  const [orderState] = useOrder();
  const [{ auth }] = useSession()
  const [configState] = useConfig();
  const [, t] = useLanguage();
  const theme: any = useTheme()
  const cta = theme.native.components.business_card.slots.cta

  const isDelivery = deliveryTypes.includes(orderState?.options?.type)
  const reviewsTotal = businessReviews?.reviews?.total ?? business?.reviews?.total
  const offerValue = getBusinessOffer?.(business?.offers)
  const isPreorder = !isBusinessOpen && configState?.configs?.preorder_status_enabled?.value === '1'

  const vibrateApp = (impact?: any) => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false
    };
    ReactNativeHapticFeedback.trigger(impact || "impactLight", options);
  }

  const handleCardSelect = (selectedBusiness: any) => {
    vibrateApp()
    onCardSelect?.(selectedBusiness)
  }

  const handleOrderNow = (selectedBusiness: any) => {
    vibrateApp()
    if (business?.open) {
      handleClick?.(selectedBusiness)
      return
    }
    if (configState?.configs?.preorder_status_enabled?.value === '1') {
      navigation.navigate('MomentOption', preorderParams(selectedBusiness, 'business'))
      return
    }
    showToast(ToastType.Info, t('ERROR_ADD_PRODUCT_BUSINESS_CLOSED', 'The business is closed at the moment'));
  }

  const handleChangeFavorite = () => {
    if (auth) {
      handleFavoriteBusiness && handleFavoriteBusiness(!business?.favorite)
    } else {
      navigation && navigation.navigate('Login');
    }
  }

  return (
    <BusinessCard
      variant='compact'
      name={business?.name}
      logoUri={businessLogo || business?.logo}
      ribbon={business?.ribbon}
      rating={reviewsTotal > 0 ? parseNumber(reviewsTotal, { separator: '.' }) : null}
      time={convertHoursToMinutes(isDelivery
        ? (businessDeliveryTime ?? business?.delivery_time)
        : (businessPickupTime ?? business?.pickup_time))}
      fee={isDelivery ? parsePrice(businessDeliveryPrice ?? business?.delivery_price) : null}
      distance={(businessDistance ?? business?.distance) != null ? parseDistance(businessDistance ?? business?.distance) : null}
      isOpen={isBusinessOpen}
      offer={offerValue ? `${t('DISCOUNT', 'Discount')} ${offerValue}` : null}
      preorder={isPreorder ? t('PREORDER', 'Preorder') : null}
      closedLabel={t('CLOSED', 'Closed')}
      favorite={{ active: business?.favorite, onToggle: handleChangeFavorite, animated: auth }}
      optimizeImage={optimizeImage}
      onPress={() => handleCardSelect(business)}
    >
      <OButton
        text={t('ORDER_NOW', 'Order Now')}
        color={cta.color}
        appearance={cta.appearance}
        size={cta.size}
        onClick={() => handleOrderNow(business)}
      />
    </BusinessCard>
  );
}
