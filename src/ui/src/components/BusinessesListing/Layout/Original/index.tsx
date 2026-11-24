import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation'
import { useFocusEffect } from '@react-navigation/native';

import { BusinessesListingParams } from '../../../../types';
import { FlatListBusinessListing } from './FlatListBusinessListing'
import { useNextPageRequest } from './useNextPageRequest'

import { BusinessList as BusinessesListingController, useOrderState, useOrderActions, useConfig } from '@components';
import { PICKUP_ORDER_TYPE, isOrderTypeUnaddressed } from '@/utils/unaddressedOrderTypes';

const BusinessesListingUI = (props: BusinessesListingParams) => {
  const {
    navigation,
    businessesList,
    getBusinesses,
    paginationProps,
    citiesState,
    logosLayout
  } = props;

  const orderState = useOrderState();
  const { changeCityFilter } = useOrderActions();

  const [{ configs }] = useConfig();

  const allCitiesDisabled = citiesState?.cities?.every((city: any) => !city.enabled)
  // Businesses listed without an address (pickup by city): a boolean, so the cells it reaches keep their memo.
  const isUnaddressedListing = !orderState?.options?.address_id && isOrderTypeUnaddressed(configs, orderState?.options?.type)

  const [isFarAway, setIsFarAway] = useState(false)
  const [orderTypeValue, setOrderTypeValue] = useState(orderState?.options?.type)
  const timerId = useRef<any>(false)
  const [favoriteIds, setFavoriteIds] = useState<any>([])

  const handleScroll = useNextPageRequest(businessesList, paginationProps, getBusinesses)

  const convertToRadian = (value: number) => {
    return value * Math.PI / 180
  }

  const getDistance = (lat1: any, lon1: any, lat2: any, lon2: any) => {
    const R = 6371 // km
    const dLat = convertToRadian(lat2 - lat1)
    const dLon = convertToRadian(lon2 - lon1)
    const curLat1 = convertToRadian(lat1)
    const curLat2 = convertToRadian(lat2)
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(curLat1) * Math.cos(curLat2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // The list refreshes every 2 minutes only while this screen is in view: the interval was
  // re-armed by every list change, also behind the business or the checkout.
  const isFocusedRef = useRef(false)
  const resetInactivityTimeout = () => {
    clearInterval(timerId.current)
    if (!logosLayout && isFocusedRef.current) {
      timerId.current = setInterval(() => {
        getBusinesses && getBusinesses(true)
      }, 120000)
    }
  }

  useEffect(() => {
    resetInactivityTimeout()
  }, [businessesList?.loading, businessesList?.businesses])

  const handleOnRefresh = () => {
    if (!businessesList?.loading) {
      getBusinesses && getBusinesses(true);
    }
  }

  const checkUserLocation = async () => {
    Geolocation.getCurrentPosition((pos) => {
      const crd = pos.coords
      const distance = getDistance(crd.latitude, crd.longitude, orderState?.options?.address?.location?.lat, orderState?.options?.address?.location?.lng)
      if (distance > 20) setIsFarAway(true)
      else setIsFarAway(false)
    }, (err) => {
      console.log(`ERROR(${err.code}): ${err.message}`)
    }, {
      enableHighAccuracy: true, timeout: 15000, maximumAge: 10000
    })
  }

  // Plain values: the order context hands a new object on every render.
  const addressLat = orderState?.options?.address?.location?.lat
  const addressLng = orderState?.options?.address?.location?.lng
  useEffect(() => {
    if (!logosLayout) {
      checkUserLocation()
    }
  }, [addressLat, addressLng])

  useEffect(() => {
    if (!orderState?.loading) {
      setOrderTypeValue(orderState?.options?.type)
    }
  }, [orderState?.options?.type])

  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true
      resetInactivityTimeout()
      return () => {
        isFocusedRef.current = false
        clearInterval(timerId.current)
      }
    }, [navigation])
  )

  useEffect(() => {
    if (!businessesList?.businesses?.length) return
    const ids = [...favoriteIds]
    businessesList.businesses.forEach((business: any) => {
      if (business?.favorite) {
        ids.push(business?.id)
      }
    })
    const next = [...new Set(ids)]
    // A new array re-renders every card: only when the ids change.
    if (next.length !== favoriteIds.length || next.some((id, i) => id !== favoriteIds[i])) {
      setFavoriteIds(next)
    }
  }, [businessesList?.businesses?.length])

  useEffect(() => {
    if (!citiesState?.cities?.length || !orderState?.options?.city_id) return
    const selectedCity = citiesState?.cities?.find((city: any) => city?.id === orderState?.options?.city_id)
    if (!selectedCity || !selectedCity?.enabled) changeCityFilter(null)
  }, [citiesState, orderState?.options?.city_id])

  // The city filter is for pickup without an address: with one (or another order type)
  // the saved city would still filter the list, so it goes. `changeCityFilter(null)` leaves
  // `city_id` null, which ends this condition: it cannot run again.
  const hasCityToClear = !!orderState?.options?.city_id &&
    (!!orderState?.options?.address_id || orderState?.options?.type !== PICKUP_ORDER_TYPE)
  useEffect(() => {
    if (orderState?.loading || !hasCityToClear) return
    changeCityFilter(null)
  }, [orderState?.loading, hasCityToClear])

  return (
    <FlatListBusinessListing
      {...props}
      navigation={navigation}
      businessesList={businessesList}
      orderTypeValue={orderTypeValue}
      allCitiesDisabled={allCitiesDisabled}
      isUnaddressedListing={isUnaddressedListing}
      favoriteIds={favoriteIds}
      isFarAway={isFarAway}
      handleScroll={handleScroll}
      setFavoriteIds={setFavoriteIds}
      handleOnRefresh={handleOnRefresh}
    />
  );
};

export const BusinessesListing = (props: BusinessesListingParams) => {

  const BusinessesListingProps = {
    ...props,
    isForceSearch: Platform.OS === 'ios',
    UIComponent: BusinessesListingUI,
    paginationSettings: {
      initialPage: 1,
      pageSize: 50,
      controlType: 'infinity'
    }
  };

  return <BusinessesListingController {...BusinessesListingProps} />;
};
