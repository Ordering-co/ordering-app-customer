import React from 'react';
import { useTheme } from 'styled-components/native';

import OButton from '../components/shared/OButton';
import Icon from '../components/shared/Icon';
import { themePart } from '@/theme/helpers';

/** FontAwesome5 brand names the login controllers pass → their Ionicons logos (D3). */
const BRAND_GLYPHS: Record<string, string> = {
  google: 'logo-google',
  facebook: 'logo-facebook',
  apple: 'logo-apple',
};

/**
 * The social sign-in button: `auth_form.slots.social` (a `button`), with the
 * provider's glyph at `auth_form.base.social_icon_size` in the color its
 * controller gives (a brand color).
 */
export const UIButton = (props: any) => {
  const {
    onPress,
    iconName,
    iconColor,
    buttonText,
    iconComponent: IconComponent
  } = props;

  const theme: any = useTheme();
  const slot = themePart(theme, 'auth_form', 'slots.social');
  const iconSize = themePart(theme, 'auth_form', 'base.social_icon_size');

  return (
    <OButton
      size={slot.size}
      color={slot.color}
      appearance={slot.appearance}
      onClick={onPress}
      text={buttonText}
      icon={IconComponent ?? (
        <Icon
          name={BRAND_GLYPHS[iconName] ?? iconName}
          size={iconSize}
          color={iconColor}
        />
      )}
    />
  );
};
