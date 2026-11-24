export const normalizeBusinessSlug = (value: unknown): string | number | null => {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return value === 0 ? null : value
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed === '' || /^0+$/.test(trimmed)) return null
  if (/^\d+$/.test(trimmed)) return Number(trimmed)
  return value
}
