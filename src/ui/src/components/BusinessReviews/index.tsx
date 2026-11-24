import React, { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import moment from 'moment';
import { useTheme } from 'styled-components/native';

import { BusinessReviewsParams } from '../../types';
import { setLocalMoment } from '../../utils';
import { ReviewItem } from './Item';

import { BusinessReviewsContainer, BusinessReviewContent, ReviewSummaryContainer, RankingIconContainer, RatingValueContainer } from './styles';

import { BusinessReviews as BusinessReviewController, useLanguage } from '@components';
import { OText } from '@ui';
import Icon from '../shared/Icon';
import { themeGutter, themeSpace, themeVisible } from '@/theme/helpers';

const BusinessReviewsUI = (props: BusinessReviewsParams) => {
  const { reviewsList, businessState } = props;
  const [, t] = useLanguage();
  const theme: any = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    list: { paddingHorizontal: themeGutter(theme), gap: themeSpace(theme, 'sm'), paddingBottom: themeSpace(theme, 'xxxl') },
  }), [theme]);

  const averageRating = businessState?.business?.reviews?.total

  useEffect(() => {
    setLocalMoment(moment, t)
  }, [])

  return (
    <BusinessReviewsContainer>
      {typeof averageRating === 'number' && themeVisible(theme, 'business.reviews.ranking') && (
        <ReviewSummaryContainer>
          <RankingIconContainer>
            <Icon set='mci' name='trophy' size={theme.native.tokens.size.xl} color={theme.native.components.rating.base.color} />
          </RankingIconContainer>
          <RatingValueContainer>
            <OText preset='h1' size={60}>{averageRating.toFixed(1)}</OText>
            <OText>{t('OF_THE_5_0', 'of the 5.0')}</OText>
          </RatingValueContainer>
        </ReviewSummaryContainer>
      )}
      <BusinessReviewContent
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}>
        {reviewsList.error ? (
          <OText preset='body_lg'>{t('ERROR_UNKNOWN', 'An error has occurred')}</OText>
        ) : (
          <>
            {reviewsList?.reviews.map((review: any) => (
              <ReviewItem
                key={`review_key_${review.id}`}
                total={review?.total}
                comment={review?.comment}
                created_at={review?.created_at}
              />
            ))}
          </>
        )}
        {reviewsList?.reviews.length === 0 && (
          <OText>{t('REVIEWS_NOT_FOUND', 'Reviews Not Found')}</OText>
        )}
      </BusinessReviewContent>
    </BusinessReviewsContainer>
  );
};

export const BusinessReviews = (props: any) => {
  const BusinessReviewProps = {
    ...props,
    UIComponent: BusinessReviewsUI,
  };
  return <BusinessReviewController {...BusinessReviewProps} />;
};
