import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import moment from 'moment';
import { useTheme } from 'styled-components/native';
import { WebView } from 'react-native-webview';

import { BusinessInformationParams } from '../../types';
import { formatUrlVideo } from '../../utils'
import { ScheduleTable } from './ScheduleTable';

import {
  BusinessInformationContainer,
  WrapMainContent,
  WrapBusinessMap,
  InnerContent,
  DivideView,
  MediaWrapper,
} from './styles';
import Icon from '../shared/Icon';
import { themeRadius, themeSpace, themeVisible } from '@/theme/helpers';

import { BusinessInformation as BusinessInformationController, useLanguage, useUtils, useConfig } from '@components';
import { DeviceOrientationMethods, GoogleMap, OIcon, OText } from '@ui'
import { imageUrl } from '@/utils/imageUrl'
import { isGoogleMapsAvailable } from '@/utils/nativeKeys'

const { useDeviceOrientation } = DeviceOrientationMethods

const BUSINESS_LOCATION_ZOOM_DELTA = 0.00042
const BUSINESS_LOCATION_ZONE_FIT_PADDING = 0
const BUSINESS_LOCATION_MAX_ZONE_ZOOM = 20

const BusinessInformationUI = (props: BusinessInformationParams) => {
  const { businessState, businessSchedule, businessLocation } = props;

  const theme: any = useTheme();
  const [, t] = useLanguage();
  const [{ timeFormat }] = useUtils();
  const [{ configs }] = useConfig()
  const [orientationState] = useDeviceOrientation();

  const [isReadMore, setIsReadMore] = useState(false)
  const [lengthMore, setLengthMore] = useState(false)
  const WIDTH_SCREEN = orientationState?.dimensions?.width
  const useAlternativeMap = configs?.use_alternative_to_google_maps?.value === '1'
  // The native map needs the app's Google Maps key (src/utils/nativeKeys.ts).
  const showMap = !useAlternativeMap && isGoogleMapsAvailable()

  const showLocation = themeVisible(theme, 'business.information.location')
  const showAddress = themeVisible(theme, 'business.information.address')
  const showNotes = themeVisible(theme, 'business.information.description')
  const showSchedule = themeVisible(theme, 'business.information.schedule')
  const showImages = themeVisible(theme, 'business.information.images')
  const showVideos = themeVisible(theme, 'business.information.videos')
  const styles = useMemo(() => StyleSheet.create({
    content: { paddingBottom: themeSpace(theme, 'xxxl') },
    address: { marginTop: themeSpace(theme, 'lg'), flexDirection: 'row', alignItems: 'center', gap: themeSpace(theme, 'sm') },
    media: { gap: themeSpace(theme, 'lg') },
    photo: { borderRadius: themeRadius(theme, 'md'), overflow: 'hidden' },
    video: { width: 210, height: 127, borderRadius: themeRadius(theme, 'xl') },
  }), [theme])
  const formatTime = timeFormat

  const checkTime = (val: number) => (val < 10 ? `0${val}` : val);
  const timeFormated = (time: any) => {
    return moment(`1900-01-01 ${checkTime(time.hour)}:${checkTime(time.minute)}`).format(formatTime)
  }

  const businessCoordinate = {
    lat: businessState?.business?.location?.lat,
    lng: businessState?.business?.location?.lng,
  };
  const businessImage = {
    uri: businessState?.business?.logo,
  };
  const businessMarker = {
    latlng: businessCoordinate,
    image: businessImage,
  };

  const bVideos = () => {
    const len = businessState?.business?.gallery?.length | 0;
    if (len == 0) return [];
    const vAry = businessState?.business?.gallery.filter(
      ({ type, file }: any) => type == 2 && file == null,
    );
    return vAry;
  };
  //{uri: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4?_=1'}
  const bImages: any = () => {
    const len = businessState?.business?.gallery?.length | 0;
    if (len == 0) return [];
    const iAry = businessState?.business?.gallery.filter(
      ({ type, video }: any) => type == 1 && video == null,
    );
    return iAry;
  };

  const onTextLayout = useCallback((e: any) => {
    setLengthMore((e.nativeEvent.lines.length == 3 && e.nativeEvent.lines[2].width > WIDTH_SCREEN * .76) || e.nativeEvent.lines.length > 3)
  }, [])

  return (
    <BusinessInformationContainer>
      <WrapMainContent showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <InnerContent>
          {showLocation && (
            <>
              {showAddress && (
                <View style={styles.address}>
                  <Icon name='location-outline' color='primary' />
                  <OText>
                    {businessState?.business?.address}
                  </OText>
                </View>
              )}
              {showMap && businessLocation.location && (
                <WrapBusinessMap>
                  <GoogleMap
                    readOnly
                    location={businessLocation.location}
                    delta={BUSINESS_LOCATION_ZOOM_DELTA}
                    zoneFitPadding={BUSINESS_LOCATION_ZONE_FIT_PADDING}
                    maxZoomAfterZoneFit={BUSINESS_LOCATION_MAX_ZONE_ZOOM}
                    markerTitle={businessState?.business?.name}
                    businessZones={businessState?.business?.zones}
                  />
                </WrapBusinessMap>
              )}
            </>
          )}
          {showNotes && !!businessState?.business?.address_notes && (
            <>
              <OText
                preset='body_sm'
                mBottom='sm'
                numberOfLines={isReadMore ? 20 : 3}
                onTextLayout={onTextLayout}
              >
                {businessState?.business?.address_notes}
              </OText>
              {lengthMore && (
                <Pressable
                  hitSlop={themeSpace(theme, 'md')}
                  onPress={() => setIsReadMore(!isReadMore)}
                >
                  <OText preset='body_sm' mBottom='lg' color='primary'>{isReadMore ? t('SHOW_LESS', 'Show less') : t('READ_MORE', 'Read more')}</OText>
                </Pressable>
              )}
            </>
          )}

          <DivideView />

          {showSchedule && businessSchedule && businessSchedule?.length > 0 && (
            <ScheduleTable schedule={businessSchedule} />
          )}

          {showImages && bImages().length > 0 && (
            <>
              <DivideView />
              <OText preset='body_lg' weight={700}>{t('PHOTOS', 'Photos')}</OText>
              <MediaWrapper horizontal contentContainerStyle={styles.media}>
                {bImages().map((i: any) => (
                  i.file != null &&
                  <View key={i.id} style={styles.photo}>
                    <OIcon cover url={imageUrl(i?.file, { width: 210, height: 127 })} width={210} height={127} />
                  </View>
                ))}
              </MediaWrapper>
            </>
          )}

          {showVideos && bVideos().length > 0 && (
            <>
              <DivideView />
              <OText preset='body_lg' weight={700}>{t('VIDEOS', 'Videos')}</OText>
              <MediaWrapper horizontal contentContainerStyle={styles.media}>
                {bVideos().map((v: any) => (
                  <WebView
                    key={`vid_id_${v.id}`}
                    style={styles.video}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    source={{
                      html: `
                  <iframe width='80%' height='80%' src="${formatUrlVideo(v.video)}" frameBorder='0' allow='autoplay; encrypted-media' allowFullScreen />
                  `,
                    }}
                    mediaPlaybackRequiresUserAction={true}
                  />
                ))}
              </MediaWrapper>
            </>
          )}
        </InnerContent>
      </WrapMainContent>
    </BusinessInformationContainer>
  );
};

export const BusinessInformation = (props: BusinessInformationParams) => {
  const BusinessInformationProps = {
    ...props,
    UIComponent: BusinessInformationUI,
  };
  return <BusinessInformationController {...BusinessInformationProps} />;
};
