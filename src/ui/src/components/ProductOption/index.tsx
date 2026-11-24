import React, { useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { LayoutAnimation, StyleSheet, View } from 'react-native';
import { useTheme } from 'styled-components/native';
import FastImage from 'react-native-fast-image';
import { ProductOption as ProductOptionController, useLanguage } from '@components'
import { nativeTextStyle, themeBorderWidth, themeGutter, themePart, themeSpace, themeVisible } from '@/theme/helpers'
import { imageUrl } from '@/utils/imageUrl'

import { Icon, OText } from '../shared'
import { AccordionTitle, Container, OptionImage, OptionMeta, RequiredWrap, WrapHeader } from './styles'
import { OptionalBadge } from './OptionalBadge'

/** An image the API really has (`-` is none). */
const hasImage = (image: unknown): image is string => typeof image === 'string' && !!image.trim() && image !== '-'

// An abbreviation with one dot: some translations already end in it ("max.").
const abbr = (word: string) => (word.endsWith('.') ? word : `${word}.`)

/**
 * What the group asks for as neutral text ("Choose 2", "Max. 3", "Min. 1",
 * "Min. 1 - Max. 3"); that it is required is the badge's.
 */
export const optionLimitText = (t: (key: string, fallback: string) => string, option: any) => {
  const min = option?.min ?? 0
  const max = option?.max ?? 0
  if (min > 0 && max > 0 && min === max) return `${t('CHOOSE', 'Choose')} ${min}`
  if (min === 0 && max > 0) return `${abbr(t('MAX', 'Max'))} ${max}`
  if (min > 0 && max === 0) return `${abbr(t('MIN', 'Min'))} ${min}`
  if (min > 0 && max > 0) return `${abbr(t('MIN', 'Min'))} ${min} - ${abbr(t('MAX', 'Max'))} ${max}`
  return ''
}

const ProductOptionUI = (props: any) => {
  const {
    children,
    option,
    ref,
    error
  } = props

  const theme: any = useTheme();
  const [, t] = useLanguage()
  // `components.product_option`: title, constraint text, error color and the open/close motion.
  const look = theme.native.components.product_option.base
  const requiredBadge = themePart(theme, 'badge', `variants.${theme.native.components.product_option.slots.required.variant}`)
  const styles = useMemo(() => StyleSheet.create({
    title: { ...nativeTextStyle(look.title), color: look.title_color },
    constraint: nativeTextStyle(look.description),
    required: { ...nativeTextStyle(theme.native.components.badge.base.text), color: requiredBadge.color },
    image: { width: look.image_size, height: look.image_size },
    // The group's outline in the error color, on the page's side margins and over the group (nothing moves when it shows).
    // With the outline the group keeps its content off it, inside the page's side margins.
    errorInset: { paddingHorizontal: themeSpace(theme, 'sm'), paddingVertical: themeSpace(theme, 'xs') },
    errorBox: {
      ...StyleSheet.absoluteFill,
      left: themeGutter(theme),
      right: themeGutter(theme),
      borderWidth: themeBorderWidth(theme, 'thin', { fixed: true }),
      borderColor: look.error,
      borderRadius: look.radius
    },
  }), [theme, look, requiredBadge])

  const showMeta = themeVisible(theme, 'product.options.required_badge')
  const limitText = showMeta ? optionLimitText(t, option) : ''
  const isRequired = showMeta && (option.min ?? 0) >= 1
  const isOptional = themeVisible(theme, 'product.options.optional_badge') && (option.min ?? 0) < 1
  const showImage = themeVisible(theme, 'product.options.image') && hasImage(option?.image)

  // Which groups start closed (`product_option.base.collapsed`): none, the optional ones, or all.
  const startsOpen = look.collapsed === 'none' || (look.collapsed === 'optional' && option?.min > 0)
  const [isOpen, setIsOpen] = useState(startsOpen);

  const toggleOpen = useCallback(() => {
    if (look.animated) {
      LayoutAnimation.configureNext(LayoutAnimation.create(look.speed, 'easeInEaseOut', 'opacity'));
    }
    setIsOpen(!isOpen);
  }, [isOpen, look]);

  // A group with an error opens, so what is missing is in sight.
  useEffect(() => {
    if (error && !isOpen) setIsOpen(true)
  }, [error])

  useImperativeHandle(
    ref,
    () => ({
      open: () => {
        if (isOpen) {
          return;
        }
        return toggleOpen();
      },
    }),
    [toggleOpen, isOpen],
  );

  return (
    <Container style={error ? styles.errorInset : undefined}>
      <AccordionTitle
        onPress={toggleOpen}
        accessibilityRole='button'
        accessibilityLabel={option.name}
        accessibilityState={{ expanded: isOpen }}
      >
        {showImage && (
          <OptionImage>
            <FastImage
              style={styles.image}
              source={{ uri: imageUrl(option.image, { height: look.image_size }), priority: FastImage.priority.normal }}
              objectFit='cover'
            />
          </OptionImage>
        )}
        <WrapHeader>
          <OText style={styles.title}>{option.name}</OText>
          {(isRequired || isOptional || !!limitText) && (
            <OptionMeta>
              {isOptional && <OptionalBadge />}
              {isRequired && (
                <RequiredWrap>
                  <OText style={styles.required}>{t('REQUIRED', 'Required')}</OText>
                </RequiredWrap>
              )}
              {!!limitText && (
                <OText style={styles.constraint} color={error ? look.error : look.description_color}>{limitText}</OText>
              )}
            </OptionMeta>
          )}
        </WrapHeader>
        <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} />
      </AccordionTitle>
      {isOpen && <View>{children}</View>}
      {!!error && <View pointerEvents='none' style={styles.errorBox} />}
    </Container>
  )
}

export const ProductOption = (props: any) => {
  const productOptionProps = {
    ...props,
    UIComponent: ProductOptionUI
  }

  return (
    <ProductOptionController {...productOptionProps} />
  )
}
