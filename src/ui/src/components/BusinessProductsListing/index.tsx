import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { View, StyleSheet, Platform, BackHandler, FlatList, Dimensions } from 'react-native'
import { useIsFocused } from '@react-navigation/native';
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import { usePageSections } from '@/theme/sections'
import { useTheme } from 'styled-components/native'
import { themeImage, themeSpace, themeVisible } from '@/theme/helpers'
import { CartBarImage } from './CartBarImage'

import { BusinessProductsListingParams } from '../../types'
import settings from '@/config'
import { openFromCheckout } from '@/utils/checkoutReturn'

import { OModal, OText } from '../shared'
import { _retrieveStoreData, _removeStoreData } from '../../providers/StoreUtil';
import { HeaderContent } from '../BusinessesListing/Layout/Original/HeaderContent'

import {
  HeaderWrapper,
  MenuTop,
  MenuEnd,
  MenuSides,
  ProfessionalFilterWrapper
} from './styles'
import { MenuRow, categoryRowIndex, viewedSection } from '../BusinessProductsList/buildMenuRows'
import { MenuRowView } from '../BusinessProductsList/MenuRowView'
import { useMenuRows } from '../BusinessProductsList/useMenuRows'
import { RowLayouts, createRowLayouts } from './rowLayouts'

import {
  BusinessAndProductList,
  useLanguage,
  useSession,
  useUtils,
  ToastType,
  useToastActions,
  useConfig,
  useEvent,
  useSchoolStudents,
  useFreeDeliveryProgress,
  useOrderState,
  useOrderActions
} from '@components'

import {
  Alert,
  BusinessBasicInformation,
  BusinessProductsCategories,
  FloatingButton,
  UpsellingRedirect,
  ProfessionalFilter,
  ServiceForm,
  PageBanner,
  StudentSelector,
  StudentOnboardingPopup
} from '@ui'
import dayjs from 'dayjs'
import { FreeDeliveryProgress } from '../FreeDeliveryProgress'
import { goHome, openScreen } from '@/navigators/appNavigation'

/** The scroll (pt) after which the header shows the business's name and folds its controls. */
const TITLE_SCROLL = 30
/** Back at the top of the menu (pt), no category is the one on screen. */
const TOP_SCROLL = 10
/** A row counts as on screen once half of it shows: the row the stuck category bar covers does not. */
const VIEWABILITY = { itemVisiblePercentThreshold: 50 }
/**
 * The rows the list keeps mounted around the screen, in screens (half above, half below),
 * and the rows it adds per batch.
 */
const WINDOW_SIZE = 9
const BATCH_SIZE = 8
/** The menu's next page is asked for when its end is this many screens away. */
const END_REACHED_SCREENS = 2
/**
 * The products a menu that loads by pages asks for at a time (a business of more than 500
 * products; a smaller one comes whole with the business). Without a size the menu asked for
 * every product of a category in one request, 2,500 of them in a large one.
 */
export const MENU_PAGE_SIZE = 20
/** A tap on a category at most these screens away scrolls to it (its rows on the way are mounted); further, the list jumps. */
const JUMP_ANIMATED_SCREENS = 3
/** Before any row is measured, the list assumes this many rows per screen. */
const ROWS_PER_SCREEN_GUESS = 4
/** A row that takes its real height above the screen (one the list had jumped over) does not move what is on screen. */
const KEEP_VISIBLE_ROWS = { minIndexForVisible: 0 }
const NO_CART: any = {}
const NO_PRODUCTS: any[] = []
const NO_CATEGORIES: any[] = []

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1
  }
})

/**
 * A row of the screen's list: one of the page's sections (`business` in the
 * theme: the business header, the banners, the category bar…), the space that
 * opens and closes the menu, or a row of the menu (`buildMenuRows`).
 */
type PageRow =
  | { kind: 'section', key: string }
  | { kind: 'menu_top', key: string }
  | { kind: 'menu_end', key: string }
  | MenuRow

const MENU = 'menu'
const MENU_TOP_ROW: PageRow = { kind: 'menu_top', key: 'menu_top' }
const MENU_END_ROW: PageRow = { kind: 'menu_end', key: 'menu_end' }
const rowKey = (row: PageRow) => row.key

/**
 * The page's sections reach their rows through this context: the list's data
 * is only their keys, so the list does not render again when a section does.
 */
const PageSectionsContext = React.createContext<{
  nodes: Record<string, React.ReactNode>
  onSectionLayout: (key: string, height: number) => void
}>({ nodes: {}, onSectionLayout: () => {} })

const PageSection = React.memo(({ name }: { name: string }) => {
  const { nodes, onSectionLayout } = useContext(PageSectionsContext)
  return (
    <View onLayout={(event: any) => onSectionLayout(name, event.nativeEvent.layout.height)}>
      {nodes[name]}
    </View>
  )
})

