import React from 'react';
import { Animated, View, ViewStyle } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { spaceCss } from '@/theme/helpers';
import OButton from './OButton';
import Icon from './Icon';

/**
 * The close button of modals and sheets: the `close` slot of
 * `components.modal` (an icon button of the theme).
 */
/** The icon buttons of modals, sheets and the header (back): the same slot. */
export const ModalCloseButton = ({ onPress, style, testID, icon = 'close', accessibilityLabel = 'close' }: { onPress?: () => void, style?: ViewStyle, testID?: string, icon?: string, accessibilityLabel?: string }) => {
  const theme: any = useTheme();
  const slot = theme.native.components.modal.slots.close;
  return (
    <OButton
      iconOnly
      color={slot.color}
      appearance={slot.appearance}
      size={slot.size}
      icon={<Icon name={icon} />}
      onClick={onPress}
      style={style}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
    />
  );
};

/**
 * The back button of every header (`NavBar`, the head of the listing, the
 * search and the storefront): the `close` slot with the back glyph, pulled into
 * the page side so its glyph, not its touch box, starts at the gutter, where
 * every text and card of the screen starts. Its host lays it at the gutter.
 */
export const BackButton = ({ onPress, testID, accessibilityLabel = 'back' }: { onPress?: () => void, testID?: string, accessibilityLabel?: string }) => {
  const theme: any = useTheme();
  const slot = theme.native.components.modal.slots.close;
  const size = theme.native.components.button.sizes[slot.size];
  const aligned = !!theme.native.components.header.base.back_aligned && slot.appearance !== 'ghost';
  const pull = React.useMemo(() => ({ marginLeft: aligned ? 0 : -(size.height - size.icon_size) / 2 }), [size, aligned]);
  return (
    <View style={pull}>
      <ModalCloseButton
        onPress={onPress}
        icon={theme.native.components.header.base.back_icon === 'chevron' ? 'chevron-back' : 'arrow-back'}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
      />
    </View>
  );
};

export const CenteredView = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding-left: ${({ theme }: any) => spaceCss(theme, 'lg')};
  padding-right: ${({ theme }: any) => spaceCss(theme, 'lg')};
  margin-top: ${({ theme }: any) => spaceCss(theme, 'lg')};
`;

export const ModalTitle = styled.View`
  flex: 1;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
`;

/** A flag emoji (CountryFlag) drawn `size` high: a line just taller than the glyph. */
export const FlagEmoji = styled.Text<{ size: number }>`
  font-size: ${({ size }: { size: number }) => `${size}px`};
  line-height: ${({ size }: { size: number }) => `${Math.round(size * 1.25)}px`};
`

/** Skeleton (shared/Skeleton): a row of blocks, each clipping its pulse. */
export const SkeletonRow = styled.View`
  flex-direction: row;
  width: 100%;
`

export const SkeletonFull = styled.View`
  flex: 1;
`

export const SkeletonBlock = styled.View`
  overflow: hidden;
`

export const SkeletonPulse = styled(Animated.View)`
  height: 100%;
`
