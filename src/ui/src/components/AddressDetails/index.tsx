import React, { useMemo } from 'react';
import FastImage from 'react-native-fast-image'
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useTheme } from 'styled-components/native';

import {
  AddressDetails as AddressDetailsController,
  useOrder,
  useLanguage,
  useConfig,
} from '@components';

import { getTypesLabel, getTypesText } from '../../utils';
import { ADContainer, ADHeader, ADAddress, ADMap } from './styles';
import { OText } from '../shared';
import { EditButton } from '../shared/EditButton';
import { nativeTextStyle, themeGutter, themeSpace } from '@/theme/helpers';

const AddressDetailsUI = (props: any) => {
  const {
    navigation,
    addressToShow,
    isCartPending,
    googleMapsUrl,
    apiKey,
    uuid
  } = props;

  const theme: any = useTheme();
  const [orderState] = useOrder();
  const [{ options }] = useOrder();
  const [{ configs }] = useConfig()
  const [, t] = useLanguage();
  const { width } = useWindowDimensions();
  const useAlternativeMap = configs?.use_alternative_to_google_maps?.value === '1'

  const orderTypeText = {
    key: getTypesText(options?.type || 1),
    value: getTypesLabel(options?.type || 1, t)
  }
  const openAddressList = () => navigation.navigate('AddressList', { isFromCheckout: true, cartUuid: uuid })

  const styles = useMemo(() => StyleSheet.create({
    // The static map spans the screen: it bleeds over the page gutter; 151 pt is the map image's height.
    map: { width, flex: 1, marginStart: -themeGutter(theme), marginEnd: -themeGutter(theme) },
    productStyle: {
      width,
      height: 151,
      marginVertical: themeSpace(theme, 'sm')
    },
    address: { flexDirection: 'column', alignItems: 'flex-start', width: '85%' },
    fullWidth: { width: '100%' },
    // Without a title of the caller's, the checkout's section title (the multi checkout's variant there).
    title: {
      ...nativeTextStyle(props.isMultiCheckout ? theme.native.components.checkout.variants.multi.section_title : theme.native.components.checkout.base.section_title),
      color: theme.native.components.checkout.base.section_title_color
    }
  }), [theme, width, props.isMultiCheckout])

  return (
    <ADContainer>
      <ADHeader>
        {props.HeaderTitle ?? (
          <OText style={styles.title}>
            {t(`${orderTypeText.key}_ADDRESS`, `${orderTypeText.value} address`)}
          </OText>
        )}
      </ADHeader>
      {!useAlternativeMap && !!apiKey && googleMapsUrl && (
        <ADMap
          style={styles.map}>
          <FastImage
            style={styles.productStyle}
            source={{
              uri: googleMapsUrl,
              priority: FastImage.priority.normal,
            }}
            objectFit='cover'
          />
        </ADMap>
      )}
      <ADAddress>
        <View style={styles.address}>
          <OText
            numberOfLines={1}
            ellipsizeMode="tail"
            style={styles.fullWidth}>
            {addressToShow || orderState?.options?.address?.address}
          </OText>
          {!!orderState?.options?.address?.address_notes && (
            <OText>
              {orderState?.options?.address?.address_notes}
            </OText>
          )}
        </View>
        {orderState?.options?.type === 1 && !isCartPending && (
          <EditButton
            accessibilityLabel={t('CHANGE_ADDRESS', 'Change address')}
            onClick={openAddressList}
          />
        )}
      </ADAddress>
    </ADContainer>
  );
};

export const AddressDetails = (props: any) => {
  const addressDetailsProps = {
    ...props,
    UIComponent: AddressDetailsUI,
  };
  return <AddressDetailsController {...addressDetailsProps} />;
};
