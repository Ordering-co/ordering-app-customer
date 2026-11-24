import React from 'react'
import moment from 'moment'
import { ScrollView, Pressable, Dimensions } from 'react-native'
import { useTheme } from 'styled-components/native'

import {
  DayTabsRow,
  SectionWrapper,
  EmptyWrapper,
  OptionRow,
  OptionLabels
} from '../MomentOption/styles'
import { DayStrip, dayIsClosed } from '../MomentOption/DayStrip'
import { useLanguage, createDayjsWithTimezone } from '@components'
import { OText } from '../shared'
import { themeSpace } from '@/theme/helpers'
import { RadioMark } from './pickerLook'
import { useMomentLooks } from '../MomentOption/RadioMark'

export const ReservationDateTimePicker = (props: any) => {
  const {
    business,
    datesList,
    hoursList,
    dateSelected,
    timeSelected,
    isEnabled,
    handleChangeDate,
    handleChangeTime
  } = props

  const theme: any = useTheme()
  const [, t] = useLanguage()
  // The days: `components.date_strip`, as in the delivery-time screen.
  const looks = useMomentLooks()
  // The business's clock, as the delivery-time screen (no ASAP here, only
  // "Today" and, when `business` carries a schedule, closed days)
  const businessNow: any = business?.timezone ? createDayjsWithTimezone(business.timezone) : moment()

  const onSelectDay = (dateStr: string) => {
    if (dateStr === dateSelected) return
    handleChangeDate && handleChangeDate(dateStr)
  }

  const showTimes = (isEnabled ?? true) && !!dateSelected && hoursList?.length > 0

  return (
    <>
      {datesList?.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={looks.dayStrip}>
          <DayTabsRow accessibilityRole='radiogroup' accessibilityLabel={t('CHOOSE_DATE', 'Choose date')}>
            <DayStrip
              dates={datesList}
              // the controller's default day is no choice when it is closed
              dateSelected={dayIsClosed(dateSelected, business, businessNow) ? null : dateSelected}
              onSelectDate={onSelectDay}
              business={business}
              businessNow={businessNow}
              t={t}
            />
          </DayTabsRow>
        </ScrollView>
      )}

      {showTimes
        ? (
          <ScrollView
            style={{ maxHeight: Dimensions.get('window').height * 0.35 }}
            nestedScrollEnabled
            showsVerticalScrollIndicator
          >
            <SectionWrapper>
              {hoursList.map((time: any, i: number) => {
                const selected = timeSelected === time.value
                const label = time.endText ? `${time.text} – ${time.endText}` : time.text
                return (
                  <Pressable key={i} onPress={() => handleChangeTime(time.value)} accessibilityRole='radio' accessibilityState={{ checked: selected }} accessibilityLabel={label}>
                    <OptionRow>
                      <RadioMark on={selected} style={{ marginEnd: themeSpace(theme, 'md') }} />
                      <OptionLabels>
                        <OText preset='body_lg' weight={selected ? 600 : 400} color='text'>
                          {label}
                        </OText>
                      </OptionLabels>
                    </OptionRow>
                  </Pressable>
                )
              })}
            </SectionWrapper>
          </ScrollView>
          )
        : (
          <SectionWrapper>
            <EmptyWrapper>
              <OText preset='body' weight={500} color='text_muted' align='center'>
                {t('NOT_AVAILABLE_HOURS_DAY', 'Not available hours for this day')}
              </OText>
            </EmptyWrapper>
          </SectionWrapper>
          )}
    </>
  )
}
