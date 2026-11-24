/**
 * The menu of a business as a flat list of rows, so a virtualized list mounts
 * only the ones near the screen (a menu of 2,500 products mounted them all).
 *
 * Pure: no React, no theme. The rows keep the order the menu always had:
 * the chosen category's subcategories, "order it again" and the featured
 * products (in the theme's order), then either the chosen category's products
 * or every category with its title, its subcategories and its products, and
 * at the end the skeletons, the empty state and the errors.
 */

export type MenuRow =
  /** The chosen category's subcategory chips (`category`), or a listed category's own. */
  | { kind: 'subcategories', key: string, category: any, section: any }
  | { kind: 'order_it_again', key: string, section: null }
  | { kind: 'featured_products', key: string, section: 'featured' }
  | { kind: 'category', key: string, category: any, section: any }
  | { kind: 'product', key: string, product: any, section: any }
  | { kind: 'more', key: string, category: any, section: any }
  | { kind: 'skeleton', key: string, section: null }
  | { kind: 'empty', key: string, section: null }
  | { kind: 'error', key: string, message: any, section: null }

export interface MenuRowsInput {
  /** The menu's categories (the "All" tab, of id null, is not one). */
  categories?: any[]
  /** The category chosen in the bar: `{ id: null }` is "All". */
  category?: any
  products?: any[]
  subcategoriesSelected?: any[]
  lazyLoadProductsRecommended?: boolean
  isUseParentCategory?: boolean
  /** The business has featured products. */
  featured?: boolean
  previouslyProducts?: any[]
  /** `order_it_again` and `featured_products`, the visible ones in the theme's order. */
  sections?: string[]
  loading?: boolean
  isBusinessLoading?: boolean
  nextPageItems?: number
  errors?: any[] | null
  searchValue?: string | null
  errorQuantityProducts?: boolean
  isFiltMode?: boolean
}

/** With every product loaded a category shows them all; a lazy menu shows these and a "More" card. */
export const LAZY_CATEGORY_PREVIEW = 9

const byRank = (a: any, b: any) => a.rank - b.rank

/** A product passes when its category has no subcategory chosen, or its own is one of the chosen. */
const matchesSubcategories = (product: any, category: any, subcategoriesSelected: any[]) =>
  !subcategoriesSelected.find((subcategory: any) => subcategory?.parent_category_id === category?.id) ||
  subcategoriesSelected.some((subcategory: any) => subcategory.id === product?.category_id)

/** The skeleton cards a loading page shows: never a negative or fractional count (an invalid array length). */
export const skeletonCount = (nextPageItems: any): number =>
  Number.isInteger(nextPageItems) && nextPageItems >= 0 ? nextPageItems : 1

/** Each category's products in one pass over the products (not one pass per category). */
const groupByCategory = (products: any[]) => {
  const groups = new Map<any, any[]>()
  for (const product of products) {
    const group = groups.get(product?.category_id)
    if (group) group.push(product)
    else groups.set(product?.category_id, [product])
  }
  return groups
}

