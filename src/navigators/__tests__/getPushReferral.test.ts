import { getPushReferral, registerPushReferral, resetRegisteredPushReferral } from '../getPushReferral'

const utm = { utm_source: 'ordering_marketing', utm_medium: 'push', utm_campaign: 'mkt-12' }
const expected = { source: 'ordering_marketing', medium: 'push', campaign: 'mkt-12' }

describe('getPushReferral', () => {
  it('reads the FCM shape (data)', () => {
    expect(getPushReferral({ messageId: 'm1', data: { tracking_id: 't', ...utm } })).toEqual(expected)
  })

  it('reads the OneSignal shape (additionalData)', () => {
    expect(getPushReferral({ notificationId: 'n1', additionalData: { tracking_id: 't', ...utm } })).toEqual(expected)
  })

  it('reads the notifee press shape ({ data })', () => {
    expect(getPushReferral({ data: utm })).toEqual(expected)
  })

  it('prefers additionalData over data, like the navigation plan', () => {
    expect(getPushReferral({ additionalData: utm, data: { utm_source: 'other' } })).toEqual(expected)
  })

  it('returns only the source when medium and campaign are missing or empty', () => {
    expect(getPushReferral({ data: { utm_source: 'ordering_marketing', utm_medium: '', utm_campaign: 'null' } }))
      .toEqual({ source: 'ordering_marketing' })
  })

  it('returns null for order and cart pushes without utm', () => {
    expect(getPushReferral({ additionalData: { order_uuid: 'ord-42' } })).toBeNull()
    expect(getPushReferral({ data: { cart_uuid: 'cart-9' } })).toBeNull()
  })

  it('returns null when utm_source is empty, "null" or missing', () => {
    expect(getPushReferral({ data: { utm_source: '', utm_medium: 'push' } })).toBeNull()
    expect(getPushReferral({ data: { utm_source: 'null', utm_medium: 'push' } })).toBeNull()
    expect(getPushReferral({ data: { utm_source: null } })).toBeNull()
    expect(getPushReferral({ data: { utm_medium: 'push', utm_campaign: 'mkt-12' } })).toBeNull()
  })

  it('returns null for missing or non-object notifications', () => {
    expect(getPushReferral(null)).toBeNull()
    expect(getPushReferral(undefined)).toBeNull()
    expect(getPushReferral('utm_source')).toBeNull()
    expect(getPushReferral({})).toBeNull()
  })
})

describe('registerPushReferral', () => {
  beforeEach(() => resetRegisteredPushReferral())

  it('registers a campaign push once', () => {
    const register = jest.fn()
    registerPushReferral({ data: utm }, register)
    expect(register).toHaveBeenCalledTimes(1)
    expect(register).toHaveBeenCalledWith(expected)
  })

  it('registers nothing for a push without utm', () => {
    const register = jest.fn()
    registerPushReferral({ additionalData: { order_uuid: 'ord-42' } }, register)
    expect(register).not.toHaveBeenCalled()
  })

  it('does not register the same message again (initial notification read after a remount)', () => {
    const register = jest.fn()
    registerPushReferral({ messageId: 'm1', data: utm }, register)
    registerPushReferral({ messageId: 'm1', data: utm }, register)
    expect(register).toHaveBeenCalledTimes(1)
    registerPushReferral({ messageId: 'm2', data: utm }, register)
    expect(register).toHaveBeenCalledTimes(2)
  })

  it('registers every tap of a push without an id', () => {
    const register = jest.fn()
    registerPushReferral({ data: utm }, register)
    registerPushReferral({ data: utm }, register)
    expect(register).toHaveBeenCalledTimes(2)
  })

  it('never throws, nor without the action', () => {
    expect(() => registerPushReferral({ data: utm }, () => { throw new Error('boom') })).not.toThrow()
    expect(() => registerPushReferral({ data: utm }, undefined)).not.toThrow()
  })

  it('does not register the launching push again after another one was opened', () => {
    const register = jest.fn()
    registerPushReferral({ messageId: 'launch', data: utm }, register)
    registerPushReferral({ messageId: 'later', data: { ...utm, utm_campaign: 'mkt-13' } }, register)
    registerPushReferral({ messageId: 'launch', data: utm }, register)
    expect(register).toHaveBeenCalledTimes(2)
  })
})
