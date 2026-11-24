import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { useTheme } from 'styled-components/native'
import { Fade, Placeholder, PlaceholderLine } from '@/ui/src/components/shared/Skeleton'

import { SubcategoriesComponentMemoized } from './SubcategoriesComponent'
import ONotice from '../shared/ONotice'
import { MenuRowBox, WrapperNotFound, CatWrap, CatIcon } from './styles'
import { FeaturedProducts } from './FeaturedProducts'
import { Ribbon } from '../SingleProductCard/Ribbon'
import { MenuRow } from './buildMenuRows'
import { nativeTextStyle, themePart, themeRadius, themeShadow, themeSpace, themeVisible, themeColor } from '@/theme/helpers'

import { useLanguage } from '@components'
import {
  OIcon, OText,
  NotFoundSource,
  SingleProductCard,
  OrderItAgain
} from '@ui'
import { IMAGE_REQUEST, imageUrl } from '@/utils/imageUrl'

/** What the rows of one menu share: the data the few non-product rows read and the handlers (stable). */
export interface MenuRowShared {
  businessId?: any
  businessSingleId?: any
  navigation?: any
  categoryState?: any
  currentCart?: any
  previouslyProducts?: any
  searchValue?: any
  subcategoriesSelected: any[]
  isFiltMode?: boolean
  onProductClick: (product: any) => void
  onClickCategory: (category: any) => void
  onClickSubcategory: (subCategory: any, parentCategory: any) => void
  handleUpdateProducts: (...args: any[]) => void
  handleSearchRedirect: () => void
  handleCancelSearch: () => void
}

interface MenuRowViewParams {
  row: MenuRow
  /** The product's units in the cart (product rows). */
  quantity: number
  menu: MenuRowShared
  /** On the page sides (a row of the screen's list; inside a container with its own sides, no). */
  sides?: boolean
  /** The row's height, each time it is laid out (with `sides`): the screen's list keeps where its rows are. */
  onHeight?: (key: string, kind: string, height: number) => void
}

/** A menu category is a section of the page: the app's section title, above the product names. */
const CategoryTitle = ({ category }: { category: any }) => {
  const theme: any = useTheme()
  // `visibility.business.categories.*`: each category's image and ribbon.
  const showCategoryImage = themeVisible(theme, 'business.categories.image')
  const showCategoryRibbon = themeVisible(theme, 'business.categories.ribbon')
  const styles = useMemo(() => StyleSheet.create({
    // The shadow sits on a box with a background: on a transparent image it shows through (a grey box on Android, a costly shadow on iOS).
    catIcon: { ...themeShadow(theme, 'sm'), backgroundColor: themeColor(theme, 'surface') },
    catTitle: { ...nativeTextStyle(themePart(theme, 'section_header', 'base.title')), color: themePart(theme, 'section_header', 'base.title_color'), flexShrink: 1 },
    catImage: { borderRadius: themeRadius(theme, 'sm') },
    ribbon: { marginLeft: themeSpace(theme, 'xs') }
  }), [theme])

  return (
    <CatWrap>
      {!!category.image && showCategoryImage && (
        <CatIcon style={styles.catIcon}>
          <OIcon
            url={imageUrl(category.image, { height: IMAGE_REQUEST.thumbnail })}
            width={41}
            height={41}
            style={styles.catImage}
          />
        </CatIcon>
      )}
      <OText style={styles.catTitle}>
        {category.name}
      </OText>
      {showCategoryRibbon && <Ribbon ribbon={category?.ribbon} style={styles.ribbon} />}
    </CatWrap>
  )
}

/** The card of a product that is loading. */
const ProductSkeleton = () => {
  const theme: any = useTheme()
  const styles = useMemo(() => StyleSheet.create({
    skeleton: { minHeight: 165, marginBottom: themeSpace(theme, 'xl'), padding: themeSpace(theme, 'sm') },
    skeletonInner: { padding: themeSpace(theme, 'xs') },
    skeletonRow: { flexDirection: 'row' },
    skeletonText: { paddingVertical: themeSpace(theme, 'sm'), flex: 1 },
    skeletonLine: { marginBottom: themeSpace(theme, 'md') },
    skeletonImage: { marginLeft: themeSpace(theme, 'sm'), marginBottom: themeSpace(theme, 'sm'), borderRadius: themePart(theme, 'skeleton', 'base.radius') },
    skeletonBlock: { borderRadius: themePart(theme, 'skeleton', 'base.radius') }
  }), [theme])

  return (
    <View style={styles.skeleton}>
      <Placeholder style={styles.skeletonInner} Animation={Fade}>
        <View style={styles.skeletonRow}>
          <Placeholder style={styles.skeletonText}>
            <PlaceholderLine width={60} style={[styles.skeletonBlock, styles.skeletonLine]} />
            <PlaceholderLine width={20} style={styles.skeletonBlock} />
          </Placeholder>
          <PlaceholderLine
            width={24}
            height={70}
            style={styles.skeletonImage}
          />
        </View>
        <PlaceholderLine
          height={52}
          style={styles.skeletonBlock}
        />
      </Placeholder>
    </View>
  )
}

