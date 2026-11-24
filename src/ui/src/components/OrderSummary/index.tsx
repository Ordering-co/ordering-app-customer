import React, { useState, useRef, useMemo } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, View } from 'react-native'
import { useTheme } from 'styled-components/native';

import {
  OSContainer,
  OSProductList,
  OSBill,
  OSTable,
  OSRow,
  OSCoupon,
  OSTotalRule,
  BillToggle,
  BillToggleIcon,
  BillLabelRow,
  BillStrikeRow,
  ClearCartWrapper,
  ClearCartButton,
  ClearCartSlot,
  CommentsBox,
  CommentsSpinner,
  TaxesFeesDetail
} from './styles';
import { BillText, BillInfoButton, BillRemoveIcon, BILL_HIT_SLOP } from './BillText'
import { RewardsBanner } from '../RewardsBanner'
import Icon from '../shared/Icon'
import { themePart, themeSpace, themeVisible } from '@/theme/helpers'

import {
  Cart,
  useOrder,
  useLanguage,
  useUtils,
  useConfig
} from '@components';

import { verifyDecimals, capitalize } from '../../utils';
import { deleteCartProduct } from '../../../../utils/giftCardCart'
import {
  ProductItemAccordion,
  CouponControl,
  TaxInformation,
  MomentOption,
  OInput, OModal, OText, OAlert
} from '@ui'
import OButton from '../shared/OButton'

const deliveryTypes = [1, 7]
// The comments box is a textarea: its height is layout, not a theme size.
const COMMENTS_HEIGHT = 120
const COMMENTS_INPUT_HEIGHT = 100

// Layout only (no theme values): safe at module level.
const fixed = StyleSheet.create({
  strike: { textDecorationLine: 'line-through' },
  topAligned: { alignItems: 'flex-start' }
})

const OfferAlert = ({ offerId, onRemove }: any) => {
  const [, t] = useLanguage();
  return (
    <OAlert
      title={t('OFFER', 'Offer')}
      message={t('QUESTION_DELETE_OFFER', 'Are you sure that you want to delete the offer?')}
      onAccept={() => onRemove(offerId)}
    >
      <BillRemoveIcon />
    </OAlert>
  )
}

