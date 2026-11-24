import React, { useMemo, useRef, useState } from 'react';
import { View, Image, StyleSheet, Pressable } from 'react-native';
import { useTheme } from 'styled-components/native';
import { SafeAreaView } from 'react-native-safe-area-context'

import { useLanguage } from '@components';
import { _setStoreData, DeviceOrientationMethods, OText } from '@ui';
import Icon from '@/ui/src/components/shared/Icon';
import { Pager, PagerDots, PagerHandle } from '@/ui/src/components/Pager';
import { nativeBoxStyle, nativeTextStyle, themeColor, themeImage, themePart, themeSpace } from '@/theme/helpers';
import { usePageSections } from '@/theme/sections';

const { useDeviceOrientation } = DeviceOrientationMethods

/** `onDone`: the tutorial is over (seen or skipped); the navigator then leaves it. */
const IntroductoryTutorial = ({ onDone }: { onDone: () => void }) => {
  const [, t] = useLanguage();
  const theme: any = useTheme();
  const [orientationState] = useDeviceOrientation();
  const [showSkipButton, setShowSkipButton] = useState(true)
  const pagerRef = useRef<PagerHandle>(null)

  const WIDTH_SCREEN = orientationState?.dimensions?.width
  const HEIGHT_SCREEN = orientationState?.dimensions?.height

  const data = [
    {
      key: 'slide_1',
      title: t('DELIVERY_BY_ADDRESS', 'Login, Signup or Continue as a guest'),
      text: t('DELIVERY_BY_ADDRESS_INST', 'This step is to recognize you and understand who are we delivering to.'),
      image: themeImage(theme, 'onboarding.slide_1'),
    },
    {
      key: 'slide_2',
      title: t('SELECT_A_BUSINESS', 'Select a Business'),
      text: t('SELECT_A_BUSINESS_INST', 'Choose a store of your preference according to your location.'),
      image: themeImage(theme, 'onboarding.slide_2'),
    },
    {
      key: 'slide_3',
      title: t('BUSINESS_MENU', 'Business menu'),
      text: t('BUSINESS_MENU_INST', 'See the Business Menu, Info & Reviews, to start buying select a category.'),
      image: themeImage(theme, 'onboarding.slide_3'),
    },
    {
      key: 'slide_4',
      title: t('PRODUCT_LIST', 'Product List'),
      text: t('PRODUCT_LIST_INST', 'Take a good look at all the goods/services that the store provides and select the one you need.'),
      image: themeImage(theme, 'onboarding.slide_4'),
    },
    {
      key: 'slide_5',
      title: t('CHECKOUT_SCREEN', 'Check out Screen'),
      text: t('CHECKOUT_SCREEN_INST', 'Here you fill all the fields with your data, select payment method, choose a tip & pay.'),
      image: themeImage(theme, 'onboarding.slide_5'),
    },
    {
      key: 'slide_6',
      title: t('TUTORIAL_ORDER_COMPLETED', 'Order Completed'),
      text: t('TUTORIAL_ORDER_COMPLETED_INST', 'That’s it! The order will be on its way now. You’ll get push notification one every order status change.'),
      image: themeImage(theme, 'onboarding.slide_6'),
    },
  ];
  type Item = typeof data[0];
  // Page `onboarding`: the slides the theme shows, in its order (at least one).
  const { sections } = usePageSections('onboarding')
  const shown = sections
    .filter((section) => section.visible)
    .map((section) => data.find((slide) => slide.key === section.key))
    .filter(Boolean) as Item[]
  const slides = shown.length ? shown : data.slice(0, 1)

  // `components.tutorial` (title and dots); the pager's actions (Next, Skip, Done) in the
  // button look of `tutorial.slots.action` (color, appearance, size).
  const actionSlot = theme.native.components.tutorial.slots.action
  const action = themePart(theme, 'button', `variants.${actionSlot.color}.${actionSlot.appearance}`)
  const styles = useMemo(() => {
    const tutorial = theme.native.components.tutorial.base
    const actionSize = themePart(theme, 'button', `sizes.${actionSlot.size}`)
    return StyleSheet.create({
    page: { flex: 1, backgroundColor: themeColor(theme, 'background') },
    slide: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeColor(theme, 'background'),
    },
    // Layout of the slide (window fractions, not design values).
    image: {
      position: 'absolute',
      flex: 0,
      top: themeSpace(theme, 'xxxl'),
      width: '100%',
      height: '70%',
      resizeMode: (WIDTH_SCREEN > 1080) ? 'contain' : 'cover',
    },
    text: {
      position: 'absolute',
      bottom: HEIGHT_SCREEN * .13,
      textAlign: 'left',
      width: WIDTH_SCREEN * .85
    },
    title: {
      ...nativeTextStyle(tutorial.title),
      color: tutorial.title_color,
      position: 'absolute',
      bottom: HEIGHT_SCREEN * .22,
      textAlign: 'left',
      width: WIDTH_SCREEN * .85
    },
    button: {
      flexDirection: 'row',
      minHeight: actionSize.height,
      paddingHorizontal: actionSize.padding_x,
      gap: themePart(theme, 'button', 'base.icon_gap'),
      borderRadius: themePart(theme, 'button', 'base.radius'),
      justifyContent: 'center',
      alignItems: 'center',
      ...nativeBoxStyle(action),
    },
    buttonText: { ...nativeTextStyle(actionSize.text), color: action.color },
    // The bar under the slides: the dots on the start side, Skip and Next/Done on the end.
    pagination: {
      position: 'absolute',
      bottom: themeSpace(theme, 'xl'),
      left: themeSpace(theme, 'xl'),
      right: themeSpace(theme, 'xl'),
      flexDirection: 'row',
      alignItems: 'center',
      gap: themeSpace(theme, 'md'),
    },
    dots: { flex: 1, justifyContent: 'flex-start' },
    })
  }, [theme, action, actionSlot, WIDTH_SCREEN, HEIGHT_SCREEN]);

  const _renderItem = ({ item }: { item: Item }) => {
    return (
      <View style={styles.slide}>
        <Image source={item.image} style={styles.image} />
        <OText style={styles.title} numberOfLines={2}>{item.title}</OText>
        <OText style={styles.text} numberOfLines={3}>{item.text}</OText>
      </View>
    );
  };

  const _onDone = () => {
    _setStoreData('isTutorial', false);
    onDone();
  };

  // Skip goes to the last slide (its Done ends the tutorial); Next to the following one.
  const renderPagination = ({ index, count, goTo, next }: { index: number, count: number, goTo: (index: number) => void, next: () => void }) => {
    const isLast = index === count - 1
    return (
      <View style={styles.pagination}>
        <PagerDots
          count={count}
          index={index}
          size={themeSpace(theme, 'sm')}
          color={theme.native.components.tutorial.base.dot_color}
          activeColor={theme.native.components.tutorial.base.dot_active_color}
          style={styles.dots}
        />
        {showSkipButton && !isLast && (
          <Pressable style={styles.button} onPress={() => goTo(count - 1)} accessibilityRole='button'>
            <OText style={styles.buttonText}>{t('TUTORIAL_SKIP', 'Skip')}</OText>
          </Pressable>
        )}
        {isLast ? (
          <Pressable style={styles.button} onPress={_onDone} accessibilityRole='button'>
            <OText style={styles.buttonText}>{t('TUTORIAL_DONE', "Let's start!")}</OText>
          </Pressable>
        ) : (
          <Pressable style={styles.button} onPress={next} accessibilityRole='button'>
            <OText style={styles.buttonText}>{t('TUTORIAL_NEXT', 'Next')}</OText>
            <Icon name='arrow-forward' size='sm' color={action.color} />
          </Pressable>
        )}
      </View>
    )
  };

  return (
    <View style={styles.page}>
      <SafeAreaView style={styles.page}>
        <Pager
          ref={pagerRef}
          data={slides}
          renderItem={_renderItem}
          keyExtractor={(item) => item.key}
          renderOverlay={renderPagination}
          onIndexChange={(index) => {
            index >= 1 ? setShowSkipButton(false) : setShowSkipButton(true)
          }}
        />
      </SafeAreaView>
    </View>
  );
};
export default IntroductoryTutorial;
