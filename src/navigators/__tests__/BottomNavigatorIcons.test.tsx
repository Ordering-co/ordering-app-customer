import React from 'react'
import { StyleSheet } from 'react-native'

import BottomNavigator from '../BottomNavigator'
import { renderWithProviders } from '../../../jest/helpers/renderWithProviders'
import { themeWith, withTheme } from '../../../jest/helpers/themeWith'
import { defaultAppTheme } from '@/theme/engine'

jest.mock('@react-navigation/bottom-tabs', () => {
  const { View } = require('react-native')
  return {
    createBottomTabNavigator: () => ({
      Navigator: ({ children }: any) => children,
      Screen: ({ name, options }: any) => (
        <View testID={`tab-${name}`}>
          {options.tabBarButton && <View testID={`tab-${name}-hidden`} />}
          <View testID={`tab-${name}-idle`}>{options.tabBarIcon({ focused: false })}</View>
          <View testID={`tab-${name}-active`}>{options.tabBarIcon({ focused: true })}</View>
        </View>
      )
    })
  }
})

jest.mock('react-native-fast-image', () => {
  const { createElement } = require('react')
  const { View } = require('react-native')
  return { __esModule: true, default: (props: any) => createElement(View, { testID: 'fast-image', ...props }) }
})

const mockSettings: any = {}
jest.mock('../../config', () => ({ __esModule: true, get default() { return mockSettings } }))

jest.mock('@ui', () => ({
  Icon: require('@/ui/src/components/shared/Icon').default,
  ACCOUNT_VALUES: { ACCOUNT: 'account', LOGIN: 'login', SIGNUP: 'signup' }
}))

jest.mock('../appNavigation', () => ({ useLeaveAppOnLogout: jest.fn() }))
jest.mock('../HomeEntry', () => ({ HomeEntry: () => null }))
jest.mock('../../pages/BusinessListingSearch', () => ({ __esModule: true, default: () => null }))
jest.mock('../../pages/MyOrders', () => ({ __esModule: true, default: () => null }))
jest.mock('../../pages/Profile', () => ({ __esModule: true, default: () => null }))
jest.mock('../../pages/Login', () => ({ __esModule: true, default: () => null }))
jest.mock('../../pages/Signup', () => ({ __esModule: true, default: () => null }))
jest.mock('../../pages/ForgotPassword', () => ({ __esModule: true, default: () => null }))
jest.mock('../../pages/Promotions', () => ({ __esModule: true, default: () => null }))

const tabs = [
  ['Home', 'icons.tab_home', 'home-outline'],
  ['Offers', 'icons.tab_offers', 'pricetags-outline'],
  ['BusinessSearch', 'icons.tab_browse', 'search-outline'],
  ['MyOrders', 'icons.tab_orders', 'bag-outline'],
  ['Profile', 'icons.tab_profile', 'person-outline']
]

const renderTabs = (options?: any) => renderWithProviders(<BottomNavigator navigation={{ navigate: jest.fn() }} route={{ params: {} }} />, options)
const glyphsIn = (node: any) => node.findAll((child: any) => typeof child.type === 'string' && !!child.props?.name)
const imagesIn = (node: any) => node.findAll((child: any) => typeof child.type === 'string' && !!child.props?.source)

describe('BottomNavigator: the icons of the tabs (images.icons.tab_*)', () => {
  it.each(tabs)('draws the glyph of %s by default, in the color of its state', (name, _key, glyph) => {
    const nav = defaultAppTheme().native.components.bottom_nav.base
    const utils = renderTabs()
    const idle = glyphsIn(utils.getByTestId(`tab-${name}-idle`))
    const active = glyphsIn(utils.getByTestId(`tab-${name}-active`))
    expect(imagesIn(utils.getByTestId(`tab-${name}`))).toHaveLength(0)
    expect(idle).toHaveLength(1)
    expect(idle[0].props).toMatchObject({ name: glyph, size: nav.icon_size, color: nav.inactive })
    expect(active[0].props).toMatchObject({ name: glyph, size: nav.icon_size, color: nav.active })
  })

  it.each(tabs)('draws the image of the theme for %s in place of its glyph, at the icon size of the bar', (name, key) => {
    const values = { images: { [key]: `https://example.com/${name}.png` } }
    const size = themeWith(values).native.components.bottom_nav.base.icon_size
    const utils = renderTabs(withTheme(values))
    ;['idle', 'active'].forEach((state) => {
      const tab = utils.getByTestId(`tab-${name}-${state}`)
      expect(glyphsIn(tab)).toHaveLength(0)
      expect(imagesIn(tab)).toHaveLength(1)
      expect(imagesIn(tab)[0].props.source).toEqual({ uri: `https://example.com/${name}.png` })
      expect(StyleSheet.flatten(imagesIn(tab)[0].props.style)).toEqual({ width: size, height: size })
    })
  })

  it.each(tabs)('leaves the other tabs with their glyphs when only %s has an image', (name, key) => {
    const utils = renderTabs(withTheme({ images: { [key]: `https://example.com/${name}.png` } }))
    tabs.filter(([other]) => other !== name).forEach(([other, _key, glyph]) => {
      const tab = utils.getByTestId(`tab-${other}-idle`)
      expect(imagesIn(tab)).toHaveLength(0)
      expect(glyphsIn(tab)[0].props.name).toBe(glyph)
    })
  })

  it('draws the five images together', () => {
    const images = Object.fromEntries(tabs.map(([name, key]) => [key, `https://example.com/${name}.png`]))
    const utils = renderTabs(withTheme({ images }))
    tabs.forEach(([name]) => {
      expect(imagesIn(utils.getByTestId(`tab-${name}-idle`))[0].props.source).toEqual({ uri: `https://example.com/${name}.png` })
      expect(glyphsIn(utils.getByTestId(`tab-${name}`))).toHaveLength(0)
    })
  })
})

describe('BottomNavigator: the Browse tab in single business mode', () => {
  afterEach(() => {
    delete mockSettings.businessSlug
  })

  it('shows every tab by default', () => {
    const utils = renderTabs()
    tabs.forEach(([name]) => expect(utils.queryByTestId(`tab-${name}-hidden`)).toBeNull())
  })

  it('keeps Browse in the bar when no business is configured', () => {
    mockSettings.businessSlug = null
    expect(renderTabs().queryByTestId('tab-BusinessSearch-hidden')).toBeNull()
  })

  it('hides Browse and only Browse when a business is configured', () => {
    mockSettings.businessSlug = 1
    const utils = renderTabs()
    expect(utils.queryByTestId('tab-BusinessSearch-hidden')).toBeTruthy()
    tabs.filter(([name]) => name !== 'BusinessSearch').forEach(([name]) => {
      expect(utils.queryByTestId(`tab-${name}-hidden`)).toBeNull()
    })
  })
})
