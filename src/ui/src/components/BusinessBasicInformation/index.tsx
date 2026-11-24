import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StyleSheet, View, Image, Dimensions } from 'react-native';
import { useTheme } from 'styled-components/native';
import { Fade, Placeholder, PlaceholderLine } from '@/ui/src/components/shared/Skeleton';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(timezone);
dayjs.extend(isBetween);

import { closedStatusLabel } from '@/utils/businessTime';
import { BusinessBasicInformationParams } from '../../types';
import { SocialIcons } from './SocialIcons';
import { BusinessHeaderPlaceholder } from '../BusinessHeaderPlaceholder';
import { Ribbon } from '../SingleProductCard/Ribbon';
import Icon from '../shared/Icon';
import OButton from '../shared/OButton';
import { BusinessLogo } from '../shared/BusinessLogo';
import { OrderTypeSwitch } from '../shared/OrderTypeSwitch';
import { BusinessDetailsBox } from './BusinessDetailsBox';
import { nativeShadowStyle, nativeTextStyle, themeColor, themeImage, themePart, themeRadius, themeSpace, themeVisible } from '@/theme/helpers';

import {
  BusinessContainer,
  BusinessHeader,
  BusinessInfo,
  BusinessInfoItem,
  TitleWrapper,
  BusinessInfoHeader,
  BusinessInfoActions,
  ActionsRow,
} from './styles';

import { useUtils, useOrder, useLanguage } from '@components';
import { BusinessReservation, OText, OModal } from '@ui'
import { preorderParams } from '@/navigators/appNavigation'
import { imageUrl } from '@/utils/imageUrl'

let BusinessInformation: null | React.ElementType = null
let BusinessReviews: null | React.ElementType = null

