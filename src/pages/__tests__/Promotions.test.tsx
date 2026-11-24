import React from 'react'
import { fireEvent } from '@testing-library/react-native'
import { Platform } from 'react-native'
import { StackActions } from '@react-navigation/native'

import { useApi, useBusiness } from '@components'
import { renderPage } from '../../../jest/helpers/renderPage'

const mockSettings: any = {}
jest.mock('../../config', () => ({ __esModule: true, get default() { return mockSettings } }))

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


import Promotions from '../Promotions'


beforeEach(() => {
    jest.clearAllMocks()
    ;(useBusiness as jest.Mock).mockReturnValue([{ business: { id: 42 } }, {}])
    ;(useApi as jest.Mock).mockReturnValue([{ ordering: 'mock-ordering' }, {}])
    Platform.OS = 'ios'
  })

describe('Promotions', () => {
  it('renders offers screen', () => {
        const { getByTestId } = renderPage(Promotions)
        expect(getByTestId('navbar-title').props.children).toBe('Offers')
        expect(getByTestId('promotions-controller')).toBeTruthy()
      })

  describe('the business the offers are filtered by', () => {
    afterEach(() => {
      delete mockSettings.businessSlug
      delete mockSettings.franchiseSlug
    })

    it('is the configured business in a single business app', () => {
      mockSettings.businessSlug = 1
      const { getByTestId } = renderPage(Promotions)
      expect(getByTestId('promotions-controller').props.businessSlug).toBe(1)
    })

    it('is none in a marketplace, where the franchise filter stays as it was', () => {
      mockSettings.businessSlug = null
      mockSettings.franchiseSlug = 'brand'
      const { getByTestId } = renderPage(Promotions)
      expect(getByTestId('promotions-controller').props.businessSlug).toBeUndefined()
      expect(getByTestId('promotions-controller').props.franchiseId).toBe('brand')
    })
  })
})

