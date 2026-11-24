import '../../../../../../jest/helpers/registerM4NativeMocks'

import React from 'react'

import { BusinessReviews } from '..'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

jest.mock('@components', () => require('../../../../../../jest/helpers/m4MenuComponentsMock').getMock())
jest.mock('@ui', () => require('../../../../../../jest/helpers/m4MenuUiMock').getUiMock())

describe('BusinessReviews', () => {
  const themeWith = (keys: Record<string, boolean>) => {
    const { defaultAppTheme } = require('../../../../../theme/engine')
    const base = defaultAppTheme()
    return { values: { ...base.values, visibility: { ...base.values.visibility, ...keys } } }
  }

  it('renders average rating and review comments when the theme shows them', () => {
    const { getByText } = renderWithProviders(
      <BusinessReviews businessId={1} reviews={[1]} />,
      { themeOverrides: themeWith({ 'business.reviews.ranking': true, 'business.reviews.customer_comments': true }) }
    )
    expect(getByText('4.5')).toBeTruthy()
    expect(getByText('Great pizza')).toBeTruthy()
    expect(getByText(/of the 5.0/i)).toBeTruthy()
  })

  it('hides the rating summary and the comments by default (as the web), and the dates when hidden', () => {
    const shown = renderWithProviders(<BusinessReviews businessId={1} reviews={[1]} />)
    expect(shown.queryByText('4.5')).toBeNull()
    expect(shown.queryByText('Great pizza')).toBeNull()
    expect(shown.getByText('2026-01-01T12:00:00Z')).toBeTruthy()
    const hidden = renderWithProviders(
      <BusinessReviews businessId={1} reviews={[1]} />,
      { themeOverrides: themeWith({ 'business.reviews.review_date': false }) }
    )
    expect(hidden.queryByText('2026-01-01T12:00:00Z')).toBeNull()
  })
})
