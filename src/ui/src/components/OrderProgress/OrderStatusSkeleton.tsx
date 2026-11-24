import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from 'styled-components/native';

import { OrderProgressWrapper } from './styles'
import { Fade, Placeholder, PlaceholderLine } from '@/ui/src/components/shared/Skeleton';
import { nativeBoxStyle, nativeTextStyle, themeSpace } from '@/theme/helpers';

/** The loading shape of the order in progress: the order card's box and lines. */
export const OrderStatusSkeleton = () => {
  const theme: any = useTheme();
  const styles = useMemo(() => {
    const card = theme.native.components.order_card.base
    const skeleton = theme.native.components.skeleton.base
    const progress = theme.native.components.progress
    const size = theme.native.tokens.size
    return {
      color: skeleton.color,
      ...StyleSheet.create({
        card: { ...nativeBoxStyle(card), borderRadius: card.radius, padding: theme.native.components.card.base.padding, gap: themeSpace(theme, 'sm') },
        row: { flexDirection: 'row', alignItems: 'center', gap: themeSpace(theme, 'sm') },
        logo: { width: size.lg, height: size.lg, borderRadius: card.radius, backgroundColor: skeleton.color },
        info: { flex: 1 },
        name: { height: nativeTextStyle(card.name).lineHeight, borderRadius: skeleton.radius },
        line: { height: nativeTextStyle(theme.native.tokens.typography.body_sm).lineHeight, borderRadius: skeleton.radius },
        button: { width: size.xl * 2, height: size.sm, borderRadius: skeleton.radius, backgroundColor: skeleton.color },
        bar: { height: progress.sizes.md.height, borderRadius: progress.base.radius },
        between: { flexDirection: 'row', justifyContent: 'space-between' }
      })
    }
  }, [theme])

  return (
    <OrderProgressWrapper>
      <View style={styles.card}>
        <Placeholder Animation={Fade}>
          <View style={styles.row}>
            <View style={styles.logo} />
            <View style={styles.info}>
              <PlaceholderLine width={40} color={styles.color} style={styles.line} />
              <PlaceholderLine width={60} color={styles.color} noMargin style={styles.name} />
            </View>
            <View style={styles.button} />
          </View>
          <PlaceholderLine color={styles.color} style={styles.bar} />
          <View style={styles.between}>
            <PlaceholderLine width={30} color={styles.color} noMargin style={styles.line} />
            <PlaceholderLine width={50} color={styles.color} noMargin style={styles.line} />
          </View>
        </Placeholder>
      </View>
    </OrderProgressWrapper>
  )
}
