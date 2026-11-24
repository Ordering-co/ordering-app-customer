import styled from 'styled-components/native'

import OText from '../shared/OText'
import { gutterCss, radiusCss, spaceCss } from '@/theme/helpers'
import OImageBackground from '../shared/OImageBackground'

const px = (value: number) => `${value}px`
const details = (theme: any) => theme.native.components.order_details.base
const card = (theme: any) => theme.native.components.card.base
const divider = (theme: any, variant: 'item' | 'band') => theme.native.components.divider.variants[variant].line
const color = (theme: any, name: string) => theme.native.tokens.color[name]

export const OrderDetailsContainer = styled.ScrollView`
  flex: 1;
`

/** The status header: a `card` box filled with `surface_alt`. */
export const Header = styled.View`
  position: relative;
  border-radius: ${({ theme }: any) => px(card(theme).radius)};
  padding: ${({ theme }: any) => px(card(theme).padding)};
  margin-horizontal: ${({ theme }: any) => gutterCss(theme)};
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
  background-color: ${({ theme }: any) => color(theme, 'surface_alt')};
`

/**
 * The one separator between the page's sections: the order details' divider
 * (`order_details.divider`, `band` by default, as the checkout's), out to the
 * page sides from inside a section on the gutter.
 */
export const Separator = styled.View`
  height: ${({ theme }: any) => px(divider(theme, details(theme).divider).borderWidth)};
  background-color: ${({ theme }: any) => divider(theme, details(theme).divider).borderColor};
  margin-vertical: ${({ theme }: any) => spaceCss(theme, 'lg')};
  margin-horizontal: ${({ theme }: any) => px(-theme.native.tokens.layout.page_gutter)};
`

export const WrapperPaymethods = styled.View`
  width: 100%;
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const PaymentMethodItem = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`

export const PaymentMethodItemInfo = styled.View`
  flex-direction: row;
  align-items: center;
  padding-right: ${({ theme }: any) => spaceCss(theme, 'xxl')};
  width: 60%;
`

export const PaymentMethodItemAmount = styled.View`
  width: 40%;
  justify-content: flex-end;
  flex-direction: row;
`

export const HeaderTitle = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`

export const ProgressInfo = styled.View`
  width: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`

export const OrderContent = styled.View``

export const WrapperOptions = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`

export const WrapperPhoto = styled.View`
  border-radius: ${({ theme }: any) => radiusCss(theme, 'full', { fixed: true })};
  background-color: ${({ theme }: any) => color(theme, 'surface')};
  margin-right: ${({ theme }: any) => spaceCss(theme, 'md')};
`

export const OrderBusiness = styled.View`
  position: relative;
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'sm')};
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
  background-color: ${({ theme }: any) => color(theme, 'background')};
  align-items: flex-start;
`
export const Icons = styled.View`
  flex-direction: row;
  align-items: center;
  position: absolute;
  right: 0px;
  top: 0px;
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const OrderInfo = styled.View`
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'sm')};
  flex: 1;
`

export const OrderData = styled.View``

export const StaturBar = styled.View`
  margin-vertical: ${({ theme }: any) => spaceCss(theme, 'lg')};
`

export const OrderSection = styled.View`
  padding-horizontal: ${({ noPadding, theme }: any) => noPadding ? '0px' : gutterCss(theme)};
`

export const ProfessionalBlock = styled.View`
  border-bottom-color: ${({ theme }: any) => divider(theme, 'item').borderColor};
  border-bottom-width: ${({ theme }: any) => px(divider(theme, 'item').borderWidth)};
  margin-vertical: ${({ theme }: any) => spaceCss(theme, 'sm')};
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'xs')};
`

/** A custom order's estimated total, on the gutter. */
export const WrapperFullTotal = styled.View`
  flex-direction: row;
  justify-content: space-between;
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'lg')};
  margin-horizontal: ${({ theme }: any) => gutterCss(theme)};
`

export const OrderDriver = styled(OrderSection)`
`

export const Customer = styled.View`
  flex-direction: row;
  align-items: center;
