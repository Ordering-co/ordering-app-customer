import { defaultAppTheme } from '../engine'
import { themeImage, themePart, themeVisible } from '../helpers'
import { themeWith } from '../../../jest/helpers/themeWith'

const OFF_BY_DEFAULT = [
  'business_listing.logo',
  'business_listing.search',
  'business.header.distance',
  'business.order_type_switch',
  'product.options.optional_badge',
  'checkout.order_type_switch'
]
const ON_BY_DEFAULT = ['product.add_price', 'business.cart_bar.fees']
const IMAGES = [
  'header_badge',
  'icons.cart',
  'icons.business_fee',
  'icons.business_time',
  'icons.business_distance',
  'order_types.delivery',
  'order_types.pickup'
]

describe('the options of schema 1.1.0', () => {
  it('change nothing by default', () => {
    const theme = defaultAppTheme()
    expect(themePart(theme, 'header', 'base.fill_listing')).toBe(false)
    expect(themePart(theme, 'business_types', 'base.layout')).not.toBe('grid')
    expect(themePart(theme, 'business_types', 'base.grid_columns')).toBe(3)
    expect(themePart(theme, 'business_header', 'base.details_layout')).not.toBe('columns')
    expect(themePart(theme, 'product_modal', 'base.close_icon')).toBe('back')
    expect(themePart(theme, 'order_details', 'base.progress_layout')).toBe('bar')
    OFF_BY_DEFAULT.forEach((key) => expect([key, theme.values.visibility[key]]).toEqual([key, false]))
    ON_BY_DEFAULT.forEach((key) => expect([key, theme.values.visibility[key]]).toEqual([key, true]))
    IMAGES.forEach((key) => expect([key, themeImage(theme, key)]).toEqual([key, undefined]))
  })

  it('turn on from a partial theme, in the values and in the native styles', () => {
    const theme = themeWith({
      components: {
        header: { base: { fill_listing: true } },
        business_types: { base: { layout: 'grid', grid_columns: 4 } },
        business_header: { base: { details_layout: 'columns' } },
        product_modal: { base: { close_icon: 'close' } },
        order_details: { base: { progress_layout: 'segments' } }
      },
      visibility: {
        ...Object.fromEntries(OFF_BY_DEFAULT.map((key) => [key, true])),
        ...Object.fromEntries(ON_BY_DEFAULT.map((key) => [key, false]))
      },
      images: Object.fromEntries(IMAGES.map((key) => [key, `https://example.com/${key}.png`]))
    })
    expect(theme.values.components.header.base.fill_listing).toBe(true)
    expect(theme.native.components.header.base.fill_listing).toBe(true)
    expect(theme.native.components.business_types.base).toMatchObject({ layout: 'grid', grid_columns: 4 })
    expect(theme.native.components.business_header.base.details_layout).toBe('columns')
    expect(theme.native.components.product_modal.base.close_icon).toBe('close')
    expect(theme.native.components.order_details.base.progress_layout).toBe('segments')
    OFF_BY_DEFAULT.forEach((key) => {
      expect([key, theme.values.visibility[key]]).toEqual([key, true])
      expect(themeVisible(theme, key)).toBe(true)
    })
    ON_BY_DEFAULT.forEach((key) => expect([key, themeVisible(theme, key)]).toEqual([key, false]))
    IMAGES.forEach((key) => expect(themeImage(theme, key)).toEqual({ uri: `https://example.com/${key}.png` }))
  })

  it('keeps the columns of the grid between 2 and 4', () => {
    const columns = (value: number) =>
      themeWith({ components: { business_types: { base: { layout: 'grid', grid_columns: value } } } }).native.components.business_types.base.grid_columns
    expect(columns(2)).toBe(2)
    expect(columns(1)).toBeGreaterThanOrEqual(2)
    expect(columns(9)).toBeLessThanOrEqual(4)
  })
})
