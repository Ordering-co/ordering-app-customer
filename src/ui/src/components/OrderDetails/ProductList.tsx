import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { useTheme } from 'styled-components/native'

import { ProductLine, ProductLines, ProfessionalBlock, ProfessionalPhoto } from './styles'
import { useLanguage, useUtils } from '@components'
import { getProductOptionSummaryLabels } from '../ProductItemAccordion/getOptionSuboptions'
import { OText, ProductItemAccordion } from '@ui'
import Icon from '../shared/Icon'
import { nativeTextStyle, themePart, themeVisible } from '@/theme/helpers'

export const ProductList = (props: any) => {
  const { order } = props

  const theme: any = useTheme()
  const styles = useMemo(() => StyleSheet.create({
    professional: { flexDirection: 'row', alignItems: 'center', width: '100%' },
    photo: { borderRadius: themePart(theme, 'product_card', 'base.image_radius') },
    name: nativeTextStyle(themePart(theme, 'bill', 'base.row')),
    grow: { flex: 1 },
    quantity: { ...nativeTextStyle(themePart(theme, 'bill', 'base.row')), color: theme.native.tokens.color.text_muted },
    productName: { ...nativeTextStyle(themePart(theme, 'list_row', 'base.title')), color: theme.native.tokens.color.text },
    choices: { ...nativeTextStyle(themePart(theme, 'bill', 'base.row')), color: theme.native.tokens.color.text_muted },
    price: { ...nativeTextStyle(themePart(theme, 'list_row', 'base.title')), color: theme.native.tokens.color.text }
  }), [theme])
  const [, t] = useLanguage()
  const [{ parsePrice }] = useUtils()

  // A product's choices in one line: what was removed, then each option's choice.
  const productChoices = (product: any) => {
    const removed = (product?.ingredients ?? []).filter((ingredient: any) => !ingredient?.selected).map((ingredient: any) => `${t('NO', 'No')} ${ingredient?.name}`)
    const list = (value: any) => Array.isArray(value) ? value : Object.values(value ?? {})
    const options = getProductOptionSummaryLabels(list(product?.options).map((option: any) => ({ ...option, suboptions: list(option?.suboptions) })))
    return [...removed, ...options].filter(Boolean).join(', ')
  }

  // The product photos of the order (`confirmation.products.image`).
  const hideProductImage = !themeVisible(theme, 'confirmation.products.image')

  const professionalList = order?.products.reduce((prev: any, current: any) => {
    const found = prev.find((item: any) => item.id === current?.calendar_event?.professional?.id)
    if (found || !current?.calendar_event) {
      return prev
    }
    return [...prev, current?.calendar_event?.professional]
  }, [])

  return (
    <>
      {professionalList?.length > 0 && professionalList.map((professional: any, i: number) => (
        <ProfessionalBlock>
          <View style={styles.professional}>
            {professional?.photo ? (
              <ProfessionalPhoto
                source={{ uri: professional?.photo }}
                imageStyle={styles.photo}
              />
            ) : (
              <Icon name='person-circle-outline' size={80} color='text_muted' />
            )}
            <OText style={styles.name} weight={500} numberOfLines={1}>{professional?.name} {professional?.lastname}</OText>
          </View>
          {order?.products.filter((product: any) => product?.calendar_event?.professional?.id === professional?.id).map((product: any, i: number) => (
            <ProductItemAccordion
              key={product?.id || i}
              isFromCheckout
              hideProductOptions
              hideProductImage={hideProductImage}
              product={product}
            />
          ))}
        </ProfessionalBlock>
      ))}
      {/* The products as the bill's rows: quantity, name (and its choices), price; on the gutter. */}
      <ProductLines>
        {order?.products.filter((product: any) => !product?.calendar_event).map((product: any, i: number) => {
          const choices = productChoices(product)
          return (
            <ProductLine key={product?.id || i}>
              <OText style={styles.quantity}>{`${product?.quantity}\u00D7`}</OText>
              <View style={styles.grow}>
                <OText style={styles.productName}>{product?.name}</OText>
                {!!choices && <OText style={styles.choices} numberOfLines={4}>{choices}</OText>}
              </View>
              <OText style={styles.price}>{parsePrice(product?.total ?? product?.price)}</OText>
            </ProductLine>
          )
        })}
      </ProductLines>
    </>
  )
}
