import '../../../../../../jest/helpers/registerM6NativeMocks'

import React from 'react'
import { fireEvent, screen } from '@testing-library/react-native'

import { MomentOption } from '..'
import { useOrder } from '@components'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

jest.mock('../TimeListItem', () => {
  const { TouchableOpacity, Text } = require('react-native')
  return {
    TimeListItem: (props: any) => (
      <TouchableOpacity
        testID="time-list-item"
        accessibilityRole='radio'
        accessibilityState={{ checked: !!props.selected }}
        onPress={() => props.onSelect?.(props.time?.value ?? props.time?.startTime)}
      >
        <Text>{String(props.time?.value ?? props.time?.startTime ?? '')}</Text>
      </TouchableOpacity>
    )
  }
})

jest.mock('@components', () => {
  const m6 = require('../../../../../../jest/helpers/m6OrdersComponentsMock')
  const d = require('../../../../../../jest/helpers/m6OrdersDefaults')
  return m6.getMock({
    MomentOption: m6.renderUiController(d.momentOptionDefaults)
  })
})
jest.mock('@ui', () => require('../../../../../../jest/helpers/m6OrdersUiMock').getUiMock())

// 0 = Sunday … 6 = Saturday, `business.schedule`'s own index.
const lapse = (open: [number, number], close: [number, number]) => ({
  open: { hour: open[0], minute: open[1] },
  close: { hour: close[0], minute: close[1] }
})
const scheduleClosedOn = (closedDays: number[], openLapses = [lapse([0, 0], [23, 59])]) =>
  Array.from({ length: 7 }, (_, day) => ({
    enabled: !closedDays.includes(day),
    lapses: closedDays.includes(day) ? [] : openLapses
  }))

// Wednesday 2026-11-18, 10:00 in Europe/Madrid (jest.config.js fixes TZ).
const NOW = new Date('2026-11-18T09:00:00Z')
const WED = '2026-11-18'
const THU = '2026-11-19'
const FRI = '2026-11-20'
const SAT = '2026-11-21'
const SUN = '2026-11-22'

const hoursOf = (...values: string[]) => values.map((v) => {
  const [h, m] = v.split(':').map(Number)
  const end = new Date(2000, 0, 1, h, m + 30)
  return { startTime: v, endTime: `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}` }
})

