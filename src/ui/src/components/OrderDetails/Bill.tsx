import React, { useMemo, useState } from 'react'
import { SectionTitle } from '../shared/SectionTitle'
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native'
import { useTheme } from 'styled-components/native'

import { OrderBill, PaymentMethodItem, PaymentMethodItemAmount, PaymentMethodItemInfo, Separator, Table, WrapperPaymethods } from './styles'
import { ProductList } from './ProductList'
import { OSRow } from '../OrderSummary/styles';
import { useConfig, useLanguage, useUtils } from '@components'
import { OModal, OText, TaxInformation, verifyDecimals } from '@ui'
import { PayMethodIcon } from '../PayMethodIcon'
import { capitalize } from '../../utils'
import Icon from '../shared/Icon'
import { nativeTextStyle, themeControlHeight, themeIconSize, themeOpacity, themePart, themeSpace } from '@/theme/helpers'

/**
 * The info icon after a bill line (offer, fee, tax): an `sm` icon in
 * `primary`, with a touch target of the control height (`size.md`).
 */
const InfoTrigger = ({ onPress, accessibilityLabel }: { onPress: () => void, accessibilityLabel?: string }) => {
  const theme: any = useTheme()
  const slop = (themeControlHeight(theme, 'md') - themeIconSize(theme, 'sm')) / 2
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole='button'
      accessibilityLabel={accessibilityLabel}
      hitSlop={{ top: slop, bottom: slop, left: slop, right: slop }}
      style={({ pressed }) => [{ marginLeft: themeSpace(theme, 'xs') }, pressed && { opacity: themeOpacity(theme, 'pressed') }]}
    >
      <Icon name='information-circle-outline' size='sm' color='primary' />
    </Pressable>
  )
}

