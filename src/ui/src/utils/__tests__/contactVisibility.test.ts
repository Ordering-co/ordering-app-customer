import { isBusinessContactHidden } from '../contactVisibility'

describe('contactVisibility', () => {
  it('hides business contact only when that switch is 1', () => {
    expect(isBusinessContactHidden(undefined)).toBe(false)
    expect(isBusinessContactHidden({})).toBe(false)
    expect(isBusinessContactHidden({ hide_business_contact_customer_app: { value: '0' } })).toBe(false)
    expect(isBusinessContactHidden({ hide_business_contact_customer_app: { value: '1' } })).toBe(true)
    expect(isBusinessContactHidden({ hide_customer_contact_business_app: { value: '1' } })).toBe(false)
  })
})
