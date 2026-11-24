import React, { useEffect } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { CouponControl as CouponController, useLanguage, useEvent } from '@components';
import { useTheme } from 'styled-components/native';
import {
  CContainer,
  CCWrapper,
  CCButton,
  CouponEntryButton,
  CouponEntryContent,
  CouponEntryIcon
} from './styles';

import { OInput, OButton, OAlert, OText } from '../shared';
import Icon from '../shared/Icon';
import { PressableScale } from '../shared/PressableScale';
import { nativeTextStyle, themePart } from '@/theme/helpers';

// Layout only (no theme values): safe at module level.
const layout = StyleSheet.create({
  input: { flex: 1, marginBottom: 0 }
})

const CouponControlUI = (props: any) => {
  const {
    couponDefault,
    couponInput,
    handleButtonApplyClick,
    handleRemoveCouponClick,
    onChangeInputCoupon,
    confirm,
    setConfirm,
    cart,
    canLoadOffers,
    onOpenOffers
  } = props

  const [, t] = useLanguage()
  const theme: any = useTheme();
  const [events] = useEvent()

  const handleOnAccept = () => {
    if (!confirm.error) {
      handleRemoveCouponClick && handleRemoveCouponClick()
    }
    onChangeInputCoupon('')
  }

  const cleanSetConfirm = () => {
    setConfirm({ ...confirm, open: false, error: false })
  }

  const onButtonApplyClick = () => {
    events.emit('coupon_entered', { ...cart, coupon: couponInput })
    handleButtonApplyClick()
  }

  useEffect(() => {
    if (confirm.content) {
      Alert.alert(
        t('COUPON_ERROR', 'Coupon Error'),
        confirm.content[0],
        [
          {
            text: t('CANCEL', 'cancel'),
            onPress: () => cleanSetConfirm(),
            style: 'cancel'
          },
          {
            text: t('ACCEPT', 'Accept'),
            onPress: () => cleanSetConfirm()
          }
        ],
        { cancelable: false }
      )
    }
  }, [confirm])

  if (canLoadOffers && onOpenOffers) {
    const couponLabel = typeof couponDefault === 'object'
      ? couponDefault?.coupon || couponDefault?.code || ''
      : couponDefault
    const couponIsListedAsOffer = cart?.offers?.some((offer: any) => (
      String(offer?.coupon || offer?.code || '').trim().toLowerCase() ===
      String(couponLabel || '').trim().toLowerCase()
    ))
    const appliedOffersCount = (cart?.offers?.length || 0) + (couponDefault && !couponIsListedAsOffer ? 1 : 0)

    return (
      <CContainer>
        <PressableScale onPress={onOpenOffers} testID='coupon-entry'>
          <CouponEntryButton
            accessible
            accessibilityRole='button'
            accessibilityLabel={t('OFFERS_AND_COUPONS', 'Offers and coupons')}
          >
            <CouponEntryIcon>
              <Icon name='pricetag' size='md' color='primary' />
            </CouponEntryIcon>
            <CouponEntryContent>
              <OText preset='body' weight={600}>
                {t('OFFERS_AND_COUPONS', 'Offers and coupons')}
              </OText>
              <OText preset='body_sm' color='text_muted'>
                {appliedOffersCount
                  ? `${appliedOffersCount} ${t('APPLIED', 'applied')}`
                  : t('ADD_A_COUPON_OR_OFFER', 'Add a coupon or offer')}
              </OText>
            </CouponEntryContent>
            <Icon name='chevron-forward' size='sm' color='text_muted' />
          </CouponEntryButton>
        </PressableScale>
      </CContainer>
    )
  }

  return (
    <CContainer>
      {couponDefault ? (
        <OAlert
          title={t('REMOVE_COUPON', 'Remove Coupon')}
          message={t('QUESTION_DELETE_COUPON', 'Are you sure that you want to delete the coupon?')}
          onAccept={() => handleOnAccept()}
        >
          <CCButton>
            <OText
              style={nativeTextStyle(themePart(theme, 'chip', 'base.text'))}
              color={themePart(theme, 'chip', 'base.color')}
              align='center'
            >
              {`${t('REMOVE_COUPON', 'Remove Coupon')} ${couponDefault}`}
            </OText>
          </CCButton>
        </OAlert>
      ) : (
        <CCWrapper>
          <OInput
            value={couponInput}
            placeholder={t('DISCOUNT_COUPON', 'Discount coupon')}
            onChange={(e: any) => onChangeInputCoupon(e)}
            style={layout.input}
          />
          <OButton
            onClick={() => onButtonApplyClick()}
            text={t('APPLY', 'Apply')}
            disabled={!couponInput}
          />
        </CCWrapper>
      )}
    </CContainer>
  )
}

export const CouponControl = (props: any) => {
  const couponProp = {
    ...props,
    UIComponent: CouponControlUI
  }
  return (
    <CouponController {...couponProp} />
  )
}
