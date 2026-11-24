import '../../../../../../../../jest/helpers/registerM3NativeMocks'

import React from 'react'
import { StyleSheet } from 'react-native'
import { fireEvent, within } from '@testing-library/react-native'

import { HeaderContent } from '../HeaderContent'
import { Search } from '../styles'
import { renderWithProviders } from '../../../../../../../../jest/helpers/renderWithProviders'
import { themeWith, withTheme } from '../../../../../../../../jest/helpers/themeWith'
import { setNativeFeatures } from '../../../../../../../utils/nativeKeys'
import { goHome } from '@/navigators/appNavigation'
import { defaultAppTheme } from '@/theme/engine'
import { themeColor, themeImage, themeSpace } from '@/theme/helpers'

jest.mock('@/navigators/appNavigation', () => ({
  ...jest.requireActual('@/navigators/appNavigation'),
  goHome: jest.fn()
}))

jest.mock('@components', () => require('../../../../../../../../jest/helpers/m3DiscoveryComponentsMock').getMock())
jest.mock('@ui', () => require('../../../../../../../../jest/helpers/m3DiscoveryUiMock').getUiMock())

describe('HeaderContent: the map of businesses', () => {
  const navigation = { navigate: jest.fn() }
  const renderHeader = () => renderWithProviders(
    <HeaderContent
      navigation={navigation}
      orderState={{ loading: false, options: { type: 1, address: { address: '123 Main St' } }, carts: {} }}
      configs={{}}
      showBusinessSearchMap
    />
  )

  beforeEach(() => jest.clearAllMocks())
  afterEach(() => setNativeFeatures(undefined))

  it('opens from its button with the app\'s Google Maps key', () => {
    setNativeFeatures({ googleMaps: true })
    const { getByLabelText } = renderHeader()
    fireEvent.press(getByLabelText('Map'))
    expect(navigation.navigate).toHaveBeenCalledWith('BusinessSearchMap')
  })

  it('has no button without the key (the screen is only a native map); the order type stays', () => {
    setNativeFeatures({ googleMaps: false })
    const { queryByLabelText, getByText } = renderHeader()
    expect(queryByLabelText('Map')).toBeNull()
    expect(getByText('Delivery')).toBeTruthy()
  })
})

describe('HeaderContent: the title, the cart and the address', () => {
  const navigation = { navigate: jest.fn() }
  const longName = 'A very long business name that cannot fit the bar of any phone, franchise and branch'
  // The `useOrder` mock ignores props: the order (address and carts) is set on it.
  const render = (props: any = {}, carts: any = {}, options?: any) => {
    require('@components').useOrder.mockReturnValue([
      { loading: false, options: { type: 1, address: { address: '123 Main St' } }, carts },
      { changeCityFilter: jest.fn(), handleOrderStateLoading: jest.fn() }
    ])
    return renderWithProviders(
      <HeaderContent navigation={navigation} configs={{}} onHandleCart={jest.fn()} {...props} />,
      options
    )
  }
  const cartOf = (quantity: number) => ({ 'businessId:1': { products: [{ quantity }] } })

  it('keeps a long title on one line, so the bar never grows', () => {
    const { getByText } = render({ title: longName, hideAddress: true })
    expect(getByText(longName).props.numberOfLines).toBe(1)
  })

  describe('the alignment of the title (header.base.title_align)', () => {
    const flat = (node: any) => Object.assign({}, ...[].concat(node.props.style).flat(Infinity).filter(Boolean))

    it('follows the titles of the app by default', () => {
      expect(flat(render({ title: 'Stores', hideAddress: true }).getByText('Stores')).textAlign).toBe('auto')
      expect(flat(render({ title: 'Stores', hideAddress: true }, {}, withTheme({ components: { section_header: { base: { align: 'end' } } } })).getByText('Stores')).textAlign).toBe('right')
    })

    it('centers it when the theme says so', () => {
      const values = { components: { header: { base: { title_align: 'center' } }, section_header: { base: { align: 'start' } } } }
      expect(flat(render({ title: 'Stores', hideAddress: true }, {}, withTheme(values)).getByText('Stores')).textAlign).toBe('center')
    })

    it('centers it only on the store with center_business', () => {
      const values = { components: { header: { base: { title_align: 'center_business' } }, section_header: { base: { align: 'start' } } } }
      expect(flat(render({ title: 'Stores', hideAddress: true }, {}, withTheme(values)).getByText('Stores')).textAlign).toBe('auto')
      expect(flat(render({ title: 'Stores', hideAddress: true, centerTitle: true }, {}, withTheme(values)).getByText('Stores')).textAlign).toBe('center')
    })

    it('ignores the store indicator by default', () => {
      expect(flat(render({ title: 'Stores', hideAddress: true, centerTitle: true }).getByText('Stores')).textAlign).toBe('auto')
    })
  })

  it('draws the cart glyph at the size of the theme, not the button\'s', () => {
    const { getByLabelText } = render()
    const glyph = getByLabelText('Cart').findAll((node: any) => node.props?.name === 'basket')[0]
    expect(glyph.props.size).toBeGreaterThan(20)
  })

  it('shows the count as a badge, "99+" from 100 products, and none without products', () => {
    expect(render({}, cartOf(3)).getByText('3')).toBeTruthy()
    expect(render({}, cartOf(12)).getByText('12')).toBeTruthy()
    expect(render({}, cartOf(150)).getByText('99+')).toBeTruthy()
    expect(render().queryByText('0')).toBeNull()
  })

  it('reads the address from its own text role (`header.address_text`), larger than the order options', () => {
    const { getByText } = render()
    const flat = (node: any) => Object.assign({}, ...[].concat(node.props.style).flat(Infinity).filter(Boolean))
    expect(flat(getByText('123 Main St')).fontSize).toBeGreaterThan(flat(getByText('Delivery')).fontSize)
  })
})

