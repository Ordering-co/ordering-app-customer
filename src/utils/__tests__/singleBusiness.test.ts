import { normalizeBusinessSlug } from '../businessSlug'
import { getSingleBusiness, isSingleBusiness } from '../singleBusiness'

const mockSettings: any = {}
jest.mock('../../config', () => ({ __esModule: true, get default() { return mockSettings } }))

describe('normalizeBusinessSlug', () => {
  it.each([
    ['0', null],
    [0, null],
    ['', null],
    [null, null],
    [undefined, null],
    ['1', 1],
    ['42', 42],
    [7, 7],
    ['my-business', 'my-business'],
    ['shop2', 'shop2'],
    ['2-shop', '2-shop']
  ])('turns %p into %p', (value, expected) => {
    expect(normalizeBusinessSlug(value)).toBe(expected)
  })
})

describe('single business mode', () => {
  afterEach(() => {
    delete mockSettings.businessSlug
  })

  it('is off without a configured business', () => {
    expect(getSingleBusiness()).toBeNull()
    expect(isSingleBusiness()).toBe(false)
    mockSettings.businessSlug = null
    expect(getSingleBusiness()).toBeNull()
    expect(isSingleBusiness()).toBe(false)
  })

  it('is on with an id or a slug, and says which business', () => {
    mockSettings.businessSlug = 1
    expect(getSingleBusiness()).toBe(1)
    expect(isSingleBusiness()).toBe(true)
    mockSettings.businessSlug = 'my-business'
    expect(getSingleBusiness()).toBe('my-business')
    expect(isSingleBusiness()).toBe(true)
  })
})
