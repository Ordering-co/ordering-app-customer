import React, { useEffect } from 'react';
import { Placeholder, PlaceholderLine, Fade } from '@/ui/src/components/shared/Skeleton';

import { SingleGiftCard } from '../SingleGiftCard';
import { ProductsListContainer, SingleGiftCardWrapper, SkeletonTitle, WrappButton } from './styles'

import { useLanguage, GiftCardOrdersList as GiftCardOrdersListController } from '@components';
import { OButton, OText } from '../../shared';

const VerticalGiftCardOrdersLayoutUI = (props: any) => {
  const {
    giftCards,
    paginationProps,
    loadMoreOrders,
    title,
    setIsEmpty,
    onNavigationRedirect
  } = props

  const [, t] = useLanguage()

  useEffect(() => {
    if (giftCards.loading) return
    if (giftCards.list?.length === 0) setIsEmpty(true)
  }, [giftCards])

  return (
    <ProductsListContainer>
      {
        giftCards.loading ? (
          <SkeletonTitle>
            <Placeholder Animation={Fade}>
              <PlaceholderLine width={30} height={16} />
            </Placeholder>
          </SkeletonTitle>
        ) : giftCards.list?.length > 0 && (
          <OText preset='body_lg' weight={700} mTop='xl' mBottom='lg'>{title}</OText>
        )}
      {giftCards.list.map((card: any) => (
        <SingleGiftCardWrapper key={card.id}>
          <SingleGiftCard
            card={card}
            onNavigationRedirect={onNavigationRedirect}
          />
        </SingleGiftCardWrapper>
      ))}
      {giftCards.loading && (
        [...Array(10).keys()].map(i => (
          <SingleGiftCardWrapper key={i}>
            <SingleGiftCard
              isSkeleton
            />
          </SingleGiftCardWrapper>
        ))
      )}
      {paginationProps.totalPages && paginationProps.currentPage < paginationProps.totalPages && (
        <WrappButton>
          <OButton
            onClick={loadMoreOrders}
            text={t('LOAD_MORE_ORDERS', 'Load more orders')}
          />
        </WrappButton>
      )}
    </ProductsListContainer>
  )
}

export const VerticalGiftCardOrdersLayout = (props: any) => {
  const giftCardsProps = {
    ...props,
    UIComponent: VerticalGiftCardOrdersLayoutUI
  }
  return <GiftCardOrdersListController {...giftCardsProps} />
}
