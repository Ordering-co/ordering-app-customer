import React, { useEffect, useState } from 'react'
import { PayMethodIcon, payBrandMark } from '../PayMethodIcon'
import { FlatList, StyleSheet, Platform } from 'react-native'
import { FilterChip } from '../BusinessListingSearch/FilterChip'
import { WalletRow } from '../PaymentOptionWallet/WalletRow'
import { Placeholder, PlaceholderLine, Fade } from '@/ui/src/components/shared/Skeleton'
import { usePlatformPay } from '@stripe/stripe-react-native';
import { useTheme } from 'styled-components/native'
import { nativeTextStyle, themeSpace, themeVisible } from '@/theme/helpers'
import { BUNDLED_IMAGES } from '@/theme/bundledImages'

import {
  PayMark,
  PMContainer,
  SkeletonBox,
  SkeletonRow
} from './styles'
import { PressableScale } from '../shared/PressableScale'

import {
  useLanguage,
  useConfig,
  useUtils,
  useToast,
  ToastType,
  MultiCartsPaymethodsAndWallets as MultiCartsPaymethodsAndWalletsController
} from '@components'

import {
  StripeElementsForm,
  StripeCardsList,
  OText,
  OIcon
} from '@ui'

import { getPaymethodDataSourceId } from './getPaymethodDataSourceId'
import { isPaymethodAvailable } from '@/utils/nativeKeys'

