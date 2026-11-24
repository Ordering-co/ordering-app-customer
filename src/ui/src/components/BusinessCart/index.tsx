import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from 'styled-components/native';
import { Fade, Placeholder, PlaceholderLine } from '@/ui/src/components/shared/Skeleton';

import {
  Card,
  BusinessContent,
  BusinessInfo,
  BusinessActions,
  Metadata,
  Reviews,
  BtnWrapper
} from './styles'

import {
  useUtils,
  useLanguage,
  useOrder
} from '@components'
import { convertHoursToMinutes } from '../../utils';
import { OButton, OText } from '../shared';
import Icon from '../shared/Icon';
import { themeControlHeight, themeSpace } from '@/theme/helpers';

// Skeleton boxes are layout (the size of the text they stand for).
const SKELETON_LINE = 10

export const BusinessCart = (props: any) => {
  const {
    business,
    isLoading,
    isDisabled,
    isSkeleton,
    handleCartStoreClick
  } = props

  const [, t] = useLanguage()
  const theme: any = useTheme();
  const [orderState] = useOrder()
  const [{ parsePrice, parseDistance, parseNumber }] = useUtils();

  const styles = useMemo(() => StyleSheet.create({
    skeleton: { marginBottom: themeSpace(theme, 'xs') }
  }), [theme])

  return (
    <Card>
      <BusinessContent>
        <BusinessInfo>
          {business?.name && (
            <OText preset='body_sm' weight={500}>
              {business?.name}
            </OText>
          )}
          {isSkeleton && (
            <Placeholder
              Animation={Fade}
              style={styles.skeleton}
            >
              <PlaceholderLine
                height={SKELETON_LINE}
                width={40}
                style={styles.skeleton}
              />
            </Placeholder>
          )}
          {!!business?.address && (
            <OText
              preset='caption'
              numberOfLines={1}
              ellipsizeMode={'tail'}
              mBottom='xs'
            >
              {business?.address}
            </OText>
          )}
          {isSkeleton && (
            <Placeholder
              Animation={Fade}
              style={styles.skeleton}
            >
              <PlaceholderLine
                height={SKELETON_LINE}
                width={80}
                style={styles.skeleton}
              />
            </Placeholder>
          )}
          <Metadata>
            {!isSkeleton ? (
              <>
                <OText preset='caption' color='text_muted'>
                  {`${t('DELIVERY_FEE', 'Delivery fee')} ${parsePrice(business?.delivery_price) + ' \u2022 '}`}
                </OText>
                <OText preset='caption' color='text_muted'>{`${convertHoursToMinutes(
                  orderState?.options?.type === 1
                    ? business?.delivery_time
                    : business?.pickup_time,
                )} \u2022 `}</OText>
                <OText preset='caption' color='text_muted'>{parseDistance(business?.distance)}</OText>
              </>
            ) : (
              <Placeholder
                Animation={Fade}
                style={styles.skeleton}
              >
                <PlaceholderLine
                  height={SKELETON_LINE}
                  width={60}
                  style={styles.skeleton}
                />
              </Placeholder>
            )}
          </Metadata>
        </BusinessInfo>
        <BusinessActions>
          {business?.reviews?.total > 0 && (
            <Reviews>
              <Icon name='star' size={theme.native.components.rating.sizes.sm.icon_size} color={theme.native.components.rating.base.color} />
              <OText preset='caption'>
                {parseNumber(business?.reviews?.total ?? 1, { separator: '.' })}
              </OText>
            </Reviews>
          )}
          <BtnWrapper>
          {handleCartStoreClick && (
            <OButton
              text={t('SELECT', 'Select')}
              color='primary'
              appearance='outline'
              size='sm'
              disabled={isDisabled}
              loading={isLoading}
              onClick={() => handleCartStoreClick && handleCartStoreClick(business?.id)}
            />
          )}
          {isSkeleton && (
            <Placeholder
              Animation={Fade}
              style={styles.skeleton}
            >
              <PlaceholderLine
                height={themeControlHeight(theme, 'sm')}
                width={80}
                style={styles.skeleton}
              />
            </Placeholder>
          )}
          </BtnWrapper>
        </BusinessActions>
      </BusinessContent>
    </Card>
  )
}
