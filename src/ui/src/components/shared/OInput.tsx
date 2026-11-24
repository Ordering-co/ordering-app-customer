import * as React from 'react';
import { ImageSourcePropType, ImageStyle, ViewStyle, TextInputProps, TextStyle, StyleSheet, Pressable, TextInput, View } from 'react-native';
import { useTheme } from 'styled-components/native';
import { nativeBoxStyle, nativeTextStyle, themeBorderWidth } from '@/theme/helpers';
import OIcon from './OIcon';
import Icon from './Icon';
import OText from './OText';
import { singleLineInput } from './singleLineInput';

/**
 * The app's text field: `components.input` of the theme (size `md`; the focus,
 * error and disabled states), spaced from the next field by `field.gap`.
 * `hasError` paints the error state; the old `borderColor` still paints over
 * the theme while the call sites are converted.
 */
interface Props extends TextInputProps {
  borderColor?: string;
  isRequired?: boolean;
  requiredMsg?: string;
  isDisabled?: boolean;
  isSecured?: boolean;
  style?: ViewStyle;
  placeholder?: string;
  icon?: ImageSourcePropType | string;
  iconRight?: ImageSourcePropType;
  iconColor?: string;
  iconRightColor?: string;
  iconStyle?: ImageStyle;
  iconRightStyle?: ImageStyle;
  iconCustomRight?: any;
  value?: string;
  onChange?: any;
  name?: string;
  type?: string;
  multiline?: boolean;
  vertorIcon?: string;
  vectorIconColor?: string;
  forwardRef?: any;
  inputStyle?: TextStyle;
  wrapperRef?: any;
  onPress?: any;
  isFocusHighlight?: boolean
  autoCompleteType?: string,
  isValueSync?: boolean,
  isLazyLoad?: boolean,
  customIcon?: any
  hasError?: boolean
}

/** A box look whose border is only the bottom one when the theme says so (`input.border_sides`). */
const onSides = (style: Record<string, any>, sides: 'all' | 'bottom') => {
  if (sides !== 'bottom' || style.borderWidth === undefined) return style
  const { borderWidth, borderColor, borderStyle, ...rest } = style
  return { ...rest, borderWidth: 0, borderBottomWidth: borderWidth, ...(borderColor && { borderBottomColor: borderColor }), ...(borderStyle && { borderStyle }) }
}

const inputStyles = (theme: any) => {
  const input = theme.native.components.input
  const base = input.base
  const field = theme.native.components.field.base
  const states = input.variants.default.states
  const box = (look: Record<string, any>) => onSides(nativeBoxStyle(look), base.border_sides)
  return StyleSheet.create({
    wrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      minHeight: input.sizes.md.height,
      borderRadius: base.radius,
      paddingHorizontal: base.padding_x,
      gap: base.icon_gap,
      marginBottom: field.gap,
      ...box(base),
    },
    focus: box(states.focus),
    error: box(states.error),
    disabled: box(states.disabled),
    // `field.label_position: above`: the placeholder becomes a label over the box.
    field: { width: '100%', marginBottom: field.gap },
    inField: { marginBottom: 0 },
    label: { ...nativeTextStyle(field.label), color: field.label_color, marginBottom: field.label_gap },
    input: {
      flex: 1,
      alignSelf: 'stretch',
      ...nativeTextStyle(base.text),
      color: base.text_color,
    },
    icon: {
      width: base.icon_size,
      height: base.icon_size,
    },
  })
}

const OInput = ({ iconColor, ...props }: Props): React.ReactElement => {
  const theme: any = useTheme();
  const styles = React.useMemo(() => inputStyles(theme), [theme]);
  const base = theme.native.components.input.base;
  const [inputFocused, setInputFocused] = React.useState(false)

  const onFocus = (e: any) => {
    props.onFocus && props.onFocus(e)
    setInputFocused(true)
  }

  const onBlur = (e: any) => {
    props.onBlur && props.onBlur(e)
    setInputFocused(false)
  }

  let timeout: null | any = null
  const onChange = (e: any) => {
    if (!props.isLazyLoad) {
      props.onChange(e)
    } else {
      clearTimeout(timeout)
      timeout = setTimeout(function () {
        props.onChange(e)
      }, 750)
    }
  }

  const labelAbove = theme.native.components.field.base.label_position === 'above' && !!props.placeholder
  const box = (
    <Pressable
      style={[
        styles.wrapper,
        labelAbove && styles.inField,
        inputFocused && styles.focus,
        props.hasError && styles.error,
        props.isDisabled && styles.disabled,
        props.borderColor ? { borderWidth: themeBorderWidth(theme, 'thin'), borderColor: props.borderColor } : null,
        props.style,
      ]}
      onPress={() => {
        props.forwardRef?.current?.focus?.();
        props.onPress && props.onPress()
      }}
    >
      {props.icon ? (
        <OIcon
          src={props.icon}
          color={iconColor === 'none' ? undefined : iconColor ?? base.icon_color}
          width={base.icon_size}
          height={base.icon_size}
          style={props.iconStyle}
        />
      ) : null}
      {props.customIcon && <props.customIcon />}
      {props.vertorIcon && (
        <Icon set='mci' name={props.vertorIcon} size={base.icon_size} color={props.vectorIconColor ?? base.icon_color} />
      )}
      <TextInput
        testID={props.testID}
        autoFocus={props?.autoFocus}
        secureTextEntry={props.isSecured}
        onChangeText={(txt: any) => props.name ? onChange({ target: { name: props.name, value: txt } }) : onChange(txt)}
        defaultValue={props.value}
        placeholder={props.placeholder && !labelAbove ? props.placeholder : ''}
        keyboardType={(props.type || 'default') as any}
        multiline={props.multiline}
        scrollEnabled={props.multiline}
        editable={!props.isDisabled}
        autoCapitalize={props.autoCapitalize}
        autoComplete={props.autoCompleteType as any}
        autoCorrect={props.autoCorrect}
        returnKeyType={props.returnKeyType}
        onSubmitEditing={props.onSubmitEditing}
        clearButtonMode={props.clearButtonMode ?? 'never'}
        blurOnSubmit={props.blurOnSubmit}
        maxLength={props.maxLength}
        maxFontSizeMultiplier={1.3}
        placeholderTextColor={base.placeholder}
        ref={(e: any) => {
          props.forwardRef && (typeof props.forwardRef === 'function' ? props.forwardRef(e) : props.forwardRef.current = e)
        }}
        // A text area starts at its top on both platforms; a one-line field is centered (Android starts it at the top).
        textAlignVertical={props.multiline ? 'top' : 'center'}
        style={[styles.input, !props.multiline && singleLineInput, props.inputStyle]}
        onFocus={onFocus}
        onBlur={onBlur}
        value={props.isValueSync ? props.value : undefined}
      />
      {props.iconRight && (
        <OIcon
          src={props.iconRight}
          color={props.iconRightColor}
          width={base.icon_size}
          height={base.icon_size}
          style={props.iconRightStyle}
        />
      )}
      {props.iconCustomRight}
    </Pressable>
  );

  return labelAbove ? (
    <View style={styles.field}>
      <OText style={styles.label}>{props.placeholder}</OText>
      {box}
    </View>
  ) : box;
};

export default OInput;
