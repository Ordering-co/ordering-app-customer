import React, { useMemo } from 'react'
import { useTheme } from 'styled-components/native';
import { ScrollView, StyleSheet } from 'react-native'

import { useLanguage } from '@components'
import { themeGutter, themeSpace } from '@/theme/helpers'
import { FilterChip } from '../BusinessListingSearch/FilterChip'

/**
 * The icon of each address tag, the web's (a house, a briefcase, a heart, a
 * tag): the form's tag chips and the saved addresses read it from here, so a
 * tag has the same icon everywhere.
 */
export const ADDRESS_TAG_ICONS: Record<string, string> = {
  home: 'home',
  office: 'briefcase',
  favorite: 'heart-outline',
  other: 'pricetag'
}

/** An address's tag icon; one without a tag (or with one the form does not offer) takes "Other"'s. */
export const addressTagIcon = (tag?: string | null) => ADDRESS_TAG_ICONS[tag ?? ''] ?? ADDRESS_TAG_ICONS.other

export const TAG_OPTIONS = ['home', 'office', 'favorite', 'other'].map((key) => ({ key, icon: ADDRESS_TAG_ICONS[key] }));

/** A tag's name, capitalized when the translation falls back to its key. */
const tagText = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

/**
 * An address tag as the app's chip (`FilterChip`: `components.chip`, size
 * `sm`, its `selected` state): the same look in the address list filter, the
 * address form and the listing's filters.
 */
export const TagChip = ({ text, icon, selected, onPress }: { text: string, icon?: string, selected?: boolean, onPress: () => void }) => (
  <FilterChip size='sm' icon={icon} text={tagText(text)} selected={selected} onPress={onPress} />
)

/**
 * The tag filter of the address list.
 *
 * @param {Object} props
 * @param {string|null} props.selectedTag - The selected tag key
 * @param {Function} props.setSelectedTag - Sets the selected tag key (null clears it)
 */
export const TagOptions = ({ selectedTag, setSelectedTag }: any) => {
  const theme: any = useTheme();
  const [, t] = useLanguage()
  // One row on the page sides, scrolled sideways when it does not fit (never wrapped).
  const styles = useMemo(() => StyleSheet.create({
    row: { flexGrow: 0, marginTop: themeSpace(theme, 'xs'), marginBottom: themeSpace(theme, 'lg'), marginHorizontal: -themeGutter(theme) },
    content: { gap: themeSpace(theme, 'sm'), paddingHorizontal: themeGutter(theme) }
  }), [theme])

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row} contentContainerStyle={styles.content}>
      {TAG_OPTIONS.map(tag => (
        <TagChip
          key={tag.key}
          icon={tag.icon}
          selected={selectedTag === tag.key}
          text={t(`ADDRESS_TAG_${tag.key.toUpperCase()}`, tag.key)}
          onPress={() => setSelectedTag(selectedTag === tag.key ? null : tag.key)}
        />
      ))}
    </ScrollView>
  )
}