describe('MomentOption', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW)
    ;(useOrder as jest.Mock).mockReturnValue([
      { loading: false, options: { type: 1, moment: null } },
      {}
    ])
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('(a) opens on ASAP: its card is checked, no day is checked, no hours show, and "Today" is visible', () => {
    const { getByText, getByLabelText, queryAllByTestId } = renderWithProviders(
      <MomentOption
        navigation={{ canGoBack: () => true, goBack: jest.fn() }}
        datesList={[WED, THU, FRI]}
        dateSelected={WED}
        hoursList={hoursOf('12:00', '13:00')}
      />
    )
    // Without the fix this fails: the old UI kept the hour list visible
    // regardless of the ASAP row, and had no single radiogroup selection.
    expect(getByLabelText('As soon as possible').props.accessibilityState.checked).toBe(true)
    expect(getByLabelText(/Wednesday, 18 November, Today/).props.accessibilityState.checked).toBe(false)
    expect(getByText('Today')).toBeTruthy()
    expect(queryAllByTestId('time-list-item').length).toBe(0)
    expect(screen.getByTestId('floating-button').props.accessibilityState.disabled).toBe(false)
  })

  it('(b) today closed: its card reads "Closed" and disabled, ASAP is unavailable, nothing is checked, the hint names the next open day, and tapping it does nothing', () => {
    const handleChangeDate = jest.fn()
    const business = { schedule: scheduleClosedOn([3]) } // Wednesday (3) disabled
    const { getByLabelText, queryByText } = renderWithProviders(
      <MomentOption
        navigation={{ canGoBack: () => true, goBack: jest.fn() }}
        business={business}
        datesList={[WED, THU, FRI]}
        dateSelected={WED}
        hoursList={hoursOf('12:00', '13:00')}
        handleChangeDate={handleChangeDate}
      />
    )
    const asapCard = getByLabelText(/As soon as possible/)
    expect(asapCard.props.accessibilityState.checked).toBe(false)
    expect(asapCard.props.accessibilityState.disabled).toBe(true)

    const today = getByLabelText(/Wednesday, 18 November, Today, Closed/)
    expect(today.props.accessibilityState.checked).toBe(false)
    expect(today.props.accessibilityState.disabled).toBe(true)

    expect(queryByText(/First available day/)).toBeTruthy()

    fireEvent.press(today)
    expect(handleChangeDate).not.toHaveBeenCalled()
    expect(screen.getByTestId('floating-button').props.accessibilityState.disabled).toBe(true)
  })

  it('(c) three closed days ahead: the fourth is the first available, and nothing is preselected', () => {
    const business = { schedule: scheduleClosedOn([3, 4, 5]) } // Wed, Thu, Fri
    const { getByText, getByLabelText } = renderWithProviders(
      <MomentOption
        navigation={{ canGoBack: () => true, goBack: jest.fn() }}
        business={business}
        datesList={[WED, THU, FRI, SAT, SUN]}
        dateSelected={WED}
        hoursList={hoursOf('12:00')}
      />
    )
    expect(getByText(/First available day/).props.children.join('')).toContain('Saturday, 21 November')
    expect(getByLabelText(/As soon as possible/).props.accessibilityState.checked).toBe(false)
    expect(getByLabelText(/Saturday, 21 November/).props.accessibilityState.checked).toBe(false)
  })

  it('(d) opens on a scheduled moment: only that day is checked, ASAP is not, and its hour is checked', () => {
    ;(useOrder as jest.Mock).mockReturnValue([
      { loading: false, options: { type: 1, moment: '2026-11-19 13:00' } },
      {}
    ])
    const { getByLabelText, getAllByTestId, getByText } = renderWithProviders(
      <MomentOption
        navigation={{ canGoBack: () => true, goBack: jest.fn() }}
        datesList={[WED, THU, FRI]}
        dateSelected={THU}
        timeSelected='13:00'
        hoursList={hoursOf('12:00', '13:00')}
      />
    )
    expect(getByLabelText(/As soon as possible/).props.accessibilityState.checked).toBe(false)
    expect(getByLabelText(/Thursday, 19 November/).props.accessibilityState.checked).toBe(true)
    expect(getByLabelText(/Wednesday, 18 November/).props.accessibilityState.checked).toBe(false)
    const selectedHour = getAllByTestId('time-list-item').find((item) => item.findByType(require('react-native').Text).props.children === '13:00')
    expect(selectedHour?.props.accessibilityState.checked).toBe(true)
    expect(getByText('13:00')).toBeTruthy()
  })

  it('(e) picking a day turns ASAP off and shows its hours; picking ASAP again turns it back on', () => {
    const handleChangeDate = jest.fn()
    const { getByLabelText, queryAllByTestId } = renderWithProviders(
      <MomentOption
        navigation={{ canGoBack: () => true, goBack: jest.fn() }}
        datesList={[WED, THU, FRI]}
        dateSelected={WED}
        hoursList={hoursOf('12:00', '13:00')}
        handleChangeDate={handleChangeDate}
      />
    )
    expect(queryAllByTestId('time-list-item').length).toBe(0)

    fireEvent.press(getByLabelText(/Thursday, 19 November/))
    expect(handleChangeDate).toHaveBeenCalledWith(THU)
    expect(getByLabelText(/As soon as possible/).props.accessibilityState.checked).toBe(false)
    expect(queryAllByTestId('time-list-item').length).toBeGreaterThan(0)

    fireEvent.press(getByLabelText(/As soon as possible/))
    expect(getByLabelText(/As soon as possible/).props.accessibilityState.checked).toBe(true)
    expect(queryAllByTestId('time-list-item').length).toBe(0)
  })

  it('(f) a lapse crossing midnight keeps today open', () => {
    const business = { schedule: scheduleClosedOn([], [lapse([22, 0], [2, 0])]) }
    const { getByLabelText } = renderWithProviders(
      <MomentOption
        navigation={{ canGoBack: () => true, goBack: jest.fn() }}
        business={business}
        datesList={[WED, THU, FRI]}
        dateSelected={WED}
        hoursList={hoursOf('12:00')}
      />
    )
    const today = getByLabelText(/Wednesday, 18 November, Today/)
    expect(today.props.accessibilityState.disabled).toBe(false)
    expect(getByLabelText(/As soon as possible/).props.accessibilityState.disabled).toBe(false)
  })

  it('(g) a stored moment on a day that has closed since keeps that day checked', () => {
    ;(useOrder as jest.Mock).mockReturnValue([
      { loading: false, options: { type: 1, moment: '2026-11-19 13:00' } },
      {}
    ])
    const business = { schedule: scheduleClosedOn([4]) }
    const { getByLabelText } = renderWithProviders(
      <MomentOption
        navigation={{ canGoBack: () => true, goBack: jest.fn() }}
        business={business}
        datesList={[WED, THU, FRI]}
        dateSelected={THU}
        timeSelected='13:00'
        hoursList={hoursOf('13:00')}
      />
    )
    expect(getByLabelText(/Thursday, 19 November, Closed/).props.accessibilityState.checked).toBe(true)
    expect(screen.getByText('Not available hours for this day')).toBeTruthy()
  })
})
