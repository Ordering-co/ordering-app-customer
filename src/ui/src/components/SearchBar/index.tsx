import React, { useMemo, useRef, useState } from 'react'
import { StyleSheet, TouchableOpacity, Pressable, type TextInputInstance } from 'react-native'
import { useTheme } from 'styled-components/native';

import { useLanguage } from '@components'
import OInput from '../shared/OInput'
import OButton from '../shared/OButton'
import Icon from '../shared/Icon'
import { nativeBoxStyle, nativeTextStyle, themeOpacity, themePart, themeSpace } from '@/theme/helpers'

/**
 * A search field: the input with the look of `components.search_bar`
 * (size `md`), a search icon and a clear button.
 */
/** The field's search icon: `OInput` mounts it as a component, so it lives here, stable. */
const SearchIcon = () => {
  const theme: any = useTheme();
  return <Icon name='search' size={theme.native.components.input.base.icon_size} color={theme.native.components.input.base.icon_color} />
}

export const SearchBar = (props: any) => {
  const {
    searchValue,
    placeholder,
    onSearch,
    onChangeText,
    onCancel,
    lazyLoad,
    isCancelButtonShow,
    isCancelXButtonShow,
    height,
    inputStyle,
    onPress,
    isDisabled,
    iconCustomRight,
    onSubmitEditing,
    containerStyles,
    hideIcon,
    autoFocus
  } = props

  const theme: any = useTheme();
  const InputRef = useRef<TextInputInstance>(null)
  const [isFocused, setIsFocused] = useState(false)

  const styles = useMemo(() => {
    const search = theme.native.components.search_bar
    // No focus border of its own (none, or zero wide): the resting border stays.
    const focus = themePart(theme, 'search_bar', 'variants.default.states.focus.border')
    const slop = themeSpace(theme, 'sm')
    return {
      slop: { top: slop, bottom: slop, left: slop, right: slop },
      pressed: themeOpacity(theme, 'pressed'),
      ...StyleSheet.create({
        container: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: themeSpace(theme, 'sm')
        },
        field: {
          flex: 1,
          minHeight: search.sizes.md.height,
          marginBottom: 0,
          borderRadius: search.base.radius,
          ...nativeBoxStyle(search.base)
        },
        disabled: nativeBoxStyle(search.variants.default.states.disabled),
        // While typing: the focus state's border (`states.focus.border`).
        focused: focus && focus.borderWidth ? focus : {},
        text: { ...nativeTextStyle(search.base.text), color: search.base.text_color }
      })
    }
  }, [theme])

  const [, t] = useLanguage()

  const handleClear = () => {
    onChangeText?.('')
    onSearch('')
    InputRef.current?.clear()
  }

  let timeout: null | any = null
  const onChangeSearch = (e: any) => {
    // What the field shows, at once (`onSearch` waits for the pause with `lazyLoad`).
    onChangeText?.(e)
    if (!lazyLoad) {
      onSearch(e)
    } else {
      clearTimeout(timeout)
      timeout = setTimeout(function () {
        onSearch(e)
      }, 750)
    }
  }

  return (
    <Pressable style={[styles.container, containerStyles, height ? { height } : null]}>
      <OInput
        autoFocus={autoFocus}
        value={searchValue}
        placeholder={placeholder}
        customIcon={!hideIcon ? SearchIcon : undefined}
        isDisabled={isDisabled}
        returnKeyType='done'
        clearButtonMode={!isCancelXButtonShow ? "while-editing" : "never"}
        onPress={() => onPress && onPress()}
        style={[styles.field, isFocused && styles.focused, isDisabled && styles.disabled] as any}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        inputStyle={[styles.text, inputStyle] as any}
        iconCustomRight={isCancelXButtonShow ? (
          <TouchableOpacity
            onPress={onCancel || handleClear}
            hitSlop={styles.slop}
            activeOpacity={styles.pressed}
            accessibilityRole='button'
            accessibilityLabel={t('CLEAR', 'Clear')}
          >
            <Icon name='close-circle' size={theme.native.components.input.base.icon_size} color={theme.native.components.input.base.icon_color} />
          </TouchableOpacity>
        ) : iconCustomRight}
        onSubmitEditing={() => onSubmitEditing && onSubmitEditing()}
        onChange={onChangeSearch}
        forwardRef={InputRef}
      />
      {isCancelButtonShow && (
        <OButton
          text={t('CANCEL', 'Cancel')}
          appearance='ghost'
          size='sm'
          onClick={onCancel || handleClear}
        />
      )}
    </Pressable>
  )
}
