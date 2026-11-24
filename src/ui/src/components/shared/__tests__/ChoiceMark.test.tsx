import React from 'react'

import ChoiceMark from '../ChoiceMark'
import OCheckbox from '../OCheckbox'
import { renderWithProviders } from '../../../../../../jest/helpers/renderWithProviders'

describe('ChoiceMark', () => {
  it('is the radio icon for a single choice and the check icon for a multiple one, by state', () => {
    const { toJSON, rerender } = renderWithProviders(<ChoiceMark kind='radio' checked />)
    const radioOn = JSON.stringify(toJSON())
    rerender(<ChoiceMark kind='radio' checked={false} />)
    const radioOff = JSON.stringify(toJSON())
    rerender(<ChoiceMark kind='check' checked />)
    const checkOn = JSON.stringify(toJSON())
    expect(new Set([radioOn, radioOff, checkOn]).size).toBe(3)
  })

  it('is the one control of the app: OCheckbox draws it', () => {
    const mark = renderWithProviders(<ChoiceMark kind='check' checked />)
    const box = renderWithProviders(<OCheckbox value onValueChange={jest.fn()} />)
    expect(JSON.stringify(box.toJSON())).toContain(JSON.stringify(mark.toJSON()).slice(1, 40))
  })
})