const MenuRowContent = ({ row, quantity, menu }: MenuRowViewParams) => {
  const [, t] = useLanguage()

  switch (row.kind) {
    case 'product':
      return (
        <SingleProductCard
          isSoldOut={row.product.inventoried && !row.product.quantity}
          businessId={menu.businessId}
          product={row.product}
          categoryState={menu.categoryState}
          onProductClick={menu.onProductClick}
          handleUpdateProducts={menu.handleUpdateProducts}
          navigation={menu.navigation}
          productAddedToCartLength={quantity}
          businessSingleId={menu.businessSingleId}
        />
      )
    case 'category':
      return <CategoryTitle category={row.category} />
    case 'subcategories':
      return (
        <SubcategoriesComponentMemoized
          category={row.category}
          subcategoriesSelected={menu.subcategoriesSelected}
          onClickSubcategory={menu.onClickSubcategory}
        />
      )
    case 'more':
      return (
        <SingleProductCard
          useCustomFunctionality
          onCustomClick={() => menu.onClickCategory(row.category)}
          handleUpdateProducts={menu.handleUpdateProducts}
          customText={t('MORE', 'More')}
        />
      )
    case 'order_it_again':
      return (
        <OrderItAgain
          onProductClick={menu.onProductClick}
          productList={menu.previouslyProducts}
          businessId={menu.businessId}
          categoryState={menu.categoryState}
          navigation={menu.navigation}
          handleUpdateProducts={menu.handleUpdateProducts}
          currentCart={menu.currentCart}
          searchValue={menu.searchValue}
          businessSingleId={menu.businessSingleId}
        />
      )
    case 'featured_products':
      return (
        <FeaturedProducts
          businessId={menu.businessId}
          categoryState={menu.categoryState}
          currentCart={menu.currentCart}
          navigation={menu.navigation}
          businessSingleId={menu.businessSingleId}
          onProductClick={menu.onProductClick}
          handleUpdateProducts={menu.handleUpdateProducts}
        />
      )
    case 'skeleton':
      return <ProductSkeleton />
    case 'empty':
      return (
        <WrapperNotFound>
          <NotFoundSource
            content={
              !menu.searchValue
                ? t('ERROR_NOT_FOUND_PRODUCTS_TIME', 'No products found at this time')
                : t('ERROR_NOT_FOUND_PRODUCTS', 'No products found, please change filters.')
            }
            btnTitle={
              !menu.searchValue
                ? t('SEARCH_REDIRECT', 'Go to Businesses')
                : t('CLEAR_FILTERS', 'Clear filters')
            }
            onClickButton={!menu.businessSingleId
              ? () => !menu.searchValue ? menu.handleSearchRedirect() : menu.handleCancelSearch()
              : null
            }
          />
        </WrapperNotFound>
      )
    case 'error':
      return <ONotice variant='danger'>{`${t('ERROR', 'Error')}: ${row.message}`}</ONotice>
    default:
      return null
  }
}

/**
 * A menu's rows are many and its shared data changes with the cart and with
 * each page of products: a product row renders again only when its product or
 * its units in the cart change (its handlers are stable), a category title
 * only with its category, a skeleton never; the few rows left (subcategories,
 * order it again, featured, the empty state) follow the shared data.
 */
export const areMenuRowsEqual = (prev: MenuRowViewParams, next: MenuRowViewParams) => {
  if (prev.row.kind !== next.row.kind || prev.sides !== next.sides) return false
  switch (next.row.kind) {
    case 'product':
      return (prev.row as any).product === next.row.product && prev.quantity === next.quantity
    case 'category':
    case 'more':
      return (prev.row as any).category === next.row.category
    case 'skeleton':
      return true
    case 'error':
      return (prev.row as any).message === next.row.message
    case 'subcategories':
      return (prev.row as any).category === next.row.category && prev.menu === next.menu
    default:
      return prev.menu === next.menu
  }
}

/** One row of the menu. */
export const MenuRowView = React.memo((props: MenuRowViewParams) => props.sides
  ? (
    <MenuRowBox onLayout={props.onHeight && ((event: any) => props.onHeight?.(props.row.key, props.row.kind, event.nativeEvent.layout.height))}>
      <MenuRowContent {...props} />
    </MenuRowBox>
    )
  : <MenuRowContent {...props} />
, areMenuRowsEqual)
