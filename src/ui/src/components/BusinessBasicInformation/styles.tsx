import styled from 'styled-components/native';
import { gutterCss, spaceCss, themeColor, themePart } from '@/theme/helpers';
import OImageBackground from '../shared/OImageBackground'

// `components.business_header`: the storefront's cover, logo, name and actions.
const header = (theme: any) => theme.native.components.business_header.base;
const px = (value: number) => `${value}px`;

export const BusinessContainer = styled.View`
  flex-direction: column;
`;

export const BusinessHeader = styled(OImageBackground)`
  width: 100%;
  height: ${({ theme }: any) => px(header(theme).cover_height)};
  position: relative;
`;

export const BusinessInfo = styled.View`
  width: 100%;
  justify-content: flex-start;
  align-items: flex-start;
  background-color: ${({ theme }: any) => themeColor(theme, 'background')};
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'sm')};
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
`;

export const BusinessInfoHeader = styled.View`
  width: 100%;
  flex-direction: row;
  align-items: center;
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'sm')};
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
`;

export const BusinessInfoItem = styled.View`
  flex: 1;
`;

export const BusinessInfoActions = styled.View`
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'sm')};
`;

export const ActionsRow = styled.View`
  width: 100%;
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${({ theme }: any) => px(header(theme).actions_gap)};
`;

export const TitleWrapper = styled.View`
  width: 100%;
  flex-direction: column;
  align-items: flex-start;
`;

export const SocialListWrapper = styled.ScrollView`
  flex-direction: row;
`;

/** The delivery fee and time: a card (`components.card`). */
export const CardContainer = styled.View`
  width: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  align-self: center;
`;

export const InfoSection = styled.View`
  align-items: center;
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
`;

/** The line between the two stats: the `vertical` divider, inset at both ends by its `indent`. */
export const VerticalSeparator = styled.View`
  align-self: stretch;
  margin-vertical: ${({ theme }: any) => px(themePart(theme, 'divider', 'variants.vertical.indent'))};
  ${({ theme }: any) => {
    const line = theme.native.components.divider.variants.vertical.line
    return line.borderWidth ? `border-left-width: ${px(line.borderWidth)}; border-left-color: ${line.borderColor};` : ''
  }}
`;
