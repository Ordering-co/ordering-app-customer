import '../../../../../../jest/helpers/registerM3NativeMocks'

import React from 'react'
import { StyleSheet, Text } from 'react-native'
import { fireEvent } from '@testing-library/react-native'

import OText from '../OText'
import { BackButton } from '../styles'
import { FilterChip } from '../../BusinessListingSearch/FilterChip'
import NavBar from '../../NavBar'
import { defaultAppTheme, buildAppTheme } from '@/theme/engine'
import { reservedBorder, themeFontFamily, themeGutter, themeSpace } from '@/theme/helpers'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

jest.mock('@components', () => require('../../../../../../jest/helpers/m3DiscoveryComponentsMock').getMock())
jest.mock('@ui', () => require('../../../../../../jest/helpers/m3DiscoveryUiMock').getUiMock())

const flat = (node: any) => StyleSheet.flatten(node.props.style)

describe('reservedBorder', () => {
  const thick = { borderWidth: 2, borderStyle: 'solid', borderColor: '#111111' }
  it('gives every state the widest border, see-through where the state has none', () => {
    const ring = reservedBorder([{ border: null }, { border: thick }])
    expect(ring({ border: null })).toEqual({ borderWidth: 2, borderStyle: 'solid', borderColor: 'transparent' })
    expect(ring({ border: thick })).toEqual(thick)
  })
  it('falls back to the base border, and is empty when no state has one', () => {
    expect(reservedBorder([{ border: thick }])(null, { border: thick })).toEqual(thick)
    expect(reservedBorder([{ border: null }, null])({ border: null })).toEqual({})
  })
})

describe('OText weight over a component look', () => {
  it('paints the look\'s font at the weight given, instead of dropping the weight', () => {
    const theme: any = defaultAppTheme()
    const look = { fontFamily: themeFontFamily(theme, 'body', 400), fontSize: 14 }
    const { UNSAFE_getByType } = renderWithProviders(<OText style={look} weight={700}>x</OText>)
    const style = StyleSheet.flatten(UNSAFE_getByType(Text).props.style)
    expect(style.fontFamily).toBe(themeFontFamily(theme, 'body', 700))
    expect(style.fontSize).toBe(14)
  })
})

describe('FilterChip states', () => {
  // A theme whose selected chip draws a border (none at rest).
  const theme = buildAppTheme({
    version: 2,
    values: { components: { chip: { variants: { default: { states: { selected: { border: { width: 2, color: '#123456', style: 'solid' } } } } } } } }
  }) as any
  it('keeps the selected border\'s room when not selected: selecting never resizes the chip', () => {
    const render = (selected: boolean) => renderWithProviders(<FilterChip testID='chip' text='Food' selected={selected} />, { themeOverrides: theme })
    const off = flat(render(false).getByTestId('chip'))
    const on = flat(render(true).getByTestId('chip'))
    expect(off.borderWidth).toBe(2)
    expect(on.borderWidth).toBe(2)
    expect(off.borderColor).toBe('transparent')
    expect(on.borderColor).toBe('#123456')
    expect(on.height).toBe(off.height)
  })
})

describe('Header back button', () => {
  it('pulls its touch box in so its glyph starts at the page gutter', () => {
    const theme: any = defaultAppTheme()
    const size = theme.native.components.button.sizes[theme.native.components.modal.slots.close.size]
    const { UNSAFE_root } = renderWithProviders(<BackButton onPress={jest.fn()} />)
    const box = UNSAFE_root.findAll((node: any) => node.props?.style && flat(node)?.marginLeft !== undefined)[0]
    expect(flat(box).marginLeft).toBe(-(size.height - size.icon_size) / 2)
  })

  it('NavBar lays the bar on the gutter and the title space.sm after the back', () => {
    const theme: any = defaultAppTheme()
    const onBack = jest.fn()
    const { getByLabelText, getByText, UNSAFE_root } = renderWithProviders(<NavBar title='Help' onActionLeft={onBack} />)
    fireEvent.press(getByLabelText('back'))
    expect(onBack).toHaveBeenCalled()
    expect(getByText('Help')).toBeTruthy()
    const bar = UNSAFE_root.findAll((node: any) => node.props?.style && flat(node)?.paddingHorizontal === themeGutter(theme))
    expect(bar.length).toBeGreaterThan(0)
    const afterBack = UNSAFE_root.findAll((node: any) => node.props?.style && flat(node)?.marginLeft === themeSpace(theme, 'sm'))
    expect(afterBack.length).toBeGreaterThan(0)
  })
})

