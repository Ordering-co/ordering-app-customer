import { Platform } from 'react-native'

/**
 * The optional keys the Builder writes into the native files (base 100's
 * actions: the text of a placeholder → the value of the constant):
 *
 * | Constant | Native file | Without it |
 * |----------|-------------|------------|
 * | `google_maps_api_key` | `AndroidManifest.xml`, `AppDelegate.swift` | no native map (the address form still works: Google Places is HTTP, with the server's key) |
 * | `facebook_id`, `facebook_client_token` | `strings.xml`, `Info.plist` | no Facebook login nor app events: the SDK is not started |
 * | `google_reversed_client_id` | `Info.plist` (URL scheme) | no Google login on iOS |
 * | `apple_merchant_id` | `.entitlements`, `src/config.json` `merchantId` | no Apple Pay |
 * | `intercom_api_key`, `intercom_app_id` | `AppDelegate.swift`, `MainApplication.kt` | no Intercom chat |
 *
 * The rule (`isKeyConfigured`) has one copy per platform, each tested with the
 * table of `nativeKeys.cases.json`: this file, `ios/native_keys.rb` (the Podfile
 * and the build phases; Swift reads what they decided) and Android's
 * `NativeKeys.kt`. The native side decides and hands JS booleans, the root
 * component's `nativeFeatures` (`App.tsx`); JS applies the rule itself only to
 * `src/config.json`'s `merchantId`.
 *
 * When the native side says nothing (the tests, a binary older than this
 * file) every feature counts as available, as before.
 */

/** A placeholder the Builder has not replaced: `_FACEBOOK_ID_`, `_MERCHANT_ID_`… */
const PLACEHOLDER = /^_[A-Z0-9_]*_$/

/** The values that switch a key off (any case), besides the empty one and a placeholder. */
const OFF_VALUES = ['none', 'null', '-', '0']

/**
 * What a key is, for the shape its value must have: a wrong one would break
 * the build or the start (the signing with a merchant id that is not one, a
 * URL scheme that is not Facebook's or Google's).
 */
export type NativeKeyKind =
  | 'generic'
  /** `merchant.…` */
  | 'merchant_id'
  /** Digits only (and not zero). */
  | 'facebook_id'
  /** As `generic`, but `0` stays a value (as before this rule; not tried on a device). */
  | 'facebook_client_token'
  /** `com.googleusercontent.apps.…` */
  | 'google_reversed_client_id'

const SHAPES: Partial<Record<NativeKeyKind, RegExp>> = {
  merchant_id: /^merchant\.[!-~]+$/,
  facebook_id: /^[0-9]+$/,
  google_reversed_client_id: /^com\.googleusercontent\.apps\.[A-Za-z0-9.-]+$/
}

/**
 * Whether a key the Builder writes holds a real value: not empty, `none`,
 * `null`, `-`, `0` nor its placeholder left as it is, and of its kind's shape.
 */
export const isKeyConfigured = (value: unknown, kind: NativeKeyKind = 'generic'): boolean => {
  if (typeof value !== 'string') return false
  const key = value.trim()
  if (!key || PLACEHOLDER.test(key)) return false
  const off = kind === 'facebook_client_token' ? OFF_VALUES.filter(v => v !== '0') : OFF_VALUES
  if (off.includes(key.toLowerCase())) return false
  if (kind === 'facebook_id' && /^0+$/.test(key)) return false
  return SHAPES[kind]?.test(key) ?? true
}

/** What the native side decided from its keys (AppDelegate.swift's `NativeKeys`, NativeKeys.kt). */
export interface NativeFeatures {
  /** The native map (react-native-maps with Google's provider). */
  googleMaps?: boolean
  /** Facebook's SDK is started: login and app events. */
  facebook?: boolean
  /** iOS only: Google Sign-In's URL scheme is in Info.plist. */
  googleSignIn?: boolean
  /** iOS only: the app is signed with the Apple Pay entitlement. */
  applePay?: boolean
  /** Intercom's SDK is started. */
  intercom?: boolean
}

let nativeFeatures: NativeFeatures | undefined

/** Keeps what the native side handed to the root component (`App.tsx`). */
export const setNativeFeatures = (features?: NativeFeatures | null) => {
  nativeFeatures = features && typeof features === 'object' ? features : undefined
}

export const getNativeFeatures = (): NativeFeatures | undefined => nativeFeatures

/** Off only when the native side said so: when it said nothing, as before this file. */
const nativeFeature = (name: keyof NativeFeatures) => nativeFeatures?.[name] !== false

/**
 * The native map. Without a key the iOS SDK is not started (`GMSServices`
 * would throw) and Android's map stays grey: the screens leave the map out.
 * Only the map: the address form's autocomplete, its GPS button and the static
 * map images are HTTP calls with the server's key (`configs.google_maps_api_key`).
 */
export const isGoogleMapsAvailable = () => nativeFeature('googleMaps')

/** Facebook's SDK is started (an app id and a client token): login and app events. */
export const isFacebookAvailable = () => nativeFeature('facebook')

/**
 * Google Sign-In: iOS needs the reversed client id as a URL scheme (its SDK
 * throws without it); Android needs nothing native.
 */
export const isGoogleSignInAvailable = (os: string = Platform.OS) =>
  os !== 'ios' || nativeFeature('googleSignIn')

/** Intercom's SDK is started (an API key and an app id). */
export const isIntercomAvailable = () => nativeFeature('intercom')

/** The Apple Pay gateways: they need the merchant id (entitlement and Stripe's `merchantIdentifier`). */
export const APPLE_PAY_GATEWAYS = ['apple_pay', 'global_apple_pay', 'apple_pay_braintree']

/**
 * Apple Pay with this merchant id (`src/config.json` `merchantId`): it must be
 * one, and the app must be signed with the entitlement (the native side tells:
 * the Builder writes both from one constant, a developer may not).
 */
export const isApplePayAvailable = (merchantId: unknown) =>
  isKeyConfigured(merchantId, 'merchant_id') && nativeFeature('applePay')

/** Whether a payment method can show: an Apple Pay one only with a merchant id. */
export const isPaymethodAvailable = (gateway: string | undefined, merchantId: unknown) =>
  !gateway || !APPLE_PAY_GATEWAYS.includes(gateway) || isApplePayAvailable(merchantId)
