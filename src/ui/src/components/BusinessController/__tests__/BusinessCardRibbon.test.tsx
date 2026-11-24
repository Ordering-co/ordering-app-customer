import '../../../../../../jest/helpers/registerM3NativeMocks'

import React from 'react'
import { StyleSheet } from 'react-native'

import { BusinessCard } from '../BusinessCard'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'
import { withTheme } from '../../../../../../jest/helpers/themeWith'

jest.mock('@components', () => require('../../../../../../jest/helpers/m3DiscoveryComponentsMock').getMock({}))
jest.mock('@ui', () => require('../../../../../../jest/helpers/m3DiscoveryUiMock').getUiMock())

jest.mock('react-native-fast-image', () => {
  const React = require('react')
  const { View } = require('react-native')
  function FastImage (props: any) {
    return React.createElement(View, { testID: 'fast-image', ...props })
  }
  FastImage.resizeMode = { contain: 'contain', cover: 'cover' }
  return { __esModule: true, default: FastImage, resizeMode: FastImage.resizeMode }
})

const ribbon = { enabled: true, text: 'Only Cash' }

const flat = (node: any) => StyleSheet.flatten(node.props.style) ?? {}
/** The ribbon's box: the nearest ancestor of its text that has a fill. */
const boxOf = (textNode: any) => {
  let node = textNode.parent
  while (node && !flat(node).backgroundColor) node = node.parent
  return node
}

describe('the merchant ribbon of a business card', () => {
  it('takes its own room in the text column of a compact card, above the name', () => {
    const { getByText, toJSON } = renderWithProviders(
      <BusinessCard variant='compact' name='Cash Place' ribbon={ribbon} isOpen />
    )
    const ribbonText = getByText('Only Cash')
    const name = getByText('Cash Place')
    const ribbonBox = boxOf(ribbonText)
    expect(flat(ribbonBox).position).not.toBe('absolute')
    expect(flat(ribbonBox).alignSelf).toBe('flex-start')
    // In the column's order the ribbon comes before the name: it takes its own room above it.
    const texts: string[] = []
    const walk = (n: any) => { if (typeof n === 'string') texts.push(n); else (n?.children ?? []).forEach(walk) }
    walk(toJSON())
    expect(texts.indexOf('Only Cash')).toBeGreaterThanOrEqual(0)
    expect(texts.indexOf('Cash Place')).toBeGreaterThan(texts.indexOf('Only Cash'))
  })

  it('sits over the photo of a large card, inset by the card padding (never on the name)', () => {
    const { getByText, getByTestId } = renderWithProviders(
      <BusinessCard name='Cash Place' ribbon={ribbon} isOpen headerSource={{ uri: 'https://example.com/a.jpg' }} />
    )
    const box = boxOf(getByText('Only Cash'))
    const style = flat(box)
    expect(style.position).toBe('absolute')
    // Over the photo (the hero), not over the body that holds the name.
    let hero = getByTestId('fast-image').parent as any
    while (hero && flat(hero).overflow !== 'hidden') hero = hero.parent
    let inside = false
    for (let n = box.parent; n; n = n.parent) if (n === hero) inside = true
    expect(inside).toBe(true)
    expect(style.top).toBeGreaterThan(0)
    expect(style.right).toBeGreaterThan(0)
    expect(style.top).toBe(style.right)
  })
})

describe('the place of the ribbon on a large card (business_card.base.ribbon_position)', () => {
  const underName = (visibility?: Record<string, boolean>) => withTheme({
    components: { business_card: { base: { ribbon_position: 'name' } } },
    ...(visibility && { visibility })
  })
  const renderCard = (options?: any, props: any = {}) => renderWithProviders(
    <BusinessCard name='Cash Place' ribbon={ribbon} isOpen headerSource={{ uri: 'https://example.com/a.jpg' }} {...props} />,
    options
  )
  const textsOf = (utils: any) => {
    const texts: string[] = []
    const walk = (node: any) => {
      if (typeof node === 'string') texts.push(node)
      else (node?.children ?? []).forEach(walk)
    }
    walk(utils.toJSON())
    return texts
  }
  const heroOf = (utils: any) => {
    let hero = utils.getByTestId('fast-image').parent
    while (hero && flat(hero).overflow !== 'hidden') hero = hero.parent
    return hero
  }
  const isInside = (node: any, ancestor: any) => {
    for (let parent = node.parent; parent; parent = parent.parent) if (parent === ancestor) return true
    return false
  }

  it('stays over the photo for the image option, as by default', () => {
    const byDefault = renderCard()
    const onImage = renderCard(withTheme({ components: { business_card: { base: { ribbon_position: 'image' } } } }))
    expect(flat(boxOf(onImage.getByText('Only Cash'))).position).toBe('absolute')
    expect(isInside(boxOf(onImage.getByText('Only Cash')), heroOf(onImage))).toBe(true)
    expect(JSON.stringify(onImage.toJSON())).toBe(JSON.stringify(byDefault.toJSON()))
  })

  it('goes under the name, in the text column, when the theme says so', () => {
    const utils = renderCard(underName())
    const box = boxOf(utils.getByText('Only Cash'))
    const texts = textsOf(utils)
    expect(utils.getAllByText('Only Cash')).toHaveLength(1)
    expect(flat(box).position).not.toBe('absolute')
    expect(flat(box).alignSelf).toBe('flex-start')
    expect(isInside(box, heroOf(utils))).toBe(false)
    expect(texts.indexOf('Only Cash')).toBeGreaterThan(texts.indexOf('Cash Place'))
  })

  it('keeps the ribbon of a compact card above its name', () => {
    const utils = renderCard(underName(), { variant: 'compact' })
    const texts = textsOf(utils)
    expect(utils.getAllByText('Only Cash')).toHaveLength(1)
    expect(texts.indexOf('Cash Place')).toBeGreaterThan(texts.indexOf('Only Cash'))
  })

  it('keeps the ribbon of a card without its photo above its name, once', () => {
    const utils = renderCard(underName({ 'business_card.header': false }))
    const texts = textsOf(utils)
    expect(utils.getAllByText('Only Cash')).toHaveLength(1)
    expect(texts.indexOf('Cash Place')).toBeGreaterThan(texts.indexOf('Only Cash'))
  })

  it.each([
    ['a ribbon that is off', { enabled: false, text: 'Only Cash' }],
    ['a ribbon without text', { enabled: true, text: '' }],
    ['no ribbon', undefined]
  ])('has nothing under the name for %s', (_name, value) => {
    expect(renderCard(underName(), { ribbon: value }).queryByText('Only Cash')).toBeNull()
  })

  it('has no ribbon under the name when the theme hides the ribbon', () => {
    expect(renderCard(underName({ 'business_card.ribbon': false })).queryByText('Only Cash')).toBeNull()
  })
})
