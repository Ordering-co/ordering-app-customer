import React from 'react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { fireEvent } from '@testing-library/react-native'
import { StackActions } from '@react-navigation/native'

dayjs.extend(utc)
dayjs.extend(timezone)

import { useConfig, useOrder } from '@components'
import { renderPage } from '../../../jest/helpers/renderPage'

jest.mock('@ui', () => require('../../../jest/helpers/mockUi'))

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native')
  return {
    ...actual,
    StackActions: {
      replace: jest.fn((name: string, params: unknown) => ({
        type: 'REPLACE',
        payload: { name, params }
      }))
    }
  }
})


import MomentOption from '../MomentOption'


beforeEach(() => {
    jest.clearAllMocks()
    ;(useOrder as jest.Mock).mockReturnValue([
      { options: { type: 1 } },
      {}
    ])
    ;(useConfig as jest.Mock).mockReturnValue([{
      configs: {
        max_days_preorder: { key: 'max_days_preorder', value: '3' },
        preorder_slot_interval: { key: 'preorder_slot_interval', value: 'catering_delivery,30|catering_pickup,45' },
        preorder_lead_time: { key: 'preorder_lead_time', value: 'catering_delivery,60|catering_pickup,90' },
        preorder_time_range: { key: 'preorder_time_range', value: 'catering_delivery,120|catering_pickup,180' },
        preorder_maximum_days: { key: 'preorder_maximum_days', value: 'catering_delivery,5|catering_pickup,7' },
        preorder_minimum_days: { key: 'preorder_minimum_days', value: 'catering_delivery,1|catering_pickup,2' }
      }
    }])
  })

describe('MomentOption', () => {
  it('renders delivery time with catering preorder config', () => {
        ;(useOrder as jest.Mock).mockReturnValue([
          { options: { type: 7 } },
          {}
        ])
        const { getByTestId } = renderPage(MomentOption, {
          route: { params: { business: { id: 5 }, afterPreorder: 'back' } }
        })
        expect(getByTestId('navbar-title').props.children).toBe('Delivery time')
        expect(getByTestId('moment-option-controller')).toBeTruthy()
      })
  
      it('after a listing\'s pre-order, opens the store in its place', () => {
        const { getByTestId, navigation } = renderPage(MomentOption, {
          route: { params: { business: { slug: 'pizza', header: 'h', logo: 'l' }, afterPreorder: 'business' } }
        })
        expect(getByTestId('moment-is-preorder').props.children).toBe('true')
        fireEvent.press(getByTestId('moment-business-click'))
        expect(StackActions.replace).toHaveBeenCalledWith('Business', { store: 'pizza', header: 'h', logo: 'l' })
        expect(navigation.dispatch).toHaveBeenCalled()
      })

      it('after a store\'s pre-order, goes back to it; without one, it is not a pre-order', () => {
        const { getByTestId, navigation } = renderPage(MomentOption, {
          route: { params: { business: { slug: 'pizza' }, afterPreorder: 'back' } }
        })
        fireEvent.press(getByTestId('moment-business-click'))
        expect(navigation.goBack).toHaveBeenCalled()
        const plain = renderPage(MomentOption)
        expect(plain.getAllByTestId('moment-is-preorder').pop()?.props.children).toBe('false')
      })

      it('goes back from moment option', () => {
        const { getByTestId, navigation } = renderPage(MomentOption)
        fireEvent.press(getByTestId('moment-go-back'))
        expect(navigation.goBack).toHaveBeenCalled()
      })
  
      it('caps the last preorder day at end of day in the business timezone', () => {
        const { getByTestId } = renderPage(MomentOption, {
          route: { params: { business: { id: 5, timezone: 'America/New_York' } } }
        })
        const { maxDate } = getByTestId('moment-option-controller').props
        expect(dayjs(maxDate).tz('America/New_York').format('HH:mm')).toBe('23:59')
      })

      it('falls back to the device end of day when the business has no timezone', () => {
        const { getByTestId } = renderPage(MomentOption, {
          route: { params: { business: { id: 5 } } }
        })
        const { maxDate } = getByTestId('moment-option-controller').props
        expect(dayjs(maxDate).format('HH:mm')).toBe('23:59')
      })

      it('computes limits for catering pickup type', () => {
        ;(useOrder as jest.Mock).mockReturnValue([
          { options: { type: 8 } },
          {}
        ])
        const { getByTestId } = renderPage(MomentOption)
        expect(getByTestId('moment-option-controller')).toBeTruthy()
      })
})

