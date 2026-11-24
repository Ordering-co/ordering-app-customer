const round = (amount: number) => Math.round(amount * 100) / 100

export const cashSuggestions = (total: number, count = 3): number[] => {
  if (!(total > 0)) return []
  const magnitude = Math.pow(10, Math.floor(Math.log10(total)))
  const steps = [magnitude / 2, magnitude, magnitude * 2, magnitude * 5, magnitude * 10]
  const amounts = steps
    .map((step) => round(Math.ceil(round(total / step)) * step))
    .filter((amount) => amount > total)
  return [...new Set(amounts)].sort((a, b) => a - b).slice(0, count)
}
