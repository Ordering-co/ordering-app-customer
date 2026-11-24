type ConfigValue = { value?: string } | undefined
type Configs = Record<string, ConfigValue> | null | undefined

export const HIDE_BUSINESS_CONTACT_CUSTOMER_APP = 'hide_business_contact_customer_app'

const isOn = (configs: Configs, key: string) => configs?.[key]?.value === '1'

export const isBusinessContactHidden = (configs: Configs) =>
  isOn(configs, HIDE_BUSINESS_CONTACT_CUSTOMER_APP)
