import '../../../../../../jest/helpers/registerM6NativeMocks'

import React from 'react'
import { StyleSheet } from 'react-native'
import { fireEvent, within } from '@testing-library/react-native'

import { OrderCard } from '../OrderCard'
import { BottomRow, ProgressBarFill } from '../styles'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'
import { themeWith, withTheme } from '../../../../../../jest/helpers/themeWith'
import { themeControlHeight, themeSpace } from '@/theme/helpers'

jest.mock('../../OrderDetails/OrderEta', () => {
  const { Text } = require('react-native')
  return { OrderEta: () => <Text>12:30</Text> }
})
jest.mock('@components', () => require('../../../../../../jest/helpers/m6OrdersComponentsMock').getMock())
jest.mock('@ui', () => require('../../../../../../jest/helpers/m6OrdersUiMock').getUiMock())

const segments = withTheme({ components: { order_details: { base: { progress_layout: 'segments' } } } })

const renderCard = (order: Record<string, unknown> = {}, options?: any) => {
  const handleGoToOrder = jest.fn()
  const lastOrder = {
    id: 43,
    uuid: 'order-uuid-43',
    status: 9,
    delivery_type: 1,
    business: { name: 'Pizza Place', logo: 'https://cdn.test/logo.jpg' },
    ...order
  }
  const utils = renderWithProviders(
    <OrderCard
      lastOrder={lastOrder}
      statusToShow={[0, 3, 4, 7, 8, 9, 13, 14, 18, 19, 20, 21, 22, 23]}
      progressBarObjt={() => ({ value: 'Status of the order', percentage: 0.6 })}
      handleGoToOrder={handleGoToOrder}
    />,
    options
  )
  return { ...utils, handleGoToOrder }
}

describe('OrderCard progress (order_details.base.progress_layout)', () => {
  it('is one bar filled to the percentage of the status by default', () => {
    const utils = renderCard()
    expect(utils.queryByTestId('order-step-0')).toBeNull()
    const fills = utils.UNSAFE_getAllByType(ProgressBarFill)
    expect(fills).toHaveLength(1)
    expect(fills[0].props.style).toEqual({ width: '60%' })
    expect(utils.getByText('Status of the order')).toBeTruthy()
  })

  it('is four segments with the steps of a delivery when the theme says segments', () => {
    const utils = renderCard({}, segments)
    ;[0, 1, 2, 3].forEach((index) => expect(utils.getByTestId(`order-step-${index}`)).toBeTruthy())
    expect(utils.UNSAFE_queryAllByType(ProgressBarFill)).toHaveLength(0)
    expect(utils.getByText('On the way')).toBeTruthy()
    expect(utils.getByText('Delivered')).toBeTruthy()
    expect(utils.getByText('Status of the order')).toBeTruthy()
  })

  it('names the steps of a pickup for an order that is not delivered', () => {
    const utils = renderCard({ status: 4, delivery_type: 2 }, segments)
    expect(utils.getByText('Ready for pickup')).toBeTruthy()
    expect(utils.getByText('Completed')).toBeTruthy()
    expect(utils.queryByText('On the way')).toBeNull()
  })

  it('still opens the order', () => {
    const utils = renderCard({}, segments)
    fireEvent.press(utils.getByTestId('order-progress-card'))
    expect(utils.handleGoToOrder).toHaveBeenCalledWith('OrderDetails', { orderId: 'order-uuid-43', orderNumberId: 43 })
  })
})

describe('OrderCard image (images.icons.order_progress)', () => {
  const image = { images: { 'icons.order_progress': 'https://example.com/progress.png' } }
  const chevrons = (utils: any) => utils.getByTestId('order-progress-card').findAll((node: any) => typeof node.type === 'string' && node.props?.name === 'chevron-forward')

  it('ends the head of the card with the chevron by default', () => {
    const utils = renderCard()
    expect(utils.queryByTestId('order-progress-image')).toBeNull()
    expect(chevrons(utils)).toHaveLength(1)
  })

  it('draws the image of the theme in place of the chevron, in a box of the extra large control height', () => {
    const size = themeControlHeight(themeWith(image), 'xl')
    const utils = renderCard({}, withTheme(image))
    const picture = utils.getByTestId('order-progress-image')
    expect(picture.props.source).toEqual({ uri: 'https://example.com/progress.png' })
    expect(StyleSheet.flatten(picture.props.style)).toEqual({ width: size, height: size })
    expect(chevrons(utils)).toHaveLength(0)
    expect(utils.getByText('Pizza Place')).toBeTruthy()
  })

  it('keeps the progress and the way into the order with the image', () => {
    const utils = renderCard({}, withTheme(image))
    expect(utils.UNSAFE_getAllByType(ProgressBarFill)).toHaveLength(1)
    fireEvent.press(utils.getByTestId('order-progress-card'))
    expect(utils.handleGoToOrder).toHaveBeenCalledWith('OrderDetails', { orderId: 'order-uuid-43', orderNumberId: 43 })
  })
})

