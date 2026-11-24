import React, { useEffect } from 'react'
import { StyleSheet, Alert } from 'react-native';
import { nativeTextStyle, themeSpace } from '@/theme/helpers'
import { useTheme } from 'styled-components/native';
import { useForm, Controller } from 'react-hook-form'

import {
  Container,
  FormController
} from './styles'

import { useLanguage, SendGiftCard as SendGiftCardController } from '@components';
import { OText, OButton, OInput } from '../../shared';

const SendGiftCardUI = (props: any) => {
  const {
    actionState,
    handleSendGiftCard
  } = props

  const theme = useTheme()
  const [, t] = useLanguage()

  const { handleSubmit, control, formState: { errors } } = useForm()

  const style = React.useMemo(() => {
    const field = (theme as any).native.components.field.base
    return StyleSheet.create({
      btnStyle: {
        marginTop: themeSpace(theme, 'lg')
      },
      label: { ...nativeTextStyle(field.label), color: field.label_color, marginBottom: field.label_gap },
      // The message box is a few lines high (layout).
      messageInput: { height: 100, alignItems: 'flex-start' },
    })
  }, [theme])

  const onSubmit = (values: any) => {
    handleSendGiftCard(values)
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

  return (
    <Container>
      <OText color='text' preset='h3' mBottom='sm'>{t('GIFT_CARD_DETAILS', 'Gift Card details')}</OText>
      <FormController>
        <OText style={style.label}>{t('TO', 'To')}</OText>
        <Controller
          control={control}
          render={({ field: { onChange, value } }: any) => (
            <OInput
              placeholder={t('ENTER_AN_EMAIL', 'Enter an email')}
              value={value}
              onChange={(val: any) => onChange(val)}
              autoCompleteType='email'
              autoCapitalize='none'
              autoCorrect={false}
              type='email-address'
              blurOnSubmit={false}
            />
          )}
          name='email'
          rules={{
            required: t('VALIDATION_ERROR_REQUIRED', 'To email is required').replace('_attribute_', t('EMAIL', 'EMail'))
          }}
          defaultValue=""
        />
      </FormController>
      <FormController>
        <OText style={style.label}>{t('NAME', 'Name')}</OText>
        <Controller
          control={control}
          render={({ field: { onChange, value } }: any) => (
            <OInput
              placeholder={t('WRITE_A_NAME', 'Write a name')}
              value={value}
              onChange={(val: any) => onChange(val)}
              autoCapitalize='none'
              autoCorrect={false}
              blurOnSubmit={false}
            />
          )}
          name='user_name'
          defaultValue=""
        />
      </FormController>
      <FormController>
        <OText style={style.label}>{t('TITLE', 'Title')}</OText>
        <Controller
          control={control}
          render={({ field: { onChange, value } }: any) => (
            <OInput
              placeholder={t('TITLE', 'Title')}
              value={value}
              onChange={(val: any) => onChange(val)}
              autoCapitalize='none'
              autoCorrect={false}
              blurOnSubmit={false}
            />
          )}
          name='title'
          defaultValue=""
        />
      </FormController>
      <FormController>
        <OText style={style.label}>{t('MESSAGES', 'Messages')}</OText>
        <Controller
          control={control}
          render={({ field: { onChange, value } }: any) => (
            <OInput
              multiline
              placeholder={t('TYPE_YOUR_MESSAGE_HERE', 'Type your message here')}
              value={value}
              onChange={(val: any) => onChange(val)}
              autoCapitalize='none'
              autoCorrect={false}
              blurOnSubmit={false}
              style={style.messageInput}
            />
          )}
          name='message'
          defaultValue=""
        />
      </FormController>
      <OButton
        onClick={handleSubmit(onSubmit)}
        text={actionState?.loading ? t('LOADING', 'Loading') : t('SEND_GIFT_CARD', 'Send gift card')}
        style={style.btnStyle}
        disabled={actionState.loading}
      />
    </Container>
  )
}

export const SendGiftCard = (props: any) => {
  const sendGiftCardProps = {
    ...props,
    showToastMsg: true,
    UIComponent: SendGiftCardUI
  }
  return <SendGiftCardController {...sendGiftCardProps} />
}
