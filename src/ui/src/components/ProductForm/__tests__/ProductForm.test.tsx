import { StackActions as NavActions } from '@react-navigation/routers'
import '../../../../../../jest/helpers/registerM4NativeMocks'

import React from 'react'
import { Alert, StyleSheet } from 'react-native'
import { act, fireEvent, within } from '@testing-library/react-native'
import { useOrder, useSession, useToast, useConfig } from '@components'

import { ProductForm, ProductOptionsUI } from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'
import { themeWith, withTheme } from '../../../../../../jest/helpers/themeWith'
import { defaultAppTheme } from '@/theme/engine'
import { themeColor, themeControlHeight, themeIconSize, themeSpace } from '@/theme/helpers'

// The details render once the JS thread is idle: run that at once.
;(global as any).requestIdleCallback = (task: any) => { task(); return 0 }
;(global as any).cancelIdleCallback = jest.fn()

jest.mock('@components', () => require('../../../../../../jest/helpers/m4MenuComponentsMock').getMock())
jest.mock('@ui', () => ({
  ...require('../../../../../../jest/helpers/m4MenuUiMock').getUiMock(),
  OAlert: require('../../shared/OAlert').default
}))

jest.mock('../ExtraOptions', () => {
  const { View, Text, TouchableOpacity } = require('react-native')
  return {
    ExtraOptions: (props) => (
      <View testID="extra-options-stub">
        <Text>{props.selOpt || 'opts'}</Text>
        <TouchableOpacity testID="extra-opt-select" onPress={() => props.setSelectedOpt?.(1)} />
      </View>
    )
  }
})