describe('OrderCard summary (order_card.base.summary_position)', () => {
  const onTop = { components: { order_card: { base: { summary_position: 'top' } } } }
  const onTopSegments = { components: { ...onTop.components, order_details: { base: { progress_layout: 'segments' } } } }
  const order = (utils: any, ...nodes: any[]) => {
    const all = utils.UNSAFE_root.findAll(() => true)
    return nodes.map((node) => all.indexOf(node))
  }

  it('ends the card with the status and the estimate by default, after the progress', () => {
    const utils = renderCard()
    const rows = utils.UNSAFE_getAllByType(BottomRow)
    const [fill, row] = order(utils, utils.UNSAFE_getByType(ProgressBarFill), rows[0])
    expect(utils.queryByTestId('order-progress-summary-top')).toBeNull()
    expect(rows).toHaveLength(1)
    expect(within(rows[0]).getByText('Status of the order')).toBeTruthy()
    expect(within(rows[0]).getByText(/Estimated delivery/)).toBeTruthy()
    expect(within(rows[0]).getByText(/·/)).toBeTruthy()
    expect(fill).toBeGreaterThan(-1)
    expect(row).toBeGreaterThan(fill)
  })

  it('keeps them at the end for the bottom option', () => {
    const utils = renderCard({}, withTheme({ components: { order_card: { base: { summary_position: 'bottom' } } } }))
    expect(utils.queryByTestId('order-progress-summary-top')).toBeNull()
    expect(utils.UNSAFE_getAllByType(BottomRow)).toHaveLength(1)
  })

  it('puts the estimate and then the status in a column before the progress when the theme says top', () => {
    const utils = renderCard({}, withTheme(onTop))
    const summary = utils.getByTestId('order-progress-summary-top')
    const [estimate, status, fill, box] = order(
      utils,
      within(summary).getByText(/Estimated delivery/),
      within(summary).getByText('Status of the order'),
      utils.UNSAFE_getByType(ProgressBarFill),
      summary
    )
    expect(StyleSheet.flatten(summary.props.style)).toEqual({ gap: themeSpace(themeWith(onTop), 'xxs') })
    expect(box).toBeGreaterThan(-1)
    expect(estimate).toBeLessThan(status)
    expect(status).toBeLessThan(fill)
  })

  it('has no row under the progress then, and says each thing once', () => {
    const utils = renderCard({}, withTheme(onTop))
    expect(utils.UNSAFE_queryAllByType(BottomRow)).toHaveLength(0)
    expect(utils.getAllByText('Status of the order')).toHaveLength(1)
    expect(utils.getAllByText(/Estimated delivery/)).toHaveLength(1)
    expect(utils.getAllByText('12:30')).toHaveLength(1)
    expect(utils.queryByText(/·/)).toBeNull()
  })

  it('keeps the bar filled to the percentage of the status under the summary', () => {
    const fills = renderCard({}, withTheme(onTop)).UNSAFE_getAllByType(ProgressBarFill)
    expect(fills).toHaveLength(1)
    expect(fills[0].props.style).toEqual({ width: '60%' })
  })

  it('goes before the segments too', () => {
    const utils = renderCard({}, withTheme(onTopSegments))
    const summary = utils.getByTestId('order-progress-summary-top')
    const [status, step] = order(utils, within(summary).getByText('Status of the order'), utils.getByTestId('order-step-0'))
    expect(status).toBeLessThan(step)
    expect(utils.UNSAFE_queryAllByType(BottomRow)).toHaveLength(0)
    expect(within(summary).queryByText('On the way')).toBeNull()
  })

  it('names the estimate of a pickup in either place', () => {
    expect(renderCard({ delivery_type: 2 }).getByText(/Estimated time/)).toBeTruthy()
    const top = renderCard({ delivery_type: 2 }, withTheme(onTop))
    expect(within(top.getByTestId('order-progress-summary-top')).getByText(/Estimated time/)).toBeTruthy()
    expect(top.queryByText(/Estimated delivery/)).toBeNull()
  })

  it('still opens the order with the summary on top', () => {
    const utils = renderCard({}, withTheme(onTop))
    fireEvent.press(utils.getByTestId('order-progress-card'))
    expect(utils.handleGoToOrder).toHaveBeenCalledWith('OrderDetails', { orderId: 'order-uuid-43', orderNumberId: 43 })
  })
})

describe('OrderCard caption (visibility business_listing.order_caption)', () => {
  const hidden = withTheme({ visibility: { 'business_listing.order_caption': false } })
  const past = { status: 1, reporting_data: { at: { 'status:1': '2026-01-01 10:00:00' } } }

  it('says the order is in progress over the name of the store by default', () => {
    const utils = renderCard()
    expect(utils.getByText('Order in progress')).toBeTruthy()
    expect(utils.getByText('Pizza Place')).toBeTruthy()
  })

  it('says only Order for an order that is not in progress', () => {
    const utils = renderCard(past)
    expect(utils.getByText('Order')).toBeTruthy()
    expect(utils.queryByText('Order in progress')).toBeNull()
  })

  it('keeps the caption for a theme that turns it on', () => {
    expect(renderCard({}, withTheme({ visibility: { 'business_listing.order_caption': true } })).getByText('Order in progress')).toBeTruthy()
  })

  it('has no caption when the theme hides it, and keeps the name, the status and the estimate', () => {
    const utils = renderCard({}, hidden)
    expect(utils.queryByText('Order in progress')).toBeNull()
    expect(utils.queryByText('Order')).toBeNull()
    expect(utils.getByText('Pizza Place')).toBeTruthy()
    expect(utils.getByText('Status of the order')).toBeTruthy()
    expect(utils.getByText(/Estimated delivery/)).toBeTruthy()
  })

  it('has none for an order that is not in progress either', () => {
    const utils = renderCard(past, hidden)
    expect(utils.queryByText('Order')).toBeNull()
    expect(utils.getByText('Pizza Place')).toBeTruthy()
  })

  it('leaves the caption alone when the summary moves to the top, and the summary when the caption hides', () => {
    const top = { components: { order_card: { base: { summary_position: 'top' } } } }
    expect(renderCard({}, withTheme(top)).getByText('Order in progress')).toBeTruthy()
    const both = renderCard({}, withTheme({ ...top, visibility: { 'business_listing.order_caption': false } }))
    expect(both.queryByText('Order in progress')).toBeNull()
    expect(within(both.getByTestId('order-progress-summary-top')).getByText('Status of the order')).toBeTruthy()
  })
})
