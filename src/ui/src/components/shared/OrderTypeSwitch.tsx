import React from 'react'
import { OrderTypeControl, useConfig, useLanguage, useOrder } from '@components'
import { Tabs } from '../../Forms/Tabs'
import { ORDER_TYPES } from '../../config/constants'
import { getTypesLabel } from '../../utils'

const MAX_STRETCHED_TYPES = 3

const OrderTypeSwitchUI = (props: any) => {
  const { typeSelected, handleChangeOrderType } = props
  const [, t] = useLanguage()
  const [{ configs }] = useConfig()
  const [orderState] = useOrder()

  const allowed = (configs?.order_types_allowed?.value ?? '').split('|').map((value: string) => Number(value))
  const types = ORDER_TYPES.filter((type: any) => allowed.includes(type.value))
  if (types.length < 2) return null

  const handleChangeTab = (type: number) => {
    if (orderState?.loading || type === typeSelected) return
    handleChangeOrderType(type)
  }

  return (
    <Tabs
      group='header'
      slot='order_type'
      stretch={types.length <= MAX_STRETCHED_TYPES}
      defaultTab={typeSelected}
      defaultTabs={types.map((type: any) => ({ tab: type.value, type: type.value, text: getTypesLabel(type.value, t), enabled: true }))}
      handleChangeTab={handleChangeTab}
    />
  )
}

export const OrderTypeSwitch = (props: any) => (
  <OrderTypeControl {...props} UIComponent={OrderTypeSwitchUI} />
)
