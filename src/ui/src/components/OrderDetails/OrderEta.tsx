import React, { useEffect, useState } from 'react'
import moment from 'moment'
import { useConfig, useUtils } from '@components'
import { getOrderEtaUtc, isPreorderEtaRequestedTimeEnabled } from '../../utils/scheduledOrderEta'

export const OrderEta = (props: any) => {
  const {
    order,
    outputFormat
  } = props

  const [{ parseDate }] = useUtils()
  const [{ configs }] = useConfig()
  const requestedTimeEnabled = isPreorderEtaRequestedTimeEnabled(configs)
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState(null)
  const deliveryTypes = [1, 7]

  const getEstimatedDeliveryTime = () => {
    let estimatedUtcTime = null
    let totalEta = 0
    if (order?.delivered_in) totalEta += order?.delivered_in
    if (order?.prepared_in) totalEta += order?.prepared_in
    if (deliveryTypes?.includes?.(order?.delivery_type) && order?.eta_drive_time) {
      totalEta += order?.eta_drive_time
    }

    const _delivery = order?.delivery_datetime_utc
      ? order?.delivery_datetime_utc
      : order?.delivery_datetime

    if (order?.eta_current_status_time) {
      const currentStatueEta = order?.eta_current_status_time
      totalEta += currentStatueEta
      let previousStatusTimes = 0
      if (order?.eta_previous_status_times) {
        Object.keys(order.eta_previous_status_times).map(key => {
          if (!key.includes('status_penalty')) {
            previousStatusTimes += order.eta_previous_status_times[key]
          }
        })
      }
      totalEta += previousStatusTimes

      let nextStatusTimes = 0
      if (order?.eta_next_status_times) {
        Object.keys(order.eta_next_status_times).map(key => {
          if (!key.includes('status_penalty')) {
            nextStatusTimes += order.eta_next_status_times[key]
          }
        })
      }
      totalEta += nextStatusTimes

      const diffTimeAsSeconds = moment.utc(order?.reporting_data?.at[`status:${order.status}`]).add(order?.eta_current_status_time, 'minutes').diff(moment().utc(), 'seconds')
      const diffTimeAsMinutes = Math.ceil(diffTimeAsSeconds / 60)
      if (diffTimeAsMinutes <= 0) {
        totalEta += (Math.floor(Math.abs(diffTimeAsMinutes / order?.eta_current_status_time) + 1) * order?.eta_current_status_penalty_time)
      }
    } else {
      totalEta = order?.eta_time + totalEta
    }
    estimatedUtcTime = getOrderEtaUtc(order, _delivery, totalEta, requestedTimeEnabled)
    // Always through the project's date utility (its locale and meridiem), with the
    // project's whole format or the part asked for: the same date reads the same on
    // the order cards, the home card and the order's details.
    const _estimatedTime = parseDate(moment(estimatedUtcTime).local().format('YYYY-MM-DD HH:mm:ss'), { utc: false, ...(outputFormat ? { outputFormat } : {}) })
    setEstimatedDeliveryTime(order?.status === 13 ? parseDate(_delivery, { utc: !!order?.delivery_datetime_utc, outputFormat: outputFormat }) : _estimatedTime)
  }

  useEffect(() => {
    getEstimatedDeliveryTime()
    const interval = setInterval(() => {
      getEstimatedDeliveryTime()
    }, 1000)
    return () => clearInterval(interval)
  }, [order, outputFormat, requestedTimeEnabled])

  return (
    <>
      {estimatedDeliveryTime}
    </>
  )
}
