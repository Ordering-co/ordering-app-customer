import React from 'react'
import { StyleSheet } from 'react-native'
import { act } from '@testing-library/react-native'
import FastImage from 'react-native-fast-image'

import { BusinessLogo } from '../BusinessLogo'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

const shadow = { shadowOpacity: 0.1, elevation: 1 }
const render = (uri?: string | null) =>
  renderWithProviders(<BusinessLogo testID='logo' uri={uri} size={70} radius={8} background='#FFFFFF' shadow={shadow} />)

describe('BusinessLogo', () => {
  it('puts the shadow on a box with a background, never on the picture', () => {
    const { getByTestId, UNSAFE_getByType } = render('https://example.com/logo.png')
    expect(StyleSheet.flatten(getByTestId('logo').props.style)).toMatchObject({ backgroundColor: '#FFFFFF', elevation: 1, width: 70 })
    const image = UNSAFE_getByType(FastImage)
    expect(StyleSheet.flatten(image.props.style).elevation).toBeUndefined()
    expect(image.props.source).toMatchObject({ uri: 'https://example.com/logo.png' })
  })

  it('shows the placeholder without a logo, and when the logo does not load', () => {
    const empty = render(null)
    const placeholder = empty.UNSAFE_getByType(FastImage).props.source
    expect(placeholder).toBeTruthy()
    expect(placeholder.uri).toBeUndefined()
    empty.unmount()
    const broken = render('https://example.com/broken.png')
    act(() => broken.UNSAFE_getByType(FastImage).props.onError())
    expect(broken.UNSAFE_getByType(FastImage).props.source).toBe(placeholder)
    expect(broken.UNSAFE_getByType(FastImage).props.objectFit).toBe('contain')
  })
})
