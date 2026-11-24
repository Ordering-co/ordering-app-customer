import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from 'styled-components/native';
import { Fade, Placeholder, PlaceholderLine } from '@/ui/src/components/shared/Skeleton';

import {
  CategoriesContainer,
  CategoryRowScrollView
} from './styles';
import { FilterChip } from '../BusinessListingSearch/FilterChip';
import Icon from '../shared/Icon'
import { StableText } from '../shared/StableText'
import { PressableScale } from '../shared/PressableScale';
import { nativeTextStyle, reservedBorder, themeImage, themeRadius, themeSpace, themeVisible } from '@/theme/helpers';

import { BusinessTypeFilterParams } from '../../types';
import { businessTypeLabel, isAllBusinessType } from './typeLabel';
import { BusinessTypeFilter as BusinessTypeFilterController, useLanguage } from '@components';
import { OIcon } from '@ui';

export const BusinessTypeFilterUI = (props: BusinessTypeFilterParams) => {
  const {
    typesState,
    currentTypeSelected,
    handleChangeBusinessType,
    setBusinessTypes,
    isSearchMode,
    filters,
    handleChangeFilters
  } = props;

  const [, t] = useLanguage();
  const theme: any = useTheme();
  const types = theme.native.components.business_types
  const chip = theme.native.components.chip
  // The chips' size: the home's `business_types.pill`, or the caller's (the search
  // screen passes its filter bar's, so both rows of chips are one height).
  const pillSize = props.pillSize ?? types.slots.pill.size
  // How the types are drawn (`business_types.base.layout`): pills, pills with the
  // type's image, or tiles (the image over its name); always one row that scrolls.
  const isGrid = types.base.layout === 'grid' && !!props.grid
  const layout: 'pills' | 'pills_image' | 'tiles' = types.base.layout === 'grid' ? 'tiles' : types.base.layout
  const [gridWidth, setGridWidth] = useState(0)
  const columns = types.base.grid_columns
  const columnWidth = Math.max(0, Math.floor((gridWidth - types.base.gap * (columns - 1)) / columns))
  const imageSize = isGrid ? columnWidth : types.base.image_size
  const styles = useMemo(() => {
    const ring = reservedBorder([{ border: types.base.image_selected_border }])
    const pillHeight = chip.sizes[pillSize].height
    const pillImage = Math.max(0, pillHeight - 2 * themeSpace(theme, 'xs'))
    return StyleSheet.create({
      // A category tile (`business_types`): the image over its label.
      tile: { width: isGrid ? columnWidth : types.base.tile_width, alignItems: 'center', gap: types.base.image_gap },
      grid: { flexDirection: 'row', flexWrap: 'wrap', gap: types.base.gap, paddingVertical: themeSpace(theme, 'sm') },
      // The selected border's room is kept on every image: selecting only colors it.
      image: {
        width: imageSize,
        height: imageSize,
        borderRadius: types.base.image_radius,
        backgroundColor: types.base.image_background,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        ...ring(null)
      },
      imageSelected: ring({ border: types.base.image_selected_border }),
      label: { ...nativeTextStyle(types.base.label), color: types.base.label_color, textAlign: 'center' },
      labelBox: { alignSelf: 'stretch' },
      labelSelected: { color: types.base.label_active_color },
      // A pill's image: round, inside the pill's height.
      pillImage: { width: pillImage, height: pillImage, borderRadius: themeRadius(theme, 'full', { fixed: true }), overflow: 'hidden' },
      skeleton: { height: pillHeight, borderRadius: chip.base.radius }
    })
  }, [theme, types, chip, pillSize, isGrid, columnWidth, imageSize])

  useEffect(() => {
    if (typesState?.types?.length > 0) {
      setBusinessTypes && setBusinessTypes(typesState?.types)
    }
  }, [typesState?.types]);

  const getCategoryLabel = (type: any) => businessTypeLabel(type, t)

  // The listing's "All" category can be hidden by the theme (`business_listing.categories.all`).
  const showAllCategory = isSearchMode || themeVisible(theme, 'business_listing.categories.all');
  const categories = (typesState?.types ?? []).filter((type: any) => showAllCategory || !isAllBusinessType(type));
  // A type's image: its own, else the theme's category image (`categories.all`).
  const typeImage = (type: any) => type?.image
    ? { url: type.image }
    : { src: themeImage(theme, 'categories.all') };

  const handleChangeActiveBusinessType = (type: any) => {
    if (type?.id === null) {
      handleChangeFilters('business_types', [])
      return
    }
    if (filters?.business_types?.includes(type?.id)) {
      const arrayAux = [...(filters?.business_types ?? [])]
      const index = arrayAux.indexOf(type?.id)
      arrayAux.splice(index, 1)
      handleChangeFilters('business_types', arrayAux)
    } else {
      handleChangeFilters('business_types', [...filters?.business_types, type?.id])
    }
  }

  const renderCategory = (item: any) => {
    const isSelected = currentTypeSelected === item?.id;
    const withImage = layout === 'pills_image' && !isAllBusinessType(item);
    return (
      <FilterChip
        key={item?.id ?? item?.name}
        size={pillSize}
        text={getCategoryLabel(item)}
        leading={withImage ? (
          <View testID='category-icon' style={styles.pillImage}>
            <OIcon {...typeImage(item)} width={styles.pillImage.width} height={styles.pillImage.height} cover />
          </View>
        ) : undefined}
        selected={isSelected}
        onPress={() => handleChangeBusinessType(item?.id)}
      />
    );
  }

  const renderCategoryCard = (item: any) => {
    const isAllCategory = isAllBusinessType(item);
    const isSelected = currentTypeSelected === item?.id;
    return (
      <PressableScale
        key={item?.id ?? item?.name}
        onPress={() => handleChangeBusinessType(item?.id)}
        style={styles.tile}
      >
        <View testID='category-icon' style={[styles.image, isSelected && styles.imageSelected]}>
          {isAllCategory
            ? <Icon name='grid-outline' size='lg' color={isSelected ? styles.labelSelected.color : styles.label.color} />
            : <OIcon {...typeImage(item)} width={imageSize} height={imageSize} cover />}
        </View>
        {/* Bold when selected, in the room of its bold copy: selecting never moves the row. */}
        <StableText
          boxStyle={styles.labelBox}
          style={[styles.label, isSelected && styles.labelSelected]}
          weight={isSelected ? 'bold' : undefined}
          reserveWeight='bold'
          numberOfLines={2}
        >
          {getCategoryLabel(item)}
        </StableText>
      </PressableScale>
    );
  }

  if (typesState?.loading) {
    return (
      <CategoriesContainer>
        <Placeholder Animation={Fade}>
          <CategoryRowScrollView>
            {[...Array(8)].map((_, i) => (
              <PlaceholderLine
                key={i}
                noMargin
                color={theme.native.components.skeleton.base.color}
                style={[styles.skeleton, { width: styles.skeleton.height * (2 + (i % 3)) }]}
              />
            ))}
          </CategoryRowScrollView>
        </Placeholder>
      </CategoriesContainer>
    );
  }

  if (typesState?.error || !typesState?.types || typesState?.types.length === 0) {
    return null;
  }

  if (isSearchMode) {
    return (
      <CategoriesContainer>
        <CategoryRowScrollView>
          {categories.map((type: any) => type.enabled && (
            <FilterChip
              key={type?.id}
              size={pillSize}
              text={getCategoryLabel(type)}
              selected={filters?.business_types?.includes(type?.id) || (type?.id === null && filters?.business_types?.length === 0)}
              onPress={() => handleChangeActiveBusinessType(type)}
            />
          ))}
        </CategoryRowScrollView>
      </CategoriesContainer>
    );
  }

  if (isGrid) {
    return (
      <CategoriesContainer>
        <View
          testID='category-grid'
          style={styles.grid}
          onLayout={(event) => setGridWidth(Math.floor(event.nativeEvent.layout.width))}
        >
          {gridWidth > 0 && categories.map(renderCategoryCard)}
        </View>
      </CategoriesContainer>
    );
  }

  return (
    <CategoriesContainer>
      <CategoryRowScrollView testID='category-row' isCardMode={layout === 'tiles'}>
        {categories.map(layout === 'tiles' ? renderCategoryCard : renderCategory)}
      </CategoryRowScrollView>
    </CategoriesContainer>
  );
};

export const BusinessTypeFilter = (props: BusinessTypeFilterParams) => {
  const businessTypeFilterProps = {
    ...props,
    UIComponent: BusinessTypeFilterUI,
    businessTypes: props.businessTypes,
    defaultBusinessType: props.defaultBusinessType || null,
    onChangeBusinessType: props.handleChangeBusinessType,
  };

  return <BusinessTypeFilterController {...businessTypeFilterProps} />;
};
