import React from 'react';
import { useTheme } from 'styled-components/native';
import { themePart } from '@/theme/helpers';

import { PreviousOrdersParams } from '../../types';
import { Container, WrappButton } from './styles';
import { useLanguage } from '@components';
import { OButton, SingleOrderCard } from '@ui';

export const PreviousOrders = (props: PreviousOrdersParams) => {
  const {
    orders,
    pagination,
    onNavigationRedirect,
    loadMoreOrders,
    getOrderStatus,
    handleReorder,
    reorderLoading,
    orderID,
    handleUpdateOrderList,
    loading
  } = props;

  const theme: any = useTheme();
  const loadMore = themePart(theme, 'orders_page', 'slots.load_more');

  const [, t] = useLanguage();

  const pastOrders = [1, 2, 5, 6, 10, 11, 12, 15, 16, 17]

  return (
    <Container>
      {orders.map((order: any, i: number) => (
        <SingleOrderCard
          key={i}
          order={order}
          reorderLoading={reorderLoading}
          handleReorder={handleReorder}
          onNavigationRedirect={onNavigationRedirect}
          getOrderStatus={getOrderStatus}
          pastOrders={pastOrders.includes(order?.status)}
          handleUpdateOrderList={handleUpdateOrderList}
        />
      ))}
      {!loading && pagination.totalPages && pagination.currentPage < pagination.totalPages && (
        <WrappButton>
          <OButton
            onClick={loadMoreOrders}
            text={t('LOAD_MORE_ORDERS', 'Load more orders')}
            color={loadMore.color}
            appearance={loadMore.appearance}
            size={loadMore.size}
          />
        </WrappButton>
      )}
    </Container>
  );
};
