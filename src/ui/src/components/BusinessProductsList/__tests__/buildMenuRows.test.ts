import { buildMenuRows, categoryRowIndex, skeletonCount, viewedSection, LAZY_CATEGORY_PREVIEW } from '../buildMenuRows'

const product = (id: number, categoryId: number, rank = id, extra: any = {}) => ({ id, category_id: categoryId, rank, name: `Product ${id}`, ...extra })
const kinds = (rows: any[]) => rows.map((row) => row.kind)
const keys = (rows: any[]) => rows.map((row) => row.key)

const ALL = { id: null, name: 'All' }
const categories = [
  { id: 'featured', name: 'Featured' },
  { id: 10, name: 'Pizzas' },
  { id: 11, name: 'Drinks', subcategories: [{ id: 111, name: 'Cold', parent_category_id: 11 }] },
  { id: 12, name: 'Empty' }
]

describe('buildMenuRows', () => {
  it('lists every category with its title, its subcategories and its products by rank', () => {
    const rows = buildMenuRows({
      categories,
      category: ALL,
      products: [product(3, 11, 1), product(1, 10, 2), product(2, 10, 1)]
    })
    expect(keys(rows)).toEqual([
      'category:10',
      'product:10:2',
      'product:10:1',
      'category:11',
      'subcategories:11',
      'product:11:3'
    ])
    // A row knows its category: the bar highlights it while it is on screen.
    expect(rows.map((row) => row.section)).toEqual([10, 10, 10, 11, 11, 11])
  })

  it('leaves out a category without products, "All" and "Featured"', () => {
    const rows = buildMenuRows({ categories: [ALL, ...categories], category: ALL, products: [product(1, 10)] })
    expect(keys(rows)).toEqual(['category:10', 'product:10:1'])
  })

  it('opens the menu with the chosen category\'s subcategories, then the theme\'s sections in its order', () => {
    const input = {
      categories,
      category: ALL,
      featured: true,
      previouslyProducts: [product(9, 10)],
      products: [product(1, 10)]
    }
    expect(kinds(buildMenuRows({ ...input, sections: ['order_it_again', 'featured_products'] })))
      .toEqual(['order_it_again', 'featured_products', 'category', 'product'])
    expect(kinds(buildMenuRows({ ...input, sections: ['featured_products', 'order_it_again'] })))
      .toEqual(['featured_products', 'order_it_again', 'category', 'product'])
    // A section the theme hides is not a row.
    expect(kinds(buildMenuRows({ ...input, sections: ['order_it_again'] })))
      .toEqual(['order_it_again', 'category', 'product'])
    expect(kinds(buildMenuRows({ ...input, sections: [] }))).toEqual(['category', 'product'])
  })

  it('shows the featured products only on "All", and only when the business has some', () => {
    const sections = ['order_it_again', 'featured_products']
    expect(kinds(buildMenuRows({ categories, category: ALL, featured: false, sections, products: [] }))).toEqual([])
    expect(kinds(buildMenuRows({ categories, category: { id: 10 }, featured: true, sections, products: [product(1, 10)] })))
      .toEqual(['product'])
    expect(kinds(buildMenuRows({ categories, category: ALL, featured: true, sections, previouslyProducts: [], products: [] })))
      .toEqual(['featured_products'])
  })

  it('lists a chosen category\'s products by rank under its subcategory chips', () => {
    const chosen = { id: 11, name: 'Drinks', subcategories: [{ id: 111, parent_category_id: 11 }, { id: 112, parent_category_id: 11 }] }
    const products = [product(1, 111, 3), product(2, 112, 1), product(3, 11, 2)]
    const rows = buildMenuRows({ categories, category: chosen, products })
    expect(keys(rows)).toEqual(['subcategories:chosen', 'product:11:2', 'product:11:3', 'product:11:1'])

    const filtered = buildMenuRows({
      categories,
      category: chosen,
      products,
      subcategoriesSelected: [{ id: 112, parent_category_id: 11 }]
    })
    expect(keys(filtered)).toEqual(['subcategories:chosen', 'product:11:2'])
  })

  it('filters a listed category by its chosen subcategories and leaves the others whole', () => {
    const rows = buildMenuRows({
      categories,
      category: ALL,
      products: [product(1, 10), product(2, 11), product(3, 11)],
      subcategoriesSelected: [{ id: 111, parent_category_id: 11 }]
    })
    // No product of "Drinks" is of the chosen subcategory: the whole category leaves.
    expect(keys(rows)).toEqual(['category:10', 'product:10:1'])
  })

  it('groups by the parent category when the project uses parent categories', () => {
    const parent = { id: 20, name: 'Food', children: [{ category_id: 21 }, { category_id: 22 }] }
    const rows = buildMenuRows({
      categories: [parent],
      category: ALL,
      isUseParentCategory: true,
      products: [product(1, 21, 2), product(2, 22, 1), product(3, 30, 1)]
    })
    expect(keys(rows)).toEqual(['category:20', 'product:20:2', 'product:20:1'])
  })

  it('previews a lazy menu\'s categories and offers the rest behind "More"', () => {
    const products = Array.from({ length: 15 }, (_, index) => product(index + 1, 10))
    const rows = buildMenuRows({ categories, category: ALL, products, lazyLoadProductsRecommended: true })
    expect(rows.filter((row) => row.kind === 'product')).toHaveLength(LAZY_CATEGORY_PREVIEW)
    expect(keys(rows).slice(-1)).toEqual(['more:10'])
    // While a page loads the "More" card waits; the skeletons take the end.
    const loading = buildMenuRows({ categories, category: ALL, products, lazyLoadProductsRecommended: true, loading: true, nextPageItems: 2 })
    expect(kinds(loading).slice(-3)).toEqual(['product', 'skeleton', 'skeleton'])
    // With every product loaded there is no preview.
    const whole = buildMenuRows({ categories, category: ALL, products })
    expect(whole.filter((row) => row.kind === 'product')).toHaveLength(15)
    expect(kinds(whole)).not.toContain('more')
  })

  it('gives every row a different key, also for a product a page repeats', () => {
    const rows = buildMenuRows({
      categories,
      category: { id: 10 },
      products: [product(1, 10), product(1, 10), product(2, 10)]
    })
    expect(keys(rows)).toEqual(['product:10:1', 'product:10:1#1', 'product:10:2'])
    expect(new Set(keys(rows)).size).toBe(rows.length)
  })

  it('keeps the products\' identity and never reorders the caller\'s array', () => {
    const products = [product(2, 10, 2), product(1, 10, 1)]
    const copy = [...products]
    const rows: any[] = buildMenuRows({ categories, category: ALL, products })
    expect(products).toEqual(copy)
    expect(rows[1].product).toBe(products[1])
    expect(rows[2].product).toBe(products[0])
  })

  it('shows the skeletons of the page that is loading', () => {
    expect(kinds(buildMenuRows({ category: ALL, loading: true, nextPageItems: 3 }))).toEqual(['skeleton', 'skeleton', 'skeleton'])
    expect(kinds(buildMenuRows({ category: ALL, isBusinessLoading: true, nextPageItems: 0 }))).toEqual([])
    expect(kinds(buildMenuRows({ category: ALL, loading: false, nextPageItems: 3, errorQuantityProducts: false }))).toEqual([])
  })

  it('never builds an invalid number of skeletons', () => {
    expect(skeletonCount(4)).toBe(4)
    expect(skeletonCount(0)).toBe(0)
    expect(skeletonCount(undefined)).toBe(1)
    expect(skeletonCount(-3)).toBe(1)
    expect(skeletonCount(2.5)).toBe(1)
    expect(skeletonCount(NaN)).toBe(1)
    expect(() => buildMenuRows({ category: ALL, loading: true, nextPageItems: -1 })).not.toThrow()
  })

  it('shows the empty state only when there is something to say', () => {
    const base = { category: ALL, products: [], loading: false, isBusinessLoading: false }
    expect(kinds(buildMenuRows({ ...base, searchValue: 'zzz', errorQuantityProducts: false }))).toEqual(['empty'])
    expect(kinds(buildMenuRows({ ...base, searchValue: '', errorQuantityProducts: true }))).toEqual(['empty'])
    expect(kinds(buildMenuRows({ ...base, searchValue: '', errorQuantityProducts: false }))).toEqual([])
    expect(kinds(buildMenuRows({ ...base, searchValue: 'zzz', errorQuantityProducts: true }))).toEqual([])
    expect(kinds(buildMenuRows({ ...base, searchValue: 'zzz', errorQuantityProducts: false, isFiltMode: true }))).toEqual([])
    expect(kinds(buildMenuRows({ ...base, searchValue: 'zzz', errorQuantityProducts: false, loading: true, nextPageItems: 0 }))).toEqual([])
    // A full menu (e.g. a closed business whose menu still returns every product) never shows the empty state.
    expect(kinds(buildMenuRows({ ...base, categories, products: [product(1, 10)] }))).toEqual(['category', 'product'])
  })

  it('lists the errors instead of the empty state', () => {
    const rows: any[] = buildMenuRows({ category: ALL, products: [], errors: ['menu down', 'again'], searchValue: 'zzz' })
    expect(keys(rows)).toEqual(['error:0', 'error:1'])
    expect(rows[0].message).toBe('menu down')
  })
})

