import { useTheme } from 'styled-components/native'
import React, { useEffect, useRef, useState } from 'react'
import { View, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form'

import { Container, FormController, RedeemedDetails, RedeemedHeader } from './styles'
import { useLanguage, useUtils, RedeemGiftCard as RedeemGiftCardController } from '@components'
import { OText, OButton, OInput } from '@ui';
import Icon from '../../shared/Icon';

const RedeemGiftCardUI = (props: any) => {
  const {
    actionState,
    redeemedGiftCard,
    handleApply,
    onClose,
    setRedeemedGiftCard
  } = props

  const [, t] = useLanguage()
  const theme: any = useTheme()
  const { handleSubmit, control, formState: { errors } } = useForm()
  const [{ parsePrice }] = useUtils()

  const [codeValue, setCodeValue] = useState('')
  const [passwordSee, setPasswordSee] = useState(false)
  const passwordRef = useRef<any>(null)

  const onSubmit = (values: any) => {
    handleApply(values)
  }

  const handleChangeCode = (string: any, onChange: any) => {
    string = string.replace(/-/g, '')
    if (!string) {
      setCodeValue('')
      onChange('')
      return
    }
    const codeSlices = string.match(/.{1,4}/g)
    const formattedCode = codeSlices.join('-')
    setCodeValue(formattedCode)
    onChange(formattedCode)
  }

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const list = Object.values(errors)
      let stringError = ''
      list.map((item: any, i: number) => {
        stringError += (i + 1) === list.length ? `- ${item.message}` : `- ${item.message}\n`
      })
      Alert.alert(
        t('ERROR', 'Error'),
        stringError,
        [
          { text: t('OK', 'oK'), onPress: () => { } }
        ]
      )
    }
  }, [errors])

  useEffect(() => {
    if (!actionState.error) return
    let stringError = ''
    if (typeof actionState.error === 'string') {
      stringError = actionState.error
    } else {
      actionState.error.map((item: any) => {
        stringError += `- ${item}\n`
      })
    }
    Alert.alert(
      t('ERROR', 'Error'),
      stringError,
      [
        { text: t('OK', 'oK'), onPress: () => { } }
      ]
    )
  }, [actionState.error])

  return (
    <Container>
      {!redeemedGiftCard ? (
        <View>
          <FormController>
            <Controller
              control={control}
              render={({ field: { onChange } }: any) => (
                <OInput
                  placeholder='XXXX-XXXX-XXXX-XXXX'
                  value={codeValue}
                  onChange={(val: any) => {
                    handleChangeCode(val, onChange)
                  }}
                  autoCapitalize='characters'
                  autoCorrect={false}
                  blurOnSubmit={false}
                />
              )}
              name='code'
              rules={{
                required: t('VALIDATION_ERROR_REQUIRED', 'Code is required').replace('_attribute_', t('CODE', 'Code'))
              }}
              defaultValue=""
            />
          </FormController>
          <FormController>
            <Controller
              control={control}
              render={({ field: { onChange, value } }: any) => (
                <OInput
                  isSecured={!passwordSee ? true : false}
                  placeholder={t('PASSWORD', 'Password')}
                  autoCapitalize='none'
                  value={value}
                  forwardRef={passwordRef}
                  returnKeyType="done"
                  blurOnSubmit
                  iconCustomRight={
                    <OButton
                      iconOnly
                      color='neutral'
                      appearance='ghost'
                      icon={<Icon set='mci' name={passwordSee ? 'eye-off-outline' : 'eye-outline'} size={theme.native.components.input.base.icon_size} color={theme.native.components.input.base.icon_color} />}
                      onClick={() => setPasswordSee(!passwordSee)}
                      accessibilityLabel={t('PASSWORD', 'Password')}
                    />
                  }
                  hasError={!!errors?.password}
                  onChange={(val: any) => onChange(val)}
                  onSubmitEditing={() => handleSubmit(onSubmit)()}
                />
              )}
              name="password"
              rules={{
                required: {
                  value: true,
                  message: t(
                    'VALIDATION_ERROR_PASSWORD_REQUIRED',
                    'The field Password is required',
                  ).replace('_attribute_', t('PASSWORD', 'Password'))
                }
              }}
              defaultValue=""
            />
          </FormController>
          <OButton
            onClick={handleSubmit(onSubmit)}
            text={actionState?.loading ? t('LOADING', 'Loading') : t('APPLY_TO_YOUR_BALANCE', 'Apply to your balance')}
            disabled={actionState.loading}
          />
        </View>
      ) : (
        <RedeemedDetails>
          <RedeemedHeader>
            <OText color='text' preset='h3' mBottom='xs'>{t('GIFT_CARD', 'Gift card')}</OText>
            <OText color='text' preset='body'>{t('REDEEMED_SUCCESSFULLY', 'Redeemed successfully')}</OText>
          </RedeemedHeader>
          <View>
            <OText color='text' preset='body_lg' mBottom='sm' weight={600}>{t('TYPE', 'Type')}: {redeemedGiftCard?.type}</OText>
            <OText color='text' preset='body_lg' mBottom='sm' weight={600}>{t('AMOUNT', 'Amount')}: {parsePrice(redeemedGiftCard?.amount)}</OText>
            <OText color='text' preset='body_lg' mBottom='sm'>{t('FROM', 'From')}: {redeemedGiftCard?.receiver?.name} {redeemedGiftCard?.receiver?.lastname}</OText>
            {!!redeemedGiftCard?.title && <OText color='text' preset='body_lg' mBottom='sm'>{t('TITLE', 'Title')}: {redeemedGiftCard?.title}</OText>}
            {!!redeemedGiftCard?.message && <OText color='text' preset='body_lg' mBottom='lg'>{t('MESSAGES', 'Messages')}: {redeemedGiftCard?.message} </OText>}
          </View>
          <OButton
            onClick={() => {
              setRedeemedGiftCard(null)
              onClose()
            }}
            text={t('OK', 'Ok')}
          />
        </RedeemedDetails>
      )}
    </Container>
  )
}

export const RedeemGiftCard = (props: any) => {
  const redeemGiftCardProps = {
    ...props,
    UIComponent: RedeemGiftCardUI
  }
  return <RedeemGiftCardController {...redeemGiftCardProps} />
}
