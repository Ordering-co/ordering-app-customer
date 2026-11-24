import styled from 'styled-components/native'
import { gutterCss, themeColor } from '@/theme/helpers'

export const SUPPORT_BUBBLE_SIZE = 50
export const SUPPORT_BUBBLE_CLEARANCE = 88
export const WHATSAPP_BUBBLE_COLOR = '#25D366'
/** Above every screen layer (stacking order is code, not theme). */
export const SUPPORT_BUBBLE_Z_INDEX = 30000

export const Bubble = styled.TouchableOpacity<{ bottom: number, $whatsapp?: boolean, $background?: string }>`
  position: absolute;
  z-index: ${SUPPORT_BUBBLE_Z_INDEX};
  right: ${(props: any) => gutterCss(props.theme)};
  bottom: ${(props: { bottom: number }) => props.bottom}px;
  width: ${SUPPORT_BUBBLE_SIZE}px;
  height: ${SUPPORT_BUBBLE_SIZE}px;
  border-radius: ${SUPPORT_BUBBLE_SIZE / 2}px;
  align-items: center;
  justify-content: center;
  background-color: ${(props: any) => props.$background ?? (props.$whatsapp ? WHATSAPP_BUBBLE_COLOR : themeColor(props.theme, 'primary'))};
  overflow: hidden;
`
