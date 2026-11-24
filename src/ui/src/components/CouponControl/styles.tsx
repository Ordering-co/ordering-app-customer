import styled from 'styled-components/native';
import { borderCss, controlHeightCss, radiusCss, spaceCss, themeColor, themePart } from '@/theme/helpers';

const px = (value: number) => `${value}px`
const chip = (theme: any) => themePart(theme, 'chip', 'base')

export const CContainer = styled.View`
  display: flex;
  justify-content: flex-start;
  width: 100%;
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'xs')};
`

export const CCWrapper = styled.View`
  gap: ${({ theme }: any) => spaceCss(theme, 'lg')};
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`

// The applied coupon: a `chip`.
export const CCButton = styled.View`
  width: 100%;
  justify-content: center;
  min-height: ${({ theme }: any) => px(themePart(theme, 'chip', 'sizes.sm.height'))};
  padding-horizontal: ${({ theme }: any) => px(themePart(theme, 'chip', 'sizes.sm.padding_x'))};
  background-color: ${({ theme }: any) => chip(theme).background};
  border-radius: ${({ theme }: any) => px(chip(theme).radius)};
`

export const CouponEntryButton = styled.View`
  align-items: center;
  background-color: ${({ theme }: any) => theme.native.components.card.base.background};
  ${({ theme }: any) => borderCss(theme, 'thin', 'border', { fixed: true })}
  border-radius: ${({ theme }: any) => radiusCss(theme, 'md')};
  flex-direction: row;
  min-height: ${({ theme }: any) => controlHeightCss(theme, 'xl')};
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'sm')};
  padding-horizontal: ${({ theme }: any) => spaceCss(theme, 'md')};
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
  width: 100%;
`

export const CouponEntryIcon = styled.View`
  align-items: center;
  background-color: ${({ theme }: any) => themeColor(theme, 'surface_alt')};
  border-radius: ${({ theme }: any) => radiusCss(theme, 'md')};
  height: ${({ theme }: any) => controlHeightCss(theme, 'md')};
  width: ${({ theme }: any) => controlHeightCss(theme, 'md')};
  justify-content: center;
`

export const CouponEntryContent = styled.View`
  flex: 1;
`
