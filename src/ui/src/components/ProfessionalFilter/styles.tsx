import { StyleSheet } from 'react-native'
import { nativeBoxStyle, nativeTextStyle, themeRadius, themeSpace } from '@/theme/helpers'

/**
 * A professional to pick is a choice (`components.choice`): its box at rest,
 * its `selected` state for the chosen one, its text and gap.
 */
export const professionalChoiceStyles = (theme: any) => {
  const choice = theme.native.components.choice
  const selected = choice.variants.default.states.selected
  return StyleSheet.create({
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: choice.base.gap,
      minHeight: choice.sizes.lg.height,
      padding: themeSpace(theme, 'sm'),
      marginRight: themeSpace(theme, 'sm'),
      borderRadius: choice.base.radius,
      ...nativeBoxStyle(choice.base),
    },
    selected: {
      ...nativeBoxStyle(selected),
    },
    text: {
      ...nativeTextStyle(choice.base.text),
      color: choice.base.color,
    },
    selectedText: {
      color: selected.color,
    },
    photo: {
      width: choice.sizes.md.height,
      height: choice.sizes.md.height,
      borderRadius: themeRadius(theme, 'sm'),
    },
  })
}
