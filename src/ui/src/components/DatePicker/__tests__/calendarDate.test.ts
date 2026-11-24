import { calendarDate } from '../calendarDate'

const parts = (date: Date) => [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours()]

describe('calendarDate', () => {
  it('reads a saved day as the device\'s own day, whatever the time zone', () => {
    expect(parts(calendarDate('1990-05-12'))).toEqual([1990, 5, 12, 0])
    expect(parts(calendarDate('1990-05-12 00:00:00'))).toEqual([1990, 5, 12, 0])
    expect(parts(calendarDate('1990-05-12T00:00:00.000000Z'))).toEqual([1990, 5, 12, 0])
    expect(parts(calendarDate('1990-5-2'))).toEqual([1990, 5, 2, 0])
  })

  it('keeps a Date as it is, in a copy', () => {
    const date = new Date(1990, 4, 12, 15)
    expect(calendarDate(date)).toEqual(date)
    expect(calendarDate(date)).not.toBe(date)
  })

  it('is today for no date or one nobody reads', () => {
    const today = new Date()
    for (const value of [null, undefined, '', 'not a date']) {
      expect(parts(calendarDate(value)).slice(0, 3)).toEqual(parts(today).slice(0, 3))
    }
  })
})
