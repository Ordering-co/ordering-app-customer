const normalizeBusinessTypeKey = (name: string) =>
  String(name ?? '')
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toUpperCase()

export const isAllBusinessType = (type: any) => {
  if (type?.id == null) return true
  const raw = String(type?.name ?? '').trim()
  if (/^all\b/i.test(raw)) return true
  return normalizeBusinessTypeKey(raw) === 'ALL'
}

export const businessTypeLabel = (type: any, t: (key: string, fallback?: string) => string) => {
  if (type?.id == null) {
    return t('ALL', type?.name || 'All')
  }
  if (isAllBusinessType(type)) {
    return t('ALL', 'All')
  }
  const keySuffix = normalizeBusinessTypeKey(type?.name)
  if (!keySuffix) return type?.name
  return t(`BUSINESS_TYPE_${keySuffix}`, type.name)
}
