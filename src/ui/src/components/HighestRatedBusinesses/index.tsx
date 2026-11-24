import React, { useEffect, useMemo } from 'react';
import { SectionTitle } from '../shared/SectionTitle'
import { View, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { useTheme } from 'styled-components/native';
import { nativeTextStyle, themeSpace } from '@/theme/helpers';
import { Fade, Placeholder, PlaceholderLine } from '../shared/Skeleton';
import { BusinessCardSkeleton } from '../BusinessController/BusinessCardSkeleton';

import { HighestRatedBusinessesParams } from '../../types';

import {
  BusinessList as BusinessesListingController,
  useLanguage,
  useOrder
} from '@components';

import { BusinessController } from '@ui'

const HighestRatedBusinessesUI = (props: HighestRatedBusinessesParams) => {
  const {
    businessesList,
    onBusinessClick,
    navigation,
    isLoading,
    getBusinesses,
    favoriteIds,
    setFavoriteIds,
    handleUpdateBusinessList
  } = props;

  const theme: any = useTheme()
  const [, t] = useLanguage()
  const [orderState] = useOrder()

  const windowWidth = Dimensions.get('window').width;
  // A card of the carousel leaves the next one peeking (layout).
  const cardWidth = windowWidth - 100
  const section = theme.native.components.section_header.base
  const skeletonColor = theme.native.components.skeleton.base.color
  const styles = useMemo(() => {
    return StyleSheet.create({
      carousel: { gap: themeSpace(theme, 'lg'), paddingHorizontal: themeSpace(theme, 'xxs') },
      item: { width: cardWidth },
      // The section title's box (`section_header`): its two lines and the space under it.
      titleLine: { width: '40%', height: nativeTextStyle(section.title).lineHeight, marginBottom: section.gap },
      descriptionLine: { width: '25%', height: nativeTextStyle(section.description).lineHeight, marginBottom: section.margin_bottom }
    })
  }, [theme, cardWidth])

  useEffect(() => {
    if (businessesList?.loading || !isLoading) return
    getBusinesses(true)
  }, [isLoading])

  useEffect(() => {
    if (!businessesList?.businesses?.length) return
    const ids = [...favoriteIds]
    businessesList.businesses.forEach(business => {
      if (business?.favorite) {
        ids.push(business.id)
      }
    })
    const next = [...new Set(ids)]
    // A new array re-renders every card: only when the ids change.
    if (next.length !== favoriteIds.length || next.some((id: any, i: number) => id !== favoriteIds[i])) {
      setFavoriteIds(next)
    }
  }, [businessesList?.businesses?.length])

  return (
    <>
      {!businessesList.loading && businessesList.businesses.length > 0 && (
        <View>
          <SectionTitle description={t('TOP_BUSINESS_SUBTITLE', 'Sponsored')}>{t('TOP_BUSINESS', 'Top business')}</SectionTitle>
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carousel}
          >
            {
              businessesList.businesses?.map(
                (business: any, i: number) => (
                  <View key={i} style={styles.item}>
                    <BusinessController
                      isHighestRatedBusiness
                      business={business}
                      isBusinessOpen={business?.open}
                      handleCustomClick={onBusinessClick}
                      orderType={orderState?.options?.type}
                      navigation={navigation}
                      favoriteIds={favoriteIds}
                      setFavoriteIds={setFavoriteIds}
                      handleUpdateBusinessList={handleUpdateBusinessList}
                    />
                  </View>
                )
              )
            }
          </ScrollView>
        </View>
      )}
      {businessesList.loading && (
        <View>
          {/* The title's own room as placeholder lines: the loaded list does not move down by it. */}
          <Placeholder Animation={Fade}>
            <PlaceholderLine noMargin color={skeletonColor} style={styles.titleLine} />
            <PlaceholderLine noMargin color={skeletonColor} style={styles.descriptionLine} />
          </Placeholder>
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carousel}
          >
            {[...Array(10).keys()].map((_, i) => (
              <View key={i} style={styles.item}>
                <BusinessCardSkeleton narrow />
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </>
  )
}

/** The listing's "Top business" carousel (section `highest_rated` of `pages.business_listing`). */
export const HighestRatedBusinesses = (props: any) => {
  const highestRatedBusinessesProps = {
    ...props,
    UIComponent: HighestRatedBusinessesUI,
    isFeatured: true,
    paginationSettings: { initialPage: 1, pageSize: 20, controlType: 'infinity' }
  };

  return <BusinessesListingController {...highestRatedBusinessesProps} />;
};
