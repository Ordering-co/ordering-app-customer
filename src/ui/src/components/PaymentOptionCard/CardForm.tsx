import React, { useCallback, useRef, useState } from 'react'
import { useCreditCardForm, type CreditCardFormData } from 'react-native-credit-card-input'
import { useLanguage } from '@components'
import OInput from '../shared/OInput'
import { CardFormWrapper, CardFormRow, CardFormCell } from './styles'

export interface CardFormValues {
  number: string
  expiry: string
  cvc: string
  name: string
  type?: string
}

export interface CardFormData {
  /** Number, expiry and CVC valid, and a name. */
  valid: boolean
  values: CardFormValues
}

/**
 * The form for a new card: number, expiry, CVC and the cardholder's name, in
 * the app's text fields. The number, expiry and CVC are formatted and checked
 * as they are typed (`useCreditCardForm`); `onChange` receives the values and
 * whether the card is complete.
 */
export const CardForm = ({ onChange }: { onChange: (data: CardFormData) => void }) => {
  const [, t] = useLanguage()
  const [name, setName] = useState('')
  const card = useRef<CreditCardFormData | null>(null)

  const emit = useCallback((cardData: CreditCardFormData | null, holder: string) => {
    onChange({
      valid: !!cardData?.valid && holder.trim().length > 0,
      values: {
        number: cardData?.values.number ?? '',
        expiry: cardData?.values.expiry ?? '',
        cvc: cardData?.values.cvc ?? '',
        type: cardData?.values.type,
        name: holder,
      },
    })
  }, [onChange])

  const { values, onChangeValue } = useCreditCardForm((cardData) => {
    card.current = cardData
    emit(cardData, name)
  })

  const onChangeName = (value: string) => {
    setName(value)
    emit(card.current, value)
  }

  return (
    <CardFormWrapper>
      <OInput
        placeholder={t('CARD_NUMBER', 'Card number')}
        value={values.number}
        onChange={(value: string) => onChangeValue('number', value)}
        type='numeric'
        isValueSync
        autoCorrect={false}
        testID='CC_NUMBER'
      />
      <CardFormRow>
        <CardFormCell>
          <OInput
            placeholder={t('EXPIRY_DATE_PLACEHOLDER', 'MM/YY')}
            value={values.expiry}
            onChange={(value: string) => onChangeValue('expiry', value)}
            type='numeric'
            isValueSync
            autoCorrect={false}
            testID='CC_EXPIRY'
          />
        </CardFormCell>
        <CardFormCell>
          <OInput
            placeholder={t('CVC', 'CVC')}
            value={values.cvc}
            onChange={(value: string) => onChangeValue('cvc', value)}
            type='numeric'
            isValueSync
            autoCorrect={false}
            testID='CC_CVC'
          />
        </CardFormCell>
      </CardFormRow>
      <OInput
        placeholder={t('CARDHOLDER_NAME', 'Cardholder name')}
        value={name}
        isValueSync
        onChange={onChangeName}
        autoCapitalize='words'
        autoCorrect={false}
        testID='CC_NAME'
      />
    </CardFormWrapper>
  )
}
