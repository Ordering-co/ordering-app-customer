/**
 * LoadingOverlay (src/ui/src/components/LoadingOverlay): nothing while
 * hidden; a modal scrim and spinner in the theme's colors, or the screen's.
 */
import React from 'react'
import { ActivityIndicator, Modal, StyleSheet } from 'react-native'
import { LoadingOverlay } from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

describe('LoadingOverlay', () => {
  it('renders nothing while hidden', () => {
    const { toJSON } = renderWithProviders(<LoadingOverlay visible={false} />)
    expect(toJSON()).toBeNull()
  })

  it('covers the window with the theme scrim and spinner while visible', () => {
    const { getByTestId, UNSAFE_getByType } = renderWithProviders(<LoadingOverlay visible />)
    const modal = UNSAFE_getByType(Modal)
    expect(modal.props.transparent).toBe(true)
    expect(modal.props.statusBarTranslucent).toBe(true)
    const scrim = StyleSheet.flatten(getByTestId('loading-overlay').props.style)
    expect(typeof scrim.backgroundColor).toBe('string')
    expect(scrim.backgroundColor).not.toBe('')
    const spinner = UNSAFE_getByType(ActivityIndicator)
    expect(spinner.props.size).toBe('large')
    expect(typeof spinner.props.color).toBe('string')
  })

  it('takes the colors a screen gives', () => {
    const { getByTestId, UNSAFE_getByType } = renderWithProviders(
      <LoadingOverlay visible color="#111111" overlayColor="#222222" />
    )
    expect(StyleSheet.flatten(getByTestId('loading-overlay').props.style).backgroundColor).toBe('#222222')
    expect(UNSAFE_getByType(ActivityIndicator).props.color).toBe('#111111')
  })
})
