import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from 'styled-components/native';
import FastImage from 'react-native-fast-image';

import {
  CardContainer,
  TopRow,
  InfoContainer,
  ProgressBarTrack,
  ProgressBarFill,
  BottomRow,
} from './styles'
import { OrderEta } from '../OrderDetails/OrderEta'
import { OrderProgressSteps } from '../OrderDetails/OrderProgressSteps'

const deliveryTypes = [1, 7]

import { useLanguage, useUtils } from '@components'
import Icon from '../shared/Icon'
import { PressableScale } from '../shared/PressableScale'
import OText from '../shared/OText'
import { nativeBoxStyle, nativeShadowStyle, nativeTextStyle, themeControlHeight, themeImage, themeSpace, themeVisible } from '@/theme/helpers'
import { BusinessLogo } from '../shared/BusinessLogo'
import { IMAGE_REQUEST, imageUrl } from '@/utils/imageUrl'

export const OrderCard = (props: any) => {
  const { lastOrder, statusToShow, progressBarObjt, handleGoToOrder } = props;

  const theme: any = useTheme();
  const isInProgress = statusToShow.includes(lastOrder?.status)
  // `components.order_card`: its box, the in-progress state, the name and meta texts.
  const styles = useMemo(() => {
    const card = theme.native.components.order_card
    const progress = theme.native.components.progress.base
    return StyleSheet.create({
      outer: { marginVertical: themeSpace(theme, 'lg') },
      box: nativeBoxStyle(card.base),
      active: nativeBoxStyle(card.variants.default.states.active),
      track: { ...(progress.border ?? {}), ...nativeShadowStyle(progress.shadow) },
      name: { ...nativeTextStyle(card.base.name), color: card.base.name_color },
      meta: { ...nativeTextStyle(card.base.meta), color: card.base.meta_color },
      time: { ...nativeTextStyle(card.base.meta), color: card.base.name_color },
      status: { ...nativeTextStyle(card.base.meta), color: card.base.status_color },
      logo: { width: themeControlHeight(theme, 'lg') },
      summaryTop: { gap: themeSpace(theme, 'xxs') },
      illustration: { width: themeControlHeight(theme, 'xl'), height: themeControlHeight(theme, 'xl') }
    })
  }, [theme])
  const [, t] = useLanguage()
  const illustration = useMemo(() => themeImage(theme, 'icons.order_progress'), [theme])
  const [{ parseDate, timeFormat }] = useUtils()

  const summaryOnTop = theme.native.components.order_card.base.summary_position === 'top'
  const businessCard = theme.native.components.business_card.base
  const logoUri = typeof lastOrder?.business?.logo === 'string' && lastOrder.business.logo.includes('http')
    ? imageUrl(lastOrder.business.logo, { height: IMAGE_REQUEST.logo })
    : null
  const status = progressBarObjt(lastOrder.status)
  const progressPercentage = status?.percentage ? `${status.percentage * 100}%` : '0%'
  const showCaption = themeVisible(theme, 'business_listing.order_caption')
  const eta = (
    <OText style={styles.time}>
      {isInProgress
        ? <OrderEta order={lastOrder} outputFormat={timeFormat || 'HH:mm'} />
        : parseDate(lastOrder?.reporting_data?.at[`status:${lastOrder.status}`], { outputFormat: timeFormat })}
    </OText>
  )
  const etaLabel = deliveryTypes?.includes?.(lastOrder?.delivery_type) ? t('ESTIMATED_DELIVERY', 'Estimated delivery') : t('ESTIMATED_TIME', 'Estimated time')

  return (
    // The whole card opens the order (as the order and business cards): no button to
    // take the name's room on a narrow phone; the chevron says it opens.
    <PressableScale
      testID='order-progress-card'
      style={styles.outer}
      onPress={() => handleGoToOrder('OrderDetails', { orderId: lastOrder?.uuid, orderNumberId: lastOrder?.id })}
    >
    <CardContainer
      style={[styles.box, isInProgress && styles.active]}
      accessibilityRole='button'
      accessibilityLabel={t('GO_TO_ORDER', 'Go to order')}
    >
      <TopRow>
        {/* The logo in the business cards' frame; without one, the theme's placeholder in that frame. */}
        <BusinessLogo
          uri={logoUri}
          size={styles.logo.width}
          radius={businessCard.radius}
          background={businessCard.background}
          shadow={businessCard.logo_shadow}
        />
        <InfoContainer>
          {showCaption && (
            <OText style={styles.meta} numberOfLines={1}>
              {isInProgress ? t('ORDER_IN_PROGRESS', 'Order in progress') : t('ORDER', 'Order')}
            </OText>
          )}
          <OText style={styles.name} numberOfLines={1}>{lastOrder?.business?.name}</OText>
        </InfoContainer>
        {illustration
          ? <FastImage testID='order-progress-image' style={styles.illustration} source={illustration} objectFit='contain' />
          : <Icon name='chevron-forward' size='md' color='text_muted' />}
      </TopRow>

      {summaryOnTop && (
        <View testID='order-progress-summary-top' style={styles.summaryTop}>
          <OText style={styles.meta} numberOfLines={1}>
            {etaLabel}{'  '}
            {eta}
          </OText>
          <OText style={styles.status} numberOfLines={1}>{status?.value}</OText>
        </View>
      )}
      {/* The whole card's width, on its track. */}
      {theme.native.components.order_details.base.progress_layout === 'segments' ? (
        <OrderProgressSteps
          status={lastOrder?.status}
          delivery={deliveryTypes.includes(lastOrder?.delivery_type)}
          size='sm'
        />
      ) : (
        <ProgressBarTrack style={styles.track}>
          <ProgressBarFill style={{ width: progressPercentage }} />
        </ProgressBarTrack>
      )}

      {!summaryOnTop && (
        <BottomRow>
          <OText style={styles.status} numberOfLines={1}>{status?.value}</OText>
          <OText style={styles.meta} numberOfLines={1}>
            {etaLabel}{' · '}
            {eta}
          </OText>
        </BottomRow>
      )}
    </CardContainer>
    </PressableScale>
  );
};
