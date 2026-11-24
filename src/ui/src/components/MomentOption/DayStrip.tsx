import React from 'react'
import { Pressable } from 'react-native'
import moment from 'moment'

import OText from '../shared/OText'
import { DayCell, DayTag, DayTabCard } from './styles'
import { useMomentLooks } from './RadioMark'

/**
 * Whether a business day is closed on `dateStr`: its weekly schedule says so
 * (`business.schedule[weekday].enabled === false`, 0 = Sunday), or — today
 * only — every lapse it has today already closed by `businessNow`. Without a
 * business or a schedule, nothing is closed (BusinessReservation without
 * one): a day is only ever closed once the data to know that exists.
 */
export const dayIsClosed = (dateStr: string, business: any, businessNow: any): boolean => {
  const schedule = business?.schedule
  if (!Array.isArray(schedule)) return false
  const weekday = moment(dateStr, 'YYYY-MM-DD').day()
  const daySchedule = schedule[weekday]
  if (!daySchedule?.enabled) return true
  if (dateStr !== businessNow.format('YYYY-MM-DD')) return false
  const lapses = daySchedule.lapses || []
  if (!lapses.length) return false
  const nowMinutes = businessNow.hour() * 60 + businessNow.minute()
  const minutesOf = (time: any) => (time?.hour ?? 0) * 60 + (time?.minute ?? 0)
  // a lapse closing at or before it opens runs past midnight: still open today
  return lapses.every((lapse: any) => minutesOf(lapse.close) > minutesOf(lapse.open) && minutesOf(lapse.close) <= nowMinutes)
}

/** The first of `dates` that is not closed, or `null` when every one is. */
export const firstAvailableDate = (dates: string[], business: any, businessNow: any): string | null =>
  dates.find((date) => !dayIsClosed(date, business, businessNow)) ?? null

/** `dateStr` in the app's language, long form ("Thursday, 19 November"). */
export const fullDateLabel = (dateStr: string) => moment(dateStr, 'YYYY-MM-DD').format('dddd, D MMMM')

interface DayStripProps {
  dates: string[]
  /** The confirmed date, or `null` while nothing of this strip is selected (ASAP chosen instead). */
  dateSelected: string | null
  onSelectDate: (dateStr: string) => void
  disabled?: boolean
  business?: any
  businessNow: any
  t: (key: string, fallback: string) => string
  /** Reports the on-screen x of the selected day once laid out, to scroll it into view. */
  onSelectedLayout?: (x: number) => void
}

/**
 * The strip of days shared by MomentOption and
 * ReservationDateTimePicker: `components.date_strip`, each day a `radio` of
 * the strip's `radiogroup`. Today is tagged, closed days (when `business`'s
 * schedule says so) are disabled and read "Closed" instead of their month.
 */
export const DayStrip = ({ dates, dateSelected, onSelectDate, disabled, business, businessNow, t, onSelectedLayout }: DayStripProps) => {
  const looks = useMomentLooks()
  const todayStr = businessNow.format('YYYY-MM-DD')

  return (
    <>
      {dates.map((dateStr) => {
        const closed = dayIsClosed(dateStr, business, businessNow)
        const isToday = dateStr === todayStr
        const selected = dateStr === dateSelected
        // a confirmed day that has closed since keeps its selected look
        const closedLook = closed && !selected
        const date = moment(dateStr, 'YYYY-MM-DD')
        const label = `${fullDateLabel(dateStr)}${isToday ? `, ${t('TODAY', 'Today')}` : ''}${closed ? `, ${t('CLOSED', 'Closed')}` : ''}`
        return (
          <DayCell key={dateStr} onLayout={selected ? (e: any) => onSelectedLayout?.(e.nativeEvent.layout.x) : undefined}>
            <DayTag>
              <OText preset='caption' color='primary' align='center'>{isToday ? t('TODAY', 'Today') : ' '}</OText>
            </DayTag>
            <Pressable
              style={looks.dayCell}
              onPress={() => !closed && onSelectDate(dateStr)}
              disabled={disabled || closed}
              accessibilityRole='radio'
              accessibilityState={{ checked: selected, disabled: closed }}
              accessibilityLabel={label}
            >
              <DayTabCard style={[looks.day, selected && looks.daySelected, closedLook && looks.dayClosed]}>
                <OText style={[looks.dayName, selected && looks.dayTextSelected, closedLook && looks.dayTextClosed]}>{date.format('ddd')}</OText>
                <OText style={[looks.dayNumber, selected && looks.dayTextSelected, closedLook && looks.dayTextClosed]}>{date.format('D')}</OText>
                {closedLook
                  ? <OText style={looks.dayClosedLabel}>{t('CLOSED', 'Closed')}</OText>
                  : <OText style={[looks.dayMonth, selected && looks.dayTextSelected]}>{date.format('MMM')}</OText>}
              </DayTabCard>
            </Pressable>
          </DayCell>
        )
      })}
    </>
  )
}
