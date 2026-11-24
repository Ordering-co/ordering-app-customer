import { useCallback, useMemo, useRef } from 'react'

import { usePageSections } from '@/theme/sections'
import { useConfig } from '@components'
import { BusinessProductsListParams } from '../../types'
import { buildMenuRows } from './buildMenuRows'
import { MenuRowShared } from './MenuRowView'

const MENU_SECTIONS = ['order_it_again', 'featured_products']
const NO_SUBCATEGORIES: any[] = []

/**
 * The menu's rows (`buildMenuRows`), each product's units in the cart and what
 * the rows share. The rows are built again only when the menu changes (not
 * with the cart, not with a scroll), and the handlers the rows get never
 * change: each one runs the latest the screen passed.
 */
export const useMenuRows = (props: BusinessProductsListParams) => {
  const {
    errors,
    businessId,
    category,
    categories,
    categoryState,
    featured,
    searchValue,
    isBusinessLoading,
    errorQuantityProducts,
    currentCart,
    lazyLoadProductsRecommended,
    previouslyProducts,
    isFiltMode,
    navigation,
    businessSingleId
  } = props
  const subcategoriesSelected = props.subcategoriesSelected ?? NO_SUBCATEGORIES

  const [{ configs }] = useConfig()
  const isUseParentCategory = configs?.use_parent_category?.value === 'true' || configs?.use_parent_category?.value === '1'
  // `order_it_again` and `featured_products` (sections of the `business` page)
  // open the menu, in the theme's order: the "Featured" tab scrolls to them.
  const { sections: pageSections } = usePageSections('business')
  const sections = useMemo(() => pageSections
    .filter((section: any) => section.visible && MENU_SECTIONS.includes(section.key))
    .map((section: any) => section.key), [pageSections])

  const products = categoryState?.products
  const loading = !!categoryState?.loading
  const nextPageItems = categoryState?.pagination?.nextPageItems
  const rows = useMemo(() => buildMenuRows({
    categories,
    category,
    products,
    subcategoriesSelected,
    lazyLoadProductsRecommended,
    isUseParentCategory,
    featured: !!featured,
    previouslyProducts,
    sections,
    loading,
    isBusinessLoading: !!isBusinessLoading,
    nextPageItems,
    errors,
    searchValue,
    errorQuantityProducts,
    isFiltMode
  }), [
    categories, category, products, subcategoriesSelected, lazyLoadProductsRecommended, isUseParentCategory,
    featured, previouslyProducts, sections, loading, isBusinessLoading, nextPageItems, errors, searchValue,
    errorQuantityProducts, isFiltMode
  ])

  // Each product's quantity in the cart, counted once instead of once per card.
  const cartQuantities = useMemo(() => {
    const quantities: Record<string, number> = {}
    currentCart?.products?.forEach((product: any) => {
      quantities[product?.id] = (quantities[product?.id] ?? 0) + (product?.quantity ?? 0)
    })
    return quantities
  }, [currentCart?.products])

  // The rows keep the handlers they get first (the product card's memo compares the product):
  // stable ones that run the screen's latest, so none works with the products of an older page.
  const latest = useRef(props)
  latest.current = props
  const onProductClick = useCallback((product: any) => latest.current.onProductClick?.(product), [])
  const onClickCategory = useCallback((clicked: any) => latest.current.onClickCategory?.(clicked), [])
  const handleUpdateProducts = useCallback((...args: any[]) => latest.current.handleUpdateProducts?.(...args), [])
  const handleSearchRedirect = useCallback(() => { latest.current.handleSearchRedirect?.() }, [])
  const handleCancelSearch = useCallback(() => { latest.current.handleCancelSearch?.() }, [])
  const onClickSubcategory = useCallback((subCategory: any, parentCategory: any) => {
    const current = latest.current
    const selected: any[] = current.subcategoriesSelected ?? NO_SUBCATEGORIES
    if (parentCategory && current.lazyLoadProductsRecommended) {
      current.onClickCategory?.(parentCategory)
    }
    if (!subCategory) {
      current.setSubcategoriesSelected?.(selected.filter((_subcategory: any) => _subcategory?.parent_category_id !== parentCategory?.id))
      return
    }
    const categoryFounded = selected.find((_subcategory: any) => subCategory?.id === _subcategory?.id)
    current.setSubcategoriesSelected?.(categoryFounded
      ? selected.filter((_subcategory: any) => subCategory?.id !== _subcategory?.id)
      : [...selected, subCategory]
    )
  }, [])

  const menu: MenuRowShared = useMemo(() => ({
    businessId,
    businessSingleId,
    navigation,
    categoryState,
    currentCart,
    previouslyProducts,
    searchValue,
    subcategoriesSelected,
    isFiltMode,
    onProductClick,
    onClickCategory,
    onClickSubcategory,
    handleUpdateProducts,
    handleSearchRedirect,
    handleCancelSearch
  }), [
    businessId, businessSingleId, navigation, categoryState, currentCart, previouslyProducts, searchValue,
    subcategoriesSelected, isFiltMode, onProductClick, onClickCategory, onClickSubcategory, handleUpdateProducts,
    handleSearchRedirect, handleCancelSearch
  ])

  return { rows, cartQuantities, menu }
}
