jest.mock('dayjs', () => {
  const instance = {
    format: () => '2026-01-01 12:00:00',
    tz: () => instance,
    unix: () => 1700000000,
    hour: () => instance,
    minute: () => instance
  }
  const dayjs = () => instance
  dayjs.extend = jest.fn()
  dayjs.tz = () => instance
  return dayjs
})

jest.mock('dayjs/plugin/timezone', () => jest.fn())
jest.mock('dayjs/plugin/isBetween', () => jest.fn())

jest.mock('../../BusinessInformation', () => {
  const { View, Text } = require('react-native')
  return {
    BusinessInformation: () => (
      <View testID="business-information-panel">
        <Text>Business details panel</Text>
      </View>
    )
  }
})

jest.mock('../../shared/OrderTypeSwitch', () => {
  const { View } = require('react-native')
  return {
    OrderTypeSwitch: () => <View testID="order-type-switch-stub" />
  }
})

jest.mock('../../BusinessReviews', () => {
  const { View } = require('react-native')
  return {
    BusinessReviews: () => <View testID="business-reviews-panel" />
  }
})

import '../../../../../../jest/helpers/registerM3NativeMocks'

import React from 'react'
import { fireEvent, within } from '@testing-library/react-native'
import { Image, StyleSheet } from 'react-native'

import { BusinessBasicInformation } from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'
import { BusinessInfoActions } from '../styles'
import { themeWith, withTheme } from '../../../../../../jest/helpers/themeWith'
import { defaultAppTheme } from '@/theme/engine'
import { themeColor } from '@/theme/helpers'

jest.spyOn(Image, 'getSize').mockImplementation((_uri, success) => {
  success(320, 180)
})

jest.mock('@components', () => require('../../../../../../jest/helpers/m3DiscoveryComponentsMock').getMock())
jest.mock('@ui', () => require('../../../../../../jest/helpers/m3DiscoveryUiMock').getUiMock())

describe('BusinessBasicInformation', () => {
  it('renders business name when loaded', () => {
    const sample = require('../../../../../../jest/helpers/m3DiscoveryDefaults').sampleBusiness
    const { getByText } = renderWithProviders(
      <BusinessBasicInformation
        navigation={{ navigate: jest.fn() }}
        businessState={{ loading: false, business: sample }}
        header={sample.header}
        logo={sample.logo}
        categoryState={{ loading: false, categories: [] }}
      />
    )
    expect(getByText('Pizza Place')).toBeTruthy()
  })

  it('shows loading placeholders while business is loading', () => {
    const { getAllByTestId } = renderWithProviders(
      <BusinessBasicInformation
        navigation={{ navigate: jest.fn() }}
        businessState={{ loading: true, business: null }}
        categoryState={{ loading: false, categories: [] }}
      />
    )
    expect(getAllByTestId('placeholder-line').length).toBeGreaterThan(0)
  })

  it('opens business information modal from the info action', () => {
    const sample = require('../../../../../../jest/helpers/m3DiscoveryDefaults').sampleBusiness
    const { getByText, getByTestId } = renderWithProviders(
      <BusinessBasicInformation
        navigation={{ navigate: jest.fn() }}
        businessState={{ loading: false, business: sample }}
        header={sample.header}
        logo={sample.logo}
        categoryState={{ loading: false, categories: [] }}
        isBusinessInfoShow
      />
    )
    fireEvent.press(getByText('Info'))
    expect(getByTestId('business-information-panel')).toBeTruthy()
  })

  it('opens reviews modal from reviews action', () => {
    const sample = require('../../../../../../jest/helpers/m3DiscoveryDefaults').sampleBusiness
    const { getByText, getByTestId } = renderWithProviders(
      <BusinessBasicInformation
        navigation={{ navigate: jest.fn() }}
        businessState={{ loading: false, business: sample }}
        header={sample.header}
        logo={sample.logo}
        categoryState={{ loading: false, categories: [] }}
      />
    )
    fireEvent.press(getByText('4.5'))
    expect(getByTestId('business-reviews-panel')).toBeTruthy()
  })

  it('navigates to preorder when business is closed with preorder enabled', () => {
    const defaults = require('../../../../../../jest/helpers/m3DiscoveryDefaults')
    const business = {
      ...defaults.sampleBusiness,
      open: false,
      today: { enabled: false, lapses: [] }
    }
    const navigation = { navigate: jest.fn(), goBack: jest.fn() }
    const { getByText } = renderWithProviders(
      <BusinessBasicInformation
        navigation={navigation}
        businessState={{ loading: false, business }}
        header={business.header}
        logo={business.logo}
        categoryState={{ loading: false, categories: [] }}
        isPreOrder
      />
    )
    fireEvent.press(getByText('Preorder'))
    expect(navigation.navigate).toHaveBeenCalledWith('MomentOption', expect.any(Object))
  })
})