export const BusinessBasicInformation = (
  props: BusinessBasicInformationParams,
) => {
  const { navigation, businessState, isBusinessInfoShow, logo, isPreOrder, currentCart, categoryState } = props;
  const headerParam = props.header;
  const { business, loading } = businessState;
  const types = business?.types && business?.types?.filter(({ enabled }: any) => (enabled)).map(({ name }: any) => (name))

  const theme: any = useTheme();
  const [orderState] = useOrder();
  const [, t] = useLanguage();
  const [{ optimizeImage, is12Hours }] = useUtils();
  const closedStatus = business?.open === false ? closedStatusLabel(business, t, { is12Hours }) : null;
  const [openBusinessInformation, setOpenBusinessInformation] = useState(false);
  const [openBusinessReviews, setOpenBusinessReviews] = useState(false);
  const [businessInformationObtained, setBusinessInformationObtained] = useState(false)
  const [businessReviewsObtained, setBusinessReviewsObtainedbtained] = useState(false)
  const [openReservations, setOpenReservations] = useState(false)
  const [imageRealSize, setImageRealSize] = useState({ width: 16, height: 9, loading: true })
  const showLogo = themeVisible(theme, 'business.header.logo')
  const showAddress = themeVisible(theme, 'business.header.address')
  const showTypes = themeVisible(theme, 'business.header.description')
  const showRibbon = themeVisible(theme, 'business.header.ribbon')
  const showReviews = themeVisible(theme, 'business.header.reviews')
  const showInfo = themeVisible(theme, 'business.header.info')
  const showFee = themeVisible(theme, 'business.header.fee')
  const showTime = themeVisible(theme, 'business.header.time')
  const showSocial = themeVisible(theme, 'business.header.social')
  const showPreorder = themeVisible(theme, 'business.header.preorder')
  const showDistance = themeVisible(theme, 'business.header.distance')
  const showCover = themeVisible(theme, 'business.header.cover')
  const showName = themeVisible(theme, 'business.header.name')
  const showOrderTypeSwitch = themeVisible(theme, 'business.order_type_switch')

  // `components.business_header` (cover, logo, texts, the `action` slot) and the stats card (`components.card`).
  const header = themePart(theme, 'business_header', 'base')
  const action = themePart(theme, 'business_header', 'slots.action')
  const actionInk = themePart(theme, 'button', `variants.${action.color}.${action.appearance}.color`)
  const primaryInk = themePart(theme, 'button', `variants.primary.${action.appearance}.color`)
  const styles = useMemo(() => {
    const skeleton = { borderRadius: themePart(theme, 'skeleton', 'base.radius') }
    return StyleSheet.create({
      // The logo's box while it loads (the skeleton): a background under its shadow, as `BusinessLogo`.
      logo: {
        width: header.logo_size,
        height: header.logo_size,
        borderRadius: themeRadius(theme, 'lg'),
        backgroundColor: themeColor(theme, 'background'),
        ...nativeShadowStyle(header.logo_shadow)
      },
      name: { ...nativeTextStyle(header.name), color: header.name_color },
      address: { ...nativeTextStyle(header.address), color: header.address_color },
      description: { ...nativeTextStyle(header.description), color: header.description_color },
      ribbon: { alignSelf: 'flex-start', marginBottom: themeSpace(theme, 'xs') },
      coverFlat: { marginHorizontal: 0, marginTop: 0, borderRadius: 0 },
      skeleton,
      skeletonFlat: { ...skeleton, marginBottom: 0 },
      skeletonLine: { ...skeleton, marginBottom: themeSpace(theme, 'xs') },
      skeletonChip: { ...skeleton, marginRight: themeSpace(theme, 'sm'), marginBottom: 0 },
      skeletonCard: { ...skeleton, marginBottom: 0, flex: 1 },
      skeletonGap: { marginRight: themeSpace(theme, 'sm') },
      orderTypeSwitch: { alignSelf: 'stretch', marginTop: themeSpace(theme, 'md') },
    });
  }, [theme, header]);
  const showStats = showFee || showTime || showDistance

  const showReservationCta = !loading &&
    orderState?.options?.type === 9 &&
    categoryState?.products?.length !== 0

  const hasAutoOpenedReservation = useRef(false)

  useEffect(() => {
    if (hasAutoOpenedReservation.current || !showReservationCta) return
    hasAutoOpenedReservation.current = true
    setOpenReservations(true)
  }, [showReservationCta])

  const handleClickBusinessInformation = () => {
    if (!businessInformationObtained) {
      BusinessInformation = require('../BusinessInformation').BusinessInformation
      setBusinessInformationObtained(true)
    }
    setOpenBusinessInformation(true)
  }

  const handleClickBusinessReviews = () => {
    if (!businessReviewsObtained) {
      BusinessReviews = require('../BusinessReviews').BusinessReviews
      setBusinessReviewsObtainedbtained(true)
    }
    setOpenBusinessReviews(true)
  }

  const getBusinessType = () => {
    if (!types) return t('GENERAL', 'General');
    const _types: any = [];
    types.forEach(
      (type: any) =>
        _types.push(type)
    );
    return _types.join(', ');
  };

  useEffect(() => {
    if (businessState?.loading) return
    let timeout: any = null
    const currentDate = dayjs().tz(businessState?.business?.timezone)
    let lapse = null
    if (businessState?.business?.today?.enabled) {
      lapse = businessState?.business?.today?.lapses?.find((lapse: any) => {
        const from = currentDate.hour(lapse.open.hour).minute(lapse.open.minute)
        const to = currentDate.hour(lapse.close.hour).minute(lapse.close.minute)
        return currentDate.unix() >= from.unix() && currentDate.unix() <= to.unix()
      })
    }
    if (lapse) {
      const to = currentDate.hour(lapse.close.hour).minute(lapse.close.minute)
      const timeToClose = (to.unix() - currentDate.unix()) * 1000
      timeout = setTimeout(() => {
        navigation.navigate('MomentOption', preorderParams(businessState?.business, 'back'))
      }, timeToClose)
    }
    return () => {
      timeout && clearTimeout(timeout)
    }
  }, [businessState?.business])

  useEffect(() => {
    const bannerImage = headerParam || businessState?.business?.header
    if (!bannerImage) {
      setImageRealSize({ width: 16, height: 9, loading: false })
      return
    }
    Image.getSize(bannerImage, (width: number, height: number) => {
      setImageRealSize({ width: width, height: height, loading: false });
    }, (error: any) => {
      setImageRealSize({ ...imageRealSize, loading: false });
    });
  }, [headerParam, businessState?.business?.header])

  const coverHeight = header.cover_height
  const coverFlat = header.cover_full_width === true
  const coverStyle = coverFlat ? styles.coverFlat : undefined
  const hasActions = !header.collapse_empty_actions || loading ||
    (showReviews && business?.reviews?.total > 0) ||
    showInfo ||
    (showPreorder && isPreOrder && (!business?.professionals || business?.professionals?.length === 0)) ||
    showReservationCta
  const showIdentity = loading || showLogo || showName || showRibbon || showAddress || showTypes || !!closedStatus
  const headerImage = businessState?.business?.header || headerParam
  const placeholderCover = themeImage(theme, 'placeholder.business_header')

  return (
    <BusinessContainer>
      {!showCover ? null : !(loading || imageRealSize?.loading) ? (
        headerImage ? (
          <BusinessHeader
            style={coverStyle}
            imageStyle={coverStyle}
            source={{ uri: imageUrl(businessState?.business?.header, { width: Dimensions.get('window').width, height: coverHeight }) || headerParam }}
          />
        ) : placeholderCover ? (
          <BusinessHeader style={coverStyle} imageStyle={coverStyle} source={placeholderCover} />
        ) : (
          <BusinessHeaderPlaceholder
            logo={logo || businessState?.business?.logo}
            name={businessState?.business?.name}
            height={coverHeight}
            borderRadius={0}
            optimizeImage={optimizeImage}
          />
        )
      ) : (
        <Placeholder Animation={Fade}>
          <PlaceholderLine height={coverHeight} style={styles.skeletonFlat} />
        </Placeholder>
      )}
      <BusinessInfo>
        {showSocial && <SocialIcons loading={loading} business={business} />}

        {showIdentity && (
          <BusinessInfoHeader>
            {showLogo && !isBusinessInfoShow && (
              <>
                {!loading && (
                  <BusinessLogo
                    uri={logo || imageUrl(businessState?.business?.logo, { height: header.logo_size })}
                    size={header.logo_size}
                    radius={themeRadius(theme, 'lg')}
                    background={themeColor(theme, 'background')}
                    shadow={header.logo_shadow}
                    objectFit='contain'
                    priority='high'
                  />
                )}
                {loading && (
                  <View style={styles.logo}>
                    <Placeholder Animation={Fade}>
                      <PlaceholderLine height={header.logo_size} style={styles.skeleton} />
                    </Placeholder>
                  </View>
                )}
              </>
            )}
            <BusinessInfoItem>
              {!loading && (
                <TitleWrapper>
                  {showName && (
                    <OText style={styles.name} numberOfLines={2} ellipsizeMode='tail'>
                      {business?.name}
                    </OText>
                  )}
                  {closedStatus && (
                    <OText preset='body_sm' color='danger_text' numberOfLines={1} ellipsizeMode='tail'>
                      {closedStatus}
                    </OText>
                  )}
                  {showRibbon && <Ribbon ribbon={business?.ribbon} style={styles.ribbon} />}
                  {showAddress && (
                    <OText style={styles.address} numberOfLines={1} ellipsizeMode='tail'>
                      {business?.address}
                    </OText>
                  )}
                  {showTypes && (
                    <OText style={styles.description} numberOfLines={1} ellipsizeMode='tail'>
                      {getBusinessType()}
                    </OText>
                  )}
                </TitleWrapper>
              )}
              {loading && (
                <Placeholder Animation={Fade}>
                  <PlaceholderLine height={themeSpace(theme, 'lg')} width={80} style={styles.skeletonLine} />
                  <PlaceholderLine height={themeSpace(theme, 'lg')} width={60} style={styles.skeletonLine} />
                  <PlaceholderLine height={themeSpace(theme, 'lg')} width={78} style={styles.skeletonFlat} />
                </Placeholder>
              )}
            </BusinessInfoItem>
          </BusinessInfoHeader>
        )}

        {hasActions && <BusinessInfoActions>
          {!loading && (
            <ActionsRow>
              {showReviews && business?.reviews?.total > 0 && (
                <OButton
                  color={action.color}
                  appearance={action.appearance}
                  size={action.size}
                  icon={<Icon name='star' size={theme.native.components.rating.sizes.sm.icon_size} color={theme.native.components.rating.base.color} />}
                  text={business?.reviews?.total}
                  onClick={() => handleClickBusinessReviews()}
                />
              )}

              {showInfo && (
                <OButton
                  color={action.color}
                  appearance={action.appearance}
                  size={action.size}
                  icon={<Icon name='information-circle-outline' color={actionInk} />}
                  text={t('INFO', 'Info')}
                  onClick={() => handleClickBusinessInformation()}
                />
              )}

              {showPreorder && isPreOrder && (!business?.professionals || business?.professionals?.length === 0) && (
                <OButton
                  color={action.color}
                  appearance={action.appearance}
                  size={action.size}
                  text={t('PREORDER', 'Preorder')}
                  onClick={() => navigation.navigate('MomentOption', preorderParams(businessState?.business, 'back'))}
                />
              )}

              {showReservationCta && (
                <OButton
                  color='primary'
                  appearance={action.appearance}
                  size={action.size}
                  icon={<Icon name='time-outline' color={primaryInk} />}
                  text={t('RESERVATION', 'Reservation')}
                  onClick={() => setOpenReservations(true)}
                />
              )}
            </ActionsRow>
          )}

          {loading && (
            <Placeholder Animation={Fade}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <PlaceholderLine height={themeSpace(theme, 'lg')} width={40} style={styles.skeletonChip} />
                <PlaceholderLine height={themeSpace(theme, 'lg')} width={40} style={styles.skeletonChip} />
                <PlaceholderLine height={themeSpace(theme, 'lg')} width={13} style={styles.skeletonFlat} />
              </View>
            </Placeholder>
          )}
        </BusinessInfoActions>}

        {loading && showStats && (
          <Placeholder Animation={Fade}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <PlaceholderLine height={70} style={[styles.skeletonCard, styles.skeletonGap]} />
              <PlaceholderLine height={70} style={styles.skeletonCard} />
            </View>
          </Placeholder>
        )}

        {!loading && <BusinessDetailsBox business={business} />}

        {!loading && showOrderTypeSwitch && (
          <View style={styles.orderTypeSwitch}>
            <OrderTypeSwitch />
          </View>
        )}

      </BusinessInfo>

      {businessReviewsObtained ? (
        <OModal
          title={t('REVIEWS', 'Reviews')}
          open={openBusinessReviews}
          onClose={() => setOpenBusinessReviews(false)}
        >
          {BusinessReviews && (
            <BusinessReviews
              businessState={businessState}
              businessId={business.id}
              reviews={business.reviews?.reviews}
            />
          )}
        </OModal>
      ) : null}

      {businessInformationObtained ? (
        <OModal
          title={businessState?.business?.name}
          subtitle={getBusinessType()}
          open={openBusinessInformation}
          onClose={() => setOpenBusinessInformation(false)}
        >
          {BusinessInformation && (
            <BusinessInformation
              businessState={businessState}
              business={business}
            />
          )}
        </OModal>
      ) : null}

      <OModal
        title={business?.name}
        open={openReservations}
        onClose={() => setOpenReservations(false)}
        showToastInsideModal
      >
        <BusinessReservation
          cart={currentCart}
          business={business}
          scheduleList={business?.schedule}
          navigation={navigation}
          setOpenReservations={setOpenReservations}
        />
      </OModal>
    </BusinessContainer>
  );
};
