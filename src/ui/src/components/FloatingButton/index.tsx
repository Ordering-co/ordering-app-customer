import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from 'styled-components/native'
import { isOpaque, nativeShadowStyle, themeBottomSpace, themePart, themeSpace } from '@/theme/helpers'

import { Container } from './styles'
import { FloatingButtonParams } from '../../types'
import { OButton } from '../shared'

export const FloatingButton = (props: FloatingButtonParams) => {
  const {
    text,
    loading,
    disabled,
    handleClick,
    hideBtn,
    text2nd,
    loading2nd,
    disabled2nd,
    classBtn,
    classBtn2,
    btnProps,
    secondElement,
    flexDirection = 'column',
    reverseOrder = false,
    handle2ndClick,
    leading,
    joinedBackground,
    look
  } = props

  const { bottom } = useSafeAreaInsets()
  const theme: any = useTheme()

  // `components.bottom_bar`: its top border and shadow; the space between and
  // under the buttons (over the safe-area inset) from the space scale.
  const styles = useMemo(() => {
    const bar = theme.native.components.bottom_bar.base
    const line = bar.border_top
    return StyleSheet.create({
      bar: {
        ...(line ? { borderTopWidth: line.borderWidth, borderTopColor: line.borderColor } : {}),
        ...nativeShadowStyle(bar.shadow),
      },
      row: { gap: themeSpace(theme, 'lg') },
      leadRow: { flexDirection: 'row', alignItems: 'center', gap: themeSpace(theme, 'sm') },
      leadButton: { flex: 1 },
      joinedLead: { flex: 1, alignItems: 'flex-start', paddingLeft: themeSpace(theme, 'sm') },
      joined: { gap: 0, borderRadius: themePart(theme, 'button', 'base.radius') },
      stacked: { paddingTop: themeSpace(theme, 'sm') },
    })
  }, [theme])

  // The main action: `bottom_bar.slots.button` (size, color, appearance); a `classBtn` keeps its own look.
  const action = look ?? theme.native.components.bottom_bar.slots.button
  const actionLook = classBtn ? { class: classBtn, size: action.size } : { size: action.size, color: action.color, appearance: action.appearance }

  const second = theme.native.components.bottom_bar.slots.secondary
  const secondLook = classBtn2 === 'secondary'
    ? { size: second.size, color: second.color, appearance: second.appearance }
    : { class: classBtn2 }

  const hasSecond = !!(text2nd || secondElement)
  const joined = !!theme.native.components.bottom_bar.base.joined && (!!leading || hasSecond)
  const secondFill = !secondElement && classBtn2 === 'secondary'
    ? themePart(theme, 'button', `variants.${second.color}.${second.appearance}`)?.background
    : undefined
  const joinedFill = [joinedBackground, secondFill, theme.native.components.bottom_bar.base.joined_background].find(isOpaque)
  const joinedStyle = joined ? [styles.joined, !!joinedFill && { backgroundColor: joinedFill }] : undefined

  const isRow = flexDirection === 'row'
  const finalDirection: any = `${flexDirection}${reverseOrder ? '-reverse' : 'column'}`

  const buttonStyle = { flex: isRow ? 1 : 0, ...btnProps?.style }

  return (
    <Container
      style={[
        styles.bar,
        // Over the shared minimum (`themeBottomSpace`), and never under the bar's own `lg`.
        { paddingBottom: Math.max(themeBottomSpace(theme, bottom), themeSpace(theme, 'lg')) },
        props.containerStyle
      ]}>
      <View style={[
        { width: '100%' },
        isRow && styles.row,
        isRow && { flexDirection: finalDirection, alignItems: 'center' },
        isRow && hasSecond && joinedStyle
      ]}>
        {!hideBtn && (
          <View style={[{ flex: isRow ? 1 : 0 }, !!leading && styles.leadRow, !!leading && joinedStyle]}>
            {joined && !!leading ? <View testID='bottom-bar-joined-lead' style={styles.joinedLead}>{leading}</View> : leading}
            <View style={leading ? styles.leadButton : undefined}>
              {!loading && (
                <OButton
                  text={text}
                  {...actionLook}
                  style={buttonStyle}
                  disabled={disabled}
                  onClick={handleClick}
                />
              )}
              {loading && (
                <OButton loading={loading} text={text} {...actionLook} style={buttonStyle} />
              )}
            </View>
          </View>
        )}
        {(text2nd || secondElement) && (
          <View style={[
            { flex: isRow ? 1 : 0, width: isRow ? 'auto' : '100%' },
            !isRow && styles.stacked
          ]}>
            {secondElement}
            {!loading2nd && !secondElement && (
              <OButton
                text={text2nd}
                {...secondLook}
                disabled={disabled2nd}
                onClick={handle2ndClick}
              />
            )}
            {loading2nd && !secondElement && (
              <OButton loading text={text2nd} {...secondLook} />
            )}
          </View>
        )}
      </View>
    </Container>
  )
}
