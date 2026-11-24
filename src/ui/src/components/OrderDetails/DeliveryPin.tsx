import React from 'react'

import { useLanguage } from '@components'
import OText from '../shared/OText'
import { DeliveryPinCode, DeliveryPinWrapper } from './styles'

export const DeliveryPin = (props: { pin: string }) => {
  const { pin } = props

  const [, t] = useLanguage()
  const title = t('DELIVERY_PIN', 'Delivery PIN')
  const help = t('DELIVERY_PIN_HELP', 'Give this code to the driver when you receive your order')

  return (
    <DeliveryPinWrapper testID="delivery-pin">
      <OText preset='label'>
        {title}
      </OText>
      <DeliveryPinCode preset='h1'>
        {pin}
      </DeliveryPinCode>
      <OText preset='body_sm' color='text_muted' align="center">
        {help}
      </OText>
    </DeliveryPinWrapper>
  )
}
