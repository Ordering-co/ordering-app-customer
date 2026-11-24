import styled from 'styled-components/native';
import { gutterCss, spaceCss } from '@/theme/helpers';

const px = (value: number) => `${value}px`

// What closes a checkout block: the band between sections (`components.divider`, `band`),
// out to the page sides, as the multi checkout's and the order details'.
const band = (theme: any) => theme.native.components.divider.variants.band.line
const sectionRule = ({ theme }: any) => {
  const gutter = px(theme.native.tokens.layout.page_gutter)
  return `border-bottom-width: ${px(band(theme).borderWidth ?? 0)}; border-bottom-color: ${band(theme).borderColor ?? 'transparent'}; margin-horizontal: -${gutter}; padding-horizontal: ${gutter};`
}


/** Half of `checkout.section_gap`, on each side of a section's divider: the space between sections, as the multi checkout. */
const sectionHalf = (theme: any) => `${theme.native.components.checkout.base.section_gap / 2}px`
export const ChContainer = styled.ScrollView`
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
`

export const ChSection = styled.View`
  padding-top: ${({ theme }: any) => sectionHalf(theme)};
`

export const ChAddress = styled.View`
  ${sectionRule}
  padding-bottom: ${({ theme }: any) => sectionHalf(theme)};
`

export const ChUserDetails = styled.View`
  display: flex;
  justify-content: center;
  flex-direction: column;
  padding-bottom: ${({ theme }: any) => sectionHalf(theme)};
  ${sectionRule}
`

export const ChBusinessDetails = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  padding-bottom: ${({ theme }: any) => sectionHalf(theme)};
  ${sectionRule}
`

export const BusinessCopy = styled.View`
  flex: 1;
  margin-left: ${({ theme }: any) => spaceCss(theme, 'sm')};
  gap: ${({ theme }: any) => spaceCss(theme, 'xxs')};
`

export const ChPaymethods = styled.View`
  display: flex;
  flex-direction: column;
  padding-bottom: ${({ theme }: any) => sectionHalf(theme)};
`

/** A block of payment content closed by the section rule. */
export const ChPaymethodsRule = styled(ChPaymethods)`
  ${sectionRule}
`

export const ChDriverTips = styled(ChPaymethods)`
  padding-bottom: 0;
`

export const ChCart = styled(ChPaymethods)``

export const WalletPaymentOptionContainer = styled(ChPaymethods)`
  padding-top: ${({ theme }: any) => sectionHalf(theme)};
  ${sectionRule}
`

export const ChErrors = styled.View`
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
`

export const ChPendingSection = styled(ChSection)`
  padding-bottom: ${({ theme }: any) => sectionHalf(theme)};
`

export const ChSummary = styled(ChSection)`
  ${sectionRule}
`

export const PendingCartNoticeContent = styled.View`
  width: 100%;
  align-items: center;
`

export const PendingCartNoticeAction = styled.View`
  width: 100%;
  margin-top: ${({ theme }: any) => spaceCss(theme, 'md')};
`

export const DeliveryOptionsContainer = styled.View`
  padding-bottom: ${({ theme }: any) => sectionHalf(theme)};
  ${sectionRule}
`

/** The band between sections on its own (after a block that does not close itself), out to the page sides. */
export const Divider = styled.View`
  height: ${({ theme }: any) => px(band(theme).borderWidth ?? 0)};
  background-color: ${({ theme }: any) => band(theme).borderColor ?? 'transparent'};
  margin-top: ${({ theme }: any) => sectionHalf(theme)};
  margin-horizontal: ${({ theme }: any) => px(-theme.native.tokens.layout.page_gutter)};
`

export const DetailWrapper = styled.View`
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
  width: 100%;
`
