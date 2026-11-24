import { cashSuggestions } from '../cashSuggestions'

describe('cashSuggestions', () => {
  it.each([
    [48040, [50000, 60000, 100000]],
    [23.5, [25, 30, 40]],
    [50000, [60000, 100000]],
    [12.5, [15, 20, 50]],
    [7, [8, 10]],
    [0.4, [0.5, 1]]
  ])('gives the next round amounts above %s', (total, expected) => {
    expect(cashSuggestions(total)).toEqual(expected)
  })

  it.each([0, -1, -48040, NaN])('gives none for %s', (total) => {
    expect(cashSuggestions(total)).toEqual([])
  })

  it('gives as many as asked, three by default', () => {
    expect(cashSuggestions(23.5, 1)).toEqual([25])
    expect(cashSuggestions(23.5, 2)).toEqual([25, 30])
    expect(cashSuggestions(23.5)).toHaveLength(3)
    expect(cashSuggestions(23.5, 5)).toEqual([25, 30, 40, 50, 100])
    expect(cashSuggestions(23.5, 0)).toEqual([])
  })

  it('never repeats an amount, even when the steps meet', () => {
    expect(cashSuggestions(48040, 5)).toEqual([50000, 60000, 100000])
    expect(cashSuggestions(999, 5)).toEqual([1000])
  })

  it('is always above the total, ascending, unique and to the cent', () => {
    const totals = [0.01, 0.99, 1, 1.05, 9.99, 10, 19.9, 33.33, 99.99, 100, 101, 149.5, 999.99, 1000, 12345.67, 48040, 50000, 99999, 1234567]
    totals.forEach((total) => {
      const amounts = cashSuggestions(total, 5)
      expect(amounts.length).toBeGreaterThan(0)
      expect(new Set(amounts).size).toBe(amounts.length)
      expect([...amounts].sort((a, b) => a - b)).toEqual(amounts)
      amounts.forEach((amount) => {
        expect(amount).toBeGreaterThan(total)
        expect(Math.round(amount * 100) / 100).toBe(amount)
      })
    })
  })
})
