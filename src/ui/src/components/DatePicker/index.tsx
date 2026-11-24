import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useTheme } from 'styled-components/native';
import { useLanguage } from '@components';
import { themeColor } from '@/theme/helpers';
import OBottomPopup from '../shared/OBottomPopup';
import OButton from '../shared/OButton';
import { DateActions, DateContainer } from './styles';
import { calendarDate } from './calendarDate';

// Layout only (no theme values): the two actions share the row, half each
// (on the button's own pressable, which is the row's child).
const layout = StyleSheet.create({ half: { flex: 1 } });

/**
 * A date choice (@react-native-community/datetimepicker), a birthday: a
 * calendar day, read and given back as the device's own day (`calendarDate`).
 * On iOS, in the app's one sheet (like every select): the wheel inside
 * `components.sheet`, its text in the theme's `text` color, with the theme's
 * buttons. On Android the platform has no wheel to embed: its date dialog
 * opens instead, on the years (a birthday is decades away from today), with
 * the app's own words on its buttons; its OK confirms, and its Cancel, the
 * back button or a touch outside cancel, each once.
 */
export const DatePickerUI = (props: any) => {
  const {
    birthdate,
    onConfirm,
    onCancel,
    open,
    maximumDate = new Date(),
    minimumDate,
  } = props;

  const [, t] = useLanguage();
  const theme: any = useTheme();
  const [date, setDate] = useState<Date>(() => calendarDate(birthdate));
  // The latest props, for the Android dialog opened once per `open`.
  const latest = useRef({ onConfirm, onCancel, birthdate, maximumDate, minimumDate, t });
  latest.current = { onConfirm, onCancel, birthdate, maximumDate, minimumDate, t };

  useEffect(() => {
    if (open) setDate(calendarDate(birthdate));
  }, [open, birthdate]);

  useEffect(() => {
    if (Platform.OS !== 'android' || !open) return;
    const now = latest.current;
    // One answer per opening: the dialog closed by the app itself (the screen
    // left, `open` off) answers nothing, and nothing answers twice.
    let answered = false;
    const answer = (reply: () => void) => {
      if (answered) return;
      answered = true;
      reply();
    };
    DateTimePickerAndroid.open({
      mode: 'date',
      value: calendarDate(now.birthdate),
      maximumDate: now.maximumDate,
      minimumDate: now.minimumDate,
      startOnYearSelection: true,
      positiveButton: { label: now.t('CONFIRM', 'Confirm') },
      negativeButton: { label: now.t('CANCEL', 'Cancel') },
      onValueChange: (_event, selected) => answer(() => latest.current.onConfirm?.(selected)),
      onDismiss: () => answer(() => latest.current.onCancel?.()),
      onError: () => answer(() => latest.current.onCancel?.()),
    });
    return () => {
      if (answered) return;
      answered = true;
      DateTimePickerAndroid.dismiss('date');
    };
  }, [open]);

  if (Platform.OS === 'android') return null;

  return (
    <OBottomPopup
      open={!!open}
      onClose={() => onCancel && onCancel()}
      title={t('SELECT_A_DATE', 'Select a date')}
      closeIcon
      transparent
      animationType='slide'
      presentationStyle='overFullScreen'
    >
      <DateContainer>
        <DateTimePicker
          testID='date-picker'
          mode='date'
          display='spinner'
          value={date}
          onValueChange={(_event, selected) => selected && setDate(selected)}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          textColor={themeColor(theme, 'text')}
        />
      </DateContainer>
      <DateActions>
        <OButton
          text={t('CANCEL', 'Cancel')}
          color='neutral'
          appearance='outline'
          onClick={() => onCancel && onCancel()}
          parentStyle={layout.half}
        />
        <OButton
          testID='date-picker-confirm'
          text={t('CONFIRM', 'Confirm')}
          onClick={() => onConfirm(date)}
          parentStyle={layout.half}
        />
      </DateActions>
    </OBottomPopup>
  );
};