describe('categoryRowIndex', () => {
  const rows = [
    { kind: 'section' },
    { kind: 'featured_products', section: 'featured' },
    { kind: 'category', section: 10 },
    { kind: 'product', section: 10 },
    { kind: 'category', section: 11 }
  ]

  it('finds a category\'s title, also one far down the menu', () => {
    expect(categoryRowIndex(rows, 10)).toBe(2)
    expect(categoryRowIndex(rows, 11)).toBe(4)
  })

  it('finds the featured products for the "Featured" tab', () => {
    expect(categoryRowIndex(rows, 'featured')).toBe(1)
  })

  it('answers -1 for a category without rows', () => {
    expect(categoryRowIndex(rows, 99)).toBe(-1)
    expect(categoryRowIndex([], 'featured')).toBe(-1)
  })
})

describe('viewedSection', () => {
  it('is the category of the first visible row', () => {
    expect(viewedSection([
      { index: 7, item: { section: 11 } },
      { index: 5, item: { section: 10 } },
      { index: 6, item: { section: 10 } }
    ])).toBe(10)
    expect(viewedSection([{ index: 3, item: { section: 'featured' } }, { index: 4, item: { section: 10 } }])).toBe('featured')
  })

  it('is none while the first visible row belongs to no category (the page above the menu)', () => {
    // The business header is still on screen: the first category below it is not "the one on screen".
    expect(viewedSection([{ index: 0, item: {} }, { index: 4, item: { section: 10 } }])).toBeNull()
    expect(viewedSection([{ index: 9, item: { section: null } }, { index: 10, item: { section: 10 } }])).toBeNull()
    expect(viewedSection([])).toBeNull()
  })
})
