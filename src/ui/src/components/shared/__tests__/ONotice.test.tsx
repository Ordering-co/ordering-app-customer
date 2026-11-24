import React from 'react'
import { StyleSheet } from 'react-native'
import ONotice from '../ONotice'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

describe('ONotice', () => {
  it('paints components.alert for its variant', () => {
    const { getByText, getByTestId } = renderWithProviders(<ONotice variant='danger' testID='n'>Oops</ONotice>)
    expect(getByText('Oops')).toBeTruthy()
    expect(StyleSheet.flatten(getByTestId('n').props.style).backgroundColor).toBeTruthy()
  })
})
