import React from 'react'
import { Text } from 'react-native'
import moment from 'moment'
import { render } from '@testing-library/react-native'

const mockParseDate = jest.fn((date: string, options: any = {}) => `${options.outputFormat ?? 'GENERAL'}|${date}`)
const mockConfigState: { configs: any } = { configs: {} }
jest.mock('@components', () => ({
  useUtils: () => [{ parseDate: mockParseDate }],
  useConfig: () => [mockConfigState]
}))

import { OrderEta } from '../OrderEta'

const order = { delivery_datetime_utc: '2026-10-17 13:50:00', eta_time: 0, delivery_type: 2, status: 0 }

const enabled = { preorder_eta_requested_time_enabled: { value: '1' } }
const disabled = { preorder_eta_requested_time_enabled: { value: '0' } }

const immediate = { delivery_datetime_utc: '2026-11-19 10:00:00', created_at: '2026-11-19 10:00:30', eta_time: 40, delivery_type: 2, status: 0 }
const scheduledFar = { delivery_datetime_utc: '2026-11-19 14:00:00', created_at: '2026-11-19 10:00:00', eta_time: 40, delivery_type: 2, status: 0 }
const scheduledSoon = { delivery_datetime_utc: '2026-11-19 10:15:00', created_at: '2026-11-19 10:00:00', eta_time: 40, delivery_type: 2, status: 0 }

const estimate = (utc: string) => `GENERAL|${moment.utc(utc).local().format('YYYY-MM-DD HH:mm:ss')}`
const requested = (utc: string) => `GENERAL|${utc}`
const renderEta = (value: any) => render(<Text><OrderEta order={value} /></Text>)

describe('OrderEta', () => {
  beforeEach(() => {
    mockParseDate.mockClear()
    mockConfigState.configs = {}
  })

  it('formats through the project\'s date utility, with its whole format by default', () => {
    const { getByText } = render(<Text><OrderEta order={order} /></Text>)
    expect(getByText(/^GENERAL\|/)).toBeTruthy()
    expect(mockParseDate).toHaveBeenCalledWith(expect.any(String), { utc: false })
  })

  it('formats a part (the time, the date) through the same utility, never on its own', () => {
    const { getByText } = render(<Text><OrderEta order={order} outputFormat='hh:mma' /></Text>)
    expect(getByText(/^hh:mma\|/)).toBeTruthy()
    expect(mockParseDate).toHaveBeenCalledWith(expect.any(String), { utc: false, outputFormat: 'hh:mma' })
  })

  describe('with the requested time config off', () => {
    it('adds the estimate to the requested time of a scheduled order, as before', () => {
      mockConfigState.configs = disabled
      expect(renderEta(scheduledFar).getByText(estimate('2026-11-19 14:40:00'))).toBeTruthy()
      expect(renderEta(scheduledSoon).getByText(estimate('2026-11-19 10:55:00'))).toBeTruthy()
    })

    it('does the same when the config is missing', () => {
      expect(renderEta(scheduledFar).getByText(estimate('2026-11-19 14:40:00'))).toBeTruthy()
      mockConfigState.configs = undefined
      expect(renderEta(scheduledSoon).getByText(estimate('2026-11-19 10:55:00'))).toBeTruthy()
    })
  })

  describe('with the requested time config on', () => {
    beforeEach(() => {
      mockConfigState.configs = enabled
    })

    it('adds the estimate to the delivery time of an immediate order, as before', () => {
      expect(renderEta(immediate).getByText(estimate('2026-11-19 10:40:00'))).toBeTruthy()
    })

    it('shows the requested time of an order scheduled further than the estimate', () => {
      expect(renderEta(scheduledFar).getByText(estimate('2026-11-19 14:00:00'))).toBeTruthy()
    })

    it('shows the creation time plus the estimate when it falls after the requested time', () => {
      expect(renderEta(scheduledSoon).getByText(estimate('2026-11-19 10:40:00'))).toBeTruthy()
    })

    it('adds the same minutes it adds today, the drive time of a delivery included', () => {
      const delivery = { ...scheduledSoon, delivery_type: 1, eta_drive_time: 10, eta_time: 20 }
      expect(renderEta(delivery).getByText(estimate('2026-11-19 10:30:00'))).toBeTruthy()
      mockConfigState.configs = disabled
      expect(renderEta(delivery).getByText(estimate('2026-11-19 10:45:00'))).toBeTruthy()
    })

    it('follows the config when it changes on a shown order', () => {
      mockConfigState.configs = disabled
      const view = renderEta(scheduledFar)
      expect(view.getByText(estimate('2026-11-19 14:40:00'))).toBeTruthy()
      mockConfigState.configs = enabled
      view.rerender(<Text><OrderEta order={scheduledFar} /></Text>)
      expect(view.getByText(estimate('2026-11-19 14:00:00'))).toBeTruthy()
    })
  })

  describe('a preorder (status 13)', () => {
    it('shows its requested time with its creation time, config on or off', () => {
      const preorder = { ...scheduledSoon, status: 13 }
      mockConfigState.configs = enabled
      expect(renderEta(preorder).getByText(requested('2026-11-19 10:15:00'))).toBeTruthy()
      mockConfigState.configs = disabled
      expect(renderEta(preorder).getByText(requested('2026-11-19 10:15:00'))).toBeTruthy()
      expect(mockParseDate).toHaveBeenCalledWith('2026-11-19 10:15:00', { utc: true, outputFormat: undefined })
    })

    it('shows its requested time without its creation time, config on or off', () => {
      const preorder = { delivery_datetime_utc: '2026-11-19 14:00:00', eta_time: 40, delivery_type: 2, status: 13 }
      mockConfigState.configs = enabled
      expect(renderEta(preorder).getByText(requested('2026-11-19 14:00:00'))).toBeTruthy()
      mockConfigState.configs = disabled
      expect(renderEta(preorder).getByText(requested('2026-11-19 14:00:00'))).toBeTruthy()
    })
  })
})
