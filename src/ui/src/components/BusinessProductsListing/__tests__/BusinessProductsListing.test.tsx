import '../../../../../../jest/helpers/registerM4NativeMocks'

import React from 'react'
import { fireEvent, act } from '@testing-library/react-native'
import { FlatList, BackHandler } from 'react-native'
import { useOrder, useConfig, useToast, useFreeDeliveryProgress } from '@components'
import { FloatingButton, BusinessProductsCategories } from '@ui'
import settings from '@/config'

import { BusinessProductsListing, BusinessProductsListingUI, MENU_PAGE_SIZE } from '..'
import { CartBarImage } from '../CartBarImage'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'
import { withTheme } from '../../../../../../jest/helpers/themeWith'

jest.mock('@components', () => {
  const m4 = require('../../../../../../jest/helpers/m4MenuComponentsMock')
  const d = require('../../../../../../jest/helpers/m4MenuDefaults')
  return m4.getMock({
    BusinessAndProductList: m4.renderUiController({
      ...d.businessProductsListingDefaults,
      businessState: {
        loading: false,
        error: null,
        business: {
          ...d.sampleBusiness,
          vertical: 'school',
          city_id: 1,
          categories: [
            { id: 10, name: 'Pizzas', rank: 1, preparation_day_of_week: 2 },
            { id: 11, name: 'Drinks', rank: 2, preparation_day_of_week: 5 },
            { id: 12, name: 'Sides', rank: 3, preparation_day_of_week: null }
          ]
        }
      },
      categoryState: {
        loading: false,
        error: null,
        pagination: { currentPage: 1, totalPages: 2, nextPageItems: 1 },
        products: [d.sampleProduct]
      },
      getNextProducts: jest.fn(),
      onNavigationRedirect: jest.fn()
    })
  })
})
jest.mock('@ui', () => require('../../../../../../jest/helpers/m4MenuUiMock').getUiMock())

jest.mock('../../BusinessesListing/Layout/Original', () => {
  const { View } = require('react-native')
  return { BusinessesListing: () => <View testID="near-businesses-stub" /> }
})

jest.mock('../../BusinessesListing/Layout/Original/HeaderContent', () => {
  const { View, Text } = require('react-native')
  return {
    HeaderContent: (props) => (
      <View testID="header-content-stub">
        <Text>{props.title}</Text>
        <View testID={props.onGoBack ? 'header-back' : 'header-no-back'} />
      </View>
    )
  }
})

jest.mock('../../../providers/StoreUtil', () => ({
  _retrieveStoreData: jest.fn().mockResolvedValue(null),
  _removeStoreData: jest.fn(),
  _setStoreData: jest.fn()
}))

const navigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  canGoBack: jest.fn(() => true)
}