export const OrderSummaryUI = (props: any) => {
  const {
    changeQuantity,
    getProductMax,
    offsetDisabled,
    removeProduct,
    isCartPending,
    isFromCheckout,
    commentState,
    handleChangeComment,
    onNavigationRedirect,
    handleRemoveOfferClick,
    preorderSlotInterval,
    preorderLeadTime,
    preorderTimeRange,
    preorderMaximumDays,
    preorderMinimumDays,
    cateringTypes,
    hideDeliveryFee,
    loyaltyRewardRate,
    cashRewardRate,
    maxDate,
    hideTotal,
    clearCart,
    hideProducts,
    showOnlyProducts,
    hideCommentsByValidationCheckout,
    hideCouponByValidationCheckout,
    onCommentFocus,
    isCommentRequired
  } = props;

  const theme: any = useTheme()
  const clearSlot = themePart(theme, 'cart', 'slots.clear_page')
  const styles = useMemo(() => StyleSheet.create({
    comments: {
      alignItems: 'flex-start',
      width: '100%',
      height: COMMENTS_HEIGHT,
      maxHeight: COMMENTS_HEIGHT,
      paddingRight: themeSpace(theme, 'xxxl')
    },
    commentsInput: {
      height: COMMENTS_INPUT_HEIGHT,
      maxHeight: COMMENTS_INPUT_HEIGHT,
      textAlignVertical: 'top',
      paddingTop: themeSpace(theme, 'sm')
    }
  }), [theme])
  const [, t] = useLanguage();
  const [{ configs }] = useConfig();
  const [orderState] = useOrder();
  const [{ parsePrice, parseNumber }] = useUtils();
  const commentRef = useRef<any>(null)
  const [openTaxModal, setOpenTaxModal] = useState<any>({ open: false, data: null, type: '' })
  const [showTaxesFeesDetail, setShowTaxesFeesDetail] = useState(false)
  // `visibility.cart.taxes_detail`: without it, only the total of taxes and fees.
  const withTaxesDetail = themeVisible(theme, 'cart.taxes_detail')
  const hideCartDiscount = hideCouponByValidationCheckout
  // `checkout.comments` hides the notes box, never when the field is required.
  const hideCartComments = hideCommentsByValidationCheckout || (!isCommentRequired && !themeVisible(theme, 'checkout.comments'))

  const cart = orderState?.carts?.[`businessId:${props.cart.business_id}`]
  const extraValueMetafields = cart?.metafields?.filter?.((meta: any) => meta?.key?.startsWith('extra_value_')) || []

  const productTaxesList = cart?.taxes?.filter((tax: any) => tax.type === 2 && tax?.rate !== 0 && tax?.target === 'product') || []
  const feesList = cart?.fees?.filter((fee: any) => !(fee.fixed === 0 && fee.percentage === 0)) || []
  const taxesAndFeesTotal =
    productTaxesList.reduce((acc: number, tax: any) => acc + (tax?.summary?.tax_after_discount ?? tax?.summary?.tax ?? 0), 0) +
    feesList.reduce((acc: number, fee: any) => acc + (fee?.summary?.amount ?? (fee?.summary?.fixed + (fee?.summary?.percentage_after_discount ?? fee?.summary?.percentage))), 0)

  const walletName: any = {
    cash: {
      name: t('PAY_WITH_CASH_WALLET', 'Pay with Cash Wallet'),
    },
    credit_point: {
      name: t('PAY_WITH_CREDITS_POINTS_WALLET', 'Pay with Credit Points Wallet'),
    }
  }

  const getIncludedTaxes = (isDeliveryFee?: boolean) => {
    if (cart?.taxes === null || !cart?.taxes) {
      return cart?.business?.tax_type === 1 ? cart?.tax : 0
    } else {
      return cart?.taxes.reduce((taxIncluded: number, tax: any) => {
        return taxIncluded +
          (((!isDeliveryFee && tax.type === 1 && tax.target === 'product') ||
            (isDeliveryFee && tax.type === 1 && tax.target === 'delivery_fee')) ? tax.summary?.tax : 0)
      }, 0)
    }
  }

  const clearAmount = (value: any) => parseFloat((Math.trunc(value * 100) / 100).toFixed(configs.format_number_decimal_length?.value ?? 2))
  const deliveryTotalForFreeCheck = clearAmount(
    (Number(cart?.delivery_price_with_discount ?? cart?.delivery_price) || 0) + getIncludedTaxes(true),
  )
  const freeDeliveryMetaRaw = cart?.metafields?.find?.((m: any) => m?.key === 'extra_value_free_delivery')?.value
  const parsedFreeDeliveryMeta = freeDeliveryMetaRaw != null ? Number(freeDeliveryMetaRaw) : NaN
  const isDeliveryFreeViaMetafield =
    deliveryTotalForFreeCheck > 0 &&
    Number.isFinite(parsedFreeDeliveryMeta) &&
    clearAmount(parsedFreeDeliveryMeta + deliveryTotalForFreeCheck) === 0

  const rawFreeDeliveryPartnerName = cart?.metafields?.find?.((m: any) => m?.key === 'free_delivery_partner_name')?.value
  const freeDeliveryPartnerName = ((): string => {
    if (rawFreeDeliveryPartnerName == null || rawFreeDeliveryPartnerName === '') return ''
    if (typeof rawFreeDeliveryPartnerName === 'string') {
      try {
        const parsed = JSON.parse(rawFreeDeliveryPartnerName)
        return typeof parsed === 'string' ? parsed.trim() : String(parsed).trim()
      } catch {
        return rawFreeDeliveryPartnerName.trim()
      }
    }
    return String(rawFreeDeliveryPartnerName).trim()
  })()
  const freeDeliveryFeeTooltipMessage = isDeliveryFreeViaMetafield
    ? (freeDeliveryPartnerName
      ? t('FREE_DELIVERY_FOR', 'Free delivery for') + ' ' + freeDeliveryPartnerName + ' ' + t('CARDHOLDERS', 'Cardholders')
      : t('FREE_DELIVERY', 'Free delivery'))
    : ''

  const loyaltyRewardValue = clearAmount((cart?.subtotal + getIncludedTaxes()) * loyaltyRewardRate)
  const isDisabledRewards = configs?.disabled_rewards?.value === '1'
  const showLoyaltyReward = !isDisabledRewards && !!loyaltyRewardValue && isFinite(loyaltyRewardValue)
  // The cashback this order earns, as the web's checkout computes it.
  const cashRewardValue = clearAmount((cart?.subtotal + getIncludedTaxes()) * (cashRewardRate ?? 0))
  const showCashReward = !isDisabledRewards && !!cashRewardValue && isFinite(cashRewardValue)

  const handleDeleteClick = (product: any) => {
    deleteCartProduct({
      cart,
      product,
      removeProduct,
      clearCart
    })
  }

  const handleEditProduct = (product: any) => {
    onNavigationRedirect('ProductDetails', {
      isCartProduct: true,
      productCart: product,
      businessSlug: cart?.business?.slug,
      businessId: cart?.business_id,
      categoryId: product?.category_id,
      productId: product?.id,
      isFromCheckout: isFromCheckout,
    })
  }

  const handleClearProducts = async () => {
    try {
      await clearCart(cart?.uuid)
    } catch { }
  }

  const getIncludedTaxesDiscounts = () => {
    return cart?.taxes?.filter((tax: any) => (tax?.type === 1 && tax?.target === 'product'))?.reduce((carry: number, tax: any) => carry + (tax?.summary?.tax_after_discount ?? tax?.summary?.tax), 0)
  }

  return (
    <OSContainer>
      {cart?.products?.length > 0 && (
        <>
          {!hideProducts && (
            <OSProductList>
              {cart?.products?.map((product: any) => (
                <ProductItemAccordion
                  key={product.code}
                  product={product}
                  isCartProductView={props.isCartProductView}
                  isCartPending={isCartPending}
                  isCartProduct
                  changeQuantity={changeQuantity}
                  getProductMax={getProductMax}
                  offsetDisabled={offsetDisabled}
                  onDeleteProduct={handleDeleteClick}
                  onEditProduct={handleEditProduct}
                  isFromCheckout={isFromCheckout}
                  isDisabledEdit={!cart?.business_id}
                />
              ))}
            </OSProductList>
          )}
          {showOnlyProducts && (
            <ClearCartWrapper>
              <OAlert
                title={t('CLEAR_CART', 'Clear Cart')}
                message={t('QUESTION_CLEAR_CART', 'Are you sure that you want to clear the cart?')}
                onAccept={() => handleClearProducts()}
              >
                {clearSlot.appearance ? (
                  <ClearCartSlot pointerEvents='none'>
                    <OButton
                      text={t('CLEAR_CART', 'Clear Cart')}
                      color={clearSlot.color}
                      appearance={clearSlot.appearance}
                      size={clearSlot.size}
                    />
                  </ClearCartSlot>
                ) : (
                  <ClearCartButton>
                    <OText preset='body_lg' color='danger_text' weight={600}>
                      {t('CLEAR_CART', 'Clear Cart')}
                    </OText>
                  </ClearCartButton>
                )}
              </OAlert>
            </ClearCartWrapper>
          )}
          {!showOnlyProducts && (
            <>
              {cart?.valid && (
                <OSBill>
                  <OSTable>
                    <BillText>{t('SUBTOTAL', 'Subtotal')}</BillText>
                    <BillText>
                      {parsePrice(cart?.subtotal + getIncludedTaxes())}
                    </BillText>
                  </OSTable>
                  {cart?.discount > 0 && cart?.total >= 0 && cart?.offers?.length === 0 && (
                    <OSTable>
                      {cart?.discount_type === 1 ? (
                        <BillText>
                          {t('DISCOUNT', 'Discount')}
                          <BillText>{`(${verifyDecimals(cart?.discount_rate, parsePrice)}%)`}</BillText>
                        </BillText>
                      ) : (
                        <BillText>{t('DISCOUNT', 'Discount')}</BillText>
                      )}
                      <BillText>- {parsePrice(cart?.discount || 0)}</BillText>
                    </OSTable>
                  )}
                  {
                    cart?.offers?.length > 0 && cart?.offers?.filter((offer: any) => offer?.target === 1)?.map((offer: any) => (
                      <OSTable key={offer.id}>
                        <OSRow>
                          <BillText>{offer.name}</BillText>
                          {offer.rate_type === 1 && (
                            <BillText>{`(${verifyDecimals(offer?.rate, parsePrice)}%)`}</BillText>
                          )}
                          <BillInfoButton onPress={() => setOpenTaxModal({ open: true, data: offer, type: 'offer_target_1' })} />
                          {!!offer?.id && (
                            <OfferAlert offerId={offer?.id} onRemove={handleRemoveOfferClick} />
                          )}
                        </OSRow>
                        <BillText>
                          - {parsePrice(offer?.summary?.discount)}
                        </BillText>
                      </OSTable>
                    ))
                  }
                  {cart?.offers?.filter((offer: any) => offer?.target === 1)?.length > 0 &&
                    cart?.subtotal_with_discount > 0 &&
                    cart?.discount > 0 &&
                    cart?.total >= 0 && (
                      <OSTable>
                        <BillText numberOfLines={1}>{t('SUBTOTAL_WITH_DISCOUNT', 'Subtotal with discount')}</BillText>
                        {cart?.business?.tax_type === 1 ? (
                          <BillText>{parsePrice(cart?.subtotal_with_discount + getIncludedTaxesDiscounts())}</BillText>
                        ) : (
                          <BillText>{parsePrice(cart?.subtotal_with_discount ?? 0)}</BillText>
                        )}
                      </OSTable>
                    )}
                  {(productTaxesList.length > 0 || feesList.length > 0) && (
                    <>
                      <OSTable>
                        <BillToggle
                          onPress={() => setShowTaxesFeesDetail(!showTaxesFeesDetail)}
                          disabled={!withTaxesDetail}
                          accessibilityRole='button'
                          accessibilityState={{ expanded: showTaxesFeesDetail }}
                          hitSlop={BILL_HIT_SLOP}
                        >
                          <BillText>{t('TAXES_AND_FEES', 'Taxes and fees')}</BillText>
                          {withTaxesDetail && (
                            <BillToggleIcon open={showTaxesFeesDetail}>
                              <Icon name='chevron-down' size='sm' color='text_muted' />
                            </BillToggleIcon>
                          )}
                        </BillToggle>
                        <BillText>{parsePrice(taxesAndFeesTotal)}</BillText>
                      </OSTable>
                      {showTaxesFeesDetail && withTaxesDetail && (
                        <TaxesFeesDetail>
                          {productTaxesList.map((tax: any, i: number) => (
                            <OSTable key={tax.id ?? `tax_${i}`}>
                              <OSRow>
                                <BillText color='text_muted' numberOfLines={1} >
                                  {tax.name || t('INHERIT_FROM_BUSINESS', 'Inherit from business')}{' '}
                                  {`(${verifyDecimals(tax?.rate, parseNumber)}%)`}{' '}
                                </BillText>
                                <BillInfoButton onPress={() => setOpenTaxModal({ open: true, data: tax, type: 'tax' })} />
                              </OSRow>
                              <BillText color='text_muted'>{parsePrice(tax?.summary?.tax_after_discount ?? tax?.summary?.tax ?? 0)}</BillText>
                            </OSTable>
                          ))}
                          {feesList.map((fee: any, i: number) => (
                            <OSTable key={(fee?.id ?? 'fee') + `_${i}`}>
                              <OSRow>
                                <BillText color='text_muted' numberOfLines={1}>
                                  {fee.name || t('INHERIT_FROM_BUSINESS', 'Inherit from business')}{' '}
                                  ({fee?.fixed > 0 && `${parsePrice(fee?.fixed)}${fee.percentage > 0 ? ' + ' : ''}`}{fee.percentage > 0 && `${fee.percentage}%`}){' '}
                                </BillText>
                                <BillInfoButton onPress={() => setOpenTaxModal({ open: true, data: fee, type: 'fee' })} />
                              </OSRow>
                              <BillText color='text_muted'>{parsePrice(fee?.summary?.amount ?? (fee?.summary?.fixed + (fee?.summary?.percentage_after_discount ?? fee?.summary?.percentage)))}</BillText>
                            </OSTable>
                          ))}
                        </TaxesFeesDetail>
                      )}
                    </>
                  )}
                  {
                    cart?.offers?.length > 0 && cart?.offers?.filter((offer: any) => offer?.target === 3)?.map((offer: any) => (
                      <OSTable key={offer.id}>
                        <OSRow>
                          <BillText>{offer.name}</BillText>
                          {offer.rate_type === 1 && (
                            <BillText>{`(${verifyDecimals(offer?.rate, parsePrice)}%)`}</BillText>
                          )}
                          <BillInfoButton onPress={() => setOpenTaxModal({ open: true, data: offer, type: 'offer_target_3' })} />
                          {!!offer?.id && (
                            <OfferAlert offerId={offer?.id} onRemove={handleRemoveOfferClick} />
                          )}
                        </OSRow>
                        <BillText>
                          - {parsePrice(offer?.summary?.discount)}
                        </BillText>
                      </OSTable>
                    ))
                  }
                  {deliveryTypes.includes(orderState?.options?.type) && !hideDeliveryFee && cart?.business_id && (
                    <OSTable>
                      {isDeliveryFreeViaMetafield ? (
                        <OSRow>
                          <BillText>{t('DELIVERY_FEE', 'Delivery Fee')}</BillText>
                          <View {...(Platform.OS === 'web' ? ({ title: freeDeliveryFeeTooltipMessage } as Record<string, string>) : {})}>
                            <BillInfoButton
                              onPress={() => {
                                if (Platform.OS !== 'web') {
                                  Alert.alert(t('DELIVERY_FEE', 'Delivery Fee'), freeDeliveryFeeTooltipMessage)
                                }
                              }}
                              accessibilityLabel={freeDeliveryFeeTooltipMessage}
                            />
                          </View>
                        </OSRow>
                      ) : (
                        <BillLabelRow>
                          <BillText>{t('DELIVERY_FEE', 'Delivery Fee')}</BillText>
                        </BillLabelRow>
                      )}
                      {isDeliveryFreeViaMetafield ? (
                        <BillStrikeRow>
                          <BillText color='text_disabled' style={fixed.strike}>
                            {parsePrice((cart?.delivery_price_with_discount ?? cart?.delivery_price) + getIncludedTaxes(true))}
                          </BillText>
                          <BillText weight={600} color='primary_text'>
                            {t('FREE', 'Free')}
                          </BillText>
                        </BillStrikeRow>
                      ) : (
                        <BillText>{parsePrice(cart?.delivery_price + getIncludedTaxes(true))}</BillText>
                      )}
                    </OSTable>
                  )}
                  {cart?.extra_value_checkprice && cart?.extra_value_checkprice > 0 && (
                    <OSTable>
                      <BillText>{t('EXTRA_VALUE_CHECKPRICE', 'Extra value checkprice')}</BillText>
                      <BillText>{parsePrice(cart?.extra_value_checkprice)}</BillText>
                    </OSTable>
                  )}
                  {
                    cart?.taxes?.length > 0 && cart?.taxes?.filter((tax: any) => tax?.type === 2 && tax?.rate !== 0 && tax?.target === 'delivery_fee').map((tax: any, i: number) => (
                      <OSTable key={`${tax.description}_${i}`}>
                        <OSRow>
                          <BillText numberOfLines={1}>
                            {tax.name || t('INHERIT_FROM_BUSINESS', 'Inherit from business')}
                            {`(${verifyDecimals(tax?.rate, parseNumber)}%)`}
                          </BillText>
                          <BillInfoButton onPress={() => setOpenTaxModal({ open: true, data: tax, type: 'tax' })} />
                        </OSRow>
                        <BillText>{parsePrice(tax?.summary?.tax_after_discount ?? tax?.summary?.tax ?? 0)}</BillText>
                      </OSTable>
                    ))
                  }
                  {
                    cart?.offers?.length > 0 && cart?.offers?.filter((offer: any) => offer?.target === 2)?.map((offer: any) => (
                      <OSTable key={offer.id}>
                        <OSRow>
                          <BillText>{offer.name}</BillText>
                          {offer.rate_type === 1 && (
                            <BillText>{`(${verifyDecimals(offer?.rate, parsePrice)}%)`}</BillText>
                          )}
                          <BillInfoButton onPress={() => setOpenTaxModal({ open: true, data: offer, type: 'offer_target_2' })} />
                          {!!offer?.id && (
                            <OfferAlert offerId={offer?.id} onRemove={handleRemoveOfferClick} />
                          )}
                        </OSRow>
                        <BillText>
                          - {parsePrice(offer?.summary?.discount)}
                        </BillText>
                      </OSTable>
                    ))
                  }
                  {cart?.driver_tip > 0 && (
                    <OSTable>
                      <BillText>
                        {t('DRIVER_TIP', 'Driver tip')}
                        {cart?.driver_tip_rate > 0 &&
                          parseInt(configs?.driver_tip_type?.value, 10) === 2 &&
                          !parseInt(configs?.driver_tip_use_custom?.value, 10) &&
                          (
                            `(${verifyDecimals(cart?.driver_tip_rate, parseNumber)}%)`
                          )}
                      </BillText>
                      <BillText>{parsePrice(cart?.driver_tip)}</BillText>
                    </OSTable>
                  )}
                  {extraValueMetafields.filter((meta: any) =>
                    !!parseFloat(meta?.value) &&
                    !(isDeliveryFreeViaMetafield && meta?.key === 'extra_value_free_delivery'),
                  ).map((meta: any) => {
                    const strippedKey = meta?.key?.replace('extra_value_', '')
                    const langKey = meta?.key?.toUpperCase()
                    const fallback = strippedKey?.replace(/_/g, ' ')?.split(' ')?.map((word: string) => capitalize(word))?.join(' ')
                    return (
                      <OSTable key={meta?.key}>
                        <BillText>
                          {t(langKey, fallback)}{' '}
                        </BillText>
                        <BillText>{parseFloat(meta?.value) > 0 ? parsePrice(parseFloat(meta?.value)) : `- ${parsePrice(parseFloat(meta?.value) * -1)}`}</BillText>
                      </OSTable>
                    )
                  })}
                  {cart?.payment_events?.length > 0 && cart?.payment_events?.map((event: any) => (
                    <OSTable key={event.id}>
                      <BillText numberOfLines={1}>
                        {walletName[cart?.wallets?.find((wallet: any) => wallet.id === event.wallet_id)?.type]?.name}
                      </BillText>
                      <BillText>-{parsePrice(event.amount, { isTruncable: true })}</BillText>
                    </OSTable>
                  ))}
                  {!hideCartDiscount && !isCartPending && cart?.business_id && (
                    <OSCoupon>
                        <CouponControl
                          businessId={cart.business_id}
                          price={cart.total}
                          cart={cart}
                          onOpenOffers={() => onNavigationRedirect('CouponOffers', {
                            businessId: cart.business_id,
                            cartUuid: cart.uuid
                          })}
                        />
                    </OSCoupon>
                  )}
                  {(showLoyaltyReward || showCashReward) && (
                    <RewardsBanner
                      points={showLoyaltyReward ? { message: t('RECEIVE_LOYALTY_POINT', 'You could receive :amount: points for this purchase.'), value: loyaltyRewardValue } : null}
                      cash={showCashReward ? { message: t('RECEIVE_CASHBACK', 'You could receive :amount: cashback for this purchase.'), value: parsePrice(cashRewardValue) } : null}
                    />
                  )}
                  {cart?.total >= 1 && !hideTotal && (
                    <OSTotalRule>
                      <OSTable>
                        <BillText total weight={700}>{t('TOTAL', 'Total')}</BillText>
                        <BillText total weight={700}>{parsePrice(cart?.total >= 0 ? cart?.total : 0)}</BillText>
                      </OSTable>
                    </OSTotalRule>
                  )}
                  {cart?.business_id && cart?.status !== 2 && !hideCartComments && (
                    <OSTable style={fixed.topAligned}>
                      <CommentsBox>
                        <OText preset='body_sm' mBottom='sm'>{t('COMMENTS', 'Comments')}</OText>
                        <View>
                          <OInput
                            value={cart?.comment}
                            placeholder={t('SPECIAL_COMMENTS', 'Special Comments')}
                            onChange={(value: string) => handleChangeComment(value)}
                            style={styles.comments}
                            inputStyle={styles.commentsInput}
                            forwardRef={commentRef}
                            multiline
                            onFocus={onCommentFocus}
                          />
                          {commentState?.loading && (
                            <CommentsSpinner>
                              <ActivityIndicator
                                size='large'
                                color={themePart(theme, 'spinner', 'base.color')}
                              />
                            </CommentsSpinner>
                          )}
                        </View>
                      </CommentsBox>
                    </OSTable>
                  )}
                </OSBill>
              )}
              {cateringTypes.includes(orderState?.options?.type) && maxDate && cart?.business && (
                <View>
                  <MomentOption
                    maxDate={maxDate}
                    cateringPreorder
                    isCart
                    preorderSlotInterval={preorderSlotInterval}
                    preorderLeadTime={preorderLeadTime}
                    preorderTimeRange={preorderTimeRange}
                    preorderMaximumDays={preorderMaximumDays}
                    preorderMinimumDays={preorderMinimumDays}
                    business={cart?.business}
                  />
                </View>
              )}
              <OModal
                open={openTaxModal.open}
                onClose={() => setOpenTaxModal({ open: false, data: null, type: '' })}
                title={`${openTaxModal.data?.name ||
                  t('INHERIT_FROM_BUSINESS', 'Inherit from business')} ${openTaxModal.data?.rate_type !== 2 ? `(${typeof openTaxModal.data?.rate === 'number' ? `${openTaxModal.data?.rate}%` : `${parsePrice(openTaxModal.data?.fixed ?? 0)} + ${openTaxModal.data?.percentage}%`})` : ''}  `}
              >
                <TaxInformation
                  type={openTaxModal.type}
                  data={openTaxModal.data}
                  products={cart?.products}
                />
              </OModal>
            </>
          )}
        </>
      )}
    </OSContainer>
  )
}

export const OrderSummary = (props: any) => {
  const orderSummaryProps = {
    ...props,
    UIComponent: OrderSummaryUI
  }

  return (
    <Cart {...orderSummaryProps} />
  )
}
