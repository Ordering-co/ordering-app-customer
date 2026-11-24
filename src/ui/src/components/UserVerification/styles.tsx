import styled, { css } from 'styled-components/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { gutterCss, spaceCss } from '@/theme/helpers';

const px = (value: number) => `${value}px`
// `components.bottom_bar`: background, top border, shadow and padding of the action bar.
const bar = (theme: any) => theme.native.components.bottom_bar.base

export const Container = styled.View`
  padding: ${({ theme }: any) => spaceCss(theme, 'lg')} ${({ theme }: any) => gutterCss(theme)};
`

export const WrapperText = styled.View`
  flex-direction: column;
  align-items: center;
`

export const InputWrapper = styled.View`
  ${(props: any) => props.phone && css`
    width: 60%;
    align-self: center;
    padding-top: ${({ theme }: any) => spaceCss(theme, 'lg')};
  `}
`

export const WrapperActions = styled.View`
  position: relative;
`

export const ButtonsActions = styled.View`
  padding: ${({ theme }: any) => px(bar(theme).padding)} ${({ theme }: any) => gutterCss(theme)};
  flex-direction: row;
  width: 100%;
  justify-content: space-between;
  background-color: ${({ theme }: any) => bar(theme).background};
  ${({ theme }: any) => bar(theme).border_top
    ? `border-top-width: ${px(bar(theme).border_top.borderWidth)}; border-top-color: ${bar(theme).border_top.borderColor};`
    : ''}
  z-index: 1000;
`

export const OtpSection = styled(SafeAreaView)`
  flex: 1;
  align-items: center;
  justify-content: center;
`

export const DigitInput = styled.Pressable`
  flex-direction: row;
  justify-content: center;
`

export const CountDownContainer = styled.View`
  align-self: center;
  justify-content: center;
  align-items: center;
`

export const WrappCountdown = styled.View`
  padding-vertical: ${({ theme }: any) => spaceCss(theme, 'lg')};
`

export const InputsSection = styled.View`
  flex-direction: row;
  justify-content: space-between;
  padding-bottom: ${({ theme }: any) => spaceCss(theme, 'lg')};
`
