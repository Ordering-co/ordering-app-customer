import React, { useEffect, useMemo, useState } from 'react'
import { View, Animated, Pressable, StyleSheet } from 'react-native'
import { useTheme } from 'styled-components/native';
import FastImage from 'react-native-fast-image'

import { CartProductCard } from './CartProductCard'
import { getOptionSuboptions, getProductOptionSummaryLabels } from './getOptionSuboptions'

import { ProductItemAccordionParams } from '../../types'
import {
  Accordion,
  AccordionSection,
  ProductInfo,
  ProductQuantity,
  ContentInfo,
  ProductImage,
  AccordionContent,
  ProductOptionsList,
  ProductOption,
  ProductSubOption,
  ProductComment
} from './styles'
import { ProductItemAccordion as ProductItemAccordionController, useUtils, useLanguage, useOrder } from '@components'

import { OIcon, OText, OAlert, OModal, ServiceForm } from '@ui'
import Icon from '../shared/Icon'
import OSelect from '../shared/OSelect'
import { PressableScale } from '../shared/PressableScale'
import { themeColor, themeControlHeight, themeIconSize, themeImage, themeOpacity, themePart, themeRadius, themeSpace, themeVisible } from '@/theme/helpers'
import { IMAGE_REQUEST, imageUrl } from '@/utils/imageUrl'

/** An icon action inside a dense row: the icon at `md`, a touch target of `size.md`. */
const IconTap = ({ onPress, children, accessibilityLabel }: { onPress: () => void, children: React.ReactNode, accessibilityLabel?: string }) => {
  const theme: any = useTheme()
  const slop = (themeControlHeight(theme, 'md') - themeIconSize(theme, 'md')) / 2
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole='button'
      accessibilityLabel={accessibilityLabel}
      hitSlop={{ top: slop, bottom: slop, left: slop, right: slop }}
      style={({ pressed }) => [{ marginRight: themeSpace(theme, 'xs') }, pressed && { opacity: themeOpacity(theme, 'pressed') }]}
    >
      {children}
    </Pressable>
  )
}

