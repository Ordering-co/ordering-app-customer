import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { usePageSections } from '@/theme/sections'

import { PurchaseGiftCard } from '../PurchaseGiftCard'
import { RedeemGiftCard } from '../RedeemGiftCard'

import { ActionWrapper, Container, HeroCard, HeroChip, HeroWatermark, HeroTitleWrap, Divider, Intro, RedeemWrapper } from './styles'
import { useLanguage } from '@components';
import { OText, OButton, OBottomPopup } from '@ui';
import Icon from '../../shared/Icon';
import { openScreen } from '@/navigators/appNavigation'

export const GiftCardUI = (props: any) => {
  const {
    navigation
  } = props
  const [, t] = useLanguage()
  const { render } = usePageSections('wallets')
  const [openModal, setOpenModal] = useState<any>(null)

  // The redeem sheet's minimum height is layout (not a design value).
  const style = useMemo(() => StyleSheet.create({
    sheet: { minHeight: 300 }
  }), [])

  const handleCustomGoToCheckout = (uuid: any) => {
    setOpenModal(null)
    openScreen(navigation, 'CheckoutPage', {
      cartUuid: uuid
    })
  }

  // The gift card sections of the `wallets` page, in the theme's order.
  const renderGiftCardHero = () => (
    <>
      <HeroCard>
        <HeroWatermark>
          <Icon name='gift' size={130} color='rgba(255, 255, 255, 0.16)' />
        </HeroWatermark>
        <HeroChip>
          <Icon name='gift-outline' size='sm' color='on_primary' />
          <OText preset='body_sm' weight={600} color='on_primary'>{t('GIFT_CARD', 'Gift Card')}</OText>
        </HeroChip>
        <HeroTitleWrap>
          <OText preset='h2' color='on_primary'>{t('GIFT_CARD_WALLET', 'Gift Card Wallet')}</OText>
          <OText preset='body_sm' color='on_primary' mTop='xxs'>{t('GIFT_CARD_HERO_SUBTITLE', 'Treat someone to their favorite meal')}</OText>
        </HeroTitleWrap>
      </HeroCard>
      <Intro>
        <OText preset='h3' weight={600} align='center'>{t('GIFT_CARD_SCREEN_TITLE', 'Give the gift of special moments with our Gift Cards')}</OText>
        <OText preset='body_sm'>{t('GIFT_CARD_SCREEN_DESCRIPTION', 'Our Gift Cards are the perfect way to surprise someone special. Whether it’s for a birthday, a celebration, or just to brighten their day, they offer flexibility and the freedom to choose what they love most. The perfect gift for any occasion!')}</OText>
      </Intro>
      <Divider />
    </>
  )
  const renderGiftCardPurchase = () => (
    <ActionWrapper>
      <OText preset='h3' weight={600} mBottom='sm'>{t('SELECT_YOUR_GIFT_CARD', 'Select your gift card')}</OText>
      <PurchaseGiftCard
        handleCustomGoToCheckout={handleCustomGoToCheckout}
        onClose={() => setOpenModal(null)}
      />
    </ActionWrapper>
  )
  const renderGiftCardRedeem = () => (
    <RedeemWrapper>
      <View>
        <OText preset='h4'>{t('GOT_A_GIFT_CARD', 'Got a Gift Card?')}</OText>
        <OText preset='body'>{t('REDEEM_IT_HERE', 'Redeem it here!')}</OText>
      </View>
      <OButton
        onClick={() => setOpenModal('redeem')}
        text={t('REDEEM', 'Redeem')}
        color='neutral'
        appearance='tonal'
        size='sm'
      />
    </RedeemWrapper>
  )
  const sections = { gift_card_hero: renderGiftCardHero, gift_card_purchase: renderGiftCardPurchase, gift_card_redeem: renderGiftCardRedeem }

  return (
    <Container>
      {render(sections)}
      <OBottomPopup
        open={openModal === 'redeem'}
        onClose={() => setOpenModal(null)}
        bottomContainerStyle={style.sheet}
        title={t('REDEEM_GIFT_CARD', 'Redeem Gift Card')}
        closeIcon
        presentationStyle="overFullScreen"
      >
        <RedeemGiftCard onClose={() => setOpenModal(null)} />
      </OBottomPopup>
    </Container>
  )
}
