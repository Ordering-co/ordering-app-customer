import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from 'styled-components/native';
import Geolocation from '@react-native-community/geolocation'
import FastImage from 'react-native-fast-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { AddressAlertPopover } from './AddressAlertPopover'

import { useConfig, useLanguage, useOrder, useSession, useUtils } from '@components';
import OButton from '../../../shared/OButton'
import OText from '../../../shared/OText'
import Icon from '../../../shared/Icon'
import { BackButton } from '../../../shared/styles';
import { OrderContextPill } from '../../../shared/OrderContextPill';
import { SearchBar } from '../../../SearchBar';
import { nativeBoxStyle, nativeTextStyle, themeColor, themeControlHeight, themeGutter, themeImage, themeMotion, themeOpacity, themeSpace, themeVisible, themeHeaderTitleAlign, themePart } from '@/theme/helpers';
import {
  AddressInput,
  AddressInputContainer,
  OrderControlContainer,
  Search,
  CartIconWrapper,
  CartBadge
} from './styles';

import { getTypesLabel } from '../../../../utils';
import { Animated, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { goHome, plainParams } from '@/navigators/appNavigation'
import { isGoogleMapsAvailable } from '@/utils/nativeKeys'

/**
 * The head of the listing, the search and other screens (`components.header`):
 * back, title or address, the cart (its `cart` slot and a count badge) and the
 * order options (order type and moment take the `moment` slot's input look,
 * the map its `map` slot), each hideable (`order_context.*`, `header.cart`).
 */
export const HeaderContent = (props: any) => {
  const {
    navigation,
    isCart,
    title,
    showAwayAddressPopover,
    hideOrderControl,
    onGoBack,
    onHandleCart,
    isGuestUser,
    hideAddress,
    orderTypeValue,
    showBusinessSearchMap,
    businessId,
    collapseControls,
    fillable,
    coversInset,
    hideOrderType,
    showLogo,
    showSearch,
    centerTitle,
    flush
  } = props;

  const theme: any = useTheme();
  const header = theme.native.components.header
  const headerBadge = useMemo(() => themeImage(theme, 'header_badge'), [theme])
  const cartImage = useMemo(() => themeImage(theme, 'icons.cart'), [theme])
  const styles = useMemo(() => {
    const input = theme.native.components.input
    const badge = theme.native.components.badge
    const slop = themeSpace(theme, 'sm')
    const logoSides = { left: 'flex-start', center: 'center', right: 'flex-end' } as const
    return {
      slop: { top: slop, bottom: slop, left: slop, right: slop },
      ...StyleSheet.create({
        band: {
          zIndex: 1,
          marginBottom: themeSpace(theme, 'sm'),
          backgroundColor: header.base.background,
          ...header.base.border_bottom,
          ...nativeBoxStyle({ shadow: header.base.shadow })
        },
        sheetBand: { zIndex: 1, backgroundColor: header.base.background, paddingBottom: header.base.sheet_radius },
        sheetCap: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: header.base.sheet_radius,
          borderTopLeftRadius: header.base.sheet_radius,
          borderTopRightRadius: header.base.sheet_radius,
          backgroundColor: themeColor(theme, 'background')
        },
        logoRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: headerBadge ? 'space-between' : logoSides[header.base.logo_position as 'left' | 'center' | 'right'],
          minHeight: header.base.height,
          gap: themeSpace(theme, 'sm'),
          paddingHorizontal: themeGutter(theme)
        },
        logo: { flexShrink: 1, width: header.base.logo_width, height: header.base.logo_height },
        headerBadge: { width: themeControlHeight(theme, 'md'), height: themeControlHeight(theme, 'md') },
        cartImage: { width: header.base.cart_icon_size, height: header.base.cart_icon_size },
        searchRow: {
          paddingTop: themeSpace(theme, 'xs'),
          paddingBottom: themeSpace(theme, 'sm'),
          paddingHorizontal: themeGutter(theme)
        },
        title: { ...nativeTextStyle(header.base.title), color: header.base.color, flex: 1, textAlign: themeHeaderTitleAlign(theme, centerTitle) },
        // The address (`address_text`) and the order options (`context_text`, `OrderContextPill`) are two texts.
        address: { ...nativeTextStyle(header.base.address_text), color: header.base.color },
        count: { ...nativeTextStyle(badge.base.text), color: badge.variants.primary.color }
      }),
      pressedOpacity: themeOpacity(theme, 'pressed'),
      cartIconSize: header.base.cart_icon_size,
      iconColor: input.base.icon_color,
      iconSize: input.base.icon_size
    }
  }, [theme, header, headerBadge, centerTitle])
  const [{ auth }] = useSession()
  const [, t] = useLanguage();
  const [orderState] = useOrder();
  const [{ configs }] = useConfig();
  const [{ parseDate, timeFormat, preorderDateFormat, getMaxPreorderDays }] = useUtils();

  const [isFarAway, setIsFarAway] = useState(false)
  const [openFarAwayPopover, setOpenFarAwayPopover] = useState(false)
  const [controlsHeight, setControlsHeight] = useState(0)
  const collapseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.timing(collapseAnim, {
      toValue: collapseControls ? 0 : 1,
      duration: themeMotion(theme, 'base').duration,
      useNativeDriver: false
    }).start()
  }, [collapseControls])

  const totalCartItems = businessId != null
    ? (orderState?.carts?.[`businessId:${businessId}`]?.products?.reduce((s: number, p: any) => s + (p?.quantity || 0), 0) || 0)
    : (Object.values(orderState?.carts || {}) as any[]).reduce(
        (sum, cart) => sum + (cart?.products?.reduce((s: number, p: any) => s + (p?.quantity || 0), 0) || 0),
        0
      )

  const configTypes = configs?.order_types_allowed?.value.split('|').map((value: any) => Number(value)) || [];
  const maxPreorderDays = getMaxPreorderDays(orderState.options?.type)
  const isPreorderEnabled = (configs?.preorder_status_enabled?.value === '1' || configs?.preorder_status_enabled?.value === 'true') &&
    maxPreorderDays > 0

  const handleMomentClick = () => {
    if (isPreorderEnabled) {
      navigation.navigate('MomentOption')
    }
  }

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

  const checkUserLocation = async () => {
    if (hideAddress || !orderState?.options?.address?.location?.lat || !orderState?.options?.address?.location?.lng) return
    Geolocation.getCurrentPosition((pos) => {
      const crd = pos.coords
      const distance = getDistance(crd.latitude, crd.longitude, orderState?.options?.address?.location?.lat, orderState?.options?.address?.location?.lng)
      const isFarAway = distance > 20;
      setIsFarAway(isFarAway);
      setOpenFarAwayPopover(isFarAway && showAwayAddressPopover);
    }, (err) => {
      console.log(`ERROR(${err.code}): ${err.message}`)
    }, {
      enableHighAccuracy: true, timeout: 15000, maximumAge: 10000
    })
  }

  useEffect(() => {
    checkUserLocation()
  }, [hideAddress, JSON.stringify(orderState?.options?.address?.location)])

  const goToAddress = () =>
    auth
      ? navigation.navigate('AddressList', { isFromBusinesses: true })
      : navigation.navigate('AddressForm', {
        address: plainParams(orderState.options?.address),
        isFromBusinesses: true,
        isGuestUser: isGuestUser
      })

  // `visibility.order_context.address` hides the address; `header.far_away` its far-away warning.
  const showAddress = !hideAddress && themeVisible(theme, 'order_context.address')
  const showFarAway = themeVisible(theme, 'header.far_away')
  // The address pin: the ink of the header's `address` slot (a button's color and appearance).
  const addressSlot = header.slots.address
  const pinColor = themePart(theme, 'button', `variants.${addressSlot.color ?? 'primary'}.${addressSlot.appearance ?? 'ghost'}.color`)
  const showOrderType = !hideOrderType && themeVisible(theme, 'order_context.order_type')
  const showMoment = isPreorderEnabled && themeVisible(theme, 'order_context.moment')
  // The map of businesses needs a Google Maps key (src/utils/nativeKeys.ts).
  const showMap = showBusinessSearchMap && isGoogleMapsAvailable() && themeVisible(theme, 'order_context.map')
  const showCart = !isCart && !!onHandleCart && themeVisible(theme, 'header.cart')
  const showCartCount = totalCartItems > 0 && themeVisible(theme, 'header.cart_count')
  const showBar = !showLogo || !!onGoBack || !!title || showAddress || showCart
  const fill = !!fillable && themePart(theme, 'header', 'base.fill_listing')
  const insets = useSafeAreaInsets()

  const contextOnPage = fill && !!isCart && themePart(theme, 'cart', 'base.context_position') === 'page'
  const sheet = fill && !onGoBack && !title && !isCart && header.base.sheet_radius > 0

  const bar = (
    <>
      {showLogo && (
        <View testID='header-logo-row' style={styles.logoRow}>
          <FastImage style={styles.logo} source={themeImage(theme, 'logotype')} objectFit='contain' />
          {!!headerBadge && (
            <FastImage testID='header-badge' style={styles.headerBadge} source={headerBadge} objectFit='contain' />
          )}
        </View>
      )}
      {showBar && (
        <Search>
          {onGoBack && (
            <BackButton onPress={() => onGoBack()} accessibilityLabel={t('GO_BACK', 'Go back')} />
          )}
          {title && (
            <OText style={styles.title} numberOfLines={1} ellipsizeMode={'tail'}>
              {title}
            </OText>
          )}
          {showAddress && (
            <AddressInput>
              <AddressInputContainer>
                <TouchableOpacity activeOpacity={styles.pressedOpacity} hitSlop={styles.slop} onPress={() => setOpenFarAwayPopover(!openFarAwayPopover)}>
                  <Icon name='location-sharp' color={pinColor} />
                </TouchableOpacity>
                <Pressable style={{ flexShrink: 1 }} onPress={goToAddress}>
                  <OText style={styles.address} numberOfLines={1} ellipsizeMode={'tail'}>
                    {orderState?.options?.address?.address || t('WHAT_IS_YOUR_ADDRESS', 'What\'s your address?')}
                  </OText>
                </Pressable>
                <Pressable hitSlop={styles.slop} onPress={goToAddress}>
                  <Icon name='chevron-down' size={styles.iconSize} color={styles.iconColor} />
                </Pressable>
              </AddressInputContainer>
            </AddressInput>
          )}
          {showCart && (
            <CartIconWrapper>
              <OButton
                iconOnly
                color={header.slots.cart.color}
                appearance={header.slots.cart.appearance}
                size={header.slots.cart.size}
                icon={cartImage
                ? <FastImage testID='header-cart-image' style={styles.cartImage} source={cartImage} objectFit='contain' />
                : <Icon name='basket' size={styles.cartIconSize} color={totalCartItems > 0 ? 'primary' : 'text'} />}
                onClick={() => onHandleCart()}
                accessibilityLabel={t('CART', 'Cart')}
              />
              {showCartCount && (
                <CartBadge pointerEvents='none'>
                  <OText style={styles.count}>
                    {totalCartItems > 99 ? '99+' : totalCartItems}
                  </OText>
                </CartBadge>
              )}
            </CartIconWrapper>
          )}
        </Search>
      )}
      {showSearch && (
        <Pressable
          testID='header-search'
          style={styles.searchRow}
          onPress={() => goHome(navigation, { screen: 'BusinessSearch' })}
          accessibilityRole='search'
          accessibilityLabel={t('SEARCH_BUSINESSES', 'Search Businesses')}
        >
          <View pointerEvents='none'>
            <SearchBar placeholder={t('SEARCH_BUSINESSES', 'Search Businesses')} onSearch={() => {}} />
          </View>
        </Pressable>
      )}
      {openFarAwayPopover && showFarAway && (
        <AddressAlertPopover
          isVisible={isFarAway && showAddress}
          open={openFarAwayPopover}
          setOpen={setOpenFarAwayPopover}
          text={t('AWAY_FROM_ADDRESS', 'Is this the right address? It seems like you\'re a bit far away.')}
        />
      )}
    </>
  )

  const controls = (
    <>
      {!hideOrderControl && (showOrderType || showMoment || showMap) && (
        <Animated.View
          style={{
            opacity: collapseAnim,
            overflow: 'hidden',
            height: controlsHeight
              ? collapseAnim.interpolate({ inputRange: [0, 1], outputRange: [0, controlsHeight] })
              : undefined
          }}
        >
          <View
            onLayout={(event) => {
              const measured = Math.round(event.nativeEvent.layout.height)
              // Only capture the natural (expanded) height and never shrink it:
              // mid-collapse the overflow-hidden parent clamps this child, and a
              // clamped measurement would otherwise lock in a too-small height,
              // leaving the row permanently clipped / its pills misaligned.
              if (measured && !collapseControls && measured > controlsHeight) setControlsHeight(measured)
            }}
          >
            <OrderControlContainer>
              {showOrderType && (
                <OrderContextPill
                  text={getTypesLabel(orderTypeValue || orderState?.options?.type || 1, t)}
                  onPress={() => navigation.navigate('OrderTypes', { configTypes: configTypes })}
                />
              )}
              {showMoment && (
                <OrderContextPill
                  text={orderState.options?.moment
                    ? parseDate(orderState.options?.moment, { outputFormat: `${preorderDateFormat} ${timeFormat}` })
                    : t('ASAP_ABBREVIATION', 'ASAP')}
                  numberOfLines={orderState.options?.moment ? 2 : 1}
                  onPress={() => handleMomentClick()}
                />
              )}
              {showMap && (
                <OButton
                  iconOnly
                  color={header.slots.map.color}
                  appearance={header.slots.map.appearance}
                  size={header.slots.map.size}
                  icon={<Icon name='map-outline' />}
                  onClick={() => navigation.navigate('BusinessSearchMap')}
                  accessibilityLabel={t('MAP', 'Map')}
                />
              )}
            </OrderControlContainer>
          </View>
        </Animated.View>
      )}
    </>
  );

  if (!fill) return <>{bar}{controls}</>

  return (
    <>
      <View testID='header-band' style={[sheet ? styles.sheetBand : styles.band, !!coversInset && { paddingTop: insets.top }, !!flush && { marginBottom: 0 }]}>
        {bar}
        {!contextOnPage && controls}
        {sheet && <View testID='header-sheet' pointerEvents='none' style={styles.sheetCap} />}
      </View>
      {contextOnPage && controls}
    </>
  )
};
