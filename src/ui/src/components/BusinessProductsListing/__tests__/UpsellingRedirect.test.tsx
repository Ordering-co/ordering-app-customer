import React from 'react'
import { render } from '@testing-library/react-native'

import { UpsellingRedirect } from '../UpsellingRedirect'

const mockControllerProps = jest.fn()

jest.mock('@components', () => ({
  UpsellingPage: (props) => mockControllerProps(props) ?? null
}))

describe('UpsellingRedirect', () => {
  beforeEach(() => mockControllerProps.mockReset())

  it('loads upselling from the cart upselling endpoint when the cart products are known', () => {
    render(<UpsellingRedirect businessId={1} cartProducts={[{ id: 7 }]} />)
    expect(mockControllerProps).toHaveBeenLastCalledWith(
      expect.objectContaining({ businessId: 1, useSuggestiveUpselling: true })
    )
  })

  it('opens the page with plain data only, no functions', () => {
    const onRedirect = jest.fn()
    mockControllerProps.mockImplementation(({ UIComponent, ...rest }) => {
      const React = require('react')
      return React.createElement(UIComponent, { ...rest, upsellingProducts: { loading: false, products: [{ id: 3 }] } })
    })
    render(
      <UpsellingRedirect
        businessId={1}
        business={{ slug: 'shop', api: {} }}
        cartProducts={[{ id: 7 }]}
        setOpenUpselling={jest.fn()}
        handleUpsellingPage={jest.fn()}
        onRedirect={onRedirect}
      />
    )
    expect(onRedirect).toHaveBeenCalledWith('UpsellingPage', {
      businessId: 1,
      business: { slug: 'shop' },
      cartProducts: [{ id: 7 }],
      products: [{ id: 3 }]
    })
  })

  it('keeps the business products endpoint without cart products', () => {
    render(<UpsellingRedirect businessId={1} />)
    expect(mockControllerProps).toHaveBeenLastCalledWith(
      expect.objectContaining({ useSuggestiveUpselling: false })
    )
  })
})
