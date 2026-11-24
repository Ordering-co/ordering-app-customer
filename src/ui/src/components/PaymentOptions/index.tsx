import React, { useEffect, useMemo, useState } from 'react';
import { PayMethodIcon, payBrandMark } from '../PayMethodIcon'
import { FlatList, View, KeyboardAvoidingView, Platform, Image, StyleSheet } from 'react-native';
import { usePlatformPay } from '@stripe/stripe-react-native';
import { useTheme } from 'styled-components/native';
import {
  Placeholder,
  PlaceholderLine,
  Fade
} from "../shared/Skeleton";

import { PMContainer } from './styles'
import { FilterChip } from '../BusinessListingSearch/FilterChip'
import { BUNDLED_IMAGES } from '@/theme/bundledImages'
import { nativeBoxStyle, themeIconSize, themeSpace, themeVisible } from '@/theme/helpers'
import { PressableScale } from '../shared/PressableScale'

import {
  PaymentOptions as PaymentOptionsController,
  useLanguage,
  ToastType,
  useToast,
  useSession
} from '@components';

import {
  OText,
  OIcon,
  PaymentOptionCash,
  StripeElementsForm,
  StripeCardsList,
  PaymentOptionCard
} from '@ui';
import { isPaymethodAvailable } from '@/utils/nativeKeys'

const methodsPay = ['google_pay', 'apple_pay']
const stripeDirectMethods = ['stripe_direct']
const webViewPaymentGateway: any = ['paypal', 'square']
const multiCheckoutMethods = ['global_google_pay', 'global_apple_pay']
const cardsPaymethods = ['credomatic']
const stripeCardsMethods = ['stripe', 'stripe_connect_v2']
const guestNotSupportedMethods = ['stripe', 'stripe_connect', 'stripe_connect_v2', 'stripe_redirect']
const popupMethods = [...guestNotSupportedMethods, 'stripe_direct', 'paypal']

const getPaymethodCustomImageUri = (paymethod: any): string | null => {
  const raw = paymethod?.image
  if (raw == null || typeof raw !== 'string') return null
  const url = raw.trim()
  return url || null
}

