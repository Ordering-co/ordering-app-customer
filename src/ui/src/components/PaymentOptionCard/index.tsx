import React, { useEffect, useMemo, useState } from 'react'
import { View, Modal, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Dimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from 'styled-components/native';
import { PaymentOptionStripe, useLanguage, useSession } from '@components'
import { StripeCardsListUI } from '../StripeCardsList'
import { CardForm } from './CardForm'

import { OButton, OText, Alert, OModal, PaymentOptionsWebView } from '@ui'
import { ModalCloseButton } from '../shared/styles'
import { themeSpace } from '@/theme/helpers'

const iframeCardForm = ['globalpay', 'braintree', 'cybersource']

const PaymentOptionCardUI = (props: any) => {
  const {
    cardSelected,
    deleteCard,
    onSelectCard,
    handleCardClick,
    cardsList,
    addCardOpen,
    setAddCardOpen,
    gateway,
    handleNewCard,
    paymethodsWithoutSaveCards,
    paymethodV2Featured,
    deleteUserCard,
    globalPayIFrameUrl,
    braintreeIFrameUrl,
    cybersourceIFrameUrl,
    paymethod,
    businessId,
    createBusinessUserPaymethod,
    showGateway,
    setShowGateway,
    setCardsList,
    setCardList,
    deleteBusinessUserPaymethod,
    getBusinessUserPaymethods
  } = props
  const [, t] = useLanguage()
  const theme: any = useTheme()
  const insets = useSafeAreaInsets()
  const [{ token }] = useSession()
  const [alertState, setAlertState] = useState<{ open: boolean, content: Array<string> }>({ open: false, content: [] })
  const [newCard, setNewCard] = useState<any>(null)

  const onChangeCardForm = (values: any) => {
    if (values?.valid) {
      const expiry = values?.values?.expiry?.split('/')
      const expiryMonth = expiry[0]
      const expiryYear = expiry[1]
      const expiryString = expiryMonth + expiryYear
      let lastFourDigits = values?.values?.number?.substr(-4);
      setNewCard({
        name: values?.values.name,
        number: values?.values.number.replace(/\s/g, ''),
        cvc: values?.values.cvc,
        expiryMonth: expiryMonth,
        expiryYear: expiryYear,
        expiry: expiry,
        brand: values?.values?.type,
        last4: lastFourDigits,
        expiryString: expiryString
      })
    }
  }

  const handleAddNewCard = () => {
    handleNewCard(newCard)
    setAddCardOpen({ ...addCardOpen, card: false })
    setNewCard(null)
  }

  const callbackAfterCardAction = async (result: any) => {
    if (gateway === 'braintree' && result?.payment_method_nonce !== undefined) {
      setShowGateway({ closedByUser: false, open: false })
      const cards = await getBusinessUserPaymethods?.()
      if (cards?.length) {
        const { last4, brand } = result?.card_data || {}
        const addedCard = (last4 && brand)
          ? cards.find((c: any) => c.last4 === last4 && c.brand === brand) || cards[cards.length - 1]
          : cards[cards.length - 1]
        if (addedCard) {
          onSelectCard?.(addedCard)
          handleCardClick(addedCard)
        }
      }
      return
    }
    setCardsList((prev : any) => ({
      ...prev,
      cards: [...prev.cards, result]
    }))
    setCardList && setCardList((prev : any) => ({
      ...prev,
      cards: [...prev.cards, {
        ...result,
        ...result.type_data,
        id: result.id,
        card_token: result.external_id
      }]
    }))
    onSelectCard?.({
      ...result.type_data,
      id: result.id,
      card_token: result.external_id
    })
    handleCardClick({
      ...result.type_data,
      id: result.id,
      card_token: result.external_id
    })
    setShowGateway({ closedByUser: false, open: false })
  }

  useEffect(() => {
    if (cardsList.error && !cardsList.loading) {
      setAlertState({
        open: true,
        content: cardsList.error
      })
    }
  }, [JSON.stringify(cardsList)])

  const style = useMemo(() => StyleSheet.create({
    // The native modal is full screen: its close button sits below the status bar inset.
    wrapperIcon: {
      alignSelf: 'flex-start',
      marginStart: themeSpace(theme, 'sm'),
      marginTop: insets.top + themeSpace(theme, 'sm'),
      marginBottom: themeSpace(theme, 'lg'),
    },
    addCardButton: {
      marginVertical: themeSpace(theme, 'lg'),
    },
    submitButton: {
      margin: themeSpace(theme, 'lg'),
    },
    flex: { flex: 1 },
  }), [theme, insets.top])

  return (
    <View>
      <>
        {token &&
          (!cardSelected || !paymethodsWithoutSaveCards.includes(gateway)) &&
          ((!paymethodV2Featured || (paymethodV2Featured.includes('get_cards') &&
            paymethodV2Featured.includes('register_cards')))) &&
          (
            <OButton
              text={t('ADD_PAYMENT_CARD', 'Add New Payment Card')}
              size='sm'
              style={style.addCardButton}
              onClick={() => iframeCardForm.includes(gateway) ? setShowGateway((prev: any) => ({ ...prev, open: true })) : setAddCardOpen({ ...addCardOpen, card: true })}
            />
          )}
        <StripeCardsListUI
          cardSelected={cardSelected}
          deleteCard={deleteCard}
          onSelectCard={onSelectCard}
          handleCardClick={handleCardClick}
          cardsList={cardsList}
          noShowErrors
          gateway={gateway}
          deleteUserCard={deleteUserCard}
          paymethodV2Featured={paymethodV2Featured}
          deleteBusinessUserPaymethod={deleteBusinessUserPaymethod}
          onOpen={() => setAddCardOpen({ ...addCardOpen, stripe: true })}
          onCancel={() => setAddCardOpen({ ...addCardOpen, stripe: false })}
        />
      </>
      <Modal
        animationType="slide"
        visible={addCardOpen?.card}
        onDismiss={() => setAddCardOpen({ ...addCardOpen, card: false })}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={style.flex}
        >
          <ScrollView>
            <ModalCloseButton
              onPress={() => setAddCardOpen({ ...addCardOpen, card: false })}
              style={style.wrapperIcon}
            />
            <>
              <CardForm onChange={onChangeCardForm} />
              {alertState?.content?.[0] && !cardsList?.loading && (
                <OText color='danger_text' align='center'>
                  {alertState.content[0]}
                </OText>
              )}
              <OButton
                text={t('ADD_CARD', 'Add card')}
                disabled={!newCard || cardsList?.loading}
                loading={cardsList?.loading}
                onClick={() => handleAddNewCard()}
                style={style.submitButton}
              />
            </>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
      <OModal
        open={showGateway.open && iframeCardForm.includes(gateway)}
        onClose={() => setShowGateway({ closedByUser: false, open: false })}
      >
        <ScrollView
          style={style.flex}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ height: Dimensions.get('window').height - 100 }}>
            <PaymentOptionsWebView
              isAvoidRerender
              isInsideModal
              hideHeader={gateway === 'braintree' || gateway === 'cybersource'}
              uri={gateway === 'braintree' ? braintreeIFrameUrl : gateway === 'cybersource' ? cybersourceIFrameUrl : globalPayIFrameUrl}
              additionalParams={{}}
              setShowGateway={setShowGateway}
              webviewPaymethod={paymethod}
              businessId={businessId}
              createBusinessUserPaymethod={createBusinessUserPaymethod}
              callbackAfterCardAction={callbackAfterCardAction}
            />
          </View>
        </ScrollView>
      </OModal>
      <Alert
        open={alertState?.open || false}
        title=''
        content={alertState.content}
        onClose={() => setAlertState({ open: false, content: [] })}
        onAccept={() => setAlertState({ open: false, content: [] })}
      />
    </View>
  )
}

export const PaymentOptionCard = (props: any) => {
  const paymentOptions = {
    ...props,
    UIComponent: PaymentOptionCardUI
  }
  return (
    <PaymentOptionStripe {...paymentOptions} />
  )
}
