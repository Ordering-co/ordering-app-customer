import '../../../../../../jest/helpers/registerM3NativeMocks'

import React from 'react'
import { fireEvent } from '@testing-library/react-native'
import { useToast, useSession, useConfig } from '@components'

import { BusinessController, BusinessControllerUI } from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

jest.mock('@components', () => {
  const m3 = require('../../../../../../jest/helpers/m3DiscoveryComponentsMock')
  const defaults = require('../../../../../../jest/helpers/m3DiscoveryDefaults')
  const React = require('react')
  return m3.getMock({
    BusinessController: (props: any) => {
      const UI = props.UIComponent
      return UI ? React.createElement(UI, { ...defaults.businessControllerUiDefaults, ...props }) : null
    }
  })
})
jest.mock('@ui', () => require('../../../../../../jest/helpers/m3DiscoveryUiMock').getUiMock())

describe('BusinessController', () => {
  it('renders business name in full card view', () => {
    const { getByText } = renderWithProviders(
      <BusinessController navigation={{ navigate: jest.fn() }} businessSlug="pizza-place" />
    )
    expect(getByText('Pizza Place')).toBeTruthy()
  })

  it('handles simple view layout', () => {
    const handleClick = jest.fn()
    const { getByText } = renderWithProviders(
      <BusinessController
        navigation={{ navigate: jest.fn() }}
        businessSlug="pizza-place"
        simpleView
        handleClick={handleClick}
      />
    )
    fireEvent.press(getByText('Pizza Place'))
    expect(handleClick).toHaveBeenCalled()
  })

  it('renders favorite view and toggles favorite when authenticated', () => {
    const defaults = require('../../../../../../jest/helpers/m3DiscoveryDefaults').businessControllerUiDefaults
    const handleFavoriteBusiness = jest.fn()
    const { UNSAFE_getAllByType } = renderWithProviders(
      <BusinessControllerUI
        {...defaults}
        favoriteView
        handleFavoriteBusiness={handleFavoriteBusiness}
      />
    )
    const { TouchableOpacity } = require('react-native')
    // The heart is the card's only TouchableOpacity (the card presses through PressableScale).
    fireEvent.press(UNSAFE_getAllByType(TouchableOpacity)[0])
    expect(handleFavoriteBusiness).toHaveBeenCalled()
  })

  it('redirects to login when favorite is tapped while logged out', () => {
    ;(useSession as jest.Mock).mockReturnValueOnce([{ auth: false, user: null, token: null }, {}])
    const defaults = require('../../../../../../jest/helpers/m3DiscoveryDefaults').businessControllerUiDefaults
    const navigation = { navigate: jest.fn() }
    const { UNSAFE_getAllByType } = renderWithProviders(
      <BusinessControllerUI
        {...defaults}
        favoriteView
        navigation={navigation}
      />
    )
    const { TouchableOpacity } = require('react-native')
    // The heart is the card's only TouchableOpacity (the card presses through PressableScale).
    fireEvent.press(UNSAFE_getAllByType(TouchableOpacity)[0])
    expect(navigation.navigate).toHaveBeenCalledWith('Login')
  })

  it('shows closed toast when tapping a closed business without preorder', () => {
    ;(useConfig as jest.Mock).mockReturnValueOnce([{
      loading: false,
      configs: { preorder_status_enabled: { value: '0' } }
    }])
    const defaults = require('../../../../../../jest/helpers/m3DiscoveryDefaults')
    const business = { ...defaults.sampleBusiness, open: false }
    const showToast = jest.fn()
    ;(useToast as jest.Mock).mockReturnValue([, { showToast }])
    const { getByTestId } = renderWithProviders(
      <BusinessControllerUI
        {...defaults.businessControllerUiDefaults}
        business={business}
        isBusinessOpen={false}
      />
    )
    fireEvent.press(getByTestId('business-card'))
    expect(showToast).toHaveBeenCalled()
  })

  it('navigates to preorder flow for closed businesses when enabled', () => {
    const defaults = require('../../../../../../jest/helpers/m3DiscoveryDefaults')
    const business = { ...defaults.sampleBusiness, open: false }
    const navigation = { navigate: jest.fn() }
    const { getByTestId } = renderWithProviders(
      <BusinessControllerUI
        {...defaults.businessControllerUiDefaults}
        business={business}
        isBusinessOpen={false}
        navigation={navigation}
      />
    )
    fireEvent.press(getByTestId('business-card'))
    expect(navigation.navigate).toHaveBeenCalledWith('MomentOption', expect.any(Object))
  })

  it('uses search card layout when businessListingSearchview is enabled', () => {
    const defaults = require('../../../../../../jest/helpers/m3DiscoveryDefaults').businessControllerUiDefaults
    const { getByText } = renderWithProviders(
      <BusinessControllerUI {...defaults} businessListingSearchview />
    )
    expect(getByText('Pizza Place')).toBeTruthy()
  })

  it('hides the card pieces the theme hides (business_card.*)', () => {
    const defaults = require('../../../../../../jest/helpers/m3DiscoveryDefaults').businessControllerUiDefaults
    const { defaultAppTheme } = require('../../../../../theme/engine')
    const base = defaultAppTheme()
    const values = { ...base.values, visibility: { ...base.values.visibility, 'business_card.distance': false } }
    const shown = renderWithProviders(<BusinessControllerUI {...defaults} />)
    expect(shown.queryByText(/1\.2/)).toBeTruthy()
    const hidden = renderWithProviders(<BusinessControllerUI {...defaults} />, { themeOverrides: { values } })
    expect(hidden.queryByText(/1\.2/)).toBeNull()
  })

  it('hides the distance in a listing without an address, whatever the API sent', () => {
    const defaults = require('../../../../../../jest/helpers/m3DiscoveryDefaults').businessControllerUiDefaults
    const withAddress = renderWithProviders(<BusinessControllerUI {...defaults} />)
    expect(withAddress.queryByText(/1\.2/)).toBeTruthy()
    const without = renderWithProviders(<BusinessControllerUI {...defaults} hideDistance />)
    expect(without.queryByText(/1\.2/)).toBeNull()
  })

  it('draws the card again when hideDistance changes (the memo compares it)', () => {
    const defaults = require('../../../../../../jest/helpers/m3DiscoveryDefaults').businessControllerUiDefaults
    const view = renderWithProviders(<BusinessControllerUI {...defaults} />)
    expect(view.queryByText(/1\.2/)).toBeTruthy()
    view.rerender(<BusinessControllerUI {...defaults} hideDistance />)
    expect(view.queryByText(/1\.2/)).toBeNull()
  })

  describe('the details row (business_card.base.meta_order, meta_images)', () => {
    const defaults = () => require('../../../../../../jest/helpers/m3DiscoveryDefaults').businessControllerUiDefaults
    const { withTheme } = require('../../../../../../jest/helpers/themeWith')
    const texts = (view: any) => view.UNSAFE_getAllByType(require('react-native').Text).map((node: any) => [].concat(node.props.children).join(''))
    const position = (view: any, pattern: RegExp) => texts(view).findIndex((text: string) => pattern.test(text))
    const images = (view: any) => view.UNSAFE_root.findAll((node: any) => typeof node.type === 'string' && node.props?.source?.uri?.includes('det-'))

    it('lists the time and the distance in the order of today by default, with icons', () => {
      const view = renderWithProviders(<BusinessControllerUI {...defaults()} />)
      expect(position(view, /min/)).toBeGreaterThan(-1)
      expect(position(view, /min/)).toBeLessThan(position(view, /1\.2/))
      expect(images(view)).toHaveLength(0)
    })

    it('puts the distance first when the theme says distance_first', () => {
      const view = renderWithProviders(<BusinessControllerUI {...defaults()} />, withTheme({ components: { business_card: { base: { meta_order: 'distance_first' } } } }))
      expect(position(view, /1\.2/)).toBeGreaterThan(-1)
      expect(position(view, /1\.2/)).toBeLessThan(position(view, /min/))
    })

    it('draws the pictures of the theme instead of the icons when meta_images is on', () => {
      const values = {
        components: { business_card: { base: { meta_images: true } } },
        images: { 'icons.business_time': 'https://cdn.test/det-time.png', 'icons.business_distance': 'https://cdn.test/det-distance.png', 'icons.business_fee': 'https://cdn.test/det-fee.png' }
      }
      const view = renderWithProviders(<BusinessControllerUI {...defaults()} />, withTheme(values))
      expect(images(view).length).toBeGreaterThan(0)
    })
  })
})
