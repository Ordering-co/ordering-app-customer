import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from 'styled-components/native';
import FastImage from 'react-native-fast-image'

import { SingleProductCardParams } from '../../types';
import { QuantityContainer, AdaptedCardContainer, ContentContainer, BottomRow, PriceFavoriteContainer, ProductImageContainer, ProductImageStyled, TagsContainer, cardBoxStyle, productImageShadowStyle } from './styles';
import { CustomItem } from './CustomItem';
import { Ribbon } from './Ribbon';
import { areSingleProductCardPropsEqual } from './areSingleProductCardPropsEqual';
import { nativeTextStyle, themeImage, themePart, themeSpace, themeVisible } from '@/theme/helpers';

import {
  useLanguage,
  useConfig,
  useUtils,
  useSession,
  ToastType,
  useToastActions,
  SingleProductCard as SingleProductCardController,
  useOrderState
} from '@components';

import {
  CardAnimation,
  OText,
  LottieAnimation
} from '@ui'
import { IMAGE_REQUEST, imageUrl } from '@/utils/imageUrl'

const descriptionLength = 50

const SingleProductCardUI = React.memo((props: SingleProductCardParams) => {
  const {
    product,
    isSoldOut,
    onProductClick,
    productAddedToCartLength,
    style,
    handleFavoriteProduct,
    navigation,
    isPreviously,
    isFeatured,
    useCustomFunctionality,
    onCustomClick,
    customText,
  } = props;

  const theme: any = useTheme();
  const showImage = themeVisible(theme, 'product.image');
  const showDummyImage = themeVisible(theme, 'product.dummy_image');
  const showDescription = themeVisible(theme, 'product.description');
  const showFavorite = themeVisible(theme, 'product.favorite');
  const showTags = themeVisible(theme, 'product.tags');
  const showRibbon = themeVisible(theme, 'product.ribbon');
  const showCartQuantity = themeVisible(theme, 'product.cart_quantity');

  // `components.product_card` (texts, tag size, sold-out state), its quantity
  // badge (`badge` primary, count shape), the favorite and the link.
  const styles = useMemo(() => {
    const card = themePart(theme, 'product_card', 'base');
    const badgeSize = themePart(theme, 'badge', `sizes.${themePart(theme, 'product_card', 'slots.quantity_badge.size')}`);
    const badge = themePart(theme, 'badge', `variants.${themePart(theme, 'product_card', 'slots.quantity_badge.variant')}`);
    const link = themePart(theme, 'link', 'base');
    return StyleSheet.create({
      // The box carries the card's radius too: its background and shadow have the rounded corners.
      card: { ...cardBoxStyle(theme), borderRadius: card.radius, marginBottom: themeSpace(theme, 'lg') },
      imageShadow: productImageShadowStyle(theme),
      soldOut: { opacity: themePart(theme, 'product_card', 'variants.default.states.sold_out.opacity') },
      name: { ...nativeTextStyle(card.name), color: card.name_color },
      description: { ...nativeTextStyle(card.description), color: card.description_color },
      price: { ...nativeTextStyle(card.price), color: card.price_color },
      link: { ...nativeTextStyle(themePart(theme, 'link', 'sizes.md.text')), color: link.color, ...(link.underline === 'always' && { textDecorationLine: 'underline' as const }) },
      tag: { width: card.tag_size, height: card.tag_size },
      tags: { marginLeft: themeSpace(theme, 'sm') },
      badge: {
        minWidth: badgeSize.height,
        height: badgeSize.height,
        paddingHorizontal: themeSpace(theme, 'xs'),
        borderRadius: themePart(theme, 'badge', 'shapes.count.radius'),
        backgroundColor: badge.background,
        justifyContent: 'center',
        alignItems: 'center',
      },
      badgeText: { ...nativeTextStyle(themePart(theme, 'badge', 'base.text')), color: badge.color },
      ribbon: { position: 'absolute', zIndex: 1, top: -themeSpace(theme, 'xs'), right: -themeSpace(theme, 'xs') },
    });
  }, [theme]);
  const favorite = themePart(theme, 'favorite', 'base');

  const [, t] = useLanguage();
  const [stateConfig] = useConfig();
  const [{ auth }] = useSession();
  const [{ parsePrice, parseDate }] = useUtils();
  const orderState = useOrderState();
  // The toast's actions only: every mounted card rendered again each time a toast showed or hid.
  const { showToast } = useToastActions();

  const editMode = typeof product?.code !== 'undefined';
  const removeToBalance = editMode ? product?.quantity : 0;
  // The product's quantity across the carts, in one pass (no copy of every cart's products).
  let productBalance = 0;
  Object.values(orderState?.carts || {}).forEach((_cart: any) => {
    _cart?.products?.forEach((_product: any) => {
      if (_product.id === product?.id) productBalance += _product.quantity;
    });
  });
  const totalBalance = (productBalance || 0) - removeToBalance;
  const maxCartProductConfig = (stateConfig.configs.max_product_amount ? parseInt(stateConfig.configs.max_product_amount) : 100) - totalBalance;
  let maxCartProductInventory = (product?.inventoried ? product?.quantity : undefined) - totalBalance;
  maxCartProductInventory = !isNaN(maxCartProductInventory) ? maxCartProductInventory : maxCartProductConfig;
  const maxProductQuantity = Math.min(maxCartProductConfig, maxCartProductInventory);
  const isActuallySoldOut = isSoldOut || maxProductQuantity <= 0;

  const handleChangeFavorite = () => {
    if (auth) {
      handleFavoriteProduct && handleFavoriteProduct(!product?.favorite);
    } else {
      navigation && navigation.navigate('Login');
    }
  };

  const handleClickproduct = () => {
    if (productAddedToCartLength && product?.maximum_per_order && productAddedToCartLength >= product?.maximum_per_order) {
      showToast(ToastType.Error, t('PRODUCT_ON_MAXIMUM_ORDER', 'The product is on maximum order'));
      return;
    }
    if (!useCustomFunctionality && onProductClick) {
      onProductClick(product);
    } else if (useCustomFunctionality && onCustomClick) {
      onCustomClick();
    }
  };

  const handleOrderButtonClick = () => {
    if (productAddedToCartLength && product?.maximum_per_order && productAddedToCartLength >= product?.maximum_per_order) {
      showToast(ToastType.Error, t('PRODUCT_ON_MAXIMUM_ORDER', 'The product is on maximum order'));
      return;
    }
    if (!useCustomFunctionality && onProductClick) {
      onProductClick(product, true);
    } else if (useCustomFunctionality && onCustomClick) {
      onCustomClick();
    }
  }

  const isDescriptionLong = useMemo(() => product?.description?.length > descriptionLength, [product?.description]);
  const shortProductDescription = useMemo(() => isDescriptionLong ? `${product?.description?.substring(0, descriptionLength)}...` : product?.description, [product?.description, isDescriptionLong]);

  if (useCustomFunctionality && customText) {
    return (
      <CardAnimation onClick={onCustomClick} style={[style, styles.card]}>
        <AdaptedCardContainer style={{ justifyContent: 'center', alignItems: 'center', minHeight: 80 }}>
          <OText style={styles.name}>{customText}</OText>
        </AdaptedCardContainer>
      </CardAnimation>
    );
  }

  if (isPreviously) {
    return (
      <CustomItem
        isPreviously
        name={product?.name}
        image={product?.images ? {
          uri: imageUrl(product?.images, { width: 160, height: 160 }),
          priority: FastImage.priority.normal,
        } : undefined}
        price={parsePrice(product?.price)}
        lastOrderedDate={parseDate(product?.last_ordered_date, { outputFormat: 'MMM DD, YYYY' })}
        ribbon={showRibbon ? product?.ribbon : null}
        onClick={handleClickproduct}
      />
    )
  }

  if (isFeatured) {
    return (
      <CustomItem
        isFeatured
        name={product?.name}
        image={product?.images ? {
          uri: imageUrl(product?.images, { width: 160, height: 160 }),
          priority: FastImage.priority.normal,
        } : undefined}
        price={parsePrice(product?.price)}
        ribbon={showRibbon ? product?.ribbon : null}
        onClick={handleClickproduct}
      />
    )
  }

  const imageSize = themePart(theme, 'product_card', 'base.image_size');
  const productImage = product?.images
    ? { uri: imageUrl(product?.images, { width: imageSize, height: imageSize }), priority: FastImage.priority.normal }
    : showDummyImage ? themeImage(theme, 'placeholder.product') : undefined;
  const hasTags = showTags && product?.tags?.some((tag: any) => tag?.image);

  return (
    <CardAnimation
      onClick={handleClickproduct}
      style={[style, styles.card, isActuallySoldOut && styles.soldOut]}
    >
      <AdaptedCardContainer>
        {showCartQuantity && productAddedToCartLength > 0 && (
          <QuantityContainer style={styles.badge}>
            <OText style={styles.badgeText}>
              {productAddedToCartLength.toString()}
            </OText>
          </QuantityContainer>
        )}
        <ContentContainer>
          <OText style={styles.name} numberOfLines={2}>{product?.name}</OText>

          {showDescription && !!product?.description && (
            <View>
              <OText style={styles.description} numberOfLines={themePart(theme, 'product_card', 'base.description_lines')} ellipsizeMode="tail">
                {shortProductDescription}
              </OText>
              {isDescriptionLong && (
                <Pressable
                  style={{ alignSelf: 'flex-start' }}
                  hitSlop={themeSpace(theme, 'md')}
                  onPress={handleClickproduct}
                >
                  <OText style={styles.link}>{t('VIEW_MORE', 'View more')}</OText>
                </Pressable>
              )}
            </View>
          )}

          <BottomRow>
            <PriceFavoriteContainer>
              {product?.price != null && (
                <OText style={styles.price}>{parsePrice(product?.price)}</OText>
              )}
              {showFavorite && (
                <LottieAnimation
                  type='favorite'
                  onClick={handleChangeFavorite}
                  initialValue={product?.favorite ? 0.5 : 0}
                  toValue={product?.favorite ? 0 : 0.5}
                  disableAnimation={!auth}
                  iconProps={{ color: favorite.color, size: favorite.icon_size }}
                  isActive={product?.favorite}
                />
              )}
            </PriceFavoriteContainer>
            {hasTags && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                horizontal
                style={styles.tags}
                contentContainerStyle={{ flexGrow: 1 }}
              >
                {product?.tags.map((tag: any, i: any) => (
                  tag?.image ? (
                    <TagsContainer key={i}>
                      <FastImage
                        style={styles.tag}
                        source={{
                          uri: imageUrl(tag.image, { height: IMAGE_REQUEST.thumbnail }),
                          priority: FastImage.priority.normal,
                        }}
                        objectFit='cover'
                      />
                    </TagsContainer>
                  ) : null
                ))}
              </ScrollView>
            )}
          </BottomRow>
        </ContentContainer>

        {showImage && !!productImage && (
          <View style={styles.imageShadow}>
            {showRibbon && <Ribbon ribbon={product?.ribbon} style={styles.ribbon} />}
            <ProductImageContainer>
              <ProductImageStyled
                source={productImage}
                objectFit='cover'
              />
            </ProductImageContainer>
          </View>
        )}
      </AdaptedCardContainer>
    </CardAnimation>
  )
}, areSingleProductCardPropsEqual);

export const SingleProductCard = (props: SingleProductCardParams) => {
  const singleProductCardProps = {
    ...props,
    UIComponent: SingleProductCardUI
  }
  return <SingleProductCardController {...singleProductCardProps} />
}
