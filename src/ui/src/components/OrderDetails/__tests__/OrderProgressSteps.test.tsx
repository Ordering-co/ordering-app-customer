import React from 'react'
import { StyleSheet } from 'react-native'
import { within } from '@testing-library/react-native'

import { OrderProgressSteps } from '../OrderProgressSteps'
import { ORDER_PROGRESS_STEPS, orderProgressStep } from '../../SingleOrderCard/orderStatus'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'
import { themeWith, withTheme } from '../../../../../../jest/helpers/themeWith'
import { defaultAppTheme } from '@/theme/engine'
import { themeSpace } from '@/theme/helpers'

jest.mock('@components', () => require('../../../../../../jest/helpers/mockOrdering'))
jest.mock('@ui', () => ({ OText: require('../../shared/OText').default }))

const progress = defaultAppTheme().native.components.progress
const state = (name: 'active' | 'complete' | 'canceled') => {
  const colors = progress.variants.default.states[name]
  return { track: colors?.track ?? progress.base.track, fill: colors?.fill ?? progress.base.fill }
}
const segments = (utils: any) =>
  [...Array(ORDER_PROGRESS_STEPS)].map((_, index) => StyleSheet.flatten(utils.getByTestId(`order-step-${index}`).props.style))
const colors = (utils: any) => segments(utils).map((segment) => segment.backgroundColor)

describe('orderProgressStep', () => {
  it.each([
    [0, true, 0],
    [13, true, 0],
    [undefined, true, 0],
    [null, true, 0],
    ['not a status', true, 0],
    [7, true, 1],
    [8, true, 1],
    [3, true, 1],
    [4, true, 1],
    ['7', true, 1],
    [9, true, 2],
    [19, true, 2],
    [23, true, 2],
    [26, true, 2],
    ['9', true, 2],
    [20, true, 0],
    [1, true, 3],
    [11, true, 3],
    [15, true, 3],
    [2, true, -1],
    [5, true, -1],
    [6, true, -1],
    [10, true, -1],
    [12, true, -1],
    [16, true, -1],
    [17, true, -1],
    [0, false, 0],
    [7, false, 1],
    [3, false, 1],
    [4, false, 2],
    [20, false, 2],
    [21, false, 2],
    [9, false, 0],
    [15, false, 3],
    [1, false, 3],
    [5, false, -1]
  ])('status %s (delivery: %s) is step %s', (status, delivery, step) => {
    expect(orderProgressStep(status as any, delivery)).toBe(step)
  })

  it('is a delivery unless told otherwise', () => {
    expect(orderProgressStep(9)).toBe(2)
    expect(orderProgressStep(4)).toBe(1)
  })

  it('has four steps, the last one for a completed order', () => {
    expect(ORDER_PROGRESS_STEPS).toBe(4)
    expect(orderProgressStep(1)).toBe(ORDER_PROGRESS_STEPS - 1)
  })
})

describe('OrderProgressSteps', () => {
  it('draws four segments with the steps of a delivery', () => {
    const utils = renderWithProviders(<OrderProgressSteps status={0} />)
    expect(segments(utils)).toHaveLength(4)
    expect(utils.queryByTestId('order-step-4')).toBeNull()
    ;['Confirmed', 'Preparing', 'On the way', 'Delivered'].forEach((label) => expect(utils.getByText(label)).toBeTruthy())
  })

  it('names the steps of a pickup', () => {
    const utils = renderWithProviders(<OrderProgressSteps status={0} delivery={false} />)
    ;['Confirmed', 'Preparing', 'Ready for pickup', 'Completed'].forEach((label) => expect(utils.getByText(label)).toBeTruthy())
    expect(utils.queryByText('On the way')).toBeNull()
    expect(utils.queryByText('Delivered')).toBeNull()
  })

  it.each([
    ['pending', 0, 1],
    ['preparing', 7, 2],
    ['on the way', 9, 3]
  ])('fills the segments up to the step of a %s order, in the active colors', (_name, status, reached) => {
    const { track, fill } = state('active')
    const utils = renderWithProviders(<OrderProgressSteps status={status} />)
    expect(colors(utils)).toEqual([...Array(4)].map((_, index) => (index < reached ? fill : track)))
    expect(fill).not.toBe(track)
  })

  it('fills every segment of a completed order, in the complete colors', () => {
    const utils = renderWithProviders(<OrderProgressSteps status={11} />)
    expect(colors(utils)).toEqual(Array(4).fill(state('complete').fill))
  })

  it('fills none of a rejected or cancelled order, on the canceled track', () => {
    const utils = renderWithProviders(<OrderProgressSteps status={5} />)
    expect(colors(utils)).toEqual(Array(4).fill(state('canceled').track))
  })

  it('reaches the third segment of a pickup that is ready, not of a delivery in that status', () => {
    const { track, fill } = state('active')
    expect(colors(renderWithProviders(<OrderProgressSteps status={4} delivery={false} />))).toEqual([fill, fill, fill, track])
    expect(colors(renderWithProviders(<OrderProgressSteps status={4} />))).toEqual([fill, fill, track, track])
  })

  it('tells assistive technology the step and its name', () => {
    const bar = (utils: any) => utils.getByTestId('steps').props
    const onTheWay = bar(renderWithProviders(<OrderProgressSteps testID='steps' status={9} />))
    expect(onTheWay.accessibilityRole).toBe('progressbar')
    expect(onTheWay.accessibilityValue).toEqual({ min: 0, max: 4, now: 3, text: 'On the way' })
    const stopped = bar(renderWithProviders(<OrderProgressSteps testID='steps' status={2} />))
    expect(stopped.accessibilityValue).toEqual({ min: 0, max: 4, now: 0, text: undefined })
  })

  it('marks the name of the current step only', () => {
    const utils = renderWithProviders(<OrderProgressSteps status={7} />)
    const family = (label: string) => StyleSheet.flatten(utils.getByText(label).props.style).fontFamily
    expect(family('Preparing')).not.toBe(family('Confirmed'))
    expect(family('On the way')).toBe(family('Confirmed'))
    expect(family('Delivered')).toBe(family('Confirmed'))
  })

  it.each(['sm', 'md', 'lg'] as const)('takes the height of the progress at size %s', (size) => {
    const utils = renderWithProviders(<OrderProgressSteps status={0} size={size} />)
    segments(utils).forEach((segment) => expect(segment).toMatchObject({ height: progress.sizes[size].height, borderRadius: progress.base.radius }))
  })
})

