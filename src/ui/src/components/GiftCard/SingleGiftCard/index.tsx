import React from 'react';
import { StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useTheme } from 'styled-components/native';
import { Placeholder, PlaceholderLine, Fade } from '@/ui/src/components/shared/Skeleton';

import { LogoContainer, GiftCardInfoContainer, SingleGiftCardContainer, SingleGiftCardPriceContainer, SkeletonImage, SkeletonLines, SkeletonRow } from './styles'
import { BUNDLED_IMAGES } from '@/theme/bundledImages'
import { themeSpace } from '@/theme/helpers'
import { PressableScale } from '../../shared/PressableScale'
import { useLanguage, useUtils } from '@components';
import { OText } from '../../shared'
import { imageUrl } from '@/utils/imageUrl'

export const SingleGiftCard = (props: any) => {
  const {
    card,
    isSkeleton,
    onNavigationRedirect
  } = props

  const theme: any = useTheme()
  const [, t] = useLanguage()
  const [{ parsePrice, parseDate }] = useUtils()

  // The image box (layout) and the skeleton lines' own spacing.
  const styles = React.useMemo(() => StyleSheet.create({
    logo: {
      width: 70,
      height: 70
    },
    line: { marginBottom: themeSpace(theme, 'xs') },
    lastLine: { marginBottom: 0 }
  }), [theme]);

  const getGiftCardStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: t('PENDING', 'Pending'), color: 'text' }
      case 'activated':
        return { text: t('REDEEMED', 'Redeemed'), color: 'primary' }
      default:
        return { text: t(status.toUpperCase(), status), color: 'primary' }
    }
  }

  const handleClickGiftCardOrder = (card: any) => {
    onNavigationRedirect?.('OrderDetails', { orderId: card.order_product?.order_id });
  }

  return (
    <PressableScale
      disabled={isSkeleton}
      onPress={() => handleClickGiftCardOrder(card)}
    >
      {isSkeleton ? (
        <Placeholder Animation={Fade}>
          <SkeletonRow>
            <SkeletonImage>
              <PlaceholderLine width={100} height={64} style={styles.lastLine} />
            </SkeletonImage>
            <SkeletonLines>
              <PlaceholderLine width={60} style={styles.line} />
              <PlaceholderLine width={40} style={styles.line} />
              <PlaceholderLine width={20} style={styles.lastLine} />
            </SkeletonLines>
          </SkeletonRow>
        </Placeholder>
      ) : (
        <SingleGiftCardContainer>
          <GiftCardInfoContainer>
            <OText weight={700}>
              {card?.order_product?.name}
            </OText>
            <OText mTop='xs'>
              {parseDate(card?.created_at)}
            </OText>
            <SingleGiftCardPriceContainer>
              <OText mRight='sm'>
                {parsePrice(card?.order_product?.price)}
              </OText>
              <OText color={getGiftCardStatus(card?.status)?.color}>
                {getGiftCardStatus(card?.status)?.text}
              </OText>
            </SingleGiftCardPriceContainer>
          </GiftCardInfoContainer>
          <LogoContainer>
            <FastImage
              style={styles.logo}
              source={card?.order_product?.images ? {
                uri: imageUrl(card?.order_product?.images, { height: 200 })
              } : BUNDLED_IMAGES.dummies.giftCard}
              objectFit='contain'
            />
          </LogoContainer>
        </SingleGiftCardContainer>
      )}
    </PressableScale>
  )
}
