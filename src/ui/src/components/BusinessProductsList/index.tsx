import React from 'react'

import { BusinessProductsListParams } from '../../types'
import { ProductsContainer } from './styles'
import { MenuRowView } from './MenuRowView'
import { useMenuRows } from './useMenuRows'

import { ProductsList } from '@components'

export { buildMenuRows, categoryRowIndex, viewedSection } from './buildMenuRows'
export type { MenuRow } from './buildMenuRows'
export { MenuRowView } from './MenuRowView'
export { useMenuRows } from './useMenuRows'

/**
 * The menu's rows one after another, all mounted: for a short list inside
 * another scroll. The business screen does not use it: it gives the same rows
 * (`useMenuRows`, `MenuRowView`) to its virtualized list, so a large menu
 * mounts only the rows near the screen.
 */
const BusinessProductsListUI = (props: BusinessProductsListParams) => {
  const { rows, cartQuantities, menu } = useMenuRows(props)

  return (
    <ProductsContainer>
      {rows.map((row) => (
        <MenuRowView
          key={row.key}
          row={row}
          quantity={row.kind === 'product' ? cartQuantities[row.product?.id] ?? 0 : 0}
          menu={menu}
        />
      ))}
    </ProductsContainer>
  )
}

export const BusinessProductsList = (props: BusinessProductsListParams) => {
  const businessProductsListProps = {
    ...props,
    UIComponent: BusinessProductsListUI
  }

  return <ProductsList {...businessProductsListProps} />
}
