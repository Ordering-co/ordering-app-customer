import React from 'react'
import { fireEvent } from '@testing-library/react-native'
import { ScrollView, StyleSheet } from 'react-native'
import { renderWithProviders } from '../../../../../jest/helpers/renderWithProviders'
import { defaultAppTheme } from '../../../../theme/engine'
import { Tabs } from '../Tabs'
import { withTheme } from '../../../../../jest/helpers/themeWith'

jest.mock('@ui', () => ({ OText: require('../../components/shared/OText').default }))

const tabs = [
  { tab: 'a', type: 'a', text: 'First', enabled: true },
  { tab: 'b', type: 'b', text: 'Second', enabled: true }
]

/** A theme whose `orders_page.slots.tabs` picks `variant` at `size`. */
const withSlot = (slot: Record<string, unknown>) => {
  const base: any = defaultAppTheme()
  const components = base.native.components
  return {
    native: {
      ...base.native,
      components: { ...components, orders_page: { ...components.orders_page, slots: { ...components.orders_page.slots, tabs: { component: 'tabs', ...slot } } } }
    }
  }
}

const tabStyle = (utils: any, text: string) => {
  let node = utils.getByText(text)
  while (node && node.props.accessibilityRole !== 'tab') node = node.parent
  return StyleSheet.flatten(node.props.style)
}

describe('Tabs', () => {
  it('outside a group, the theme variant at size md', () => {
    const theme: any = defaultAppTheme()
    const utils = renderWithProviders(<Tabs defaultTab='a' defaultTabs={tabs} handleChangeTab={jest.fn()} />)
    const tab = theme.native.components.tabs
    expect(tabStyle(utils, 'First')).toMatchObject({ minHeight: tab.sizes.md.height, backgroundColor: tab.variants[tab.base.variant].active_background })
  })

  it("in a group, the slot's size and variant", () => {
    const theme: any = defaultAppTheme()
    const tab = theme.native.components.tabs
    const utils = renderWithProviders(
      <Tabs group='orders_page' slot='tabs' defaultTab='a' defaultTabs={tabs} handleChangeTab={jest.fn()} />,
      { themeOverrides: withSlot({ size: 'lg', variant: 'underline' }) }
    )
    const selected = tabStyle(utils, 'First')
    expect(selected.minHeight).toBe(tab.sizes.lg.height)
    expect(selected.borderBottomColor).toBe(tab.variants.underline.indicator)
  })

  describe('the order type switch (header group)', () => {
    const renderSwitch = (values: any) => renderWithProviders(
      <Tabs group='header' slot='order_type' defaultTab='a' defaultTabs={tabs} handleChangeTab={jest.fn()} />,
      withTheme(values)
    )
    const pillTabs = (pill: Record<string, unknown>) => ({ components: { tabs: { variants: { pill } } } })
    const ownLook = (scope: Record<string, unknown>, own = true) => ({
      components: { header: { base: { order_type_own_look: own }, scope: { tabs: { variants: { pill: scope } } } } }
    })

    it('follows the project pill tabs by default', () => {
      const utils = renderSwitch(pillTabs({ active_background: '#123456' }))
      expect(tabStyle(utils, 'First').backgroundColor).toBe('#123456')
    })

    it('uses its own look when header.base.order_type_own_look is on', () => {
      const utils = renderSwitch({ components: { ...pillTabs({ active_background: '#123456' }).components, ...ownLook({ active_background: '#654321' }).components } })
      expect(tabStyle(utils, 'First').backgroundColor).toBe('#654321')
    })

    it('ignores the scope while the option is off', () => {
      const utils = renderSwitch({ components: { ...pillTabs({ active_background: '#123456' }).components, ...ownLook({ active_background: '#654321' }, false).components } })
      expect(tabStyle(utils, 'First').backgroundColor).toBe('#123456')
    })
  })

  it('scrolls by default: the tabs take their own width', () => {
    const utils = renderWithProviders(<Tabs defaultTab='a' defaultTabs={tabs} handleChangeTab={jest.fn()} />)
    expect(utils.UNSAFE_queryAllByType(ScrollView)).toHaveLength(1)
    expect(tabStyle(utils, 'First').flex).toBeUndefined()
    expect(tabStyle(utils, 'Second').flex).toBeUndefined()
  })

  it('stretched, has no scroll and its tabs share the width', () => {
    const handleChangeTab = jest.fn()
    const utils = renderWithProviders(<Tabs stretch defaultTab='a' defaultTabs={tabs} handleChangeTab={handleChangeTab} />)
    expect(utils.UNSAFE_queryAllByType(ScrollView)).toHaveLength(0)
    expect(tabStyle(utils, 'First').flex).toBe(1)
    expect(tabStyle(utils, 'Second').flex).toBe(1)
    expect(utils.getAllByRole('tab').map((tab: any) => tab.props.accessibilityState.selected)).toEqual([true, false])
    fireEvent.press(utils.getByText('Second'))
    expect(handleChangeTab).toHaveBeenCalledWith('b')
  })
})
