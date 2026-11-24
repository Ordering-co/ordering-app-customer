import styled from 'styled-components/native'
import { spaceCss } from '@/theme/helpers'

// The logo beside the texts, as on the business card (its padding as the gap).
export const InnerContainer = styled.View`
  flex-direction: row;
  align-items: flex-start;
  width: 100%;
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const CardInfoWrapper = styled.View`
  flex: 1;
  gap: ${({ theme }: any) => spaceCss(theme, 'xxs')};
`

export const ContentHeader = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const ButtonWrapper = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }: any) => spaceCss(theme, 'sm')};
  margin-top: ${({ theme }: any) => spaceCss(theme, 'sm')};
`

export const ContentFooter = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-top: ${({ theme }: any) => spaceCss(theme, 'xxs')};
`

/** The unread count: `chat_bubble.slots.unread` (a `badge`), painted by the card. */
export const UnreadMessageCounter = styled.View``

export const MultiLogosContainer = styled.View`
  align-items: center;
  flex-direction: row;
  gap: ${({ theme }: any) => spaceCss(theme, 'xs')};
`

export const InfoText = styled.View`
  flex-direction: column;
`
