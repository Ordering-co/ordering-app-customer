import '../../../../../../jest/helpers/registerM4NativeMocks'

import React from 'react'
import { StyleSheet } from 'react-native'
import { act, fireEvent, within } from '@testing-library/react-native'

import { CartProductCard } from '../CartProductCard'
import OButton from '../../shared/OButton'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'
import { themeWith, withTheme } from '../../../../../../jest/helpers/themeWith'
import { defaultAppTheme } from '@/theme/engine'
import { themeIconSize, themePart, themeSpace } from '@/theme/helpers'

jest.mock('@components', () => require('../../../../../../jest/helpers/m4MenuComponentsMock').getMock())
// The real OAlert (the shared mock swaps it for the modal one, which draws no children): the
// delete button lives inside it.
jest.mock('@ui', () => ({
  ...require('../../../../../../jest/helpers/m4MenuUiMock').getUiMock(),
  OAlert: require('@/ui/src/components/shared/OAlert').default
}))

describe('CartProductCard', () => {
  const renderCard = (product: any) => {
    const changeQuantity = jest.fn().mockResolvedValue(undefined)
    const utils = renderWithProviders(
      <CartProductCard
        product={{ id: 1, name: 'Soy', price: 7, total: 7, valid_menu: true, ...product }}
        isCartProduct
        onEditProduct={jest.fn()}
        onDeleteProduct={jest.fn()}
        handleEditProduct={jest.fn()}
        changeQuantity={changeQuantity}
      />
    )
    // The increment is the stepper's icon button (OButton, a Pressable).
    const plusButton = utils.getByTestId('cart-product-increase')
    return { changeQuantity, plusButton }
  }

  it('disables increment when the cart already holds maximum_per_order', () => {
    const { plusButton } = renderCard({ quantity: 1, balance: 1, maximum_per_order: 1 })
    expect(plusButton.props.accessibilityState.disabled).toBe(true)
  })

  it('counts other cart lines of the same product against maximum_per_order', () => {
    const { plusButton } = renderCard({ quantity: 1, balance: 2, maximum_per_order: 2 })
    expect(plusButton.props.accessibilityState.disabled).toBe(true)
  })

  it('increments while below maximum_per_order', () => {
    const { changeQuantity, plusButton } = renderCard({ quantity: 1, balance: 1, maximum_per_order: 2 })
    expect(plusButton.props.accessibilityState.disabled).toBe(false)
    fireEvent.press(plusButton)
    expect(changeQuantity).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), 2)
  })

  it('leaves the touch of the delete button to the alert that wraps it', () => {
    // The trash is an OButton inside OAlert, and OAlert is the touchable: a button that takes
    // the touch itself (it has no handler) never opens the alert, and the line cannot be deleted.
    const utils = renderWithProviders(
      <CartProductCard
        product={{ id: 1, name: 'Soy', price: 7, total: 7, valid_menu: true, quantity: 1, balance: 1 }}
        isCartProduct
        onEditProduct={jest.fn()}
        onDeleteProduct={jest.fn()}
        handleEditProduct={jest.fn()}
        changeQuantity={jest.fn()}
      />
    )
    expect(utils.getByTestId('cart-product-delete').props.pointerEvents).toBe('none')
  })

  it('increments without limit when maximum_per_order is not set', () => {
    const { changeQuantity, plusButton } = renderCard({ quantity: 5, balance: 5, maximum_per_order: null })
    fireEvent.press(plusButton)
    expect(changeQuantity).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), 6)
  })
})

