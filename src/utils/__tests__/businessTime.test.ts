import { closedStatusLabel, nextOpening } from '../businessTime'

// jest.config.js fixes the device/"user" zone to Europe/Madrid — distinct
// from the business zones below, so every assertion here is already a
// cross-zone check: the business's own date and clock, not the device's.
const NY = 'America/New_York'

const lapse = (open: [number, number], close: [number, number]) => ({
  open: { hour: open[0], minute: open[1] },
  close: { hour: close[0], minute: close[1] }
})

const onlyDay = (day: number, open: [number, number], close: [number, number]) =>
  Array.from({ length: 7 }, (_, i) => ({
    enabled: i === day,
    lapses: i === day ? [lapse(open, close)] : []
  }))

describe('nextOpening: the next time a business opens', () => {
  // Tuesday 2026-10-20 08:00 in New York (EDT, before the fall-back on Nov 1)
  const NOW = '2026-10-20T12:00:00Z'

  it('later today: the earliest lapse of today not yet open', () => {
    const opening = nextOpening(onlyDay(2, [9, 0], [17, 0]), NY, NOW)
    expect(opening?.dayOffset).toBe(0)
    expect(opening?.instant.toISOString()).toBe('2026-10-20T13:00:00.000Z')
  })

  it("tomorrow: today's lapse already closed", () => {
    const schedule = onlyDay(2, [9, 0], [17, 0])
    schedule[3] = { enabled: true, lapses: [lapse([9, 0], [17, 0])] }
    // Tuesday 18:00 EDT: after the 09:00-17:00 lapse closed
    const opening = nextOpening(schedule, NY, '2026-10-20T22:00:00Z')
    expect(opening?.dayOffset).toBe(1)
    expect(opening?.instant.toISOString()).toBe('2026-10-21T13:00:00.000Z')
  })

  it('several days later: the only enabled weekday is days away', () => {
    const opening = nextOpening(onlyDay(5, [9, 0], [17, 0]), NY, NOW)
    expect(opening?.dayOffset).toBe(3)
    expect(opening?.instant.toISOString()).toBe('2026-10-23T13:00:00.000Z')
  })

  it('a lapse crossing midnight (00:00-01:45): an already-open early lapse is not a candidate, the evening one is', () => {
    const schedule = onlyDay(2, [0, 0], [1, 45])
    schedule[2].lapses.push(lapse([22, 0], [2, 0]))
    // 10:00 EDT: both lapses of today are done opening (the early one closed, the evening one hasn't)
    const laterToday = nextOpening(schedule, NY, '2026-10-20T14:00:00Z')
    expect(laterToday?.dayOffset).toBe(0)
    expect(laterToday?.instant.toISOString()).toBe('2026-10-21T02:00:00.000Z')
    // 00:30 EDT: inside the early lapse already (its open is in the past) — same evening lapse next
    const insideEarlyLapse = nextOpening(schedule, NY, '2026-10-20T04:30:00Z')
    expect(insideEarlyLapse?.dayOffset).toBe(0)
    expect(insideEarlyLapse?.instant.toISOString()).toBe('2026-10-21T02:00:00.000Z')
  })

  it('a day change by zone: the business is already on a later date than the device (Madrid)', () => {
    // Tuesday 2026-10-20 22:00 EDT in New York = Wednesday 2026-10-21 02:00 CEST in Madrid
    const schedule = onlyDay(2, [9, 0], [17, 0])
    schedule[3] = { enabled: true, lapses: [lapse([9, 0], [17, 0])] }
    const opening = nextOpening(schedule, NY, '2026-10-21T02:00:00Z')
    // Business-side "today" is still Tuesday (closed), so the next opening is Wednesday — not "today" as it would be read from Madrid's calendar.
    expect(opening?.dayOffset).toBe(1)
    expect(opening?.instant.toISOString()).toBe('2026-10-21T13:00:00.000Z')
  })

  it('DST: the US spring-forward day keeps the 09:00 wall clock', () => {
    const schedule = Array.from({ length: 7 }, () => ({ enabled: true, lapses: [lapse([9, 0], [22, 0])] }))
    // Saturday 2026-03-07 15:00 EST: inside Saturday's lapse already
    const opening = nextOpening(schedule, NY, '2026-03-07T20:00:00Z')
    expect(opening?.dayOffset).toBe(1)
    expect(opening?.instant.toISOString()).toBe('2026-03-08T13:00:00.000Z')
  })

  it('DST: the US fall-back day keeps the 09:00 wall clock', () => {
    const schedule = Array.from({ length: 7 }, () => ({ enabled: true, lapses: [lapse([9, 0], [22, 0])] }))
    // Saturday 2026-10-31 16:00 EDT: inside Saturday's lapse already
    const opening = nextOpening(schedule, NY, '2026-10-31T20:00:00Z')
    expect(opening?.dayOffset).toBe(1)
    expect(opening?.instant.toISOString()).toBe('2026-11-01T14:00:00.000Z')
  })

  it('no schedule, an empty one, nothing enabled, or a malformed one: null', () => {
    expect(nextOpening(undefined, NY, NOW)).toBeNull()
    expect(nextOpening(null, NY, NOW)).toBeNull()
    expect(nextOpening([], NY, NOW)).toBeNull()
    expect(nextOpening('not-an-array' as any, NY, NOW)).toBeNull()
    expect(nextOpening(Array.from({ length: 7 }, () => ({ enabled: false, lapses: [] })), NY, NOW)).toBeNull()
    // enabled with no lapses, or lapses with missing hour/minute: no crash, no opening found this week
    expect(nextOpening([{ enabled: true }, {}, {}, {}, {}, {}, {}] as any, NY, NOW)).toBeNull()
  })
})

describe('closedStatusLabel: the header\'s "Closed" text', () => {
  const NOW = '2026-10-20T12:00:00Z' // Tuesday 08:00 in New York
  const t = (_key: string, fallback: string) => fallback

  it('plain "Closed" without a schedule', () => {
    expect(closedStatusLabel({}, t, { now: NOW })).toBe('Closed')
  })

  it('"Closed · Opens <time>" for later today, in 24h and 12h', () => {
    const business = { schedule: onlyDay(2, [9, 0], [17, 0]), timezone: NY }
    expect(closedStatusLabel(business, t, { now: NOW })).toBe('Closed · Opens 09:00')
    expect(closedStatusLabel(business, t, { now: NOW, is12Hours: true })).toBe('Closed · Opens 09:00 AM')
  })

  it('"Closed · Opens tomorrow <time>" when today already closed', () => {
    const schedule = onlyDay(2, [9, 0], [17, 0])
    schedule[3] = { enabled: true, lapses: [lapse([9, 0], [17, 0])] }
    const business = { schedule, timezone: NY }
    expect(closedStatusLabel(business, t, { now: '2026-10-20T22:00:00Z' })).toBe('Closed · Opens tomorrow 09:00')
  })

  it('"Closed · Opens <Day> <time>" for a later day', () => {
    const business = { schedule: onlyDay(5, [9, 0], [17, 0]), timezone: NY }
    expect(closedStatusLabel(business, t, { now: NOW })).toBe('Closed · Opens Friday 09:00')
  })

  it('reads the keys and placeholders a translator would need to localize', () => {
    const spy = jest.fn((_key: string, fallback: string) => fallback)
    const business = { schedule: onlyDay(2, [9, 0], [17, 0]), timezone: NY }
    closedStatusLabel(business, spy, { now: NOW })
    expect(spy).toHaveBeenCalledWith('CLOSED', 'Closed')
    expect(spy).toHaveBeenCalledWith('OPENS_AT', 'Opens _time_')
  })
})
