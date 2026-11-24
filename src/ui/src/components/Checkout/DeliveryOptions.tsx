import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'styled-components/native';
import { Fade, Placeholder, PlaceholderLine } from '@/ui/src/components/shared/Skeleton';

import { ChSection, DeliveryOptionsContainer } from './styles';
import { useLanguage } from '@components';
import { OSelect } from '@ui';
import { themeSpace } from '@/theme/helpers';

export const DeliveryOptionsComponent = (props: any) => {
  const {
    HeaderTitle,
    loading,
    cartUuid,
    deliveryOptions,
    showComponent,
    deliveryOptionSelected,
    handleChangeDeliveryOption
  } = props

  const theme: any = useTheme();
  const [, t] = useLanguage();

  const styles = useMemo(() => StyleSheet.create({
    skeleton: { marginTop: themeSpace(theme, 'lg') },
    skeletonLine: { marginBottom: 0 },
    select: { marginTop: themeSpace(theme, 'sm') }
  }), [theme])

  if (!showComponent) return null;

  const changeDeliveryOption = (value: any) => {
    if (!cartUuid || value === deliveryOptionSelected) return
    handleChangeDeliveryOption(value)
  }

  return (
    <DeliveryOptionsContainer>
      {(loading || deliveryOptionSelected === undefined) ? (
        <View style={styles.skeleton}>
          <Placeholder Animation={Fade}>
            <PlaceholderLine height={40} style={styles.skeletonLine} />
          </Placeholder>
        </View>
      ) : (
        <ChSection>
          {HeaderTitle}
          <OSelect
            testID='delivery-options-select'
            style={styles.select}
            title={t('SPECIAL_INSTRUCTIONS', 'Special instructions')}
            options={deliveryOptions ?? []}
            value={deliveryOptionSelected}
            onSelect={changeDeliveryOption}
          />
        </ChSection>
      )}
    </DeliveryOptionsContainer>
  );
};
