import { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useTheme } from 'styled-components/native';

import { CartProductDescription } from './CartProductDescription'
import { AccordionSection, Accordion, ContentInfo, ProductImageIcon, EditImageButton } from './styles'
import { useLanguage, useUtils } from '@components'
import { OAlert, OButton, OText } from '@ui';
import Icon from '../shared/Icon'
import { PressableScale } from '../shared/PressableScale'
import { nativeTextStyle, themeColor, themePart, themeSpace, themeVisible } from '@/theme/helpers'
import { imageUrl, IMAGE_REQUEST } from '@/utils/imageUrl'

export const CartProductCard = (props: any) => {
  const {
    product,
    isDisabledEdit,
    isCartProduct,
    isCartPending,
    onEditProduct,
    onDeleteProduct,
    handleEditProduct,
    changeQuantity
  } = props

  const theme: any = useTheme();
  // The quantity controls are the theme's `stepper`: icon buttons of its appearance, its value text.
  const stepper = themePart(theme, 'stepper', 'base')
  const ink = (color: string) => themePart(theme, 'button', `variants.${color}.${stepper.button_appearance}.color`)
  const quantitySize = themePart(theme, 'cart', 'slots.quantity').size
  const styles = useMemo(() => {
    const card = themePart(theme, 'product_card', 'base')
    return StyleSheet.create({
      row: {
        flexDirection: 'row',
        // On the cart's sides (the page gutter): only the space between lines.
        paddingVertical: themeSpace(theme, 'sm'),
        borderBottomWidth: themePart(theme, 'divider', 'variants.item.line.borderWidth'),
        borderBottomColor: themePart(theme, 'divider', 'variants.item.line.borderColor'),
      },
      top: { flexDirection: 'row', alignItems: 'flex-start' },
      image: { position: 'relative' },
      scrim: { ...StyleSheet.absoluteFill, backgroundColor: themeColor(theme, 'overlay'), borderRadius: card.image_radius },
      editMark: { ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center' },
      grow: { flex: 1 },
      info: { flex: 1, marginLeft: themePart(theme, 'product_card', 'base.info_gap') },
      name: { ...nativeTextStyle(card.name), color: card.name_color },
      price: { ...nativeTextStyle(card.price), color: card.price_color },
      controls: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        gap: themeSpace(theme, quantitySize === 'sm' ? 'xs' : 'md'),
        backgroundColor: stepper.background,
        borderRadius: stepper.radius
      },
      controlsEnd: { alignSelf: 'stretch', justifyContent: 'space-between' },
      compactButton: { width: themePart(theme, 'button', `sizes.${quantitySize}.icon_size`) + 2 * themeSpace(theme, 'xs') },
      value: { ...nativeTextStyle(stepper.value), color: stepper.value_color },
      notAvailable: { alignItems: 'flex-end', width: '100%' },
      infoEnd: { flex: 1, marginRight: themePart(theme, 'product_card', 'base.info_gap') },
      endColumn: { alignItems: 'flex-end', gap: themeSpace(theme, 'sm') },
      endColumnFit: { width: themePart(theme, 'cart', 'base.line_image_size') },
      priceRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: themeSpace(theme, 'sm') },
      tags: { flexDirection: 'row', alignItems: 'center', gap: themeSpace(theme, 'xs') },
      tag: { width: card.tag_size, height: card.tag_size },
    })
  }, [theme, stepper, quantitySize])
  const imageAtEnd = themePart(theme, 'cart', 'base.line_image_position') === 'end'
  const removeSlot = themePart(theme, 'cart', 'slots.remove')
  const compact = stepper.compact === true
  const priceAtBottom = themePart(theme, 'cart', 'base.line_price_position') === 'bottom'
  const showDescription = theme.values.visibility['cart.products.description'] === true
  const alwaysRemove = themeVisible(theme, 'cart.products.remove_button')
  const tags = themeVisible(theme, 'cart.products.tags') ? (product?.tags ?? []).filter((tag: any) => !!tag?.image) : []
  const [, t] = useLanguage()
  const [{ parsePrice }] = useUtils()
  const canEdit = !isDisabledEdit && onEditProduct && isCartProduct && !isCartPending && product?.valid_menu
  const hasImage = !!product?.images
  const [isUpdating, setIsUpdating] = useState(false)
  const [optimisticQuantity, setOptimisticQuantity] = useState(product?.quantity)
  const otherLinesQuantity = (product?.balance ?? product?.quantity ?? 0) - (product?.quantity ?? 0)
  const isMaximumReached = !!product?.maximum_per_order && otherLinesQuantity + optimisticQuantity >= product?.maximum_per_order
  const isIncrementDisabled = isUpdating || isMaximumReached

  const handleChangeQuantity = async (newQuantity: number) => {
    if (isUpdating) return

    setIsUpdating(true)
    setOptimisticQuantity(newQuantity)

    try {
      await changeQuantity?.(product, newQuantity)
    } catch (error) {
      setOptimisticQuantity(product?.quantity)
    }
  }

  useEffect(() => {
    setOptimisticQuantity(product?.quantity)
    setIsUpdating(false)
  }, [product?.quantity])

  const imageNode = (
    <PressableScale
      onPress={canEdit ? () => handleEditProduct(product) : undefined}
      style={styles.image}
    >
      {hasImage ? (
        <>
          <ProductImageIcon
            source={{
              uri: product?.images,
              priority: FastImage.priority.normal,
            }}
            objectFit='cover'
          />
          {canEdit && (
            <>
              <View style={styles.scrim} />
              <View style={styles.editMark}>
                <Icon set='mci' name='pencil-outline' size='md' color='on_overlay' />
              </View>
            </>
          )}
        </>
      ) : (
        canEdit && (
          <EditImageButton>
            <Icon set='mci' name='pencil-outline' size='md' color='primary' />
          </EditImageButton>
        )
      )}
    </PressableScale>
  )

  const controlsNode = (
    <View style={[styles.controls, imageAtEnd && compact && styles.controlsEnd]}>
      {onDeleteProduct && isCartProduct && !isCartPending && (optimisticQuantity <= 1 || alwaysRemove) && (
        <OAlert
          title={t('DELETE_PRODUCT', 'Delete Product')}
          message={t('QUESTION_DELETE_PRODUCT', 'Are you sure that you want to delete the product?')}
          onAccept={() => isUpdating ? null : onDeleteProduct(product)}
        >
          <View pointerEvents='none' testID='cart-product-delete'>
            <OButton
              iconOnly
              size={quantitySize}
              style={compact ? styles.compactButton : undefined}
              color={removeSlot.color}
              appearance={removeSlot.appearance ?? stepper.button_appearance}
              accessibilityLabel={t('DELETE_PRODUCT', 'Delete Product')}
              icon={<Icon name='trash' color={removeSlot.appearance ? undefined : ink(removeSlot.color)} />}
            />
          </View>
        </OAlert>
      )}
      {onDeleteProduct && isCartProduct && !isCartPending && (optimisticQuantity > 1 || alwaysRemove) && (
        <OButton
          iconOnly
          size={quantitySize}
          style={compact ? styles.compactButton : undefined}
          color='primary'
          appearance={stepper.button_appearance}
          accessibilityLabel={t('DECREASE', 'Decrease')}
          icon={<Icon name='remove' color={ink('primary')} />}
          onClick={() => handleChangeQuantity(optimisticQuantity - 1)}
          disabled={isUpdating || !changeQuantity || optimisticQuantity <= 1}
        />
      )}
      {isUpdating ? (
        <ActivityIndicator size="small" color={themeColor(theme, 'primary')} />
      ) : (
        <OText style={styles.value}>
          {optimisticQuantity}
        </OText>
      )}
      {!isDisabledEdit && onEditProduct && isCartProduct && !isCartPending && product?.valid_menu && (
        <OButton
          iconOnly
          size={quantitySize}
          style={compact ? styles.compactButton : undefined}
          color='primary'
          appearance={stepper.button_appearance}
          testID='cart-product-increase'
          accessibilityLabel={t('INCREASE', 'Increase')}
          icon={<Icon name='add' color={ink('primary')} />}
          onClick={() => handleChangeQuantity(optimisticQuantity + 1)}
          disabled={isIncrementDisabled}
        />
      )}
    </View>
  )

  const priceNode = (
    <View style={styles.priceRow}>
      <OText style={styles.price} numberOfLines={1} ellipsizeMode='tail'>{parsePrice(product.total || product.price)}</OText>
      {tags.length > 0 && (
        <View testID='cart-product-tags' style={styles.tags}>
          {tags.map((tag: any) => (
            <FastImage
              key={tag.id}
              style={styles.tag}
              source={{ uri: imageUrl(tag.image, { height: IMAGE_REQUEST.thumbnail }), priority: FastImage.priority.normal }}
              objectFit='contain'
            />
          ))}
        </View>
      )}
    </View>
  )

  return (
    <View style={styles.row}>
      <AccordionSection>
        <Accordion isValid={product?.valid ?? true}>
          <View style={styles.top}>
            <ContentInfo>
              {!imageAtEnd && imageNode}
              <View style={styles.grow}>
                <View style={imageAtEnd ? styles.infoEnd : styles.info}>
                  <OText style={styles.name} numberOfLines={2} ellipsizeMode='tail'>{product.name}</OText>
                  {!priceAtBottom && priceNode}
                  {showDescription && (
                    <CartProductDescription
                      product={product}
                      onViewMore={canEdit ? () => handleEditProduct(product) : undefined}
                    />
                  )}
                  {priceAtBottom && priceNode}
                </View>
                {!imageAtEnd && controlsNode}
              </View>
              {imageAtEnd && (
                <View style={[styles.endColumn, compact && styles.endColumnFit]}>
                  {imageNode}
                  {controlsNode}
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
      </AccordionSection>
    </View>
  );
};
