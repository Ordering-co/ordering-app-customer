import React, { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { useTheme } from 'styled-components/native'
import { nativeTextStyle, themeText, themeColor, themeBorder, reservedBorder } from '@/theme/helpers'
import ChoiceMark from '../shared/ChoiceMark'

/** The theme's radio (`components.radio`): its size and checked / unchecked colors. */
export const RadioMark = ({ selected }: { selected: boolean }) => {
  return <ChoiceMark kind='radio' checked={selected} />
}

/**
 * The looks of the delivery-time screen read from the theme: the time rows
 * are `list_row`. The ASAP card and the day strip read
 * `date_strip` for their box model (padding, gap, radius, text roles) and
 * the brand / surface tokens directly for their states: available = `border`
 * on `surface`, selected = `primary` fill with `on_primary` text (never
 * `primary` text on `primary_subtle` — not enough contrast), closed /
 * unavailable = no border, `text_disabled` (name, number) and `text_muted`
 * ("Closed" / "Not available"). Every state reserves the available state's
 * border room (`reservedBorder`), so selecting or closing a card never
 * resizes it.
 */
export const useMomentLooks = () => {
  const theme: any = useTheme()
  return useMemo(() => {
    const strip = theme.native.components.date_strip.base
    const row = theme.native.components.list_row.base
    const available = { border: themeBorder(theme, 'thin') }
    const ring = reservedBorder([available])
    return StyleSheet.create({
      dayStrip: { flexGrow: 1 },
      // 48 pt / dp: the smaller of the two platforms' minimum touch target, unified (implementation notes; theme-exceptions.json).
      dayCell: { flexGrow: 1, minHeight: 48, minWidth: 48 },
      day: {
        minHeight: 48,
        minWidth: 48,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: strip.padding_y,
        gap: strip.gap,
        borderRadius: strip.radius,
        backgroundColor: themeColor(theme, 'surface'),
        ...ring(available),
      },
      daySelected: { backgroundColor: themeColor(theme, 'primary'), ...ring(null) },
      dayClosed: { backgroundColor: themeColor(theme, 'surface'), ...ring(null) },
      dayName: { ...nativeTextStyle(strip.name_text), color: themeColor(theme, 'text') },
      dayNumber: { ...nativeTextStyle(strip.number_text), color: themeColor(theme, 'text') },
      dayMonth: { ...nativeTextStyle(strip.name_text), color: themeColor(theme, 'text_muted') },
      dayTextSelected: { color: themeColor(theme, 'on_primary') },
      dayTextClosed: { color: themeColor(theme, 'text_disabled') },
      dayClosedLabel: { ...nativeTextStyle(strip.name_text), color: themeColor(theme, 'text_muted') },
      row: row.divider ? { borderBottomWidth: row.divider.borderWidth, borderBottomColor: row.divider.borderColor } : {},
      rowTitle: { ...nativeTextStyle(row.title), color: row.title_color },
      rowTitleSelected: themeText(theme, 'label'),
      rowSubtitle: { ...nativeTextStyle(row.subtitle), color: row.subtitle_color },
    })
  }, [theme])
}
