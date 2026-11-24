/**
 * Where each row of the business screen's list is: `getItemLayout` for a list
 * whose rows have different heights.
 *
 * A list without `getItemLayout` cannot scroll past the last row it rendered,
 * so a tap on a category far down the menu would have to render every row on
 * the way first. With it the list scrolls anywhere at once. A row's height is
 * the measured one once it has been on screen; until then it is assumed: the
 * average of the measured rows of its kind (a product card, a category title…).
 *
 * The rows the list jumps over (`freeze`) are blank space above the screen:
 * their assumed heights stay as they are until each one is measured, because
 * an assumption that moved with every new average would move everything
 * under it.
 */
export interface LayoutRow { key: string, kind: string }

export interface RowLayouts {
  /** The list's rows, in order. */
  setRows: (rows: LayoutRow[]) => void
  /** A row was laid out. */
  measure: (key: string, kind: string, height: number) => void
  /** `getItemLayout`: a row's height and where it starts. */
  get: (index: number) => { length: number, offset: number, index: number }
  isMeasured: (index: number) => boolean
  /** Keeps the assumed heights of the rows up to `index` (the list is about to jump over them). */
  freeze: (index: number) => void
}

/** `guess`: a row's height while no row of any kind has been measured. */
export const createRowLayouts = (guess: number): RowLayouts => {
  const measured = new Map<string, number>()
  const assumed = new Map<string, number>()
  const averages = new Map<string, { total: number, count: number }>()
  const ANY = '*'
  let rows: LayoutRow[] = []
  let lengths: number[] = []
  let offsets: number[] = []
  let dirty = true

  const count = (kind: string, height: number, times: number) => {
    for (const name of [kind, ANY]) {
      const average = averages.get(name) ?? { total: 0, count: 0 }
      average.total += height * times
      average.count += times
      averages.set(name, average)
    }
  }
  const estimate = (kind: string) => {
    const average = averages.get(kind)?.count ? averages.get(kind) : averages.get(ANY)
    return average?.count ? average.total / average.count : guess
  }

  const compute = () => {
    if (!dirty) return
    lengths = new Array(rows.length)
    offsets = new Array(rows.length)
    let offset = 0
    for (let index = 0; index < rows.length; index++) {
      const { key, kind } = rows[index]
      const height = measured.get(key) ?? assumed.get(key) ?? estimate(kind)
      lengths[index] = height
      offsets[index] = offset
      offset += height
    }
    dirty = false
  }

  return {
    setRows: (next) => {
      rows = next
      dirty = true
    },
    measure: (key, kind, height) => {
      const before = measured.get(key)
      if (before === height) return
      if (before !== undefined) count(kind, before, -1)
      count(kind, height, 1)
      measured.set(key, height)
      assumed.delete(key)
      dirty = true
    },
    get: (index) => {
      compute()
      if (rows.length === 0) return { length: 0, offset: 0, index }
      // The list may ask with the rows it had a moment ago: never beyond the ones there are.
      const at = Math.min(Math.max(index, 0), rows.length - 1)
      return at === index
        ? { length: lengths[at], offset: offsets[at], index }
        : { length: 0, offset: offsets[at] + lengths[at], index }
    },
    isMeasured: (index) => !!rows[index] && measured.has(rows[index].key),
    freeze: (index) => {
      for (let at = 0; at <= index && at < rows.length; at++) {
        const { key, kind } = rows[at]
        if (!measured.has(key) && !assumed.has(key)) assumed.set(key, estimate(kind))
      }
      dirty = true
    }
  }
}
