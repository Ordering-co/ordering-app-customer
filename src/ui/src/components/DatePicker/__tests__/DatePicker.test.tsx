import '../../../../../../jest/helpers/registerM9NativeMocks'

import React from 'react'

import { DatePickerUI } from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

jest.mock('@components', () => require('../../../../../../jest/helpers/m9IntegrationsComponentsMock').getMock())

describe('DatePicker', () => {
  it('renders date picker when open', () => {
    const d = require('../../../../../../jest/helpers/m9IntegrationsDefaults')
    const { getByTestId } = renderWithProviders(
      <DatePickerUI {...d.datePickerDefaults} />
    )
    expect(getByTestId('date-picker')).toBeTruthy()
  })

  it('renders nothing when closed', () => {
    const d = require('../../../../../../jest/helpers/m9IntegrationsDefaults')
    const { queryByTestId } = renderWithProviders(
      <DatePickerUI {...d.datePickerDefaults} open={false} />
    )
    expect(queryByTestId('date-picker')).toBeNull()
  })

  it('opens in the sheet and confirms the chosen date', () => {
    const { fireEvent } = require('@testing-library/react-native')
    const d = require('../../../../../../jest/helpers/m9IntegrationsDefaults')
    const onConfirm = jest.fn()
    const { getByTestId, getByText } = renderWithProviders(
      <DatePickerUI {...d.datePickerDefaults} open onConfirm={onConfirm} />
    )
    expect(getByText('Select a date')).toBeTruthy()
    fireEvent.press(getByTestId('date-picker-confirm'))
    expect(onConfirm).toHaveBeenCalledWith(expect.any(Date))
  })

  it('gives each of its two actions half of the row', () => {
    const { StyleSheet } = require('react-native')
    const d = require('../../../../../../jest/helpers/m9IntegrationsDefaults')
    const { getByTestId, getByText } = renderWithProviders(
      <DatePickerUI {...d.datePickerDefaults} open />
    )
    // The row's children are the buttons' pressables: each grows to its half.
    const host = (node: any) => {
      while (node && typeof node.type !== 'string') node = node.parent
      return node
    }
    const confirm = getByTestId('date-picker-confirm')
    let cancel: any = getByText('Cancel')
    while (cancel && cancel.props.accessibilityRole !== 'button') cancel = cancel.parent
    const row = host(confirm.parent)
    expect(StyleSheet.flatten(row.props.style)).toEqual(expect.objectContaining({ flexDirection: 'row' }))
    expect(host(cancel.parent)).toBe(row)
    for (const action of [cancel, confirm]) {
      expect(StyleSheet.flatten(action.props.style)).toEqual(expect.objectContaining({ flex: 1 }))
    }
  })

  it('opens on the birthday as a day of the device, not of UTC', () => {
    const d = require('../../../../../../jest/helpers/m9IntegrationsDefaults')
    const { getByTestId } = renderWithProviders(
      <DatePickerUI {...d.datePickerDefaults} birthdate='1990-05-12' open />
    )
    // `new Date('1990-05-12')` is midnight UTC: another hour here, the day before in America.
    const value: Date = getByTestId('date-picker').props.value
    expect([value.getFullYear(), value.getMonth(), value.getDate(), value.getHours(), value.getMinutes()]).toEqual([1990, 4, 12, 0, 0])
  })

  it('gives back the same day when it is confirmed untouched', () => {
    const { fireEvent } = require('@testing-library/react-native')
    const moment = require('moment')
    const d = require('../../../../../../jest/helpers/m9IntegrationsDefaults')
    const onConfirm = jest.fn()
    const { getByTestId } = renderWithProviders(
      <DatePickerUI {...d.datePickerDefaults} birthdate='1990-05-12 00:00:00' open onConfirm={onConfirm} />
    )
    fireEvent.press(getByTestId('date-picker-confirm'))
    const saved: Date = onConfirm.mock.calls[0][0]
    expect(moment(saved).format('YYYY-MM-DD HH:mm')).toBe('1990-05-12 00:00')
  })

  it('takes the wheel\'s day with the picker\'s current callback (onChange is deprecated)', () => {
    const { act, fireEvent } = require('@testing-library/react-native')
    const d = require('../../../../../../jest/helpers/m9IntegrationsDefaults')
    const onConfirm = jest.fn()
    const { getByTestId } = renderWithProviders(
      <DatePickerUI {...d.datePickerDefaults} open onConfirm={onConfirm} />
    )
    const picker = getByTestId('date-picker')
    expect(picker.props.onChange).toBeUndefined()
    const chosen = new Date(1985, 1, 3)
    act(() => picker.props.onValueChange({ nativeEvent: { timestamp: chosen.getTime(), utcOffset: 0 } }, chosen))
    fireEvent.press(getByTestId('date-picker-confirm'))
    expect(onConfirm).toHaveBeenCalledWith(chosen)
  })

  describe('on Android', () => {
    const { Platform } = require('react-native')
    const { DateTimePickerAndroid } = require('@react-native-community/datetimepicker')
    const d = require('../../../../../../jest/helpers/m9IntegrationsDefaults')
    const original = Platform.OS
    const lastOpen = () => DateTimePickerAndroid.open.mock.calls[DateTimePickerAndroid.open.mock.calls.length - 1][0]

    beforeEach(() => {
      Platform.OS = 'android'
      DateTimePickerAndroid.open.mockClear()
      DateTimePickerAndroid.dismiss.mockClear()
    })
    afterEach(() => { Platform.OS = original })

    it('opens the platform dialog, its OK confirming and its Cancel cancelling', () => {
      const onConfirm = jest.fn()
      const onCancel = jest.fn()
      const { queryByTestId } = renderWithProviders(
        <DatePickerUI {...d.datePickerDefaults} open onConfirm={onConfirm} onCancel={onCancel} />
      )
      expect(queryByTestId('date-picker')).toBeNull()
      expect(DateTimePickerAndroid.open).toHaveBeenCalledTimes(1)
      expect(lastOpen()).toEqual(expect.objectContaining({ mode: 'date' }))
      // The picker's current callbacks, not the deprecated `onChange`.
      expect(lastOpen().onChange).toBeUndefined()

      const chosen = new Date(1990, 4, 12)
      lastOpen().onValueChange({ nativeEvent: { timestamp: chosen.getTime(), utcOffset: 0 } }, chosen)
      expect(onConfirm).toHaveBeenCalledWith(chosen)
      expect(onCancel).not.toHaveBeenCalled()
    })

    it('cancels once when the dialog is dismissed (Cancel, back, a touch outside)', () => {
      const onConfirm = jest.fn()
      const onCancel = jest.fn()
      const view = renderWithProviders(
        <DatePickerUI {...d.datePickerDefaults} open onConfirm={onConfirm} onCancel={onCancel} />
      )
      const dialog = lastOpen()
      dialog.onDismiss()
      dialog.onDismiss()
      expect(onCancel).toHaveBeenCalledTimes(1)
      expect(onConfirm).not.toHaveBeenCalled()

      // The caller closes it: nothing to dismiss, no second dialog, no second answer.
      view.rerender(<DatePickerUI {...d.datePickerDefaults} open={false} onConfirm={onConfirm} onCancel={onCancel} />)
      expect(DateTimePickerAndroid.dismiss).not.toHaveBeenCalled()
      expect(DateTimePickerAndroid.open).toHaveBeenCalledTimes(1)
      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it('answers nothing after a confirmed date, and does not open again when the caller renders', () => {
      const onConfirm = jest.fn()
      const onCancel = jest.fn()
      const view = renderWithProviders(
        <DatePickerUI {...d.datePickerDefaults} open onConfirm={onConfirm} onCancel={onCancel} />
      )
      const dialog = lastOpen()
      const chosen = new Date(1990, 4, 12)
      dialog.onValueChange({ nativeEvent: { timestamp: chosen.getTime(), utcOffset: 0 } }, chosen)
      // A late dismissal of the same dialog is not a cancel.
      dialog.onDismiss()
      view.rerender(<DatePickerUI {...d.datePickerDefaults} open birthdate={chosen} onConfirm={onConfirm} onCancel={onCancel} />)
      view.rerender(<DatePickerUI {...d.datePickerDefaults} open={false} birthdate={chosen} onConfirm={onConfirm} onCancel={onCancel} />)
      expect(onConfirm).toHaveBeenCalledTimes(1)
      expect(onCancel).not.toHaveBeenCalled()
      expect(DateTimePickerAndroid.open).toHaveBeenCalledTimes(1)
      expect(DateTimePickerAndroid.dismiss).not.toHaveBeenCalled()
    })

    it('closes the dialog, answering nothing, when the caller closes it first', () => {
      const onCancel = jest.fn()
      const view = renderWithProviders(
        <DatePickerUI {...d.datePickerDefaults} open onCancel={onCancel} />
      )
      const dialog = lastOpen()
      view.rerender(<DatePickerUI {...d.datePickerDefaults} open={false} onCancel={onCancel} />)
      expect(DateTimePickerAndroid.dismiss).toHaveBeenCalledWith('date')
      // The platform reports that dismissal: it is the app's own, not the user's.
      dialog.onDismiss()
      expect(onCancel).not.toHaveBeenCalled()
    })

    it('names the dialog\'s buttons with the app\'s words and starts on the years', () => {
      renderWithProviders(<DatePickerUI {...d.datePickerDefaults} birthdate='1990-05-12' open />)
      const dialog = lastOpen()
      expect(dialog.positiveButton).toEqual(expect.objectContaining({ label: 'Confirm' }))
      expect(dialog.negativeButton).toEqual(expect.objectContaining({ label: 'Cancel' }))
      expect(dialog.startOnYearSelection).toBe(true)
      const value: Date = dialog.value
      expect([value.getFullYear(), value.getMonth(), value.getDate(), value.getHours()]).toEqual([1990, 4, 12, 0])
    })
  })
})
