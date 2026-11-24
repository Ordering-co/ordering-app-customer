import React from 'react'
import { act, fireEvent } from '@testing-library/react-native'
import { BackHandler, Dimensions, Platform } from 'react-native'
import RNRestart from 'react-native-restart'
import Intercom from '@intercom/intercom-react-native'

import { useConfig, useSession } from '@components'
import { _setStoreData, _removeStoreData } from '@ui'
import { renderPage } from '../../../jest/helpers/renderPage'
import { renderWithProviders } from '../../../jest/helpers/renderWithProviders'

jest.mock('@ui', () => require('../../../jest/helpers/mockUi'))

jest.mock('@/contexts/CookieConsentContext', () => ({
  useCookieConsent: jest.fn(() => ({ hasConsented: false }))
}))

import { useCookieConsent } from '@/contexts/CookieConsentContext'

import IntroductoryTutorial from '../IntroductoryTutorial'


beforeEach(() => {
    jest.clearAllMocks()
    ;(useCookieConsent as jest.Mock).mockReturnValue({ hasConsented: false })
    ;(useConfig as jest.Mock).mockReturnValue([{
      loading: false,
      configs: {
        powered_by_ordering_module: { value: true },
        verification_email_required: { value: '0' },
        verification_phone_required: { value: '0' }
      }
    }])
    ;(useSession as jest.Mock).mockReturnValue([
      { auth: false, user: null },
      { login: jest.fn() }
    ])
    jest.spyOn(Dimensions, 'get').mockImplementation((dim: string) => {
      if (dim === 'window') return { width: 390, height: 844, scale: 2, fontScale: 2 }
      if (dim === 'screen') return { width: 390, height: 844, scale: 2, fontScale: 2 }
      return { width: 0, height: 0, scale: 1, fontScale: 1 }
    })
    Platform.OS = 'ios'
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

describe('IntroductoryTutorial', () => {
  it('shows the first slide with Skip and Next, and goes forward', () => {
    const { getByText, queryByText, getAllByTestId } = renderPage(IntroductoryTutorial, { pageProps: { onDone: jest.fn() } })
    // The theme's six onboarding slides, one dot each.
    expect(getAllByTestId(/^pager-dot/)).toHaveLength(6)
    expect(getByText('Login, Signup or Continue as a guest')).toBeTruthy()
    expect(getByText('Skip')).toBeTruthy()
    fireEvent.press(getByText('Next'))
    // Past the first slide Skip goes away, as before.
    expect(queryByText('Skip')).toBeNull()
  })

  it('skips to the last slide, whose button ends the tutorial', () => {
    const onDone = jest.fn()
    const { getByText, queryByText } = renderPage(IntroductoryTutorial, { pageProps: { onDone } })
    fireEvent.press(getByText('Skip'))
    expect(queryByText('Next')).toBeNull()
    fireEvent.press(getByText("Let's start!"))
    expect(_setStoreData).toHaveBeenCalledWith('isTutorial', false)
    expect(onDone).toHaveBeenCalled()
  })
})
