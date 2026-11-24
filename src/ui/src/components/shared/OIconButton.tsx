import * as React from 'react'
import { Image, ImageStyle, StyleSheet, TextStyle, ViewStyle } from 'react-native'
import { useTheme } from 'styled-components/native'
import { themePart } from '@/theme/helpers'
import OButton, { type ButtonAppearance, type ButtonColor, type ButtonSize } from './OButton'

/**
 * A button with an image icon (a bundled or remote picture, tinted): the
 * theme's button (`components.button`), the icon at the size's icon size.
 * Without `title` it is the icon shape (`shapes.icon`).
 */
interface Props {
  icon?: any,
  urlIcon?: boolean,
  title?: string,
  onClick?: () => void,
  disabled?: boolean,
  isOutline?: boolean,
  color?: ButtonColor,
  appearance?: ButtonAppearance,
  size?: ButtonSize,
  iconColor?: string,
  cover?: boolean,
  iconCover?: boolean,
  testID?: string,
  /** @deprecated layout overrides kept while the call sites are converted. */
  style?: ViewStyle,
  /** @deprecated */
  iconStyle?: ImageStyle,
  /** @deprecated */
  textStyle?: TextStyle,
  /** @deprecated ignored: the theme paints the button. */
  bgColor?: string,
  /** @deprecated ignored */
  borderColor?: string,
  /** @deprecated ignored */
  textColor?: string,
  /** @deprecated ignored */
  disabledColor?: string,
  /** @deprecated ignored */
  height?: number,
}

const OIconButton = ({
  icon, urlIcon, title, onClick, disabled, isOutline, color = 'primary', appearance, size = 'md',
  iconColor, cover, iconCover, testID, style, iconStyle, textStyle
}: Props) => {
  const theme: any = useTheme()
  const iconSize = themePart(theme, 'button', `sizes.${size}.icon_size`)
  const image = icon ? (
    <Image
      source={urlIcon && typeof icon === 'string' ? { uri: icon } : icon}
      resizeMode={cover || iconCover ? 'cover' : 'contain'}
      style={StyleSheet.flatten([{ width: iconSize, height: iconSize }, iconColor ? { tintColor: iconColor } : null, iconStyle])}
    />
  ) : undefined
  return (
    <OButton
      text={title}
      icon={image}
      iconOnly={!title}
      onClick={onClick}
      disabled={disabled}
      color={color}
      appearance={appearance ?? (isOutline ? 'outline' : 'solid')}
      size={size}
      style={style}
      textStyle={textStyle}
      testID={testID}
    />
  )
}

export default OIconButton;
