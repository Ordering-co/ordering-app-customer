import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Dimensions, StyleSheet } from 'react-native';
import { useTheme } from 'styled-components/native';
import FastImage from 'react-native-fast-image';
import { nativeBoxStyle, nativeTextStyle, reservedBorder, isOpaque, themeGutter, themeImage, themeSpace } from '@/theme/helpers';
import Icon from '../shared/Icon';
import { PressableScale } from '../shared/PressableScale';

import { OrderTypeSelectParams } from '../../types';
import { ORDER_TYPES } from '../../config/constants';
import { ORDER_TYPE_ICONS, ORDER_TYPE_IMAGES, DEFAULT_ORDER_TYPE_ICON } from '../../utils';
import { GridContainer, TypeCard, TypeIconWrapper, EmptyWrapper, Filler } from './styles';
import { OrderTypeControl, useLanguage, useOrder } from '@components';

import { OText, FloatingButton } from '@ui';

const OrderTypeSelectorUI = (props: OrderTypeSelectParams) => {
  const {
    handleChangeOrderType,
    handleChangeType,
    typeSelected,
    configTypes,
    orderTypes,
    goToBack
  } = props;

  const theme: any = useTheme();
  const [orderState] = useOrder();
  const [, t] = useLanguage();
  const [currentOrderType, setCurrentOrderType] = useState<number>(typeSelected);

  const items = orderTypes
    .filter((type: any) => configTypes?.includes(type.value))
    .map((type: any) => {
      return {
        value: type.value,
        label: t(type.content, type.label ?? type.content),
        icon: ORDER_TYPE_ICONS[type.value] || DEFAULT_ORDER_TYPE_ICON,
        image: ORDER_TYPE_IMAGES[type.value] ? themeImage(theme, ORDER_TYPE_IMAGES[type.value]) : undefined,
      };
    });

  const screenWidth = Dimensions.get('window').width;
  const itemsPerRow = items.length >= 5 && screenWidth > 380 ? 3 : 2;
  const gap = themeSpace(theme, 'lg');
  const gridHorizontalPadding = themeGutter(theme);

  // `components.choice`: the resting card, its selected and disabled states.
  const looks = useMemo(() => {
    const choice = theme.native.components.choice
    const states = choice.variants.default.states
    // The selected border's room is kept on every card: selecting never shifts its content.
    const ring = reservedBorder([choice.base, states.selected])
    return StyleSheet.create({
      card: { ...nativeBoxStyle(choice.base), ...ring(choice.base) },
      selected: { ...nativeBoxStyle(states.selected), ...ring(states.selected, choice.base) },
      disabled: { opacity: states.disabled.opacity },
      label: { ...nativeTextStyle(choice.base.text), color: choice.base.color },
      labelSelected: { color: states.selected.color },
      imageWrapper: { flex: 1, alignSelf: 'stretch' },
      image: { flex: 1 },
    })
  }, [theme]);

  const barBackground = theme.native.components.order_types_page.base.bar_background
  const orderTypesButton = theme.native.components.order_types_page.slots.button

  const totalContentWidth = screenWidth - (2 * gridHorizontalPadding);
  // Whole points, so a row's cards and gaps never add up past the row and wrap early.
  const cardWidth = Math.floor((totalContentWidth - ((itemsPerRow - 1) * gap)) / itemsPerRow);

  const handleChangeOrderTypeCallback = (orderType: number) => {
    if (!orderState.loading) {
      setCurrentOrderType(orderType)
    }
  }

  const handleContinue = () => {
    if (!orderState.loading) {
      handleChangeOrderType(currentOrderType)
      goToBack()
    }
  }


  useEffect(() => {
    handleChangeType && handleChangeType(typeSelected)
  }, [typeSelected])

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false}>
        {items.length > 0 ? (
          <GridContainer>
            {items.map((item: any) => {
              const isSelected = item.value === currentOrderType;
              return (
                <PressableScale
                  key={item.value}
                  disabled={orderState.loading}
                  onPress={() => handleChangeOrderTypeCallback(item.value)}
                  style={{ width: cardWidth }}
                >
                  <TypeCard style={[looks.card, isSelected && looks.selected, orderState.loading && looks.disabled]}>
                    <TypeIconWrapper style={item.image && looks.imageWrapper}>
                      {item.image ? (
                        <FastImage style={looks.image} source={item.image} objectFit='contain' />
                      ) : (
                        <Icon
                          set={item.icon.set}
                          name={item.icon.name}
                          size='lg'
                          color={(isSelected && looks.labelSelected.color) || looks.label.color}
                        />
                      )}
                    </TypeIconWrapper>
                    <OText style={[looks.label, isSelected && looks.labelSelected]}>{item.label}</OText>
                  </TypeCard>
                </PressableScale>
              )
            })}
          </GridContainer>
        ) : (
          <EmptyWrapper>
            <OText>{t('NO_ORDER_TYPES_AVAILABLE', 'No order types available.')}</OText>
          </EmptyWrapper>
        )}
        <Filler />
      </ScrollView>
      <FloatingButton
        text={t('CONTINUE', 'Continue')}
        handleClick={handleContinue}
        loading={typeSelected === undefined || typeSelected === null || orderState.loading}
        look={orderTypesButton.appearance ? orderTypesButton : undefined}
        containerStyle={isOpaque(barBackground) ? { backgroundColor: barBackground } : undefined}
      />
    </>
  );
};

export const OrderTypeSelector = (props: any) => {
  const orderTypeProps = {
    ...props,
    UIComponent: OrderTypeSelectorUI,
    orderTypes: props.orderTypes || ORDER_TYPES,
  };
  return <OrderTypeControl {...orderTypeProps} />;
};

