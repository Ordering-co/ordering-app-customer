import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from 'styled-components/native';
import { Placeholder, PlaceholderLine, Fade } from '@/ui/src/components/shared/Skeleton';
import { nativeBoxStyle, nativeTextStyle, themeSpace } from '@/theme/helpers';

/** The loading shape of an offer card (`components.offer_card`, `components.skeleton`). */
export const CouponCardSkeleton = () => {
  const theme: any = useTheme();
  const styles = useMemo(() => {
    const offer = theme.native.components.offer_card.base
    const skeleton = theme.native.components.skeleton.base
    const button = theme.native.components.button.sizes.md
    return {
      color: skeleton.color,
      ...StyleSheet.create({
        card: { ...nativeBoxStyle(offer), borderRadius: offer.radius, padding: offer.padding, marginBottom: themeSpace(theme, 'lg'), gap: themeSpace(theme, 'sm') },
        row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: themeSpace(theme, 'md') },
        grow: { flex: 1 },
        expiry: { height: nativeTextStyle(offer.expiry_text).lineHeight, borderRadius: skeleton.radius },
        name: { height: nativeTextStyle(offer.name_text).lineHeight, borderRadius: skeleton.radius },
        image: { width: offer.image_size, height: offer.image_size, borderRadius: offer.image_radius, backgroundColor: skeleton.color },
        divider: offer.divider,
        button: { height: button.height, borderRadius: skeleton.radius }
      })
    }
  }, [theme])

  return (
    <Placeholder Animation={Fade} style={styles.card}>
      <PlaceholderLine width={40} noMargin color={styles.color} style={styles.expiry} />
      <View style={styles.row}>
        <View style={styles.grow}>
          <PlaceholderLine width={80} noMargin color={styles.color} style={styles.name} />
        </View>
        <View style={styles.image} />
      </View>
      <View style={styles.divider} />
      <PlaceholderLine noMargin color={styles.color} style={styles.button} />
    </Placeholder>
  );
};