describe('BusinessBasicInformation: the details of the store', () => {
  const sample = require('../../../../../../jest/helpers/m3DiscoveryDefaults').sampleBusiness
  const columns = { components: { business_header: { base: { details_layout: 'columns' } } } }
  const distance = { visibility: { 'business.header.distance': true } }
  const renderBusiness = (options?: any, business: any = sample, loading = false) => renderWithProviders(
    <BusinessBasicInformation
      navigation={{ navigate: jest.fn() }}
      businessState={{ loading, business }}
      header={business?.header}
      logo={business?.logo}
      categoryState={{ loading: false, categories: [] }}
    />,
    options
  )
  const images = (node: any) => within(node).queryAllByTestId('fast-image')

  it('shows the fee and the time by default, the value over its label, with no distance', () => {
    const { getByText, queryByText, queryByTestId } = renderBusiness()
    expect(getByText('$2.5')).toBeTruthy()
    expect(getByText('Delivery fee')).toBeTruthy()
    expect(getByText('Delivery time')).toBeTruthy()
    expect(queryByText('Distance')).toBeNull()
    expect(queryByText('1.2 mi')).toBeNull()
    expect(queryByTestId('business-detail-fee')).toBeNull()
    expect(queryByTestId('business-detail-time')).toBeNull()
    expect(queryByTestId('business-detail-distance')).toBeNull()
  })

  it('adds the distance when the theme shows it (business.header.distance), in the same layout', () => {
    const { getByText, queryByTestId } = renderBusiness(withTheme(distance))
    expect(getByText('Distance')).toBeTruthy()
    expect(getByText('1.2 mi')).toBeTruthy()
    expect(getByText('Delivery fee')).toBeTruthy()
    expect(queryByTestId('business-detail-distance')).toBeNull()
  })

  it('leaves the distance out of a store that has none', () => {
    const { queryByText, getByText } = renderBusiness(withTheme(distance), { ...sample, distance: null })
    expect(queryByText('Distance')).toBeNull()
    expect(getByText('Delivery fee')).toBeTruthy()
  })

  it('draws a column per detail when the theme says columns, the label over its value', () => {
    const { getByTestId, queryByTestId } = renderBusiness(withTheme(columns))
    const fee = within(getByTestId('business-detail-fee'))
    expect(fee.getByText('Delivery fee')).toBeTruthy()
    expect(fee.getByText('$2.5')).toBeTruthy()
    expect(within(getByTestId('business-detail-time')).getByText('Delivery time')).toBeTruthy()
    expect(queryByTestId('business-detail-distance')).toBeNull()
    expect(images(getByTestId('business-detail-fee'))).toHaveLength(0)
    expect(images(getByTestId('business-detail-time'))).toHaveLength(0)
  })

  it('adds the column of the distance, and has none for a store without it', () => {
    const theme = { ...columns, ...distance }
    const shown = within(renderBusiness(withTheme(theme)).getByTestId('business-detail-distance'))
    expect(shown.getByText('Distance')).toBeTruthy()
    expect(shown.getByText('1.2 mi')).toBeTruthy()
    const { queryByTestId, getByTestId } = renderBusiness(withTheme(theme), { ...sample, distance: undefined })
    expect(queryByTestId('business-detail-distance')).toBeNull()
    expect(getByTestId('business-detail-fee')).toBeTruthy()
  })

  it('heads each column with the image the theme sets for it (icons.business_*)', () => {
    const { getByTestId } = renderBusiness(withTheme({
      ...columns,
      ...distance,
      images: {
        'icons.business_fee': 'https://example.com/fee.png',
        'icons.business_distance': 'https://example.com/distance.png'
      }
    }))
    expect(images(getByTestId('business-detail-fee')).map((image) => image.props.source)).toEqual([{ uri: 'https://example.com/fee.png' }])
    expect(images(getByTestId('business-detail-distance')).map((image) => image.props.source)).toEqual([{ uri: 'https://example.com/distance.png' }])
    expect(images(getByTestId('business-detail-time'))).toHaveLength(0)
  })

  it('has no details while the store loads', () => {
    const { queryByTestId, queryByText } = renderBusiness(withTheme({ ...columns, ...distance }), null, true)
    expect(queryByTestId('business-detail-fee')).toBeNull()
    expect(queryByText('Delivery fee')).toBeNull()
  })
})

