import React, { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { useTheme } from 'styled-components/native';

import { ProductIngredient as ProductIngredientController } from '@components'
import { ChoiceRow, OText } from '../shared'
import { nativeTextStyle, themeScoped } from '@/theme/helpers'

const ProductIngredientUI = (props: any) => {
  const {
    state,
    ingredient,
    toggleSelect,
    isSoldOut
  } = props

  const theme: any = useTheme();
  // The ingredient is a choice of a multiple list: the same row and check as the options' (`components.choice`).
  const choice = themeScoped(theme, 'product_option', 'choice')
  const styles = useMemo(() => StyleSheet.create({
    name: { ...nativeTextStyle(choice.base.text), color: choice.base.color, flex: 1 },
    selected: { color: choice.variants.default.states.selected.color }
  }), [choice])
  const checked = !!state?.selected && !isSoldOut

  return (
    <ChoiceRow
      kind='check'
      selected={checked}
      disabled={!!isSoldOut}
      onPress={() => toggleSelect()}
      accessibilityLabel={ingredient.name}
    >
      <OText style={[styles.name, checked && styles.selected]}>{ingredient.name}</OText>
    </ChoiceRow>
  )
}

export const ProductIngredient = (props: any) => {
  const productIngredientProps = {
    ...props,
    UIComponent: ProductIngredientUI
  }

  return (
    <ProductIngredientController {...productIngredientProps} />
  )
}
