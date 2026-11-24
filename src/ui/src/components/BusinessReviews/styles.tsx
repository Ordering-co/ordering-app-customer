import styled from 'styled-components/native';
import { gutterCss, spaceCss } from '@/theme/helpers';

export const BusinessReviewsContainer = styled.View``;

export const BusinessReviewContent = styled.ScrollView`
  flex-direction: column;
  margin-top: ${({ theme }: any) => spaceCss(theme, 'xl')};
`;

export const StarPointsView = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  margin-right: ${({ theme }: any) => spaceCss(theme, 'sm')};
`;

export const HeaderItem = styled.View`
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
`;

export const ReviewSummaryContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding-top: ${({ theme }: any) => spaceCss(theme, 'lg')};
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
`;

export const RankingIconContainer = styled.View`
  margin-right: ${({ theme }: any) => spaceCss(theme, 'lg')};
`;

export const RatingValueContainer = styled.View`
  align-items: center;
`;
