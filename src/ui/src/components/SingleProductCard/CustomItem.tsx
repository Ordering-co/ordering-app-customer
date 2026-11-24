import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from 'styled-components/native';
import FastImage from 'react-native-fast-image';

import { useLanguage } from '@components';
import Icon from '../shared/Icon';
import OButton from '../shared/OButton';
import OText from '../shared/OText';
import { PressableScale } from '../shared/PressableScale';
import { nativeTextStyle, themeColor, themePart, themeSpace } from '@/theme/helpers';
import { Ribbon } from './Ribbon';

/**
 * The product tile (featured, order it again, upselling): the product card's
 * photo, texts and `action` slot (`components.product_card`).
 */
export const CustomItem = (props: any) => {
  const {
    name,
    image,
    price,
    reviewsTotal,
    lastOrderedDate,
    isPreviously,
    isFeatured,
    isUpselling,
    ribbon,
    onClick
  } = props;

  const theme: any = useTheme();
  const [, t] = useLanguage();
  const action = themePart(theme, 'product_card', 'slots.action');
  const actionInk = themePart(theme, 'button', `variants.${action.color}.${action.appearance}.color`);

  const styles = useMemo(() => {
    const card = themePart(theme, 'product_card', 'base');
    return StyleSheet.create({
      card: { width: '100%' },
      imageBox: {
        width: '100%',
        aspectRatio: isPreviously ? 1.7 : 1,
        backgroundColor: themeColor(theme, 'surface_alt'),
        borderRadius: card.image_radius,
        overflow: 'hidden',
        marginBottom: themeSpace(theme, 'xs'),
      },
      image: { width: '100%', height: '100%' },
      add: { position: 'absolute', bottom: themeSpace(theme, 'xs'), right: themeSpace(theme, 'xs') },
      ribbon: { position: 'absolute', zIndex: 1, top: -themeSpace(theme, 'xs'), right: -themeSpace(theme, 'xs') },
      name: { ...nativeTextStyle(card.name), color: card.name_color },
      price: { ...nativeTextStyle(card.price), color: card.price_color },
      row: { flexDirection: 'row', alignItems: isUpselling ? 'flex-end' : 'center', justifyContent: 'space-between' },
      rating: { flexDirection: 'row', alignItems: 'center', marginLeft: themeSpace(theme, 'sm') },
    });
  }, [theme, isPreviously, isUpselling]);

  const handleClick = () => onClick && onClick();

  return (
    <PressableScale onPress={handleClick} style={styles.card}>
      <View>
        <Ribbon ribbon={ribbon} style={styles.ribbon} />
        {!!image && (
          <View style={styles.imageBox}>
            <FastImage
              style={styles.image}
              source={image}
              objectFit='cover'
            />
          </View>
        )}
        {isFeatured && !!image && (
          <View style={styles.add}>
            <OButton
              iconOnly
              icon={<Icon name='add' color={actionInk} />}
              color={action.color}
              appearance={action.appearance}
              size={action.size}
              accessibilityLabel={t('ADD', 'Add')}
              onClick={handleClick}
            />
          </View>
        )}
      </View>
      <OText style={styles.name} numberOfLines={1}>{name}</OText>
      {isPreviously && (
        <OText>{t('LAST_ORDERED_ON', 'Last ordered on')} {lastOrderedDate}</OText>
      )}
      <View style={styles.row}>
        <OText style={styles.price}>{price}</OText>
        {isFeatured && reviewsTotal && (
          <View style={styles.rating}>
            <Icon name='star' size='sm' color='rating' />
            <OText mLeft='xs' weight={600} color='rating'>
              {reviewsTotal}
            </OText>
          </View>
        )}
        {isUpselling && (
          <OButton
            iconOnly
            icon={<Icon name='add' color={actionInk} />}
            color={action.color}
            appearance={action.appearance}
            size={action.size}
            accessibilityLabel={t('ADD', 'Add')}
            onClick={handleClick}
          />
        )}
      </View>
    </PressableScale>
  );
};
