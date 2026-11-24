import React, { useEffect, useState, useRef, useCallback } from 'react'
import { KeyboardAvoidingView, Keyboard, Platform, RefreshControl, ScrollView, StyleSheet, View, TextInput as RNTextInput, type ScrollViewInstance } from 'react-native'
import { useTheme } from 'styled-components/native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { themeColor, themePart } from '../theme/helpers'

export const SafeAreaViewWrapper = (props: any) => {
  const theme: any = useTheme()
  const insets = useSafeAreaInsets()
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const scrollRef = useRef<ScrollViewInstance>(null)
  const scrollOffsetY = useRef(0)

  useEffect(() => {
    if (Platform.OS !== 'android') return

    const showListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height)

      try {
        const focusedInput = (RNTextInput as any).State?.currentlyFocusedInput?.()
        if (!focusedInput || !scrollRef.current) return

        focusedInput.measureInWindow((_x: number, y: number, _w: number, h: number) => {
          const keyboardTop = e.endCoordinates.screenY
          const inputBottom = y + h

          if (inputBottom > keyboardTop - 20) {
            const scrollAmount = inputBottom - keyboardTop + 80
            scrollRef.current?.scrollTo?.({
              y: scrollOffsetY.current + scrollAmount,
              animated: true,
            })
          }
        })
      } catch {}
    })

    const hideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0)
    })

    return () => {
      showListener.remove()
      hideListener.remove()
    }
  }, [])

  const handleScroll = useCallback((event: any) => {
    scrollOffsetY.current = event.nativeEvent.contentOffset.y
  }, [])

  // The page canvas (`color.background`) between the safe-area insets.
  const background = props.backgroundColor ?? themeColor(theme, 'background')
  const fillInset = !!props.pt && !!props.headerInset && !!props.disableScrollView && themePart(theme, 'header', 'base.fill_listing')
  const styles = React.useMemo(() => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: background },
    flex: { flex: 1 },
    container: {
      backgroundColor: themeColor(theme, 'background'),
      paddingTop: props.pt && !fillInset ? insets.top : 0,
      paddingBottom: props.pb ? insets.bottom : 0
    },
    headerInset: {
      height: insets.top,
      backgroundColor: themePart(theme, 'header', 'base.background')
    }
  }), [theme, background, fillInset, props.pt, props.pb, insets.top, insets.bottom])

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        {...(Platform.OS === 'ios' ? { behavior: 'padding' } : {})}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {props.disableScrollView ? (
          <View style={[styles.container, styles.flex]}>
            {fillInset && props.headerInset !== 'band' && <View testID='header-inset' style={styles.headerInset} />}
            {props.children}
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            keyboardShouldPersistTaps='handled'
            {...props.onRefresh && {
              refreshControl: (
                <RefreshControl
                  refreshing={props.refreshing}
                  onRefresh={props.onRefresh}
                />
              )
            }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.container}
          >
            {props.children}
            {Platform.OS === 'android' && keyboardHeight > 0 && (
              <View style={{ height: keyboardHeight }} />
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
