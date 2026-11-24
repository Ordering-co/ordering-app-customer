import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from 'styled-components/native';
import { ChSummary } from './styles';
import { Placeholder, PlaceholderLine, Fade } from '@/ui/src/components/shared/Skeleton';
import FastImage from 'react-native-fast-image';
import { themeControlHeight, themePart, themeSpace, themeVisible } from '@/theme/helpers';

import { Cart, useLanguage, useOrder, useUtils } from '@components';
import { OText } from '@ui';
import { EditButton } from '../shared/EditButton';

const SummaryUI = (props: any) => {
  const { showComponent, businessId, HeaderTitle, loading, navigation } = props;

  const theme: any = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    list: { flexDirection: 'column', marginTop: themeSpace(theme, 'sm') },
    item: { flexDirection: 'column', marginBottom: themeSpace(theme, 'sm') },
    skeletonLine: { marginBottom: themeSpace(theme, 'xs') },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    // layout: the quantity column, two digits wide
    quantity: { width: 25 },
    name: { flex: 1 },
    // A product's photo (`checkout.products.image`): a control-high square with the product card's radius.
    image: {
      width: themeControlHeight(theme, 'md'),
      height: themeControlHeight(theme, 'md'),
      borderRadius: themePart(theme, 'product_card', 'base.image_radius'),
      marginRight: themeSpace(theme, 'sm')
    }
  }), [theme]);
  const [{ carts }] = useOrder();
  const [, t] = useLanguage();
  const [{ parsePrice }] = useUtils();

  const cart = carts?.[`businessId:${businessId}`] ?? {};
  const cartProducts = cart?.products;
  // The API rejects any change to a cart with a payment in progress
  const isCartPending = cart?.status === 2;

  const showImages = themeVisible(theme, 'checkout.products.image');

  if (!showComponent) return null;

  const toppingsRemoved: any = (product: any) => cart?.toppings_removed?.[product?.code];

  const productInfo: any = (product: any) => {
    let options = JSON.parse(JSON.stringify(Object.values(product.options ?? {})));
    const extraGroups = options.reduce((acc: any, option: any) => {
      const extraRank = option?.extra?.rank;
      acc[extraRank] = acc[extraRank] || [];
      acc[extraRank].push(option);
      return acc;
    }, {});

    const sortedExtraGroups = Object.entries(extraGroups).sort(([rankA]: any, [rankB]: any) => rankA - rankB);

    sortedExtraGroups.forEach(([_, group]: any) => {
      group.sort((a: any, b: any) => a.rank - b.rank);
    });

    options = sortedExtraGroups.flatMap(([, group]) => group);

    const ingredients = JSON.parse(JSON.stringify(Object.values(product.ingredients ?? {})));
    options = options.map((option: any) => {
      option.suboptions = Object.values(option.suboptions ?? {});
      return option;
    });
    return {
      ...productInfo,
      ingredients,
      options
    };
  };

  return (
    <ChSummary>
      {loading ? (
        <Placeholder Animation={Fade}>
          <View style={styles.list}>
            {[...Array(3)].map((_, index) => (
              <View key={index} style={styles.item}>
                <PlaceholderLine height={20} width={80} style={styles.skeletonLine} />
                <PlaceholderLine height={20} width={60} />
              </View>
            ))}
          </View>
        </Placeholder>
      ) : (
        <>
          <View style={styles.header}>
            {HeaderTitle}
            {navigation && !isCartPending && (
              <EditButton
                testID='checkout-edit-cart'
                accessibilityLabel={t('EDIT', 'Edit')}
                onClick={() => navigation.navigate('UpsellingPage', { businessId: cart?.business_id })}
              />
            )}
          </View>
          <View style={styles.list}>
            {cartProducts?.map((product: any, index: number) => (
              <View key={product?.id + index} style={styles.item}>
                <View style={styles.line}>
                  {showImages && !!product?.images && (
                    <FastImage
                      style={styles.image}
                      source={{ uri: product.images, priority: FastImage.priority.normal }}
                      objectFit='cover'
                    />
                  )}
                  {/* A product line reads as on the order's details: quantity, name, price. */}
                  <OText preset='body_sm' color='text_muted' style={styles.quantity}>
                    {`${product?.quantity || 0}\u00D7`}
                  </OText>
                  <View style={styles.name}>
                    <OText preset='body'>
                      {product?.name}
                    </OText>
                    {(
                      toppingsRemoved(product)?.removed?.length > 0 ||
                      productInfo(product)?.ingredients?.some((ingredient: any) => !ingredient.selected) ||
                      productInfo(product)?.options?.some((option: any) => option.suboptions.length > 0)
                    ) && (
                      <OText preset='body_sm' color='text_muted'>
                        {[
                          ...(toppingsRemoved(product)?.removed ?? [])?.map((topping: any) => `${t('NO', 'No')} ${topping?.name}`),
                          ...(productInfo(product)?.ingredients ?? [])?.filter((ingredient: any) => !ingredient.selected).map((ingredient: any) => ingredient.name),
                          ...(productInfo(product)?.options ?? [])?.sort((a: any, b: any) => a.rank - b.rank).map((option: any) => option.suboptions.map((suboption: any) => `${option.name}: ${suboption.name}`)).flat()
                        ].join(', ')}
                      </OText>
                    )}
                  </View>
                  <OText preset='body'>
                    {parsePrice(product?.total || product?.price)}
                  </OText>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </ChSummary>
  );
};

export const Summary = (props: any) => {
  const summaryProps = {
    ...props,
    UIComponent: SummaryUI
  };

  return (
    <Cart {...summaryProps} />
  );
}