export const Bill = (props: any) => {
  const {
    order,
    isPickup,
    hideTotal,
    isGiftCardOrder,
    isCustomOrder,
    declaredValue
  } = props

  const theme: any = useTheme()
  const [, t] = useLanguage()
  // `bill` of the theme: its rows, its total; the summary is a `card` box on `surface_alt`.
  const styles = useMemo(() => {
    const bill = themePart(theme, 'bill', 'base')
    const card = themePart(theme, 'card', 'base')
    return StyleSheet.create({
      row: { ...nativeTextStyle(bill.row), color: bill.row_color },
      total: { ...nativeTextStyle(bill.total), color: bill.total_color },
      // The rows are `row_gap` apart and the box's padding is the same on every side.
      summary: { backgroundColor: theme.native.tokens.color.surface_alt, borderRadius: card.radius, padding: card.padding, marginTop: themeSpace(theme, 'sm'), gap: bill.row_gap },
      struck: { textDecorationLine: 'line-through', color: theme.native.tokens.color.text_muted, marginRight: themeSpace(theme, 'xs') },
      free: { color: theme.native.tokens.color.success_text },
      paymentName: { marginLeft: themeSpace(theme, 'sm') },
      // A payment line reads as the product lines above it (a list row's title).
      payment: { ...nativeTextStyle(themePart(theme, 'list_row', 'base.title')), color: theme.native.tokens.color.text },
      payIcon: { width: themeIconSize(theme, 'lg'), height: themeIconSize(theme, 'lg') }
    })
  }, [theme])
  const [{ configs }] = useConfig()
  const [{ parsePrice, parseNumber }] = useUtils()

  const [openTaxModal, setOpenTaxModal] = useState<any>({ open: false, tax: null, type: '' })
  const extraValueMetafields = order?.metafields?.filter?.((meta: any) => meta?.key?.startsWith('extra_value_')) || []

  const walletName: any = {
    cash: {
      name: t('PAY_WITH_CASH_WALLET', 'Pay with Cash Wallet'),
    },
    credit_point: {
      name: t('PAY_WITH_CREDITS_POINTS_WALLET', 'Pay with Credit Points Wallet'),
    }
  }

  const getIncludedTaxes = (isDeliveryFee?: boolean) => {
    if (order?.taxes?.length === 0 || !order?.taxes) {
      return order.tax_type === 1 ? order?.summary?.tax ?? 0 : 0
    } else {
      return order?.taxes.reduce((taxIncluded: number, tax: any) => {
        return taxIncluded + (((!isDeliveryFee && tax.type === 1 && tax.target === 'product') || (isDeliveryFee && tax.type === 1 && tax.target === 'delivery_fee')) ? tax.summary?.tax : 0)
      }, 0)
    }
  }

  const getIncludedTaxesDiscounts = () => {
    return order?.taxes?.filter((tax: any) => tax?.type === 1 && tax?.target === 'product')?.reduce((carry: number, tax: any) => carry + (tax?.summary?.tax_after_discount ?? tax?.summary?.tax), 0)
  }

  const clearAmount = (value: any) => parseFloat((Math.trunc(value * 100) / 100).toFixed(configs.format_number_decimal_length?.value ?? 2))
  const deliveryTotalForFreeCheck = clearAmount(
    (Number(
      order?.summary?.delivery_price_with_discount ??
        order?.summary?.delivery_price ??
        order?.delivery_price,
    ) || 0) + getIncludedTaxes(true),
  )
  const freeDeliveryMetaRaw = order?.metafields?.find?.((m: any) => m?.key === 'extra_value_free_delivery')?.value
  const parsedFreeDeliveryMeta = freeDeliveryMetaRaw != null ? Number(freeDeliveryMetaRaw) : NaN
  const isDeliveryFreeViaMetafield =
    deliveryTotalForFreeCheck > 0 &&
    Number.isFinite(parsedFreeDeliveryMeta) &&
    clearAmount(parsedFreeDeliveryMeta + deliveryTotalForFreeCheck) === 0

  const rawFreeDeliveryPartnerName = order?.metafields?.find?.((m: any) => m?.key === 'free_delivery_partner_name')?.value
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

  const paymentEvents = (order?.payment_events || []).filter((event: any) => event?.amount > 0)
  const paymentMethodName = (event: any) => {
    const methodName = (event?.wallet_event ?? event?.wallet_event_id)
      ? walletName[event?.wallet_event?.wallet?.type ?? event?.data?.wallet_currency]?.name
      : t(event?.data?.gateway?.toUpperCase()?.replace(/ /g, '_') || event?.paymethod?.name?.toUpperCase()?.replace(/ /g, '_'), event?.data?.gateway || event?.paymethod?.name)
    // A gateway without a translation shows its code: capitalized as the other names.
    const shown = typeof methodName === 'string' ? methodName.charAt(0).toUpperCase() + methodName.slice(1) : methodName
    return event?.event === 'refund' ? `${t('REFUND', 'Refund')} (${shown})` : shown
  }
  // A bill row: its gap is the summary's, so the last row leaves no extra room under it.
  const Line = (lineProps: any) => <Table {...lineProps} pb={0} hideBackground />

  return (
    <>
      <OrderBill>
        {/* The products are a section as every other: its title, then the lines. */}
        <SectionTitle text={theme.native.components.order_details.base.address_title}>{t('SUMMARY', 'Summary')}</SectionTitle>
        <ProductList order={order} />
        <View style={styles.summary}>
          {!isCustomOrder && (
            <Line>
              <OText style={styles.row}>{t('SUBTOTAL', 'Subtotal')}</OText>
              <OText style={styles.row}>
                {parsePrice(((order?.summary?.subtotal_with_discount ?? order?.subtotal_with_discount) || 0))}
              </OText>
            </Line>
          )}
          {(order?.summary?.discount > 0 || order?.discount > 0) && order?.offers?.length === 0 && (
            <Line>
              {order?.offer_type === 1 ? (
                <OText style={styles.row}>
                  {t('DISCOUNT', 'Discount')}
                  <OText style={styles.row}>{`(${verifyDecimals(
                    order?.offer_rate,
                    parsePrice,
                  )}%)`}</OText>
                </OText>
              ) : (
                <OText style={styles.row}>{t('DISCOUNT', 'Discount')}</OText>
              )}
              <OText style={styles.row}>
                - {parsePrice(order?.summary?.discount || order?.discount)}
              </OText>
            </Line>
          )}
          {
            !isGiftCardOrder && order?.offers?.length > 0 && order?.offers?.filter((offer: any) => offer?.target === 1)?.map((offer: any) => (
              <Line key={offer.id}>
                <OSRow>
                  <OText style={styles.row} numberOfLines={1}>
                    {offer.name}
                    {offer.rate_type === 1 && (
                      <OText style={styles.row}>{`(${verifyDecimals(offer?.rate, parsePrice)}%)`}</OText>
                    )}
                  </OText>
                  <InfoTrigger onPress={() => setOpenTaxModal({ open: true, data: offer, type: 'offer_target_1' })} />
                </OSRow>
                <OText style={styles.row}>- {parsePrice(offer?.summary?.discount)}</OText>
              </Line>
            ))
          }
          {
            order?.taxes?.length === 0 && order?.tax_type === 2 && (
              <Line>
                <OText style={styles.row}>
                  {t('TAX', 'Tax')} {`(${verifyDecimals(order?.tax, parseNumber)}%)`}
                </OText>
                <OText style={styles.row}>{parsePrice(order?.summary?.tax || 0)}</OText>
              </Line>
            )
          }
          {
            order?.fees?.length === 0 && (
              <Line>
                <OText style={styles.row}>
                  {t('SERVICE_FEE', 'Service fee')}
                  {`(${verifyDecimals(order?.service_fee, parseNumber)}%)`}
                </OText>
                <OText style={styles.row}>{parsePrice(order?.summary?.service_fee || 0)}</OText>
              </Line>
            )
          }
          {
            order?.taxes?.length > 0 && order?.taxes?.filter((tax: any) => tax?.rate !== 0 && tax?.target === 'product').map((tax: any) => (
              <Line key={tax.id}>
                <OSRow>
                  <OText style={styles.row} numberOfLines={1}>
                    {t('TAX', 'Tax')}
                    {` (${verifyDecimals(tax?.rate, parseNumber)}%)`}{' '}
                  </OText>
                </OSRow>
                <OText style={styles.row}>
                  {parsePrice(tax?.summary?.tax_after_discount ?? tax?.summary?.tax ?? 0)}
                </OText>
              </Line>
            ))
          }
          {
            !isGiftCardOrder && order?.fees?.length > 0 && order?.fees?.filter((fee: any) => !(fee.fixed === 0 && fee.percentage === 0))?.map((fee: any) => (
              <Line key={fee.id}>
                <OSRow>
                  <OText style={styles.row} numberOfLines={1}>
                    {fee.name || t('INHERIT_FROM_BUSINESS', 'Inherit from business')}
                    ({fee?.fixed > 0 && `${parsePrice(fee?.fixed)}${fee.percentage > 0 ? ' + ' : ''}`}{fee.percentage > 0 && `${fee.percentage}%`}){' '}
                  </OText>
                  <InfoTrigger onPress={() => setOpenTaxModal({ open: true, data: fee, type: 'fee' })} />
                </OSRow>
                <OText style={styles.row}>{parsePrice(fee?.summary?.amount ?? ((fee?.summary?.fixed + (fee?.summary?.percentage_after_discount || fee?.summary?.percentage)) || 0))}</OText>
              </Line>
            ))
          }
          {
            !isGiftCardOrder && order?.offers?.length > 0 && order?.offers?.filter((offer: any) => offer?.target === 3)?.map((offer: any) => (
              <Line key={offer.id}>
                <OSRow>
                  <OText style={styles.row} numberOfLines={1}>
                    {offer.name}
                    {offer.rate_type === 1 && (
                      <OText style={styles.row}>{`(${verifyDecimals(offer?.rate, parsePrice)}%)`}</OText>
                    )}
                  </OText>
                  <InfoTrigger onPress={() => setOpenTaxModal({ open: true, data: offer, type: 'offer_target_3' })} />
                </OSRow>
                <OText style={styles.row}>- {parsePrice(offer?.summary?.discount)}</OText>
              </Line>
            ))
          }
          {!isPickup && !isGiftCardOrder &&
            (
              isDeliveryFreeViaMetafield ||
              (typeof order?.summary?.delivery_price === 'number' && order?.summary?.delivery_price > 0)
            ) && (
            <Line>
              {isDeliveryFreeViaMetafield ? (
                <OSRow style={{ alignItems: 'center', width: '80%' }}>
                  <OText style={styles.row}>{t('DELIVERY_FEE', 'Delivery Fee')}</OText>
                  <InfoTrigger
                    accessibilityLabel={freeDeliveryFeeTooltipMessage}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Alert.alert(t('DELIVERY_FEE', 'Delivery Fee'), freeDeliveryFeeTooltipMessage)
                      }
                    }}
                  />
                </OSRow>
              ) : (
                <OText style={styles.row}>{t('DELIVERY_FEE', 'Delivery Fee')}</OText>
              )}
              {isDeliveryFreeViaMetafield ? (
                <OSRow style={{ alignItems: 'center' }}>
                  <OText style={[styles.row, styles.struck]}>
                    {parsePrice((order?.summary?.delivery_price_with_discount ?? order?.summary?.delivery_price ?? order?.delivery_price) + getIncludedTaxes(true))}
                  </OText>
                  <OText style={[styles.row, styles.free]} weight={600}>
                    {t('FREE', 'Free')}
                  </OText>
                </OSRow>
              ) : (
                <OText style={styles.row}>
                  {parsePrice(order?.summary?.delivery_price + getIncludedTaxes(true))}
                </OText>
              )}
            </Line>
          )}
          {isCustomOrder && declaredValue > 0 && (
            <Line>
              <OText style={styles.row}>{t('DECLARED_VALUE', 'Declared value')}</OText>
              <OText style={styles.row}>{parsePrice(declaredValue)}</OText>
            </Line>
          )}
          {
            !isGiftCardOrder && order?.taxes?.length > 0 && order?.taxes?.filter((tax: any) => tax?.type === 2 && tax?.rate !== 0 && tax?.target === 'delivery_fee').map((tax: any, i: number) => (
              <Line key={`${tax?.description}_${i}`}>
                <OSRow>
                  <OText style={styles.row} numberOfLines={1}>
                    {t(tax?.name?.toUpperCase()?.replace(/ /g, '_'), tax?.name?.toUpperCase()?.replace(/_/g, ' ')) || t('INHERIT_FROM_BUSINESS', 'Inherit from business')}
                    {`(${verifyDecimals(tax?.rate, parseNumber)}%) `}
                  </OText>
                  {setOpenTaxModal && (
                    <InfoTrigger onPress={() => setOpenTaxModal({ open: true, data: tax, type: 'tax' })} />
                  )}
                </OSRow>
                <OText style={styles.row}>{parsePrice(tax?.summary?.tax_after_discount ?? tax?.summary?.tax ?? 0)}</OText>
              </Line>
            ))
          }
          {
            !isGiftCardOrder && order?.offers?.length > 0 && order?.offers?.filter((offer: any) => offer?.target === 2)?.map((offer: any) => (
              <Line key={offer.id}>
                <OSRow>
                  <OText style={styles.row} numberOfLines={1}>
                    {offer.name}
                    {offer.rate_type === 1 && (
                      <OText style={styles.row}>{`(${verifyDecimals(offer?.rate, parsePrice)}%)`}</OText>
                    )}
                  </OText>
                  <InfoTrigger onPress={() => setOpenTaxModal({ open: true, data: offer, type: 'offer_target_2' })} />
                </OSRow>
                <OText style={styles.row}>- {parsePrice(offer?.summary?.discount)}</OText>
              </Line>
            ))
          }
          {order?.summary?.driver_tip > 0 && (
            <Line>
              <OText style={styles.row}>
                {t('DRIVER_TIP', 'Driver tip')}
                {order?.summary?.driver_tip > 0 &&
                  parseInt(configs?.driver_tip_type?.value, 10) === 2 &&
                  !parseInt(configs?.driver_tip_use_custom?.value, 10) &&
                  (
                    `(${verifyDecimals(order?.summary?.driver_tip, parseNumber)}%)`
                  )}
              </OText>
              <OText style={styles.row}>{parsePrice(order?.summary?.driver_tip ?? order?.totalDriverTip)}</OText>
            </Line>
          )}
          {extraValueMetafields.filter((meta: any) =>
            !!parseFloat(meta?.value) &&
            !(isDeliveryFreeViaMetafield && meta?.key === 'extra_value_free_delivery'),
          ).map((meta: any) => {
            const strippedKey = meta?.key?.replace('extra_value_', '')
            const langKey = meta?.key?.toUpperCase()
            const fallback = strippedKey?.replace(/_/g, ' ')?.split(' ')?.map((word: string) => capitalize(word))?.join(' ')
            return (
              <Line key={meta?.key}>
                <OText style={styles.row}>
                  {t(langKey, fallback)}{' '}
                </OText>
                <OText style={styles.row}>{parseFloat(meta?.value) > 0 ? parsePrice(parseFloat(meta?.value)) : `- ${parsePrice(parseFloat(meta?.value) * -1)}`}</OText>
              </Line>
            )
          })}
          {!hideTotal && (
            <>
              <Line pb={0}>
                <OText style={styles.total}>
                  {isCustomOrder
                    ? t('ESTIMATED_TOTAL', 'Estimated Total')
                    : t('TOTAL', 'Total')}
                </OText>
                <OText style={styles.total}>
                  {isCustomOrder ? '~ ' : ''}
                  {parsePrice(
                    isCustomOrder
                      ? (order?.summary?.total ?? order?.total ?? 0) + (declaredValue || 0)
                      : (order?.summary?.total ?? order?.total)
                  )}
                </OText>
              </Line>
            </>
          )}
        </View>
        <Separator />
        {paymentEvents.length > 0 && (
          <>
            <SectionTitle text={theme.native.components.order_details.base.address_title}>{t('PAYMENT_METHODS', 'Payment methods')}</SectionTitle>
            <WrapperPaymethods>
              {paymentEvents.map((event: any) => {
                const isRefund = event?.event === 'refund'
                return (
                <PaymentMethodItem key={event.id}>
                  <PaymentMethodItemInfo>
                    <PayMethodIcon
                      gateway={event?.paymethod?.gateway ?? event?.data?.gateway}
                      size={styles.payIcon.width}
                      color={theme.native.tokens.color.text}
                    />
                    <OText style={[styles.payment, styles.paymentName]}>
                      {paymentMethodName(event)}
                    </OText>
                  </PaymentMethodItemInfo>
                  <PaymentMethodItemAmount>
                    {!isCustomOrder && (
                      <OText style={styles.payment}>
                        {/* A payment is the amount paid; only a refund carries a sign. */}
                        {isRefund ? '+ ' : ''}{parsePrice(event.amount, { isTruncable: true })}
                      </OText>
                    )}
                  </PaymentMethodItemAmount>
                </PaymentMethodItem>
                )
              })}
            </WrapperPaymethods>
            <Separator />
          </>
        )}
      </OrderBill>
      <OModal
        open={openTaxModal.open}
        onClose={() => setOpenTaxModal({ open: false, data: null, type: '' })}
      >
        <TaxInformation
          type={openTaxModal.type}
          data={openTaxModal.data}
          products={order?.products}
        />
      </OModal>
    </>
  )
}


