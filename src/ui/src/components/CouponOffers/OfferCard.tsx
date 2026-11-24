import React from 'react'
import { StyleSheet } from 'react-native'

import OText from '../shared/OText'
import OButton from '../shared/OButton'
import Icon from '../shared/Icon'
import {
  OfferCardContainer,
  OfferContent,
  OfferIcon,
  OfferRate
} from './styles'

// Layout only (no theme values): safe at module level.
const layout = StyleSheet.create({ code: { textTransform: 'uppercase' } })

interface OfferCardProps {
  applyingOfferId?: number | string | null
  cartHasOffers?: boolean
  isCurrent?: boolean
  isCoupon?: boolean
  offer: any
  onApply?: (offer: any) => void
  onRemove?: (offer: any, isCoupon: boolean) => void
  removingOfferId?: number | string | null
  t: (key: string, fallback: string) => string
}

export const OfferCard = ({
  applyingOfferId,
  cartHasOffers,
  isCurrent,
  isCoupon,
  offer,
  onApply,
  onRemove,
  removingOfferId,
  t
}: OfferCardProps) => {
  const rate = offer?.rate_type === 1 && offer?.rate ? `${offer.rate}%` : null
  const unavailable = !isCurrent && offer?.applicable === false
  const applying = applyingOfferId === offer?.id
  const removing = removingOfferId === offer?.id
  const operationPending = Boolean(applyingOfferId || removingOfferId)
  const actionDisabled = unavailable || operationPending
  const canRemove = Boolean(isCoupon || offer?.id)
  const applyLabel = applying
    ? t('APPLYING', 'Applying...')
    : !offer?.stackable && cartHasOffers
      ? t('REPLACE', 'Replace')
      : t('APPLY', 'Apply')

  return (
    <OfferCardContainer $unavailable={unavailable}>
      {rate
        ? (
          <OfferRate>
            <OText preset='label' color='on_primary'>{rate}</OText>
          </OfferRate>
          )
        : (
          <OfferIcon>
            <Icon name='pricetag-outline' size='md' color='primary' />
          </OfferIcon>
          )}
      <OfferContent>
        <OText preset='body' weight={600} numberOfLines={2}>
          {offer?.name || t('APPLIED_OFFER', 'Applied offer')}
        </OText>
        {!!(offer?.coupon || offer?.code) && (
          <OText preset='body_sm' weight={700} color='primary_text' style={layout.code}>{offer.coupon || offer.code}</OText>
        )}
        {!!offer?.description && (
          <OText preset='body_sm' color='text_muted' numberOfLines={3}>{offer.description}</OText>
        )}
        {unavailable && (
          <OText preset='body_sm' color='danger_text'>
            {t('OFFER_REQUIREMENTS_NOT_MET', "This cart doesn't meet this offer's requirements yet.")}
          </OText>
        )}
      </OfferContent>

      {isCurrent
        ? canRemove && (
          <OButton
            color='danger'
            appearance='tonal'
            size='sm'
            disabled={operationPending}
            onClick={() => onRemove?.(offer, Boolean(isCoupon))}
            accessibilityLabel={`${t('REMOVE', 'Remove')} ${offer?.name || offer?.coupon || t('OFFER', 'Offer')}`}
            text={removing ? t('REMOVING', 'Removing...') : t('REMOVE', 'Remove')}
          />
          )
        : (
          <OButton
            size='sm'
            disabled={actionDisabled}
            onClick={() => onApply?.(offer)}
            accessibilityLabel={`${applyLabel} ${offer?.name || t('OFFER', 'Offer')}`}
            text={applyLabel}
          />
          )}
    </OfferCardContainer>
  )
}
