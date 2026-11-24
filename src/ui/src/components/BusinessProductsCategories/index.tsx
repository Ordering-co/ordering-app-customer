import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from 'styled-components/native';
import { nativeBoxStyle, nativeShadowStyle, themeGutter, themePart, themeSpace } from '@/theme/helpers';

import { BusinessProductsCategoriesParams } from '../../types';
import { Tabs } from '../../Forms/Tabs'

import { BusinessProductsCategories as ProductsCategories } from '@components';

const BusinessProductsCategoriesUI = (props: any) => {
  const {
    categories,
    loading,
    scrollToCategory,
    selectedCategoryId,
    handlerClickCategory,
    lazyLoadProductsRecommended,
    setCategoryClicked,
    setSelectedCategoryId,
    stuck,
    onBarLayout
  } = props;

  const theme: any = useTheme();
  // `components.category_tabs`: the sticky bar and its tabs (the `tabs` slot, in the look of `scope.tabs`).
  const styles = useMemo(() => {
    const bar = themePart(theme, 'category_tabs', 'base');
    return StyleSheet.create({
      bar: {
        paddingHorizontal: themeGutter(theme),
        paddingBottom: themeSpace(theme, 'sm'),
        ...nativeBoxStyle({ background: bar.background, border: bar.border })
      },
      // Once the bar sticks to the top: `category_tabs.base.sticky_shadow`.
      stuck: nativeShadowStyle(themePart(theme, 'category_tabs', 'base.sticky_shadow'))
    });
  }, [theme]);

  const tabs = categories?.length > 0 ? categories.map((category: any) => ({
    id: category.id,
    tab: category.id,
    type: `cat_${category.id}`,
    text: category.name,
    enabled: true
  })) : []

  const handleCategoryScroll = (category: any) => {
    setCategoryClicked(true);
    setSelectedCategoryId(`cat_${category?.id}`);

    if (!lazyLoadProductsRecommended) {
      // Every product is in the menu: the list scrolls to the category (just under this bar).
      scrollToCategory?.(category?.id ?? null)
    } else {
      handlerClickCategory(category)
    }
  }

  if (loading) return null

  return (
    <View
      style={[styles.bar, stuck && styles.stuck]}
      onLayout={(event: any) => onBarLayout?.(event.nativeEvent.layout.height)}
    >
      <Tabs
        setFullItemAfterClick
        defaultTab={selectedCategoryId ?? `cat_null`}
        defaultTabs={tabs}
        group='category_tabs'
        slot='tabs'
        handleChangeTab={handleCategoryScroll}
      />
    </View>
  );
};

export const BusinessProductsCategories = (
  props: BusinessProductsCategoriesParams,
) => {
  const businessProductsCategoriesProps = {
    ...props,
    UIComponent: BusinessProductsCategoriesUI,
  };

  return <ProductsCategories {...businessProductsCategoriesProps} />;
};
