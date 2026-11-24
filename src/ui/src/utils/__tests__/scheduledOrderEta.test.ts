import {
  getOrderEtaUtc,
  isPreorderEtaRequestedTimeEnabled,
  isScheduledOrder
} from '../scheduledOrderEta'

const FORMAT = 'YYYY-MM-DD HH:mm:ss'

const immediate = { status: 0, created_at: '2026-11-19 10:00:30', delivery_datetime_utc: '2026-11-19 10:00:00' }
const scheduledFar = { status: 0, created_at: '2026-11-19 10:00:00', delivery_datetime_utc: '2026-11-19 14:00:00' }
const scheduledSoon = { status: 0, created_at: '2026-11-19 10:00:00', delivery_datetime_utc: '2026-11-19 10:15:00' }

const eta = (order: any, minutes: number, enabled: boolean) =>
  getOrderEtaUtc(order, order.delivery_datetime_utc, minutes, enabled).format(FORMAT)

describe('isPreorderEtaRequestedTimeEnabled', () => {
  it('is on only for 1, \'1\' and true', () => {
    expect(isPreorderEtaRequestedTimeEnabled(undefined)).toBe(false)
    expect(isPreorderEtaRequestedTimeEnabled(null)).toBe(false)
    expect(isPreorderEtaRequestedTimeEnabled({})).toBe(false)
    expect(isPreorderEtaRequestedTimeEnabled({ preorder_eta_requested_time_enabled: undefined })).toBe(false)
    expect(isPreorderEtaRequestedTimeEnabled({ preorder_eta_requested_time_enabled: { value: '0' } })).toBe(false)
    expect(isPreorderEtaRequestedTimeEnabled({ preorder_eta_requested_time_enabled: { value: '' } })).toBe(false)
    expect(isPreorderEtaRequestedTimeEnabled({ preorder_eta_requested_time_enabled: { value: '1' } })).toBe(true)
    expect(isPreorderEtaRequestedTimeEnabled({ preorder_eta_requested_time_enabled: { value: 1 } })).toBe(true)
    expect(isPreorderEtaRequestedTimeEnabled({ preorder_eta_requested_time_enabled: { value: true } })).toBe(true)
    expect(isPreorderEtaRequestedTimeEnabled({ preorder_status_enabled: { value: '1' } })).toBe(false)
  })
})

describe('isScheduledOrder', () => {
  it('needs the requested time', () => {
    expect(isScheduledOrder(undefined)).toBe(false)
    expect(isScheduledOrder({ status: 13, created_at: '2026-11-19 10:00:00' })).toBe(false)
  })

  it('takes a preorder (status 13) as scheduled, with or without its creation time', () => {
    expect(isScheduledOrder({ status: 13, delivery_datetime_utc: '2026-11-19 14:00:00' })).toBe(true)
    expect(isScheduledOrder({ status: '13', delivery_datetime_utc: '2026-11-19 14:00:00' })).toBe(true)
    expect(isScheduledOrder({ status: 13, created_at: '2026-11-19 14:00:00', delivery_datetime_utc: '2026-11-19 14:00:00' })).toBe(true)
  })

  it('takes an order requested after its creation as scheduled', () => {
    expect(isScheduledOrder(scheduledFar)).toBe(true)
    expect(isScheduledOrder(scheduledSoon)).toBe(true)
    expect(isScheduledOrder({ ...scheduledFar, status: 7 })).toBe(true)
  })

  it('takes an order requested at or a few seconds before its creation as immediate', () => {
    expect(isScheduledOrder(immediate)).toBe(false)
    expect(isScheduledOrder({ status: 0, created_at: '2026-11-19 10:00:00', delivery_datetime_utc: '2026-11-19 10:00:00' })).toBe(false)
    expect(isScheduledOrder({ status: 0, delivery_datetime_utc: '2026-11-19 14:00:00' })).toBe(false)
  })
})

describe('getOrderEtaUtc', () => {
  it('adds the minutes to the delivery time when the config is off, scheduled or not', () => {
    expect(eta(immediate, 40, false)).toBe('2026-11-19 10:40:00')
    expect(eta(scheduledFar, 40, false)).toBe('2026-11-19 14:40:00')
    expect(eta(scheduledSoon, 40, false)).toBe('2026-11-19 10:55:00')
    expect(eta({ ...scheduledFar, status: 13 }, 40, false)).toBe('2026-11-19 14:40:00')
  })

  it('adds the minutes to the delivery time of an immediate order when the config is on', () => {
    expect(eta(immediate, 40, true)).toBe('2026-11-19 10:40:00')
  })

  it('keeps the delivery time used today for an order without a UTC requested time', () => {
    const order = { status: 0, created_at: '2026-11-19 10:00:00', delivery_datetime: '2026-11-19 14:00:00' }
    expect(getOrderEtaUtc(order, order.delivery_datetime, 40, true).format(FORMAT)).toBe('2026-11-19 14:40:00')
  })

  it('shows the requested time of an order scheduled further than the estimate', () => {
    expect(eta(scheduledFar, 40, true)).toBe('2026-11-19 14:00:00')
  })

  it('shows the creation time plus the estimate when it falls after the requested time', () => {
    expect(eta(scheduledSoon, 40, true)).toBe('2026-11-19 10:40:00')
  })

  it('shows the requested time of a preorder without its creation time', () => {
    expect(eta({ status: 13, delivery_datetime_utc: '2026-11-19 14:00:00' }, 40, true)).toBe('2026-11-19 14:00:00')
  })

  it('takes the later of the requested time and the creation time plus the estimate for a preorder', () => {
    expect(eta({ ...scheduledFar, status: 13 }, 40, true)).toBe('2026-11-19 14:00:00')
    expect(eta({ ...scheduledSoon, status: 13 }, 40, true)).toBe('2026-11-19 10:40:00')
  })

  it('keeps the requested time when the minutes are missing', () => {
    expect(eta(scheduledFar, NaN, true)).toBe('2026-11-19 14:00:00')
  })
})