describe('HeaderContent: the options of the listing header', () => {
  const navigation = { navigate: jest.fn() }
  const flat = (node: any) => StyleSheet.flatten(node.props.style)
  const render = (props: any = {}, options?: any) => {
    require('@components').useOrder.mockReturnValue([
      { loading: false, options: { type: 1, address: { address: '123 Main St' } }, carts: {} },
      { changeCityFilter: jest.fn(), handleOrderStateLoading: jest.fn() }
    ])
    return renderWithProviders(
      <HeaderContent navigation={navigation} configs={{}} onHandleCart={jest.fn()} {...props} />,
      options
    )
  }

  beforeEach(() => jest.clearAllMocks())

  describe('the filled band (header.base.fill_listing)', () => {
    const filled = { components: { header: { base: { fill_listing: true, background: '#102030' } } } }

    it('has no band by default, even where it can be filled', () => {
      expect(render({ fillable: true }).queryByTestId('header-band')).toBeNull()
    })

    it('has no band where it cannot be filled, with the option on', () => {
      const { queryByTestId, getByText } = render({}, withTheme(filled))
      expect(queryByTestId('header-band')).toBeNull()
      expect(getByText('123 Main St')).toBeTruthy()
    })

    it('wraps the header in a band of its background when the option is on', () => {
      const { getByTestId, getByText, getByLabelText } = render({ fillable: true }, withTheme(filled))
      expect(flat(getByTestId('header-band')).backgroundColor).toBe(themeWith(filled).native.components.header.base.background)
      expect(getByText('123 Main St')).toBeTruthy()
      expect(getByLabelText('Cart')).toBeTruthy()
    })

    it('keeps the space under the band, and drops it when flush', () => {
      const margin = (props: any) => flat(render({ fillable: true, title: 'Stores', hideAddress: true, ...props }, withTheme(filled)).getByTestId('header-band')).marginBottom
      expect(margin({})).toBeGreaterThan(0)
      expect(margin({ flush: true })).toBe(0)
    })

    it('keeps the safe-area inset inside the band where the band covers it', () => {
      const plain = flat(render({ fillable: true }, withTheme(filled)).getByTestId('header-band'))
      const covering = flat(render({ fillable: true, coversInset: true }, withTheme(filled)).getByTestId('header-band'))
      expect(plain.paddingTop).toBeUndefined()
      expect(typeof covering.paddingTop).toBe('number')
    })
  })

  describe('the logo row (showLogo) and its badge (images.header_badge)', () => {
    const badge = { images: { header_badge: 'https://example.com/b.png' } }

    it('has no logo row by default, and the bar stays', () => {
      const { queryByTestId, UNSAFE_queryAllByType } = render({}, withTheme(badge))
      expect(queryByTestId('header-logo-row')).toBeNull()
      expect(queryByTestId('header-badge')).toBeNull()
      expect(UNSAFE_queryAllByType(Search)).toHaveLength(1)
    })

    it('shows the logotype of the theme, without a badge the theme does not have', () => {
      const { getByTestId, queryByTestId } = render({ showLogo: true })
      const images = getByTestId('header-logo-row').findAll((node: any) => node.props?.testID === 'fast-image' && typeof node.type === 'string')
      expect(images).toHaveLength(1)
      expect(images[0].props.source).toEqual(themeImage(defaultAppTheme(), 'logotype'))
      expect(queryByTestId('header-badge')).toBeNull()
      expect(flat(getByTestId('header-logo-row')).justifyContent).not.toBe('space-between')
    })

    it('shows the badge of the theme at the other end of the row', () => {
      const { getByTestId } = render({ showLogo: true }, withTheme(badge))
      expect(getByTestId('header-badge').props.source).toEqual({ uri: 'https://example.com/b.png' })
      expect(flat(getByTestId('header-logo-row')).justifyContent).toBe('space-between')
    })

    it('skips the bar when the logo shows and it would be empty', () => {
      const { getByTestId, UNSAFE_queryAllByType } = render({ showLogo: true, hideAddress: true, onHandleCart: undefined })
      expect(getByTestId('header-logo-row')).toBeTruthy()
      expect(UNSAFE_queryAllByType(Search)).toHaveLength(0)
    })

    it.each([
      ['a back button', { onGoBack: jest.fn() }],
      ['a title', { title: 'Stores' }],
      ['the address', { hideAddress: false }],
      ['the cart', { onHandleCart: jest.fn() }]
    ])('keeps the bar under the logo for %s', (_name, props) => {
      const { getByTestId, UNSAFE_queryAllByType } = render({ showLogo: true, hideAddress: true, onHandleCart: undefined, ...props })
      expect(getByTestId('header-logo-row')).toBeTruthy()
      expect(UNSAFE_queryAllByType(Search)).toHaveLength(1)
    })

    it('keeps the empty bar without the logo, as before', () => {
      const { UNSAFE_queryAllByType } = render({ hideAddress: true, onHandleCart: undefined })
      expect(UNSAFE_queryAllByType(Search)).toHaveLength(1)
    })
  })

  describe('the search field (showSearch)', () => {
    it('has none by default', () => {
      expect(render().queryByTestId('header-search')).toBeNull()
    })

    it('opens the search of businesses in the tabs and is not typed in', () => {
      const { getByTestId, getByPlaceholderText } = render({ showSearch: true })
      expect(getByPlaceholderText('Search Businesses')).toBeTruthy()
      fireEvent.press(getByTestId('header-search'))
      expect(goHome).toHaveBeenCalledTimes(1)
      expect(goHome).toHaveBeenCalledWith(navigation, { screen: 'BusinessSearch' })
    })
  })

  describe('the cart image (images.icons.cart)', () => {
    const glyphs = (button: any) => button.findAll((node: any) => node.props?.name === 'basket')

    it('draws the basket glyph by default', () => {
      const { getByLabelText, queryByTestId } = render()
      expect(queryByTestId('header-cart-image')).toBeNull()
      expect(glyphs(getByLabelText('Cart')).length).toBeGreaterThan(0)
    })

    it('draws the image of the theme instead of the glyph, at the cart icon size, and still opens the cart', () => {
      const onHandleCart = jest.fn()
      const theme = { images: { 'icons.cart': 'https://example.com/c.png' } }
      const { getByLabelText, getByTestId } = render({ onHandleCart }, withTheme(theme))
      const image = getByTestId('header-cart-image')
      const size = themeWith(theme).native.components.header.base.cart_icon_size
      expect(image.props.source).toEqual({ uri: 'https://example.com/c.png' })
      expect(flat(image)).toMatchObject({ width: size, height: size })
      expect(glyphs(getByLabelText('Cart'))).toHaveLength(0)
      fireEvent.press(getByLabelText('Cart'))
      expect(onHandleCart).toHaveBeenCalledTimes(1)
    })
  })
})

