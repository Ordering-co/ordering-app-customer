import React from 'react'
import { act, render, waitFor } from '@testing-library/react-native'

import { CookieConsentProvider, useCookieConsent } from '../index'

const mockRetrieve = jest.fn()
jest.mock('@ui', () => ({
  _retrieveStoreData: (...args: any[]) => mockRetrieve(...args),
  _setStoreData: jest.fn()
}))

jest.mock('../../../config', () => ({ __esModule: true, default: { cookie_consent_enabled: false } }))

let ctx: any
const Probe = () => {
  ctx = useCookieConsent()
  return null
}

const mount = () => render(<CookieConsentProvider><Probe /></CookieConsentProvider>)

describe('CookieConsentProvider isConsentResolved', () => {
  beforeEach(() => {
    ctx = undefined
    mockRetrieve.mockReset()
  })

  it('is not resolved after launch even though hasConsented is already true', async () => {
    mockRetrieve.mockResolvedValue(null)
    mount()
    expect(ctx.hasConsented).toBe(true)
    expect(ctx.isConsentResolved).toBe(false)
    await waitFor(() => expect(ctx.loading).toBe(false))
    expect(ctx.isConsentResolved).toBe(false)
  })

  it('stays unresolved while the stored consent is still being read', async () => {
    let release: (value: unknown) => void = () => {}
    mockRetrieve.mockReturnValue(new Promise(resolve => { release = resolve }))
    mount()
    act(() => ctx.setIsConsentEnabled(false))
    expect(ctx.isConsentResolved).toBe(false)
    await act(async () => release(null))
    expect(ctx.isConsentResolved).toBe(true)
  })

  it('stays unresolved until the configs decided the flag, then resolves', async () => {
    mockRetrieve.mockResolvedValue(null)
    mount()
    await waitFor(() => expect(ctx.loading).toBe(false))
    act(() => ctx.setIsConsentEnabled(true))
    expect(ctx.isConsentResolved).toBe(true)
    expect(ctx.hasConsented).toBe(false)
  })

  it('resolves with consent when the banner applies and the stored choice is accepted', async () => {
    mockRetrieve.mockResolvedValue({ version: '1.0', status: 'accepted', timestamp: 't' })
    mount()
    await waitFor(() => expect(ctx.loading).toBe(false))
    act(() => ctx.setIsConsentEnabled(true))
    expect(ctx.isConsentResolved && ctx.hasConsented).toBe(true)
  })

  it('has no consent when the banner applies and the stored choice is opted out', async () => {
    mockRetrieve.mockResolvedValue({ version: '1.0', status: 'opted_out', timestamp: 't' })
    mount()
    await waitFor(() => expect(ctx.loading).toBe(false))
    act(() => ctx.setIsConsentEnabled(true))
    expect(ctx.isConsentResolved).toBe(true)
    expect(ctx.hasConsented).toBe(false)
  })

  it('counts as resolved without a provider (as the website does)', () => {
    const Bare = () => { ctx = useCookieConsent(); return null }
    render(<Bare />)
    expect(ctx.isConsentResolved).toBe(true)
  })
})
