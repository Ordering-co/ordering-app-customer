/**
 * Google's Geocoding API (https://developers.google.com/maps/documentation/geocoding),
 * in place of react-native-geocoding: the same calls (`init` once with the
 * project's Google Maps key, then `from` an address or a position) and the
 * same errors (`{ code, message, origin }`), so the address form, the map and
 * the GPS button keep their handling (an alert with `origin.error_message`).
 */

export const GeocodingErrors = {
  NOT_INITIATED: 0,
  INVALID_PARAMETERS: 1,
  FETCHING: 2,
  PARSING: 3,
  SERVER: 4
} as const

export type GeocodingError = {
  code: number
  message: string
  origin?: any
}

export type GeocodingResponse = {
  status: string
  results: any[]
  error_message?: string
}

type Position = { latitude?: number, longitude?: number, lat?: number, lng?: number }

const GEOCODING_URL = 'https://maps.google.com/maps/api/geocode/json'

let apiKey: string | null = null
let extraParams: Record<string, string> = {}

/** Sets the key (and extra query parameters, such as `language`) of every request. */
export const initGeocoder = (key?: string | null, options: Record<string, string> = {}) => {
  apiKey = key || null
  extraParams = options
}

export const isGeocoderInitialized = () => !!apiKey

const queryFor = (query: string | Position): Record<string, string> | null => {
  if (typeof query === 'string') return query ? { address: query } : null
  if (query && typeof query === 'object') {
    const lat = query.lat ?? query.latitude
    const lng = query.lng ?? query.longitude
    if (Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) return { latlng: `${lat},${lng}` }
  }
  return null
}

/** Geocodes an address, or reverse-geocodes a position; rejects unless Google answers OK. */
export const geocode = async (
  query: string | Position,
  fetchImpl: typeof fetch = fetch
): Promise<GeocodingResponse> => {
  if (!apiKey) {
    throw {
      code: GeocodingErrors.NOT_INITIATED,
      message: 'The geocoder has no Google Maps key.'
    } as GeocodingError
  }
  const params = queryFor(query)
  if (!params) {
    throw {
      code: GeocodingErrors.INVALID_PARAMETERS,
      message: `Invalid parameters: ${JSON.stringify(query)}`
    } as GeocodingError
  }
  const search = Object.entries({ key: apiKey, ...extraParams, ...params })
    .map(([name, value]) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`)
    .join('&')

  let response: Response
  try {
    response = await fetchImpl(`${GEOCODING_URL}?${search}`)
  } catch (error) {
    throw { code: GeocodingErrors.FETCHING, message: 'Error while fetching. Check your network.', origin: error } as GeocodingError
  }
  let data: GeocodingResponse
  try {
    data = await response.json()
  } catch {
    throw { code: GeocodingErrors.PARSING, message: 'Error while parsing the geocoding response.', origin: response } as GeocodingError
  }
  if (data?.status !== 'OK') {
    throw { code: GeocodingErrors.SERVER, message: 'Error from the server while geocoding.', origin: data } as GeocodingError
  }
  return data
}
