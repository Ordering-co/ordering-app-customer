/** Order type 2 is pickup (1 delivery, 3 eat in, 4 curbside, 5 drive-thru). */
export const PICKUP_ORDER_TYPE = 2

type ConfigsLike = {
  order_types_allowed?: { value?: unknown }
  unaddressed_order_types_allowed?: { value?: unknown }
} | null | undefined

/** A `1|2|3` config value as numbers; anything that is not a positive number is dropped. */
const parseOrderTypes = (value: unknown): number[] => {
  if (value === undefined || value === null || value === '') return []
  return String(value)
    .split('|')
    .map(Number)
    .filter((type) => Number.isFinite(type) && type > 0)
}

/** The order types the project lets list businesses without an address (`unaddressed_order_types_allowed`). */
export const parseUnaddressedOrderTypes = (configs: ConfigsLike): number[] =>
  parseOrderTypes(configs?.unaddressed_order_types_allowed?.value)

export const isOrderTypeUnaddressed = (configs: ConfigsLike, orderType: unknown): boolean =>
  parseUnaddressedOrderTypes(configs).includes(Number(orderType))

/** Pickup is an allowed order type and one that needs no address. */
export const canPickupWithoutAddress = (configs: ConfigsLike): boolean =>
  parseOrderTypes(configs?.order_types_allowed?.value).includes(PICKUP_ORDER_TYPE) &&
  isOrderTypeUnaddressed(configs, PICKUP_ORDER_TYPE)
