// Business opening hours and the header's "Closed" status, read in the
// business's own timezone. Ported (minimum needed) from the web's
// src/utils/businessTime.js (businessToday, businessCalendarDate,
// businessWallClock, nextOpening, closedStatusLabel — implementation notes).
// Reuses this app's own Hermes-safe dayjs.tz patch instead of the
// submodule's getValidTimezone/parseBusinessDateTime.
import dayjs from 'dayjs';
import '@/utils/dayjsTimezone';

type NowInput = string | number | Date | undefined;

export type BusinessLapseTime = { hour?: number; minute?: number };
export type BusinessLapse = { open?: BusinessLapseTime; close?: BusinessLapseTime };
export type BusinessDay = { enabled?: boolean; lapses?: BusinessLapse[] };

const pad = (value: number) => String(value).padStart(2, '0');

/** A calendar date (YYYY-MM-DD) as that day in the business's zone. */
export const businessCalendarDate = (dateStr: string, timezone?: string) => dayjs.tz(dateStr, timezone);

// Without a timezone, dayjs.tz falls back to the device's zone (as MomentOption does); an invalid one throws and nextOpening reads it as no opening.
/** Today's date (YYYY-MM-DD) in the business's zone, at `now` (default: now). */
export const businessToday = (timezone?: string, now?: NowInput) =>
  (now === undefined ? dayjs() : dayjs(now)).tz(timezone).format('YYYY-MM-DD');

/** The instant of a wall-clock time ({ hour, minute }) on a date of the business's zone. */
export const businessWallClock = (dateStr: string, time: BusinessLapseTime | undefined, timezone?: string) =>
  dayjs.tz(`${dateStr} ${pad(time?.hour ?? 0)}:${pad(time?.minute ?? 0)}`, 'YYYY-MM-DD HH:mm', timezone);

/**
 * The next instant (a dayjs in the business's own zone) its weekly `schedule`
 * (index 0-6 Sun-Sat, each `{ enabled, lapses: [{ open: { hour, minute }, close }] }`)
 * opens, strictly after `now` (default: now). Scans today through the next 6
 * days; a lapse already open (its open instant in the past, e.g. a midnight
 * crossing one) is not a candidate. `dayOffset` is how far that is from
 * today (0 today, 1 tomorrow, 2+ a later day). `null` without a schedule or
 * nothing opens in the next week.
 * Defensive: a malformed schedule (or date math in an odd environment)
 * never throws into the header it feeds — it just reads as "no next opening".
 */
export const nextOpening = (
  schedule: BusinessDay[] | null | undefined,
  timezone?: string,
  now?: NowInput
): { instant: dayjs.Dayjs; dayOffset: number } | null => {
  if (!Array.isArray(schedule)) return null;
  try {
    const nowMs = (now === undefined ? dayjs() : dayjs(now)).valueOf();
    const today = businessToday(timezone, now);
    for (let offset = 0; offset < 7; offset++) {
      const date = dayjs.utc(today).add(offset, 'day').format('YYYY-MM-DD');
      const day = businessCalendarDate(date, timezone).day();
      const businessDay = schedule[day];
      if (!businessDay?.enabled) continue;
      const lapses = [...(businessDay.lapses || [])].sort(
        (a, b) =>
          (a?.open?.hour ?? 0) * 60 + (a?.open?.minute ?? 0) - ((b?.open?.hour ?? 0) * 60 + (b?.open?.minute ?? 0))
      );
      for (const lapse of lapses) {
        const open = businessWallClock(date, lapse?.open, timezone);
        if (open.valueOf() > nowMs) return { instant: open, dayOffset: offset };
      }
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * The header's closed status: "Closed" alone, or with the next opening, in
 * the business's own zone and clock format (`is12Hours`) — "Opens 11:00"
 * today, "Opens tomorrow 11:00", or "Opens Monday 11:00" a later day. Plain
 * "Closed" without a schedule or a next opening in the coming week.
 */
export const closedStatusLabel = (
  business: { schedule?: BusinessDay[]; timezone?: string } | null | undefined,
  t: (key: string, fallback: string) => string,
  { is12Hours, now }: { is12Hours?: boolean; now?: NowInput } = {}
): string => {
  const closed = t('CLOSED', 'Closed');
  const opening = nextOpening(business?.schedule, business?.timezone, now);
  if (!opening) return closed;
  const time = opening.instant.format(is12Hours ? 'hh:mm A' : 'HH:mm');
  const opensText =
    opening.dayOffset === 0
      ? t('OPENS_AT', 'Opens _time_').replace('_time_', time)
      : opening.dayOffset === 1
        ? t('OPENS_TOMORROW_AT', 'Opens tomorrow _time_').replace('_time_', time)
        : t('OPENS_DAY_AT', 'Opens _day_ _time_')
          // The weekday through the app's own day keys (FRIDAY…): dayjs's locale stays 'en'.
          .replace('_day_', t(opening.instant.format('dddd').toUpperCase(), opening.instant.format('dddd')))
          .replace('_time_', time);
  return `${closed} · ${opensText}`;
};
