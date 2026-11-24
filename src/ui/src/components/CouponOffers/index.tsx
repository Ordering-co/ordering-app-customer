import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, StyleSheet } from 'react-native'
import { useTheme } from 'styled-components/native'

import {
  CouponControl as CouponController,
  useEvent,
  useLanguage,
  useOrder
} from '@components'
import OInput from '../shared/OInput'
import OText from '../shared/OText'
import OButton from '../shared/OButton'
import Icon from '../shared/Icon'
import { nativeTextStyle, themeOpacity, themePart, themeSpace } from '@/theme/helpers'
import { OfferCard } from './OfferCard'
import {
  AppliedCouponCard,
  AppliedCouponInfo,
  InputWrapper,
  ManualForm,
  ManualSection,
  OfferIcon,
  OfferState,
  OfferTab,
  OfferTabCount,
  OfferTabs,
  ScreenContainer,
  SectionHeader
} from './styles'

type OffersTab = 'available' | 'current'

const CouponOffersUI = (props: any) => {
  const {
    applyingOfferId,
    canLoadOffers,
    cart,
    confirm,
    couponDefault,
    couponInput,
    handleButtonApplyClick,
    handleLoadOffers,
    handleOfferApplyClick,
    handleOfferRemoveClick,
    handleRemoveCouponClick,
    offersState,
    onChangeInputCoupon,
    onGoBack,
    removingOfferId,
    setConfirm
  } = props

  const theme: any = useTheme()
  const [, t] = useLanguage()
  const styles = useMemo(() => StyleSheet.create({
    input: { marginBottom: 0 },
    list: { paddingBottom: themeSpace(theme, 'xxl') }
  }), [theme])
  const chipText = nativeTextStyle(themePart(theme, 'chip', 'base.text'))
  const tabColor = (active: boolean) => active
    ? themePart(theme, 'chip', 'variants.default.states.selected.color')
    : themePart(theme, 'chip', 'base.color')
  const badgeText = nativeTextStyle(themePart(theme, 'badge', 'base.text'))
  const badgeColor = themePart(theme, 'badge', 'variants.neutral.color')
  const spinnerColor = themePart(theme, 'spinner', 'base.color')
  const [orderState] = useOrder()
  const [events] = useEvent()
  const [activeTab, setActiveTab] = useState<OffersTab>('available')
  const [removingCoupon, setRemovingCoupon] = useState(false)
  const handleLoadOffersRef = useRef(handleLoadOffers)

  const couponLabel = typeof couponDefault === 'object'
    ? couponDefault?.coupon || couponDefault?.code || ''
    : couponDefault
  const appliedOffers = Array.isArray(cart?.offers) ? cart.offers : []
  const normalizedCouponLabel = String(couponLabel || '').trim().toLowerCase()
  const couponIsListedAsOffer = appliedOffers.some((offer: any) => (
    normalizedCouponLabel &&
    String(offer?.coupon || offer?.code || '').trim().toLowerCase() === normalizedCouponLabel
  ))
  const currentOffers = [
    ...appliedOffers,
    ...(couponDefault && !couponIsListedAsOffer
      ? [{
          id: `coupon:${couponLabel}`,
          coupon: couponLabel,
          name: t('APPLIED_COUPON', 'Applied coupon'),
          isCoupon: true
        }]
      : [])
  ]
  const operationPending = Boolean(applyingOfferId || removingOfferId || removingCoupon || orderState.loading)

  useEffect(() => {
    handleLoadOffersRef.current = handleLoadOffers
  }, [handleLoadOffers])

  useEffect(() => {
    if (canLoadOffers) handleLoadOffersRef.current()
  }, [canLoadOffers, cart?.uuid])

  useEffect(() => {
    if (!confirm?.content) return

    const content = Array.isArray(confirm.content) ? confirm.content[0] : confirm.content
    Alert.alert(
      t('COUPON_ERROR', 'Coupon Error'),
      content,
      [{
        text: t('ACCEPT', 'Accept'),
        onPress: () => setConfirm({ open: false, content: null, error: false })
      }],
      { cancelable: false }
    )
  }, [confirm, setConfirm, t])

  const handleManualApply = async () => {
    events.emit('coupon_entered', { ...cart, coupon: couponInput })
    const applied = await handleButtonApplyClick()
    if (applied) onGoBack?.()
  }

  const handleOfferApply = async (offer: any) => {
    const applied = await handleOfferApplyClick(offer)
    if (applied) onGoBack?.()
  }

  const removeCoupon = async () => {
    setRemovingCoupon(true)
    try {
      await handleRemoveCouponClick()
      onChangeInputCoupon('')
    } finally {
      setRemovingCoupon(false)
    }
  }

  const confirmRemoval = (offer: any, isCoupon: boolean) => {
    Alert.alert(
      isCoupon ? t('COUPON', 'Coupon') : t('OFFER', 'Offer'),
      isCoupon
        ? t('QUESTION_DELETE_COUPON', 'Are you sure that you want to delete the coupon?')
        : t('QUESTION_DELETE_OFFER', 'Are you sure that you want to delete the offer?'),
      [
        { text: t('CANCEL', 'Cancel'), style: 'cancel' },
        {
          text: t('REMOVE', 'Remove'),
          style: 'destructive',
          onPress: () => isCoupon ? removeCoupon() : handleOfferRemoveClick(offer.id)
        }
      ]
    )
  }

  const renderManualSection = () => (
    <ManualSection>
      <SectionHeader>
        <OText preset='body_lg' weight={700}>{t('ENTER_A_COUPON_CODE', 'Enter a coupon code')}</OText>
        <OText preset='body_sm' color='text_muted'>
          {t('ENTER_COUPON_HELP', 'Enter your code below to apply it to this cart.')}
        </OText>
      </SectionHeader>

      {couponDefault
        ? (
          <AppliedCouponCard>
            <OfferIcon>
              <Icon name='pricetag-outline' size='md' color='primary' />
            </OfferIcon>
            <AppliedCouponInfo>
              <OText preset='body_sm' color='text_muted'>
                {t('APPLIED_COUPON', 'Applied coupon')}
              </OText>
              <OText preset='body' weight={600} numberOfLines={1}>{couponLabel}</OText>
            </AppliedCouponInfo>
            <OButton
              onClick={() => setActiveTab('current')}
              text={t('MANAGE', 'Manage')}
            />
          </AppliedCouponCard>
          )
        : (
          <ManualForm>
            <InputWrapper>
              <OInput
                value={couponInput ?? ''}
                placeholder={t('DISCOUNT_COUPON', 'Discount coupon')}
                onChange={onChangeInputCoupon}
                style={styles.input}
              />
            </InputWrapper>
            <OButton
              disabled={!couponInput || operationPending}
              onClick={handleManualApply}
              text={t('APPLY', 'Apply')}
            />
          </ManualForm>
          )}
    </ManualSection>
  )

  const renderTabs = () => (
    <OfferTabs accessibilityRole='tablist'>
      <OfferTab
        $active={activeTab === 'available'}
        onPress={() => setActiveTab('available')}
        accessibilityRole='tab'
        activeOpacity={themeOpacity(theme, 'pressed')}
        accessibilityState={{ selected: activeTab === 'available' }}
      >
        <OText style={chipText} color={tabColor(activeTab === 'available')}>
          {t('AVAILABLE_OFFERS', 'Available offers')}
        </OText>
        {!offersState.loading && offersState.offers.length > 0 && (
          <OfferTabCount>
            <OText style={badgeText} color={badgeColor}>{offersState.offers.length}</OText>
          </OfferTabCount>
        )}
      </OfferTab>
      <OfferTab
        $active={activeTab === 'current'}
        onPress={() => setActiveTab('current')}
        accessibilityRole='tab'
        activeOpacity={themeOpacity(theme, 'pressed')}
        accessibilityState={{ selected: activeTab === 'current' }}
      >
        <OText style={chipText} color={tabColor(activeTab === 'current')}>
          {t('CURRENT_OFFERS', 'Current offers')}
        </OText>
        <OfferTabCount>
          <OText style={badgeText} color={badgeColor}>{currentOffers.length}</OText>
        </OfferTabCount>
      </OfferTab>
    </OfferTabs>
  )

  const renderEmptyState = () => {
    if (activeTab === 'available' && offersState.loading) {
      return (
        <OfferState accessibilityRole='progressbar'>
          <ActivityIndicator size='large' color={spinnerColor} />
          <OText preset='body_sm' color='text_muted'>
            {t('LOADING', 'Loading...')}
          </OText>
        </OfferState>
      )
    }

    if (activeTab === 'available' && offersState.error) {
      return (
        <OfferState>
          <Icon name='alert-circle-outline' size='lg' color='danger' />
          <OText preset='body' weight={600} align='center'>
            {t('OFFERS_COULD_NOT_LOAD', "We couldn't load your offers")}
          </OText>
          <OText preset='body_sm' color='text_muted' align='center'>
            {t('OFFERS_LOAD_RETRY_HELP', 'Check your connection and try again.')}
          </OText>
          <OButton onClick={handleLoadOffers} text={t('TRY_AGAIN', 'Try again')} />
        </OfferState>
      )
    }

    return (
      <OfferState>
        <Icon name='pricetag-outline' size='lg' color='text_disabled' />
        <OText preset='body' weight={600} align='center'>
          {activeTab === 'available'
            ? t('NO_OFFERS_AVAILABLE', 'No offers available right now')
            : t('NO_CURRENT_OFFERS', 'No offers applied yet')}
        </OText>
        <OText preset='body_sm' color='text_muted' align='center'>
          {activeTab === 'available'
            ? t('NO_OFFERS_AVAILABLE_HELP', 'You can still enter a coupon code above.')
            : t('NO_CURRENT_OFFERS_HELP', 'Choose an available offer or enter a coupon code above.')}
        </OText>
      </OfferState>
    )
  }

  const listData = activeTab === 'available' && !offersState.loading && !offersState.error
    ? offersState.offers
    : activeTab === 'current'
      ? currentOffers
      : []

  return (
    <ScreenContainer>
      <FlatList
        data={listData}
        keyExtractor={(offer: any) => String(offer.id || offer.coupon || offer.code || offer.name)}
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={styles.list}
        ListHeaderComponent={(
          <>
            {renderManualSection()}
            {canLoadOffers && renderTabs()}
            {canLoadOffers && (
              <OText preset='body_sm' color='text_muted' mBottom='sm'>
                {activeTab === 'available'
                  ? t('AVAILABLE_OFFERS_HELP', 'Choose an offer and apply it instantly.')
                  : t('CURRENT_OFFERS_HELP', 'Review or remove discounts applied to this cart.')}
              </OText>
            )}
          </>
        )}
        ListEmptyComponent={canLoadOffers ? renderEmptyState() : undefined}
        renderItem={({ item }: any) => (
          <OfferCard
            offer={item}
            isCurrent={activeTab === 'current'}
            isCoupon={Boolean(item.isCoupon)}
            cartHasOffers={Boolean(cart?.offers?.length)}
            applyingOfferId={applyingOfferId}
            removingOfferId={item.isCoupon && removingCoupon ? item.id : removingOfferId}
            onApply={handleOfferApply}
            onRemove={confirmRemoval}
            t={t}
          />
        )}
      />
    </ScreenContainer>
  )
}

export const CouponOffers = (props: any) => (
  <CouponController {...props} UIComponent={CouponOffersUI} />
)
