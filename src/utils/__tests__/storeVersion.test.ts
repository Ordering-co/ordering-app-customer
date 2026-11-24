/**
 * The forced update check (src/utils/storeVersion.ts): versions compared by
 * segment, the device's country, the App Store lookup, the Google Play page
 * and a check that never throws.
 */
import {
  checkStoreUpdate,
  compareVersions,
  deviceCountry,
  fetchAppStoreVersion,
  fetchPlayStoreVersion
} from '../storeVersion'

const jsonResponse = (body: unknown) => ({ json: async () => body }) as any
const textResponse = (body: string) => ({ text: async () => body }) as any

const appStore = (version: string, trackId = 123) =>
  jest.fn(async () => jsonResponse({ resultCount: 1, results: [{ version, trackId }] }))

describe('storeVersion', () => {
  it('compares versions segment by segment', () => {
    expect(compareVersions('1.2.10', '1.2.9')).toBe(1)
    expect(compareVersions('1.2', '1.2.0')).toBe(0)
    expect(compareVersions('2.0.0', '10.0.0')).toBe(-1)
    expect(compareVersions('1.3', '1.2.99')).toBe(1)
  })

  it('reads the country of the device locale', () => {
    expect(deviceCountry('en-US')).toBe('us')
    expect(deviceCountry('es_MX')).toBe('mx')
    expect(deviceCountry('zh-Hant-TW')).toBe('tw')
    expect(deviceCountry('en')).toBe('')
    expect(deviceCountry('')).toBe('')
  })

  it('reads the App Store version and link from the lookup of its country', async () => {
    const fetchImpl = appStore('2.1.0', 987)
    await expect(fetchAppStoreVersion('com.test.app', 'mx', fetchImpl as any)).resolves.toEqual({
      version: '2.1.0',
      storeUrl: 'itms-apps://apps.apple.com/mx/app/id987'
    })
    expect((fetchImpl.mock.calls[0] as any[])[0]).toMatch(/^https:\/\/itunes\.apple\.com\/mx\/lookup\?bundleId=com\.test\.app&date=\d+$/)
  })

  it('answers null when the app is not in the App Store', async () => {
    const fetchImpl = jest.fn(async () => jsonResponse({ resultCount: 0, results: [] }))
    await expect(fetchAppStoreVersion('com.test.app', '', fetchImpl as any)).resolves.toBeNull()
  })

  it('reads the Google Play version from both page layouts', async () => {
    const legacy = jest.fn(async () => textResponse('<div>Current Version</div><span class="x">3.4.5</span>'))
    await expect(fetchPlayStoreVersion('com.test.app', legacy as any)).resolves.toEqual({
      version: '3.4.5',
      storeUrl: 'https://play.google.com/store/apps/details?id=com.test.app&hl=en&gl=US'
    })
    const current = jest.fn(async () => textResponse('foo,[[["3.5.0"]],bar'))
    await expect(fetchPlayStoreVersion('com.test.app', current as any)).resolves.toMatchObject({ version: '3.5.0' })
    const changed = jest.fn(async () => textResponse('<html></html>'))
    await expect(fetchPlayStoreVersion('com.test.app', changed as any)).resolves.toBeNull()
  })

  it('asks for the update only when the store is newer', async () => {
    await expect(checkStoreUpdate({ os: 'ios', currentVersion: '2.0.0', bundleId: 'b', country: 'us', fetchImpl: appStore('2.0.1') as any }))
      .resolves.toEqual({ isNeeded: true, storeUrl: 'itms-apps://apps.apple.com/us/app/id123', currentVersion: '2.0.0', latestVersion: '2.0.1' })
    await expect(checkStoreUpdate({ os: 'ios', currentVersion: '2.0.1', bundleId: 'b', country: 'us', fetchImpl: appStore('2.0.1') as any }))
      .resolves.toMatchObject({ isNeeded: false })
    await expect(checkStoreUpdate({ os: 'ios', currentVersion: '2.1.0', bundleId: 'b', country: 'us', fetchImpl: appStore('2.0.9') as any }))
      .resolves.toMatchObject({ isNeeded: false })
  })

  it('uses the installed version and bundle id of the device', async () => {
    const fetchImpl = jest.fn(async () => textResponse('[[["1.0.1"]]'))
    await expect(checkStoreUpdate({ os: 'android', fetchImpl: fetchImpl as any })).resolves.toMatchObject({
      isNeeded: true,
      currentVersion: '1.0.0'
    })
    expect((fetchImpl.mock.calls[0] as any[])[0]).toContain('id=com.test.app')
  })

  it('never throws: an unreadable store answers null', async () => {
    const offline = jest.fn(async () => { throw new Error('offline') })
    await expect(checkStoreUpdate({ os: 'ios', currentVersion: '1.0.0', bundleId: 'b', country: '', fetchImpl: offline as any })).resolves.toBeNull()
    await expect(checkStoreUpdate({ os: 'web', currentVersion: '1.0.0', bundleId: 'b', fetchImpl: offline as any })).resolves.toBeNull()
  })
})