describe('BusinessBasicInformation: the order type switch (business.order_type_switch)', () => {
  const sample = require('../../../../../../jest/helpers/m3DiscoveryDefaults').sampleBusiness
  const on = { visibility: { 'business.order_type_switch': true } }
  const renderBusiness = (options?: any, loading = false) => renderWithProviders(
    <BusinessBasicInformation
      navigation={{ navigate: jest.fn() }}
      businessState={{ loading, business: loading ? null : sample }}
      categoryState={{ loading: false, categories: [] }}
    />,
    options
  )

  it('has none by default', () => {
    expect(renderBusiness().queryByTestId('order-type-switch-stub')).toBeNull()
  })

  it('shows it under the details when the theme says so, once the store loaded', () => {
    expect(renderBusiness(withTheme(on)).getByTestId('order-type-switch-stub')).toBeTruthy()
    expect(renderBusiness(withTheme(on), true).queryByTestId('order-type-switch-stub')).toBeNull()
  })
})

describe('BusinessBasicInformation: the order of the details (business_header.base.details_order)', () => {
  const sample = require('../../../../../../jest/helpers/m3DiscoveryDefaults').sampleBusiness
  const base = (values: Record<string, unknown>) => ({ components: { business_header: { base: values } } })
  const distance = { visibility: { 'business.header.distance': true } }
  const renderBusiness = (options?: any) => renderWithProviders(
    <BusinessBasicInformation
      navigation={{ navigate: jest.fn() }}
      businessState={{ loading: false, business: sample }}
      header={sample.header}
      logo={sample.logo}
      categoryState={{ loading: false, categories: [] }}
    />,
    options
  )
  const columnsOf = (utils: any) => utils.getAllByTestId(/^business-detail-/).map((node: any) => node.props.testID)
  const labelsOf = (utils: any) => utils.getAllByText(/^(Delivery fee|Delivery time|Distance)$/).map((node: any) => [node.props.children].flat().filter(Boolean).join(''))

  it('puts the fee before the time by default, then the distance', () => {
    expect(columnsOf(renderBusiness(withTheme({ ...base({ details_layout: 'columns' }), ...distance })))).toEqual([
      'business-detail-fee',
      'business-detail-time',
      'business-detail-distance'
    ])
    expect(labelsOf(renderBusiness(withTheme(distance)))).toEqual(['Delivery fee', 'Delivery time', 'Distance'])
  })

  it('keeps that order for the fee first option', () => {
    expect(columnsOf(renderBusiness(withTheme(base({ details_layout: 'columns', details_order: 'fee_first' }))))).toEqual([
      'business-detail-fee',
      'business-detail-time'
    ])
  })

  it('puts the time first in the columns when the theme says so, the others in their order', () => {
    expect(columnsOf(renderBusiness(withTheme({ ...base({ details_layout: 'columns', details_order: 'time_first' }), ...distance })))).toEqual([
      'business-detail-time',
      'business-detail-fee',
      'business-detail-distance'
    ])
  })

  it('puts the time first in the row too', () => {
    expect(labelsOf(renderBusiness(withTheme(base({ details_order: 'time_first' }))))).toEqual(['Delivery time', 'Delivery fee'])
    expect(labelsOf(renderBusiness(withTheme({ ...base({ details_order: 'time_first' }), ...distance })))).toEqual(['Delivery time', 'Delivery fee', 'Distance'])
  })

  it('leaves the other details in their order when the time is hidden', () => {
    const options = withTheme({
      ...base({ details_layout: 'columns', details_order: 'time_first' }),
      visibility: { 'business.header.distance': true, 'business.header.time': false }
    })
    expect(columnsOf(renderBusiness(options))).toEqual(['business-detail-fee', 'business-detail-distance'])
  })

  it('heads the column of the time with the image the theme sets for it (icons.business_time)', () => {
    const utils = renderBusiness(withTheme({
      ...base({ details_layout: 'columns' }),
      images: { 'icons.business_time': 'https://example.com/time.png' }
    }))
    expect(within(utils.getByTestId('business-detail-time')).getAllByTestId('fast-image').map((image) => image.props.source)).toEqual([{ uri: 'https://example.com/time.png' }])
    expect(within(utils.getByTestId('business-detail-fee')).queryAllByTestId('fast-image')).toHaveLength(0)
  })
})