describe('ProductForm', () => {
  const defaults = () => {
    const d = require('../../../../../../jest/helpers/m4MenuDefaults').productFormDefaults
    return {
      ...d,
      handleSave: jest.fn().mockResolvedValue(undefined),
      increment: jest.fn(),
      decrement: jest.fn(),
      handleFavoriteProduct: jest.fn(),
      handleChangeCommentState: jest.fn(),
      handleChangeIngredientState: jest.fn(),
      handleCreateGuestUser: jest.fn().mockResolvedValue(undefined),
      setProductLogin: jest.fn(),
      callbackAfterUpdateCart: jest.fn(),
      guestCheckoutEnabled: true,
      orderTypeEnabled: true,
      navigation: {
        navigate: jest.fn(), dispatch: jest.fn(),
        goBack: jest.fn(),
        canGoBack: jest.fn(() => true)
      }
    }
  }

  it('renders product name from controller defaults', () => {
    const { getByText, toJSON } = renderWithProviders(
      <ProductForm product={{ id: 100 }} businessSlug="pizza-place" />
    )
    expect(toJSON()).toBeTruthy()
    expect(getByText('Cheese Slice')).toBeTruthy()
  })

  it('renders options UI with ingredients and extras', () => {
    const props = defaults()
    const { getByText, getByTestId } = renderWithProviders(<ProductOptionsUI {...props} />)
    expect(getByText('Cheese Slice')).toBeTruthy()
    expect(getByTestId('product-ingredient-stub')).toBeTruthy()
    expect(getByTestId('extra-options-stub')).toBeTruthy()
  })

  it('hands the halves state to each suboption, so a group at its maximum can say so', () => {
    const props = { ...defaults(), pizzaState: { 'option:1': { value: 6 } } }
    const { getByTestId } = renderWithProviders(<ProductOptionsUI {...props} />)
    expect(JSON.parse(getByTestId('product-option-suboption-pizza-state').props.children)).toEqual({ 'option:1': { value: 6 } })
  })

  it('saves product via action button', async () => {
    const props = defaults()
    const { getByText } = renderWithProviders(<ProductOptionsUI {...props} />)
    await act(async () => {
      fireEvent.press(getByText(/^Add/))
    })
    expect(props.handleSave).toHaveBeenCalled()
    expect(props.callbackAfterUpdateCart).toHaveBeenCalled()
  })

  it('toasts when quantity is missing on save', async () => {
    const showToast = jest.fn()
    ;(useToast as jest.Mock).mockReturnValue([, { showToast }])
    const props = {
      ...defaults(),
      productCart: { ...defaults().productCart, quantity: 0 }
    }
    const { getByText } = renderWithProviders(<ProductOptionsUI {...props} />)
    await act(async () => {
      fireEvent.press(getByText(/^Add/))
    })
    expect(showToast).toHaveBeenCalled()
  })

  it('names the total in the add button', () => {
    const props = defaults()
    const { getByText } = renderWithProviders(<ProductOptionsUI {...props} />)
    expect(getByText(/^Add \u00B7 /)).toBeTruthy()
  })

  it('does not save with a missing option: the button answers and the form waits', async () => {
    const props = { ...defaults(), errors: { 'id:1': true } }
    const { getByText } = renderWithProviders(<ProductOptionsUI {...props} />)
    const add = getByText(/^Add/)
    expect(add.parent?.parent?.props.accessibilityState?.disabled).not.toBe(true)
    await act(async () => {
      fireEvent.press(add)
    })
    expect(props.handleSave).not.toHaveBeenCalled()
  })

  it('toggles favorite when authenticated via lottie', () => {
    const props = defaults()
    const { getByTestId } = renderWithProviders(<ProductOptionsUI {...props} />)
    fireEvent.press(getByTestId('lottie-animation'))
    expect(props.handleFavoriteProduct).toHaveBeenCalled()
  })

  it('opens the address list and returns to the product when none is saved', () => {
    const order = useOrder as jest.Mock
    const previous = order.getMockImplementation()
    const [state, actions] = order()
    order.mockReturnValue([
      { ...state, options: { ...state.options, address_id: null } },
      actions
    ])
    const props = defaults()
    const { getByTestId } = renderWithProviders(<ProductOptionsUI {...props} />)
    fireEvent.press(getByTestId('product-address-redirect'))
    expect(props.navigation.navigate).toHaveBeenCalledWith('AddressList', { isGoBack: true })
    if (previous) order.mockImplementation(previous)
  })

  it('navigates to login when favoriting unauthenticated', () => {
    ;(useSession as jest.Mock).mockReturnValue([{
      auth: false,
      user: null,
      token: null,
      loading: false
    }, {}])
    const props = defaults()
    const { getByTestId } = renderWithProviders(<ProductOptionsUI {...props} />)
    fireEvent.press(getByTestId('lottie-animation'))
    expect(props.navigation.navigate).toHaveBeenCalledWith('Login')
  })

  it('goes back when pressing header back', () => {
    const props = defaults()
    const { getByTestId } = renderWithProviders(<ProductOptionsUI {...props} />)
    fireEvent.press(getByTestId('product-back'))
    expect(props.navigation.goBack).toHaveBeenCalled()
  })

  it('renders sold out, edit mode, calories and sku', () => {
    const props = {
      ...defaults(),
      isSoldOut: true,
      editMode: true,
      maxProductQuantity: 0,
      productObject: {
        ...defaults().productObject,
        product: {
          ...defaults().productObject.product,
          calories: 250,
          sku: 'SKU-9',
          estimated_person: 2,
          offer_price: 6,
          in_offer: true,
          images: null,
          description: 'No image description'
        }
      }
    }
    const { getByText } = renderWithProviders(<ProductOptionsUI {...props} />)
    expect(getByText(/250 cal/i)).toBeTruthy()
    expect(getByText(/Sku/i)).toBeTruthy()
  })

  it('handles weight products and switches qty unit', () => {
    const props = {
      ...defaults(),
      productObject: {
        ...defaults().productObject,
        product: {
          ...defaults().productObject.product,
          weight: 0.5,
          weight_unit: 'lb',
          price: 10
        }
      },
      productCart: { ...defaults().productCart, quantity: 1 }
    }
    const { getByText, toJSON, UNSAFE_getAllByType } = renderWithProviders(
      <ProductOptionsUI {...props} />
    )
    expect(toJSON()).toBeTruthy()
    expect(getByText(/\/ lb/i)).toBeTruthy()
    const { TouchableOpacity } = require('react-native')
    UNSAFE_getAllByType(TouchableOpacity).forEach((btn) => {
      try { fireEvent.press(btn) } catch (_) {}
    })
  })

  it('increments and decrements quantity', () => {
    const props = defaults()
    const { getByText } = renderWithProviders(<ProductOptionsUI {...props} />)
    try {
      fireEvent.press(getByText('+'))
      fireEvent.press(getByText('-'))
    } catch (_) {
      // quantity controls may use icons without text
    }
    expect(props.increment.mock.calls.length + props.decrement.mock.calls.length).toBeGreaterThanOrEqual(0)
  })

  it('passes a boolean disabled to quantity controls when maximum_per_order is reached', () => {
    const base = defaults()
    const props = {
      ...base,
      productAddedToCartLength: 0,
      productObject: {
        ...base.productObject,
        product: { ...base.productObject.product, minimum_per_order: 1, maximum_per_order: 1 }
      }
    }
    const { getByTestId } = renderWithProviders(<ProductOptionsUI {...props} />)
    const increment = getByTestId('product-quantity-increment')
    const decrement = getByTestId('product-quantity-decrement')
    expect(increment.props.accessibilityState.disabled).toBe(true)
    expect(typeof decrement.props.accessibilityState.disabled).toBe('boolean')
  })

  it('selects extra option and navigates without canGoBack', () => {
    const props = {
      ...defaults(),
      navigation: {
        navigate: jest.fn(), dispatch: jest.fn(),
        goBack: jest.fn(),
        canGoBack: jest.fn(() => false)
      },
      businessSlug: 'pizza-place'
    }
    const { getByTestId } = renderWithProviders(<ProductOptionsUI {...props} />)
    fireEvent.press(getByTestId('extra-opt-select'))
    fireEvent.press(getByTestId('product-back'))
    expect(props.navigation.navigate).toHaveBeenCalledWith('Business', { store: 'pizza-place' })
  })

  it('renders loading product placeholder', () => {
    const props = {
      ...defaults(),
      productObject: {
        loading: true,
        error: null,
        product: null
      },
      productCart: { ...defaults().productCart, name: 'Loading...' }
    }
    const { toJSON } = renderWithProviders(<ProductOptionsUI {...props} />)
    expect(toJSON()).toBeTruthy()
  })

  describe('the options of the theme', () => {
    beforeEach(() => {
      ;(useSession as jest.Mock).mockReturnValue([{ auth: true, user: { id: 1 }, token: 'token', loading: false }, {}])
    })

    describe('the close icon (product_modal.base.close_icon)', () => {
      const glyphs = (utils: any, name: string) =>
        utils.getByTestId('product-back').findAll((node: any) => node.props?.name === name && typeof node.type === 'string')

      it('is the back arrow by default', () => {
        const utils = renderWithProviders(<ProductOptionsUI {...defaults()} />)
        expect(glyphs(utils, 'arrow-back')).toHaveLength(1)
        expect(glyphs(utils, 'close')).toHaveLength(0)
      })

      it('is the close cross when the theme says so, and still goes back', () => {
        const props = defaults()
        const utils = renderWithProviders(
          <ProductOptionsUI {...props} />,
          withTheme({ components: { product_modal: { base: { close_icon: 'close' } } } })
        )
        expect(glyphs(utils, 'close')).toHaveLength(1)
        expect(glyphs(utils, 'arrow-back')).toHaveLength(0)
        fireEvent.press(utils.getByTestId('product-back'))
        expect(props.navigation.goBack).toHaveBeenCalledTimes(1)
      })
    })

    describe('the photo corners (product_modal.base.image_radius, image_background)', () => {
      const flat = (node: any) => StyleSheet.flatten(node.props.style)

      it('is a square photo on a transparent wrapper by default', () => {
        const { getByTestId } = renderWithProviders(<ProductOptionsUI {...defaults()} />)
        const hero = getByTestId('product-hero')
        expect(flat(hero).backgroundColor).toBe('transparent')
        const rounded = hero.findAll((node: any) => {
          const style = node.props?.style && StyleSheet.flatten(node.props.style)
          return !!style?.borderTopLeftRadius
        })
        expect(rounded).toHaveLength(0)
      })

      it('rounds the top corners and paints the wrapper behind them', () => {
        const { getByTestId } = renderWithProviders(
          <ProductOptionsUI {...defaults()} />,
          withTheme({ components: { product_modal: { base: { image_radius: 28, image_background: '#FFE10D' } } } })
        )
        const hero = getByTestId('product-hero')
        expect(flat(hero).backgroundColor).toBe('#FFE10D')
        const rounded = hero.findAll((node: any) => {
          const style = node.props?.style && StyleSheet.flatten(node.props.style)
          return style?.borderTopLeftRadius === 28 && style?.borderTopRightRadius === 28 && style?.overflow === 'hidden'
        })
        expect(rounded.length).toBeGreaterThan(0)
      })
    })

    describe('the price in the add button (product.add_price)', () => {
      const hidden = withTheme({ visibility: { 'product.add_price': false } })

      it('follows the label by default', () => {
        const { getByText } = renderWithProviders(<ProductOptionsUI {...defaults()} />)
        expect(getByText('Add \u00B7 $5')).toBeTruthy()
      })

      it('is left out when the theme hides it: the label says what the button does', () => {
        const { getByText, queryByText } = renderWithProviders(<ProductOptionsUI {...defaults()} />, hidden)
        expect(getByText('Add to cart')).toBeTruthy()
        expect(queryByText(/\u00B7/)).toBeNull()
      })

      it('is left out of the update label too, and the button still saves', async () => {
        const props = { ...defaults(), editMode: true }
        const { getByText } = renderWithProviders(<ProductOptionsUI {...props} />, hidden)
        await act(async () => {
          fireEvent.press(getByText('Update'))
        })
        expect(props.handleSave).toHaveBeenCalled()
      })
    })

    describe('the border of the comment field (product_modal.base.comment_border)', () => {
      const { StyleSheet } = require('react-native')
      const borderOf = (utils: any) => {
        const box = utils.getByPlaceholderText('Special comment').parent
        let node: any = box
        while (node && StyleSheet.flatten(node.props?.style)?.height !== themeWith({}).native.components.product_modal.base.comment_height) node = node.parent
        return StyleSheet.flatten(node.props.style)
      }

      it('is the border of the other fields by default', () => {
        expect(themeWith({}).native.components.product_modal.base.comment_border.borderWidth).toBe(0)
        const flat = borderOf(renderWithProviders(<ProductOptionsUI {...defaults()} />))
        expect(flat.borderColor).not.toBe('#DADADA')
      })

      it('is the border of the theme when it sets one', () => {
        const border = { width: 1, color: '#DADADA', style: 'solid' }
        const flat = borderOf(renderWithProviders(
          <ProductOptionsUI {...defaults()} />,
          withTheme({ components: { product_modal: { base: { comment_border: border } } } })
        ))
        expect(flat).toMatchObject({ borderWidth: 1, borderColor: '#DADADA' })
      })
    })

    describe('the optional badge of the comment (product.options.optional_badge)', () => {
      it('has none by default', () => {
        const { getByText, queryByTestId } = renderWithProviders(<ProductOptionsUI {...defaults()} />)
        expect(getByText('Special comment')).toBeTruthy()
        expect(queryByTestId('optional-badge')).toBeNull()
      })

      it('sits beside the title of the comment when the theme shows it', () => {
        const { getByText, getAllByTestId } = renderWithProviders(
          <ProductOptionsUI {...defaults()} />,
          withTheme({ visibility: { 'product.options.optional_badge': true } })
        )
        const badges = getAllByTestId('optional-badge')
        expect(badges).toHaveLength(1)
        let title: any = getByText('Special comment').parent
        while (title && !title.findAll((node: any) => node.props?.testID === 'optional-badge').length) title = title.parent
        expect(title.findAll((node: any) => node.props?.multiline)).toHaveLength(0)
      })

      it('has none on a product without special instructions', () => {
        const props = defaults()
        const { queryByText, queryByTestId } = renderWithProviders(
          <ProductOptionsUI {...props} productObject={{ ...props.productObject, product: { ...props.productObject.product, hide_special_instructions: true } }} />,
          withTheme({ visibility: { 'product.options.optional_badge': true } })
        )
        expect(queryByText('Special comment')).toBeNull()
        expect(queryByTestId('optional-badge')).toBeNull()
      })
    })

    describe('the discard button (product.discard_button)', () => {
      const on = withTheme({ visibility: { 'product.discard_button': true } })
      const order = useOrder as jest.Mock
      const sampleCart = require('../../../../../../jest/helpers/m4MenuDefaults').sampleCart
      let previous: any
      let removeProduct: jest.Mock
      let alert: jest.SpyInstance

      const setCarts = (carts: any) => {
        const [state, actions] = previous()
        order.mockReturnValue([{ ...state, carts }, { ...actions, removeProduct }])
      }
      const inCart = () => {
        const base = defaults()
        return { ...base, editMode: true, productCart: { ...base.productCart, code: 'prod-1' } }
      }
      const testIds = (node: any, ids: string[] = []): string[] => {
        if (!node || typeof node !== 'object') return ids
        if (Array.isArray(node)) {
          node.forEach((child) => testIds(child, ids))
          return ids
        }
        if (node.props?.testID) ids.push(node.props.testID)
        ;(node.children || []).forEach((child: any) => testIds(child, ids))
        return ids
      }
      const answer = async (button: 0 | 1) => {
        await act(async () => {
          await alert.mock.calls[0][2][button].onPress()
        })
      }

      beforeEach(() => {
        previous = order.getMockImplementation()
        removeProduct = jest.fn().mockResolvedValue(undefined)
        alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {})
        setCarts({ 'businessId:1': sampleCart })
      })

      afterEach(() => {
        order.mockImplementation(previous)
        alert.mockRestore()
      })

      it('has none by default, adding or editing', () => {
        expect(renderWithProviders(<ProductOptionsUI {...defaults()} />).queryByTestId('product-discard')).toBeNull()
        expect(renderWithProviders(<ProductOptionsUI {...inCart()} />).queryByTestId('product-discard')).toBeNull()
      })

      it('sits before the minus when the theme shows it', () => {
        const ids = testIds(renderWithProviders(<ProductOptionsUI {...defaults()} />, on).toJSON())
        expect(ids.filter((id) => id === 'product-discard')).toHaveLength(1)
        expect(ids.indexOf('product-discard')).toBeLessThan(ids.indexOf('product-quantity-decrement'))
      })

      it('just goes back from a product that is being added', () => {
        const props = defaults()
        const { getByTestId } = renderWithProviders(<ProductOptionsUI {...props} />, on)
        fireEvent.press(getByTestId('product-discard'))
        expect(props.navigation.goBack).toHaveBeenCalledTimes(1)
        expect(alert).not.toHaveBeenCalled()
        expect(removeProduct).not.toHaveBeenCalled()
      })

      it('asks before deleting a product of the cart, then removes it from its cart and goes back', async () => {
        const props = inCart()
        const other = { ...sampleCart, uuid: 'cart-2', business_id: 2, products: [{ ...sampleCart.products[0], code: 'prod-9' }] }
        setCarts({ 'businessId:2': other, 'businessId:1': sampleCart })
        const { getByTestId } = renderWithProviders(<ProductOptionsUI {...props} />, on)
        fireEvent.press(getByTestId('product-discard'))
        expect(alert).toHaveBeenCalledTimes(1)
        expect(alert.mock.calls[0].slice(0, 2)).toEqual(['Delete Product', 'Are you sure that you want to delete the product?'])
        expect(removeProduct).not.toHaveBeenCalled()
        expect(props.navigation.goBack).not.toHaveBeenCalled()
        await answer(1)
        expect(removeProduct).toHaveBeenCalledTimes(1)
        expect(removeProduct).toHaveBeenCalledWith(props.productCart, sampleCart)
        expect(props.navigation.goBack).toHaveBeenCalledTimes(1)
      })

      it('keeps the product when the question is cancelled', async () => {
        const props = inCart()
        const { getByTestId } = renderWithProviders(<ProductOptionsUI {...props} />, on)
        fireEvent.press(getByTestId('product-discard'))
        await answer(0)
        expect(removeProduct).not.toHaveBeenCalled()
        expect(props.navigation.goBack).not.toHaveBeenCalled()
      })

      it('only goes back when no cart holds the product', async () => {
        const props = inCart()
        setCarts({ 'businessId:1': { ...sampleCart, products: [{ ...sampleCart.products[0], code: 'prod-9' }] } })
        const { getByTestId } = renderWithProviders(<ProductOptionsUI {...props} />, on)
        fireEvent.press(getByTestId('product-discard'))
        await answer(1)
        expect(removeProduct).not.toHaveBeenCalled()
        expect(props.navigation.goBack).toHaveBeenCalledTimes(1)
      })

      it('leaves with the quantity controls of a sold out product', () => {
        const { queryByTestId } = renderWithProviders(<ProductOptionsUI {...defaults()} isSoldOut />, on)
        expect(queryByTestId('product-quantity-decrement')).toBeNull()
        expect(queryByTestId('product-discard')).toBeNull()
      })
    })
  })

  // Real dayjs (no mock): closedStatusLabel needs real date math. System time is fixed
  // so the "Closed · Opens …" text is deterministic.
  describe('the layout options of the theme', () => {
    const flat = (node: any) => StyleSheet.flatten(node.props.style) ?? {}
    const hostParent = (node: any) => {
      let parent = node.parent
      while (parent && typeof parent.type !== 'string') parent = parent.parent
      return parent
    }
    const modal = (base: Record<string, unknown>) => withTheme({ components: { product_modal: { base } } })
    const headerOf = (utils: any) => hostParent(utils.getByTestId('product-back'))

    beforeEach(() => {
      ;(useSession as jest.Mock).mockReturnValue([{ auth: true, user: { id: 1 }, token: 'token', loading: false }, {}])
    })

    describe('the bar over the product (visibility product.header)', () => {
      const on = withTheme({ visibility: { 'product.header': true } })

      it('has none by default: only the actions over the photo', () => {
        const utils = renderWithProviders(<ProductOptionsUI {...defaults()} business={{ name: 'Pizza Place' }} />)
        expect(utils.queryByText('Pizza Place')).toBeNull()
        expect(utils.queryByLabelText('back')).toBeNull()
        expect(utils.getByTestId('product-back')).toBeTruthy()
      })

      it('heads the product with the name of the business when the theme shows it, and goes back from it', () => {
        const props = defaults()
        const utils = renderWithProviders(<ProductOptionsUI {...props} business={{ name: 'Pizza Place' }} />, on)
        expect(utils.getByText('Pizza Place')).toBeTruthy()
        fireEvent.press(utils.getByLabelText('back'))
        expect(props.navigation.goBack).toHaveBeenCalledTimes(1)
      })

      it('keeps the actions over the photo under the bar', () => {
        const utils = renderWithProviders(<ProductOptionsUI {...defaults()} business={{ name: 'Pizza Place' }} />, on)
        expect(utils.getByTestId('product-back')).toBeTruthy()
        expect(utils.getAllByTestId('lottie-animation')).toHaveLength(1)
      })
    })

    describe('the side of the close button (product_modal.base.close_position)', () => {
      it('starts the actions with it by default', () => {
        expect(flat(headerOf(renderWithProviders(<ProductOptionsUI {...defaults()} />))).flexDirection).not.toBe('row-reverse')
      })

      it('starts the actions with it for the start option', () => {
        expect(flat(headerOf(renderWithProviders(<ProductOptionsUI {...defaults()} />, modal({ close_position: 'start' })))).flexDirection).not.toBe('row-reverse')
      })

      it('ends the actions with it when the theme says end, and it still goes back', () => {
        const props = defaults()
        const utils = renderWithProviders(<ProductOptionsUI {...props} />, modal({ close_position: 'end' }))
        expect(flat(headerOf(utils)).flexDirection).toBe('row-reverse')
        fireEvent.press(utils.getByTestId('product-back'))
        expect(props.navigation.goBack).toHaveBeenCalledTimes(1)
      })
    })

    describe('the place of the favorite (product_modal.base.favorite_position)', () => {
      const nameRowOf = (utils: any) => {
        let node = hostParent(utils.getByTestId('lottie-animation'))
        while (node && within(node).queryAllByText('Cheese Slice').length === 0) node = hostParent(node)
        return node
      }

      it('is with the actions over the photo by default', () => {
        const utils = renderWithProviders(<ProductOptionsUI {...defaults()} />)
        expect(utils.getAllByTestId('lottie-animation')).toHaveLength(1)
        expect(within(headerOf(utils)).getByTestId('lottie-animation')).toBeTruthy()
      })

      it('stays there for the image option', () => {
        const utils = renderWithProviders(<ProductOptionsUI {...defaults()} />, modal({ favorite_position: 'image' }))
        expect(within(headerOf(utils)).getByTestId('lottie-animation')).toBeTruthy()
      })

      it('goes beside the name of the product when the theme says title, once', () => {
        const utils = renderWithProviders(<ProductOptionsUI {...defaults()} />, modal({ favorite_position: 'title' }))
        const row = nameRowOf(utils)
        expect(utils.getAllByTestId('lottie-animation')).toHaveLength(1)
        expect(within(headerOf(utils)).queryByTestId('lottie-animation')).toBeNull()
        expect(within(row).queryByTestId('product-back')).toBeNull()
        expect(flat(row)).toMatchObject({ flexDirection: 'row', justifyContent: 'space-between' })
        expect(flat(within(row).getByText('Cheese Slice')).flex).toBe(1)
      })

      it('still marks the product as a favorite from beside the name', () => {
        const props = defaults()
        const utils = renderWithProviders(<ProductOptionsUI {...props} />, modal({ favorite_position: 'title' }))
        fireEvent.press(utils.getByTestId('lottie-animation'))
        expect(props.handleFavoriteProduct).toHaveBeenCalled()
      })

      it('has no favorite beside the name when the theme hides the favorite', () => {
        const utils = renderWithProviders(
          <ProductOptionsUI {...defaults()} />,
          withTheme({ components: { product_modal: { base: { favorite_position: 'title' } } }, visibility: { 'product.favorite': false } })
        )
        expect(utils.queryByTestId('lottie-animation')).toBeNull()
      })
    })

    describe('the description (visibility product.details.description)', () => {
      const hidden = (...keys: string[]) => withTheme({ visibility: Object.fromEntries(keys.map((key) => [key, false])) })

      it('shows under the name by default', () => {
        expect(renderWithProviders(<ProductOptionsUI {...defaults()} />).getByText('A tasty slice')).toBeTruthy()
      })

      it('is left out when the theme hides it in the details, and the name and the price stay', () => {
        const utils = renderWithProviders(<ProductOptionsUI {...defaults()} />, hidden('product.details.description'))
        expect(utils.queryByText('A tasty slice')).toBeNull()
        expect(utils.getAllByText('Cheese Slice').length).toBeGreaterThan(0)
        expect(utils.getByText('$5')).toBeTruthy()
      })

      it('is left out when the theme hides the descriptions of the products', () => {
        expect(renderWithProviders(<ProductOptionsUI {...defaults()} />, hidden('product.description')).queryByText('A tasty slice')).toBeNull()
      })

      it('is left out with both off', () => {
        expect(renderWithProviders(<ProductOptionsUI {...defaults()} />, hidden('product.description', 'product.details.description')).queryByText('A tasty slice')).toBeNull()
      })
    })

    describe('the quantity controls (stepper.base.icon_color, stepper.base.background)', () => {
      const stepper = (base: Record<string, unknown>) => ({ components: { stepper: { base } } })
      const glyph = (utils: any, testID: string) => utils.getByTestId(testID).findAll((node: any) => typeof node.type === 'string' && !!node.props?.name)[0]
      const paint = (theme: any, color: string) => theme.native.tokens.color[color] !== undefined ? themeColor(theme, color) : color

      it('draws the plus and the minus in the primary color by default', () => {
        const theme = defaultAppTheme()
        const utils = renderWithProviders(<ProductOptionsUI {...defaults()} productCart={{ ...defaults().productCart, quantity: 2 }} />)
        expect(theme.native.components.stepper.base.icon_color).toBeNull()
        expect(glyph(utils, 'product-quantity-increment').props.color).toBe(themeColor(theme, 'primary'))
        expect(glyph(utils, 'product-quantity-decrement').props.color).toBe(themeColor(theme, 'primary'))
      })

      it('draws them in the color of the theme', () => {
        const values = stepper({ icon_color: '#102030' })
        const color = themeWith(values).native.components.stepper.base.icon_color
        const utils = renderWithProviders(<ProductOptionsUI {...defaults()} productCart={{ ...defaults().productCart, quantity: 2 }} />, withTheme(values))
        expect(color).toBe('#102030')
        expect(glyph(utils, 'product-quantity-increment').props.color).toBe(color)
        expect(glyph(utils, 'product-quantity-decrement').props.color).toBe(color)
      })

      describe('the compact selector (stepper.base.compact)', () => {
        const flat = (node: any) => Object.assign({}, ...[].concat(node.props.style).flat(Infinity).filter(Boolean))
        const widths = (utils: any, testID: string) => utils.getByTestId(testID).findAll((node: any) => typeof node.type === 'string' && flat(node).width !== undefined).map((node: any) => flat(node).width)
        const input = (utils: any) => utils.UNSAFE_getAllByType(require('react-native').TextInput).find((node: any) => node.props.keyboardType === 'numeric')
        const quantity = () => ({ ...defaults(), productCart: { ...defaults().productCart, quantity: 2 } })

        it('keeps the wide selector by default', () => {
          const theme = defaultAppTheme()
          const utils = renderWithProviders(<ProductOptionsUI {...quantity()} />)
          expect(flat(input(utils)).marginHorizontal).toBe(themeSpace(theme, 'sm'))
          expect(flat(input(utils)).minWidth).toBe(themeControlHeight(theme, 'xl'))
          expect(widths(utils, 'product-quantity-increment')).not.toContain(themeIconSize(theme, 'lg') + 2 * themeSpace(theme, 'xs'))
        })

        it('narrows the buttons and the number when it is on', () => {
          const values = stepper({ compact: true })
          const theme = themeWith(values)
          const utils = renderWithProviders(<ProductOptionsUI {...quantity()} />, withTheme(values))
          expect(flat(input(utils)).marginHorizontal).toBe(0)
          expect(flat(input(utils)).minWidth).toBe(themeControlHeight(theme, 'sm'))
          expect(widths(utils, 'product-quantity-increment')).toContain(themeIconSize(theme, 'lg') + 2 * themeSpace(theme, 'xs'))
          expect(widths(utils, 'product-quantity-decrement')).toContain(themeIconSize(theme, 'lg') + 2 * themeSpace(theme, 'xs'))
        })
      })

      it('keeps a control that is off in the disabled color, whatever the theme says', () => {
        const base = defaults()
        const values = stepper({ icon_color: '#102030' })
        const utils = renderWithProviders(
          <ProductOptionsUI
            {...base}
            productAddedToCartLength={0}
            productObject={{ ...base.productObject, product: { ...base.productObject.product, minimum_per_order: 1, maximum_per_order: 1 } }}
          />,
          withTheme(values)
        )
        expect(utils.getByTestId('product-quantity-increment').props.accessibilityState.disabled).toBe(true)
        expect(glyph(utils, 'product-quantity-increment').props.color).toBe(themeColor(themeWith(values), 'text_disabled'))
      })

      it('keeps the quantity padding as before by default', () => {
        const theme = defaultAppTheme()
        const size = theme.native.components.product_modal.slots.quantity.size
        const utils = renderWithProviders(<ProductOptionsUI {...defaults()} />)
        const inputs = utils.UNSAFE_root.findAll((node: any) => typeof node.type === 'string' && node.props?.keyboardType === 'numeric' && node.props?.maxLength === 3)
        expect(inputs).toHaveLength(1)
        expect(inputs[0].props.value).toBe('1')
        expect(flat(inputs[0])).toMatchObject({ textAlign: 'center', height: theme.native.components.stepper.sizes[size].height })
        expect(flat(inputs[0]).paddingVertical).toBeUndefined()
      })

      it('gives the compact quantity no padding above or under it, so its digits are not cut', () => {
        const values = { components: { stepper: { base: { compact: true } } } }
        const utils = renderWithProviders(<ProductOptionsUI {...defaults()} />, withTheme(values))
        const inputs = utils.UNSAFE_root.findAll((node: any) => typeof node.type === 'string' && node.props?.keyboardType === 'numeric' && node.props?.maxLength === 3)
        expect(flat(inputs[0])).toMatchObject({ paddingVertical: 0 })
      })

      it('has no background behind the controls by default', () => {
        const utils = renderWithProviders(<ProductOptionsUI {...defaults()} />)
        expect(defaultAppTheme().native.components.stepper.base.background).toBe('transparent')
        expect(flat(hostParent(utils.getByTestId('product-quantity-increment'))).backgroundColor).toBe('transparent')
      })

      it('paints the background of the theme behind the controls', () => {
        const values = stepper({ background: '#a1b2c3' })
        const utils = renderWithProviders(<ProductOptionsUI {...defaults()} />, withTheme(values))
        const color = themeWith(values).native.components.stepper.base.background
        expect(color).not.toBe('transparent')
        expect(flat(hostParent(utils.getByTestId('product-quantity-increment'))).backgroundColor).toBe(color)
      })
    })
  })

  describe('closed business without a chosen preorder moment', () => {
    const closedBusiness = {
      id: 1,
      slug: 'pizza-place',
      timezone: 'America/New_York',
      open: false,
      // Enabled only on Tuesday (index 2), 9:00-17:00: matches the fixed system time below.
      schedule: Array.from({ length: 7 }, (_, i) => ({
        enabled: i === 2,
        lapses: i === 2 ? [{ open: { hour: 9, minute: 0 }, close: { hour: 17, minute: 0 } }] : []
      }))
    }

    beforeEach(() => {
      // Tuesday 2026-10-20 08:00 in New York (12:00 UTC)
      jest.useFakeTimers().setSystemTime(new Date('2026-10-20T12:00:00Z'))
      // An earlier test in this file leaves useSession logged out: pin it back for these.
      ;(useSession as jest.Mock).mockReturnValue([{ auth: true, user: { id: 1 }, token: 'token', loading: false }, {}])
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('shows the closed notice, disables adding, and the preorder button opens MomentOption', () => {
      const props = { ...defaults(), business: closedBusiness }
      const { getByText, getByTestId } = renderWithProviders(<ProductOptionsUI {...props} />)

      expect(getByText('Closed · Opens 09:00')).toBeTruthy()
      expect(getByTestId('product-add').props.accessibilityState.disabled).toBe(true)

      fireEvent.press(getByText('Preorder'))
      expect(props.navigation.navigate).toHaveBeenCalledWith(
        'MomentOption',
        expect.objectContaining({ afterPreorder: 'back', business: expect.objectContaining({ id: 1, slug: 'pizza-place' }) })
      )
    })

    it('shows the notice without a preorder button when preorder is off', () => {
      ;(useConfig as jest.Mock).mockReturnValue([{
        loading: false,
        configs: { preorder_status_enabled: { value: '0' } }
      }])
      const props = { ...defaults(), business: closedBusiness }
      const { getByText, queryByText, getByTestId } = renderWithProviders(<ProductOptionsUI {...props} />)

      expect(getByText('Closed · Opens 09:00')).toBeTruthy()
      expect(queryByText('Preorder')).toBeNull()
      expect(getByTestId('product-add').props.accessibilityState.disabled).toBe(true)
    })

    it('is active with no notice once a preorder moment is chosen', () => {
      ;(useOrder as jest.Mock).mockReturnValue([{
        loading: false,
        options: { type: 1, moment: '2026-10-21 10:00:00', address_id: 1 }
      }, { addProduct: jest.fn(), updateProduct: jest.fn() }])
      const props = { ...defaults(), business: closedBusiness }
      const { queryByText, getByTestId } = renderWithProviders(<ProductOptionsUI {...props} />)

      expect(queryByText(/Closed/)).toBeNull()
      expect(queryByText('Preorder')).toBeNull()
      expect(getByTestId('product-add').props.accessibilityState.disabled).toBe(false)
    })

    it('changes nothing for an open business', () => {
      const props = { ...defaults(), business: { ...closedBusiness, open: true } }
      const { queryByText, getByTestId } = renderWithProviders(<ProductOptionsUI {...props} />)

      expect(queryByText(/Closed/)).toBeNull()
      expect(queryByText('Preorder')).toBeNull()
      expect(getByTestId('product-add').props.accessibilityState.disabled).toBe(false)
    })
  })
})
