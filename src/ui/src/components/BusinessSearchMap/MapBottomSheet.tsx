import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react'
import { Animated, FlatList, PanResponder, StyleSheet } from 'react-native'
import { useTheme } from 'styled-components/native'
import { BusinessController } from '@ui'
import OText from '../shared/OText'
import { BusinessCardSkeleton } from '../BusinessController/BusinessCardSkeleton'
import { nativeShadowStyle, nativeTextStyle, themeBorder, themeGutter, themeMotion, themeSpace } from '@/theme/helpers'
import {
  SheetContainer,
  SheetHandleArea,
  SheetGrabber,
  SheetCardWrapper,
  SHEET_COLLAPSED_TRANSLATE_Y
} from './styles'

const COLLAPSED_TRANSLATE_Y = SHEET_COLLAPSED_TRANSLATE_Y
// Pixels of drag before the sheet follows the finger (gesture, not a design value).
const DRAG_ACTIVATION = 6

export interface MapBottomSheetHandle {
  expand: () => void
  collapse: () => void
  scrollToBusiness: (index: number) => void
}

interface MapBottomSheetProps {
  businesses: any[]
  loading: boolean
  title: string
  selectedBusinessId: number | string | null
  orderType: number
  onCardPress: (business: any) => void
  onBusinessClick: (business: any) => void
  handleUpdateBusinessList?: (id: any, changes: any, status: any) => void
  onEndReached: () => void
  navigation?: any
}

const MapBusinessCard = React.memo(({ business, orderType, selected, selectedStyle, onCardPress, onBusinessClick, navigation, handleUpdateBusinessList }: any) => (
  <SheetCardWrapper style={selected ? selectedStyle : null}>
    <BusinessController
      businessListingSearchview
      business={business}
      isBusinessOpen={business.open}
      onCardSelect={onCardPress}
      onBusinessClick={onBusinessClick}
      navigation={navigation}
      orderType={orderType}
      handleUpdateBusinessList={handleUpdateBusinessList}
    />
  </SheetCardWrapper>
))

export const MapBottomSheet = forwardRef<MapBottomSheetHandle, MapBottomSheetProps>(({
  businesses,
  loading,
  title,
  selectedBusinessId,
  orderType,
  onCardPress,
  onBusinessClick,
  handleUpdateBusinessList,
  onEndReached,
  navigation
}, ref) => {
  const theme: any = useTheme()
  const styles = useMemo(() => {
    const sheet = theme.native.components.sheet.base
    return StyleSheet.create({
      sheet: nativeShadowStyle(sheet.shadow),
      title: { ...nativeTextStyle(sheet.title), color: sheet.title_color },
      list: { paddingHorizontal: themeGutter(theme), paddingBottom: themeSpace(theme, 'xl') },
      // The card the map's marker selected: a thick primary outline at the card's radius.
      selected: {
        ...themeBorder(theme, 'thick', 'primary', { fixed: true }),
        borderRadius: theme.native.components.business_card.base.radius
      }
    })
  }, [theme])
  const snapDuration = themeMotion(theme, 'slow').duration
  const translateY = useRef(new Animated.Value(COLLAPSED_TRANSLATE_Y)).current
  const restingOffsetRef = useRef(COLLAPSED_TRANSLATE_Y)
  const dragStartRef = useRef(COLLAPSED_TRANSLATE_Y)
  const listRef = useRef<FlatList>(null)

  const snapTo = useCallback((toValue: number) => {
    restingOffsetRef.current = toValue
    Animated.timing(translateY, {
      toValue,
      duration: snapDuration,
      useNativeDriver: true
    }).start()
  }, [translateY, snapDuration])

  useImperativeHandle(ref, () => ({
    expand: () => snapTo(0),
    collapse: () => snapTo(COLLAPSED_TRANSLATE_Y),
    scrollToBusiness: (index: number) => {
      if (index < 0) return
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0 })
    }
  }), [snapTo])

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_evt, gesture) => Math.abs(gesture.dy) > DRAG_ACTIVATION,
    onPanResponderGrant: () => {
      dragStartRef.current = restingOffsetRef.current
    },
    onPanResponderMove: (_evt, gesture) => {
      const next = Math.min(Math.max(dragStartRef.current + gesture.dy, 0), COLLAPSED_TRANSLATE_Y)
      translateY.setValue(next)
    },
    onPanResponderRelease: (_evt, gesture) => {
      const projected = dragStartRef.current + gesture.dy
      const draggingUp = gesture.vy < -0.5 || projected < COLLAPSED_TRANSLATE_Y / 2
      snapTo(draggingUp ? 0 : COLLAPSED_TRANSLATE_Y)
    }
  }), [snapTo, translateY])

  const renderItem = useCallback(({ item }: any) => (
    <MapBusinessCard
      business={item}
      orderType={orderType}
      selected={item.id === selectedBusinessId}
      selectedStyle={styles.selected}
      onCardPress={onCardPress}
      onBusinessClick={onBusinessClick}
      navigation={navigation}
      handleUpdateBusinessList={handleUpdateBusinessList}
    />
  ), [orderType, selectedBusinessId, styles, onCardPress, onBusinessClick, navigation, handleUpdateBusinessList])

  const keyExtractor = useCallback((item: any) => `${item.id}`, [])

  const handleScrollToIndexFailed = useCallback((info: { index: number, averageItemLength: number }) => {
    setTimeout(() => {
      listRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true })
    }, 60)
  }, [])

  return (
    <SheetContainer style={[styles.sheet, { transform: [{ translateY }] }]}>
      <SheetHandleArea {...panResponder.panHandlers}>
        <SheetGrabber />
        <OText style={styles.title} numberOfLines={1}>{title}</OText>
      </SheetHandleArea>
      <FlatList
        ref={listRef}
        data={businesses}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        extraData={selectedBusinessId}
        showsVerticalScrollIndicator={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        contentContainerStyle={styles.list}
        ListFooterComponent={loading ? <BusinessCardSkeleton variant='compact' count={3} /> : undefined}
      />
    </SheetContainer>
  )
})

MapBottomSheet.displayName = 'MapBottomSheet'
