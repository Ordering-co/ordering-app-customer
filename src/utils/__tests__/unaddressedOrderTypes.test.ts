import {
  PICKUP_ORDER_TYPE,
  canPickupWithoutAddress,
  isOrderTypeUnaddressed,
  parseUnaddressedOrderTypes
} from '../unaddressedOrderTypes'

const configs = (allowed: unknown, unaddressed: unknown) => ({
  order_types_allowed: { value: allowed },
  unaddressed_order_types_allowed: { value: unaddressed }
})

describe('unaddressedOrderTypes', () => {
  it('parses the pipe list and drops what is not a type', () => {
    expect(parseUnaddressedOrderTypes(configs('1|2', '2|3'))).toEqual([2, 3])
    expect(parseUnaddressedOrderTypes(configs('1|2', '2|x|0|-1||'))).toEqual([2])
    expect(parseUnaddressedOrderTypes(configs('1|2', ''))).toEqual([])
    expect(parseUnaddressedOrderTypes(configs('1|2', null))).toEqual([])
    expect(parseUnaddressedOrderTypes(null)).toEqual([])
    expect(parseUnaddressedOrderTypes({})).toEqual([])
  })

  it('knows if an order type lists without an address (string or number)', () => {
    expect(isOrderTypeUnaddressed(configs('1|2', '2'), 2)).toBe(true)
    expect(isOrderTypeUnaddressed(configs('1|2', '2'), '2')).toBe(true)
    expect(isOrderTypeUnaddressed(configs('1|2', '2'), 1)).toBe(false)
    expect(isOrderTypeUnaddressed(configs('1|2', '2'), undefined)).toBe(false)
  })

  it('offers pickup only when it is allowed and unaddressed', () => {
    expect(PICKUP_ORDER_TYPE).toBe(2)
    expect(canPickupWithoutAddress(configs('1|2', '2'))).toBe(true)
    expect(canPickupWithoutAddress(configs('1', '2'))).toBe(false)
    expect(canPickupWithoutAddress(configs('1|2', '1'))).toBe(false)
    expect(canPickupWithoutAddress(configs('1|2', ''))).toBe(false)
    expect(canPickupWithoutAddress(undefined)).toBe(false)
  })
})