describe('Bottom tab bar', () => {
  it('is set apart from the content by default: a thin top border in the border color', () => {
    const theme: any = defaultAppTheme()
    const top = theme.native.components.bottom_nav.base.border_top
    expect(top.borderWidth).toBe(theme.native.tokens.border.thin)
    expect(top.borderColor).toBe(theme.native.tokens.color.border)
  })
})

describe('Order context pill', () => {
  it('is one control with the header context text, pressable, chevron optional', () => {
    const { OrderContextPill } = require('../OrderContextPill')
    const theme: any = defaultAppTheme()
    const onPress = jest.fn()
    const { getByText, getByRole } = renderWithProviders(<OrderContextPill text='Delivery' onPress={onPress} />)
    const text = StyleSheet.flatten(getByText('Delivery').props.style)
    expect(text.fontSize).toBe(theme.native.components.header.base.context_text.fontSize)
    fireEvent.press(getByRole('button'))
    expect(onPress).toHaveBeenCalled()
  })
})

describe('Order status badge', () => {
  it('is a soft badge in its tone (subtle fill, text ink), not a solid chip', () => {
    const { OrderStatusBadge } = require('../../SingleOrderCard/orderStatus')
    const theme: any = defaultAppTheme()
    const { getByText, getByTestId } = renderWithProviders(<OrderStatusBadge testID='badge' status={2} label='Rejected' />)
    expect(flat(getByTestId('badge')).backgroundColor).toBe(theme.native.tokens.color.danger_subtle)
    expect(StyleSheet.flatten(getByText('Rejected').props.style).color).toBe(theme.native.tokens.color.danger_text)
  })
})

describe('Business logo placeholder', () => {
  it('sits inside the frame on the quiet fill when there is no logo', () => {
    const { BusinessLogo } = require('../BusinessLogo')
    const theme: any = defaultAppTheme()
    const { getByTestId } = renderWithProviders(<BusinessLogo testID='logo' uri={null} size={50} radius={10} background='#FFFFFF' />)
    expect(flat(getByTestId('logo')).backgroundColor).toBe(theme.native.tokens.color.surface_alt)
  })
})

describe('Wallet row (single and multi checkout)', () => {
  it('shows the name, the balance and its checkbox state, and is pressable', () => {
    const { WalletRow } = require('../../PaymentOptionWallet/WalletRow')
    const onPress = jest.fn()
    const { getByText, getByTestId } = renderWithProviders(
      <WalletRow testID='wallet' type='cash' name='Pay with Cash Wallet' balance='$ 10' checked onPress={onPress} />
    )
    expect(getByText('Pay with Cash Wallet')).toBeTruthy()
    expect(getByText('$ 10')).toBeTruthy()
    fireEvent.press(getByTestId('wallet'))
    expect(onPress).toHaveBeenCalled()
  })
})

describe('FilterChip disabled', () => {
  it('does not answer a press and is dimmed', () => {
    const theme: any = defaultAppTheme()
    const onPress = jest.fn()
    const { getByTestId } = renderWithProviders(<FilterChip testID='chip' text='Cash' disabled onPress={onPress} />)
    fireEvent.press(getByTestId('chip'))
    expect(onPress).not.toHaveBeenCalled()
    expect(flat(getByTestId('chip')).opacity).toBe(theme.native.tokens.opacity.disabled)
  })
})

describe('Home order card', () => {
  it('opens the order as a whole card (no button taking the name\'s room)', () => {
    const { OrderCard } = require('../../OrderProgress/OrderCard')
    const handleGoToOrder = jest.fn()
    const { getByTestId, queryByText } = renderWithProviders(
      <OrderCard
        lastOrder={{ id: 7, uuid: 'u-7', status: 0, delivery_type: 1, business: { name: 'Pizza Place' }, delivery_datetime_utc: '2026-10-17 13:50:00' }}
        statusToShow={[0]}
        progressBarObjt={() => ({ value: 'Pending', percentage: 0.25 })}
        handleGoToOrder={handleGoToOrder}
      />
    )
    expect(queryByText('Go to order')).toBeNull()
    fireEvent.press(getByTestId('order-progress-card'))
    expect(handleGoToOrder).toHaveBeenCalledWith('OrderDetails', { orderId: 'u-7', orderNumberId: 7 })
  })
})
