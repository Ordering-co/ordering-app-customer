import '../../../../../../jest/helpers/registerM9NativeMocks'

import React from 'react'
import { Text } from 'react-native'

import { AppEventsLogger } from 'react-native-fbsdk-next'

import { FacebookPixel } from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'
import { setNativeFeatures } from '../../../../../utils/nativeKeys'
import { eventFns } from '../../../../../../jest/helpers/m9IntegrationsComponentsMock'

jest.mock('@components', () => require('../../../../../../jest/helpers/m9IntegrationsComponentsMock').getMock())

describe('FacebookPixel', () => {
  beforeEach(() => jest.clearAllMocks())
  afterEach(() => setNativeFeatures(undefined))

  const handlerOf = (name: string) =>
    (eventFns.on as jest.Mock).mock.calls.find(([event]) => event === name)?.[1]

  it('logs the app\'s events to Facebook', () => {
    setNativeFeatures({ facebook: true })
    renderWithProviders(<FacebookPixel />)

    handlerOf('product_added')({ id: 5, name: 'Pizza', price: 12, quantity: 1 })
    expect(AppEventsLogger.logEvent).toHaveBeenCalledTimes(1)
    handlerOf('order_placed')({ id: 9, total: 30 })
    expect(AppEventsLogger.logPurchase).toHaveBeenCalledWith(30, 'USD', { param: 'value', id: 9 })
  })

  it('listens to nothing and never calls the SDK without Facebook\'s keys', () => {
    setNativeFeatures({ facebook: false })
    const { getByText } = renderWithProviders(
      <FacebookPixel>
        <Text>Marketplace</Text>
      </FacebookPixel>
    )

    expect(getByText('Marketplace')).toBeTruthy()
    expect(eventFns.on).not.toHaveBeenCalled()
    expect(AppEventsLogger.logEvent).not.toHaveBeenCalled()
  })

  it('renders children', () => {
    const { getByText } = renderWithProviders(
      <FacebookPixel>
        <Text>Marketplace</Text>
      </FacebookPixel>
    )
    expect(getByText('Marketplace')).toBeTruthy()
  })
})
