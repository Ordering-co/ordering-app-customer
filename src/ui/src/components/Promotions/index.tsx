import React, { useEffect, useMemo, useState } from 'react'
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native'
import FastImage from 'react-native-fast-image'
import { useTheme } from 'styled-components/native';
import Icon from '../shared/Icon'
import { usePageSections } from '@/theme/sections'
import { nativeBoxStyle, nativeShadowStyle, nativeTextStyle, themeGutter, themeSpace, themeVisible } from '@/theme/helpers'

import {
  PromotionsContainer,
  SingleOfferContainer,
  OfferInformation,
  SearchBarContainer,
  SingleBusinessOffer,
  OfferData,
  OfferTitleRow,
  OfferHero,
  OfferValueChip,
  Code,
  CouponHighlight,
  CouponCodeBadge,
  OfferDescription,
  OfferMetaList,
  OfferMetaRow,
  BusinessInfo,
  WrapperSingleOffer
} from './styles'

import { PromotionParams } from '../../types'
import { PromotionsController, useLanguage, useUtils } from '@components'
import { CouponCardSkeleton } from './Skeletons'
import {
  OButton, OText,
  NotFoundSource,
  OInput,
  OModal
} from '@ui'
import { openScreen } from '@/navigators/appNavigation'
import { IMAGE_REQUEST, imageUrl } from '@/utils/imageUrl'

/** The search field's icon: `OInput` mounts it as a component, so it lives here, stable. */
const PromotionsSearchIcon = () => <Icon name='pricetags' color='primary' />

