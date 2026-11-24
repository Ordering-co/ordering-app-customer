import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { PlaceholderLine } from '@/ui/src/components/shared/Skeleton';
import { useTheme } from 'styled-components/native';
import {
  PaymentOptionStripe,
  useSession,
  useLanguage,
  useValidationFields
} from '@components';
import { getIconCard } from '../../utils';
import { CardRow, CardRowContent, CardRowAction } from './styles';
import Icon from '../shared/Icon';
import ChoiceMark from '../shared/ChoiceMark';
import { themeColor, themeIconSize, themeOpacity, themeSpace } from '@/theme/helpers';
import {
  OAlert,
  OText,
  NotFoundSource,
  OButton,
  StripeElementsForm
} from '@ui';

const paymethodsWithoutStripeForm = ['credomatic', 'izipay', 'globalpay', 'hitpay', 'braintree', 'cybersource']

export const StripeCardsListUI = (props: any) => {
  const {
    onSelectCard,
    deleteCard,
    cardsList,
    handleCardClick,
    onOpen,
    gateway,
    paySelected,
    newCardAdded,
    addNewCardAsDefault,
    setUserHasCards,
    cardSelected,
    paymethodV2Featured,
    deleteUserCard,
    deleteBusinessUserPaymethod
  } = props

  const theme: any = useTheme()
  const styles = useMemo(() => StyleSheet.create({
    container: { marginTop: themeSpace(theme, 'lg') },
    skeleton: { marginBottom: themeSpace(theme, 'lg') },
    // The saved cards scroll inside the checkout after 150 pt (about three rows).
    cardsList: { width: '100%', maxHeight: 150 },
    invalid: { opacity: themeOpacity(theme, 'disabled') },
    form: { marginTop: themeSpace(theme, 'lg') },
    fullWidth: { width: '100%' },
  }), [theme])
  const [{ token }] = useSession()
  const [, t] = useLanguage()
  const [validationFields] = useValidationFields()
  const validateZipcodeCard =
    validationFields?.fields?.card?.zipcode?.enabled && validationFields?.fields?.card?.zipcode?.required

  const [openStripeForm, setOpenStripeForm] = useState(false)

  const handleCardSelected = (card: any) => {
    if (!card?.zipcode && validateZipcodeCard) return
    handleCardClick(card);
    onSelectCard(card);
  }

  const handleDeleteCard = (card: any) => {
    paymethodV2Featured
      ? ['izipay'].includes(gateway)
        ? deleteUserCard(card)
        : deleteBusinessUserPaymethod(card)
      : deleteCard(card)
  }

  useEffect(() => {
    if (!cardsList?.loading && cardsList?.cards?.length === 0 && !paymethodsWithoutStripeForm.includes(gateway)) {
      onOpen && onOpen();
    }
  }, [cardsList?.loading])

  useEffect(() => {
    if (newCardAdded && addNewCardAsDefault) {
      handleCardSelected(newCardAdded)
    }
  }, [JSON.stringify(newCardAdded)])

  useEffect(() => {
    const hasCardSelected = cardsList?.cards?.some?.((card: any) => card?.id === paySelected?.data?.id)
    setUserHasCards && setUserHasCards(cardsList?.cards?.length > 0 && hasCardSelected)
  }, [cardsList?.cards?.length, paySelected])

  return (
    <View style={styles.container}>
      {token && cardsList.error && cardsList.error.length > 0 && (
        <NotFoundSource
          content={cardsList?.error[0]?.message || cardsList?.error[0]}
        />
      )}

      {token && cardsList.loading && (
        <View style={styles.fullWidth}>
          {[...Array(2)].map((_, i) => (
            <PlaceholderLine
              key={i}
              height={44}
              noMargin
              style={styles.skeleton}
            />
          ))}
        </View>
      )}

      {token && !cardsList.loading && cardsList.cards && cardsList.cards.length > 0 && (
        <ScrollView
          horizontal={false}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled={true}
          style={styles.cardsList}
        >
          {cardsList.cards.map((card: any) => {
            const isInvalid = !card?.zipcode && validateZipcodeCard
            const isSelected = card.id === (paySelected?.data?.id || cardSelected?.id)
            return (
              <CardRow key={card.id} style={isInvalid ? styles.invalid : undefined}>
                <CardRowContent onPress={() => handleCardSelected(card)}>
                  <ChoiceMark kind='radio' checked={!!isSelected} />
                  {getIconCard(card.brand, themeIconSize(theme, 'md'), themeColor(theme, 'text'))}
                  <OText preset='body_sm'>
                    XXXX-XXXX-XXXX-{card.last4 || '****'}
                  </OText>
                  {isInvalid && (
                    <OText preset='caption' color='danger_text'>
                      ({t('MISSING_ZIPCODE', 'Missing zipcode')})
                    </OText>
                  )}
                </CardRowContent>
                {(paymethodV2Featured?.includes('delete_cards') || !paymethodV2Featured) && (
                  <OAlert
                    title={t('CARD', 'Card')}
                    message={t('QUESTION_DELETE_CARD', 'Are you sure that you want to delete the card?')}
                    onAccept={() => handleDeleteCard(card)}
                  >
                    <CardRowAction>
                      <Icon name='trash-outline' size='md' color='danger' />
                    </CardRowAction>
                  </OAlert>
                )}
              </CardRow>
            )
          })}
        </ScrollView>
      )}

      {token && !cardsList.loading && !openStripeForm && !paymethodsWithoutStripeForm.includes(gateway) && (
        <OButton
          text={t('ADD_PAYMENT_CARD', 'Add New Payment Card')}
          size='sm'
          onClick={() => setOpenStripeForm(!openStripeForm)}
        />
      )}
      {openStripeForm && (
        <View style={styles.form}>
          <StripeElementsForm
            toSave={props.toSave}
            gateway={gateway}
            cardsGateway={props.cardsGateway ?? gateway}
            openCarts={props.openCarts}
            businessId={props.businessId}
            businessIds={props.businessIds}
            publicKey={props.publicKey}
            publicKeyAddCard={props.publicKeyAddCard}
            accountId={props.accountId}
            requirements={props.clientSecret}
            onSelectCard={onSelectCard}
            setNewCardAdded={props.handleNewCard}
            setCardsList={props.setCardsList}
            cardsList={cardsList}
            handleCardClick={handleCardClick}
            onCancel={() => setOpenStripeForm(!openStripeForm)}
          />
        </View>
      )}
    </View>
  )
}

export const StripeCardsList = (props: any) => {
  const stripeCardsListProps = {
    ...props,
    UIComponent: StripeCardsListUI
  }
  return (
    <PaymentOptionStripe {...stripeCardsListProps} />
  )
}
