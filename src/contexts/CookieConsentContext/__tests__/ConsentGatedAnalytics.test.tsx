import React from 'react'
import { render } from '@testing-library/react-native'

import { ConsentGatedAnalytics } from '../ConsentGatedAnalytics'
import { useCookieConsent } from '../index'
import { setNativeFeatures } from '../../../utils/nativeKeys'

jest.mock('@ui', () => {
  const ReactMock = require('react')
  const { View } = require('react-native')
  return {
    AnalyticsSegment: () => ReactMock.createElement(View, { testID: 'segment' }),
    FacebookPixel: () => ReactMock.createElement(View, { testID: 'facebook-pixel' })
  }
})

jest.mock('../index', () => ({
  useCookieConsent: jest.fn()
}))

const consent = (hasConsented: boolean) =>
  (useCookieConsent as jest.Mock).mockReturnValue({ hasConsented })

describe('ConsentGatedAnalytics', () => {
  afterEach(() => setNativeFeatures(undefined))

  it('mounts nothing without the consent', () => {
    consent(false)
    setNativeFeatures({ facebook: true })
    const { queryByTestId } = render(<ConsentGatedAnalytics />)

    expect(queryByTestId('segment')).toBeNull()
    expect(queryByTestId('facebook-pixel')).toBeNull()
  })

  it('mounts Segment and Facebook\'s events with the consent and Facebook\'s keys', () => {
    consent(true)
    setNativeFeatures({ facebook: true })
    const { getByTestId } = render(<ConsentGatedAnalytics />)

    expect(getByTestId('segment')).toBeTruthy()
    expect(getByTestId('facebook-pixel')).toBeTruthy()
  })

  it('does not mount Facebook\'s events without Facebook\'s keys, consent or not', () => {
    consent(true)
    setNativeFeatures({ facebook: false })
    const { getByTestId, queryByTestId } = render(<ConsentGatedAnalytics />)

    expect(getByTestId('segment')).toBeTruthy()
    expect(queryByTestId('facebook-pixel')).toBeNull()
  })

  it('mounts Facebook\'s events when the native side said nothing (as before)', () => {
    consent(true)
    const { getByTestId } = render(<ConsentGatedAnalytics />)

    expect(getByTestId('facebook-pixel')).toBeTruthy()
  })
})
