import {
  getNativeFeatures,
  isApplePayAvailable,
  isFacebookAvailable,
  isGoogleMapsAvailable,
  isGoogleSignInAvailable,
  isIntercomAvailable,
  isKeyConfigured,
  isPaymethodAvailable,
  NativeKeyKind,
  setNativeFeatures
} from '../nativeKeys'

/** The table every copy of the rule is tested with (ios/native_keys_test.rb, android's NativeKeysTest.kt). */
const table: Record<string, { off: string[], on: string[] }> = require('../nativeKeys.cases.json')
const kinds = Object.keys(table).filter(kind => kind !== '//') as NativeKeyKind[]

describe('isKeyConfigured', () => {
  it('knows the five kinds of the table', () => {
    expect(kinds).toEqual(['generic', 'merchant_id', 'facebook_id', 'facebook_client_token', 'google_reversed_client_id'])
  })

  describe.each(kinds)('%s', kind => {
    it.each(table[kind].off)('is off with %j', value => expect(isKeyConfigured(value, kind)).toBe(false))
    it.each(table[kind].on)('is on with %j', value => expect(isKeyConfigured(value, kind)).toBe(true))
  })

  it('is the generic rule without a kind', () => {
    expect(isKeyConfigured('AIzaSyA-123')).toBe(true)
    expect(isKeyConfigured('0')).toBe(false)
    expect(isKeyConfigured('-')).toBe(false)
  })

  it.each([undefined, null, 0, 1, true, {}, []])('rejects what is not a string (%j)', value =>
    kinds.forEach(kind => expect(isKeyConfigured(value, kind)).toBe(false)))
})

describe('native features', () => {
  afterEach(() => setNativeFeatures(undefined))

  it('counts every feature as available when the native side said nothing', () => {
    setNativeFeatures(undefined)
    expect(getNativeFeatures()).toBeUndefined()
    expect(isGoogleMapsAvailable()).toBe(true)
    expect(isFacebookAvailable()).toBe(true)
    expect(isGoogleSignInAvailable('ios')).toBe(true)
    expect(isIntercomAvailable()).toBe(true)
    expect(isApplePayAvailable('merchant.com.ordering.app')).toBe(true)
  })

  it('ignores what is not an object', () => {
    setNativeFeatures('none' as any)
    expect(getNativeFeatures()).toBeUndefined()
    setNativeFeatures(null)
    expect(getNativeFeatures()).toBeUndefined()
  })

  it('ignores the raw keys an older binary sent (no boolean says off)', () => {
    setNativeFeatures({ googleMapsApiKey: 'none', facebookAppId: 'none' } as any)
    expect(isGoogleMapsAvailable()).toBe(true)
    expect(isFacebookAvailable()).toBe(true)
  })

  it('makes every feature available when the native side allows them all', () => {
    setNativeFeatures({ googleMaps: true, facebook: true, googleSignIn: true, applePay: true, intercom: true })
    expect(isGoogleMapsAvailable()).toBe(true)
    expect(isFacebookAvailable()).toBe(true)
    expect(isGoogleSignInAvailable('ios')).toBe(true)
    expect(isGoogleSignInAvailable('android')).toBe(true)
    expect(isIntercomAvailable()).toBe(true)
  })

  it('turns off each feature the native side turned off, and only it', () => {
    setNativeFeatures({ googleMaps: false, facebook: true, googleSignIn: true, intercom: true })
    expect(isGoogleMapsAvailable()).toBe(false)
    expect(isFacebookAvailable()).toBe(true)

    setNativeFeatures({ googleMaps: true, facebook: false, googleSignIn: true, intercom: true })
    expect(isFacebookAvailable()).toBe(false)
    expect(isGoogleMapsAvailable()).toBe(true)

    setNativeFeatures({ googleMaps: true, facebook: true, googleSignIn: true, intercom: false })
    expect(isIntercomAvailable()).toBe(false)
    expect(isFacebookAvailable()).toBe(true)
  })

  it('needs Google\'s URL scheme on iOS only (Android sends no `googleSignIn`)', () => {
    setNativeFeatures({ googleSignIn: false })
    expect(isGoogleSignInAvailable('ios')).toBe(false)
    expect(isGoogleSignInAvailable('android')).toBe(true)

    setNativeFeatures({ googleMaps: true, facebook: true, intercom: true })
    expect(isGoogleSignInAvailable('android')).toBe(true)
  })
})

describe('Apple Pay', () => {
  afterEach(() => setNativeFeatures(undefined))

  it.each([...table.merchant_id.off, undefined])('is off with the merchant id %j', merchantId => {
    expect(isApplePayAvailable(merchantId)).toBe(false)
    expect(isPaymethodAvailable('apple_pay', merchantId)).toBe(false)
    expect(isPaymethodAvailable('global_apple_pay', merchantId)).toBe(false)
    expect(isPaymethodAvailable('apple_pay_braintree', merchantId)).toBe(false)
    // Other methods never depend on it.
    expect(isPaymethodAvailable('stripe', merchantId)).toBe(true)
    expect(isPaymethodAvailable('google_pay', merchantId)).toBe(true)
    expect(isPaymethodAvailable(undefined, merchantId)).toBe(true)
  })

  it('is on with a merchant id', () => {
    expect(isApplePayAvailable('merchant.com.ordering.app')).toBe(true)
    expect(isPaymethodAvailable('apple_pay', 'merchant.com.ordering.app')).toBe(true)
  })

  it('is off when the app is signed without the entitlement, whatever the merchant id of config.json', () => {
    setNativeFeatures({ applePay: false })
    expect(isApplePayAvailable('merchant.com.ordering.app')).toBe(false)
    expect(isPaymethodAvailable('apple_pay', 'merchant.com.ordering.app')).toBe(false)
    expect(isPaymethodAvailable('stripe', 'merchant.com.ordering.app')).toBe(true)
  })

  it('is off without a merchant id in config.json, whatever the entitlement', () => {
    setNativeFeatures({ applePay: true })
    expect(isApplePayAvailable('com.ordering.v5app5')).toBe(false)
    expect(isApplePayAvailable('merchant.com.ordering.app')).toBe(true)
  })
})
