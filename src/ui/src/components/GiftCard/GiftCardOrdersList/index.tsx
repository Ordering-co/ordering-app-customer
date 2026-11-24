import React, { useState } from 'react';
import { useTheme } from 'styled-components/native';
import { themeImage } from '@/theme/helpers'

import { VerticalGiftCardOrdersLayout } from '../VerticalGiftCardOrdersLayout'
import { Band, Container, NoOrdersWrapper } from './styles'
import { useLanguage } from '@components';
import { NotFoundSource } from '@ui'

export const GiftCardOrdersList = (props: any) => {
  const {
    onNavigationRedirect,
    refreshOrders,
    setRefreshOrders
  } = props;

  const theme = useTheme();
  const [, t] = useLanguage();
  const [isEmptyPending, setIsEmptyPending] = useState(false);
  const [isEmptySent, setIsEmptySent] = useState(false);
  const [isEmptyRedeemed, setIsEmptyRedeemed] = useState(false);

  return (
    <Container>
      <VerticalGiftCardOrdersLayout
        title={t('PENDING', 'Pending')}
        defaultStatus='pending'
        setIsEmpty={setIsEmptyPending}
        onNavigationRedirect={onNavigationRedirect}
        refreshOrders={refreshOrders}
        setRefreshOrders={setRefreshOrders}
      />

      {!isEmptyPending && (
        <Band />
      )}

      <VerticalGiftCardOrdersLayout
        title={t('SENT', 'Sent')}
        defaultStatus='sent'
        setIsEmpty={setIsEmptySent}
        onNavigationRedirect={onNavigationRedirect}
        refreshOrders={refreshOrders}
        setRefreshOrders={setRefreshOrders}
      />

      <VerticalGiftCardOrdersLayout
        title={t('REDEEMED', 'Redeemed')}
        defaultStatus='activated'
        setIsEmpty={setIsEmptyRedeemed}
        onNavigationRedirect={onNavigationRedirect}
        refreshOrders={refreshOrders}
        setRefreshOrders={setRefreshOrders}
      />

      {isEmptyPending && isEmptySent && isEmptyRedeemed && (
        <NoOrdersWrapper>
          <NotFoundSource
            srcImage={themeImage(theme, 'empty.not_found')}
            content={t('YOU_DONT_HAVE_CARDS', 'You don\'t have cards')}
          />
        </NoOrdersWrapper>
      )}
    </Container>
  )
}
