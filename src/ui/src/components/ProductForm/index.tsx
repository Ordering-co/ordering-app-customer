import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Keyboard,
  TextInput,
  StyleSheet,
  Dimensions,
  I18nManager,
  ScrollView,
  Animated,
} from 'react-native';
import { Placeholder, PlaceholderLine, Fade } from '@/ui/src/components/shared/Skeleton';
import uuid from 'react-native-uuid';
import { useTheme } from 'styled-components/native';
import FastImage from 'react-native-fast-image';
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { nativeShadowStyle, nativeTextStyle, themeColor, themeGutter, themeIconSize, themePart, themeSpace, themeVisible, themeControlHeight, themeBottomSpace } from '@/theme/helpers';
import { usePageSections } from '@/theme/sections';

import { MAX_AUTO_SCROLL_PRODUCT_SUBOPTIONS } from '../../config/constants';

import {
  ProductTitle,
  ProductDescription,
  ProductEditions,
  SectionTitle,
  WrapperIngredients,
  WrapperSubOption,
  ProductComment,
  ProductActions,
  ExtraOptionWrap,
  ProductSummary,
  BackgroundImage,
  Line,
  WrapperHeaderActions,
  HeaderBackground,
  Divider,
  QuantityControl
} from './styles';

import {
  ProductForm as ProductOptions,
  useLanguage,
  useOrder,
  useUtils,
  ToastType,
  useToast,
  useConfig,
  useEvent,
  useSession,
  useSelectedStudent
} from '@components';

import { isGuestCheckoutAllowed } from '../../../../utils/guestCheckout'
import { ActionButton } from './ActionButton'
import NavBar from '../NavBar'
import { OptionalBadge } from '../ProductOption/OptionalBadge'
import { ExtraOptions } from './ExtraOptions'
import { Icon, OButton } from '../shared'

import {
  OAlert, OIcon, OInput, OText,
  ProductOptionSubOption,
  NotFoundSource,
  ProductIngredient,
  ProductOption,
  LottieAnimation,
  StudentOnboardingPopup
} from '@ui'
import { headerBackgroundProgress, headerTitleProgress, contentTopWithoutImage } from './headerReveal'
import { returnTo } from '@/navigators/appNavigation'
import { imageUrl } from '@/utils/imageUrl'

const HEIGHT = Dimensions.get('screen').height
// Top padding so the product summary clears the sticky header when there is no hero image.
const STICKY_HEADER_CLEARANCE = 56
// The sticky header's height: a group scrolled into view stops under it, with room (`space.lg`).
const STICKY_HEADER_HEIGHT = 70

