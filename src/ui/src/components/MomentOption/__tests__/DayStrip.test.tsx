import moment from 'moment'
import { dayIsClosed, firstAvailableDate, fullDateLabel } from '../DayStrip'

// 0 = Sunday … 6 = Saturday, matching `business.schedule`'s index.
const lapse = (open: [number, number], close: [number, number]) => ({
  open: { hour: open[0], minute: open[1] },
  close: { hour: close[0], minute: close[1] }
})
const scheduleClosedOn = (closedDays: number[], everyDayLapse = [lapse([0, 0], [23, 59])]) =>
  Array.from({ length: 7 }, (_, day) => ({
    enabled: !closedDays.includes(day),
    lapses: closedDays.includes(day) ? [] : everyDayLapse
  }))

describe('dayIsClosed', () => {
  // Wednesday 2026-11-18
  const wednesday = '2026-11-18'
  const thursday = '2026-11-19'

  it('is never closed without a business or a schedule', () => {
    expect(dayIsClosed(wednesday, undefined, moment('2026-11-18T10:00'))).toBe(false)
    expect(dayIsClosed(wednesday, { schedule: null }, moment('2026-11-18T10:00'))).toBe(false)
  })

  it('is closed on a day the weekly schedule disables, at any time', () => {
    const business = { schedule: scheduleClosedOn([3]) } // Wednesday disabled
    expect(dayIsClosed(wednesday, business, moment('2026-11-18T08:00'))).toBe(true)
    expect(dayIsClosed(wednesday, business, moment('2026-11-18T23:00'))).toBe(true)
  })

  it('leaves a future day open even when today is closed', () => {
    const business = { schedule: scheduleClosedOn([3]) } // only Wednesday disabled
    expect(dayIsClosed(thursday, business, moment('2026-11-18T08:00'))).toBe(false)
  })

  it('closes today once every lapse already ended', () => {
    const business = { schedule: scheduleClosedOn([], [lapse([9, 0], [17, 0])]) }
    expect(dayIsClosed(wednesday, business, moment('2026-11-18T18:00'))).toBe(true)
    expect(dayIsClosed(wednesday, business, moment('2026-11-18T16:00'))).toBe(false)
  })

  it('never closes today for a lapse that crosses midnight (close <= open)', () => {
    const business = { schedule: scheduleClosedOn([], [lapse([22, 0], [2, 0])]) }
    expect(dayIsClosed(wednesday, business, moment('2026-11-18T23:50'))).toBe(false)
    expect(dayIsClosed(wednesday, business, moment('2026-11-18T08:00'))).toBe(false)
  })
})

describe('firstAvailableDate', () => {
  it('skips a run of closed days (weekday-based: Wed, Thu, Fri) and names the first open one', () => {
    const dates = ['2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22']
    const business = { schedule: scheduleClosedOn([3, 4, 5]) } // Wed, Thu, Fri
    expect(firstAvailableDate(dates, business, moment('2026-11-18T10:00'))).toBe('2026-11-21')
  })

  it('is null when every date is closed', () => {
    const dates = ['2026-11-18', '2026-11-19']
    const business = { schedule: scheduleClosedOn([0, 1, 2, 3, 4, 5, 6]) }
    expect(firstAvailableDate(dates, business, moment('2026-11-18T10:00'))).toBeNull()
  })
})

describe('fullDateLabel', () => {
  it('reads the weekday and day of month', () => {
    expect(fullDateLabel('2026-11-19')).toContain('19')
  })
})