describe('BusinessBasicInformation: the cover and the name (business.header.cover, business.header.name)', () => {
  const sample = require('../../../../../../jest/helpers/m3DiscoveryDefaults').sampleBusiness
  const renderBusiness = (options?: any, loading = false) => renderWithProviders(
    <BusinessBasicInformation
      navigation={{ navigate: jest.fn() }}
      businessState={{ loading, business: loading ? null : sample }}
      header={loading ? undefined : sample.header}
      logo={loading ? undefined : sample.logo}
      categoryState={{ loading: false, categories: [] }}
    />,
    options
  )
  const covers = (utils: any) => utils.UNSAFE_root.findAll((node: any) => typeof node.type === 'string' && node.props?.source?.uri === sample.header)
  const noCover = withTheme({ visibility: { 'business.header.cover': false } })
  const noName = withTheme({ visibility: { 'business.header.name': false } })

  it('shows the cover and the name of the store by default', () => {
    const utils = renderBusiness()
    expect(covers(utils).length).toBeGreaterThan(0)
    expect(utils.getByText('Pizza Place')).toBeTruthy()
  })

  describe('the cover edge to edge (business_header.base.cover_full_width)', () => {
    const flat = (node: any) => Object.assign({}, ...[].concat(node.props.style).flat(Infinity).filter(Boolean))
    const imageStyle = (utils: any) => flat(covers(utils)[0])

    it('keeps the cover as it is by default', () => {
      expect(themeWith({}).native.components.business_header.base.cover_full_width).toBe(false)
      expect(imageStyle(renderBusiness())).not.toMatchObject({ borderRadius: 0 })
    })

    it('has no side margin and no radius when the theme turns it on', () => {
      const style = imageStyle(renderBusiness(withTheme({ components: { business_header: { base: { cover_full_width: true } } } })))
      expect(style).toMatchObject({ borderRadius: 0, marginHorizontal: 0 })
    })
  })

  it('has no cover when the theme hides it, and keeps the name and the address', () => {
    const utils = renderBusiness(noCover)
    expect(covers(utils)).toHaveLength(0)
    expect(utils.getByText('Pizza Place')).toBeTruthy()
    expect(utils.getByText('123 Main St')).toBeTruthy()
  })

  it('has no skeleton of the cover while a store without cover loads', () => {
    const withCover = renderBusiness(undefined, true).getAllByTestId('placeholder-line').length
    const without = renderBusiness(noCover, true).getAllByTestId('placeholder-line').length
    expect(without).toBe(withCover - 1)
  })

  it('has no name when the theme hides it, and keeps the cover and the address', () => {
    const utils = renderBusiness(noName)
    expect(utils.queryByText('Pizza Place')).toBeNull()
    expect(covers(utils).length).toBeGreaterThan(0)
    expect(utils.getByText('123 Main St')).toBeTruthy()
  })

  it('hides both', () => {
    const utils = renderBusiness(withTheme({ visibility: { 'business.header.cover': false, 'business.header.name': false } }))
    expect(covers(utils)).toHaveLength(0)
    expect(utils.queryByText('Pizza Place')).toBeNull()
    expect(utils.getByText('Delivery fee')).toBeTruthy()
  })
})

