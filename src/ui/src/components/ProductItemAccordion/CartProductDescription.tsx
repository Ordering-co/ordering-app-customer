import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useTheme } from 'styled-components/native'

import { useApi, useLanguage, useOrder } from '@components'
import { OText } from '@ui'
import { nativeTextStyle, themePart, themeSpace } from '@/theme/helpers'

const descriptions = new Map<string, string>()
const pending = new Map<string, Promise<string>>()

export const clearCartProductDescriptions = () => {
  descriptions.clear()
  pending.clear()
}

export const CartProductDescription = ({ product, onViewMore }: { product: any, onViewMore?: () => void }) => {
  const theme: any = useTheme()
  const [ordering] = useApi()
  const [, t] = useLanguage()
  const [orderState] = useOrder()
  const businessId = product?.business_id ?? (Object.values(orderState?.carts ?? {}) as any[])
    .find((cart: any) => cart?.products?.some((line: any) => line?.code === product?.code))?.business_id
  const key = `${businessId}:${product?.category_id}:${product?.id}`
  const [description, setDescription] = useState<string>(descriptions.get(key) ?? '')

  useEffect(() => {
    if (!businessId || !product?.category_id || !product?.id) return
    if (descriptions.has(key)) {
      setDescription(descriptions.get(key) as string)
      return
    }
    let active = true
    const request: Promise<string> = pending.get(key) ?? ordering
      .businesses(businessId)
      .categories(product.category_id)
      .products(product.id)
      .get()
      .then((response: any) => {
        const value = response?.content?.result?.description ?? ''
        descriptions.set(key, value)
        return value
      })
      .finally(() => { pending.delete(key) })
    pending.set(key, request)
    request.then((value: string) => { if (active) setDescription(value) }).catch(() => {})
    return () => { active = false }
  }, [key])

  const styles = useMemo(() => {
    const card = themePart(theme, 'product_card', 'base')
    const link = themePart(theme, 'link', 'base')
    return StyleSheet.create({
      description: { ...nativeTextStyle(card.description), color: card.description_color },
      link: {
        ...nativeTextStyle(themePart(theme, 'link', 'sizes.md.text')),
        color: link.color,
        ...(link.underline === 'always' && { textDecorationLine: 'underline' as const })
      },
      more: { alignSelf: 'flex-start' }
    })
  }, [theme])

  if (!description) return null

  return (
    <View testID='cart-product-description'>
      <OText style={styles.description} numberOfLines={themePart(theme, 'product_card', 'base.description_lines')} ellipsizeMode='tail'>
        {description}
      </OText>
      {!!onViewMore && (
        <Pressable style={styles.more} hitSlop={themeSpace(theme, 'md')} onPress={onViewMore}>
          <OText style={styles.link}>{t('VIEW_MORE', 'View more')}</OText>
        </Pressable>
      )}
    </View>
  )
}
