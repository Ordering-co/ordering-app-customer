import '../../../../../../jest/helpers/registerM4NativeMocks'

import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { FeaturedProducts } from '../FeaturedProducts'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

jest.mock('@components', () => require('../../../../../../jest/helpers/m4MenuComponentsMock').getMock())
jest.mock('@ui', () => require('../../../../../../jest/helpers/m4MenuUiMock').getUiMock())

describe('FeaturedProducts', () => {
  const categoryState = {
    products: [
      { id: 2, name: 'Second Slice', featured: true, rank: 2 },
      { id: 3, name: 'Plain Slice', featured: false, rank: 0 },
      { id: 1, name: 'First Slice', featured: true, rank: 1 }
    ]
  }

  it('shows the featured products by rank', () => {
    const { getAllByTestId, queryByText } = renderWithProviders(<FeaturedProducts businessId={1} categoryState={categoryState} />)
    expect(getAllByTestId('single-product-card')).toHaveLength(2)
    expect(queryByText('Plain Slice')).toBeNull()
  })

  it('lays its products out without a callback from the screen (the menu measures no category)', () => {
    const { getAllByTestId } = renderWithProviders(<FeaturedProducts businessId={1} categoryState={categoryState} />)
    let tile: any = getAllByTestId('single-product-card')[0].parent
    while (tile && tile.props.style === undefined) tile = tile.parent
    expect(tile.props.onLayout).toBeUndefined()
    expect(() => fireEvent(tile, 'layout', { nativeEvent: { layout: { y: 0, height: 10 } } })).not.toThrow()
  })
})