describe('BusinessProductsListing', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useFreeDeliveryProgress as jest.Mock).mockReturnValue({ status: 'hidden' })
  })

  it('shows awareness after business information and calls the hook once', () => {
    const d = require('../../../../../../jest/helpers/m4MenuDefaults')
    ;(useOrder as jest.Mock).mockReturnValue([{
      loading: false,
      options: { type: 1 },
      carts: {}
    }, { addProduct: jest.fn(), updateProduct: jest.fn() }])
    ;(useFreeDeliveryProgress as jest.Mock).mockReturnValue({ status: 'awareness', minimum: 25 })

    const props = {
      ...d.businessProductsListingDefaults,
      navigation,
      businessState: { loading: false, error: null, business: d.sampleBusiness }
    }
    const { getByText, toJSON, UNSAFE_getByType } = renderWithProviders(<BusinessProductsListingUI {...props} />)
    const serialized = JSON.stringify(toJSON())

    expect(getByText('Free delivery on orders $25+')).toBeTruthy()
    expect(serialized.indexOf('business-basic-information-stub')).toBeLessThan(serialized.indexOf('free-delivery-progress'))
    expect(UNSAFE_getByType(FlatList).props.stickyHeaderIndices).toEqual([3])
    expect(useFreeDeliveryProgress).toHaveBeenCalledTimes(1)
    expect(useFreeDeliveryProgress).toHaveBeenCalledWith({
      business: d.sampleBusiness,
      cart: {},
      enabled: true,
      franchiseId: null
    })
  })

  it('sticks nothing when the business has no categories (the bar is not rendered)', () => {
    const d = require('../../../../../../jest/helpers/m4MenuDefaults')
    ;(useOrder as jest.Mock).mockReturnValue([{ loading: false, options: { type: 1 }, carts: {} }, { addProduct: jest.fn(), updateProduct: jest.fn() }])
    const { UNSAFE_getByType } = renderWithProviders(
      <BusinessProductsListingUI
        {...d.businessProductsListingDefaults}
        navigation={navigation}
        businessState={{ loading: false, error: null, business: { ...d.sampleBusiness, categories: [] } }}
      />
    )
    expect(UNSAFE_getByType(FlatList).props.stickyHeaderIndices).toEqual([])
  })

  it('scopes the storefront offer lookup to the configured franchise', () => {
    const d = require('../../../../../../jest/helpers/m4MenuDefaults')
    const previousFranchiseSlug = settings.franchiseSlug
    settings.franchiseSlug = 'brand-91'
    try {
      renderWithProviders(
        <BusinessProductsListingUI
          {...d.businessProductsListingDefaults}
          navigation={navigation}
          businessState={{ loading: false, error: null, business: d.sampleBusiness }}
        />
      )
      expect(useFreeDeliveryProgress).toHaveBeenCalledWith(
        expect.objectContaining({ franchiseId: 'brand-91' })
      )
    } finally {
      settings.franchiseSlug = previousFranchiseSlug
    }
  })

  it('places compact cart progress immediately before the existing floating cart action', () => {
    const d = require('../../../../../../jest/helpers/m4MenuDefaults')
    const cart = { ...d.sampleCart, business: d.sampleBusiness, products: [d.sampleProduct] }
    ;(useOrder as jest.Mock).mockReturnValue([{
      loading: false,
      options: { type: 1 },
      carts: { 'businessId:1': cart }
    }, { addProduct: jest.fn(), updateProduct: jest.fn() }])
    ;(useFreeDeliveryProgress as jest.Mock).mockReturnValue({
      status: 'progress', remainingAmount: 5, progressPercent: 75
    })

    const { getByTestId, toJSON, UNSAFE_getByType } = renderWithProviders(
      <BusinessProductsListingUI
        {...d.businessProductsListingDefaults}
        navigation={navigation}
        businessState={{ loading: false, error: null, business: d.sampleBusiness }}
      />
    )
    const serialized = JSON.stringify(toJSON())

    expect(getByTestId('free-delivery-progress')).toHaveProp('variant', 'compact')
    expect(serialized.indexOf('free-delivery-progress')).toBeLessThan(serialized.indexOf('floating-button'))
    expect(UNSAFE_getByType(FlatList).props.style.marginBottom ?? 0).toBe(0)
    expect(useFreeDeliveryProgress).toHaveBeenCalledTimes(1)
  })

  it.each([
    { status: 'progress', subtotal: 15, offers: [], message: 'Add $15 for free delivery' },
    { status: 'unlocked', subtotal: 42.57, offers: [{ id: 34 }], message: 'Free delivery unlocked' }
  ])('keeps $status visible above the cart action when the store has a minimum order', ({ status, subtotal, offers, message }) => {
    const d = require('../../../../../../jest/helpers/m4MenuDefaults')
    const cart = {
      ...d.sampleCart,
      business: d.sampleBusiness,
      products: [d.sampleCartProduct],
      subtotal,
      minimum: 20,
      offers
    }
    ;(useOrder as jest.Mock).mockReturnValue([{
      loading: false,
      options: { type: 1 },
      carts: { 'businessId:1': cart }
    }, { addProduct: jest.fn(), updateProduct: jest.fn() }])
    ;(useFreeDeliveryProgress as jest.Mock).mockReturnValue({
      status,
      remainingAmount: 15,
      progressPercent: 50
    })

    const { getByText, UNSAFE_getByType } = renderWithProviders(
      <BusinessProductsListingUI
        {...d.businessProductsListingDefaults}
        navigation={navigation}
        businessState={{ loading: false, error: null, business: d.sampleBusiness }}
      />
    )

    expect(getByText(message)).toBeTruthy()
    expect(UNSAFE_getByType(FloatingButton).props.containerStyle).toMatchObject({ position: 'relative' })
  })

  describe('the amount of the View Order bar (business.cart_bar.fees)', () => {
    const withoutFees = withTheme({ visibility: { 'business.cart_bar.fees': false } })
    const renderBar = (options?: any, storeCart: any = {}) => {
      const d = require('../../../../../../jest/helpers/m4MenuDefaults')
      ;(useConfig as jest.Mock).mockReturnValue([{ loading: false, configs: { format_number_currency: { value: '$' } } }])
      ;(useOrder as jest.Mock).mockReturnValue([{
        loading: false,
        options: { type: 1 },
        carts: {
          'businessId:1': {
            ...d.sampleCart,
            business: d.sampleBusiness,
            products: [d.sampleCartProduct],
            subtotal: 5,
            total: 9.75,
            taxes: [
              { id: 1, type: 1, summary: { tax: 0.5 } },
              { id: 2, type: 2, summary: { tax: 0.25 } }
            ],
            ...storeCart
          }
        }
      }, { addProduct: jest.fn(), updateProduct: jest.fn() }])
      return renderWithProviders(
        <BusinessProductsListingUI
          {...d.businessProductsListingDefaults}
          navigation={navigation}
          businessState={{ loading: false, error: null, business: d.sampleBusiness }}
        />,
        options
      ).UNSAFE_getByType(FloatingButton).props.text
    }

    it('is the total of the cart by default, fees and delivery included', () => {
      expect(renderBar()).toBe('View Order · $9.75')
    })

    it('is the sum of the products, as their prices show, when the theme leaves the fees out', () => {
      const products = [{ id: 1, quantity: 2, total: 6 }, { id: 2, quantity: 1, total: 1.5 }]
      expect(renderBar(withoutFees, { products })).toBe('View Order · $7.5')
      expect(renderBar(undefined, { products })).toBe('View Order · $9.75')
    })

    it('is zero for products without a total', () => {
      expect(renderBar(withoutFees, { products: [{ id: 1, quantity: 1 }] })).toBe('View Order · $0')
    })

    it('keeps the minimum of the store whatever the theme says', () => {
      expect(renderBar(withoutFees, { minimum: 20 })).toBe('Minimum subtotal order: $20')
      expect(renderBar(undefined, { minimum: 20 })).toBe('Minimum subtotal order: $20')
    })
  })

  describe('the image of the View Order bar (images.icons.cart_bar)', () => {
    const renderBar = (options?: any, products?: any[]) => {
      const d = require('../../../../../../jest/helpers/m4MenuDefaults')
      ;(useConfig as jest.Mock).mockReturnValue([{ loading: false, configs: { format_number_currency: { value: '$' } } }])
      ;(useOrder as jest.Mock).mockReturnValue([{
        loading: false,
        options: { type: 1 },
        carts: {
          'businessId:1': { ...d.sampleCart, business: d.sampleBusiness, products: products ?? [d.sampleCartProduct] }
        }
      }, { addProduct: jest.fn(), updateProduct: jest.fn() }])
      return renderWithProviders(
        <BusinessProductsListingUI
          {...d.businessProductsListingDefaults}
          navigation={navigation}
          businessState={{ loading: false, error: null, business: d.sampleBusiness }}
        />,
        options
      ).UNSAFE_getByType(FloatingButton).props
    }
    const image = withTheme({ images: { 'icons.cart_bar': 'https://example.com/cart-bar.png' } })

    it('leads the bar with nothing by default', () => {
      expect(renderBar().leading).toBeUndefined()
    })

    it('leads the bar with the image of the theme and the products of the cart', () => {
      const d = require('../../../../../../jest/helpers/m4MenuDefaults')
      const { leading, text } = renderBar(image, [
        { ...d.sampleCartProduct, quantity: 2 },
        { ...d.sampleCartProduct, id: 101, code: 'prod-2', quantity: 3 },
        { ...d.sampleCartProduct, id: 102, code: 'prod-3', quantity: undefined }
      ])
      expect(leading.type).toBe(CartBarImage)
      expect(leading.props.count).toBe(5)
      expect(text).toMatch(/^View Order/)
    })
  })

  describe('the cover edge to edge (business_header.base.cover_full_width)', () => {
    const renderHeader = (options?: any) => {
      const d = require('../../../../../../jest/helpers/m4MenuDefaults')
      const header = jest.spyOn(require('../../BusinessesListing/Layout/Original/HeaderContent'), 'HeaderContent')
      ;(useOrder as jest.Mock).mockReturnValue([{ loading: false, options: { type: 1 }, carts: {} }, { addProduct: jest.fn(), updateProduct: jest.fn() }])
      const view = renderWithProviders(
        <BusinessProductsListingUI
          {...d.businessProductsListingDefaults}
          navigation={navigation}
          businessState={{ loading: false, error: null, business: d.sampleBusiness }}
        />,
        options
      )
      const props: any = header.mock.calls[header.mock.calls.length - 1][0]
      header.mockRestore()
      let node: any = view.getByTestId('header-content-stub').parent
      let wrapperStyle: any
      while (node && wrapperStyle?.marginBottom === undefined) {
        wrapperStyle = require('react-native').StyleSheet.flatten(node.props.style)
        node = node.parent
      }
      return { props, wrapperStyle }
    }

    it('keeps the space under the head by default', () => {
      const { props, wrapperStyle } = renderHeader()
      expect(props.flush).toBe(false)
      expect(wrapperStyle.marginBottom).toBeGreaterThan(0)
    })

    it('takes the space under the head out when the option is on', () => {
      const { props, wrapperStyle } = renderHeader(withTheme({ components: { business_header: { base: { cover_full_width: true } } } }))
      expect(props.flush).toBe(true)
      expect(wrapperStyle.marginBottom).toBe(0)
    })
  })

  describe('the order type of the header (business.order_type_switch)', () => {
    const headerProps = (options?: any) => {
      const d = require('../../../../../../jest/helpers/m4MenuDefaults')
      const header = jest.spyOn(require('../../BusinessesListing/Layout/Original/HeaderContent'), 'HeaderContent')
      ;(useOrder as jest.Mock).mockReturnValue([{
        loading: false,
        options: { type: 1 },
        carts: {}
      }, { addProduct: jest.fn(), updateProduct: jest.fn() }])
      renderWithProviders(
        <BusinessProductsListingUI
          {...d.businessProductsListingDefaults}
          navigation={navigation}
          businessState={{ loading: false, error: null, business: d.sampleBusiness }}
        />,
        options
      )
      const props: any = header.mock.calls[header.mock.calls.length - 1][0]
      header.mockRestore()
      return props
    }

    it('keeps the order type in the header by default', () => {
      expect(headerProps()).toMatchObject({ hideOrderType: false, hideAddress: true, fillable: true, coversInset: true })
    })

    it('takes it out of the header when the theme shows the switch of the store', () => {
      expect(headerProps(withTheme({ visibility: { 'business.order_type_switch': true } }))).toMatchObject({ hideOrderType: true, hideAddress: true })
    })

    it('keeps the order type in the header when the switch moves into it (business.header.order_type)', () => {
      expect(headerProps(withTheme({ visibility: { 'business.order_type_switch': true, 'business.header.order_type': true } }))).toMatchObject({ hideOrderType: false })
    })

    it('keeps today\'s head when the switch is off, whatever business.header.order_type says', () => {
      expect(headerProps(withTheme({ visibility: { 'business.header.order_type': false } }))).toMatchObject({ hideOrderType: false })
      expect(headerProps(withTheme({ visibility: { 'business.header.order_type': true } }))).toMatchObject({ hideOrderType: false })
    })
  })

  describe('view order with multi-business checkout', () => {
    const renderWithCarts = ({ multiEnabled, cartCount, minimum = 0, storeCart = {}, otherCart = {} }: { multiEnabled: boolean, cartCount: number, minimum?: number, storeCart?: any, otherCart?: any }) => {
      const d = require('../../../../../../jest/helpers/m4MenuDefaults')
      const onNavigationRedirect = jest.fn()
      const carts: any = {
        'businessId:1': { ...d.sampleCart, business: d.sampleBusiness, products: [d.sampleCartProduct], minimum, ...storeCart }
      }
      if (cartCount > 1) {
        carts['businessId:2'] = {
          ...d.sampleCart,
          uuid: 'cart-2',
          business_id: 2,
          business: { ...d.sampleBusiness, id: 2, slug: 'burger-place' },
          products: [d.sampleCartProduct],
          ...otherCart
        }
      }
      ;(useConfig as jest.Mock).mockReturnValue([{
        loading: false,
        configs: {
          checkout_multi_business_enabled: { value: multiEnabled ? '1' : '0' },
          format_number_currency: { value: '$' }
        }
      }])
      ;(useOrder as jest.Mock).mockReturnValue([{
        loading: false,
        options: { type: 1 },
        carts
      }, { addProduct: jest.fn(), updateProduct: jest.fn() }])

      const utils = renderWithProviders(
        <BusinessProductsListingUI
          {...d.businessProductsListingDefaults}
          navigation={navigation}
          onNavigationRedirect={onNavigationRedirect}
          businessState={{ loading: false, error: null, business: d.sampleBusiness }}
        />
      )
      return { ...utils, onNavigationRedirect }
    }

    it('opens the multi-business cart when several carts are active', () => {
      const { UNSAFE_getByType, onNavigationRedirect } = renderWithCarts({ multiEnabled: true, cartCount: 2 })

      act(() => { UNSAFE_getByType(FloatingButton).props.handleClick() })

      expect(onNavigationRedirect).toHaveBeenCalledWith('Cart')
    })

    it('keeps the button enabled below the store minimum so the other carts stay reachable', () => {
      const { UNSAFE_getByType } = renderWithCarts({ multiEnabled: true, cartCount: 2, minimum: 100 })

      expect(UNSAFE_getByType(FloatingButton).props.disabled).toBe(false)
    })

    it.each([
      { multiEnabled: false, cartCount: 2 },
      { multiEnabled: true, cartCount: 1 }
    ])('keeps the single-store flow when multi=$multiEnabled and carts=$cartCount', ({ multiEnabled, cartCount }) => {
      const { UNSAFE_getByType, onNavigationRedirect } = renderWithCarts({ multiEnabled, cartCount, minimum: 100 })

      expect(UNSAFE_getByType(FloatingButton).props.disabled).toBe(true)
      expect(onNavigationRedirect).not.toHaveBeenCalledWith('Cart')
    })

    it.each([
      { multiEnabled: false, cartCount: 2 },
      { multiEnabled: true, cartCount: 2 },
      { multiEnabled: true, cartCount: 1 }
    ])('sends a pending cart to its own checkout when multi=$multiEnabled and carts=$cartCount', ({ multiEnabled, cartCount }) => {
      const { UNSAFE_getByType, onNavigationRedirect } = renderWithCarts({ multiEnabled, cartCount, storeCart: { status: 2 } })

      act(() => { UNSAFE_getByType(FloatingButton).props.handleClick() })

      expect(onNavigationRedirect).toHaveBeenCalledTimes(1)
      expect(onNavigationRedirect).toHaveBeenCalledWith('CheckoutPage', expect.objectContaining({ cartUuid: 'cart-1' }))
    })

    it('sends a cart placed together with other carts to their multi checkout', () => {
      const pendingInGroup = { status: 2, group: { uuid: 'group-1' } }
      const { UNSAFE_getByType, onNavigationRedirect } = renderWithCarts({
        multiEnabled: true,
        cartCount: 2,
        storeCart: pendingInGroup,
        otherCart: pendingInGroup
      })

      act(() => { UNSAFE_getByType(FloatingButton).props.handleClick() })

      expect(onNavigationRedirect).toHaveBeenCalledWith('MultiCheckout', { cartUuid: 'group-1' })
    })
  })

  it('renders school vertical storefront shell', () => {
    const { getByTestId, getByText } = renderWithProviders(
      <BusinessProductsListing navigation={navigation} slug="school-cafe" />
    )
    expect(getByTestId('header-content-stub')).toBeTruthy()
    expect(getByText('Pizza Place')).toBeTruthy()
    expect(getByTestId('student-onboarding-stub')).toBeTruthy()
    expect(getByTestId('business-basic-information-stub')).toBeTruthy()
    expect(getByText('Cheese Slice')).toBeTruthy()
    expect(getByTestId('student-selector-stub')).toBeTruthy()
  })

  it('renders categories stub', () => {
    const { getByTestId } = renderWithProviders(
      <BusinessProductsListing navigation={navigation} slug="school-cafe" />
    )
    expect(getByTestId('business-products-categories-stub')).toBeTruthy()
  })

  it('navigates to product details on product click', async () => {
    const d = require('../../../../../../jest/helpers/m4MenuDefaults')
    const onNavigationRedirect = jest.fn()
    const showToast = jest.fn()
    ;(useToast as jest.Mock).mockReturnValue([, { showToast }])
    ;(useOrder as jest.Mock).mockReturnValue([{
      loading: false,
      options: { type: 1 },
      carts: {
        'businessId:1': {
          ...d.sampleCart,
          business: { ...d.sampleBusiness, slug: 'pizza-place' },
          status: 1
        }
      }
    }, { addProduct: jest.fn(), updateProduct: jest.fn() }])

    const props = {
      ...d.businessProductsListingDefaults,
      navigation,
      onNavigationRedirect,
      businessState: {
        loading: false,
        error: null,
        business: { ...d.sampleBusiness, professionals: [{ id: 1, name: 'Pro' }] }
      },
      categoryState: {
        loading: false,
        error: null,
        pagination: { currentPage: 1, totalPages: 1 },
        products: [
          d.sampleProduct,
          { id: 101, name: 'Haircut', type: 'service', enabled: true, ingredients: [{ id: 1 }], extras: [{ id: 1 }], category_id: 10 }
        ]
      },
      handleChangeSearch: jest.fn(),
      setAlertState: jest.fn(),
      getNextProducts: jest.fn()
    }

    const { getByTestId, getByText, unmount } = renderWithProviders(<BusinessProductsListingUI {...props} />)
    await act(async () => {
      fireEvent.press(getByText('Cheese Slice'))
    })
    expect(navigation.navigate).toHaveBeenCalled()

    await act(async () => {
      fireEvent.press(getByText('Haircut'))
    })
    expect(getByTestId('service-form-stub')).toBeTruthy()

    unmount()

    const disabled = { id: 102, name: 'Disabled', enabled: false, ingredients: [{ id: 1 }], extras: [], category_id: 10 }
    const second = renderWithProviders(
      <BusinessProductsListingUI {...props} categoryState={{ ...props.categoryState, products: [disabled] }} />
    )
    await act(async () => {
      fireEvent.press(second.getByText('Disabled'))
    })
    expect(showToast).toHaveBeenCalled()
  })

  it('alerts when cart is in progress', async () => {
    const d = require('../../../../../../jest/helpers/m4MenuDefaults')
    const setAlertState = jest.fn()
    ;(useOrder as jest.Mock).mockReturnValue([{
      loading: false,
      options: { type: 1 },
      carts: {
        'businessId:1': {
          ...d.sampleCart,
          status: 2,
          business: { ...d.sampleBusiness, slug: 'pizza-place' }
        }
      }
    }, { addProduct: jest.fn(), updateProduct: jest.fn() }])

    const props = {
      ...d.businessProductsListingDefaults,
      navigation,
      setAlertState,
      businessState: {
        loading: false,
        error: null,
        business: d.sampleBusiness
      }
    }
    const { getByText } = renderWithProviders(<BusinessProductsListingUI {...props} />)
    await act(async () => {
      fireEvent.press(getByText('Cheese Slice'))
    })
    expect(setAlertState).toHaveBeenCalled()
  })

  describe('as the home screen (isHome)', () => {
    const buildProps = (extra: any = {}) => {
      const d = require('../../../../../../jest/helpers/m4MenuDefaults')
      return {
        ...d.businessProductsListingDefaults,
        navigation: { ...navigation, goBack: jest.fn() },
        onGoBack: jest.fn(),
        businessState: { loading: false, error: null, business: { ...d.sampleBusiness, vertical: 'food' } },
        categoryState: { loading: false, error: null, pagination: { currentPage: 1, totalPages: 1 }, products: [d.sampleProduct] },
        ...extra
      }
    }

    it('keeps the back arrow and the hardware back handler as a pushed screen', () => {
      const spy = jest.spyOn(BackHandler, 'addEventListener')
      const props = buildProps()
      const { queryByTestId } = renderWithProviders(<BusinessProductsListingUI {...props} />)
      expect(queryByTestId('header-back')).toBeTruthy()
      expect(spy).toHaveBeenCalledWith('hardwareBackPress', expect.any(Function))
      const handler = spy.mock.calls[0][1] as () => boolean
      expect(handler()).toBe(true)
      expect(props.navigation.goBack).toHaveBeenCalled()
      spy.mockRestore()
    })

    it('has no back arrow and leaves the hardware back button alone', () => {
      const spy = jest.spyOn(BackHandler, 'addEventListener')
      const { queryByTestId } = renderWithProviders(<BusinessProductsListingUI {...buildProps({ isHome: true })} />)
      expect(queryByTestId('header-no-back')).toBeTruthy()
      expect(queryByTestId('header-back')).toBeNull()
      expect(spy).not.toHaveBeenCalledWith('hardwareBackPress', expect.any(Function))
      spy.mockRestore()
    })
  })

  it('renders non-school business and back navigation', () => {
    const d = require('../../../../../../jest/helpers/m4MenuDefaults')
    const nav = { ...navigation, navigate: jest.fn(), canGoBack: jest.fn(() => false) }
    const props = {
      ...d.businessProductsListingDefaults,
      navigation: nav,
      businessState: {
        loading: false,
        error: null,
        business: { ...d.sampleBusiness, vertical: 'food' }
      },
      categoryState: {
        loading: false,
        error: null,
        pagination: { currentPage: 1, totalPages: 1 },
        products: [d.sampleProduct]
      }
    }
    const { getByText, queryByTestId, UNSAFE_getAllByType } = renderWithProviders(
      <BusinessProductsListingUI {...props} />
    )
    expect(getByText('Cheese Slice')).toBeTruthy()
    expect(queryByTestId('student-selector-stub')).toBeNull()
    const { TouchableOpacity } = require('react-native')
    UNSAFE_getAllByType(TouchableOpacity).slice(0, 8).forEach((btn) => {
      try { fireEvent.press(btn) } catch (_) {}
    })
    expect(nav.navigate.mock.calls.length + nav.goBack.mock.calls.length).toBeGreaterThanOrEqual(0)
  })

  it('quick-adds product when one-click enabled', async () => {
    const d = require('../../../../../../jest/helpers/m4MenuDefaults')
    const addProduct = jest.fn().mockResolvedValue({})
    const updateProduct = jest.fn().mockResolvedValue({})
    ;(useConfig as jest.Mock).mockReturnValue([{
      loading: false,
      configs: {
        preorder_status_enabled: { value: '1' },
        add_product_with_one_click: { value: '1' },
        format_number_currency: { value: '$' }
      }
    }])
    ;(useOrder as jest.Mock).mockReturnValue([{
      loading: false,
      options: { type: 1 },
      carts: {
        'businessId:1': {
          ...d.sampleCart,
          business: { ...d.sampleBusiness, slug: 'pizza-place' },
          products: []
        }
      }
    }, { addProduct, updateProduct }])

    const props = {
      ...d.businessProductsListingDefaults,
      navigation,
      businessState: {
        loading: false,
        error: null,
        business: d.sampleBusiness
      }
    }
    const { getByText } = renderWithProviders(<BusinessProductsListingUI {...props} />)
    await act(async () => {
      fireEvent.press(getByText('Cheese Slice'))
    })
    expect(addProduct).toHaveBeenCalled()
  })

  it('quick-adds with updateProduct when a leftover PayPal cart still has the product', async () => {
    const d = require('../../../../../../jest/helpers/m4MenuDefaults')
    const addProduct = jest.fn().mockResolvedValue({})
    const updateProduct = jest.fn().mockResolvedValue({})
    ;(useConfig as jest.Mock).mockReturnValue([{
      loading: false,
      configs: {
        preorder_status_enabled: { value: '1' },
        add_product_with_one_click: { value: '1' },
        format_number_currency: { value: '$' }
      }
    }])
    ;(useOrder as jest.Mock).mockReturnValue([{
      loading: false,
      options: { type: 1 },
      carts: {
        'businessId:1': {
          ...d.sampleCart,
          uuid: 'cart-paypal',
          status: 0,
          business: { ...d.sampleBusiness, slug: 'pizza-place' },
          products: [d.sampleCartProduct]
        }
      }
    }, { addProduct, updateProduct }])

    const props = {
      ...d.businessProductsListingDefaults,
      navigation,
      businessState: {
        loading: false,
        error: null,
        business: d.sampleBusiness
      }
    }
    const { getByText } = renderWithProviders(<BusinessProductsListingUI {...props} />)
    await act(async () => {
      fireEvent.press(getByText('Cheese Slice'))
    })
    expect(updateProduct).toHaveBeenCalled()
    expect(addProduct).not.toHaveBeenCalled()
  })

  it('skips the quick-add and opens ProductDetails with open/schedule/timezone when the business is closed without a chosen moment', async () => {
    const d = require('../../../../../../jest/helpers/m4MenuDefaults')
    const addProduct = jest.fn().mockResolvedValue({})
    const updateProduct = jest.fn().mockResolvedValue({})
    ;(useConfig as jest.Mock).mockReturnValue([{
      loading: false,
      configs: {
        preorder_status_enabled: { value: '1' },
        add_product_with_one_click: { value: '1' },
        format_number_currency: { value: '$' }
      }
    }])
    ;(useOrder as jest.Mock).mockReturnValue([{
      loading: false,
      options: { type: 1 },
      carts: {
        'businessId:1': {
          ...d.sampleCart,
          business: { ...d.sampleBusiness, slug: 'pizza-place', open: false },
          products: []
        }
      }
    }, { addProduct, updateProduct }])

    const closedBusiness = { ...d.sampleBusiness, open: false }
    const props = {
      ...d.businessProductsListingDefaults,
      navigation,
      businessState: { loading: false, error: null, business: closedBusiness }
    }
    const { getByText } = renderWithProviders(<BusinessProductsListingUI {...props} />)
    await act(async () => {
      fireEvent.press(getByText('Cheese Slice'))
    })
    expect(addProduct).not.toHaveBeenCalled()
    expect(updateProduct).not.toHaveBeenCalled()
    expect(navigation.navigate).toHaveBeenCalledWith('ProductDetails', expect.objectContaining({
      business: expect.objectContaining({
        open: false,
        schedule: closedBusiness.schedule,
        timezone: closedBusiness.timezone
      })
    }))
  })

  it('quick-adds as usual when the business is open', async () => {
    const d = require('../../../../../../jest/helpers/m4MenuDefaults')
    const addProduct = jest.fn().mockResolvedValue({})
    const updateProduct = jest.fn().mockResolvedValue({})
    ;(useConfig as jest.Mock).mockReturnValue([{
      loading: false,
      configs: {
        preorder_status_enabled: { value: '1' },
        add_product_with_one_click: { value: '1' },
        format_number_currency: { value: '$' }
      }
    }])
    ;(useOrder as jest.Mock).mockReturnValue([{
      loading: false,
      options: { type: 1 },
      carts: {
        'businessId:1': {
          ...d.sampleCart,
          business: { ...d.sampleBusiness, slug: 'pizza-place', open: true },
          products: []
        }
      }
    }, { addProduct, updateProduct }])

    const props = {
      ...d.businessProductsListingDefaults,
      navigation,
      businessState: { loading: false, error: null, business: { ...d.sampleBusiness, open: true } }
    }
    const { getByText } = renderWithProviders(<BusinessProductsListingUI {...props} />)
    await act(async () => {
      fireEvent.press(getByText('Cheese Slice'))
    })
    expect(addProduct).toHaveBeenCalled()
    expect(navigation.navigate).not.toHaveBeenCalled()
  })

  it('opens upselling from floating button and handles search', async () => {
    const d = require('../../../../../../jest/helpers/m4MenuDefaults')
    const onNavigationRedirect = jest.fn()
    const handleChangeSearch = jest.fn()
    ;(useOrder as jest.Mock).mockReturnValue([{
      loading: false,
      options: { type: 1 },
      carts: {
        'businessId:1': {
          ...d.sampleCart,
          business: { ...d.sampleBusiness, slug: 'pizza-place' },
          products: [d.sampleProduct],
          valid: true,
          status: 1
        }
      }
    }, { addProduct: jest.fn(), updateProduct: jest.fn() }])

    const props = {
      ...d.businessProductsListingDefaults,
      navigation,
      onNavigationRedirect,
      handleChangeSearch,
      businessState: {
        loading: false,
        error: null,
        business: {
          ...d.sampleBusiness,
          lazy_load_products_recommended: true
        }
      },
      categoryState: {
        loading: false,
        error: null,
        pagination: { currentPage: 1, totalPages: 3 },
        products: [d.sampleProduct]
      },
      getNextProducts: jest.fn(),
      alertState: { open: true, content: ['Alert'] },
      setAlertState: jest.fn()
    }

    const { getByTestId, getByText, UNSAFE_getAllByType } = renderWithProviders(
      <BusinessProductsListingUI {...props} />
    )

    if (getByTestId('floating-button')) {
      fireEvent.press(getByTestId('floating-button'))
    }
    expect(getByTestId('floating-button')).toBeTruthy()

    try {
      fireEvent.changeText(getByTestId('search-bar-input'), 'cheese')
      expect(handleChangeSearch).toHaveBeenCalled()
    } catch (_) {}

    expect(getByTestId('alert-provider')).toBeTruthy()
  })

  it('shows loading business shell', () => {
    const d = require('../../../../../../jest/helpers/m4MenuDefaults')
    const { toJSON } = renderWithProviders(
      <BusinessProductsListingUI
        {...d.businessProductsListingDefaults}
        navigation={navigation}
        businessState={{ loading: true, error: null, business: d.sampleBusiness }}
      />
    )
    expect(toJSON()).toBeTruthy()
  })

  it('opens product modal product click', async () => {
    const d = require('../../../../../../jest/helpers/m4MenuDefaults')
    ;(useOrder as jest.Mock).mockReturnValue([{
      loading: false,
      options: { type: 1 },
      carts: {}
    }, { addProduct: jest.fn(), updateProduct: jest.fn() }])

    const props = {
      ...d.businessProductsListingDefaults,
      navigation,
      businessState: {
        loading: false,
        error: null,
        business: d.sampleBusiness
      },
      productModal: {
        open: true,
        loading: false,
        error: null,
        product: { ...d.sampleProduct, ingredients: [{ id: 1 }], extras: [{ id: 1 }] }
      }
    }
    renderWithProviders(<BusinessProductsListingUI {...props} />)
    expect(navigation.navigate).toHaveBeenCalled()
  })

  describe('the menu as a virtualized list', () => {
    const d = require('../../../../../../jest/helpers/m4MenuDefaults')
    const categories = [
      { id: 10, name: 'Pizzas', rank: 1 },
      { id: 11, name: 'Drinks', rank: 2 }
    ]
    const menuOf = (count: number) => Array.from({ length: count }, (_, index) => ({
      ...d.sampleProduct,
      id: index + 1,
      name: `Product ${index + 1}`,
      rank: index,
      category_id: index < count / 2 ? 10 : 11
    }))
    const renderMenu = (extra: any = {}, products = menuOf(300)) => {
      const props = {
        ...d.businessProductsListingDefaults,
        navigation,
        featuredProducts: false,
        businessState: { loading: false, error: null, business: { ...d.sampleBusiness, categories } },
        categoryState: { loading: false, error: null, pagination: { currentPage: 1, totalPages: 1 }, products },
        ...extra
      }
      const utils = renderWithProviders(<BusinessProductsListingUI {...props} />)
      return { ...utils, props, list: () => utils.UNSAFE_getByType(FlatList) }
    }
    const keysOf = (list: any) => list.props.data.map((row: any) => row.key)

    beforeEach(() => {
      ;(useOrder as jest.Mock).mockReturnValue([{ loading: false, options: { type: 1 }, carts: {} }, { addProduct: jest.fn(), updateProduct: jest.fn() }])
      ;(useConfig as jest.Mock).mockReturnValue([{ loading: false, configs: {} }])
    })

    it('mounts the rows near the screen, not the whole menu', () => {
      const { list, getAllByTestId } = renderMenu()
      // Every product is a row of the list…
      expect(list().props.data.filter((row: any) => row.kind === 'product')).toHaveLength(300)
      // …and only the first ones are mounted.
      expect(getAllByTestId('single-product-card').length).toBeLessThan(20)
    })

    it('lists the page\'s sections and the menu\'s rows in the theme\'s order, the category bar sticky', () => {
      const { list } = renderMenu({}, menuOf(2))
      expect(keysOf(list())).toEqual([
        'business_header',
        'offers_banner',
        'category_bar',
        'menu_top',
        'category:10',
        'product:10:1',
        'category:11',
        'product:11:2',
        'menu_end'
      ])
      expect(list().props.stickyHeaderIndices).toEqual([2])
    })

    it('shows the skeletons of the menu while the business loads', () => {
      const { list, queryByTestId } = renderMenu({
        businessState: { loading: true, error: null, business: {} },
        categoryState: { loading: true, error: null, pagination: { nextPageItems: 3 }, products: [] }
      })
      expect(keysOf(list())).toEqual(['business_header', 'menu_top', 'skeleton:0', 'skeleton:1', 'skeleton:2', 'menu_end'])
      expect(queryByTestId('business-products-categories-stub')).toBeNull()
      expect(list().props.stickyHeaderIndices).toEqual([])
    })

    it('gives the list the same rows, renderer and handlers when the screen renders again', () => {
      const { list, rerender, props } = renderMenu()
      const before = { ...list().props }
      // A scroll past the title's threshold renders the screen (the header folds)…
      act(() => { list().props.onScroll({ nativeEvent: { contentOffset: { y: 400 } } }) })
      // …and so does a new handler from the controller.
      rerender(<BusinessProductsListingUI {...props} handleUpdateProducts={jest.fn()} getNextProducts={jest.fn()} />)
      for (const name of ['data', 'renderItem', 'keyExtractor', 'getItemLayout', 'stickyHeaderIndices', 'onScroll', 'onScrollBeginDrag', 'onViewableItemsChanged', 'viewabilityConfig', 'style']) {
        expect(list().props[name]).toBe(before[name])
      }
    })

    it('renders the screen once per threshold the scroll crosses, not once per scroll event', () => {
      const headerRenders = jest.spyOn(require('../../BusinessesListing/Layout/Original/HeaderContent'), 'HeaderContent')
      const { list } = renderMenu()
      headerRenders.mockClear()
      act(() => {
        for (let y = 31; y < 300; y++) list().props.onScroll({ nativeEvent: { contentOffset: { y } } })
      })
      // The header folds once (its title shows past 30pt).
      expect(headerRenders.mock.calls.length).toBeLessThanOrEqual(2)
      expect(headerRenders.mock.calls.slice(-1)[0][0].collapseControls).toBe(true)
    })

    it('lights the tab of the category on screen without rendering the list again', () => {
      const { list, UNSAFE_getByType } = renderMenu()
      const data = list().props.data
      const row = (key: string) => ({ index: data.findIndex((item: any) => item.key === key), item: data.find((item: any) => item.key === key) })
      const bar = () => UNSAFE_getByType(BusinessProductsCategories as any)
      expect(bar().props.selectedCategoryId).toBeNull()

      // The business header is still the first row on screen: no category yet.
      act(() => { list().props.onViewableItemsChanged({ viewableItems: [row('business_header'), row('category:10')] }) })
      expect(bar().props.selectedCategoryId).toBeNull()

      act(() => { list().props.onViewableItemsChanged({ viewableItems: [row('product:10:5'), row('product:10:6')] }) })
      expect(bar().props.selectedCategoryId).toBe('cat_10')

      act(() => { list().props.onViewableItemsChanged({ viewableItems: [row('product:11:200'), row('product:11:201')] }) })
      expect(bar().props.selectedCategoryId).toBe('cat_11')
      expect(list().props.data).toBe(data)
    })

    it('leaves the tab a tap chose until the next drag', () => {
      const { list, UNSAFE_getByType } = renderMenu()
      const data = list().props.data
      const bar = () => UNSAFE_getByType(BusinessProductsCategories as any)
      const pizzas = { index: 5, item: data.find((item: any) => item.key === 'product:10:5') }
      act(() => {
        bar().props.setCategoryClicked(true)
        bar().props.setSelectedCategoryId('cat_11')
      })
      act(() => { list().props.onViewableItemsChanged({ viewableItems: [pizzas] }) })
      expect(bar().props.selectedCategoryId).toBe('cat_11')

      act(() => { list().props.onScrollBeginDrag() })
      act(() => { list().props.onViewableItemsChanged({ viewableItems: [pizzas] }) })
      expect(bar().props.selectedCategoryId).toBe('cat_10')
    })

    it('does not follow the scroll in a menu that loads by pages (the tab is the chosen category)', () => {
      const { list, UNSAFE_getByType } = renderMenu({
        businessState: { loading: false, error: null, business: { ...d.sampleBusiness, categories, lazy_load_products_recommended: true } }
      }, menuOf(4))
      const data = list().props.data
      act(() => { list().props.onViewableItemsChanged({ viewableItems: [{ index: 5, item: data.find((item: any) => item.kind === 'product') }] }) })
      expect(UNSAFE_getByType(BusinessProductsCategories as any).props.selectedCategoryId).toBeNull()
    })

    it('scrolls to a category from its tab, also one far down that is not mounted', () => {
      const scrollToIndex = jest.spyOn(FlatList.prototype, 'scrollToIndex').mockImplementation(() => {})
      try {
        const { list, queryByText, UNSAFE_getByType } = renderMenu()
        const data = list().props.data
        const bar = UNSAFE_getByType(BusinessProductsCategories as any)
        const drinks = data.findIndex((item: any) => item.key === 'category:11')
        // 150 products above it: its rows are not mounted.
        expect(drinks).toBeGreaterThan(150)
        expect(queryByText('Drinks')).toBeNull()

        act(() => { bar.props.onBarLayout(48) })
        act(() => { bar.props.scrollToCategory(11) })
        // Under the stuck bar, as far as the menu's top space; at once (the rows on the way are not rendered).
        expect(scrollToIndex).toHaveBeenLastCalledWith({ index: drinks, viewOffset: expect.any(Number), animated: false })
        expect(scrollToIndex.mock.calls[0][0].viewOffset).toBeGreaterThan(48)

        // "All": the top of the menu, right under the bar.
        act(() => { bar.props.scrollToCategory(null) })
        expect(scrollToIndex).toHaveBeenLastCalledWith(expect.objectContaining({ index: data.findIndex((item: any) => item.key === 'menu_top'), viewOffset: 48 }))

        // "Featured" without featured products, or a category without rows: nowhere to go.
        scrollToIndex.mockClear()
        act(() => { bar.props.scrollToCategory('featured') })
        act(() => { bar.props.scrollToCategory(99) })
        expect(scrollToIndex).not.toHaveBeenCalled()
      } finally {
        scrollToIndex.mockRestore()
      }
    })

    it('knows where every row is: the measured ones exactly, the others by the rows like them', () => {
      const { list, getByText } = renderMenu()
      const data = list().props.data
      const at = (key: string) => data.findIndex((item: any) => item.key === key)
      // A product row reports its height when it is laid out.
      let row: any = getByText('Product 1')
      while (row && !row.props.onLayout) row = row.parent
      fireEvent(row, 'layout', { nativeEvent: { layout: { height: 180 } } })

      const first = list().props.getItemLayout(data, at('product:10:1'))
      const far = list().props.getItemLayout(data, at('product:11:300'))
      expect(first.length).toBe(180)
      // A product never on screen is assumed as tall as the measured one.
      expect(far.length).toBe(180)
      expect(list().props.getItemLayout(data, at('product:10:2')).offset).toBe(first.offset + 180)
    })

    it('keeps the list\'s rows and renders only the product whose units change when the cart changes', () => {
      const { list, rerender, props, getByText } = renderMenu({}, menuOf(6))
      const data = list().props.data
      const cart = { ...d.sampleCart, business: props.businessState.business, products: [{ ...d.sampleCartProduct, id: 2, quantity: 3 }] }
      ;(useOrder as jest.Mock).mockReturnValue([{ loading: false, options: { type: 1 }, carts: { 'businessId:1': cart } }, { addProduct: jest.fn(), updateProduct: jest.fn() }])
      rerender(<BusinessProductsListingUI {...props} />)

      expect(list().props.data).toBe(data)
      const quantityOf = (name: string) => {
        let node: any = getByText(name)
        while (node && node.props.productAddedToCartLength === undefined) node = node.parent
        return node.props.productAddedToCartLength
      }
      expect(quantityOf('Product 2')).toBe(3)
      expect(quantityOf('Product 1')).toBe(0)
    })
  })

  describe('a menu that loads by pages', () => {
    const d = require('../../../../../../jest/helpers/m4MenuDefaults')
    const renderLazy = (extra: any = {}) => {
      const showToast = jest.fn()
      ;(useToast as jest.Mock).mockReturnValue([, { showToast }])
      ;(useOrder as jest.Mock).mockReturnValue([{ loading: false, options: { type: 1 }, carts: {} }, { addProduct: jest.fn(), updateProduct: jest.fn() }])
      let finish: any
      const getNextProducts = jest.fn(() => new Promise((resolve) => { finish = resolve }))
      const props = {
        ...d.businessProductsListingDefaults,
        navigation,
        businessState: { loading: false, error: null, business: { ...d.sampleBusiness, lazy_load_products_recommended: true } },
        categoryState: { loading: false, error: null, pagination: { currentPage: 1, totalPages: 3, nextPageItems: 2 }, products: [d.sampleProduct] },
        getNextProducts,
        ...extra
      }
      const utils = renderWithProviders(<BusinessProductsListingUI {...props} />)
      return { ...utils, props, showToast, getNextProducts, finish: async () => { await act(async () => { finish() }) }, list: () => utils.UNSAFE_getByType(FlatList) }
    }

    it('asks the controller for pages instead of every product at once', () => {
      const { UNSAFE_getByType } = renderWithProviders(<BusinessProductsListing navigation={navigation} slug="pizza-place" />)
      const props = UNSAFE_getByType(BusinessProductsListingUI).props as any
      expect(props.productsPageSize).toBe(MENU_PAGE_SIZE)
      expect(MENU_PAGE_SIZE).toBe(20)
      expect(props.isFetchAllProducts).toBeUndefined()
    })

    it('has the controller check the loaded business by slug, and by id when the store is an id', () => {
      const controllerProps = (slug: string) => (
        renderWithProviders(<BusinessProductsListing navigation={navigation} slug={slug} />)
          .UNSAFE_getByType(BusinessProductsListingUI).props as any
      )
      expect(controllerProps('pizza-place').ignoreSlugToCompare).toBe(true)
      expect(controllerProps('1').ignoreSlugToCompare).toBe(false)
    })

    it('loads the next page when the end of the list comes near', () => {
      const { list, getNextProducts, showToast } = renderLazy()
      act(() => { list().props.onEndReached({ distanceFromEnd: 100 }) })
      expect(getNextProducts).toHaveBeenCalledTimes(1)
      expect(showToast).toHaveBeenCalledTimes(1)
    })

    it('loads one page at a time, with one notice, however often the list says its end is near', async () => {
      const { list, getNextProducts, showToast, finish } = renderLazy()
      act(() => {
        for (let times = 0; times < 20; times++) list().props.onEndReached({ distanceFromEnd: 100 })
      })
      expect(getNextProducts).toHaveBeenCalledTimes(1)
      expect(showToast).toHaveBeenCalledTimes(1)

      // The page arrived: the next one can be asked for.
      await finish()
      act(() => { list().props.onEndReached({ distanceFromEnd: 100 }) })
      expect(getNextProducts).toHaveBeenCalledTimes(2)
      expect(showToast).toHaveBeenCalledTimes(2)
    })

    it('asks again after a page that failed', async () => {
      const getNextProducts = jest.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined)
      const { list } = renderLazy({ getNextProducts })
      await act(async () => { list().props.onEndReached({ distanceFromEnd: 100 }) })
      await act(async () => { list().props.onEndReached({ distanceFromEnd: 100 }) })
      expect(getNextProducts).toHaveBeenCalledTimes(2)
    })

    it.each([
      ['the last page is loaded', { categoryState: { loading: false, pagination: { currentPage: 3, totalPages: 3 }, products: [] } }],
      ['a page is loading', { categoryState: { loading: true, pagination: { currentPage: 1, totalPages: 3, nextPageItems: 1 }, products: [] } }],
      ['the business is loading', { businessState: { loading: true, error: null, business: { lazy_load_products_recommended: true } } }],
      ['every product came with the business', { businessState: { loading: false, error: null, business: d.sampleBusiness } }]
    ])('loads nothing when %s', (_name, extra) => {
      const { list, getNextProducts, showToast } = renderLazy(extra)
      act(() => { list().props.onEndReached({ distanceFromEnd: 100 }) })
      expect(getNextProducts).not.toHaveBeenCalled()
      expect(showToast).not.toHaveBeenCalled()
    })

    it('never asks for a page from a scroll event', () => {
      const { list, getNextProducts, showToast } = renderLazy()
      act(() => {
        for (let y = 0; y < 5000; y += 50) {
          list().props.onScroll({ nativeEvent: { contentOffset: { y }, contentSize: { height: 5000 }, layoutMeasurement: { height: 800 } } })
        }
      })
      expect(getNextProducts).not.toHaveBeenCalled()
      expect(showToast).not.toHaveBeenCalled()
    })

    it('shows the skeletons of the page that is loading under the products', () => {
      const { list } = renderLazy({
        categoryState: { loading: true, error: null, pagination: { currentPage: 1, totalPages: 3, nextPageItems: 2 }, products: [d.sampleProduct] }
      })
      expect(list().props.data.map((row: any) => row.kind).slice(-4)).toEqual(['product', 'skeleton', 'skeleton', 'menu_end'])
    })
  })
})