const PromotionsUI = (props: PromotionParams) => {
  const {
    navigation,
    offersState,
    handleSearchValue,
    searchValue,
    loadOffers,
    offerSelected,
    setOfferSelected,
    businessSlug,
  } = props

  const offerBusinesses = (offerSelected?.businesses ?? []).filter((business: any) =>
    businessSlug === undefined || businessSlug === null ||
    String(business?.id) === String(businessSlug) || business?.slug === businessSlug
  )

  const handleSearch = (val: string) => {
    handleSearchValue(val);
  };

  const theme: any = useTheme();
  const { render } = usePageSections('promotions')
  const show = {
    image: themeVisible(theme, 'promotions.offer.image'),
    description: themeVisible(theme, 'promotions.offer.description'),
    expires: themeVisible(theme, 'promotions.offer.expires'),
    applyFor: themeVisible(theme, 'promotions.offer.apply_for')
  }

  // `components.offer_card`: the box, its texts, image, divider and code.
  const styles = useMemo(() => {
    const offer = theme.native.components.offer_card.base
    // The shadow sits on a box with the card's background, the image (rounded) inside it: on a transparent image it would show through.
    const image = { borderRadius: offer.image_radius }
    const imageBox = { borderRadius: offer.image_radius, backgroundColor: offer.background, ...nativeShadowStyle(offer.image_shadow) }
    return StyleSheet.create({
      box: nativeBoxStyle(offer),
      list: { paddingHorizontal: themeGutter(theme), paddingTop: themeSpace(theme, 'lg'), paddingBottom: themeSpace(theme, 'xxxl') },
      expiry: { ...nativeTextStyle(offer.expiry_text), color: offer.expiry_color },
      name: { ...nativeTextStyle(offer.name_text), color: offer.name_color, flex: 1 },
      modalName: { ...nativeTextStyle(offer.name_text), color: offer.name_color, textAlign: 'center' },
      description: { ...nativeTextStyle(offer.description_text), color: offer.description_color },
      code: { ...nativeTextStyle(offer.code_text), color: offer.code_color, textAlign: 'center' },
      codeBox: nativeShadowStyle(offer.code_shadow),
      image: { ...image, width: offer.image_size, height: offer.image_size },
      imageBox: { ...imageBox, width: offer.image_size, height: offer.image_size },
      modalImage: { ...image, width: offer.modal_image_size, height: offer.modal_image_size },
      modalImageBox: { ...imageBox, width: offer.modal_image_size, height: offer.modal_image_size },
      logo: { width: theme.native.tokens.size.md, height: theme.native.tokens.size.md, borderRadius: offer.image_radius },
      divider: offer.divider,
      modal: { padding: themeGutter(theme) },
      businesses: { marginTop: themeSpace(theme, 'md'), marginBottom: themeSpace(theme, 'sm') },
      businessList: { marginBottom: themeSpace(theme, 'xxxl') }
    })
  }, [theme])
  const action = theme.native.components.offer_card.slots.action

  const [, t] = useLanguage()
  const [{ parseDate, parsePrice }] = useUtils()
  const [openModal, setOpenModal] = useState(false)
  const [refreshPromotions, setRefreshPromotions] = useState(false)
  const [refreshing, setRefreshing] = useState(false);

  const handleClickOffer = (offer: any) => {
    setOpenModal(true)
    setOfferSelected(offer)
  }

  const handleBusinessClick = (store: any) => {
    setOpenModal(false)
    openScreen(navigation, 'Business', { store: store.slug })
  }

  const handleOnRefresh = () => {
    if (!offersState.loading) {
      loadOffers();
    }
  }

  const filteredOffers = offersState?.offers?.filter((offer: any) =>
    offer.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const targetString = offerSelected?.target === 1
    ? t('SUBTOTAL', 'Subtotal')
    : offerSelected?.target === 2
      ? t('DELIVERY_FEE', 'Delivery fee')
      : t('SERVICE_FEE', 'Service fee')

  const offerMetaRows = [
    {
      key: 'applies',
      label: t('APPLIES_TO', 'Applies to'),
      value: targetString,
    },
    offerSelected?.auto
      ? {
        key: 'auto',
        label: t('OFFER_AUTOMATIC', 'This offer applies automatic'),
        value: null as string | null,
      }
      : null,
    offerSelected?.minimum
      ? {
        key: 'minimum',
        label: t('MINIMUM_PURCHASE_FOR_OFFER', 'Minimum purchase for use this offer'),
        value: parsePrice(offerSelected.minimum),
      }
      : null,
    offerSelected?.max_discount
      ? {
        key: 'max',
        label: t('MAX_DISCOUNT_ALLOWED', 'Max discount allowed'),
        value: parsePrice(offerSelected.max_discount),
      }
      : null,
  ].filter(Boolean) as Array<{ key: string; label: string; value: string | null }>

  useEffect(() => {
    if (refreshPromotions) {
      loadOffers()
      setRefreshPromotions && setRefreshPromotions(false)
    }
  }, [refreshPromotions])

  const renderSearch = () => (
    <SearchBarContainer>
      <OInput
        placeholder={t('SEARCH_OFFERS', 'Search offers')}
        onChange={handleSearch}
        isLazyLoad
        customIcon={PromotionsSearchIcon}
      />
    </SearchBarContainer>
  )

  const renderOffers = () => (
    <>
      {offersState?.loading && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {[...Array(5).keys()].map((_, i) => (
            <CouponCardSkeleton key={i} />
          ))}
        </ScrollView>
      )}
      {((!offersState?.loading && filteredOffers?.length === 0) || offersState?.error) && (
        <NotFoundSource
          iconName='pricetags-outline'
          content={offersState?.error || t('NO_PROMOTIONS_AVAILABLE', 'No promotions available right now')}
          subContent={!offersState?.error ? t('CHECK_BACK_LATER_OFFERS', 'Check back later for new offers in your area') : undefined}
        />
      )}
      {!offersState?.loading && offersState.offers?.length > 0 && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleOnRefresh} />
          }
          contentContainerStyle={styles.list}
        >
          {filteredOffers?.map((offer: any) => {
            const hasOfferImage = show.image && !!offer?.image && typeof offer?.image !== 'number'
            return (
              <WrapperSingleOffer key={offer.id} style={styles.box}>
                <SingleOfferContainer>
                  {show.expires && (
                    <OfferInformation>
                      <OText style={styles.expiry} numberOfLines={1} ellipsizeMode='tail'>
                        {t('EXPIRES', 'Expires')} {parseDate(offer?.end, { outputFormat: 'MMM DD, YYYY' })}
                      </OText>
                    </OfferInformation>
                  )}
                  <OfferTitleRow>
                    <OText style={styles.name} numberOfLines={2} ellipsizeMode='tail'>
                      {offer?.name}
                    </OText>
                    {hasOfferImage && (
                      <View style={styles.imageBox}>
                        <FastImage
                          style={styles.image}
                          source={{
                            uri: imageUrl(offer?.image, { height: styles.image.height }),
                            priority: FastImage.priority.normal,
                          }}
                        />
                      </View>
                    )}
                  </OfferTitleRow>
                </SingleOfferContainer>
                <View style={styles.divider} />
                <OButton
                  onClick={() => handleClickOffer(offer)}
                  text={t('VIEW', 'View')}
                  color={action.color}
                  appearance={action.appearance}
                  size={action.size}
                />
              </WrapperSingleOffer>
            )
          })}
        </ScrollView>
      )}
    </>
  )

  return (
    <PromotionsContainer>
      {render({
        search: renderSearch,
        offers: renderOffers
      })}
      <OModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={t('OFFER_DETAILS', 'Offer Details')}
      >
        <ScrollView showsVerticalScrollIndicator={false} style={styles.modal}>
          <OfferHero>
            {show.image && !!offerSelected?.image && (
              <View style={styles.modalImageBox}>
                <FastImage
                  style={styles.modalImage}
                  source={{
                    uri: imageUrl(offerSelected?.image, { width: Dimensions.get('window').width }),
                    priority: FastImage.priority.normal,
                  }}
                />
              </View>
            )}
            {show.expires && (
              <OText style={styles.expiry} align='center'>
                {t('EXPIRES', 'Expires')} {parseDate(offerSelected?.end, { outputFormat: 'MMM DD, YYYY' })}
              </OText>
            )}
            {!(
              offerSelected?.type === 2 &&
              !!offerSelected?.coupon &&
              offerSelected?.name?.trim()?.toLowerCase() === offerSelected?.coupon?.trim()?.toLowerCase()
            ) && (
                <OText style={styles.modalName}>
                  {offerSelected?.name}
                </OText>
              )}
          </OfferHero>

          <OfferValueChip style={styles.codeBox}>
            <OText style={styles.code}>
              {t('VALUE_OF_OFFER', 'Value of offer')}: {offerSelected?.rate_type === 1 ? `${offerSelected?.rate}%` : `${parsePrice(offerSelected?.rate)}`}
            </OText>
          </OfferValueChip>

          <OfferData>
            {offerSelected?.type === 2 && !!offerSelected?.coupon && (
              <Code>
                <CouponHighlight style={styles.codeBox}>
                  <OText preset='label' align='center' color='text_muted'>
                    {t('COUPON_CODE', 'Coupon code')}
                  </OText>
                  <CouponCodeBadge>
                    <OText preset='h2' weight='bold' style={styles.code}>
                      {offerSelected.coupon}
                    </OText>
                  </CouponCodeBadge>
                </CouponHighlight>
              </Code>
            )}

            {show.description && !!offerSelected?.description && (
              <OfferDescription>
                <OText style={styles.description}>
                  {offerSelected.description}
                </OText>
              </OfferDescription>
            )}

            {offerMetaRows.length > 0 && (
              <OfferMetaList>
                {offerMetaRows.map((row, index) => (
                  <OfferMetaRow key={row.key} $isLast={index === offerMetaRows.length - 1}>
                    <OText preset='body_sm' color='text_muted' mBottom={row.value ? 'xxs' : undefined}>
                      {row.label}
                    </OText>
                    {!!row.value && (
                      <OText preset='label'>
                        {row.value}
                      </OText>
                    )}
                  </OfferMetaRow>
                ))}
              </OfferMetaList>
            )}
          </OfferData>

          {show.applyFor && (
            <>
              <OText preset='label' style={styles.businesses}>
                {t('AVAILABLE_BUSINESSES_FOR_OFFER', 'Available businesses for this offer')}:
              </OText>
              <View style={styles.businessList}>
                {offerBusinesses.map((business: any) => {
                  return (
                    <SingleBusinessOffer key={business.id} style={styles.box}>
                      {!!business?.logo && (
                        <FastImage
                          style={styles.logo}
                          source={{
                            uri: imageUrl(business?.logo, { height: IMAGE_REQUEST.thumbnail }),
                            priority: FastImage.priority.normal,
                          }}
                          objectFit='cover'
                        />
                      )}
                      <BusinessInfo>
                        <OText style={{ flexShrink: 1 }} numberOfLines={2}>{business.name}</OText>
                        <OButton
                          size='sm'
                          onClick={() => handleBusinessClick(business)}
                          text={t('GO_TO_BUSINESSS', 'Go to business')}
                        />
                      </BusinessInfo>
                    </SingleBusinessOffer>
                  )
                })}
              </View>
            </>
          )}
        </ScrollView>
      </OModal>
    </PromotionsContainer>
  )
}

export const Promotions = (props: PromotionParams) => {
  const PromotionsProps = {
    ...props,
    UIComponent: PromotionsUI
  }

  return (
    <PromotionsController {...PromotionsProps} />
  )
}
