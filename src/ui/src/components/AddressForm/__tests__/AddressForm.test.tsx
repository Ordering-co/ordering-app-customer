import '../../../../../../jest/helpers/registerM9NativeMocks'

import React from 'react'
import { act, fireEvent, waitFor } from '@testing-library/react-native'
import { useOrder, useToast } from '@components'

import { AddressForm } from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'
import { setNativeFeatures } from '../../../../../utils/nativeKeys'
import { geocode } from '../../../utils/geocoding'
import { consumeLegacyFallback, setPlacesApiMode } from '../googlePlaces'

jest.mock('../../../utils/geocoding', () => ({
  initGeocoder: jest.fn(),
  geocode: jest.fn()
}))

jest.mock('@components', () => require('../../../../../../jest/helpers/m9IntegrationsComponentsMock').getMock())
jest.mock('@ui', () => {
  const ReactMock = require('react')
  const { View } = require('react-native')
  const uiMock = require('../../../../../../jest/helpers/m9IntegrationsUiMock').getUiMock()
  return {
    ...uiMock,
    GPSButton: (props: any) => ReactMock.createElement(View, { testID: 'gps-button-stub', ...props })
  }
})

describe('AddressForm', () => {
  const d = require('../../../../../../jest/helpers/m9IntegrationsDefaults')

  // Without the native Google Maps key only the map goes: Google Places (the autocomplete,
  // the GPS button's geocoding) is HTTP with the server's key, `configs.google_maps_api_key`.
  describe('without the native Google Maps key', () => {
    const located = {
      loading: false,
      result: { error: false },
      changes: { address: '123 Main St', location: { lat: 40.7, lng: -74 } }
    }

    beforeEach(() => setNativeFeatures({ googleMaps: false }))
    afterEach(() => setNativeFeatures(undefined))

    it('keeps Google\'s autocomplete (the server\'s key) and the GPS button', () => {
      const { getByTestId, queryByPlaceholderText } = renderWithProviders(
        <AddressForm {...d.addressFormDefaults} />
      )
      expect(getByTestId('google-places-input').props.apiKey).toBe('test-google-key')
      expect(getByTestId('gps-button-stub').props.apiKey).toBe('test-google-key')
      // Not the alternative's (Mapbox) plain input.
      expect(queryByPlaceholderText('Add a address')).toBeNull()
    })

    it('shows no map, and shows it with the key', () => {
      const withoutKey = renderWithProviders(<AddressForm {...d.addressFormDefaults} formState={located} />)
      expect(withoutKey.queryByTestId('google-map-stub')).toBeNull()
      withoutKey.unmount()

      setNativeFeatures({ googleMaps: true })
      const withKey = renderWithProviders(<AddressForm {...d.addressFormDefaults} formState={located} />)
      expect(withKey.getByTestId('google-map-stub')).toBeTruthy()
    })

    it('saves an address picked from Google\'s suggestions', async () => {
      const saveAddress = jest.fn()
      const { getByText, queryByText } = renderWithProviders(
        <AddressForm {...d.addressFormDefaults} formState={located} saveAddress={saveAddress} />
      )

      await act(async () => {
        fireEvent.press(getByText('Continue'))
      })

      expect(saveAddress).toHaveBeenCalled()
      expect(queryByText('The address needs a location, please select one of the suggested')).toBeNull()
    })

    it('geocodes and saves a typed address instead of asking for a suggestion (as with the key)', async () => {
      const location = { lat: 40.7, lng: -74 }
      ;(geocode as jest.Mock).mockResolvedValue({
        results: [{ place_id: 'place-1', geometry: { location }, address_components: [] }]
      })
      const saveAddress = jest.fn()
      const { getByText } = renderWithProviders(
        <AddressForm
          {...d.addressFormDefaults}
          formState={{ loading: false, result: { error: false }, changes: { address: '123 Main St' } }}
          saveAddress={saveAddress}
        />
      )

      await act(async () => {
        fireEvent.press(getByText('Continue'))
      })

      // The alternative (Mapbox) asks for one of its suggestions here: without its token nothing is saved.
      expect(geocode).toHaveBeenCalledWith('123 Main St')
      expect(saveAddress).toHaveBeenCalledWith({
        address: '123 Main St',
        location,
        map_data: { library: 'google', place_id: 'place-1' }
      })
    })
  })

  // The server's Google key may not have Places API (New): Google answers 403
  // ("Permission denied on the service.") and the form goes to the legacy API.
  describe('Google suggestions when the key cannot use an API', () => {
    const SUGGESTIONS_UNAVAILABLE = 'Address suggestions are not available right now. Type your full address to continue.'
    const typed = { loading: false, result: { error: false }, changes: { address: '123 Main St' } }
    const originalFetch = (global as any).fetch
    let showToast: jest.Mock
    // The form also toasts its own success: only the errors matter here.
    const errorToasts = () => showToast.mock.calls.filter(([type]) => type === 'error')

    beforeEach(() => {
      showToast = jest.fn()
      ;(useToast as jest.Mock).mockReturnValue([undefined, { showToast }])
    })

    afterEach(() => {
      setPlacesApiMode(null)
      consumeLegacyFallback()
      ;(global as any).fetch = originalFetch
    })

    const legacyDenied = () => {
      (global as any).fetch = jest.fn().mockResolvedValue({
        json: async () => ({ status: 'REQUEST_DENIED', error_message: 'This API project is not authorized to use this API.' })
      })
    }

    it.each([
      'Permission denied on the service.',
      'PERMISSION_DENIED',
      'SERVICE_DISABLED',
      'Request failed with status 403'
    ])('goes to the legacy API when Places API (New) answers %j, without showing Google\'s error', async message => {
      const view = renderWithProviders(<AddressForm {...d.addressFormDefaults} />)

      await act(async () => {
        view.getByTestId('google-places-input').props.onError(new Error(message))
      })

      // The legacy input (a plain text input with the form's own suggestions) took its place.
      expect(view.queryByTestId('google-places-input')).toBeNull()
      expect(view.getByPlaceholderText('Add a address')).toBeTruthy()
      expect(errorToasts()).toEqual([])
    })

    it('asks the legacy API for the suggestions and shows them', async () => {
      const fetchMock = jest.fn().mockResolvedValue({
        json: async () => ({
          status: 'OK',
          predictions: [{
            place_id: 'place-1',
            description: 'Empire State Building, New York, NY, USA',
            structured_formatting: { main_text: 'Empire State Building', secondary_text: 'New York, NY, USA' }
          }]
        })
      })
      ;(global as any).fetch = fetchMock
      const view = renderWithProviders(<AddressForm {...d.addressFormDefaults} />)
      await act(async () => {
        view.getByTestId('google-places-input').props.onError(new Error('Permission denied on the service.'))
      })

      fireEvent.changeText(view.getByPlaceholderText('Add a address'), 'Empire')

      expect(await view.findByText('Empire State Building')).toBeTruthy()
      expect(fetchMock.mock.calls[0][0]).toContain('maps.googleapis.com/maps/api/place/autocomplete/json')
      expect(fetchMock.mock.calls[0][0]).toContain('key=test-google-key')
      expect(errorToasts()).toEqual([])
    })

    it('says once, in its own words, that there are no suggestions when the legacy API is denied too', async () => {
      legacyDenied()
      const view = renderWithProviders(<AddressForm {...d.addressFormDefaults} formState={typed} />)
      await act(async () => {
        view.getByTestId('google-places-input').props.onError(new Error('Permission denied on the service.'))
      })

      fireEvent.changeText(view.getByPlaceholderText('Add a address'), '123 Main')
      await waitFor(() => expect(errorToasts()).toHaveLength(1))
      fireEvent.changeText(view.getByPlaceholderText('Add a address'), '123 Main St')
      await waitFor(() => expect((global as any).fetch).toHaveBeenCalledTimes(2))

      expect(errorToasts()).toEqual([['error', [SUGGESTIONS_UNAVAILABLE]]])
      expect(JSON.stringify(showToast.mock.calls)).not.toMatch(/not authorized|REQUEST_DENIED|Permission denied/)
    })

    it('still saves the typed address through the geocoder when neither API gives suggestions', async () => {
      legacyDenied()
      const location = { lat: 40.7, lng: -74 }
      ;(geocode as jest.Mock).mockResolvedValue({
        results: [{ place_id: 'place-1', geometry: { location }, address_components: [] }]
      })
      const saveAddress = jest.fn()
      const view = renderWithProviders(
        <AddressForm {...d.addressFormDefaults} formState={typed} saveAddress={saveAddress} />
      )
      await act(async () => {
        view.getByTestId('google-places-input').props.onError(new Error('Permission denied on the service.'))
      })
      fireEvent.changeText(view.getByPlaceholderText('Add a address'), '123 Main St')
      await waitFor(() => expect(errorToasts()).toHaveLength(1))

      await act(async () => {
        fireEvent.press(view.getByText('Continue'))
      })

      expect(geocode).toHaveBeenCalledWith('123 Main St')
      expect(saveAddress).toHaveBeenCalledWith(expect.objectContaining({ address: '123 Main St', location }))
    })

    it('says it too, and stays on Places API (New), when the error is not about the key (no network)', async () => {
      const view = renderWithProviders(<AddressForm {...d.addressFormDefaults} />)

      await act(async () => {
        view.getByTestId('google-places-input').props.onError(new Error('Network request failed'))
      })

      expect(view.getByTestId('google-places-input')).toBeTruthy()
      expect(errorToasts()).toEqual([['error', [SUGGESTIONS_UNAVAILABLE]]])
    })

    it('ignores the errors of the Places API (New) requests still on their way after the switch', async () => {
      const view = renderWithProviders(<AddressForm {...d.addressFormDefaults} />)
      const { onError } = view.getByTestId('google-places-input').props

      await act(async () => {
        onError(new Error('Permission denied on the service.'))
      })
      await act(async () => {
        onError(new Error('Permission denied on the service.'))
        onError(new Error('Network request failed'))
      })

      expect(view.getByPlaceholderText('Add a address')).toBeTruthy()
      expect(errorToasts()).toEqual([])
    })
  })

  it('renders address form shell (smoke)', () => {
    const { getByText, getByTestId } = renderWithProviders(
      <AddressForm {...d.addressFormDefaults} />
    )
    expect(getByTestId('google-places-input')).toBeTruthy()
    expect(getByText('Cancel')).toBeTruthy()
  })

  it('lets the GPS button report its errors through the form alert', () => {
    const { getByTestId } = renderWithProviders(
      <AddressForm {...d.addressFormDefaults} />
    )
    expect(getByTestId('gps-button-stub').props.setAlertState).toEqual(expect.any(Function))
  })

  it('returns to the previous screen once the saved address is applied when isGoBack is set', () => {
    const orderMock = useOrder as jest.Mock
    const defaultOrder = orderMock.getMockImplementation()
    orderMock.mockImplementation(() => [
      { loading: true, options: { type: 1, address: d.sampleAddress } },
      { setStateValues: jest.fn() }
    ])
    const goToBack = jest.fn()
    const navigation = { navigate: jest.fn(), canGoBack: () => true, goBack: jest.fn() }

    renderWithProviders(
      <AddressForm
        {...d.addressFormDefaults}
        addressesList={undefined}
        navigation={navigation}
        isGoBack
        goToBack={goToBack}
      />
    )

    expect(goToBack).toHaveBeenCalled()
    expect(navigation.navigate).not.toHaveBeenCalledWith('BottomTab')
    orderMock.mockImplementation(defaultOrder)
  })

  it('returns a guest to the previous screen after saving when isGoBack is set', async () => {
    const m8 = require('../../../../../../jest/helpers/m8ProfileComponentsMock')
    m8.setMockState({ sessionState: { auth: false, user: null, token: null, loading: false } })
    const saveAddress = jest.fn()
    const goToBack = jest.fn()
    const navigation = { navigate: jest.fn(), canGoBack: () => true, goBack: jest.fn() }

    const { getByText } = renderWithProviders(
      <AddressForm
        {...d.addressFormDefaults}
        formState={{
          loading: false,
          result: { error: false },
          changes: { address: '123 Main St', location: { lat: 40.7, lng: -74 } }
        }}
        saveAddress={saveAddress}
        navigation={navigation}
        isGoBack
        goToBack={goToBack}
      />
    )

    await act(async () => {
      fireEvent.press(getByText('Update'))
    })

    expect(saveAddress).toHaveBeenCalled()
    expect(goToBack).toHaveBeenCalled()
    expect(navigation.navigate).not.toHaveBeenCalledWith('Business')
    m8.resetMockState()
  })
})