describe('CartProductCard: the options of the theme', () => {
  const flat = (node: any) => StyleSheet.flatten(node.props.style) ?? {}
  const hostParent = (node: any) => {
    let parent = node.parent
    while (parent && typeof parent.type !== 'string') parent = parent.parent
    return parent
  }
  const photo = 'https://cdn.test/soy.jpg'
  const renderLine = (product: any = {}, options?: any) => renderWithProviders(
    <CartProductCard
      product={{ id: 1, name: 'Soy', price: 7, total: 7, valid_menu: true, quantity: 1, balance: 1, ...product }}
      isCartProduct
      onEditProduct={jest.fn()}
      onDeleteProduct={jest.fn()}
      handleEditProduct={jest.fn()}
      changeQuantity={jest.fn().mockResolvedValue(undefined)}
    />,
    options
  )
  const controlsOf = (utils: any) => hostParent(utils.getByTestId('cart-product-increase'))
  const photosIn = (node: any) => node.findAll((child: any) => typeof child.type === 'string' && child.props?.source?.uri === photo)
  const buttons = (utils: any) => utils.UNSAFE_getAllByType(OButton)
  const buttonOf = (utils: any, label: string) => buttons(utils).find((button: any) => button.props.accessibilityLabel === label)

  describe('the background of the quantity controls (stepper.base.background)', () => {
    it('is the transparent one of the stepper by default', () => {
      const stepper = themePart(defaultAppTheme(), 'stepper', 'base')
      expect(stepper.background).toBe('transparent')
      expect(flat(controlsOf(renderLine()))).toMatchObject({ backgroundColor: 'transparent', borderRadius: stepper.radius })
    })

    it('is the color of the theme, in the radius of the stepper', () => {
      const values = { components: { stepper: { base: { background: '#102030' } } } }
      const stepper = themePart(themeWith(values), 'stepper', 'base')
      expect(stepper.background).not.toBe('transparent')
      expect(flat(controlsOf(renderLine({}, withTheme(values))))).toMatchObject({ backgroundColor: stepper.background, borderRadius: stepper.radius })
    })
  })

  describe('the side of the photo (cart.base.line_image_position)', () => {
    const atEnd = { components: { cart: { base: { line_image_position: 'end' } } } }

    it('starts the line with the photo by default, the controls under the name', () => {
      const utils = renderLine({ images: photo })
      const gap = themePart(defaultAppTheme(), 'product_card', 'base.info_gap')
      const info = flat(hostParent(utils.getByText('Soy')))
      const column = hostParent(controlsOf(utils))
      expect(info.marginLeft).toBe(gap)
      expect(info.marginRight).toBeUndefined()
      expect(within(column).getByText('Soy')).toBeTruthy()
      expect(photosIn(column)).toHaveLength(0)
      expect(photosIn(utils.UNSAFE_root).length).toBeGreaterThan(0)
    })

    it('ends the line with the photo over the controls when the theme says end', () => {
      const utils = renderLine({ images: photo }, withTheme(atEnd))
      const gap = themePart(themeWith(atEnd), 'product_card', 'base.info_gap')
      const info = flat(hostParent(utils.getByText('Soy')))
      const column = hostParent(controlsOf(utils))
      expect(info.marginRight).toBe(gap)
      expect(info.marginLeft).toBeUndefined()
      expect(flat(column).alignItems).toBe('flex-end')
      expect(within(column).queryByText('Soy')).toBeNull()
      expect(photosIn(column).length).toBeGreaterThan(0)
      expect(photosIn(utils.UNSAFE_root)).toHaveLength(photosIn(column).length)
    })

    it('keeps the name, the price and the quantity on either side', () => {
      const utils = renderLine({ images: photo, quantity: 3, balance: 3 }, withTheme(atEnd))
      expect(utils.getByText('Soy')).toBeTruthy()
      expect(utils.getByText('$7')).toBeTruthy()
      expect(utils.getByText('3')).toBeTruthy()
    })
  })

  describe('the width of the quantity under a photo at the end', () => {
    const atEnd = { components: { cart: { base: { line_image_position: 'end', line_image_size: 80 } } } }

    it('keeps the controls at their own width with the normal selector, so nothing is cut', () => {
      const utils = renderLine({ images: photo }, withTheme(atEnd))
      const column = hostParent(controlsOf(utils))
      expect(flat(column).width).toBeUndefined()
      expect(flat(controlsOf(utils)).alignSelf).toBe('flex-end')
    })

    it('is the width of the photo with the compact selector, the controls spread over it', () => {
      const values = { components: { cart: { base: { line_image_position: 'end', line_image_size: 80 } }, stepper: { base: { compact: true } } } }
      const utils = renderLine({ images: photo }, withTheme(values))
      const column = hostParent(controlsOf(utils))
      expect(flat(column).width).toBe(80)
      expect(flat(controlsOf(utils))).toMatchObject({ alignSelf: 'stretch', justifyContent: 'space-between' })
    })

    it('leaves the column and the controls as they were with the photo at the start', () => {
      const utils = renderLine({ images: photo })
      expect(flat(controlsOf(utils)).alignSelf).toBe('flex-end')
      expect(flat(controlsOf(utils)).justifyContent).toBeUndefined()
    })
  })

  describe('the compact selector (stepper.base.compact)', () => {
    const width = (node: any) => flat(node.findAll((child: any) => typeof child.type === 'string' && flat(child).width !== undefined)[0] ?? { props: {} }).width

    it('keeps the buttons of the control size by default', () => {
      const utils = renderLine({ quantity: 2, balance: 2 })
      const theme = defaultAppTheme()
      expect(width(utils.getByTestId('cart-product-increase'))).not.toBe(themeIconSize(theme, 'lg') + 2 * themeSpace(theme, 'xs'))
    })

    it('narrows the buttons when it is on', () => {
      const values = { components: { stepper: { base: { compact: true } } } }
      const utils = renderLine({ quantity: 2, balance: 2 }, withTheme(values))
      const theme = themeWith(values)
      const size = theme.native.components.cart.slots.quantity.size
      const expected = theme.native.components.button.sizes[size].icon_size + 2 * themeSpace(theme, 'xs')
      expect(width(utils.getByTestId('cart-product-increase'))).toBe(expected)
      expect(buttonOf(utils, 'Decrease').props.style).toMatchObject({ width: expected })
    })
  })

  describe('the description of a product (visibility cart.products.description)', () => {
    const line = { business_id: 7, category_id: 8, id: 9 }
    const on = withTheme({ visibility: { 'cart.products.description': true } })
    let get: jest.Mock

    beforeEach(() => {
      require('@/ui/src/components/ProductItemAccordion/CartProductDescription').clearCartProductDescriptions()
      get = jest.fn().mockResolvedValue({ content: { result: { description: 'Gluten free bread' } } })
      const products = jest.fn(() => ({ get }))
      const categories = jest.fn(() => ({ products }))
      const businesses = jest.fn(() => ({ categories }))
      require('@components').useApi = jest.fn(() => [{ businesses }])
    })

    it('is not asked for nor shown by default', async () => {
      const utils = renderLine(line)
      await act(async () => {})
      expect(get).not.toHaveBeenCalled()
      expect(utils.queryByText('Gluten free bread')).toBeNull()
      expect(utils.queryByText('View more')).toBeNull()
    })

    it('shows it with a link that opens the product when it is on', async () => {
      const handleEditProduct = jest.fn()
      const utils = renderWithProviders(
        <CartProductCard
          product={{ id: 9, business_id: 7, category_id: 8, name: 'Soy', price: 7, total: 7, valid_menu: true, quantity: 1, balance: 1 }}
          isCartProduct
          onEditProduct={jest.fn()}
          onDeleteProduct={jest.fn()}
          handleEditProduct={handleEditProduct}
          changeQuantity={jest.fn()}
        />,
        on
      )
      expect(await utils.findByText('Gluten free bread')).toBeTruthy()
      expect(utils.getByText('Gluten free bread').props.numberOfLines).toBe(themePart(themeWith(on.themeOverrides as any), 'product_card', 'base.description_lines'))
      fireEvent.press(utils.getByText('View more'))
      expect(handleEditProduct).toHaveBeenCalledWith(expect.objectContaining({ id: 9 }))
    })

    it('asks for each product once', async () => {
      const first = renderLine(line, on)
      await first.findByText('Gluten free bread')
      const second = renderLine(line, on)
      await second.findByText('Gluten free bread')
      expect(get).toHaveBeenCalledTimes(1)
    })

    it('shows nothing when the product has no description', async () => {
      get.mockResolvedValue({ content: { result: { description: '' } } })
      const utils = renderLine({ ...line, id: 10 }, on)
      await act(async () => {})
      expect(utils.queryByTestId('cart-product-description')).toBeNull()
    })
  })

  describe('the size of the quantity controls (cart.slots.quantity)', () => {
    it('is the medium one by default', () => {
      const sizes = buttons(renderLine()).map((button: any) => button.props.size)
      expect(sizes.length).toBeGreaterThan(1)
      sizes.forEach((size: string) => expect(size).toBe('md'))
    })

    it.each([['sm'], ['lg']])('is %s for every button of the line when the slot says so', (size) => {
      const options = withTheme({ components: { cart: { slots: { quantity: { size } } } } })
      const one = buttons(renderLine({}, options)).map((button: any) => button.props.size)
      const many = buttons(renderLine({ quantity: 3, balance: 3 }, options)).map((button: any) => button.props.size)
      expect(one.length).toBeGreaterThan(1)
      expect(many.length).toBeGreaterThan(1)
      ;[...one, ...many].forEach((value: string) => expect(value).toBe(size))
    })
  })

  describe('the button that removes the line (cart.slots.remove)', () => {
    it('is a danger button of the appearance of the stepper by default', () => {
      const stepper = themePart(defaultAppTheme(), 'stepper', 'base')
      const remove = buttonOf(renderLine(), 'Delete Product')
      expect(remove.props).toMatchObject({ iconOnly: true, color: 'danger', appearance: stepper.button_appearance })
      expect(remove.props.onClick).toBeUndefined()
    })

    it('takes the color and the appearance of the slot', () => {
      const values = { components: { cart: { slots: { remove: { color: 'neutral', appearance: 'outline' } } } } }
      const remove = buttonOf(renderLine({}, withTheme(values)), 'Delete Product')
      expect(remove.props).toMatchObject({ iconOnly: true, color: 'neutral', appearance: 'outline' })
    })

    it('keeps the appearance of the stepper for a slot that only names a color', () => {
      const values = { components: { cart: { slots: { remove: { color: 'primary' } } }, stepper: { base: { button_appearance: 'tonal' } } } }
      const remove = buttonOf(renderLine({}, withTheme(values)), 'Delete Product')
      expect(remove.props).toMatchObject({ color: 'primary', appearance: 'tonal' })
    })
  })

  describe('a remove button on every line (visibility cart.products.remove_button)', () => {
    const always = withTheme({ visibility: { 'cart.products.remove_button': true } })

    it('removes a line of one unit and decreases a line of more by default', () => {
      const one = renderLine()
      expect(one.getByTestId('cart-product-delete')).toBeTruthy()
      expect(one.queryByLabelText('Decrease')).toBeNull()
      const many = renderLine({ quantity: 3, balance: 3 })
      expect(many.queryByTestId('cart-product-delete')).toBeNull()
      expect(many.getByLabelText('Decrease').props.accessibilityState.disabled).toBe(false)
    })

    it('shows both on a line of more than one unit when the theme turns it on', () => {
      const utils = renderLine({ quantity: 3, balance: 3 }, always)
      expect(utils.getByTestId('cart-product-delete')).toBeTruthy()
      expect(utils.getByLabelText('Decrease').props.accessibilityState.disabled).toBe(false)
    })

    it('shows both on a line of one unit, which cannot decrease', () => {
      const utils = renderLine({}, always)
      expect(utils.getByTestId('cart-product-delete')).toBeTruthy()
      expect(utils.getByLabelText('Decrease').props.accessibilityState.disabled).toBe(true)
    })

    it('decreases from the line with both buttons', () => {
      const changeQuantity = jest.fn().mockResolvedValue(undefined)
      const utils = renderWithProviders(
        <CartProductCard
          product={{ id: 1, name: 'Soy', price: 7, total: 7, valid_menu: true, quantity: 3, balance: 3 }}
          isCartProduct
          onEditProduct={jest.fn()}
          onDeleteProduct={jest.fn()}
          handleEditProduct={jest.fn()}
          changeQuantity={changeQuantity}
        />,
        always
      )
      fireEvent.press(utils.getByLabelText('Decrease'))
      expect(changeQuantity).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), 2)
    })

    it('has no remove button on the line of a cart with a payment in progress', () => {
      const utils = renderWithProviders(
        <CartProductCard
          product={{ id: 1, name: 'Soy', price: 7, total: 7, valid_menu: true, quantity: 3, balance: 3 }}
          isCartProduct
          isCartPending
          onEditProduct={jest.fn()}
          onDeleteProduct={jest.fn()}
          handleEditProduct={jest.fn()}
          changeQuantity={jest.fn()}
        />,
        always
      )
      expect(utils.queryByTestId('cart-product-delete')).toBeNull()
      expect(utils.queryByLabelText('Decrease')).toBeNull()
    })
  })

  describe('the tags of the product (visibility cart.products.tags)', () => {
    const shown = { visibility: { 'cart.products.tags': true } }
    const tags = [
      { id: 1, name: 'Vegan', image: 'https://cdn.test/vegan.png' },
      { id: 2, name: 'No image' },
      { id: 3, name: 'Spicy', image: 'https://cdn.test/spicy.png' }
    ]
    const pictures = (utils: any) => utils.getByTestId('cart-product-tags').findAll((node: any) => typeof node.type === 'string' && !!node.props?.source)

    it('has none by default', () => {
      expect(renderLine({ tags }).queryByTestId('cart-product-tags')).toBeNull()
    })

    it('draws the tags that have an image beside the price, at the tag size of the product card', () => {
      const utils = renderLine({ tags }, withTheme(shown))
      const size = themePart(themeWith(shown), 'product_card', 'base.tag_size')
      expect(pictures(utils)).toHaveLength(2)
      pictures(utils).forEach((picture: any) => expect(flat(picture)).toEqual({ width: size, height: size }))
      expect(pictures(utils)[0].props.source.uri).toContain('vegan')
      expect(pictures(utils)[1].props.source.uri).toContain('spicy')
      expect(within(hostParent(utils.getByTestId('cart-product-tags'))).getByText('$7')).toBeTruthy()
    })

    it.each([
      ['no tags', undefined],
      ['an empty list of tags', []],
      ['tags without an image', [{ id: 2, name: 'No image' }]]
    ])('has none for a product with %s', (_name, list) => {
      expect(renderLine({ tags: list }, withTheme(shown)).queryByTestId('cart-product-tags')).toBeNull()
    })
  })

  describe('the ink of the trash (cart.slots.remove.appearance)', () => {
    const trashOf = (utils: any) => utils.getByTestId('cart-product-delete').findAll((node: any) => typeof node.type === 'string' && node.props?.name === 'trash')[0]
    const slotOf = (slot: Record<string, unknown>) => ({ components: { cart: { slots: { remove: slot } } } })

    it('is the danger ink of the appearance of the stepper by default', () => {
      const theme = defaultAppTheme()
      const appearance = themePart(theme, 'stepper', 'base.button_appearance')
      expect(trashOf(renderLine()).props.color).toBe(themePart(theme, 'button', `variants.danger.${appearance}.color`))
    })

    it('follows the color of a slot without an appearance, in the appearance of the stepper', () => {
      const values = slotOf({ color: 'primary' })
      const appearance = themePart(themeWith(values), 'stepper', 'base.button_appearance')
      expect(trashOf(renderLine({}, withTheme(values))).props.color).toBe(themePart(themeWith(values), 'button', `variants.primary.${appearance}.color`))
    })

    it.each([
      ['solid', 'danger'],
      ['tonal', 'danger'],
      ['solid', 'neutral']
    ])('is left to a %s %s button, which paints it with its own ink', (appearance, color) => {
      const values = slotOf({ appearance, color })
      const theme = themeWith(values)
      expect(trashOf(renderLine({}, withTheme(values))).props.color).toBe(themePart(theme, 'button', `variants.${color}.${appearance}.color`))
    })

    it('reads on a solid danger button: not the danger ink of the stepper over the danger fill', () => {
      const values = slotOf({ appearance: 'solid', color: 'danger' })
      const theme = themeWith(values)
      const stepperInk = themePart(theme, 'button', `variants.danger.${themePart(theme, 'stepper', 'base.button_appearance')}.color`)
      const glyph = trashOf(renderLine({}, withTheme(values))).props.color
      expect(glyph).not.toBe(stepperInk)
      expect(glyph).not.toBe(themePart(theme, 'button', 'variants.danger.solid.background'))
    })
  })

  describe('the space between the quantity controls (cart.slots.quantity.size)', () => {
    const gapOf = (size?: string) => {
      const values = size ? { components: { cart: { slots: { quantity: { size } } } } } : {}
      return { gap: flat(controlsOf(renderLine({}, withTheme(values)))).gap, theme: themeWith(values) }
    }

    it('is the medium space by default', () => {
      const { gap, theme } = gapOf()
      expect(gap).toBe(themeSpace(theme, 'md'))
    })

    it('is the extra small space for the small controls', () => {
      const { gap, theme } = gapOf('sm')
      expect(gap).toBe(themeSpace(theme, 'xs'))
      expect(gap).toBeLessThan(themeSpace(theme, 'md'))
    })

    it.each([['md'], ['lg']])('stays the medium space for the %s controls', (size) => {
      const { gap, theme } = gapOf(size)
      expect(gap).toBe(themeSpace(theme, 'md'))
    })
  })

  describe('the place of the price (cart.base.line_price_position)', () => {
    const line = { business_id: 7, category_id: 8, id: 9 }
    const labels = (utils: any) => {
      const info = hostParent(utils.getByText('Soy'))
      return info.children
        .filter((child: any) => typeof child !== 'string')
        .map((child: any) => (within(child).queryByText('$7') ? 'price' : within(child).queryByText('Gluten free bread') ? 'description' : 'name'))
    }

    beforeEach(() => {
      require('@/ui/src/components/ProductItemAccordion/CartProductDescription').clearCartProductDescriptions()
      const get = jest.fn().mockResolvedValue({ content: { result: { description: 'Gluten free bread' } } })
      const products = jest.fn(() => ({ get }))
      const categories = jest.fn(() => ({ products }))
      const businesses = jest.fn(() => ({ categories }))
      require('@components').useApi = jest.fn(() => [{ businesses }])
    })

    const render = async (components: any) => {
      const utils = renderLine(line, withTheme({ components, visibility: { 'cart.products.description': true } }))
      await act(async () => {})
      return utils
    }

    it('is under the name, before the description, by default', async () => {
      expect(themePart(defaultAppTheme(), 'cart', 'base.line_price_position')).toBe('top')
      expect(labels(await render({}))).toEqual(['name', 'price', 'description'])
    })

    it('is after the description when the theme says bottom', async () => {
      const utils = await render({ cart: { base: { line_price_position: 'bottom' } } })
      expect(labels(utils)).toEqual(['name', 'description', 'price'])
    })
  })
})
