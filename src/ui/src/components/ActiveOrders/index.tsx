import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from 'styled-components/native';
import { ActiveOrdersContainer } from './styles';
import { themeGutter, themePart, themeSpace } from '@/theme/helpers';

import { ActiveOrdersParams } from '../../types';

import { useConfig, useLanguage } from '@components';
import { SingleOrderCard, OButton } from '@ui';

export const ActiveOrders = (props: ActiveOrdersParams) => {
  const {
    onNavigationRedirect,
    orders,
    pagination,
    loadMoreOrders,
    loading,
    getOrderStatus,
    isMessageView,
    handleClickOrder,
    handleUpdateOrderList
  } = props;

  const theme: any = useTheme();
  const loadMore = themePart(theme, 'orders_page', 'slots.load_more');
  const styles = useMemo(() => {
    // The full-bleed band between the order lists: `divider` variant `band`.
    const band = theme.native.components.divider.variants.band;
    return StyleSheet.create({
      loadMore: { paddingHorizontal: themeGutter(theme), marginBottom: themeSpace(theme, 'lg') },
      band: {
        height: band.line.borderWidth,
        backgroundColor: band.line.borderColor,
        marginVertical: band.spacing,
        marginHorizontal: -themeGutter(theme),
      },
      flush: { marginBottom: 0 },
    });
  }, [theme]);
  const [{ configs }] = useConfig();
  const [, t] = useLanguage();

  const hasMorePages = pagination?.totalPages && pagination?.currentPage < pagination?.totalPages;
  const showLoadMore = hasMorePages || (loading && orders.length > 0);

  return (
    <>
      <ActiveOrdersContainer isMiniCards={configs?.google_maps_api_key?.value} style={showLoadMore ? styles.flush : undefined}>
        {orders.length > 0 &&
          orders.map((order: any, index: any) => (
            <SingleOrderCard
              key={index}
              order={order}
              handleClickOrder={handleClickOrder}
              isMessageView={isMessageView}
              getOrderStatus={getOrderStatus}
              onNavigationRedirect={onNavigationRedirect}
              handleUpdateOrderList={handleUpdateOrderList}
            />
          ))}
      </ActiveOrdersContainer>
      {showLoadMore && (
        <View style={styles.loadMore}>
          <OButton
            onClick={loadMoreOrders}
            text={t('LOAD_MORE_ORDERS', 'Load more orders')}
            color={loadMore.color}
            appearance={loadMore.appearance}
            size={loadMore.size}
            loading={loading}
          />
        </View>
      )}
      {!isMessageView && (
        <View style={styles.band} />
      )}
    </>
  );
};