describe('OrderProgressSteps: the row of the segments and the row of the names', () => {
  const flat = (node: any) => StyleSheet.flatten(node.props.style) ?? {}
  const hostParent = (node: any) => {
    let parent = node.parent
    while (parent && typeof parent.type !== 'string') parent = parent.parent
    return parent
  }
  const hostChildren = (node: any) => node.findAll((child: any) => typeof child.type === 'string' && hostParent(child) === node)
  const labels = ['Confirmed', 'Preparing', 'On the way', 'Delivered']

  it('stacks the segments over their names, a small space apart, over the whole width', () => {
    const utils = renderWithProviders(<OrderProgressSteps testID='steps' status={7} />)
    const box = utils.getByTestId('steps')
    const track = utils.getByTestId('order-steps-track')
    expect(flat(box)).toMatchObject({ width: '100%', gap: themeSpace(defaultAppTheme(), 'xs') })
    expect(flat(box).flexDirection).toBeUndefined()
    expect(hostChildren(box)).toHaveLength(2)
    expect(hostChildren(box)[0]).toBe(track)
  })

  it('keeps the four segments in one row, each a share of the width', () => {
    const utils = renderWithProviders(<OrderProgressSteps status={7} />)
    const track = utils.getByTestId('order-steps-track')
    expect(flat(track)).toMatchObject({ flexDirection: 'row', gap: themeSpace(defaultAppTheme(), 'xs') })
    expect(hostChildren(track).map((segment: any) => segment.props.testID)).toEqual(['order-step-0', 'order-step-1', 'order-step-2', 'order-step-3'])
    hostChildren(track).forEach((segment: any) => expect(flat(segment).flex).toBe(1))
    labels.forEach((label) => expect(within(track).queryByText(label)).toBeNull())
  })

  it('names the steps in a second row, each name under its segment', () => {
    const utils = renderWithProviders(<OrderProgressSteps testID='steps' status={7} />)
    const row = hostChildren(utils.getByTestId('steps'))[1]
    expect(flat(row)).toMatchObject({ flexDirection: 'row', gap: themeSpace(defaultAppTheme(), 'xs') })
    expect(hostChildren(row)).toHaveLength(4)
    hostChildren(row).forEach((cell: any, index: number) => {
      expect(flat(cell).flex).toBe(1)
      expect(within(cell).getByText(labels[index])).toBeTruthy()
      expect(flat(within(cell).getByText(labels[index])).textAlign).toBe('center')
    })
    expect(within(row).queryByTestId('order-step-0')).toBeNull()
    expect(hostParent(utils.getByTestId('order-step-0'))).toBe(utils.getByTestId('order-steps-track'))
  })

  it('keeps the style it is given on the whole block', () => {
    const utils = renderWithProviders(<OrderProgressSteps testID='steps' status={0} style={{ marginTop: 7 }} />)
    expect(flat(utils.getByTestId('steps'))).toMatchObject({ width: '100%', marginTop: 7 })
  })
})

describe('OrderProgressSteps: the outline of the segments (progress.base.border)', () => {
  const flat = (node: any) => StyleSheet.flatten(node.props.style) ?? {}
  const outlined = { components: { progress: { base: { border: { width: 2, color: '#102030', style: 'solid' } } } } }

  it('draws no outline around the segments by default', () => {
    const track = flat(renderWithProviders(<OrderProgressSteps status={7} />).getByTestId('order-steps-track'))
    expect(defaultAppTheme().native.components.progress.base.border.borderWidth ?? 0).toBe(0)
    expect(track).toEqual({ flexDirection: 'row', gap: themeSpace(defaultAppTheme(), 'xs') })
  })

  it('wraps the segments in a pill of the border of the theme, with the radius of the progress and a small padding', () => {
    const theme = themeWith(outlined)
    const border = theme.native.components.progress.base.border
    const track = flat(renderWithProviders(<OrderProgressSteps status={7} />, withTheme(outlined)).getByTestId('order-steps-track'))
    expect(border.borderWidth).toBe(2)
    expect(track).toMatchObject({
      ...border,
      borderRadius: theme.native.components.progress.base.radius,
      padding: themeSpace(theme, 'xs'),
      flexDirection: 'row',
      gap: themeSpace(theme, 'xs')
    })
  })

  it('keeps the segments and their colors inside the pill', () => {
    const plain = renderWithProviders(<OrderProgressSteps status={9} />)
    const pill = renderWithProviders(<OrderProgressSteps status={9} />, withTheme(outlined))
    expect(colors(pill)).toEqual(colors(plain))
    expect(within(pill.getByTestId('order-steps-track')).getByTestId('order-step-3')).toBeTruthy()
    segments(pill).forEach((segment) => expect(segment.flex).toBe(1))
  })

  it('leaves the names outside the pill', () => {
    const pill = renderWithProviders(<OrderProgressSteps status={9} />, withTheme(outlined))
    expect(pill.getByText('On the way')).toBeTruthy()
    expect(within(pill.getByTestId('order-steps-track')).queryByText('On the way')).toBeNull()
  })
})