export const BusinessProductsListingUI = (props: BusinessProductsListingParams) => {
  const {
    navigation,
    errors,
    businessState,
    categoryState,
    handleChangeSearch,
    categorySelected,
    searchValue,
    handleChangeCategory,
    handleSearchRedirect,
    featuredProducts,
    errorQuantityProducts,
    header,
    logo,
    alertState,
    setAlertState,
    multiRemoveProducts,
    getNextProducts,
    handleUpdateProducts,
    professionalSelected,
    handleUpdateProfessionals,
    handleChangeProfessionalSelected,
    businessSingleId,
    productModal
  } = props

  const [, t] = useLanguage()
  const [{ auth }] = useSession()
  const { refresh: refreshStudents } = useSchoolStudents()
  const orderState = useOrderState()
  const { addProduct, updateProduct } = useOrderActions()
  const [{ parsePrice }] = useUtils()
  const { showToast } = useToastActions()
  const [{ configs }] = useConfig()
  const [events] = useEvent()
  const isFocused = useIsFocused();
  const isPreOrder = configs?.preorder_status_enabled?.value === '1'

  // The `business` page: its sections in the theme's order and visibility.
  const { sections, indexOf } = usePageSections('business')
  const theme: any = useTheme()
  // `visibility.business.*`: the back arrow, the cart bar and the categories' "All" tab.
  const showBack = themeVisible(theme, 'business.back') && !props.isHome
  const coverFullWidth = theme.native.components.business_header.base.cover_full_width === true && themeVisible(theme, 'business.header.cover')
  const showCartBar = themeVisible(theme, 'business.cart_bar')
  const showCartBarFees = themeVisible(theme, 'business.cart_bar.fees')
  const hasCartBarImage = !!themeImage(theme, 'icons.cart_bar')
  const showAllCategory = themeVisible(theme, 'business.categories.all')

  const { business, loading, error } = businessState

  const sortedCategories = useMemo(() => {
    const cats = business?.categories ? [...business.categories] : []
    if (business?.vertical === 'school') {
      const todayDow = dayjs().day()
      const upcomingDiff = (prepDay: any) => {
        if (prepDay === null || prepDay === undefined || prepDay === '') return null
        return (Number(prepDay) - todayDow + 7) % 7
      }
      return cats.sort((a: any, b: any) => {
        const aDiff = upcomingDiff(a?.preparation_day_of_week)
        const bDiff = upcomingDiff(b?.preparation_day_of_week)
        if (aDiff !== null && bDiff !== null) return (aDiff - bDiff) || ((a.rank || 0) - (b.rank || 0))
        if (aDiff !== null) return -1
        if (bDiff !== null) return 1
        return (a.rank || 0) - (b.rank || 0)
      })
    }
    return cats.sort((a: any, b: any) => (a.rank || 0) - (b.rank || 0))
  }, [business?.categories, business?.vertical])

  useEffect(() => {
    if (business?.vertical === 'school') refreshStudents()
  }, [business?.slug, business?.vertical])

  const isSchool = business?.vertical === 'school'
  const menuCategories = useMemo(() => {
    const base: any[] = showAllCategory ? [{ id: null, name: t('ALL', 'All') }] : []
    if (!isSchool) base.push({ id: 'featured', name: t('FEATURED', 'Featured') })
    return [...base, ...sortedCategories]
  }, [sortedCategories, isSchool, showAllCategory])

  const [openBusinessInformation, setOpenBusinessInformation] = useState(false)
  const [openUpselling, setOpenUpselling] = useState(false)
  const [canOpenUpselling, setCanOpenUpselling] = useState(false)
  const listRef = useRef<FlatList<PageRow>>(null)
  const [subcategoriesSelected, setSubcategoriesSelected] = useState<any[]>([])
  const [openService, setOpenService] = useState(false)
  const [currentProduct, setCurrentProduct] = useState(null)
  const [viewedCategory, setViewedCategory] = useState<any>(null)
  const [showTitle, setShowTitle] = useState(false)
  // The category bar sticks once the scroll passes its top (then it takes its sticky shadow).
  const [isCategoryBarStuck, setCategoryBarStuck] = useState(false)

  const isQuickAddProduct = configs?.add_product_with_one_click?.value === '1'
  // A closed business with no preorder time chosen yet: the product opens disabled instead of being added straight to the cart.
  const closedWithoutMoment = business?.open === false && !orderState.options?.moment
  // One object while there is no cart: the menu's rows are built with it.
  const currentCart: any = Object.values(orderState.carts).find((cart: any) => cart?.business?.slug === business?.slug) ?? NO_CART
  const freeDeliveryProgress: any = (useFreeDeliveryProgress as any)({
    business,
    cart: currentCart,
    enabled: !loading,
    franchiseId: settings.franchiseSlug
  })
  const viewOrderButtonVisible = !loading && auth && currentCart?.products?.length > 0 && categoryState.products.length !== 0
  const showFreeDeliveryAwareness = !currentCart?.products?.length && freeDeliveryProgress.status === 'awareness'
  const hasNoReservation = !currentCart?.reservation && orderState?.options?.type === 9
  const isMultiCheckout = configs?.checkout_multi_business_enabled?.value === '1' && orderState?.options?.type !== 9
  const openMultiCart = isMultiCheckout && Object.values(orderState?.carts ?? {})
    .filter((cart: any) => cart?.valid && cart?.status !== 2 && cart?.products?.length).length > 1

  const handleViewOrder = () => {
    if (currentCart?.status === 2) {
      handleUpsellingPage(currentCart)
      return
    }
    if (openMultiCart) {
      props.onNavigationRedirect('Cart')
      return
    }
    // `visibility.cart.upselling`: without the suggested products, straight on.
    if (!themeVisible(theme, 'cart.upselling')) {
      handleUpsellingPage(currentCart)
      return
    }
    setOpenUpselling(true)
  }

  const onRedirect = (route: string, params?: any) => {
    const sourceRoute = (props as any).route
    if (sourceRoute?.params?.fromCheckout) {
      openFromCheckout(navigation, sourceRoute, route, params)
      return
    }
    openScreen(navigation, route, params)
  }
  const vibrateApp = (impact?: any) => {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false
    };
    ReactNativeHapticFeedback.trigger(impact || "impactLight", options);
  }
  // The product cards keep the first click handler they get (their memo compares the
  // product, not the handler): a stable one that runs the latest, with the current cart.
  const onProductClickLatest = useRef<(product: any) => Promise<void>>(async () => {})
  const onProductClick = useCallback((product: any) => onProductClickLatest.current(product), [])
  onProductClickLatest.current = async (product: any) => {
    if (currentCart?.status === 2) {
      setAlertState({ open: true, content: [t('YOU_HAVE_CART_IN_PROGRESS', 'You have a cart in progress, please complete it')] })
      return
    }
    if (product.ingredients?.length === 0 && product.extras.length === 0 && !product.inventoried && auth && isQuickAddProduct && !closedWithoutMoment) {
      const isProductAddedToCart = currentCart?.products?.find((Cproduct: any) => Cproduct.id === product.id)
      const productQuantity = isProductAddedToCart?.quantity
      const minimumPerOrder = product?.minimum_per_order || 1
      const addCurrentProduct = {
        ...product,
        quantity: minimumPerOrder
      }
      const updateCurrentProduct = {
        name: product?.name,
        id: product.id,
        code: isProductAddedToCart?.code,
        quantity: productQuantity + 1
      }
      vibrateApp()
      const cartData = currentCart?.business_id ? currentCart : { business_id: business.id }
      if (isProductAddedToCart) {
        await updateProduct(updateCurrentProduct, cartData, isQuickAddProduct)
      } else {
        await addProduct(addCurrentProduct, cartData, isQuickAddProduct)
      }
    } else {
      const productAddedToCartLength = currentCart?.products?.reduce((productsLength: number, Cproduct: any) => { return productsLength + (Cproduct?.id === product?.id ? Cproduct?.quantity : 0) }, 0) || 0
      if (product?.type === 'service' && business?.professionals?.length > 0) {
        setCurrentProduct(product)
        setOpenService(true)
        return
      }
      if (product?.enabled) {
        onRedirect('ProductDetails', {
          product: product,
          // The business's data the product screen reads (not the SDK model,
          // which holds the API client: navigation params are plain data).
          business: {
            id: business?.id,
            name: business?.name,
            slug: business?.slug,
            store: business?.slug,
            vertical: business?.vertical,
            header: business?.header,
            logo: business?.logo,
            open: business?.open,
            schedule: business?.schedule,
            timezone: business?.timezone
          },
          businessSlug: business?.slug,
          productId: product?.id,
          categoryId: product?.category_id,
          businessId: business.id || product?.category?.business_id,
          productAddedToCartLength,
          isRedirect: false
        })
      } else {
        showToast(ToastType.Error, t('PRODUCT_NOT_FOUND', 'Product not found'))
      }
    }
    events.emit('product_clicked', product)
  }

  const handleCancel = () => {
    handleChangeSearch('')
  }

  const carts = useMemo(() => {
    return (orderState?.carts &&
      Object.values(orderState?.carts).filter((cart: any) =>
        cart.products?.length > 0 || (cart?.reservation && orderState?.options?.type === 9)
      )) ?? [];
  }, [orderState?.carts, orderState?.options?.type]);

  const cartGroups: any = useMemo(() => {
    if (!Object.values(carts)?.length) return {}
    return Object.values(carts).sort((a: any, b: any) => b?.status - a?.status).reduce((groups: any, cart: any) => {
      const groupId: any = cart?.status === 2 ? [`pending:${cart?.group?.uuid || cart?.uuid}`] : ['active']
      groups[groupId] = [...(groups[groupId] || []), cart]
      return groups
    }, {})
  }, [carts])

  const handleUpsellingPage = (cart: any) => {
    setOpenUpselling(false)
    setCanOpenUpselling(false)
    const cartGroupUuid = cart?.group?.uuid
    // A pending cart goes to the checkout where its payment is resolved: its own one,
    // unless it was placed together with other carts
    const isPendingMultiCart = !!cartGroupUuid && cartGroups[`pending:${cartGroupUuid}`]?.length > 1
    if (isPendingMultiCart) {
      props.onNavigationRedirect('MultiCheckout', {
        cartUuid: cartGroupUuid
      })
    } else {
      props.onNavigationRedirect('CheckoutPage', {
        cartUuid: cart?.uuid,
        businessLogo: cart?.business?.logo,
        businessName: cart?.business?.name,
        cartTotal: cart?.total,
        fromProductsList: true
      })
    }
  }

  const handleCloseUpsellingPage = () => {
    setOpenUpselling(false)
  }

  const [selectedCategoryId, setSelectedCategoryId] = useState<any>(null)

  // What the scroll reads, in refs: its handlers never change (the list would render again)
  // and set a state only when a threshold is crossed, never once per scroll event.
  const scrollState = useRef({
    showTitle: false,
    stuck: false,
    /** A tap on a category tab chose the category: the scroll does not choose until the next drag. */
    categoryClicked: false,
    lazy: false,
    selectedCategoryId: null as any,
    /** The scroll at which the category bar sticks: the height of the rows above it (null until they are laid out). */
    barTop: null as number | null,
    barHeight: 0,
    /** The scroll and the list's height, for the distance to a category that is not rendered yet. */
    offset: 0,
    height: 0
  })
  scrollState.current.lazy = !!business?.lazy_load_products_recommended
  scrollState.current.selectedCategoryId = selectedCategoryId

  const setCategoryClicked = useCallback((clicked: boolean) => {
    scrollState.current.categoryClicked = clicked
  }, [])
  const setCategoryBarHeight = useCallback((height: number) => {
    scrollState.current.barHeight = height
  }, [])

  const handlePageScroll = useCallback(({ nativeEvent }: any) => {
    const state = scrollState.current
    const scrollOffset = nativeEvent.contentOffset.y
    state.offset = scrollOffset

    const pastTitle = scrollOffset > TITLE_SCROLL
    if (pastTitle !== state.showTitle) {
      state.showTitle = pastTitle
      setShowTitle(pastTitle)
    }
    const stuck = state.barTop !== null && scrollOffset > state.barTop
    if (stuck !== state.stuck) {
      state.stuck = stuck
      setCategoryBarStuck(stuck)
    }
    if (!state.lazy && !state.categoryClicked && scrollOffset > 0 && scrollOffset < TOP_SCROLL && state.selectedCategoryId !== 'cat_all') {
      state.selectedCategoryId = 'cat_all'
      setSelectedCategoryId('cat_all')
    }
  }, [])

  const handleTouchDrag = useCallback(() => {
    scrollState.current.categoryClicked = false
    // The user takes the scroll: a jump that is landing leaves it.
    clearTimeout(landing.current?.timer)
    landing.current = null
  }, [])

  // A menu that loads by pages asks for the next one as its end comes near: one page at a
  // time (the list says so again while the page loads, and each time its content grows),
  // with one notice per page.
  const loadingNextPage = useRef(false)
  const loadNextPage = useRef(() => {})
  loadNextPage.current = () => {
    const hasMore = categoryState?.pagination?.totalPages !== categoryState?.pagination?.currentPage
    if (
      loadingNextPage.current || !business?.lazy_load_products_recommended || loading ||
      categoryState?.loading || !hasMore || !getNextProducts
    ) return
    loadingNextPage.current = true
    showToast(ToastType.Info, t('LOADING_MORE_PRODUCTS', 'Loading more products'))
    Promise.resolve(getNextProducts()).catch(() => {}).finally(() => {
      loadingNextPage.current = false
    })
  }
  const handleEndReached = useCallback(() => loadNextPage.current(), [])

  // The category on screen lights its tab. The list reports its visible rows when they
  // change (no row is measured, nothing runs per scroll event) and each row knows its category.
  const handleViewableRows = useCallback(({ viewableItems }: any) => {
    const state = scrollState.current
    if (state.lazy || state.categoryClicked) return
    const section = viewedSection(viewableItems)
    if (section === null) return
    const categoryKey = `cat_${section}`
    if (state.selectedCategoryId !== categoryKey) {
      state.selectedCategoryId = categoryKey
      setSelectedCategoryId(categoryKey)
    }
  }, [])

  const adjustBusiness = async (adjustBusinessId: number) => {
    const _carts = orderState?.carts?.[adjustBusinessId]
    const products = _carts?.products
    const unavailableProducts = products.filter((product: any) => product.valid !== true)
    const alreadyRemoved = await _retrieveStoreData('already-removed')
    _removeStoreData('already-removed')
    if (unavailableProducts.length > 0) {
      multiRemoveProducts && await multiRemoveProducts(unavailableProducts, _carts)
      return
    }

    if (alreadyRemoved === 'removed') {
      setAlertState({ open: true, content: [t('NOT_AVAILABLE_PRODUCT', 'This product is not available.')] })
    }
  }

  const removeCartByReOrder = async () => {
    const adjustBusinessId = await _retrieveStoreData('adjust-cart-products')
    if (currentCart && adjustBusinessId) {
      _removeStoreData('adjust-cart-products')
      adjustBusiness(adjustBusinessId)
    }
  }

  useEffect(() => {
    removeCartByReOrder()
  }, [currentCart])

  useEffect(() => {
    if (!isFocused) {
      handleChangeSearch('')
    }
  }, [isFocused])

  const subtotalWithTaxes = currentCart?.taxes?.reduce((acc: any, item: any) => {
    if (item?.type === 1)
      return acc = acc + item?.summary?.tax
    return acc = acc
  }, currentCart?.subtotal)
  const belowMinimum = currentCart?.reservation ? !currentCart?.valid_minimum : subtotalWithTaxes < currentCart?.minimum
  const productsTotal = currentCart?.products?.reduce((sum: number, product: any) => sum + (product?.total ?? 0), 0) ?? 0

  useEffect(() => {
    let categoryId: any = null
    if (business?.lazy_load_products_recommended) {
      if (categorySelected?.id) {
        categoryId = categorySelected.id
      }
    } else {
      if (selectedCategoryId) {
        const originCategoryId = selectedCategoryId.replace('cat_', '')
        if (!isNaN(originCategoryId)) {
          categoryId = Number(originCategoryId)
        }
      }
    }
    if (categoryId) {
      const _viewedCategory = business.categories.find((category: any) => category.id === categoryId)
      if (_viewedCategory?.id !== viewedCategory?.id) {
        setViewedCategory(_viewedCategory)
        events.emit('product_list_viewed', _viewedCategory)
      }
    } else {
      if (business.categories) {
        const categoryAll: any = {}
        categoryAll.business_id = business.id
        categoryAll.id = null
        categoryAll.name = 'All'
        events.emit('product_list_viewed', categoryAll)
      }
    }
  }, [business?.lazy_load_products_recommended, selectedCategoryId, categorySelected?.id, viewedCategory])

  useEffect(() => {
    if (props.isHome) return
    const handleArrowBack: any = () => {
      navigation.goBack()
      return true
    }
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleArrowBack);
    return () => {
      backHandler.remove();
    }
  }, [])

  useEffect(() => {
    if (!business && !loading && !error) {
      showToast(ToastType.Error, t('BUSINESS_NOT_FOUND', 'Business not found'))
      goHome(navigation, { screen: 'Home' })
    }
  }, [business, error, loading])

  useEffect(() => {
    if (productModal?.product && !productModal?.loading && !productModal?.error) {
      onProductClick(props?.productModal?.product)
    }
  }, [productModal])

  // The menu's rows. While the business loads they are its skeletons.
  const showMenu = !loading && !!business?.id
  const { rows: menuRows, cartQuantities, menu } = useMenuRows({
    categories: showMenu ? menuCategories : NO_CATEGORIES,
    category: categorySelected,
    categoryState,
    businessId: business?.id,
    errors: showMenu ? errors : undefined,
    onProductClick,
    handleSearchRedirect,
    featured: showMenu && featuredProducts,
    searchValue: showMenu ? searchValue : undefined,
    isBusinessLoading: !showMenu,
    errorQuantityProducts,
    handleCancelSearch: handleCancel,
    subcategoriesSelected,
    lazyLoadProductsRecommended: showMenu && business?.lazy_load_products_recommended,
    currentCart,
    setSubcategoriesSelected,
    onClickCategory: handleChangeCategory,
    handleUpdateProducts,
    navigation,
    previouslyProducts: showMenu && !isSchool ? business?.previously_products : NO_PRODUCTS,
    businessSingleId
  })

  // A tap on a category tab scrolls to the category: its title lands under the stuck bar, as
  // far as the menu's top space. The list scrolls to any row at once (`rowLayouts`): with
  // the rows on the way mounted (a category near) the scroll is animated, as it always was;
  // to a category further away the list jumps, and renders only the rows around it.
  const menuTopSpace = themeSpace(theme, 'sm')
  const listRowsRef = useRef<PageRow[]>([])
  const layouts = useRef<RowLayouts>(null as any)
  if (layouts.current === null) layouts.current = createRowLayouts(Dimensions.get('window').height / ROWS_PER_SCREEN_GUESS)
  const getRowLayout = useCallback((_rows: any, index: number) => layouts.current.get(index), [])
  // The category a jump is landing on: the rows above it that render with it take their real
  // heights, so once it is laid out the list is set on it again (later ones do not move the screen).
  const landing = useRef<{ key: string, viewOffset: number, timer: any } | null>(null)
  const cancelLanding = useCallback(() => {
    clearTimeout(landing.current?.timer)
    landing.current = null
  }, [])
  const onRowLayout = useCallback((key: string, kind: string, height: number) => {
    layouts.current.measure(key, kind, height)
    const target = landing.current
    if (target?.key !== key) return
    clearTimeout(target.timer)
    // After the rows laid out with it are counted.
    target.timer = setTimeout(() => {
      landing.current = null
      const index = listRowsRef.current.findIndex((row) => row.key === key)
      if (index !== -1) listRef.current?.scrollToIndex({ index, viewOffset: target.viewOffset, animated: false })
    }, 0)
  }, [])
  const jumpToRow = useCallback((index: number, viewOffset: number) => {
    cancelLanding()
    if (index === -1) return
    const state = scrollState.current
    const distance = Math.abs(layouts.current.get(index).offset - viewOffset - state.offset)
    const animated = layouts.current.isMeasured(index) && distance <= JUMP_ANIMATED_SCREENS * state.height
    if (!animated) {
      // The rows it jumps over keep the height they are assumed now: the category stays where the list scrolls to.
      layouts.current.freeze(index)
      if (!layouts.current.isMeasured(index)) landing.current = { key: listRowsRef.current[index].key, viewOffset, timer: null }
    }
    listRef.current?.scrollToIndex({ index, viewOffset, animated })
  }, [cancelLanding])
  useEffect(() => cancelLanding, [cancelLanding])
  const scrollToCategory = useCallback((categoryId: any) => {
    const rows = listRowsRef.current
    const barHeight = scrollState.current.barHeight
    // "All", and "Featured" when the business has featured products: the top of the menu.
    if (categoryId === null || categoryId === 'featured') {
      if (categoryId === 'featured' && categoryRowIndex(rows, 'featured') === -1) return
      jumpToRow(rows.findIndex((row) => row.kind === 'menu_top'), barHeight)
      return
    }
    jumpToRow(categoryRowIndex(rows, categoryId), barHeight + menuTopSpace)
  }, [menuTopSpace, jumpToRow])
  const handleListLayout = useCallback((event: any) => {
    scrollState.current.height = event.nativeEvent.layout.height
  }, [])

  // The page's rows in the theme's order (sections of `business`), each one a
  // row of the list, so the sticky category bar's index is computed from what
  // is rendered. `professionals` is behaviour, not a section: it stays just
  // before the offers banner. The category bar and the products are the `menu`
  // section; order it again and featured products open the menu
  // (`buildMenuRows`), where the "Featured" tab scrolls to them.
  const pageNodes: Record<string, React.ReactNode> = {}
  const pageKeys: string[] = []
  const push = (key: string, node: React.ReactNode) => {
    if (node !== null && node !== undefined && node !== false) {
      pageNodes[key] = node
      pageKeys.push(key)
    }
  }
  for (const section of sections) {
    if (section.key === 'offers_banner' && business?.professionals?.length > 0) {
      push('professionals', (
        <ProfessionalFilterWrapper>
          <OText preset='body_lg' weight={600} mBottom='md'>
            {t('PROFESSIONALS', 'Professionals')}
          </OText>
          <ProfessionalFilter
            professionals={business?.professionals}
            professionalSelected={professionalSelected}
            handleChangeProfessionalSelected={handleChangeProfessionalSelected}
            handleUpdateProfessionals={handleUpdateProfessionals}
          />
        </ProfessionalFilterWrapper>
      ))
    }
    if (!section.visible && section.key !== 'menu' && section.key !== 'business_header') continue
    if (section.key === 'business_header') {
      push(section.key, (
        <BusinessBasicInformation
          navigation={navigation}
          businessState={businessState}
          openBusinessInformation={openBusinessInformation}
          header={header}
          logo={logo}
          isPreOrder={isPreOrder}
          currentCart={currentCart}
          categoryState={categoryState}
        />
      ))
    }
    if (section.key === 'free_delivery_banner' && showFreeDeliveryAwareness) {
      push(section.key, <FreeDeliveryProgress {...freeDeliveryProgress} variant='full' />)
    }
    if (section.key === 'offers_banner' && !!businessState?.business?.id) {
      push(section.key, (
        <PageBanner position='app_business_page' businessId={businessState?.business?.id} navigation={navigation} />
      ))
    }
    // `student_selector` is drawn over the products (below).
    if (section.key !== 'menu') continue
    if (showMenu && !(business?.categories?.length === 0)) {
      push('category_bar', (
        <BusinessProductsCategories
          categories={menuCategories}
          categorySelected={categorySelected}
          onClickCategory={handleChangeCategory}
          featured={featuredProducts}
          openBusinessInformation={openBusinessInformation}
          scrollToCategory={scrollToCategory}
          selectedCategoryId={selectedCategoryId}
          lazyLoadProductsRecommended={business?.lazy_load_products_recommended}
          setSelectedCategoryId={setSelectedCategoryId}
          setCategoryClicked={setCategoryClicked}
          stuck={isCategoryBarStuck}
          onBarLayout={setCategoryBarHeight}
        />
      ))
    }
    if (showMenu || (loading && !error)) {
      // The menu's rows go here (no node: the list renders them from its data).
      pageKeys.push(MENU)
      if (showMenu && business?.vertical === 'school') {
        pageNodes.student_selector = (
          <MenuSides>
            <StudentSelector business={business} navigation={navigation} />
          </MenuSides>
        )
      }
    }
  }
  const hasStudentSelector = !!pageNodes.student_selector
  const pageKeysId = pageKeys.join('|')
  const listRows = useMemo(() => {
    const rows: PageRow[] = []
    for (const key of pageKeysId.split('|')) {
      if (key !== MENU) {
        if (key) rows.push({ kind: 'section', key })
        continue
      }
      rows.push(MENU_TOP_ROW)
      if (hasStudentSelector) rows.push({ kind: 'section', key: 'student_selector' })
      for (const row of menuRows) rows.push(row)
      rows.push(MENU_END_ROW)
    }
    return rows
  }, [pageKeysId, hasStudentSelector, menuRows])
  listRowsRef.current = listRows
  // Before the list renders: it asks for its rows' layout while it does.
  useMemo(() => layouts.current.setRows(listRows), [listRows])
  const stickyIndex = indexOf('category_bar', pageKeys)
  const stickyHeaderIndices = useMemo(() => stickyIndex === -1 ? [] : [stickyIndex], [stickyIndex])

  // The rows above the category bar, measured: the bar sticks once the scroll passes them.
  const sectionHeights = useRef<Record<string, number>>({})
  const sectionsAboveBar = useRef<string[] | null>(null)
  const measureBarTop = useCallback(() => {
    const above = sectionsAboveBar.current
    let top = 0
    for (const key of above ?? []) top += sectionHeights.current[key] ?? NaN
    scrollState.current.barTop = above && !Number.isNaN(top) ? top : null
  }, [])
  sectionsAboveBar.current = stickyIndex === -1 ? null : pageKeys.slice(0, stickyIndex)
  measureBarTop()
  const onSectionLayout = useCallback((key: string, height: number) => {
    layouts.current.measure(key, 'section', height)
    if (sectionHeights.current[key] === height) return
    sectionHeights.current[key] = height
    measureBarTop()
  }, [measureBarTop])
  const pageSections = { nodes: pageNodes, onSectionLayout }

  const renderRow = useCallback(({ item }: { item: PageRow }) => {
    if (item.kind === 'section') return <PageSection name={item.key} />
    if (item.kind === 'menu_top') return <MenuTop onLayout={(event: any) => onRowLayout(item.key, item.kind, event.nativeEvent.layout.height)} />
    if (item.kind === 'menu_end') return <MenuEnd onLayout={(event: any) => onRowLayout(item.key, item.kind, event.nativeEvent.layout.height)} />
    return (
      <MenuRowView
        sides
        onHeight={onRowLayout}
        row={item}
        quantity={item.kind === 'product' ? cartQuantities[item.product?.id] ?? 0 : 0}
        menu={menu}
      />
    )
  }, [cartQuantities, menu, onRowLayout])

  return (
    <>
      {business?.vertical === 'school' && (
        <StudentOnboardingPopup business={business} navigation={navigation} />
      )}
      <View style={styles.mainContainer}>
        <HeaderWrapper flush={coverFullWidth}>
          <HeaderContent
            navigation={navigation}
            businessId={business?.id}
            title={business?.name}
            hideAddress
            collapseControls={showTitle}
            onHandleCart={viewOrderButtonVisible && handleViewOrder}
            onGoBack={showBack ? () => props.onGoBack?.() : undefined}
            fillable
            coversInset
            centerTitle
            flush={coverFullWidth}
            hideOrderType={themeVisible(theme, 'business.order_type_switch') && theme.values.visibility['business.header.order_type'] !== true}
          />
        </HeaderWrapper>
        <PageSectionsContext.Provider value={pageSections}>
          <FlatList
            ref={listRef}
            data={listRows}
            renderItem={renderRow}
            keyExtractor={rowKey}
            stickyHeaderIndices={stickyHeaderIndices}
            style={styles.mainContainer}
            onScroll={handlePageScroll}
            onScrollBeginDrag={handleTouchDrag}
            onViewableItemsChanged={handleViewableRows}
            onEndReached={handleEndReached}
            onEndReachedThreshold={END_REACHED_SCREENS}
            viewabilityConfig={VIEWABILITY}
            getItemLayout={getRowLayout}
            maintainVisibleContentPosition={KEEP_VISIBLE_ROWS}
            onLayout={handleListLayout}
            windowSize={WINDOW_SIZE}
            maxToRenderPerBatch={BATCH_SIZE}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            bounces={false}
            removeClippedSubviews={false}
          />
        </PageSectionsContext.Provider>
        {viewOrderButtonVisible && showCartBar && (
          <View style={{ marginBottom: 0 }}>
            <FreeDeliveryProgress {...freeDeliveryProgress} variant='compact' />
            <FloatingButton
              containerStyle={{ position: 'relative' }}
              text={
                openUpselling
                  ? t('LOADING', 'Loading')
                  : hasNoReservation
                    ? t('MISSING_RESERVATION', 'Missing Reservation')
                    : !belowMinimum
                      ? `${t('VIEW_ORDER', 'View Order')} · ${parsePrice(showCartBarFees ? currentCart?.total : productsTotal)}`
                      : `${t('MINIMUN_SUBTOTAL_ORDER', 'Minimum subtotal order:')} ${parsePrice(currentCart?.minimum)}`
              }
              // isSecondaryBtn={subtotalWithTaxes < currentCart?.minimum || openUpselling || hasNoReservation}
              // btnLeftValueShow={subtotalWithTaxes >= currentCart?.minimum && currentCart?.products?.length > 0}
              // btnRightValueShow={subtotalWithTaxes >= currentCart?.minimum && currentCart?.products?.length > 0}
              // btnLeftValue={currentCart?.products.reduce((prev: number, product: any) => prev + product.quantity, 0)}
              // btnRightValue={parsePrice(currentCart?.total)}
              disabled={!openMultiCart && (belowMinimum || openUpselling || hasNoReservation)}
              handleClick={handleViewOrder}
              leading={hasCartBarImage
                ? <CartBarImage count={currentCart?.products?.reduce((sum: number, product: any) => sum + (product?.quantity || 0), 0) || 0} />
                : undefined}
            />
          </View>
        )}
        {openUpselling && (
          <UpsellingRedirect
            businessId={currentCart?.business_id}
            business={currentCart?.business}
            cartProducts={currentCart?.products}
            cart={currentCart}
            setOpenUpselling={setOpenUpselling}
            handleUpsellingPage={handleUpsellingPage}
            handleCloseUpsellingPage={handleCloseUpsellingPage}
            openUpselling={openUpselling}
            canOpenUpselling={canOpenUpselling}
            setCanOpenUpselling={setCanOpenUpselling}
            onRedirect={onRedirect}
          />
        )}
        <Alert
          open={alertState?.open || false}
          title=''
          content={alertState?.content || [t('NOT_AVAILABLE_PRODUCTS', 'These products are not available.')]}
          onAccept={() => setAlertState({ open: false, content: [] })}
          onClose={() => setAlertState({ open: false, content: [] })}
        />
      </View>
      <OModal
        open={openService}
        onClose={() => setOpenService(false)}
      >
        <ServiceForm
          navigation={navigation}
          product={currentProduct}
          businessSlug={business?.slug}
          businessId={business?.id}
          professionalList={business?.professionals}
          professionalSelected={professionalSelected}
          handleChangeProfessional={handleChangeProfessionalSelected}
          handleUpdateProfessionals={handleUpdateProfessionals}
          onSave={() => setOpenService(false)}
          onClose={() => setOpenService(false)}
        />
      </OModal>
    </>
  )
}

export const BusinessProductsListing = (props: BusinessProductsListingParams) => {
  const businessProductslistingProps = {
    ...props,
    isForceSearch: Platform.OS === 'ios',
    isApp: true,
    // Closed store in ASAP: the controller retries with ignore_menu_schedule=1 so the full menu shows.
    showMenuWhenClosed: true,
    productsPageSize: MENU_PAGE_SIZE,
    ignoreSlugToCompare: isNaN(Number(props.slug)),
    UIComponent: BusinessProductsListingUI
  }
  return (
    <BusinessAndProductList {...businessProductslistingProps} />
  )
}
