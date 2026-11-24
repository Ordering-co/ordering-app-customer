/**
 * The loading placeholders (src/ui/src/components/shared/Skeleton.tsx): the
 * theme's skeleton color and radius, rn-placeholder's sizes, and the pulse
 * that only an animated placeholder has.
 */
import React from 'react'
import { Animated, StyleSheet } from 'react-native'
import { Fade, Placeholder, PlaceholderLine, PlaceholderMedia } from '../Skeleton'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'
import { defaultAppTheme } from '@/theme/engine'

const skeleton = (defaultAppTheme() as any).native.components.skeleton.base

describe('Skeleton', () => {
  it('draws lines in the theme skeleton color and radius, a share of the row wide', () => {
    const { getAllByTestId } = renderWithProviders(
      <Placeholder>
        <PlaceholderLine width={40} />
        <PlaceholderLine height={20} noMargin />
      </Placeholder>
    )
    const [first, second] = getAllByTestId('placeholder-line').map(line => StyleSheet.flatten(line.props.style))
    expect(first).toMatchObject({ width: '40%', height: 12, marginBottom: 12, backgroundColor: skeleton.color, borderRadius: skeleton.radius })
    expect(second).toMatchObject({ width: '100%', height: 20, marginBottom: 0 })
  })

  it('takes the color a screen gives and its own styles last', () => {
    const { getByTestId } = renderWithProviders(
      <PlaceholderLine color="#123456" style={{ marginBottom: 3 }} />
    )
    expect(StyleSheet.flatten(getByTestId('placeholder-line').props.style)).toMatchObject({ backgroundColor: '#123456', marginBottom: 3 })
  })

  it('draws square or round media', () => {
    const { getAllByTestId } = renderWithProviders(
      <Placeholder>
        <PlaceholderMedia />
        <PlaceholderMedia size={30} isRound />
      </Placeholder>
    )
    const [square, round] = getAllByTestId('placeholder-media').map(media => StyleSheet.flatten(media.props.style))
    expect(square).toMatchObject({ width: 40, height: 40, borderRadius: skeleton.radius })
    expect(round).toMatchObject({ width: 30, height: 30, borderRadius: 15 })
  })

  it('pulses only when animated with Fade, and stops when it leaves', () => {
    const stop = jest.fn()
    const loop = jest.spyOn(Animated, 'loop').mockReturnValue({ start: jest.fn(), stop, reset: jest.fn() } as any)
    const still = renderWithProviders(<Placeholder><PlaceholderLine /></Placeholder>)
    expect(still.getByTestId('placeholder-line').props.children).toBeFalsy()
    expect(loop).not.toHaveBeenCalled()

    const animated = renderWithProviders(<Placeholder Animation={Fade}><PlaceholderLine /></Placeholder>)
    expect(animated.getByTestId('placeholder-line').props.children).toBeTruthy()
    expect(loop).toHaveBeenCalledTimes(1)
    animated.unmount()
    expect(stop).toHaveBeenCalled()
    loop.mockRestore()
  })
})
