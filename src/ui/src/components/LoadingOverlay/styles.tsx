import styled from 'styled-components/native'

/** The scrim over the whole window, the spinner in its middle. */
export const OverlayScrim = styled.View<{ $color: string }>`
  flex: 1;
  align-items: center;
  justify-content: center;
  background-color: ${({ $color }: { $color: string }) => $color};
`
