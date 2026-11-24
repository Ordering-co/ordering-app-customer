import React, { useMemo } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import { useTheme } from 'styled-components/native'
import { SubCategoriesContainer } from './styles'

import { useLanguage } from '@components'
import { Icon, OText } from '../../shared'
import { nativeBoxStyle, nativeTextStyle, themeControlHeight, themePart } from '@/theme/helpers'

function SubcategoriesComponentPropsAreEqual(prev: any, next: any) {
  return prev.subcategoriesSelected === next.subcategoriesSelected &&
    prev.category === next.category
}

interface SubcategoriesComponentParams {
  subcategoriesSelected?: any,
  category?: any,
  onClickSubcategory: any
}

/** A filter chip: `components.chip` (size `sm`) with its selected state. */
const Chip = ({ text, selected, onPress }: { text: string, selected: boolean, onPress: () => void }) => {
  const theme: any = useTheme()
  const styles = useMemo(() => {
    const chip = themePart(theme, 'chip', 'base')
    const size = themePart(theme, 'chip', 'sizes.sm')
    const states = themePart(theme, 'chip', 'variants.default.states')
    // Up to the touch target of a control (`size.md`) around the chip's own height.
    const slop = Math.max(0, (themeControlHeight(theme, 'md') - size.height) / 2)
    return {
      slop,
      selectedColor: states.selected.color,
      ...StyleSheet.create({
        chip: {
          flexDirection: 'row',
          alignItems: 'center',
          height: size.height,
          paddingHorizontal: size.padding_x,
          gap: chip.gap,
          borderRadius: chip.radius,
          ...nativeBoxStyle({ background: chip.background, border: chip.border })
        },
        selected: nativeBoxStyle({ background: states.selected.background, border: states.selected.border }),
        pressed: nativeBoxStyle({ background: states.pressed.background }),
        text: { ...nativeTextStyle(chip.text), color: chip.color },
        selectedText: { color: states.selected.color }
      })
    }
  }, [theme])

  return (
    <Pressable
      accessibilityRole='button'
      accessibilityState={{ selected }}
      hitSlop={styles.slop}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}
    >
      <OText style={[styles.text, selected && styles.selectedText]}>{text}</OText>
      {selected && <Icon name='close-circle' size='sm' color={styles.selectedColor} />}
    </Pressable>
  )
}

const SubcategoriesComponent = (props: SubcategoriesComponentParams) => {
  const {
    subcategoriesSelected,
    category,
    onClickSubcategory
  } = props

  const [, t] = useLanguage()
  const allsubcategorySelected = !subcategoriesSelected?.some((subcategory: any) => category?.id === subcategory?.parent_category_id)

  return (
    <SubCategoriesContainer>
      <Chip
        text={t('ALL', 'All')}
        selected={allsubcategorySelected}
        onPress={() => onClickSubcategory(null, category)}
      />
      {category?.subcategories?.map((subcategory: any) => (
        <Chip
          key={subcategory?.id}
          text={subcategory?.name}
          selected={!!subcategoriesSelected?.find((_subcategory: any) => _subcategory?.id === subcategory?.id)}
          onPress={() => onClickSubcategory(subcategory, category)}
        />
      ))}
    </SubCategoriesContainer>
  )
}

export const SubcategoriesComponentMemoized = React.memo(SubcategoriesComponent, SubcategoriesComponentPropsAreEqual)
