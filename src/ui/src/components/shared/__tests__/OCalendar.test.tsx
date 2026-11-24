import React from 'react'
import { StyleSheet } from 'react-native'
import { fireEvent } from '@testing-library/react-native'
import moment from 'moment'
import 'moment/locale/fr'

import { OCalendar } from '../OCalendar'
import { defaultAppTheme } from '../../../../../theme/engine'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

// The app's language: its own texts when it has them, the English fallback otherwise.
let mockTexts: Record<string, string> = {}
jest.mock('@components', () => ({
  useLanguage: () => [{ language: { code: 'en' } }, (key: string, fallback: string) => mockTexts[key] ?? fallback]
}))

describe('OCalendar', () => {
  const selected = new Date(2026, 10, 18)

  beforeEach(() => {
    mockTexts = {}
    moment.locale('en')
  })
  afterAll(() => { moment.locale('en') })

  it('shows the selected month and picks a day', () => {
    const onDateChange = jest.fn()
    const { getByText, getByLabelText } = renderWithProviders(
      <OCalendar selectedDate={selected} onDateChange={onDateChange} />
    )
    expect(getByText('November 2026')).toBeTruthy()
    fireEvent.press(getByLabelText('20 November 2026'))
    expect(onDateChange).toHaveBeenCalledWith(new Date(2026, 10, 20))
  })

  it('disables the days before minDate and the months before its own', () => {
    const onDateChange = jest.fn()
    const { getByLabelText } = renderWithProviders(
      <OCalendar selectedDate={selected} minDate={new Date(2026, 10, 15)} onDateChange={onDateChange} />
    )
    const before = getByLabelText('10 November 2026')
    expect(before.props.accessibilityState).toEqual(expect.objectContaining({ disabled: true }))
    fireEvent.press(before)
    expect(onDateChange).not.toHaveBeenCalled()
    expect(getByLabelText('Previous month').props.accessibilityState).toEqual(expect.objectContaining({ disabled: true }))
  })

  it('moves to the next month', () => {
    const { getByText, getByLabelText } = renderWithProviders(
      <OCalendar selectedDate={selected} onDateChange={jest.fn()} />
    )
    fireEvent.press(getByLabelText('Next month'))
    expect(getByText('December 2026')).toBeTruthy()
  })

  it('names the months, the days and its arrows in the app\'s language, whatever moment\'s global locale', () => {
    // Another screen left moment in French; the app is in Spanish.
    moment.locale('fr')
    mockTexts = { MONTH11: 'Noviembre', MONTH12: 'Diciembre', DAYSHORT7: 'Dom', DAYSHORT1: 'Lun', PREVIOUS_MONTH: 'Mes anterior', NEXT_MONTH: 'Mes siguiente' }
    const { getByText, getByLabelText, queryByText } = renderWithProviders(
      <OCalendar selectedDate={selected} onDateChange={jest.fn()} />
    )
    expect(getByText('Noviembre 2026')).toBeTruthy()
    expect(queryByText('novembre 2026')).toBeNull()
    expect(getByText('Dom')).toBeTruthy()
    expect(getByText('Lun')).toBeTruthy()
    expect(queryByText('dim.')).toBeNull()
    expect(getByLabelText('Mes anterior')).toBeTruthy()
    expect(getByLabelText('20 Noviembre 2026')).toBeTruthy()
    fireEvent.press(getByLabelText('Mes siguiente'))
    expect(getByText('Diciembre 2026')).toBeTruthy()
  })

  describe('the day\'s circle', () => {
    const control = defaultAppTheme().native.tokens.size.sm
    // The circle is the view around the day's number.
    const circleOf = (view: ReturnType<typeof renderWithProviders>) => {
      let node: any = view.getByText('18').parent
      while (node && node.type !== 'View') node = node.parent
      return StyleSheet.flatten(node.props.style)
    }

    // The callers give the screen's width less 110: 210 pt on a 320 pt screen.
    it.each([320, 340, 360, 390])('is never wider than its column on a %i pt screen', (screen) => {
      const width = screen - 110
      const circle = circleOf(renderWithProviders(<OCalendar selectedDate={selected} width={width} onDateChange={jest.fn()} />))
      expect(circle.width).toBeLessThanOrEqual(width / 7)
      expect(circle.width).toBe(circle.height)
      expect(circle.width).toBe(Math.min(control, Math.floor(width / 7)))
    })

    it('fits the width the calendar is laid out with when the caller gives none', () => {
      const view = renderWithProviders(<OCalendar selectedDate={selected} onDateChange={jest.fn()} />)
      expect(circleOf(view).width).toBe(control)
      fireEvent(view.getByTestId('calendar-picker'), 'layout', { nativeEvent: { layout: { width: 196, height: 300 } } })
      expect(circleOf(view).width).toBe(28)
    })
  })
})