const PaymentOptionsUI = (props: any) => {
  const {
    cart,
    errorCash,
    isLoading,
    isDisabled,
    paymethodData,
    paymethodsList,
    setPaymethodData,
    onNavigationRedirect,
    handlePaymethodClick,
    handlePaymethodDataChange,
    isOpenMethod,
    handlePaymentMethodClickCustom,
    handlePlaceOrder,
    handleOpenGuestSignup,
    merchantId,
    urlscheme,
    setMethodPaySupported,
    placeByMethodPay,
    methodPaySupported,
    setPlaceByMethodPay,
    setCardList,
    onPaymentChange,
    requiredFields,
    openUserModal,
    paymethodClicked,
    setPaymethodClicked,
    androidAppId,
    setUserHasCards,
    guestDisabledError,
    paymethodV2Featured,
    globalPayIFrameUrl,
    braintreeIFrameUrl,
    cybersourceIFrameUrl,
    createBusinessUserPaymethod,
    showGateway,
    setShowGateway
  } = props

  const theme: any = useTheme();
  const [, { showToast }] = useToast();
  const [{ user }] = useSession()
  const { confirmPlatformPayPayment } = usePlatformPay()


  const [, t] = useLanguage();

  // A method is a `chip` (its resting and selected inks); the image marks keep the `choice` border.
  const chip = theme.native.components.chip
  const showLogo = themeVisible(theme, 'checkout.payment_methods.logo')
  const styles = useMemo(() => {
    const look = theme.native.components.choice
    const selected = look.variants.default.states.selected
    return StyleSheet.create({
      // The image tiles (merchant image, Apple/Google Pay marks): a fixed 70 pt square of the list.
      imageTile: { width: 70, height: 70, borderRadius: look.base.radius, borderWidth: 0 },
      // One row from the page's start edge, as every row of chips.
      methods: { gap: themeSpace(theme, 'sm'), paddingVertical: themeSpace(theme, 'sm'), alignItems: 'center' },
      imageTileSelected: { ...nativeBoxStyle({ border: selected.border }) },
      skeletonRow: { flexDirection: 'row', marginTop: themeSpace(theme, 'sm') },
      skeleton: { borderRadius: theme.native.components.skeleton.base.radius, marginEnd: themeSpace(theme, 'sm') },
      stripeDirect: { marginTop: themeSpace(theme, 'lg') },
    })
  }, [theme])

  const [addCardOpen, setAddCardOpen] = useState({ stripe: false, stripeConnect: false, card: false });
  const paymethodSelected = props.paySelected || props.paymethodSelected || isOpenMethod?.paymethod
  // The cards list shows for the method being picked, or for the one the cart already has when none is open
  const cardsPaymethod = isOpenMethod?.paymethod ?? paymethodSelected?.paymethod ?? paymethodSelected
  const stripeCardsPaymethod = stripeCardsMethods.includes(cardsPaymethod?.gateway) ? cardsPaymethod : null

  const paymethodsFieldRequired = ['paypal', 'apple_pay', 'global_apple_pay']

  const handlePaymentMethodClick = (paymethod: any) => {
    const _guestNotSupportedMethods = guestDisabledError ? popupMethods : guestNotSupportedMethods
    if (handleOpenGuestSignup && _guestNotSupportedMethods.includes(paymethod?.gateway) && !!user?.guest_id) {
      handleOpenGuestSignup()
      return
    }
    if (cart?.balance > 0 || !!user?.guest_id) {
      if (paymethodsFieldRequired.includes(paymethod?.gateway) && requiredFields.length > 0) {
        openUserModal && openUserModal(true)
        setPaymethodClicked({
          confirmed: false,
          paymethod
        })
        return
      }
      const isPopupMethod = ['stripe', 'stripe_direct', 'stripe_connect', 'stripe_connect_v2', 'stripe_redirect', 'paypal'].includes(paymethod?.gateway)
      if (webViewPaymentGateway.includes(paymethod?.gateway)) {
        handlePaymentMethodClickCustom(paymethod)
      }
      handlePaymethodClick(paymethod, isPopupMethod)
      return
    }
    showToast(
      ToastType.Error,
      t('CART_BALANCE_ZERO', 'Sorry, the amount to pay is equal to zero and it is not necessary to select a payment method'))
      ;
  }

  useEffect(() => {
    if (cart?.balance === 0) {
      handlePaymethodClick(null)
    }
  }, [cart?.balance])

  useEffect(() => {
    if (paymethodsList.paymethods.length === 1) {
      handlePaymethodClick && handlePaymethodClick(paymethodsList.paymethods[0])
    }
  }, [paymethodsList.paymethods])

  useEffect(() => {
    if (paymethodSelected?.gateway !== 'cash' && errorCash) {
      props.setErrorCash(false)
    }
  }, [paymethodSelected])

  useEffect(() => {
    if (props.paySelected && props.paySelected?.data) {
      requestAnimationFrame(() => {
        setPaymethodData && setPaymethodData(props.paySelected?.data)
      })
    }
  }, [props.paySelected])

  useEffect(() => {
    if (methodsPay.includes(paymethodSelected?.gateway) && paymethodData?.id && paymethodSelected?.data?.card) {
      handlePlaceOrder(confirmPlatformPayPayment)
    }
  }, [paymethodData, paymethodSelected])

  useEffect(() => {
    if (paymethodClicked?.confirmed) {
      handlePaymentMethodClickCustom(paymethodClicked?.paymethod)
    }
  }, [paymethodClicked?.confirmed])


  const renderPaymethods = ({ item }: any) => {
    const customImageUri = getPaymethodCustomImageUri(item)
    const isSelected = paymethodSelected?.id === item.id
    const ink = isSelected ? chip.variants.default.states.selected.color : chip.base.color
    return (
      <>
        {(customImageUri || methodsPay.includes(item?.gateway)) ? (
          <PressableScale
            onPress={() => handlePaymentMethodClick(item)}
            disabled={isDisabled}
          >
            {customImageUri ? (
              <Image
                source={{ uri: customImageUri }}
                style={[styles.imageTile, isSelected && styles.imageTileSelected]}
                resizeMode="contain"
              />
            ) : (
              <Image
                source={payBrandMark(item.gateway)}
                style={[styles.imageTile, isSelected && styles.imageTileSelected]}
                resizeMode="contain"
              />
            )}
          </PressableScale>
        ) : (
          // A method is the app's chip, as in the multi checkout: icon and name, its selected state.
          <FilterChip
            size='md'
            text={t(item?.gateway?.toUpperCase(), item.name)}
            selected={isSelected}
            disabled={isDisabled}
            leading={showLogo
              ? <PayMethodIcon gateway={item.gateway} size={themeIconSize(theme, 'md')} color={ink} />
              : undefined}
            onPress={() => handlePaymentMethodClick(item)}
          />
        )}
      </>

    )
  }

  const excludeIds: any = [32]; //exclude paypal & connect & redirect
  // Apple Pay also needs the app's merchant id (src/utils/nativeKeys.ts).
  const filterMethodsPay = (gateway: string) => isPaymethodAvailable(gateway, merchantId) && (Platform.OS === 'ios'
    ? !['google_pay', 'google_pay_braintree'].includes(gateway)
    : !['apple_pay', 'apple_pay_braintree'].includes(gateway))
  const visiblePaymethods = paymethodsList.paymethods
    .sort((a: any, b: any) => a.id - b.id)
    .filter((p: any) =>
      !multiCheckoutMethods.includes(p.gateway) &&
      filterMethodsPay(p.gateway) &&
      !excludeIds.includes(p.id))

  return (
    <PMContainer>
      {visiblePaymethods.length > 0 && (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.methods}
          data={visiblePaymethods}
          renderItem={renderPaymethods}
          keyExtractor={(paymethod: any) => paymethod?.id?.toString?.()}
        />
      )}

      {(paymethodsList.loading || isLoading) && (
        <Placeholder Animation={Fade}>
          <View style={styles.skeletonRow}>
            {[...Array(3)].map((_, i) => (
              <PlaceholderLine
                key={i}
                width={37}
                height={80}
                noMargin
                style={styles.skeleton}
              />
            ))}
          </View>
        </Placeholder>
      )}

      {paymethodsList.error && paymethodsList.error.length > 0 && (
        <OText preset='body_sm'>
          {paymethodsList?.error[0]?.message || paymethodsList?.error[0]}
        </OText>
      )}

      {!(paymethodsList.loading || isLoading) &&
        !paymethodsList.error &&
        (!paymethodsList?.paymethods || paymethodsList.paymethods.length === 0) &&
        (
          <OText preset='body_sm'>
            {t('NO_PAYMENT_METHODS', 'No payment methods!')}
          </OText>
        )}

      {paymethodSelected?.gateway === 'cash' && (
        <PaymentOptionCash
          orderTotal={cart.balance ?? cart.total}
          defaultValue={paymethodSelected?.data?.cash}
          onChangeData={handlePaymethodDataChange}
          setErrorCash={props.setErrorCash}
        />
      )}

      {/* Stripe, Stripe Connect v2 */}
      {stripeCardsPaymethod && (
        <View>
          <StripeCardsList
            key={stripeCardsPaymethod.gateway}
            gateway={stripeCardsPaymethod.gateway}
            toSave
            paymethod={stripeCardsPaymethod}
            businessId={props.businessId}
            publicKey={props.publicKey || stripeCardsPaymethod.credentials?.publishable}
            payType={paymethodsList?.name}
            onSelectCard={handlePaymethodDataChange}
            onNavigationRedirect={onNavigationRedirect}
            paymethodCardId={paymethodData?.id}
            onCancel={() => {
              handlePaymethodClick(null)
              setAddCardOpen({ ...addCardOpen, stripe: false })
            }}
            setAddCardOpen={setAddCardOpen}
            addCardOpen={addCardOpen}
            isOpenMethod={isOpenMethod}
            handleSource={handlePaymethodDataChange}
            clientSecret={props.clientSecret}
            onPaymentChange={onPaymentChange}
            paySelected={props.paySelected}
            setUserHasCards={setUserHasCards}
            openCarts={props.openCarts}
            businessIds={props.businessIds}
            setCardsList={setCardList}
            requirements={props.clientSecret}
            publicKeyAddCard={
              stripeCardsPaymethod.credentials?.stripe?.publishable ||
              stripeCardsPaymethod.credentials?.publishable
            }
          />
        </View>
      )}
      {/* Google pay, Apple pay */}
      {methodsPay.includes(isOpenMethod?.paymethod?.gateway) && (
        <StripeElementsForm
          cart={cart}
          paymethod={isOpenMethod?.paymethod?.gateway}
          methodsPay={methodsPay}
          businessId={props.businessId}
          publicKey={isOpenMethod?.paymethod?.credentials?.publishable || isOpenMethod?.paymethod?.credentials?.publishable_key}
          handleSource={handlePaymethodDataChange}
          onCancel={() => handlePaymethodClick(null)}
          merchantId={merchantId}
          urlscheme={urlscheme}
          androidAppId={androidAppId}
          setMethodPaySupported={setMethodPaySupported}
          methodPaySupported={methodPaySupported}
          placeByMethodPay={placeByMethodPay}
          setPlaceByMethodPay={setPlaceByMethodPay}
          publicKeyAddCard={isOpenMethod?.paymethod?.credentials?.stripe?.publishable || isOpenMethod?.paymethod?.credentials?.publishable}
        />
      )}

      {(cardsPaymethods.includes(isOpenMethod?.paymethod?.gateway) ||
        cardsPaymethods.includes(paymethodSelected?.gateway) ||
        paymethodV2Featured.includes('get_cards')) && (
          <PaymentOptionCard
            setCardList={setCardList}
            paymethodSelectedInfo={paymethodSelected}
            paymethod={isOpenMethod?.paymethod}
            businessId={props.businessId}
            publicKey={isOpenMethod?.paymethod?.credentials?.publishable}
            gateway={isOpenMethod?.paymethod?.gateway || paymethodSelected?.gateway}
            onPaymentChange={onPaymentChange}
            payType={isOpenMethod?.paymethod?.name}
            onSelectCard={handlePaymethodDataChange}
            addCardOpen={addCardOpen}
            setAddCardOpen={setAddCardOpen}
            onCancel={() => handlePaymethodClick(null)}
            paymethodSelected={paymethodSelected?.data?.id}
            handlePaymentMethodClick={handlePaymentMethodClick}
            paymethodV2Featured={paymethodV2Featured}
            globalPayIFrameUrl={globalPayIFrameUrl}
            braintreeIFrameUrl={braintreeIFrameUrl}
            cybersourceIFrameUrl={cybersourceIFrameUrl}
            createBusinessUserPaymethod={createBusinessUserPaymethod}
            showGateway={showGateway}
            setShowGateway={setShowGateway}
          />
        )}

      {/* Stripe direct */}
      {stripeDirectMethods?.includes(isOpenMethod?.paymethod?.gateway) && !paymethodData.id && (
        <KeyboardAvoidingView
          behavior={Platform.OS == 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS == 'ios' ? 0 : 0}
          enabled={Platform.OS === 'ios' ? true : false}
          style={styles.stripeDirect}
        >
          <StripeElementsForm
            cart={cart}
            paymethod={isOpenMethod?.paymethod?.gateway}
            methodsPay={methodsPay}
            businessId={props.businessId}
            publicKey={isOpenMethod?.paymethod?.credentials?.publishable || isOpenMethod?.paymethod?.credentials?.publishable_key}
            handleSource={handlePaymethodDataChange}
            onCancel={() => handlePaymethodClick(null)}
            merchantId={merchantId}
            urlscheme={urlscheme}
            androidAppId={androidAppId}
            publicKeyAddCard={isOpenMethod?.paymethod?.credentials?.stripe?.publishable || isOpenMethod?.paymethod?.credentials?.publishable}
            paySelected={props.paySelected}
          />
        </KeyboardAvoidingView>
      )}

      {/* Stripe Connect */}
      {isOpenMethod?.paymethod?.gateway === 'stripe_connect' && (
        <StripeCardsList
          toSave
          gateway="stripe_connect"
          paymethod={isOpenMethod?.paymethod}
          openCarts={props.openCarts}
          businessId={props.businessId}
          payType={paymethodsList?.name}
          onSelectCard={handlePaymethodDataChange}
          onNavigationRedirect={onNavigationRedirect}
          onCancel={() => {
            handlePaymethodClick(null)
            setAddCardOpen({ ...addCardOpen, stripeConnect: false })
          }}
          publicKeyAddCard={isOpenMethod?.paymethod?.credentials?.stripe?.publishable || isOpenMethod?.paymethod?.credentials?.publishable}
          paySelected={props.paySelected}
          setUserHasCards={setUserHasCards}
          accountId={isOpenMethod?.paymethod?.credentials?.user}
        />
      )}
    </PMContainer>
  )
}

export const PaymentOptions = (props: any) => {
  const paymentOptions = {
    ...props,
    UIComponent: PaymentOptionsUI
  }
  return (
    <PaymentOptionsController {...paymentOptions} />
  )
}
