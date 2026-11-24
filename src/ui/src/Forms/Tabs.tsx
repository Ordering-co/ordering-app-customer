import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from 'styled-components/native'
import { StyleSheet, ScrollView, Dimensions, Pressable, View } from 'react-native';

import { useLanguage } from '@components'
import { StableText } from '../components/shared/StableText'
import { nativeBoxStyle, nativeTextStyle, themeOpacity } from '@/theme/helpers'
const { width: screenWidth } = Dimensions.get('window');

/** The share (%) of a tab its underline spans, by `tabs.variants.underline.indicator_length` (as the web). */
const INDICATOR_LENGTHS: Record<string, number> = { full: 100, medium: 50, small: 25 }

/**
 * `components.tabs` in a variant: `pill` (a track with a filled selected tab),
 * `underline` (a baseline with an indicator under the selected tab) or
 * `plain`. Inside a group (`group`, e.g. `orders_page`), the group's slot
 * (`slot`, e.g. `tabs`) picks the size and the variant (null: the theme's
 * `base.variant`), and the group's `scope.tabs`, when it has one, is the look;
 * outside one, the theme's variant at size `md`.
 */
const tabsStyles = (theme: any, group?: string, slotName?: string) => {
  const components = theme.native.components
  const scoped = group ? components[group]?.scope?.tabs : null
  const ownLook = group === 'header' ? components.header.base.order_type_own_look === true : true
  const tabs = (scoped && ownLook && scoped) || components.tabs
  const slot = group && slotName ? components[group]?.slots?.[slotName] : null
  const variant = slot?.variant || tabs.base.variant
  const look = tabs.variants[variant] ?? tabs.variants.pill
  const size = tabs.sizes[slot?.size] ?? tabs.sizes.md
  const underline = variant === 'underline'
  // `indicator_length`: the share of the tab the underline spans, centered (full, medium, small).
  const indicatorShare = underline ? INDICATOR_LENGTHS[look.indicator_length] ?? INDICATOR_LENGTHS.full : INDICATOR_LENGTHS.full
  // `joined` (pill, no gap): one block, square inside, the tab radius only at its ends.
  const joined = variant === 'pill' && look.joined === true && (look.gap ?? 0) === 0
  return {
    joined,
    partialIndicator: indicatorShare < INDICATOR_LENGTHS.full,
    active: look.active,
    inactive: look.inactive,
    gap: (look.gap ?? 0) as number,
    sheet: StyleSheet.create({
      track: {
        flexDirection: 'row',
        gap: look.gap ?? 0,
        borderRadius: look.radius ?? 0,
        padding: look.inset ?? 0,
        ...nativeBoxStyle({ background: look.background, border: look.border }),
        ...(underline ? { borderBottomWidth: look.baseline.borderWidth, borderBottomColor: look.baseline.borderColor } : {}),
      },
      tab: {
        justifyContent: 'center',
        minHeight: size.height,
        paddingHorizontal: size.padding_x,
        borderRadius: look.tab_radius ?? 0,
        ...(look.tab_border ?? {}),
        // The full underline's room is kept on every tab: selecting only colors it.
        ...(underline && indicatorShare >= INDICATOR_LENGTHS.full ? { borderBottomWidth: look.indicator_thickness, borderBottomColor: 'transparent' } : {}),
      },
      selected: underline
        ? (indicatorShare < INDICATOR_LENGTHS.full ? {} : { borderBottomColor: look.indicator })
        : { backgroundColor: look.active_background },
      indicator: {
        position: 'absolute',
        bottom: 0,
        left: `${(INDICATOR_LENGTHS.full - indicatorShare) / 2}%`,
        width: `${indicatorShare}%`,
        height: look.indicator_thickness ?? 0,
        backgroundColor: look.indicator,
      },
      notFirst: { borderTopStartRadius: 0, borderBottomStartRadius: 0 },
      notLast: { borderTopEndRadius: 0, borderBottomEndRadius: 0 },
      // The selected tab keeps the size and is bold (`tabs` has no selected weight): `weight` paints the look's font at 700.
      text: { ...nativeTextStyle(tabs.base.text), textAlign: 'center' },
      pressed: { opacity: themeOpacity(theme, 'pressed') },
    }),
  }
}

