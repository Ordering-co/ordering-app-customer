/**
 * The Google Geocoding client (src/ui/src/utils/geocoding.ts): the request it
 * builds for an address or a position, and the errors the address form, the
 * map and the GPS button read (`code`, `message`, `origin`).
 */
import { geocode, GeocodingErrors, initGeocoder, isGeocoderInitialized } from '../geocoding'

const okBody = { status: 'OK', results: [{ formatted_address: '123 Main St' }] }
const respond = (body: unknown) => jest.fn(async () => ({ json: async () => body }) as any)

const urlOf = (fetchImpl: jest.Mock) => new URL((fetchImpl.mock.calls[0] as any[])[0])

describe('geocoding', () => {
  beforeEach(() => initGeocoder(null))

  it('rejects until it has a key', async () => {
    expect(isGeocoderInitialized()).toBe(false)
    await expect(geocode('Main St', respond(okBody) as any)).rejects.toMatchObject({ code: GeocodingErrors.NOT_INITIATED })
    initGeocoder('key-1')
    expect(isGeocoderInitialized()).toBe(true)
  })

  it('geocodes an address with the key and the extra options', async () => {
    initGeocoder('key-1', { language: 'es' })
    const fetchImpl = respond(okBody)
    await expect(geocode('123 Main St, NY', fetchImpl as any)).resolves.toEqual(okBody)
    const url = urlOf(fetchImpl)
    expect(`${url.origin}${url.pathname}`).toBe('https://maps.google.com/maps/api/geocode/json')
    expect(url.searchParams.get('key')).toBe('key-1')
    expect(url.searchParams.get('language')).toBe('es')
    expect(url.searchParams.get('address')).toBe('123 Main St, NY')
  })

  it('reverse-geocodes a position, in either shape', async () => {
    initGeocoder('key-1')
    const byLatitude = respond(okBody)
    await geocode({ latitude: 40.7, longitude: -74 }, byLatitude as any)
    expect(urlOf(byLatitude).searchParams.get('latlng')).toBe('40.7,-74')
    const byLat = respond(okBody)
    await geocode({ lat: 0, lng: 0 }, byLat as any)
    expect(urlOf(byLat).searchParams.get('latlng')).toBe('0,0')
  })

  it('rejects invalid parameters without a request', async () => {
    initGeocoder('key-1')
    const fetchImpl = respond(okBody)
    await expect(geocode({ latitude: undefined, longitude: 1 }, fetchImpl as any)).rejects.toMatchObject({ code: GeocodingErrors.INVALID_PARAMETERS })
    await expect(geocode('', fetchImpl as any)).rejects.toMatchObject({ code: GeocodingErrors.INVALID_PARAMETERS })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('hands the server answer as the origin when Google does not answer OK', async () => {
    initGeocoder('key-1')
    const denied = { status: 'REQUEST_DENIED', error_message: 'API keys with referer restrictions cannot be used with this API.', results: [] }
    await expect(geocode('x', respond(denied) as any)).rejects.toEqual({
      code: GeocodingErrors.SERVER,
      message: 'Error from the server while geocoding.',
      origin: denied
    })
  })

  it('tells a network failure from an unreadable answer', async () => {
    initGeocoder('key-1')
    const offline = jest.fn(async () => { throw new Error('offline') })
    await expect(geocode('x', offline as any)).rejects.toMatchObject({ code: GeocodingErrors.FETCHING })
    const html = jest.fn(async () => ({ json: async () => { throw new SyntaxError('html') } }) as any)
    await expect(geocode('x', html as any)).rejects.toMatchObject({ code: GeocodingErrors.PARSING })
  })
})
