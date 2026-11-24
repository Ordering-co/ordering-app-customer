import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import moment from 'moment';
import { ScrollView, Pressable } from 'react-native';
import { useTheme } from 'styled-components/native';

import { MomentOptionParams } from '../../types';

import {
  Container,
  HeaderWrapper,
  DayTabsRow,
  DayTabCard,
  DayCell,
  DayTag,
  StripHint,
  SectionWrapper,
  EmptyWrapper
} from './styles';
import { useMomentLooks } from './RadioMark';
import { DayStrip, dayIsClosed, firstAvailableDate, fullDateLabel } from './DayStrip';
import { themeGutter, themeSpace, bottomBarClearance } from '@/theme/helpers';

import {
  useLanguage,
  useConfig,
  useOrder,
  useUtils,
  createDayjsWithTimezone,
  MomentOption as MomentOptionController,
} from '@components';
import { setLocalMoment } from '../../utils';
import { TimeListItem } from './TimeListItem';
import {
  FloatingButton,
  OButton,
  OText,
  ONotice,
  Icon
} from '@ui'

/** The footer's buttons (Continue and Cancel), for the room under the list. */
const FOOTER_BUTTONS = 2

const MomentOptionUI = (props: MomentOptionParams) => {
  const {
    navigation,
    datesList,
    hoursList,
    dateSelected,
    timeSelected,
    cateringPreorder,
    isCart,
    preorderLeadTime,
    business,
    handleBusinessClick,
    getActualSchedule,
    preorderMaximumDays,
    preorderMinimumDays,
    handleAsap,
    handleChangeDate,
    handleChangeTime,
  } = props;

  const theme: any = useTheme();
  const insets = useSafeAreaInsets()
  const looks = useMomentLooks();
  const [, t] = useLanguage();
  const [{ configs }] = useConfig();
  const [orderState] = useOrder();
  const [{ is12Hours, getMaxPreorderDays }] = useUtils();

  const is12hours = is12Hours
  const maxPreorderDays = getMaxPreorderDays(orderState?.options?.type)

  const [isAsapSelected, setIsAsapSelected] = useState(false);
  const [selectedTime, setSelectedTime] = useState<any>(null);
  const [timeList, setTimeList] = useState<any>(hoursList);
  const [nextTime, setNextTime] = useState<any>(null);

  const stripScrollRef = useRef<any>(null);
  // Scrolls the selected day into view once, only when the screen opens on an
  // already-scheduled moment (a fresh ASAP open starts at the strip's left edge).
  const openedWithSchedule = useRef(!!timeSelected).current;
  const scrolledToSelection = useRef(false);

  // Business clock, not the device's: `dateSelected` comes from the controller in
  // the business timezone. Not memoised — it must follow the business day rolling over.
  const businessNow: any = business?.timezone
    ? createDayjsWithTimezone(business.timezone)
    : moment()
  const todayStr = businessNow.format('YYYY-MM-DD')
  // Catering has its own lead-time flow and never offers ASAP.
  const showAsap = !cateringPreorder
  const todayClosed = dayIsClosed(todayStr, business, businessNow)
  const asapAvailable = showAsap && !todayClosed
  const showFooter = !isCart && !cateringPreorder
  const isBusinessPreorder = !!handleBusinessClick
  const showTimeRange = !isBusinessPreorder && [1, 7].includes(orderState?.options?.type)
  const slotInterval = parseInt(configs?.preorder_slot_interval?.value, 10) > 0
    ? parseInt(configs?.preorder_slot_interval?.value, 10)
    : 30

  const goToBack = () => navigation?.canGoBack() && navigation.goBack();

  const formatHour = (hhmm: string) =>
    moment(hhmm, 'HH:mm').format(is12hours ? 'h:mm A' : 'HH:mm')

  const tabDates = useMemo(() => {
    const start = (cateringPreorder && preorderMinimumDays) || 0
    const end = Number(cateringPreorder
      ? (preorderMaximumDays || maxPreorderDays)
      : (maxPreorderDays ?? 6))
    return (datesList ?? []).slice(start, end)
  }, [JSON.stringify(datesList), cateringPreorder, preorderMinimumDays, preorderMaximumDays, maxPreorderDays])

  // Today (or the window's first day) closed: name the first open one
  // instead of preselecting anything.
  const firstAvailable = tabDates.length > 0 && dayIsClosed(tabDates[0], business, businessNow)
    ? firstAvailableDate(tabDates, business, businessNow)
    : null

  // The confirmed day is closed (today, with nothing else chosen yet): no
  // hours to show, and no card reads as selected either.
  const selectedDayClosed = !isAsapSelected && dayIsClosed(dateSelected, business, businessNow)

  const leaveScreen = () => {
    if (handleBusinessClick && business) {
      handleBusinessClick(business)
    } else {
      goToBack()
    }
  }

  const onSelectDay = (dateStr: string) => {
    if (dateStr === dateSelected && !isAsapSelected) return
    setSelectedTime(null)
    setIsAsapSelected(false)
    handleChangeDate && handleChangeDate(dateStr)
  }

  const onSelectTime = (time: any) => {
    setIsAsapSelected(false)
    if (cateringPreorder) {
      handleChangeTime(time)
    } else {
      setSelectedTime(time)
    }
  }

  const onSelectAsap = () => {
    if (!asapAvailable) return
    setSelectedTime(null)
    setIsAsapSelected(true)
    if (!showFooter) handleAsap()
  }

  const handleConfirm = () => {
    if (isAsapSelected) handleAsap()
    else handleChangeTime(selectedTime)
    leaveScreen()
  }

  useEffect(() => {
    setIsAsapSelected(asapAvailable && !orderState.options?.moment)
  }, [orderState.options?.moment, asapAvailable]);

  useEffect(() => {
    setSelectedTime(timeSelected)
  }, [timeSelected])

  // Keep the controller's selected date in sync for the catering vertical
  useEffect(() => {
    if (cateringPreorder && dateSelected) {
      handleChangeDate && handleChangeDate(dateSelected)
    }
  }, [dateSelected])

  useEffect(() => {
    const hasBusiness = Object.keys(business || {}).length > 0
    const schedule = hasBusiness && getActualSchedule?.()
    if (cateringPreorder && hasBusiness && !schedule) {
      setTimeList([])
      return
    }
    // Both sides are wall clocks on the business's day — never parse them into
    // instants, that applies the device offset to one side only.
    const minutesOf = (hhmm: string) => {
      const [h, m] = String(hhmm).split(':').map(Number)
      return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null
    }
    const leadTime = cateringPreorder && Number.isFinite(preorderLeadTime) ? preorderLeadTime : 0
    const lapses = (schedule?.lapses ?? []).filter((lapse: any) =>
      Number.isFinite(lapse?.open?.hour) && Number.isFinite(lapse?.close?.hour))
    const nowMinutes = businessNow.hour() * 60 + businessNow.minute()

    const slots = (hoursList ?? [])
      .filter((hour: any) => {
        const start = minutesOf(hour.startTime)
        const end = minutesOf(hour.endTime)
        if (start === null || end === null || start >= end) return false
        const openNow = !lapses.length || lapses.some((lapse: any) =>
          start >= lapse.open.hour * 60 + (lapse.open.minute ?? 0) + leadTime &&
          start <= lapse.close.hour * 60 + (lapse.close.minute ?? 0))
        const afterLeadTime = !cateringPreorder || dateSelected !== todayStr ||
          start > nowMinutes + leadTime
        return openNow && afterLeadTime
      })
      .map((hour: any) => ({ value: hour.startTime, text: formatHour(hour.startTime) }))

    if (isBusinessPreorder) {
      setTimeList(slots)
      return
    }
    const thinned: any[] = []
    let lastKept: number | null = null
    slots.forEach((slot: any) => {
      const start = minutesOf(slot.value)
      if (start === null || (lastKept !== null && start - lastKept < slotInterval)) return
      lastKept = start
      thinned.push({
        ...slot,
        endText: showTimeRange
          ? formatHour(moment(slot.value, 'HH:mm').add(slotInterval, 'minutes').format('HH:mm'))
          : undefined
      })
    })
    setTimeList(thinned)
  }, [dateSelected, hoursList?.length, JSON.stringify(business)])

  useEffect(() => {
    setLocalMoment(moment, t)
  }, [])

  useEffect(() => {
    if (preorderMinimumDays === 0 && preorderLeadTime === 0) return
    if (isCart && dateSelected === todayStr && !orderState?.loading && timeList?.length > 0) {
      setNextTime(timeList?.[0] ?? null)
    }
  }, [timeList?.length])

  useEffect(() => {
    if (nextTime?.value && timeList?.length > 0 && isCart && !orderState?.loading && !(preorderMinimumDays === 0 && preorderLeadTime === 0)) {
      const notime = timeList?.filter((_: any, i: number) => i !== 0)?.find?.((time: any) => time?.value === timeSelected)
      if (!notime) {
        handleChangeTime(nextTime?.value)
      }
    }
  }, [nextTime?.value])

  return (
    <>
      <Container
        contentContainerStyle={{
          paddingHorizontal: themeGutter(theme),
          paddingTop: themeSpace(theme, 'md'),
          // Clears the footer: the bottom bar with two buttons.
          paddingBottom: showFooter ? bottomBarClearance(theme, insets.bottom, FOOTER_BUTTONS) : themeSpace(theme, 'xl')
        }}
        showsVerticalScrollIndicator={false}
      >
        <HeaderWrapper>
          <OText preset='body' color='text_muted'>
            {t('CHOOSE_DELIVERY_TIME_SUBTITLE', 'Choose an available time for your delivery.')}
          </OText>
        </HeaderWrapper>

        {(showAsap || tabDates.length > 1) ? (
          <>
            <ScrollView
              ref={stripScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={looks.dayStrip}
            >
              <DayTabsRow accessibilityRole='radiogroup' accessibilityLabel={t('CHOOSE_DATE', 'Choose date')}>
                {showAsap ? (
                  <DayCell>
                    <DayTag>
                      <OText preset='caption' color='primary' align='center'> </OText>
                    </DayTag>
                    <Pressable
                      style={looks.dayCell}
                      onPress={onSelectAsap}
                      disabled={orderState.loading || !asapAvailable}
                      accessibilityRole='radio'
                      accessibilityState={{ checked: isAsapSelected, disabled: !asapAvailable }}
                      accessibilityLabel={`${t('AS_SOON_AS_POSSIBLE', 'As soon as possible')}${!asapAvailable ? `, ${t('NOT_AVAILABLE', 'Not available')}` : ''}`}
                    >
                      <DayTabCard style={[looks.day, isAsapSelected && looks.daySelected, !asapAvailable && looks.dayClosed]}>
                        <Icon
                          name='flash'
                          size='md'
                          color={isAsapSelected ? 'on_primary' : (!asapAvailable ? 'text_disabled' : 'text')}
                        />
                        <OText
                          style={[looks.dayName, isAsapSelected && looks.dayTextSelected, !asapAvailable && looks.dayTextClosed]}
                          align='center'
                        >
                          {t('AS_SOON_AS_POSSIBLE', 'As soon as possible')}
                        </OText>
                        {!asapAvailable ? (
                          <OText style={looks.dayClosedLabel}>{t('NOT_AVAILABLE', 'Not available')}</OText>
                        ) : null}
                      </DayTabCard>
                    </Pressable>
                  </DayCell>
                ) : null}
                <DayStrip
                  dates={tabDates}
                  // the controller's fallback day (today, closed) is no choice; a stored
                  // moment on a day that has closed since still is
                  dateSelected={isAsapSelected || (selectedDayClosed && !orderState.options?.moment) ? null : dateSelected}
                  onSelectDate={onSelectDay}
                  disabled={orderState.loading}
                  business={business}
                  businessNow={businessNow}
                  t={t}
                  onSelectedLayout={(x) => {
                    if (!openedWithSchedule || scrolledToSelection.current) return
                    scrolledToSelection.current = true
                    stripScrollRef.current?.scrollTo({ x: Math.max(0, x), animated: false })
                  }}
                />
              </DayTabsRow>
            </ScrollView>

            {firstAvailable ? (
              <StripHint>
                <OText preset='body_sm' color='text_muted'>
                  {t('PREORDER_FIRST_AVAILABLE_DATE', 'First available day: _date_').replace('_date_', fullDateLabel(firstAvailable))}
                </OText>
              </StripHint>
            ) : null}
          </>
        ) : null}

        <SectionWrapper>
          {isAsapSelected ? (
            <ONotice variant='info'>
              {t('ASAP_NOTICE', "We'll get your order ready as soon as possible. To schedule it, choose a day.")}
            </ONotice>
          ) : selectedDayClosed ? (
            <EmptyWrapper>
              <OText preset='body' color='text_muted' align='center'>
                {orderState.options?.moment
                  // the stored moment's day has closed since: say so, not "choose a day"
                  ? t('NOT_AVAILABLE_HOURS_DAY', 'Not available hours for this day')
                  : t('PREORDER_SELECT_DATE_FIRST', 'Choose a day to see its hours.')}
              </OText>
            </EmptyWrapper>
          ) : timeList?.length > 0 ? (
            timeList.map((time: any, i: number) => (
              <TimeListItem
                key={i}
                time={time}
                selected={selectedTime === time.value}
                onSelect={onSelectTime}
              />
            ))
          ) : (
            <EmptyWrapper>
              <OText preset='body' color='text_muted' align='center'>
                {t('NO_TIMES_AVAILABLE', 'No delivery times available for this day')}
              </OText>
            </EmptyWrapper>
          )}
        </SectionWrapper>
      </Container>

      {showFooter ? (
        <FloatingButton
          text={t('CONTINUE', 'Continue')}
          disabled={!isAsapSelected && (!selectedTime || (selectedDayClosed && !orderState.options?.moment))}
          handleClick={handleConfirm}
          secondElement={
            <OButton
              text={t('CANCEL', 'Cancel')}
              color='neutral'
              appearance='ghost'
              onClick={goToBack}
              disabled={orderState.loading}
            />
          }
        />
      ) : null}
    </>
  );
};

export const MomentOption = (props: any) => {
  const momentOptionProps = {
    ...props,
    UIComponent: MomentOptionUI,
  };
  return <MomentOptionController {...momentOptionProps} />;
};