export const buildMenuRows = (input: MenuRowsInput): MenuRow[] => {
  const {
    categories = [],
    category = { id: null },
    subcategoriesSelected = [],
    lazyLoadProductsRecommended = false,
    isUseParentCategory = false,
    featured = false,
    previouslyProducts,
    sections = [],
    loading = false,
    isBusinessLoading = false,
    nextPageItems,
    errors,
    searchValue,
    errorQuantityProducts,
    isFiltMode = false
  } = input
  const products: any[] = input.products ?? []
  const rows: MenuRow[] = []
  // A product listed twice in a section (a page that repeats one) keeps both rows, each with its own key.
  const seen = new Map<string, number>()
  const uniqueKey = (key: string) => {
    const times = seen.get(key) ?? 0
    seen.set(key, times + 1)
    return times === 0 ? key : `${key}#${times}`
  }
  const pushProduct = (product: any, section: any) =>
    rows.push({ kind: 'product', key: uniqueKey(`product:${section}:${product?.id}`), product, section })

  if (category?.subcategories?.length > 0) {
    rows.push({ kind: 'subcategories', key: 'subcategories:chosen', category, section: null })
  }

  for (const section of sections) {
    if (section === 'order_it_again' && (previouslyProducts?.length ?? 0) > 0) {
      rows.push({ kind: 'order_it_again', key: 'order_it_again', section: null })
    }
    if (section === 'featured_products' && !category?.id && featured) {
      rows.push({ kind: 'featured_products', key: 'featured_products', section: 'featured' })
    }
  }

  if (category?.id) {
    products
      .filter((product: any) => matchesSubcategories(product, category, subcategoriesSelected))
      .sort(byRank)
      .forEach((product: any) => pushProduct(product, category.id))
  } else {
    const groups = isUseParentCategory ? null : groupByCategory(products)
    for (const listed of categories) {
      // "All" (null) is the list itself; "featured" is its own row above.
      if (!listed?.id) continue
      const ofCategory: any[] = groups
        ? groups.get(listed.id) ?? []
        : products.filter((product: any) => listed?.children?.some((child: any) => child.category_id === product?.category_id))
      const shown = subcategoriesSelected.length > 0
        ? ofCategory.filter((product: any) => matchesSubcategories(product, listed, subcategoriesSelected))
        : ofCategory
      if (shown.length === 0) continue

      rows.push({ kind: 'category', key: `category:${listed.id}`, category: listed, section: listed.id })
      if (listed?.subcategories?.length > 0 && !isFiltMode) {
        rows.push({ kind: 'subcategories', key: `subcategories:${listed.id}`, category: listed, section: listed.id })
      }
      const sorted = [...shown].sort(byRank)
      sorted.forEach((product: any, index: number) => {
        if (!lazyLoadProductsRecommended || (index < LAZY_CATEGORY_PREVIEW && product?.category_id === listed.id)) {
          pushProduct(product, listed.id)
        }
      })
      if (lazyLoadProductsRecommended && !loading && shown.length > LAZY_CATEGORY_PREVIEW) {
        rows.push({ kind: 'more', key: `more:${listed.id}`, category: listed, section: listed.id })
      }
    }
  }

  if (loading || isBusinessLoading) {
    const count = skeletonCount(nextPageItems)
    for (let index = 0; index < count; index++) {
      rows.push({ kind: 'skeleton', key: `skeleton:${index}`, section: null })
    }
  }

  const hasNoProductsToReport = (searchValue && errorQuantityProducts) || (!searchValue && !errorQuantityProducts)
  if (!loading && !isBusinessLoading && products.length === 0 && !errors && !isFiltMode && !hasNoProductsToReport) {
    rows.push({ kind: 'empty', key: 'empty', section: null })
  }

  if (errors && errors.length > 0) {
    errors.forEach((message: any, index: number) => rows.push({ kind: 'error', key: `error:${index}`, message, section: null }))
  }

  return rows
}

/**
 * The row a tap on a category tab scrolls to: its title, the featured
 * products for "Featured", or -1 when the menu has no such row.
 */
export const categoryRowIndex = (rows: Array<{ kind: string, section?: any }>, categoryId: any): number => {
  if (categoryId === 'featured') return rows.findIndex((row) => row.kind === 'featured_products')
  return rows.findIndex((row) => row.kind === 'category' && row.section === categoryId)
}

/**
 * The category on screen: the one of the first visible row (the list reports
 * the visible rows; no row is measured). Null while that row belongs to no
 * category: the page's sections above the menu, a skeleton.
 */
export const viewedSection = (viewableItems: Array<{ index?: number | null, item?: { section?: any } }>): any => {
  let first: any = null
  let firstIndex = Infinity
  for (const viewable of viewableItems) {
    const index = viewable?.index ?? Infinity
    if (index < firstIndex) {
      firstIndex = index
      first = viewable
    }
  }
  return first?.item?.section ?? null
}
