import React, { useMemo } from 'react';
import { Placeholder, PlaceholderLine, Fade } from '@/ui/src/components/shared/Skeleton';
import { useTheme } from 'styled-components/native';

import { ChSection, ChBusinessDetails, BusinessCopy, Divider } from './styles';
import { BusinessLogo } from '../shared/BusinessLogo';
import { OText } from '@ui';
import { StyleSheet, View } from 'react-native';
import { nativeTextStyle, themePart, themeSpace, themeVisible } from '@/theme/helpers';

export const BusinessDetailsComponent = (props: any) => {
  const { business, loading, error, showComponent, hideContact } = props;
  const theme: any = useTheme();
  const showLogo = themeVisible(theme, 'checkout.business.logo')
  const showPhone = themeVisible(theme, 'checkout.business.phone')
  const showAddress = themeVisible(theme, 'checkout.business.address')
  const businessPhone = hideContact || !showPhone ? '' : (business?.cellphone || business?.phone)
  const styles = useMemo(() => {
    const line = theme.native.components.divider.variants.band.line
    const nameColor = themePart(theme, 'checkout', 'base.business_name_color')
    return StyleSheet.create({
      skeleton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: line.borderWidth ?? 0,
        borderBottomColor: line.borderColor,
        paddingBottom: themeSpace(theme, 'lg')
      },
      // The business name: `checkout.base.business_name`.
      name: { ...nativeTextStyle(themePart(theme, 'checkout', 'base.business_name')), ...(nameColor ? { color: nameColor } : null) },
      skeletonLogo: { marginRight: themeSpace(theme, 'lg'), marginBottom: 0 },
      skeletonLine: { marginBottom: 0 }
    })
  }, [theme])

  if (!showComponent) return null;

  const details = (
    <>
      {!loading && (
        <ChBusinessDetails>
          {showLogo && (
            <BusinessLogo
              uri={business?.logo || null}
              size={theme.native.components.checkout.base.business_logo_size}
              radius={theme.native.components.checkout.base.business_logo_shape === 'own' ? theme.native.components.checkout.base.business_logo_radius : theme.native.components.business_card.base.radius}
              background={theme.native.components.business_card.base.background}
              shadow={theme.native.components.business_card.base.logo_shadow}
            />
          )}
          <BusinessCopy>
            <OText style={styles.name}>
              {business?.name}
            </OText>
            {showAddress && !!business?.address && (
              <OText testID='checkout-business-address' preset='body' numberOfLines={2}>
                {business.address}
              </OText>
            )}
            {!!businessPhone && (
              <OText preset='body' color='text_muted'>
                {businessPhone}
              </OText>
            )}
          </BusinessCopy>
        </ChBusinessDetails>
      )}
      {loading && !error &&
        (
          <Placeholder Animation={Fade}>
            <View style={styles.skeleton}>
              <PlaceholderLine height={theme.native.components.checkout.base.business_logo_size} width={20} style={styles.skeletonLogo} />
              <PlaceholderLine height={35} width={65} style={styles.skeletonLine} />
            </View>
          </Placeholder>
        )}
    </>
  )

  // The band under the head (address, order options), then the business as the first section.
  return (
    <>
      <Divider />
      <ChSection>{details}</ChSection>
    </>
  )
};
