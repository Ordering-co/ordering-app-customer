import React, { useState, useEffect, useMemo } from 'react'
import { StyleSheet, Dimensions } from 'react-native'
import { useTheme } from 'styled-components/native'
import moment from 'moment'
import { OCalendar } from '../shared/OCalendar'
import { ProfessionalProfileParams } from '../../types'

import {
  Container,
  ProfessionalPhoto,
  InfoWrapper,
  Divider,
  ScheduleWrapper,
  ButtonWrapper,
  CalendarWrapper,
  TitleRow
} from './styles'
import { themeSpace } from '@/theme/helpers'
import { useUtils, useLanguage, useConfig } from '@components'
import { OButton, OText, Icon } from '../shared'
import OSelect from '../shared/OSelect'

const windowWidth = Dimensions.get('window').width

export const ProfessionalProfile = (props: ProfessionalProfileParams) => {
  const {
    professional,
    handleChangeProfessionalSelected,
    onClose
  } = props

  const [{ is12Hours }] = useUtils()
  const theme: any = useTheme()
  const [, t] = useLanguage()
  const [{ configs }] = useConfig()

  const [selectDate, setSelectedDate] = useState<any>(new Date())
  const [isEnabled, setIsEnabled] = useState(false)
  const [timeList, setTimeList] = useState<any>([])
  const [timeSelected, setTimeSelected] = useState<string | null>(null)

  const styles = useMemo(() => StyleSheet.create({
    select: { marginBottom: themeSpace(theme, 'xl') },
    photoStyle: { alignSelf: 'center' },
  }), [theme])

  const onDateChange = (date: any) => {
    setSelectedDate(date)
    setTimeSelected(null)
  }

  const validateSelectedDate = (curdate: any, menu: any) => {
    const day = moment(curdate).format('d')
    setIsEnabled(menu?.schedule?.[day]?.enabled || false)
  }

  const getMomentTime = (time: any) => {
    const _moment = moment(`${moment(selectDate).format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD HH:mm').toDate()
    return _moment
  }

  const isBusyTime = (professional: any, selectedMoment: any) => {
    if (!selectedMoment) return false
    const startDay = moment(selectedMoment).utc().format('d')
    const isStartScheduleEnabled = professional?.schedule?.[startDay]?.enabled
    if (!isStartScheduleEnabled) return true

    if (professional?.busy_times?.length === 0) return false

    const busyTimes = professional?.busy_times

    const valid = busyTimes.some((item: any) => {
      return (moment.utc(item?.start).local().valueOf() <= moment(selectedMoment).valueOf() &&
        moment(selectedMoment).valueOf() < moment.utc(item?.end).local().valueOf())
    })
    return valid
  }

  const getTimes = (curdate: any, menu: any) => {
    validateSelectedDate(curdate, menu)
    const date = new Date()
    var dateSeleted = new Date(curdate)
    var times = []
    for (var k = 0; k < menu.schedule[dateSeleted.getDay()].lapses.length; k++) {
      var open = {
        hour: menu.schedule[dateSeleted.getDay()].lapses[k].open.hour,
        minute: menu.schedule[dateSeleted.getDay()].lapses[k].open.minute
      }
      var close = {
        hour: menu.schedule[dateSeleted.getDay()].lapses[k].close.hour,
        minute: menu.schedule[dateSeleted.getDay()].lapses[k].close.minute
      }
      for (var i = open.hour; i <= close.hour; i++) {
        if (date.getDate() !== dateSeleted.getDate() || i >= date.getHours()) {
          let hour = ''
          let meridian = ''
          if (is12Hours) {
            if (i === 0) {
              hour = '12'
              meridian = ' ' + t('AM', 'AM')
            } else if (i > 0 && i < 12) {
              hour = (i < 10 ? '0' + i : i)
              meridian = ' ' + t('AM', 'AM')
            } else if (i === 12) {
              hour = '12'
              meridian = ' ' + t('PM', 'PM')
            } else {
              hour = ((i - 12 < 10) ? '0' + (i - 12) : `${(i - 12)}`)
              meridian = ' ' + t('PM', 'PM')
            }
          } else {
            hour = i < 10 ? '0' + i : i
          }
          for (let j = (i === open.hour ? open.minute : 0); j <= (i === close.hour ? close.minute : 59); j += 15) {
            if (i !== date.getHours() || j >= date.getMinutes() || date.getDate() !== dateSeleted.getDate()) {
              times.push({
                text: hour + ':' + (j < 10 ? '0' + j : j) + meridian,
                value: (i < 10 ? '0' + i : i) + ':' + (j < 10 ? '0' + j : j)
              })
            }
          }
        }
      }
    }
    return times
  }

  const handleSelectProfessional = () => {
    handleChangeProfessionalSelected(professional)
    onClose && onClose()
  }

  useEffect(() => {
    if (selectDate === null || !professional?.schedule) return
    const _times = getTimes(selectDate, professional)
    setTimeList(_times)
  }, [selectDate, professional])

  return (
    <Container>
      {professional?.photo ? (
        <ProfessionalPhoto
          source={{
            uri: professional?.photo
          }}
        />
      ) : (
        <Icon
          name='person-circle-outline'
          color='text_muted'
          size={200}
        />
      )}
      <InfoWrapper>
        <OText preset='h3'>
          {professional?.name} {professional?.lastname}
        </OText>
      </InfoWrapper>
      <Divider />
      <ScheduleWrapper>
        <TitleRow>
          <OText preset='body_lg' weight={600}>
            {t('SCHEDULE', 'Schedule')}
          </OText>
          <OText preset='caption' color='danger_text'>
            {t('REQUIRED', 'Required')}
          </OText>
        </TitleRow>
        {professional?.schedule ? (
          <CalendarWrapper>
            {(timeList?.length > 0 && isEnabled) ? (
              <OSelect
                title={t('AVAILABLE_TIME_CHOICE', 'Available time choice')}
                placeholder={t('SELECT_A_TIME_OPTION', 'Select an option')}
                options={timeList.map((item: any) => ({
                  value: item.value,
                  label: item.text,
                  // A busy time stays selectable, painted as unavailable.
                  content: isBusyTime(professional, getMomentTime(item.value)) ? <OText color='text_disabled'>{item.text}</OText> : undefined
                }))}
                value={timeSelected}
                onSelect={(value) => setTimeSelected(value)}
                style={styles.select}
              />
            ) : (
              <OText preset='body_sm' mBottom='xl' color='danger_text'>
                {t('PROFESSIONAL_NOT_AVAILABLE', 'Professional is not available at the moment')}
              </OText>
            )}

            <OCalendar
              width={windowWidth - 110}
              onDateChange={onDateChange}
              minDate={new Date()}
              selectedDate={selectDate}
            />
          </CalendarWrapper>
        ) : (
          <OText preset='h3' mBottom='xl'>
            {t('NO_SCHEDULE', 'No schedule')}
          </OText>
        )}
      </ScheduleWrapper>
      <ButtonWrapper>
        <OButton
          onClick={() => handleSelectProfessional()}
          text={t('BOOK', 'Book')}
        />
      </ButtonWrapper>
    </Container>
  )
}
