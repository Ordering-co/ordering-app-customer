import { Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'

/**
 * The forced update check (RootNavigator, when the server's `app_version`
 * config is '1'): the version installed against the one published in the
 * store. It replaces react-native-version-check and keeps what it did: the
 * App Store from iTunes' lookup (in the device's country, where the app is
 * listed), Google Play from its page, and a comparison of every segment.
 */

export type StoreUpdate = {
  isNeeded: boolean
  storeUrl: string
  currentVersion: string
  latestVersion: string
}

type StoreVersion = { version: string, storeUrl: string }

type Fetch = typeof fetch

/** 1 when `a` is newer than `b`, -1 when older, 0 when the same (1.2 = 1.2.0). */
export const compareVersions = (a: string, b: string): number => {
  const parts = (version: string) =>
    String(version).trim().split(/[.-]/).map(part => parseInt(part, 10) || 0)
  const left = parts(a)
  const right = parts(b)
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0)
    if (diff !== 0) return diff > 0 ? 1 : -1
  }
  return 0
}

/** The device's country (ISO 3166 alpha-2, lowercase) from its locale, or ''. */
export const deviceCountry = (locale?: string): string => {
  let tag = locale
  if (tag === undefined) {
    try {
      tag = Intl.DateTimeFormat().resolvedOptions().locale
    } catch {
      tag = ''
    }
  }
  const region = String(tag || '').split(/[-_]/).slice(1).find(part => /^[A-Za-z]{2}$/.test(part))
  return region ? region.toLowerCase() : ''
}

/** The App Store's version, from iTunes' lookup of the bundle id. */
export const fetchAppStoreVersion = async (
  bundleId: string,
  country: string,
  fetchImpl: Fetch = fetch
): Promise<StoreVersion | null> => {
  const countryPath = country ? `${country}/` : ''
  const response = await fetchImpl(
    `https://itunes.apple.com/${countryPath}lookup?bundleId=${encodeURIComponent(bundleId)}&date=${Date.now()}`
  )
  const json: any = await response.json()
  const result = json?.resultCount ? json.results?.[0] : null
  if (!result?.version || !result?.trackId) return null
  return {
    version: String(result.version),
    storeUrl: `itms-apps://apps.apple.com/${countryPath}app/id${result.trackId}`
  }
}

/** Google Play's version, read from the app's page (Play has no public lookup). */
export const fetchPlayStoreVersion = async (
  packageName: string,
  fetchImpl: Fetch = fetch
): Promise<StoreVersion | null> => {
  const storeUrl = `https://play.google.com/store/apps/details?id=${encodeURIComponent(packageName)}&hl=en&gl=US`
  const response = await fetchImpl(storeUrl, { headers: { 'sec-fetch-site': 'same-origin' } })
  const html = await response.text()
  const match = html.match(/Current Version.+?>([\d.-]+)<\/span>/) || html.match(/\[\[\["([\d.]+?)"\]\]/)
  return match ? { version: match[1].trim(), storeUrl } : null
}

/**
 * Whether the store has a newer version than the one installed. Null when the
 * store could not be read (offline, not published, a page that changed): the
 * app is never blocked because of the check itself.
 */
export const checkStoreUpdate = async (options: {
  os?: string
  currentVersion?: string
  bundleId?: string
  country?: string
  fetchImpl?: Fetch
} = {}): Promise<StoreUpdate | null> => {
  const os = options.os ?? Platform.OS
  const currentVersion = options.currentVersion ?? DeviceInfo.getVersion()
  const bundleId = options.bundleId ?? DeviceInfo.getBundleId()
  const fetchImpl = options.fetchImpl ?? fetch
  try {
    let store: StoreVersion | null = null
    if (os === 'ios') {
      store = await fetchAppStoreVersion(bundleId, options.country ?? deviceCountry(), fetchImpl)
    } else if (os === 'android') {
      store = await fetchPlayStoreVersion(bundleId, fetchImpl)
    }
    if (!store || !currentVersion) return null
    return {
      isNeeded: compareVersions(store.version, currentVersion) > 0,
      storeUrl: store.storeUrl,
      currentVersion,
      latestVersion: store.version
    }
  } catch {
    return null
  }
}
