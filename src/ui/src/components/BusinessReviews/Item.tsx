import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "styled-components/native";
import { useLanguage, useUtils } from "@components";
import { OText } from "@ui";
import Icon from "../shared/Icon";
import { nativeBoxStyle, themePart, themeVisible } from '@/theme/helpers';
import { HeaderItem, StarPointsView } from "./styles";

/** The review's score: the `rating` component (filled and empty stars, size `sm`). */
const Stars = ({ total }: { total: number }) => {
  const theme: any = useTheme();
  const rating = themePart(theme, 'rating', 'base');
  const size = themePart(theme, 'rating', 'sizes.sm.icon_size');
  return (
    <StarPointsView style={{ gap: rating.gap }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Icon
          key={i}
          name={i < total ? 'star' : rating.empty_style === 'outline' ? 'star-outline' : 'star'}
          size={size}
          color={i < total ? rating.color : rating.empty_color}
        />
      ))}
    </StarPointsView>
  );
};

export const ReviewItem = ({ total, comment, created_at }: any) => {
  const [{ parseDate }] = useUtils();
  const [, t] = useLanguage();
  const theme: any = useTheme();

  // A review is a card (`components.card`).
  const styles = useMemo(() => {
    const card = themePart(theme, 'card', 'base');
    return StyleSheet.create({
      card: {
        ...nativeBoxStyle({ background: card.background, border: card.border, shadow: card.shadow }),
        borderRadius: card.radius,
        padding: card.padding,
      },
    });
  }, [theme]);

  return (
    <View style={styles.card}>
      <HeaderItem>
        <Stars total={total} />
        {themeVisible(theme, 'business.reviews.review_date') && (
          <OText preset='body_sm' color='text_muted'>
            {parseDate(created_at, { outputFormat: 'MMMM D, YYYY • hh:mm A' })}
          </OText>
        )}
      </HeaderItem>
      {themeVisible(theme, 'business.reviews.customer_comments') && (
        <OText>{comment || t('NO_COMMENT', 'No comment')}</OText>
      )}
    </View>
  );
};
