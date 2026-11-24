import FastImage from 'react-native-fast-image'
import styled, { css } from 'styled-components/native'
import { borderCss, spaceCss, themePart } from '@/theme/helpers'

const px = (value: number) => `${value}px`
const imageRadius = (theme: any) => px(theme.native.components.product_card.base.image_radius)

export const AccordionSection = styled.View`
  background-color: ${({ theme }: any) => theme.native.tokens.color.surface};
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const Accordion = styled.View`
  flex-direction: column;
  justify-content: space-between;
  align-items: center;

  ${(props: any) => !props.isValid && css`
    opacity: ${props.theme.native.tokens.opacity.disabled};
  `}
`

export const ProductInfo = styled.View`
  margin-horizontal: ${({ theme }: any) => spaceCss(theme, 'xs')};
`

export const ProductQuantity = styled.View`
  margin-horizontal: ${({ theme }: any) => spaceCss(theme, 'xs')};
  min-width: 16px;
  align-items: center;
`

export const ContentInfo = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  overflow: hidden;
`

export const ProductImage = styled.View`
`

export const AccordionContent = styled.View`
  overflow: hidden;
`

export const ProductOptionsList = styled.View`
  margin-top: ${({ theme }: any) => spaceCss(theme, 'lg')};
  margin-left: ${({ theme }: any) => spaceCss(theme, 'lg')};
`

export const ProductOption = styled.View``

export const ProductSubOption = styled.View``

export const ProductComment = styled.View`
  margin-left: ${({ theme }: any) => spaceCss(theme, 'lg')};
`

/** A cart line's photo: `cart.base.line_image_size`. */
const lineImage = (theme: any) => px(themePart(theme, 'cart', 'base.line_image_size'))

export const ProductImageIcon = styled(FastImage)`
  border-radius: ${({ theme }: any) => imageRadius(theme)};
  width: ${({ theme }: any) => lineImage(theme)};
  height: ${({ theme }: any) => lineImage(theme)};
`

export const EditImageButton = styled.View`
  width: ${({ theme }: any) => lineImage(theme)};
  height: ${({ theme }: any) => lineImage(theme)};
  border-radius: ${({ theme }: any) => imageRadius(theme)};
  ${({ theme }: any) => borderCss(theme, 'thin', 'border', { fixed: true })}
  justify-content: center;
  align-items: center;
`
