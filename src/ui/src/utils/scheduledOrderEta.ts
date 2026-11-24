import moment from 'moment'

type ConfigValue = { value?: string | number | boolean } | undefined
type Configs = Record<string, ConfigValue> | null | undefined

export const PREORDER_ETA_REQUESTED_TIME_ENABLED = 'preorder_eta_requested_time_enabled'

const PREORDER_STATUS = 13

export const isPreorderEtaRequestedTimeEnabled = (configs: Configs) => {
  const value = configs?.[PREORDER_ETA_REQUESTED_TIME_ENABLED]?.value
  return value === '1' || value === 1 || value === true
}

export const isScheduledOrder = (order: any) => {
  if (!order?.delivery_datetime_utc) return false
  if (parseInt(order?.status, 10) === PREORDER_STATUS) return true
  if (!order?.created_at) return false
  return moment.utc(order.delivery_datetime_utc).isAfter(moment.utc(order.created_at))
}

export const getOrderEtaUtc = (order: any, delivery: any, minutes: number, requestedTimeEnabled: boolean) => {
  const estimate = moment.utc(delivery).add(minutes, 'minutes')
  if (!requestedTimeEnabled || !isScheduledOrder(order)) return estimate
  const requested = moment.utc(order.delivery_datetime_utc)
  if (!order?.created_at) return requested
  const immediate = moment.utc(order.created_at).add(minutes, 'minutes')
  return immediate.isAfter(requested) ? immediate : requested
}
