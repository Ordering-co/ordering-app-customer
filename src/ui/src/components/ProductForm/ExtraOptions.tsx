import React from 'react'
import { useLanguage } from '@components'
import { Tabs } from '../../Forms/Tabs'

/**
 * The option tabs of the product page: the ingredients and each top-level
 * option, as the product modal's navigation (`product_modal.slots.navigation`:
 * a `tabs` size and variant). A tab scrolls to its block.
 */
export const ExtraOptions = (props: any) => {
  const {
    product,
    withOptions,
    setSelectedOpt,
    scrollViewRef,
    optionLayout,
    editionsLayoutY,
    selOpt
  } = props
  const [, t] = useLanguage()

  const tabs = [
    ...(product?.ingredients?.length > 0
      ? [{ id: 0, type: 'opt_0', text: t('INGREDIENTS', 'Ingredients'), enabled: true }]
      : []),
    ...(withOptions
      ? (product?.extras ?? []).flatMap((extra: any) => (extra?.options ?? [])
        .filter((option: any) => option?.respect_to == null && option?.suboptions?.length > 0)
        .map((option: any) => ({ id: option.id, type: `opt_${option.id}`, text: option.name, enabled: true })))
      : [])
  ]

  if (!tabs.length) return null

  return (
    <Tabs
      group='product_modal'
      slot='navigation'
      setFullItemAfterClick
      defaultTab={`opt_${selOpt}`}
      defaultTabs={tabs}
      handleChangeTab={(tab: any) => {
        setSelectedOpt(tab.id)
        scrollViewRef?.current?.scrollTo?.({
          y: optionLayout[`id:${tab.id}`]?.y + editionsLayoutY - 50,
          animated: true
        })
      }}
    />
  )
}
