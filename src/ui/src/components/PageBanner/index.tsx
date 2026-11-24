import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  LayoutChangeEvent,
} from 'react-native'
import { Fade, Placeholder, PlaceholderLine } from '@/ui/src/components/shared/Skeleton';
import { Pager, PagerDots } from '../Pager';
import FastImage from 'react-native-fast-image';

import { BannerDots, PageBannerWrapper } from './styles'
import { useTheme } from 'styled-components/native'
import { useEvent, PageBanner as PageBannerController } from '@components'
import { nativeBoxStyle, themeColor, themeOpacity, themeSpace } from '@/theme/helpers'
import { imageUrl } from '@/utils/imageUrl'

const PageBannerUI = (props: any) => {
  const {
    pageBannerState,
    navigation,
    flush
  } = props

  const theme: any = useTheme()
  const banner = theme.native.components.banner.base
  const [events] = useEvent()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [viewedBanner, setViewedBanner] = useState<any>(null)

  const windowWidth = Dimensions.get('window').width
  /** The page's two sides until the wrapper measures itself (onLayout). */
  const BANNER_HORIZONTAL_GUTTER = theme.native.tokens.layout.page_gutter * 2
  // The banner's height is the layout of the slide images (≈ 16:6 at phone width).
  const BANNER_HEIGHT = 162
  /** Each banner stays six seconds before the next (the former swiper's delay). */
  const BANNER_AUTOPLAY_MS = 6000
  const bannerRadius = banner.radius
  const [slideWidth, setSlideWidth] = useState(windowWidth - BANNER_HORIZONTAL_GUTTER)

  const styles = StyleSheet.create({
    slideClip: {
      overflow: 'hidden',
    },
    sliderWrapper: {
      height: BANNER_HEIGHT,
      borderRadius: bannerRadius,
      overflow: 'hidden',
      ...nativeBoxStyle({ border: banner.border })
    },
    bannerImage: {
      height: BANNER_HEIGHT
    },
    swiper: {
      overflow: 'hidden',
      // `flex: 1` of the pager's container gives it a basis of 0: without `auto` the
      // width we set is ignored and the pager collapses to nothing.
      flexGrow: 0,
      flexShrink: 0,
      flexBasis: 'auto',
    }
  })

  const handleWrapperLayout = (event: LayoutChangeEvent) => {
    const w = Math.round(event.nativeEvent.layout.width)
    if (w <= 0) {
      return
    }
    setSlideWidth((prev) => (prev !== w ? w : prev))
  }

  const onRedirect = useCallback((route: string, params?: any) => {
    navigation.push(route, params)
  }, [navigation])

  const handleGoToPage = useCallback(
    (item: any) => {
      const action = item.action
      if (!action?.url) return
      let slug
      if (action.type === 'business') {
        slug = action.url.split('store/')[1]
        onRedirect('Business', {
          store: slug,
        })
      }
      if (action.type === 'product') {
        slug = action.url.split('store/')[1]?.split('?')[0]
        onRedirect('ProductDetails', {
          businessSlug: slug,
          businessId: action.business_id,
          categoryId: action.category_id,
          productId: action.product_id,
          isRedirect: 'business',
          business: {
            store: slug,
          },
        })
      }
      const clickedBanner = pageBannerState.result.find((banner: any) => banner.id === item?.banner_id)
      events.emit('promotion_clicked', clickedBanner)
    },
    [onRedirect, pageBannerState.result, events],
  )

  const renderBannerItem = useCallback(
    ({ item }: { item: any }) => {
      return (
        <View style={[styles.slideClip, { width: slideWidth }]}>
          <TouchableOpacity
            activeOpacity={themeOpacity(theme, 'pressed')}
            style={{ width: slideWidth }}
            onPress={() => handleGoToPage(item)}
          >
            <View style={[styles.sliderWrapper, { width: slideWidth }]}>
              <FastImage
                style={[styles.bannerImage, { width: slideWidth }]}
                objectFit='cover'
                source={{
                  uri: imageUrl(item.url, { width: slideWidth, height: BANNER_HEIGHT }),
                }}
              />
            </View>
          </TouchableOpacity>
        </View>
      )
    },
    [slideWidth, handleGoToPage, styles.bannerImage, styles.sliderWrapper, styles.slideClip, BANNER_HEIGHT],
  )

  const handleChangeIndex = (index: number) => {
    setCurrentIndex(index)
  }

  const slides = pageBannerState.banner?.items ?? []

  useEffect(() => {
    if (pageBannerState.loading) return
    if (pageBannerState.banner?.items && pageBannerState.banner?.items.length > 0) {
      const bannerId = pageBannerState.banner.items[currentIndex]?.banner_id
      if (pageBannerState.result && bannerId) {
        const _viewedBanner = pageBannerState.result.find((banner: any) => banner.id === bannerId)
        if (_viewedBanner?.id !== viewedBanner?.id) {
          setViewedBanner(_viewedBanner)
          events.emit('promotion_viewed', _viewedBanner)
        }
      }
    }
  }, [pageBannerState.loading, currentIndex, viewedBanner])

  return (
    <>
      {pageBannerState.loading ? (
        <PageBannerWrapper $flush={flush}>
          <Placeholder Animation={Fade}>
            <PlaceholderLine
              height={BANNER_HEIGHT}
              noMargin
              color={theme.native.components.skeleton.base.color}
              style={{ borderRadius: bannerRadius }}
            />
          </Placeholder>
        </PageBannerWrapper>
      ) : (
        <>
          {slides.length > 0 && (
            <PageBannerWrapper $flush={flush} onLayout={handleWrapperLayout}>
              <Pager
                testID="page-banner-pager"
                style={[styles.swiper, { width: slideWidth }]}
                pageWidth={slideWidth}
                data={slides}
                renderItem={renderBannerItem}
                keyExtractor={(item: any, index: number) => {
                  const id = item?.banner_id ?? item?.id
                  return id != null ? `page-banner-${String(id)}-${index}` : `page-banner-slot-${index}`
                }}
                initialIndex={currentIndex}
                onIndexChange={handleChangeIndex}
                autoplayMs={BANNER_AUTOPLAY_MS}
                renderOverlay={({ index, count, goTo }) => (
                  <BannerDots pointerEvents='box-none'>
                    <PagerDots
                      count={count}
                      index={index}
                      onPress={goTo}
                      size={themeSpace(theme, 'sm')}
                      color={themeColor(theme, 'text_muted')}
                      activeColor={themeColor(theme, 'on_overlay')}
                    />
                  </BannerDots>
                )}
              />
            </PageBannerWrapper>
          )}
        </>
      )}
    </>
  )
}

export const PageBanner = (props: any) => {
  const pageBannerProps = {
    ...props,
    UIComponent: PageBannerUI
  }
  return <PageBannerController {...pageBannerProps} />
}
