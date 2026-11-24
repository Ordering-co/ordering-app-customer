import React from 'react'
import { BUNDLED_IMAGES } from '@/theme/bundledImages'
import OIcon from '../shared/OIcon'
import Icon from '../shared/Icon'

/** The brand marks of the gateways (bundled, painted in the ink unless they keep their colors). */
const BRAND_MARKS: Record<string, string> = {
  paypal: 'paypal',
  paypal_braintree: 'paypal',
  stripe_direct: 'stripecc',
  stripe_connect: 'stripes',
  stripe_redirect: 'stripesb',
  apple_pay: 'applePayMark',
  apple_pay_braintree: 'applePayMark',
  global_apple_pay: 'applePayMark',
  google_pay: 'googlePayMark',
  google_pay_braintree: 'googlePayMark',
  global_google_pay: 'googlePayMark'
}

/** Marks shown in their own colors (Apple Pay's is black on white by the brand's rules). */
const KEEP_COLORS = new Set(['apple_pay', 'apple_pay_braintree', 'global_apple_pay'])

/** A gateway's mark as a bundled image, or null when it has none (cash, a card, a gateway without a brand mark). */
export const payBrandMark = (gateway?: string | null) => {
  const name = gateway ? BRAND_MARKS[gateway] : undefined
  return name ? BUNDLED_IMAGES.general[name] : null
}

/**
 * A payment method's icon, as the web's: cash and a card are vector icons
 * (`cash-outline`, `card-outline`, the latter for every gateway without a
 * brand mark), a brand (PayPal, Stripe, Apple Pay, Google Pay) its bundled mark.
 */
export const PayMethodIcon = ({ gateway, size, color }: { gateway?: string | null, size: number, color: string }) => {
  const mark = payBrandMark(gateway)
  if (mark) {
    return <OIcon src={mark} width={size} height={size} color={gateway && KEEP_COLORS.has(gateway) ? '' : color} />
  }
  return <Icon name={gateway === 'cash' ? 'cash-outline' : 'card-outline'} size={size} color={color} />
}