export const Tabs = (props: any) => {
  const {
    defaultTab,
    isOtpEmail,
    defaultTabs,
    setFullItemAfterClick,
    isOtpCellphone,
    useLoginByEmail,
    useLoginByCellphone,
    useOtpEmail,
    useOtpCellphone,
    handleChangeTab,
    handleChangeOtpType,
    group,
    slot,
    stretch
  } = props

  const theme: any = useTheme()
  const [, t] = useLanguage()
  const look = useMemo(() => tabsStyles(theme, group, slot), [theme, group, slot])

  const tabs = defaultTabs ?? [
    { tab: 'email', type: 'email', enabled: useLoginByEmail, text: t('LOGIN_BY_EMAIL', 'By Email') },
    { tab: 'cellphone', type: 'cellphone', enabled: useLoginByCellphone, text: t('LOGIN_BY_PHONE', 'By Phone') },
    { tab: 'email', type: 'otp_email', enabled: useOtpEmail, text: t('LOGIN_BY_OTP_EMAIL', 'By OTP Email'), condition: isOtpEmail },
    { tab: 'cellphone', type: 'otp_cellphone', enabled: useOtpCellphone, text: t('LOGIN_BY_OTP_PHONE', 'By OTP Phone'), condition: isOtpCellphone }
  ]

  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollViewRef = useRef<any>(null);
  const [buttonWidths, setButtonWidths] = useState<number[]>([]);

  const handlePress = (index: any) => {
    setSelectedIndex(index);
  };

  useEffect(() => {
    if (scrollViewRef.current && buttonWidths.length > selectedIndex && buttonWidths[selectedIndex]) {
      let scrollX = 0;
      for (let i = 0; i < selectedIndex; i++) {
        scrollX += buttonWidths[i] + look.gap; // Consider the gap
      }

      const selectedButtonWidth = buttonWidths[selectedIndex] + look.gap;
      const centerPosition = scrollX - (screenWidth / 2) + (selectedButtonWidth / 2);

      scrollViewRef.current.scrollTo({ x: Math.max(0, centerPosition), animated: true });
    }
  }, [selectedIndex, buttonWidths, look]);

  const onButtonLayout = (event: any, index: any) => {
    const { width } = event.nativeEvent.layout;
    setButtonWidths(prevWidths => {
      const newWidths: number[] = [...prevWidths];
      newWidths[index] = width;
      return newWidths;
    });
  };

  useEffect(() => {
    const defaultTabIndex = defaultTabs?.findIndex((t: any) => t.type === defaultTab) ?? -1
    if (defaultTabIndex !== -1) {
      setSelectedIndex(defaultTabIndex)
    }
  }, [defaultTab])

  const track = (
    <View style={look.sheet.track}>
      {tabs.filter((t: any) => t.enabled).map((tab: any, index: any, shown: any[]) => {
        const selected = tab?.condition ?? defaultTab === tab.type
        return (
          <Pressable
            key={index}
            accessibilityRole='tab'
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              look.sheet.tab,
              stretch && styles.stretched,
              selected && look.sheet.selected,
              look.joined && index > 0 && look.sheet.notFirst,
              look.joined && index < shown.length - 1 && look.sheet.notLast,
              pressed && look.sheet.pressed,
            ]}
            onPress={() => {
              handlePress(index)
              tab.type?.includes?.('otp') && handleChangeOtpType
                ? handleChangeOtpType(tab.tab)
                : handleChangeTab(setFullItemAfterClick ? tab : tab.type)
            }}
            onLayout={(event: any) => onButtonLayout(event, index)}
          >
            {/* Bold when selected, in the room of its bold copy: selecting never moves the tabs. */}
            <StableText
              style={look.sheet.text}
              weight={selected ? 'bold' : undefined}
              reserveWeight='bold'
              color={selected ? look.active : look.inactive}
            >
              {tab.text}
            </StableText>
            {selected && look.partialIndicator && <View style={look.sheet.indicator} />}
          </Pressable>
        )
      })}
    </View>
  )

  if (stretch) return track

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal={true}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
    >
      {track}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollContainer: {
    alignItems: 'center',
  },
  stretched: {
    flex: 1
  }
});