export const ProductOptionsUI = (props: any) => {
  const {
    navigation,
    editMode,
    isSoldOut,
    productCart,
    increment,
    decrement,
    handleChangeProductCartQuantity,
    showOption,
    maxProductQuantity,
    errors,
    handleSave,
    handleChangeIngredientState,
    handleChangeSuboptionState,
    pizzaState,
    handleChangeCommentState,
    productObject,
    actionStatus,
    handleCreateGuestUser,
    callbackAfterUpdateCart,
    handleFavoriteProduct,
    productAddedToCartLength = 0
  } = props;
  const [, { showToast }] = useToast()
  const [events] = useEvent()
  const commentRef = useRef<TextInput>(null)

  const theme: any = useTheme();
  const insets = useSafeAreaInsets()
  const modal = theme.native.components.product_modal
  const option = theme.native.components.product_option.base
  const stepper = theme.native.components.stepper
  const quantitySlot = modal.slots.quantity
  const closeSlot = modal.slots.close
  const bottomBar = theme.native.components.bottom_bar.base

  const styles = useMemo(() => StyleSheet.create({
    comment: {
      height: modal.base.comment_height,
      alignItems: 'flex-start',
      ...(modal.base.comment_border?.borderWidth > 0 ? modal.base.comment_border : {}),
    },
    headerTitle: {
      flex: 1,
      paddingHorizontal: themeSpace(theme, 'md'),
      alignItems: 'center'
    },
    name: {
      ...nativeTextStyle(modal.base.name),
      color: modal.base.name_color,
      marginBottom: themeSpace(theme, 'sm')
    },
    meta: { ...nativeTextStyle(modal.base.meta), color: modal.base.meta_color },
    description: { ...nativeTextStyle(modal.base.description), color: modal.base.description_color },
    price: { ...nativeTextStyle(modal.base.price), color: modal.base.price_color },
    offerPrice: {
      ...nativeTextStyle(modal.base.meta),
      color: modal.base.offer_price_color,
      textDecorationLine: 'line-through',
      marginHorizontal: themeSpace(theme, 'xs')
    },
    limitNote: { ...nativeTextStyle(modal.base.meta), color: modal.base.meta_color, textAlign: 'center', marginBottom: themeSpace(theme, 'xs') },
    priceRow: { flexDirection: 'row', marginBottom: themeSpace(theme, 'sm') },
    sectionTitle: { ...nativeTextStyle(option.title), color: option.title_color },
    actionsReversed: { flexDirection: 'row-reverse' },
    nameRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: themeSpace(theme, 'sm') },
    nameInRow: { flex: 1 },
    commentTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: themeSpace(theme, 'sm') },
    tags: { paddingBottom: themeSpace(theme, 'lg') },
    productTagWrapper: {
      flexDirection: 'row',
      alignItems: 'center'
    },
    productTagImageStyle: {
      width: modal.base.tag_size,
      height: modal.base.tag_size,
      borderRadius: modal.base.tag_radius,
      resizeMode: 'cover',
    },
    // The tag's shadow on a box with the header's background, the image inside it.
    productTagBox: {
      width: modal.base.tag_size,
      height: modal.base.tag_size,
      borderRadius: modal.base.tag_radius,
      backgroundColor: modal.base.header_background,
      ...nativeShadowStyle(themePart(theme, 'product_modal', 'base.tag_shadow'))
    },
    productTagNameStyle: {
      paddingHorizontal: themeSpace(theme, 'xs'),
      marginRight: themeSpace(theme, 'xs')
    },
    gutter: { paddingHorizontal: themeGutter(theme) },
    optionBlock: { marginBottom: themeSpace(theme, 'lg') },
    // An option that depends on another one's choice (`respect_to`): `product_option.base.nesting`
    // draws it inset (`indent`), inset with a line at its start (`line`, `nesting_line`) or flat (`none`).
    nestedOption: option.nesting === 'none' ? {} : {
      marginStart: themeGutter(theme),
      ...(option.nesting === 'line' && option.nesting_line.borderWidth
        ? { borderStartWidth: option.nesting_line.borderWidth, borderStartColor: option.nesting_line.borderColor }
        : {})
    },
    skeletonGroup: { marginBottom: themeSpace(theme, 'lg') },
    skeletonTitle: { flex: 1, marginTop: themeSpace(theme, 'sm') },
    skeletonLine: { marginBottom: themeSpace(theme, 'lg') },
    quantityInput: {
      ...nativeTextStyle(stepper.base.value),
      color: stepper.base.value_color,
      textAlign: 'center',
      // Room for three digits: the control size `xl`.
      minWidth: stepper.base.compact ? themeControlHeight(theme, 'sm') : themeControlHeight(theme, 'xl'),
      height: stepper.sizes[quantitySlot.size].height,
      ...(stepper.base.compact ? { paddingVertical: 0 } : {}),
      marginHorizontal: stepper.base.compact ? 0 : themeSpace(theme, 'sm'),
    },
    quantityCompact: { paddingHorizontal: themeSpace(theme, 'xs') },
    quantityButtonCompact: { width: themeIconSize(theme, 'lg') + 2 * themeSpace(theme, 'xs') },
    actionContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: themeSpace(theme, 'sm')
    },
    actionContainerColumn: {
      justifyContent: 'center',
      marginTop: 0,
      marginBottom: themeSpace(theme, 'md')
    },
    actions: {
      ...nativeShadowStyle(bottomBar.shadow),
      paddingBottom: bottomBar.padding + themeBottomSpace(theme, insets.bottom)
    },
  }), [theme, insets.bottom, modal, option, stepper, quantitySlot, bottomBar]);

  const [{ parsePrice }] = useUtils();
  const [, t] = useLanguage();
  const [orderState, { removeProduct }] = useOrder();
  const [{ configs }] = useConfig()
  const [{ auth }] = useSession()
  const { studentId: selectedStudent } = useSelectedStudent(props.business?.slug || props.businessSlug)
  const [studentPickerOpen, setStudentPickerOpen] = useState(false)
  const isSchoolProduct = configs?.school_module_enabled?.value === '1' && props.business?.vertical === 'school'
  const needsStudent = isSchoolProduct && auth && !selectedStudent
  // A closed business with no preorder time chosen yet: the product shows, read-only, with a notice and (with preorder on) a way to schedule it.
  const closedWithoutMoment = props.business?.open === false && !orderState.options?.moment

  const { product, loading, error } = productObject;
  // The `product` page is not movable (scroll anchors depend on the order): only its hideable sections are read.
  const { isVisible: sectionVisible } = usePageSections('product')
  // The hero shows when the product has a photo and the theme shows it (`product.image`, section `hero`).
  const showHero = !!product?.images && themeVisible(theme, 'product.image') && sectionVisible('hero')
  const showOptionTabs = themeVisible(theme, 'product.navigation') && sectionVisible('option_tabs')
  const showComment = sectionVisible('comment')
  const showDescription = themeVisible(theme, 'product.description') && themeVisible(theme, 'product.details.description')
  const showOptionalBadge = themeVisible(theme, 'product.options.optional_badge')
  const showHeaderBar = themeVisible(theme, 'product.header')
  const favoriteBesideName = modal.base.favorite_position === 'title'
  const stepperInk = stepper.base.icon_color || 'primary'
  const showCalories = themeVisible(theme, 'product.calories')
  const showSku = themeVisible(theme, 'product.sku')
  const showPersons = themeVisible(theme, 'product.persons')
  const [actionsHeight, setActionsHeight] = useState(0)
  const [detailsReady, setDetailsReady] = useState(false)

  useEffect(() => {
    setDetailsReady(false)
    // Once the opening transition has left the JS thread idle (React Native
    // 0.87 removed InteractionManager.runAfterInteractions).
    const task = requestIdleCallback(() => setDetailsReady(true))
    return () => cancelIdleCallback(task)
  }, [product?.id])

  const [selOpt, setSelectedOpt] = useState(-1);
  const [isHaveWeight, setIsHaveWeight] = useState(false)
  const [pricePerWeightUnit, setPricePerWeightUnit] = useState<any>(null)
  const scrollViewRef = useRef<any>(null);
  const scrollAttemptRef = useRef<any>(null)
  const [optionLayout, setOptionLayout] = useState<any>({})
  const layoutsRef = useRef<any>({})
  const [headerRefHeight, setHeaderRefHeight] = useState(0)
  const [summaryRefHeight, setSummaryRefHeight] = useState(0)
  const [isScrollAvailable, setIsScrollAvailable] = useState(null)
  const [editionsLayoutY, setEditionsLayoutY] = useState(null)
  const [viewedProduct, setViewedProduct] = useState<any>(null)
  const [productTitleLayout, setProductTitleLayout] = useState<any>(null)
  const [productNameLayout, setProductNameLayout] = useState<any>(null)
  // The header's height (the floating buttons' zone): the content must never go under it.
  const [stickyHeaderHeight, setStickyHeaderHeight] = useState(0)
  const headerRamp = themeSpace(theme, 'lg')
  // Where the content (the sheet, or the summary with no image) starts in the scroll.
  const contentTop = showHero ? HEIGHT * 0.45 : contentTopWithoutImage(stickyHeaderHeight, headerRamp, STICKY_HEADER_CLEARANCE)
  // The solid header and its title fade in with the scroll, with no state (no re-render per frame).
  const headerBackground = useRef(new Animated.Value(0)).current
  const headerTitle = useRef(new Animated.Value(0)).current
  const guestCheckoutEnabled = isGuestCheckoutAllowed(configs, orderState?.options?.type)
  const orderTypeEnabled = guestCheckoutEnabled

  const optionsLength = product?.extras?.reduce((acc: number, extras: any) => acc + extras?.options?.length, 0) + (!!product?.ingredients?.length ? 1 : 0)

  const vibrateApp = (impact?: string | any) => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false
    };
    ReactNativeHapticFeedback.trigger(impact || 'impactLight', options);
  }

  // The groups show what is missing only after the first "Add" (before it they ask in plain text).
  const [addAttempted, setAddAttempted] = useState(false)

  // The first group, in the order it is drawn, that has an error: the page brings it under the sticky header.
  const scrollToFirstError = () => {
    const ids = (product?.extras ?? [])
      .slice().sort((a: any, b: any) => a.rank - b.rank)
      .flatMap((extra: any) => (extra.options ?? []).slice().sort((a: any, b: any) => a.rank - b.rank))
      .filter((item: any) => showOption(item))
      .map((item: any) => `id:${item.id}`)
    const first = ids.find((id: string) => errors[id])
    const layout = first && layoutsRef.current[first]
    if (!layout || !scrollViewRef.current) return
    const top = contentTop + (editionsLayoutY ?? 0) + layout.y
    scrollViewRef.current.scrollTo({ y: Math.max(top - STICKY_HEADER_HEIGHT - themeSpace(theme, 'lg'), 0), animated: true })
  }

  const handleSaveProduct = async () => {
    vibrateApp()
    if (!productCart.quantity) {
      showToast(ToastType.Error, t('VALIDATION_ERROR_REQUIRED', 'The quantity field is required').replace('_attribute_', t('PRODUCT_POTIONS_QUANTITY', 'Quantity')))
      return
    }
    const isErrors = Object.values(errors)?.length > 0;
    if (!isErrors) {
      await handleSave && handleSave();
      callbackAfterUpdateCart && callbackAfterUpdateCart()
      return;
    }
    setAddAttempted(true)
    scrollToFirstError()
  };

  const handleRedirectLogin = () => {
    navigation.navigate('Login', {
      store_slug: props.businessSlug
    });
  };

  const handleUpdateGuest = async () => {
    if (!isGuestCheckoutAllowed(configs, orderState?.options?.type)) return
    const guestToken = uuid.v4()
    if (guestToken) {
      await handleCreateGuestUser({ guest_token: guestToken })
    }
  };

  const onChangeProductCartQuantity = (quantity: number) => {
    if (quantity > maxProductQuantity) {
      showToast(ToastType.Error, t('MAX_QUANTITY', 'The max quantity is _number_').replace('_number_', maxProductQuantity))
      return
    }
    handleChangeProductCartQuantity(quantity)
  }

  const scrollDown = (id: any) => {
    const isErrors = Object.values(errors)?.length > 0
    if (!isErrors) {
      return
    }
    const targetOptionId = Object.getOwnPropertyNames(errors).filter(item => !item.includes(id))[0]

    if (optionLayout[targetOptionId] && scrollViewRef.current) {
      const imageHeight = showHero ? HEIGHT * 0.55 : 0
      const targetY = optionLayout[targetOptionId]?.y + imageHeight + summaryRefHeight
      const headerStickyHeight = 70
      const adjustedY = targetY - headerStickyHeight - 20

      scrollViewRef.current.scrollTo({
        y: adjustedY > 0 ? adjustedY : 0,
        animated: true
      })
    }
  }

  const handleOnLayout = (event: any, optionId: any) => {
    // Always kept (no render): the "Add" with something missing goes to its group even in a long product.
    layoutsRef.current[optionId ? `id:${optionId}` : 'id:0'] = event.nativeEvent.layout
    if (optionsLength > MAX_AUTO_SCROLL_PRODUCT_SUBOPTIONS) return
    const _optionLayout = { ...optionLayout }
    const optionKey = optionId ? `id:${optionId}` : 'id:0'
    _optionLayout[optionKey] = event.nativeEvent.layout
    setOptionLayout(_optionLayout)
  }

  const handleGoBack = navigation?.canGoBack()
    ? () => navigation.goBack()
    : () => returnTo(navigation, 'Business', { store: props.businessSlug })

  const showDiscard = themeVisible(theme, 'product.discard_button')
  const handleDiscard = async () => {
    if (editMode && productCart?.code) {
      const cart: any = Object.values(orderState?.carts ?? {}).find((item: any) =>
        item?.products?.some((cartProduct: any) => cartProduct?.code === productCart?.code))
      if (cart) await removeProduct(productCart, cart)
    }
    handleGoBack()
  }

  const favoriteButton = themeVisible(theme, 'product.favorite') ? (
    <OButton
      iconOnly
      color={closeSlot.color}
      appearance={closeSlot.appearance}
      size={closeSlot.size}
      icon={(
        <LottieAnimation
          type='favorite'
          onClick={() => handleChangeFavorite()}
          initialValue={product?.favorite ? 0.5 : 0}
          toValue={product?.favorite ? 0 : 0.5}
          disableAnimation={!auth}
          iconProps={{ color: theme.native.components.favorite.base.color, size: theme.native.components.favorite.base.icon_size }}
          isActive={product?.favorite}
        />
      )}
    />
  ) : null

  const actionButtonProps = {
    navigation,
    isHaveWeight,
    isSoldOut,
    maxProductQuantity,
    productCart,
    handleSaveProduct,
    editMode,
    product,
    errors,
    productAddedToCartLength,
    handleRedirectLogin,
    guestCheckoutEnabled,
    orderTypeEnabled,
    handleUpdateGuest,
    actionStatus,
    needsStudent,
    onSelectStudent: () => setStudentPickerOpen(true),
    business: props.business,
    closedWithoutMoment
  }

  const extraOptionsProps = {
    setSelectedOpt,
    scrollViewRef,
    optionLayout,
    editionsLayoutY,
    selOpt
  }

  const suboptionsLength = product?.extras?.reduce((acc: number, extras: any) => acc + extras?.options?.reduce((accSuboptions: number, options: any) => accSuboptions + options?.suboptions?.length, 0), 0)

  const handleChangeFavorite = () => {
    if (auth) {
      handleFavoriteProduct && handleFavoriteProduct(product, product?.favorite)
    } else {
      navigation && navigation.navigate('Login');
    }
  }

  const updateHeader = (scrollY: number) => {
    headerBackground.setValue(headerBackgroundProgress(scrollY, contentTop, stickyHeaderHeight, headerRamp))
    if (productTitleLayout && productNameLayout) {
      const nameTop = contentTop + productTitleLayout.y + productNameLayout.y
      headerTitle.setValue(headerTitleProgress(scrollY, stickyHeaderHeight, nameTop, productNameLayout.height))
    }
  }

  const handleScroll = (event: any) => updateHeader(event.nativeEvent.contentOffset.y)

  useEffect(() => {
    if (isScrollAvailable && scrollAttemptRef.current !== isScrollAvailable) {
      const targetOptionId = Object.getOwnPropertyNames(errors).filter(item => !item.includes(isScrollAvailable))[0]
      if (optionLayout[targetOptionId]) {
        scrollAttemptRef.current = isScrollAvailable
        scrollDown(isScrollAvailable)
        setTimeout(() => {
          setIsScrollAvailable(null)
          scrollAttemptRef.current = null
        }, 100)
      }
    }
  }, [errors, optionLayout, isScrollAvailable])

  useEffect(() => {
    if (product?.weight && product?.weight_unit) {
      setIsHaveWeight(true)
      setPricePerWeightUnit(product?.price / product?.weight)
    }
  }, [product])

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      scrollViewRef.current.scrollToEnd({ animated: true })
    })
    return () => {
      keyboardDidShowListener.remove()
    }
  }, [])

  useEffect(() => {
    if (!product?.id || product?.id === viewedProduct?.id) return
    setViewedProduct(product)
    events.emit('product_viewed', product)
  }, [product?.id, viewedProduct])

  const decrementDisabled = closedWithoutMoment || productCart?.quantity === 1 || !productCart?.quantity || isSoldOut || ((productCart?.quantity + productAddedToCartLength) <= product?.minimum_per_order)
  const incrementDisabled = closedWithoutMoment ||
    maxProductQuantity <= 0 ||
    (productCart?.quantity + productAddedToCartLength) >= maxProductQuantity ||
    (!!product?.maximum_per_order && (productCart?.quantity + productAddedToCartLength) >= product?.maximum_per_order) ||
    isSoldOut
  const hasSku = showSku && ((product?.sku && product?.sku !== '-1' && product?.sku !== '1') || (productCart?.sku && productCart?.sku !== '-1' && productCart?.sku !== '1'))
  const hasPersons = showPersons && !!product?.estimated_person

  // The line under the price: calories, sku and the people it feeds, as the web's.
  const metaItems = [
    showCalories && !!product?.calories ? `${product?.calories} cal` : null,
    hasSku ? `${t('SKU', 'Sku')} ${product?.sku || productCart?.sku}` : null,
    hasPersons ? `${product?.estimated_person} ${t('ESTIMATED_PERSONS', 'persons')}` : null
  ].filter(Boolean) as string[]

  // What the product asks of the order's quantity (under the price in the web's bar).
  const orderedQuantity = (productCart?.quantity || 0) + productAddedToCartLength
  const orderLimitNote = product?.minimum_per_order && orderedQuantity <= product?.minimum_per_order && productCart?.quantity !== 1
    ? t('MINIMUM_TO_ORDER', 'Minimum _number_ to order').replace('_number_', product?.minimum_per_order)
    : product?.maximum_per_order && orderedQuantity >= product?.maximum_per_order
      ? t('MAXIMUM_TO_ORDER', 'Max. _number_ to order').replace('_number_', product?.maximum_per_order)
      : ''

  const description = showDescription && (product?.description || productCart?.description) && (
    <ProductDescription>
      <OText style={styles.description}>
        {product?.description || productCart?.description}
      </OText>
    </ProductDescription>
  )

  return (
    <View style={{ flex: 1 }}>
      {showHeaderBar && (
        <NavBar title={props.business?.name} onActionLeft={handleGoBack} centerTitle />
      )}
      <View style={{ flex: 1 }}>
      {showHero && (
        <View
          testID='product-hero'
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: HEIGHT * 0.55, zIndex: 0, backgroundColor: modal.base.image_background }}
        >
          <BackgroundImage
            source={{
              uri: product?.images,
              priority: FastImage.priority.normal
            }}
            resizeMode="cover"
            style={{ flex: 1, borderTopLeftRadius: modal.base.image_radius, borderTopRightRadius: modal.base.image_radius, overflow: 'hidden' }}
          >
          </BackgroundImage>
        </View>
      )}
      <WrapperHeaderActions isSticky={true} style={modal.base.close_position === 'end' && styles.actionsReversed} onLayout={(event: any) => setStickyHeaderHeight(event.nativeEvent.layout.height)}>
        <HeaderBackground pointerEvents='none' style={{ opacity: headerBackground }} />
        <OButton
          testID='product-back'
          accessibilityLabel={t('GO_BACK', 'Go back')}
          iconOnly
          color={closeSlot.color}
          appearance={closeSlot.appearance}
          size={closeSlot.size}
          icon={<Icon name={modal.base.close_icon === 'close' ? 'close' : 'arrow-back'} />}
          onClick={() => handleGoBack()}
        />
        {!!product?.name && (
          <Animated.View style={[styles.headerTitle, { opacity: headerTitle }]} pointerEvents='none' accessibilityElementsHidden importantForAccessibility='no-hide-descendants'>
            <OText
              preset='body_lg'
              weight={600}
              numberOfLines={1}
              align='center'
            >
              {product?.name}
            </OText>
          </Animated.View>
        )}
        {!favoriteBesideName && favoriteButton}
      </WrapperHeaderActions>
      {!error && (
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{
            paddingBottom: actionsHeight,
            flexDirection: 'column',
            paddingTop: contentTop,
            justifyContent: 'space-between',
          }}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          removeClippedSubviews={false}
        >
          <View style={{ flexDirection: 'column' }}>
            <ProductSummary
              onLayout={(event: any) => setSummaryRefHeight(event.nativeEvent.layout?.height)}
            >
              {showHero && (
                <Line />
              )}
              <ProductTitle
                onLayout={(event: any) => setProductTitleLayout(event.nativeEvent.layout)}
              >
                {loading && !product ? (
                  <Placeholder Animation={Fade}>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}>
                      <PlaceholderLine width={40} height={20} />
                      <PlaceholderLine width={30} height={20} />
                    </View>
                  </Placeholder>
                ) : (
                  <>
                    <View style={favoriteBesideName && styles.nameRow} onLayout={(event: any) => setProductNameLayout(event.nativeEvent.layout)}>
                      <OText style={[styles.name, favoriteBesideName && styles.nameInRow]}>
                        {product?.name || productCart.name}
                      </OText>
                      {favoriteBesideName && favoriteButton}
                    </View>
                    {description}
                    {isHaveWeight ? (
                      <OText style={styles.price}>{parsePrice(pricePerWeightUnit)} / {product?.weight_unit}</OText>
                    ) : (
                      <View style={styles.priceRow}>
                        <OText style={[styles.price, { flex: I18nManager.isRTL ? 1 : 0 }]}>{productCart.price ? parsePrice(productCart.price) : ''}</OText>
                        {product?.offer_price !== null && product?.in_offer && themeVisible(theme, 'product.offer_price') && (
                          <OText style={styles.offerPrice}>{product?.offer_price ? parsePrice(product?.offer_price) : ''}</OText>
                        )}
                      </View>
                    )}
                    {metaItems.length > 0 && (
                      <OText style={[styles.meta, { flex: I18nManager.isRTL ? 1 : 0 }]} mBottom='xs'>
                        {metaItems.join('\u00A0\u00B7\u00A0')}
                      </OText>
                    )}
                  </>
                )}
              </ProductTitle>
              {themeVisible(theme, 'product.tags') && !!product?.tags?.length && (
                <ScrollView
                  horizontal
                  scrollEventThrottle={100}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tags}
                >
                  {product?.tags?.map((tag: any) => (
                    <View
                      key={tag.id}
                      style={styles.productTagWrapper}
                    >
                      {!!tag?.image && (
                        <View style={styles.productTagBox}>
                          <OIcon
                            url={imageUrl(tag?.image, { height: modal.base.tag_size })}
                            style={styles.productTagImageStyle}
                          />
                        </View>
                      )}
                      <OText preset='body_sm' color='text_muted' style={styles.productTagNameStyle}>{tag.name}</OText>
                    </View>
                  ))}
                </ScrollView>
              )}
              <Divider />
            </ProductSummary>
            {showOptionTabs && (!loading && product && detailsReady) && (
              <ExtraOptionWrap>
                <ExtraOptions product={product} withOptions={suboptionsLength < 200} {...extraOptionsProps} />
              </ExtraOptionWrap>
            )}
            {!loading && product && detailsReady && (
              <ProductEditions
                onLayout={(event: any) => setEditionsLayoutY(event.nativeEvent?.layout?.y)}
              >
                <>
                  {product?.ingredients?.length > 0 && (
                    <View style={[styles.gutter, styles.optionBlock]} key={'cat_01'}>
                      <SectionTitle onLayout={(event: any) => handleOnLayout(event, '')}>
                        <OText style={styles.sectionTitle}>
                          {t('INGREDIENTS', 'Ingredients')}
                        </OText>
                      </SectionTitle>
                      <WrapperIngredients>
                        {product?.ingredients.map((ingredient: any, idx: number) => (
                          <ProductIngredient
                            key={idx}
                            ingredient={ingredient}
                            state={productCart.ingredients[`id:${ingredient.id}`] ?? {}}
                            onChange={handleChangeIngredientState}
                            isSoldOut={isSoldOut || closedWithoutMoment}
                          />
                        ))}
                      </WrapperIngredients>
                    </View>
                  )}
                  {product?.extras?.sort((a: any, b: any) => a.rank - b.rank).map((extra: any) =>
                    extra.options?.sort((a: any, b: any) => a.rank - b.rank).map((option: any, i: number) => {
                      const currentState = productCart.options[`id:${option.id}`] || {};
                      return (
                        <React.Fragment key={`cat_${option.id}`}>
                          {showOption(option) && (
                            <View style={[styles.optionBlock, option?.respect_to != null && styles.nestedOption]} onLayout={((event: any) => handleOnLayout(event, option?.id))}>
                              <ProductOption
                                option={option}
                                currentState={currentState}
                                error={addAttempted ? errors[`id:${option.id}`] : undefined}
                              >
                                <WrapperSubOption>
                                  {option?.suboptions?.sort((a: any, b: any) => a.rank - b.rank).map(
                                    (suboption: any, index: number) => {
                                      const currentState = productCart.options[`id:${option.id}`]?.suboptions[`id:${suboption.id}`] || {};
                                      const balance = productCart.options[`id:${option.id}`]?.balance || 0;
                                      return (
                                        <ProductOptionSubOption
                                          key={suboption.id}
                                          index={index + 1}
                                          isSoldOut={isSoldOut}
                                          balance={balance}
                                          pizzaState={pizzaState}
                                          option={option}
                                          suboption={suboption}
                                          image={suboption.image}
                                          state={currentState}
                                          disabled={isSoldOut || maxProductQuantity <= 0 || closedWithoutMoment}
                                          setIsScrollAvailable={setIsScrollAvailable}
                                          onChange={handleChangeSuboptionState}
                                        />
                                      );
                                    },
                                  )}
                                </WrapperSubOption>
                              </ProductOption>
                            </View>
                          )}
                        </React.Fragment>
                      );
                    }),
                  )}
                </>
                {showComment && !product?.hide_special_instructions && (
                  <ProductComment>
                    <SectionTitle style={showOptionalBadge && styles.commentTitle}>
                      <OText style={styles.sectionTitle}>
                        {t('COMMENTS', 'Special comment')}
                      </OText>
                      {showOptionalBadge && <OptionalBadge />}
                    </SectionTitle>
                    <OInput
                      multiline
                      placeholder={t('SPECIAL_COMMENT', 'Special comment')}
                      value={productCart.comment}
                      isDisabled={!(productCart && !isSoldOut && maxProductQuantity) || closedWithoutMoment}
                      style={styles.comment}
                      forwardRef={commentRef}
                      onChange={(val: string) =>
                        handleChangeCommentState({ target: { value: val } })
                      }
                    />
                  </ProductComment>
                )}
              </ProductEditions>
            )}
            {((loading && !product) || (product && !detailsReady)) && (
              <View style={styles.gutter}>
                {[...Array(2)].map((_, i) => (
                  <Placeholder
                    key={i}
                    style={styles.skeletonGroup}
                    Animation={Fade}>
                    <PlaceholderLine
                      height={40}
                      style={styles.skeletonTitle}
                    />
                    {[...Array(3)].map((item, i) => (
                      <View
                        key={'place_key_' + i}
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                        }}>
                        <PlaceholderLine
                          height={30}
                          width={10}
                          style={styles.skeletonLine}
                        />
                        <PlaceholderLine
                          height={30}
                          width={50}
                          style={styles.skeletonLine}
                        />
                        <PlaceholderLine
                          height={30}
                          width={30}
                          style={styles.skeletonLine}
                        />
                      </View>
                    ))}
                  </Placeholder>
                ))}
              </View>
            )}
            {!!error && error?.length > 0 && (
              <NotFoundSource content={error[0]?.message || error[0]} />
            )}
          </View>
        </ScrollView>
      )}
      {!loading && !error && product && (
        <ProductActions
          style={styles.actions}
          onLayout={(event: any) => setActionsHeight(event.nativeEvent.layout?.height ?? 0)}
        >
          {!!orderLimitNote && <OText style={styles.limitNote}>{orderLimitNote}</OText>}
          <View style={[styles.actionContainer, isHaveWeight && styles.actionContainerColumn]}>
            {productCart && !isSoldOut && maxProductQuantity > 0 && (
              <QuantityControl isCentered={isHaveWeight} style={stepper.base.compact ? styles.quantityCompact : undefined}>
                {showDiscard && (editMode ? (
                  <OAlert
                    title={t('DELETE_PRODUCT', 'Delete Product')}
                    message={t('QUESTION_DELETE_PRODUCT', 'Are you sure that you want to delete the product?')}
                    onAccept={handleDiscard}
                  >
                    <View pointerEvents='none' testID='product-discard'>
                      <OButton
                        iconOnly
                        appearance={stepper.base.button_appearance}
                        size={quantitySlot.size}
                        style={stepper.base.compact ? styles.quantityButtonCompact : undefined}
                        accessibilityLabel={t('DELETE_PRODUCT', 'Delete Product')}
                        icon={<Icon name='trash-outline' size='lg' color='primary' />}
                      />
                    </View>
                  </OAlert>
                ) : (
                  <OButton
                    testID='product-discard'
                    accessibilityLabel={t('DELETE_PRODUCT', 'Delete Product')}
                    iconOnly
                    appearance={stepper.base.button_appearance}
                    size={quantitySlot.size}
                    style={stepper.base.compact ? styles.quantityButtonCompact : undefined}
                    icon={<Icon name='trash-outline' size='lg' color='primary' />}
                    onClick={handleGoBack}
                  />
                ))}
                <OButton
                  testID='product-quantity-decrement'
                  accessibilityLabel={t('DECREASE', 'Decrease')}
                  iconOnly
                  appearance={stepper.base.button_appearance}
                  size={quantitySlot.size}
                  style={stepper.base.compact ? styles.quantityButtonCompact : undefined}
                  icon={<Icon name='remove' size='lg' color={decrementDisabled ? 'text_disabled' : stepperInk} />}
                  disabled={!!decrementDisabled}
                  onClick={decrement}
                />
                <TextInput
                  keyboardType='numeric'
                  value={`${productCart?.quantity > 0 ? productCart?.quantity : ''}`}
                  onChangeText={(val: any) => {
                    let num: any = parseInt(val);
                    if (isNaN(num)) num = '';
                    else if (num > 999) num = 999;
                    onChangeProductCartQuantity(num);
                  }}
                  maxLength={3}
                  editable={!orderState.loading && !closedWithoutMoment}
                  maxFontSizeMultiplier={1.3}
                  style={styles.quantityInput}
                />
                <OButton
                  testID='product-quantity-increment'
                  accessibilityLabel={t('INCREASE', 'Increase')}
                  iconOnly
                  appearance={stepper.base.button_appearance}
                  size={quantitySlot.size}
                  style={stepper.base.compact ? styles.quantityButtonCompact : undefined}
                  icon={<Icon name='add' size='lg' color={incrementDisabled ? 'text_disabled' : stepperInk} />}
                  disabled={!!incrementDisabled}
                  onClick={increment}
                />
              </QuantityControl>
            )}
            {!isHaveWeight && <ActionButton {...actionButtonProps} />}
          </View>
          {isHaveWeight && <ActionButton {...actionButtonProps} />}
        </ProductActions>
      )}
      {isSchoolProduct && (
        <StudentOnboardingPopup
          business={props.business}
          navigation={navigation}
          forceOpen={studentPickerOpen}
          onForceClose={() => setStudentPickerOpen(false)}
        />
      )}
      </View>
    </View>
  );
};

export const ProductForm = (props: any) => {
  const productOptionsProps = {
    ...props,
    productCart: {
      ...props.productCart,
      quantity: props.productCart?.code
        ? props.productCart?.quantity
        : props?.product?.minimum_per_order || 1
    },
    // Closed store in ASAP: the controller fetches the product with ignore_menu_schedule=1 (needs props.business.open).
    showMenuWhenClosed: true,
    UIComponent: ProductOptionsUI
  }

  return <ProductOptions {...productOptionsProps} />
};