`

export const InfoBlock = styled.View`
  flex: 1;
`

/** A bill line: rows spaced by the bill's `row_gap`, on `surface_alt` unless `hideBackground`. */
export const Table = styled.View`
  flex-direction: row;
  justify-content: space-between;
  flex: 1;
  align-items: center;
  padding-bottom: ${({ pb, theme }: any) => px(pb ?? theme.native.components.bill.base.row_gap)};
  background-color: ${({ hideBackground, theme }: any) => hideBackground ? 'transparent' : color(theme, 'surface_alt')};
`

export const OrderBill = styled.View`
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
  flex: 1;
`

/** A product of the order: quantity, name and its choices, price at the end; rows on the gutter. */
export const ProductLine = styled.View`
  flex-direction: row;
  align-items: flex-start;
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'xs')};
`

export const ProductLines = styled.View`
  gap: ${({ theme }: any) => spaceCss(theme, 'xs')};
`

export const Map = styled.View`
  width: 100%;
  height: ${({ theme }: any) => px(details(theme).map_height)};
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
`

export const PlaceSpotWrapper = styled.View`
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
`

export const ProfessionalPhoto = styled(OImageBackground)`
  position: relative;
  max-height: 80px;
  height: 80px;
  width: 80px;
  resize-mode: cover;
  margin-right: ${({ theme }: any) => spaceCss(theme, 'sm')};
`;

export const WrapperAddress = styled.View`
  gap: ${({ theme }: any) => spaceCss(theme, 'xxs')};
`

/** The completed header: a `card` box filled with `surface_alt`. */
export const BusinessInfoContainer = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
  background-color: ${({ theme }: any) => color(theme, 'surface_alt')};
  padding: ${({ theme }: any) => px(card(theme).padding)};
  border-radius: ${({ theme }: any) => px(card(theme).radius)};
  margin-horizontal: ${({ theme }: any) => gutterCss(theme)};
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
`;

// Takes the room left between the logo and the mark, and never grows past it:
// a long name truncates instead of running under the mark.
export const BusinessTextContainer = styled.View`
  flex: 1;
  min-width: 0px;
  gap: ${({ theme }: any) => spaceCss(theme, 'xxs')};
  align-items: flex-start;
`;

/** The finished mark: a round disc in the status's tone (D4: success or danger). */
export const StatusCheckmark = styled.View<{ tone?: string }>`
  width: ${({ theme }: any) => px(theme.native.tokens.size.md)};
  height: ${({ theme }: any) => px(theme.native.tokens.size.md)};
  border-radius: ${({ theme }: any) => radiusCss(theme, 'full', { fixed: true })};
  background-color: ${({ theme, tone }: any) => color(theme, tone === 'danger' ? 'danger' : 'success')};
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
`;

export const ReviewSection = styled.View`
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
`;

export const ReviewContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-top: ${({ theme }: any) => spaceCss(theme, 'sm')};
`;

/** The delivery PIN: a `card` box. */
export const DeliveryPinWrapper = styled.View`
  width: 100%;
  align-items: center;
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'sm')};
  padding-horizontal: ${({ theme }: any) => gutterCss(theme)};
  margin-bottom: ${({ theme }: any) => spaceCss(theme, 'md')};
  border-radius: ${({ theme }: any) => px(card(theme).radius)};
  background-color: ${({ theme }: any) => card(theme).background};
`;

// The code is spaced apart so it reads digit by digit (no letter-spacing token).
export const DeliveryPinCode = styled(OText)`
  letter-spacing: 8px;
  margin-vertical: ${({ theme }: any) => spaceCss(theme, 'xs')};
`;

/** The order that could not load: its error and the retry, centred under the bar. */
export const OrderLoadError = styled.View`
  align-items: center;
  margin-horizontal: ${({ theme }: any) => gutterCss(theme)};
  margin-top: ${({ theme }: any) => spaceCss(theme, 'xxxl')};
`
