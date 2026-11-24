import '../../../../../../jest/helpers/registerM3NativeMocks'

import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { BusinessSearchHeader } from '../BusinessSearchHeader'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

jest.mock('../BusinessesFilters', () => ({ BusinessesFilters: () => null }))

jest.mock('@/theme/sections', () => ({
  usePageSections: () => ({
    render: (sections: any) => sections.search(),
    isVisible: () => true
  })
}))

jest.mock('@components', () => require('../../../../../../jest/helpers/m3DiscoveryComponentsMock').getMock())
jest.mock('@ui', () => {
  const React = require('react')
  const { Text, TextInput } = require('react-native')
  return {
    OText: ({ children }: any) => <Text>{children}</Text>,
    NotFoundSource: () => null,
    BusinessTypeFilter: () => null,
    // The real bar: `onChangeText` at each key, `onSearch` after the pause.
    SearchBar: ({ onChangeText, placeholder }: any) => <TextInput placeholder={placeholder} onChangeText={onChangeText} />
  }
})

const HINT = 'Type at least 2 characters'

describe('BusinessSearchHeader', () => {
  const baseProps = () => ({
    businessesSearchList: { loading: false, lengthError: false, businesses: [{ id: 1 }] },
    onChangeTermValue: jest.fn(),
    handleChangeFilters: jest.fn(),
    termValue: ''
  })

  it('shows the hint while the field has fewer than 2 characters', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<BusinessSearchHeader {...baseProps()} />)
    expect(getByText(HINT)).toBeTruthy()
    fireEvent.changeText(getByPlaceholderText('Search Businesses'), 'p')
    expect(getByText(HINT)).toBeTruthy()
  })

  it('hides the hint as soon as the field shows 2 characters, before the search term catches up', () => {
    // `termValue` stays '' (the pause has not passed): the hint follows the field.
    const { queryByText, getByPlaceholderText } = renderWithProviders(<BusinessSearchHeader {...baseProps()} />)
    fireEvent.changeText(getByPlaceholderText('Search Businesses'), 'piza')
    expect(queryByText(HINT)).toBeNull()
  })

  it('shows the hint again when the text is cleared', () => {
    const { getByText, queryByText, getByPlaceholderText } = renderWithProviders(<BusinessSearchHeader {...baseProps()} />)
    const input = getByPlaceholderText('Search Businesses')
    fireEvent.changeText(input, 'piza')
    expect(queryByText(HINT)).toBeNull()
    fireEvent.changeText(input, '')
    expect(getByText(HINT)).toBeTruthy()
  })
})