describe('BusinessBasicInformation: the row of the actions', () => {
  const sample = require('../../../../../../jest/helpers/m3DiscoveryDefaults').sampleBusiness
  const hidden = (...keys: string[]) => withTheme({ visibility: Object.fromEntries(keys.map((key) => [key, false])) })
  const collapsed = (...keys: string[]) => withTheme({
    components: { business_header: { base: { collapse_empty_actions: true } } },
    visibility: Object.fromEntries(keys.map((key) => [key, false]))
  })
  const renderBusiness = (options?: any, props: any = {}, business: any = sample) => renderWithProviders(
    <BusinessBasicInformation
      navigation={{ navigate: jest.fn() }}
      businessState={{ loading: false, business }}
      header={business?.header}
      logo={business?.logo}
      categoryState={{ loading: false, categories: [] }}
      {...props}
    />,
    options
  )
  const rows = (utils: any) => utils.UNSAFE_queryAllByType(BusinessInfoActions)

  it('holds the reviews and the info by default', () => {
    const utils = renderBusiness()
    expect(rows(utils)).toHaveLength(1)
    expect(utils.getByText('4.5')).toBeTruthy()
    expect(utils.getByText('Info')).toBeTruthy()
  })

  it('is still drawn empty by default when the theme hides every action', () => {
    const utils = renderBusiness(hidden('business.header.reviews', 'business.header.info', 'business.header.preorder'), { isPreOrder: true })
    expect(rows(utils)).toHaveLength(1)
  })

  it('is not drawn with collapse_empty_actions when the theme hides every action: no empty space under the name', () => {
    const utils = renderBusiness(collapsed('business.header.reviews', 'business.header.info', 'business.header.preorder'), { isPreOrder: true })
    expect(rows(utils)).toHaveLength(0)
    expect(utils.queryByText('Info')).toBeNull()
    expect(utils.queryByText('4.5')).toBeNull()
    expect(utils.queryByText('Preorder')).toBeNull()
    expect(utils.getByText('Pizza Place')).toBeTruthy()
    expect(utils.getByText('Delivery fee')).toBeTruthy()
  })

  it.each([
    ['the info alone', hidden('business.header.reviews', 'business.header.preorder'), {}, sample, 'Info'],
    ['the reviews alone', hidden('business.header.info', 'business.header.preorder'), {}, sample, '4.5'],
    ['the preorder alone', hidden('business.header.reviews', 'business.header.info'), { isPreOrder: true }, sample, 'Preorder']
  ])('is drawn for %s', (_name, options, props, business, text) => {
    const utils = renderBusiness(options, props, business)
    expect(rows(utils)).toHaveLength(1)
    expect(utils.getByText(text as string)).toBeTruthy()
  })

  it.each([
    ['a store without reviews', { ...sample, reviews: { total: 0 } }, {}],
    ['a store with no reviews at all', { ...sample, reviews: undefined }, {}],
    ['a store that does not take preorders', sample, { isPreOrder: false }],
    ['a store of professionals, which has no preorder', { ...sample, reviews: { total: 0 }, professionals: [{ id: 1 }] }, { isPreOrder: true }]
  ])('is not drawn with collapse_empty_actions and the info hidden for %s', (_name, business, props) => {
    const options = business.reviews?.total > 0 ? collapsed('business.header.info', 'business.header.reviews') : collapsed('business.header.info')
    expect(rows(renderBusiness(options, props, business))).toHaveLength(0)
  })

  it('keeps its skeleton while the store loads, whatever the theme hides', () => {
    const utils = renderWithProviders(
      <BusinessBasicInformation
        navigation={{ navigate: jest.fn() }}
        businessState={{ loading: true, business: null }}
        categoryState={{ loading: false, categories: [] }}
      />,
      hidden('business.header.reviews', 'business.header.info', 'business.header.preorder')
    )
    expect(rows(utils)).toHaveLength(1)
    expect(within(rows(utils)[0]).getAllByTestId('placeholder-line').length).toBeGreaterThan(0)
  })
})

describe('BusinessBasicInformation: the labels of the columns (business_header.base.details_label_color)', () => {
  const sample = require('../../../../../../jest/helpers/m3DiscoveryDefaults').sampleBusiness
  const base = (values: Record<string, unknown>) => ({ components: { business_header: { base: values } } })
  const renderBusiness = (options?: any) => renderWithProviders(
    <BusinessBasicInformation
      navigation={{ navigate: jest.fn() }}
      businessState={{ loading: false, business: sample }}
      header={sample.header}
      logo={sample.logo}
      categoryState={{ loading: false, categories: [] }}
    />,
    options
  )
  const colorOf = (node: any) => StyleSheet.flatten(node.props.style).color

  it('is the color of the text by default', () => {
    const utils = renderBusiness(withTheme(base({ details_layout: 'columns' })))
    expect(colorOf(within(utils.getByTestId('business-detail-fee')).getByText('Delivery fee'))).toBe(themeColor(defaultAppTheme(), 'text'))
  })

  it('is the color of the theme on every column, and the values keep theirs', () => {
    const values = { ...base({ details_layout: 'columns', details_label_color: '#a1b2c3' }), visibility: { 'business.header.distance': true } }
    const color = themeWith(values).native.components.business_header.base.details_label_color
    const utils = renderBusiness(withTheme(values))
    expect(color).not.toBe(themeColor(defaultAppTheme(), 'text'))
    expect(colorOf(within(utils.getByTestId('business-detail-fee')).getByText('Delivery fee'))).toBe(color)
    expect(colorOf(within(utils.getByTestId('business-detail-time')).getByText('Delivery time'))).toBe(color)
    expect(colorOf(within(utils.getByTestId('business-detail-distance')).getByText('Distance'))).toBe(color)
    expect(colorOf(within(utils.getByTestId('business-detail-fee')).getByText('$2.5'))).not.toBe(color)
  })

  it('leaves the labels of the row layout as they were', () => {
    const values = base({ details_label_color: '#a1b2c3' })
    const plain = renderBusiness()
    const colored = renderBusiness(withTheme(values))
    expect(colorOf(colored.getByText('Delivery fee'))).toBe(colorOf(plain.getByText('Delivery fee')))
    expect(colorOf(colored.getByText('Delivery fee'))).not.toBe(themeWith(values).native.components.business_header.base.details_label_color)
  })
})