const ProductItemAccordionUI = (props: ProductItemAccordionParams) => {

  const {
    isDisabledEdit,
    isCartPending,
    isCartProduct,
    product,
    changeQuantity,
    getProductMax,
    onDeleteProduct,
    onEditProduct,
    isFromCheckout,
    productInfo,
    hideProductImage,
    hidePriceDropdown,
    toppingsRemoved,
    isCartProductView
  } = props

  const theme: any = useTheme();

  const hideProductDummyLogo = !themeVisible(theme, 'product.dummy_image')
  const productPlaceholder = themeImage(theme, 'placeholder.product')

  // The quantity picker is a small field on `surface_alt`; images take the product card's radius.
  const { picker, pickerSlop, images, styles } = useMemo(() => {
    const slop = (themeControlHeight(theme, 'md') - themeControlHeight(theme, 'sm')) / 2
    return {
      // The quantity trigger: a compact field on `surface_alt` (the select opens a sheet).
      picker: StyleSheet.create({
        trigger: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: themeSpace(theme, 'xxs'),
          minHeight: themeControlHeight(theme, 'sm'),
          paddingHorizontal: themeSpace(theme, 'xs'),
          borderRadius: themeRadius(theme, 'sm'),
          backgroundColor: themeColor(theme, 'surface_alt'),
        },
        pressed: { opacity: themeOpacity(theme, 'pressed') },
        disabled: { opacity: themeOpacity(theme, 'disabled') },
      }),
      pickerSlop: { top: slop, bottom: slop, left: 0, right: 0 },
      // Image styles stay plain objects: FastImage and OIcon take their own style types.
      images: {
        productImage: { borderRadius: themePart(theme, 'product_card', 'base.image_radius'), width: 48, height: 48 },
        // An order's product (order details, checkout lines): `product_card.base.order_image_size`.
        productImageLarge: { borderRadius: themePart(theme, 'product_card', 'base.image_radius'), width: themePart(theme, 'product_card', 'base.order_image_size'), height: themePart(theme, 'product_card', 'base.order_image_size') },
      },
      styles: StyleSheet.create({
        notAvailable: { alignItems: 'flex-end', width: '100%' },
        event: { flex: 1, marginLeft: themeSpace(theme, 'sm'), flexDirection: 'column' },
        // The price column keeps a fixed share of the row.
        priceColumn: { display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'flex-end', maxWidth: 100 },
        // The edit row is one icon tall.
        editRow: { display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', height: themeIconSize(theme, 'md') },
      })
    }
  }, [theme])

  const [, t] = useLanguage()
  const [orderState] = useOrder()
  const [{ parsePrice, parseDate }] = useUtils()

  const [isActive, setActiveState] = useState(false)
  const [isServiceOpen, setIsServiceOpen] = useState(false)
  const [productQuantityState, setProductQuantityState] = useState<any>(product.quantity.toString())

  const handleEditProduct = (curProduct: any) => {
    if (!curProduct?.calendar_event) {
      onEditProduct && onEditProduct(curProduct)
      return
    }
    setIsServiceOpen(true)
  }

  const handleChangeQuantity = (value: string) => {
    if (!orderState.loading) {
      setProductQuantityState(value)
      if (parseInt(value) === 0) {
        onDeleteProduct && onDeleteProduct(product)
      } else {
        changeQuantity && changeQuantity(product, parseInt(value))
      }
    }
  }

  const getFormattedSubOptionName = ({ quantity, name, position, price }: { quantity: number, name: string, position: string, price: number }) => {
    const pos = position ? `(${position})` : ''
    return `${quantity} x ${name} ${pos} +${price}`
  }

  const productOptions = getProductMax && [...Array(getProductMax(product) + 1),].map((_: any, opt: number) => {
    return {
      label: opt === 0 ? t('REMOVE', 'Remove') : opt.toString(),
      value: opt.toString()
    }
  })

  // Before the cart view's return: a hook runs on every render.
  useEffect(() => {
    if (product.quantity.toString() === productQuantityState || productQuantityState) {
      setProductQuantityState(null)
    }
  }, [product.quantity])

  if (isCartProductView) {
    return (
      <CartProductCard
        product={product}
        onEditProduct={onEditProduct}
        onDeleteProduct={onDeleteProduct}
        isDisabledEdit={isDisabledEdit}
        isCartProduct={isCartProduct}
        isCartPending={isCartPending}
        handleEditProduct={handleEditProduct}
        changeQuantity={changeQuantity}
      />
    )
  }

  return (
    <>
      <AccordionSection>
        <PressableScale
          testID='product-accordion-toggle'
          onPress={hidePriceDropdown ||
            (!product?.valid_menu && isCartProduct) ||
            !(productInfo.ingredients.length > 0 || productInfo.options.length > 0 || !!product.comment)
            ? undefined : () => setActiveState(!isActive)}
        >
        <Accordion isValid={product?.valid ?? true}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <ContentInfo>
              {(product?.images || (!hideProductDummyLogo && productPlaceholder)) && !hideProductImage && (
                <ProductImage>
                  {isFromCheckout ? (
                    product?.images ? (
                      <FastImage
                        style={images.productImageLarge}
                        source={{
                          uri: imageUrl(product?.images, { height: IMAGE_REQUEST.thumbnail }),
                          priority: FastImage.priority.normal,
                        }}
                        objectFit='cover'
                      />
                    ) : (
                      <OIcon
                        src={productPlaceholder}
                        style={images.productImageLarge}
                      />
                    )
                  ) : (
                    product?.images ? (
                      <FastImage
                        style={images.productImage}
                        source={{
                          uri: imageUrl(product?.images, { height: IMAGE_REQUEST.thumbnail }),
                          priority: FastImage.priority.normal,
                        }}
                        objectFit='cover'
                      />
                    ) : (
                      <OIcon
                        src={productPlaceholder}
                        style={images.productImage}
                      />
                    )
                  )}
                </ProductImage>
              )}
              {!!product?.calendar_event ? (
                <View style={styles.event}>
                  <View>
                    <OText preset='body_sm' numberOfLines={1}>{product?.name}</OText>
                  </View>
                  <OText preset='caption' color='text_muted' mTop='xxs'>
                    {parseDate(product?.calendar_event?.start, { outputFormat: 'hh:mm a' })} - {parseDate(product?.calendar_event?.end, { outputFormat: 'hh:mm a' })}
                  </OText>
                </View>
              ) : (
                <>
                  {!isDisabledEdit && isCartProduct && !isCartPending && getProductMax && (
                    <ProductInfo>
                      <OSelect
                        title={t('QUANTITY', 'Quantity')}
                        options={productOptions || []}
                        value={productQuantityState ?? product.quantity.toString()}
                        onSelect={(value) => handleChangeQuantity(value)}
                        disabled={orderState.loading}
                        testID='product-quantity-select'
                        renderTrigger={({ open, selected, disabled }) => (
                          <Pressable
                            onPress={open}
                            disabled={disabled}
                            hitSlop={pickerSlop}
                            accessibilityRole='button'
                            accessibilityLabel={t('QUANTITY', 'Quantity')}
                            style={({ pressed }) => [picker.trigger, pressed && picker.pressed, disabled && picker.disabled]}
                          >
                            <OText preset='body_sm'>{selected?.label ?? product.quantity}</OText>
                            <Icon name='chevron-down' size='sm' />
                          </Pressable>
                        )}
                      />
                    </ProductInfo>
                  )}
                  {isFromCheckout && (
                    <ProductQuantity>
                      <OText preset='body_sm'>
                        {product?.quantity}
                      </OText>
                    </ProductQuantity>
                  )}
                  <View style={{ flex: 1 }}>
                    <OText preset='body_sm' weight={500} mLeft='sm'>{product.name}</OText>
                    {hidePriceDropdown && (
                      <OText preset='body_sm' numberOfLines={4} mLeft='sm'>
                        {[
                          ...(toppingsRemoved?.removed ?? [])?.map((topping: any) => `${t('NO', 'No')} ${topping?.name}`),
                          ...(productInfo?.ingredients ?? [])?.filter((ingredient: any) => !ingredient.selected).map((ingredient: any) => ingredient.name),
                          ...getProductOptionSummaryLabels(productInfo?.options)
                        ].join(', ')}
                      </OText>
                    )}
                  </View>
                </>
              )}
              {!hidePriceDropdown && (
                <View style={styles.priceColumn}>
                  <View style={{ flexDirection: 'row' }}>
                    <OText preset='body_sm'>{parsePrice(product.total || product.price)}</OText>
                    {(productInfo.ingredients.length > 0 || productInfo.options.length > 0 || !!product.comment) && (
                      <Icon name='chevron-down' size='sm' />
                    )}
                  </View>
                  <View style={styles.editRow}>
                    {!isDisabledEdit && onEditProduct && isCartProduct && !isCartPending && product?.valid_menu && (
                      <IconTap onPress={() => handleEditProduct(product)} accessibilityLabel={t('EDIT', 'Edit')}>
                        <Icon set='mci' name='pencil-outline' color='text_muted' />
                      </IconTap>
                    )}
                    {onDeleteProduct && isCartProduct && !isCartPending && (
                      <OAlert
                        title={t('DELETE_PRODUCT', 'Delete Product')}
                        message={t('QUESTION_DELETE_PRODUCT', 'Are you sure that you want to delete the product?')}
                        onAccept={() => onDeleteProduct(product)}
                      >
                        <Icon name='trash' color='danger' />
                      </OAlert>
                    )}
                  </View>
                </View>
              )}
            </ContentInfo>
          </View>
          {((isCartProduct && !isCartPending && product?.valid_menu && !product?.valid_quantity) ||
            (!product?.valid_menu && isCartProduct && !isCartPending)) && (
              <View style={styles.notAvailable}>
                <OText preset='body' color='danger_text' align='right' mTop='xs'>
                  {t('NOT_AVAILABLE', 'Not available')}
                </OText>
              </View>
            )}
        </Accordion>
        </PressableScale>

        <View style={{ display: isActive ? 'flex' : 'none', paddingStart: isFromCheckout ? 100 : 40, marginTop: isFromCheckout ? -80 : -30 }}>
          <Animated.View>
            <AccordionContent>
              {productInfo.ingredients.length > 0 && productInfo.ingredients.some((ingredient: any) => !ingredient.selected) && (
                <ProductOptionsList>
                  <OText preset='caption' color='text_muted'>{t('INGREDIENTS', 'Ingredients')}</OText>
                  {productInfo.ingredients.map((ingredient: any, i: number) => !ingredient.selected && (
                    <OText preset='caption' color='text_muted' key={ingredient.id + i} mLeft='sm'>{t('NO', 'No')} {ingredient.name}</OText>
                  ))}
                </ProductOptionsList>
              )}
              {productInfo.options.length > 0 && (
                <ProductOptionsList>
                  {productInfo.options.map((option: any) => (
                    <ProductOption key={option.id}>
                      <OText preset='caption' color='text_muted'>{option.name}</OText>
                      {getOptionSuboptions(option).map((suboption: any) => (
                        <ProductSubOption key={suboption.id}>
                          <OText preset='caption' color='text_muted'>
                            {getFormattedSubOptionName({
                              quantity: suboption.quantity,
                              name: suboption.name,
                              position: (suboption.position !== 'whole') ? t(suboption.position.toUpperCase(), suboption.position) : '',
                              price: parsePrice(suboption.price)
                            })}
                          </OText>
                        </ProductSubOption>
                      ))}
                    </ProductOption>
                  ))}
                </ProductOptionsList>
              )}
              {!!product.comment && (
                <ProductComment>
                  <OText preset='caption' color='text_muted'>{t('SPECIAL_COMMENT', 'Special Comment')}</OText>
                  <OText preset='caption' color='text_muted'>{product.comment}</OText>
                </ProductComment>
              )}
            </AccordionContent>
          </Animated.View>
        </View>
      </AccordionSection>
      <OModal
        open={isServiceOpen}
        onClose={() => setIsServiceOpen(false)}
      >
        <ServiceForm
          isCartProduct
          isService
          businessId={product?.business_id}
          categoryId={product?.category_id}
          productId={product?.id}
          productCart={product}
          onSave={() => setIsServiceOpen(false)}
          onClose={() => setIsServiceOpen(false)}
          professionalSelected={product?.calendar_event?.professional}
        />
      </OModal>
    </>
  )
}

export const ProductItemAccordion = (props: any) => {
  const productItemAccordionProps = {
    ...props,
    UIComponent: ProductItemAccordionUI
  }

  return (
    <ProductItemAccordionController {...productItemAccordionProps} />
  )
}
