import settings from '../config'

export const getSingleBusiness = (): string | number | null => (settings as any)?.businessSlug ?? null

export const isSingleBusiness = (): boolean => getSingleBusiness() !== null
