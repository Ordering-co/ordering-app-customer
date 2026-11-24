/**
 * A calendar date (a birthday: a day, in no time zone) as a `Date` of the
 * device's own day. `new Date('1990-05-12')` is midnight UTC, the 11th in the
 * evening anywhere in America: the picker opened a day before, and saving
 * without touching it moved the birthday back a day.
 */
const DAY = /^(\d{4})-(\d{1,2})-(\d{1,2})/

export const calendarDate = (value?: Date | string | number | null): Date => {
  if (value instanceof Date) return new Date(value.getTime())
  if (typeof value === 'string') {
    const [, year, month, day] = DAY.exec(value.trim()) ?? []
    if (year) return new Date(Number(year), Number(month) - 1, Number(day))
  }
  const parsed = value === null || value === undefined || value === '' ? new Date() : new Date(value)
  return isNaN(parsed.getTime()) ? new Date() : parsed
}
