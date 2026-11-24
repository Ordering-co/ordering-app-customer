import '../../../../../../jest/helpers/registerM3NativeMocks'

import React from 'react'

import { BusinessCardSkeleton } from '../BusinessCardSkeleton'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

jest.mock('@components', () => require('../../../../../../jest/helpers/m3DiscoveryComponentsMock').getMock({}))
jest.mock('@ui', () => require('../../../../../../jest/helpers/m3DiscoveryUiMock').getUiMock())

describe('BusinessCardSkeleton', () => {
  it('a narrow card (the carousel) is as tall as the loaded one: name and one meta line, no third line', () => {
    const narrow = renderWithProviders(<BusinessCardSkeleton narrow />)
    const wide = renderWithProviders(<BusinessCardSkeleton />)
    expect(narrow.getAllByTestId('placeholder-line')).toHaveLength(2)
    expect(wide.getAllByTestId('placeholder-line')).toHaveLength(3)
  })
})
