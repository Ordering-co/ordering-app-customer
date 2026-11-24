import * as React from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';
import { useTheme } from 'styled-components/native';
import { themeColor, themeFontFamily, themeSpace, themeText, themeValue, type SpaceLevel, type TextPreset } from '@/theme/helpers';

/**
 * The app's text. Its look comes from a typography preset of the theme
 * (`h1`…`h4`, `body_lg`, `body`, `body_sm`, `caption`, `label`, `button`) and a
 * color role (`text`, `text_muted`, `primary`, …). A weight is painted with the
 * font file of that weight, never with `fontWeight` (Android fakes bold).
 *
 *   <OText preset='h3'>Title</OText>
 *   <OText preset='body_sm' color='text_muted' weight={600}>Meta</OText>
 *
 * While the screens are converted (docs/theme/decisions.md, phase 7) OText still
 * takes the old props: a `size` in pt snaps to the nearest preset (sizes above
 * the scale stay as given), a color that is not a role is painted as given, the
 * old preset names map to the new ones and a `fontWeight` in `style` becomes the
 * font file of that weight.
 */
export type LegacyTypographyPreset = 'screenTitle' | 'sectionTitle' | 'cardTitle';
export type TypographyPreset = TextPreset | LegacyTypographyPreset;

const LEGACY_PRESETS: Record<LegacyTypographyPreset, { preset: TextPreset, weight?: number }> = {
  screenTitle: { preset: 'h3' },
  sectionTitle: { preset: 'body_lg', weight: 700 },
  cardTitle: { preset: 'body_lg', weight: 600 },
};

/** The largest legacy size of each preset (docs/theme/tokens.md §5). */
const SIZE_PRESETS: Array<[number, TextPreset]> = [
  [10, 'caption'],
  [13, 'body_sm'],
  [15, 'body'],
  [17, 'body_lg'],
  [18, 'h4'],
  [21, 'h3'],
  [25, 'h2'],
  [30, 'h1'],
];

/** The preset a legacy size in pt belongs to; null above the scale. */
export const presetForSize = (size: number): TextPreset | null =>
  SIZE_PRESETS.find(([max]) => size <= max)?.[1] ?? null;

const SPACE_LEVELS = new Set(['none', 'xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl']);

/** A margin given as a space level, or (legacy) as pt. */
const spacing = (theme: any, value: SpaceLevel | number | undefined) =>
  value === undefined || value === null ? undefined : typeof value === 'number' ? value : SPACE_LEVELS.has(value) ? themeSpace(theme, value) : undefined;

const isRole = (theme: any, color?: string) => !!color && theme.native.tokens.color[color] !== undefined;

interface Props {
  /** A typography preset of the theme (`body` by default). */
  preset?: TypographyPreset;
  /** A color role of the theme (`text` by default); a hex or rgb is legacy. */
  color?: string;
  /** A weight kept over the preset's own (400, 500, 600, 700, 'bold', 'normal'). */
  weight?: number | string;
  /** @deprecated a size in pt: use `preset`. */
  size?: number;
  /** @deprecated use `preset`. */
  lineHeight?: number;
  align?: 'center' | 'left' | 'right';
  style?: TextStyle | Array<TextStyle | false | null | undefined>;
  children?: React.ReactNode;
  isWrap?: boolean;
  /** @deprecated a margin of `sm` on the bottom, right and left. */
  hasBottom?: boolean;
  mTop?: SpaceLevel | number;
  mBottom?: SpaceLevel | number;
  mRight?: SpaceLevel | number;
  mLeft?: SpaceLevel | number;
  space?: any;
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
  onTextLayout?: any;
  onPress?: () => void;
  testID?: string;
  adjustsFontSizeToFit?: boolean;
  selectable?: boolean;
  accessibilityElementsHidden?: boolean;
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
}

// Layout only (no theme values): safe at module level.
const layout = StyleSheet.create({ wrap: { flexWrap: 'wrap' }, grow: { flex: 1 }, fixed: { flex: 0 } });

const OText = ({
  preset,
  color,
  weight,
  size,
  lineHeight,
  align,
  style,
  children,
  isWrap,
  hasBottom,
  mTop,
  mBottom,
  mRight,
  mLeft,
  space,
  ...rest
}: Props): React.ReactElement => {
  const theme: any = useTheme();

  const legacy = preset && preset in LEGACY_PRESETS ? LEGACY_PRESETS[preset as LegacyTypographyPreset] : null;
  const sized = size !== undefined && size !== null ? presetForSize(size) : null;
  const name: TextPreset = legacy?.preset ?? sized ?? (preset as TextPreset) ?? 'body';

  // A fontWeight in the style is a weight: painted with its file.
  const flat: TextStyle = StyleSheet.flatten(style) ?? {};
  const { fontWeight: styleWeight, ...styleRest } = flat;
  const kept = weight ?? styleWeight ?? legacy?.weight;
  const weightValue = typeof kept === 'string' && /^\d+$/.test(kept) ? Number(kept) : kept;

  const text: TextStyle = themeText(theme, name, weightValue !== undefined ? { weight: weightValue } : {});
  // A `weight` prop over a style that brings its own font file (a component's
  // text look) paints that look's font at the weight: the prop is not lost.
  if (weight !== undefined && weight !== null && styleRest.fontFamily) {
    const heading = theme.native.fonts.heading;
    const role = heading && Object.values(heading.files).includes(styleRest.fontFamily) ? 'heading' : 'body';
    styleRest.fontFamily = themeFontFamily(theme, role, weightValue as number | string) ?? styleRest.fontFamily;
  }
  // A size off the scale (a size above it, or a fontSize in the style) keeps
  // the preset's line ratio, so its lines are never clipped.
  const fontSize = styleRest.fontSize ?? (size !== undefined && size !== null && !sized ? size : undefined);
  const sizeStyle: TextStyle = fontSize !== undefined && fontSize !== text.fontSize && styleRest.lineHeight === undefined
    ? { fontSize, lineHeight: Math.round(fontSize * themeValue(theme, `tokens.typography.${name}.line`)) }
    : {};

  const small = themeSpace(theme, 'sm');
  const margins: TextStyle = {
    marginTop: spacing(theme, mTop),
    marginBottom: hasBottom ? small : spacing(theme, mBottom),
    marginRight: hasBottom ? small : spacing(theme, mRight),
    marginLeft: hasBottom ? small : spacing(theme, mLeft),
  };

  return (
    <Text
      maxFontSizeMultiplier={1.3}
      {...rest}
      style={[
        text,
        sizeStyle,
        { color: isRole(theme, color) ? themeColor(theme, color as string) : color ?? themeColor(theme, 'text') },
        layout.wrap,
        margins,
        isWrap ? (kept ? layout.grow : layout.fixed) : null,
        lineHeight !== undefined ? { lineHeight } : null,
        align ? { textAlign: align } : null,
        styleRest,
      ]}
    >
      {children}{space && ' '}
    </Text>
  );
};

export default OText;