const MultiCartsPaymethodsAndWalletsUI = (props: any) => {
  const {
    businessIds,
    paymethodsAndWallets,
    walletsState,
    walletsPaymethod,
    paymethodSelected,
    handleSelectPaymethod,
    handleSelectWallet,
    handlePaymethodDataChange,
    setMethodPaySupported,
    placeByMethodPay,
    methodPaySupported,
    setPlaceByMethodPay,
    openCarts,
    cartTotal,
    handlePlaceOrder,
    merchantId,
    cartGroup
  } = props

  const theme: any = useTheme()
  const [, t] = useLanguage()
  const styles = React.useMemo(() => {
    const choice = theme.native.components.choice
    const multi = theme.native.components.checkout
    return StyleSheet.create({
      title: { ...nativeTextStyle(multi.variants.multi.section_title), color: multi.base.section_title_color },
      chipText: { ...nativeTextStyle(choice.base.text), color: choice.base.color },
      chipTextSelected: { color: choice.variants.default.states.selected.color },
      skeleton: { borderRadius: theme.native.components.skeleton.base.radius, marginRight: choice.base.gap },
      walletSkeleton: { marginBottom: themeSpace(theme, 'sm') },
      methods: { gap: themeSpace(theme, 'sm'), paddingVertical: themeSpace(theme, 'sm'), alignItems: 'center' }
    })
  }, [theme])
  const chipInk = { rest: theme.native.components.chip.base.color, selected: theme.native.components.chip.variants.default.states.selected.color }
  const [{ configs }] = useConfig()
  const [{ parsePrice }] = useUtils()
  const [, { showToast }] = useToast();
  const { confirmPlatformPayPayment } = usePlatformPay()

  const [addCardOpen, setAddCardOpen] = useState({ stripe: false, stripeConnect: false });
  const [newCardAdded, setNewCardAdded] = useState(null)
  const isWalletCashEnabled = configs?.wallet_cash_enabled?.value === '1'
  const isWalletPointsEnabled = configs?.wallet_credit_point_enabled?.value === '1'

  const walletName: any = {
    cash: {
      name: t('PAY_WITH_CASH_WALLET', 'Pay with Cash Wallet'),
      isActive: isWalletCashEnabled
    },
    credit_point: {
      name: t('PAY_WITH_CREDITS_POINTS_WALLET', 'Pay with Credit Points Wallet'),
      isActive: isWalletPointsEnabled
    }
  }

  const creditBalance: any = (wallet: any) => ` = ${parsePrice(wallet.balance / wallet.redemption_rate, { isTruncable: true })}`
  // Apple Pay also needs the app's merchant id (src/utils/nativeKeys.ts).
  const filterMethodsPay = (gateway: string) => isPaymethodAvailable(gateway, merchantId) && (Platform.OS === 'ios'
    ? !['global_google_pay', 'google_pay_braintree'].includes(gateway)
    : !['global_apple_pay', 'apple_pay_braintree'].includes(gateway))
  const methodsPay = ['global_google_pay', 'global_apple_pay']


  useEffect(() => {
    if (!methodsPay.includes(paymethodSelected?.gateway)) return
    const sourceId = getPaymethodDataSourceId(paymethodSelected?.paymethod_data)
    sourceId && handlePlaceOrder(confirmPlatformPayPayment)
  }, [JSON.stringify(paymethodSelected)])

  useEffect(() => {
    if (cartTotal === 0) {
      handlePaymethodDataChange(null)
      handleSelectPaymethod(null)
    }
  }, [cartTotal])

  const handleChangePaymethod = (paymethod: any) => {
    if (cartTotal > 0) {
      handleSelectPaymethod(paymethod)
      return
    }
    showToast(
      ToastType.Error,
      t('CART_BALANCE_ZERO', 'Sorry, the amount to pay is equal to zero and it is not necessary to select a payment method'))
      ;
  }

  const renderPaymethods = ({ item }: any) => {
    const isSelected = paymethodSelected?.id === item.id
    const isIncomplete = cartGroup?.result?.status === 'payment_incomplete'
    return (
      <>
        {methodsPay.includes(item?.gateway) ? (
          <PressableScale
            onPress={() => handleChangePaymethod({ ...item, paymethod: { gateway: item.gateway }, paymethod_id: item?.id })}
          >
            <PayMark>
              <OIcon
                src={payBrandMark(item.gateway)}
                width={70}
                height={70}
              />
            </PayMark>
          </PressableScale>
        ) : (
          // A method is the app's chip (the filters' and the tips'): icon and name, its selected state.
          <FilterChip
            size='md'
            text={t(item?.gateway.toUpperCase(), item?.name)}
            selected={isSelected}
            disabled={isIncomplete}
            leading={(
              <PayMethodIcon
                gateway={item?.gateway ?? item.paymethod?.gateway}
                size={theme.native.tokens.icon.md}
                color={isSelected ? chipInk.selected : chipInk.rest}
              />
            )}
            onPress={() => handleChangePaymethod({ ...item, paymethod: { gateway: item.gateway }, paymethod_id: item?.id })}
          />
        )}
      </>
    )
  }

  return (
    <PMContainer>
      <OText style={styles.title}>
        {t('PAYMENT_METHODS', 'Payment Methods')}
      </OText>
      {paymethodsAndWallets.loading ? (
        <SkeletonBox>
          <Placeholder Animation={Fade}>
            <SkeletonRow>
              {[...Array(3)].map((_, i) => (
                <PlaceholderLine
                  key={i}
                  width={37}
                  height={80}
                  noMargin
                  style={styles.skeleton}
                />
              ))}
            </SkeletonRow>
          </Placeholder>
        </SkeletonBox>
      ) : (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.methods}
          data={paymethodsAndWallets.paymethods.filter((p: any) => filterMethodsPay(p.gateway))}
          renderItem={renderPaymethods}
          keyExtractor={(paymethod: any) => paymethod?.id?.toString?.()}
        />
      )}
      {!paymethodsAndWallets.loading && !paymethodsAndWallets.error && paymethodsAndWallets.paymethods.length === 0 && (
        <OText preset='body_sm'>
          {t('NO_PAYMENT_METHODS', 'No payment methods!')}
        </OText>
      )}

      {paymethodSelected?.paymethod?.gateway === 'stripe' && (
        <StripeCardsList
          toSave
          paymethod={paymethodSelected?.paymethod}
          businessId={businessIds[0]}
          businessIds={businessIds}
          publicKey={paymethodSelected?.data?.publishable}
          payType={paymethodSelected?.paymethod?.name}
          onSelectCard={handlePaymethodDataChange}
          addCardOpen={addCardOpen}
          setAddCardOpen={setAddCardOpen}
          openCarts={openCarts}
          handlePaymethodDataChange={handlePaymethodDataChange}
          clientSecret={props.clientSecret}
          onPaymentChange={handlePaymethodDataChange}
          newCardAdded={newCardAdded}
          setNewCardAdded={setNewCardAdded}
          addNewCardAsDefault
        />
      )}

      {/* Google pay, Apple pay */}
      {methodsPay.includes(paymethodSelected?.paymethod?.gateway) && (
        <StripeElementsForm
          toSave
          businessId={businessIds[0]}
          businessIds={businessIds}
          businessNames={openCarts?.map?.((cart: any) => cart?.business?.name)}
          publicKey={paymethodSelected?.data?.publishable}
          requirements={props.clientSecret}
          handleSource={handlePaymethodDataChange}
          onCancel={() => setAddCardOpen({ ...addCardOpen, stripe: false })}
          setMethodPaySupported={setMethodPaySupported}
          methodPaySupported={methodPaySupported}
          placeByMethodPay={placeByMethodPay}
          setPlaceByMethodPay={setPlaceByMethodPay}
          methodsPay={methodsPay}
          paymethod={paymethodSelected?.paymethod?.gateway}
          cartTotal={cartTotal}
          merchantId={merchantId}
        />
      )}

      {(paymethodsAndWallets.loading || walletsState.loading) ? (
        <>
          {[...Array(2).keys()].map(i => (
            <PlaceholderLine
              key={i}
              height={40}
              noMargin
              style={styles.walletSkeleton}
            />
          ))}
        </>
      ) : (
        <>
          {walletsState?.result?.filter((wallet: any) =>
            paymethodsAndWallets.wallets.find((item: any) => item.type === wallet.type))
            .map((wallet: any) => walletName[wallet.type]?.isActive &&
              (
                <WalletRow
                  key={wallet.type}
                  type={wallet.type}
                  name={walletName[wallet.type]?.name}
                  checked={!!walletsPaymethod?.find((walletPay: any) => walletPay.wallet_id === wallet.id)?.id}
                  disabled={cartGroup?.result?.status === 'payment_incomplete'}
                  hideCheckbox={cartGroup?.result?.status === 'payment_incomplete'}
                  onPress={() => handleSelectWallet(!walletsPaymethod?.find((walletPay: any) => walletPay.wallet_id === wallet.id)?.id, wallet)}
                  balance={wallet.type === 'cash'
                    ? parsePrice(wallet?.balance, { isTruncable: true })
                    : (
                      <>
                        <OText color='primary_text' weight={700}>
                          {`${wallet?.balance} ${t('POINTS', 'Points')}`}
                        </OText>
                        {wallet?.balance > 0 && themeVisible(theme, 'checkout.wallet.points_equivalence')
                          ? creditBalance(wallet)
                          : null}
                      </>
                    )}
                />
              ))}
        </>
      )}
    </PMContainer>
  )
}

export const MultiCartsPaymethodsAndWallets = (props: any) => {
  const multiCartsPaymethodsAndWalletsProps = {
    ...props,
    UIComponent: MultiCartsPaymethodsAndWalletsUI
  }
  return <MultiCartsPaymethodsAndWalletsController {...multiCartsPaymethodsAndWalletsProps} />
}
