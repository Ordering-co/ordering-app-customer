import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { useTheme } from 'styled-components/native';
import { nativeBoxStyle, nativeTextStyle, themePart } from '@/theme/helpers';
import Icon from './Icon';

/**
 * The app's button: `components.button` of the theme. A button is a color
 * (`primary`, `secondary`, `danger`, `success`, `neutral`, `inverse`), an
 * appearance (`solid`, `outline`, `tonal`, `ghost`) and a size (`xs`, `sm`,
 * `md`, `lg`); the theme carries every combination with its pressed and
 * disabled states.
 *
 *   <OButton text='Continue' onClick={next} />
 *   <OButton text='Cancel' appearance='outline' size='sm' onClick={close} />
 *
 * While the screens are converted the old `class` still works (mapped as
 * decided in docs/theme/components.md), and `style`, `textStyle` and
 * `parentStyle` still apply over the theme: each call site drops them when its
 * area is converted.
 */
export type ButtonColor = 'primary' | 'secondary' | 'danger' | 'success' | 'neutral' | 'inverse';
export type ButtonAppearance = 'solid' | 'outline' | 'tonal' | 'ghost';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';
const BUTTON_COLORS = ['primary', 'secondary', 'danger', 'success', 'neutral', 'inverse'] as const;
const BUTTON_APPEARANCES = ['solid', 'outline', 'tonal', 'ghost'] as const;
type LegacyClass = 'primary' | 'secondary' | 'third' | 'fourth' | 'active' | 'mandatory' | 'alert';

const LEGACY_CLASSES: Record<LegacyClass, { color: ButtonColor, appearance: ButtonAppearance }> = {
  primary: { color: 'primary', appearance: 'solid' },
  secondary: { color: 'primary', appearance: 'outline' },
  third: { color: 'inverse', appearance: 'ghost' },
  fourth: { color: 'neutral', appearance: 'tonal' },
  alert: { color: 'neutral', appearance: 'tonal' },
  active: { color: 'primary', appearance: 'tonal' },
  mandatory: { color: 'danger', appearance: 'tonal' },
};

interface Props {
  text?: React.ReactNode;
  /** The text stays on one line and shrinks to fit (a button with a price beside a stepper). */
  fitText?: boolean;
  onClick?: () => void;
  color?: ButtonColor;
  appearance?: ButtonAppearance;
  size?: ButtonSize;
  /** A square of the size's height with only `icon` (`shapes.icon`). */
  iconOnly?: boolean;
  /** An icon before the text, at the size's icon size. */
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  /** @deprecated use `loading`. */
  isLoading?: boolean;
  /** @deprecated use `disabled`. */
  isDisabled?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  /** @deprecated use `color` and `appearance`. */
  class?: LegacyClass | string;
  /** @deprecated layout overrides kept while the call sites are converted. */
  style?: ViewStyle | ViewStyle[];
  /** @deprecated */
  parentStyle?: ViewStyle;
  /** @deprecated */
  textStyle?: TextStyle;
}

/** The theme's color and appearance for a button's props. */
export const resolveButton = ({ color, appearance, class: legacyClass }: Pick<Props, 'color' | 'appearance' | 'class'>) => {
  const legacy = legacyClass ? LEGACY_CLASSES[legacyClass as LegacyClass] : undefined;
  const known = <T extends string>(value: string | undefined, values: readonly T[]) => values.includes(value as T) ? value as T : undefined;
  return {
    color: known(color, BUTTON_COLORS) ?? legacy?.color ?? 'primary',
    appearance: known(appearance, BUTTON_APPEARANCES) ?? legacy?.appearance ?? 'solid',
  };
};

/** A state's look over the resting one: only what the state defines. */
const defined = (state: Record<string, any> | undefined) =>
  Object.fromEntries(Object.entries(state ?? {}).filter(([, value]) => value !== null && value !== undefined));

const OButton = ({
  text,
  fitText,
  onClick,
  color,
  appearance,
  size = 'md',
  iconOnly = false,
  icon,
  loading = false,
  disabled = false,
  isLoading,
  isDisabled,
  testID,
  accessibilityLabel,
  class: legacyClass,
  style,
  parentStyle,
  textStyle,
}: Props): React.ReactElement => {
  const theme: any = useTheme();
  const selection = resolveButton({ color, appearance, class: legacyClass });
  const isBusy = loading || !!isLoading;
  const isOff = disabled || !!isDisabled;

  const look = themePart(theme, 'button', `variants.${selection.color}.${selection.appearance}`);
  const sizes = themePart(theme, 'button', 'sizes');
  const sized = sizes[size] ?? sizes.md;
  const radius = iconOnly ? themePart(theme, 'button', 'shapes.icon.radius') : themePart(theme, 'button', 'base.radius');
  const gap = themePart(theme, 'button', 'base.icon_gap');

  const styles = React.useMemo(() => {
    const textLook = nativeTextStyle(sized.text);
    const pressed = defined(look.states.pressed);
    const off = defined(look.states.disabled);
    return StyleSheet.create({
      box: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: sized.height,
        ...(iconOnly ? { width: sized.height, height: sized.height } : { paddingHorizontal: sized.padding_x }),
        borderRadius: radius,
        gap,
        ...nativeBoxStyle(look),
      },
      pressed: nativeBoxStyle(pressed),
      disabled: nativeBoxStyle(off),
      text: { ...textLook, color: look.color, textAlign: 'center', flexShrink: 1 },
      fitText: { flexGrow: 1 },
      pressedText: pressed.color ? { color: pressed.color } : {},
      disabledText: off.color ? { color: off.color } : {},
    });
  }, [look, sized, radius, gap, iconOnly]);

  // An `<Icon>` without its own size or color takes the button's: its size's
  // `icon_size` and its ink (pressed and disabled included).
  const glyph = (pressed: boolean) => React.isValidElement(icon) && icon.type === Icon
    ? React.cloneElement(icon as React.ReactElement<any>, {
      size: (icon.props as any).size ?? sized.icon_size,
      color: (icon.props as any).color ?? ((isOff && styles.disabledText.color) || (pressed && styles.pressedText.color) || styles.text.color),
    })
    : icon;

  const label = typeof text === 'string' || typeof text === 'number'
    ? (pressed: boolean) => (
      <Text
        maxFontSizeMultiplier={1.3}
        {...(fitText && { numberOfLines: 1, adjustsFontSizeToFit: true, minimumFontScale: 0.8 })}
        style={[styles.text, fitText && !icon && styles.fitText, pressed && styles.pressedText, isOff && styles.disabledText, textStyle]}
      >
        {text}
      </Text>
    )
    : () => text;

  return (
    <Pressable
      testID={testID}
      accessibilityRole='button'
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isOff, busy: isBusy }}
      disabled={isOff || isBusy}
      onPress={onClick}
      style={parentStyle}
    >
      {({ pressed }) => (
        <View style={[styles.box, pressed && styles.pressed, isOff && styles.disabled, style]}>
          {isBusy
            ? <ActivityIndicator size='small' color={(isOff ? styles.disabledText.color : undefined) ?? styles.text.color} />
            : glyph(pressed)}
          {!iconOnly && text !== undefined && text !== null && text !== '' ? label(pressed) : null}
        </View>
      )}
    </Pressable>
  );
};

export default OButton;
