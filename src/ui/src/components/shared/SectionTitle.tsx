import React, { useMemo } from 'react'
import { StyleSheet, TextStyle, View, ViewStyle } from 'react-native'
import { useTheme } from 'styled-components/native'
import { nativeTextStyle, themeTitleAlign } from '@/theme/helpers'
import OText from './OText'

interface Props {
  children: React.ReactNode
  /** A line under the title (`section_header.description`). */
  description?: React.ReactNode
  /**
   * The text look of the component the section belongs to (for example
   * `checkout.section_title`), when it has its own; else `section_header`'s.
   */
  text?: Record<string, any>
  color?: string
  numberOfLines?: number
  style?: ViewStyle
  testID?: string
}

/**
 * Every section title of the app (`components.section_header`): its text and
 * color (or the hosting component's own), its alignment and the space under it
 * (`margin_bottom`), so a title sits the same distance from its content on
 * every screen.
 */
export const SectionTitle = ({ children, description, text, color, numberOfLines, style, testID }: Props) => {
  const theme: any = useTheme()
  const styles = useMemo(() => {
    const section = theme.native.components.section_header.base
    const align = themeTitleAlign(theme)
    return StyleSheet.create({
      box: { marginBottom: section.margin_bottom, gap: section.gap },
      title: { ...nativeTextStyle(text ?? section.title), color: color ?? section.title_color, textAlign: align } as TextStyle,
      description: { ...nativeTextStyle(section.description), color: section.description_color, textAlign: align } as TextStyle
    })
  }, [theme, text, color])
  return (
    <View style={[styles.box, style]} testID={testID}>
      <OText style={styles.title} numberOfLines={numberOfLines} ellipsizeMode='tail'>{children}</OText>
      {!!description && <OText style={styles.description}>{description}</OText>}
    </View>
  )
}

export default SectionTitle
