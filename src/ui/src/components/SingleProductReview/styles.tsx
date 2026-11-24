import styled from 'styled-components/native'

// Between two products: the review form's gap.
export const ProductContainer = styled.View`
  margin-bottom: ${({ theme }: any) => `${theme.native.components.review_form.base.gap}px`};
`
