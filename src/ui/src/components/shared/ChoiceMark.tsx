import React from 'react'
import { useTheme } from 'styled-components/native'
import { themeScoped } from '@/theme/helpers'
import Icon from './Icon'

interface Props {
  /** `radio` for a single choice, `check` for a multiple one. */
  kind: 'radio' | 'check'
  checked: boolean
  /** The group whose scope restyles the choice (the product's options); none: the global look. */
  group?: string
  style?: any
  testID?: string
}

/**
 * The indicator of a choice (a product's options, ingredients): the theme's radio
 * (`components.radio`) for a single choice and its checkbox (`components.checkbox`)
 * for a multiple one, as icons of the app at the control's size, `checked` in the
 * brand color and the border color when it is not. The row around it carries the
 * disabled look and the touch area (`ChoiceRow`).
 */
const ChoiceMark = ({ kind, checked, group, style, testID }: Props) => {
  const theme: any = useTheme()
  const radio = group ? themeScoped(theme, group, 'radio') : theme.native.components.radio
  const checkbox = group ? themeScoped(theme, group, 'checkbox') : theme.native.components.checkbox
  if (kind === 'radio') {
    return (
      <Icon
        testID={testID}
        style={style}
        name={checked ? 'radio-button-on' : 'radio-button-off'}
        size={radio.base.size}
        color={checked ? radio.base.checked : radio.base.unchecked}
      />
    )
  }
  return (
    <Icon
      testID={testID}
      style={style}
      set='mci'
      name={checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
      size={checkbox.base.size}
      color={checked ? checkbox.base.checked : checkbox.base.border.borderColor}
    />
  )
}

export default ChoiceMark