describe('HeaderContent: the filled band of the home and of the cart', () => {
  const navigation = { navigate: jest.fn() }
  const flat = (node: any) => StyleSheet.flatten(node.props.style)
  const filled = (header: Record<string, unknown> = {}, cart?: Record<string, unknown>) => ({
    components: { header: { base: { fill_listing: true, ...header } }, ...(cart && { cart: { base: cart } }) }
  })
  const render = (props: any = {}, options?: any) => {
    require('@components').useOrder.mockReturnValue([
      { loading: false, options: { type: 1, address: { address: '123 Main St' } }, carts: {} },
      { changeCityFilter: jest.fn(), handleOrderStateLoading: jest.fn() }
    ])
    return renderWithProviders(
      <HeaderContent navigation={navigation} configs={{}} onHandleCart={jest.fn()} {...props} />,
      options
    )
  }

  beforeEach(() => jest.clearAllMocks())

  describe('where the order options of the cart go (cart.base.context_position)', () => {
    const cartHead = { fillable: true, isCart: true, onGoBack: jest.fn() }

    it('keeps them inside the band by default', () => {
      const utils = render(cartHead, withTheme(filled()))
      expect(within(utils.getByTestId('header-band')).getByText('Delivery')).toBeTruthy()
      expect(utils.getAllByText('Delivery')).toHaveLength(1)
    })

    it('keeps them inside the band for the header option', () => {
      const utils = render(cartHead, withTheme(filled({}, { context_position: 'header' })))
      expect(within(utils.getByTestId('header-band')).getByText('Delivery')).toBeTruthy()
    })

    it('draws them on the page, under the band, for the page option', () => {
      const utils = render(cartHead, withTheme(filled({}, { context_position: 'page' })))
      const band = utils.getByTestId('header-band')
      expect(within(band).queryByText('Delivery')).toBeNull()
      expect(utils.getAllByText('Delivery')).toHaveLength(1)
      expect(within(band).getByLabelText('Go back')).toBeTruthy()
      expect(within(band).getByText('123 Main St')).toBeTruthy()
    })

    it('still opens the order types from the page', () => {
      const utils = render(cartHead, withTheme(filled({}, { context_position: 'page' })))
      fireEvent.press(utils.getByText('Delivery'))
      expect(navigation.navigate).toHaveBeenCalledWith('OrderTypes', expect.anything())
    })

    it('leaves the heads that are not the cart as they were', () => {
      const utils = render({ fillable: true }, withTheme(filled({}, { context_position: 'page' })))
      expect(within(utils.getByTestId('header-band')).getByText('Delivery')).toBeTruthy()
      expect(utils.getAllByText('Delivery')).toHaveLength(1)
    })

    it('changes nothing in a cart head without the band', () => {
      const page = { components: { cart: { base: { context_position: 'page' } } } }
      const plain = render(cartHead)
      const moved = render(cartHead, withTheme(page))
      expect(moved.queryByTestId('header-band')).toBeNull()
      expect(moved.getAllByText('Delivery')).toHaveLength(1)
      expect(JSON.stringify(moved.toJSON())).toBe(JSON.stringify(plain.toJSON()))
    })
  })

  describe('the order type of a head whose screen has its own switch (hideOrderType)', () => {
    it('shows the order type by default', () => {
      expect(render().getByText('Delivery')).toBeTruthy()
    })

    it('leaves the order type out, and keeps the address and the cart', () => {
      const utils = render({ hideOrderType: true })
      expect(utils.queryByText('Delivery')).toBeNull()
      expect(utils.getByText('123 Main St')).toBeTruthy()
      expect(utils.getByLabelText('Cart')).toBeTruthy()
    })

    it('leaves it out of a filled band too', () => {
      const utils = render({ hideOrderType: true, fillable: true }, withTheme(filled()))
      expect(utils.getByTestId('header-band')).toBeTruthy()
      expect(utils.queryByText('Delivery')).toBeNull()
    })
  })

  describe('the sheet under the band of the home (header.base.sheet_radius)', () => {
    const rounded = filled({ sheet_radius: 24 })

    it('has no sheet by default, and the band keeps its space under it', () => {
      const utils = render({ fillable: true }, withTheme(filled()))
      const band = flat(utils.getByTestId('header-band'))
      expect(utils.queryByTestId('header-sheet')).toBeNull()
      expect(band.marginBottom).toBe(themeSpace(themeWith(filled()), 'sm'))
      expect(band.paddingBottom).toBeUndefined()
    })

    it('caps the band of the home with the page, rounded at the top by the radius', () => {
      const utils = render({ fillable: true }, withTheme(rounded))
      const radius = themeWith(rounded).native.components.header.base.sheet_radius
      const sheet = utils.getByTestId('header-sheet')
      expect(radius).toBe(24)
      expect(flat(sheet)).toMatchObject({
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: radius,
        borderTopLeftRadius: radius,
        borderTopRightRadius: radius,
        backgroundColor: themeColor(themeWith(rounded), 'background')
      })
      expect(sheet.props.pointerEvents).toBe('none')
      expect(within(utils.getByTestId('header-band')).getByTestId('header-sheet')).toBeTruthy()
    })

    it('makes room for the sheet inside the band, which loses its space under it', () => {
      const band = flat(render({ fillable: true }, withTheme(rounded)).getByTestId('header-band'))
      expect(band.paddingBottom).toBe(24)
      expect(band.marginBottom ?? 0).toBe(0)
    })

    it('is only its background over the page: no border and no shadow under it', () => {
      const values = filled({ sheet_radius: 24, background: '#102030' })
      const theme = themeWith(values)
      const band = flat(render({ fillable: true }, withTheme(values)).getByTestId('header-band'))
      expect(band).toEqual({ zIndex: 1, backgroundColor: theme.native.components.header.base.background, paddingBottom: 24 })
    })

    it('keeps the safe-area inset inside the band with a sheet', () => {
      const band = flat(render({ fillable: true, coversInset: true }, withTheme(rounded)).getByTestId('header-band'))
      expect(typeof band.paddingTop).toBe('number')
      expect(band.paddingBottom).toBe(24)
    })

    it('keeps the logo, the address and the cart in the band with a sheet', () => {
      const utils = render({ fillable: true, showLogo: true }, withTheme(rounded))
      const band = within(utils.getByTestId('header-band'))
      expect(band.getByTestId('header-logo-row')).toBeTruthy()
      expect(band.getByText('123 Main St')).toBeTruthy()
      expect(band.getByLabelText('Cart')).toBeTruthy()
      expect(band.getByText('Delivery')).toBeTruthy()
    })

    it.each([
      ['a head with a back button', { fillable: true, onGoBack: jest.fn() }],
      ['a head with a title and no back button', { fillable: true, title: 'Stores' }],
      ['a head with a title and a back button', { fillable: true, title: 'Stores', onGoBack: jest.fn() }],
      ['the head of the cart', { fillable: true, isCart: true }]
    ])('has no sheet in %s', (_name, props) => {
      const utils = render(props, withTheme(rounded))
      const band = flat(utils.getByTestId('header-band'))
      expect(utils.queryByTestId('header-sheet')).toBeNull()
      expect(band.paddingBottom).toBeUndefined()
      expect(band.marginBottom).toBe(themeSpace(themeWith(rounded), 'sm'))
    })

    it('has no sheet where the head cannot be filled', () => {
      const utils = render({}, withTheme(rounded))
      expect(utils.queryByTestId('header-band')).toBeNull()
      expect(utils.queryByTestId('header-sheet')).toBeNull()
    })

    it('has no sheet without the filled band, with the radius alone', () => {
      const utils = render({ fillable: true }, withTheme({ components: { header: { base: { sheet_radius: 24 } } } }))
      expect(utils.queryByTestId('header-band')).toBeNull()
      expect(utils.queryByTestId('header-sheet')).toBeNull()
    })
  })
})
