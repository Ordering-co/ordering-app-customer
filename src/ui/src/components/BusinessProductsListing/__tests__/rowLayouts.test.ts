import { createRowLayouts } from '../rowLayouts'

const product = (id: number) => ({ key: `product:${id}`, kind: 'product' })
const title = (id: number) => ({ key: `category:${id}`, kind: 'category' })

describe('createRowLayouts', () => {
  it('guesses every height while nothing is measured', () => {
    const layouts = createRowLayouts(100)
    layouts.setRows([title(1), product(1), product(2)])
    expect(layouts.get(0)).toEqual({ length: 100, offset: 0, index: 0 })
    expect(layouts.get(2)).toEqual({ length: 100, offset: 200, index: 2 })
    expect(layouts.isMeasured(0)).toBe(false)
  })

  it('places each row after the measured heights of the ones above', () => {
    const layouts = createRowLayouts(100)
    layouts.setRows([title(1), product(1), product(2)])
    layouts.measure('category:1', 'category', 40)
    layouts.measure('product:1', 'product', 180)
    layouts.measure('product:2', 'product', 200)
    expect(layouts.get(1)).toEqual({ length: 180, offset: 40, index: 1 })
    expect(layouts.get(2)).toEqual({ length: 200, offset: 220, index: 2 })
    expect(layouts.isMeasured(2)).toBe(true)
  })

  it('assumes for a row that was never on screen the average of its kind', () => {
    const layouts = createRowLayouts(100)
    layouts.setRows([title(1), product(1), product(2), title(2), product(3)])
    layouts.measure('category:1', 'category', 40)
    layouts.measure('product:1', 'product', 180)
    layouts.measure('product:2', 'product', 200)
    // A title is as tall as the titles, a product as the products: a far category is where it will be, give or take.
    expect(layouts.get(3)).toEqual({ length: 40, offset: 420, index: 3 })
    expect(layouts.get(4)).toEqual({ length: 190, offset: 460, index: 4 })
  })

  it('assumes the average of every row for a kind it has not seen', () => {
    const layouts = createRowLayouts(100)
    layouts.setRows([product(1), product(2), { key: 'more:1', kind: 'more' }])
    layouts.measure('product:1', 'product', 100)
    layouts.measure('product:2', 'product', 200)
    expect(layouts.get(2).length).toBe(150)
  })

  it('follows a row whose height changes', () => {
    const layouts = createRowLayouts(100)
    layouts.setRows([product(1), product(2), product(3)])
    layouts.measure('product:1', 'product', 100)
    layouts.measure('product:1', 'product', 300)
    expect(layouts.get(1).offset).toBe(300)
    // The average counts the row once, with its last height.
    expect(layouts.get(2).length).toBe(300)
  })

  it('keeps the assumed heights above a measured row: the rows under them do not move with each new average', () => {
    const layouts = createRowLayouts(100)
    layouts.setRows([product(1), product(2), product(3), product(4), product(5)])
    layouts.measure('product:1', 'product', 100)
    // The list jumped to the fourth row and rendered it: the two it jumped over are assumed at 100.
    layouts.freeze(3)
    layouts.measure('product:4', 'product', 300)
    expect(layouts.get(3).offset).toBe(300)
    // The average is 200 now: the rows below take it, the ones jumped over keep theirs.
    expect(layouts.get(4)).toEqual({ length: 200, offset: 600, index: 4 })
    expect(layouts.get(1).length).toBe(100)
    // Until one of them is measured.
    layouts.measure('product:2', 'product', 160)
    expect(layouts.get(1).length).toBe(160)
    expect(layouts.get(2).length).toBe(100)
    expect(layouts.get(3).offset).toBe(360)
  })

  it('keeps what it measured when the rows change (a page more, a subcategory chosen)', () => {
    const layouts = createRowLayouts(100)
    layouts.setRows([product(1), product(2)])
    layouts.measure('product:1', 'product', 150)
    layouts.measure('product:2', 'product', 170)
    layouts.setRows([title(1), product(2), product(3)])
    expect(layouts.get(1)).toEqual({ length: 170, offset: 160, index: 1 })
    expect(layouts.isMeasured(1)).toBe(true)
    expect(layouts.isMeasured(2)).toBe(false)
  })

  it('answers for an index the rows no longer have', () => {
    const layouts = createRowLayouts(100)
    expect(layouts.get(3)).toEqual({ length: 0, offset: 0, index: 3 })
    layouts.setRows([product(1), product(2)])
    expect(layouts.get(5)).toEqual({ length: 0, offset: 200, index: 5 })
    expect(layouts.isMeasured(5)).toBe(false)
  })
})
