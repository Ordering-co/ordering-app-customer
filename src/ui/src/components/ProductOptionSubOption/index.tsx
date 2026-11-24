import React, { useState, useEffect, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { useTheme } from 'styled-components/native';
import FastImage from 'react-native-fast-image';
import { nativeTextStyle, themePart, themeScoped, themeSpace, themeVisible } from '@/theme/helpers'

import {
  QuantityControl,
  PositionControl,
  Circle,
  Logo,
  WrapperOptionName
} from './styles'
import { ChoiceRow, Icon, OButton, OText } from '../shared'

import {
  useUtils,
  useLanguage,
  ProductOptionSuboption as ProductSubOptionController
} from '@components'
import { imageUrl } from '@/utils/imageUrl'

const halfOptions = ['left', 'whole', 'right']
/** An image the API really has (`-` is none). */
const hasImage = (image: unknown) => typeof image === 'string' && !!image.trim() && image !== '-'

export const ProductOptionSubOptionUI = (props: any) => {
  const {
    state,
    increment,
    decrement,
    balance,
    option,
    suboption,
    toggleSelect,
    changePosition,
    disabled,
    setIsScrollAvailable,
    image,
    usePizzaValidation,
    pizzaState
  } = props

  const maxByPosition = state.position === 'whole'
    ? suboption?.max
    : suboption?.max * 2

  const shouldApplyHalfLogic = option?.with_half_option && option?.allow_suboption_quantity && option?.limit_suboptions_by_max

  const wouldExceedMaxInWhole = shouldApplyHalfLogic && state.position === 'whole' && option?.max != null
    ? (balance - state.quantity + (state.quantity + 1)) > option?.max
    : false

  const pizzaAtOrOverMax = option?.max != null && pizzaState?.[`option:${option?.id}`]?.value >= option?.max

  const disableIncrement =
    option?.with_half_option
      ? shouldApplyHalfLogic
        ? state.quantity === maxByPosition || pizzaAtOrOverMax || wouldExceedMaxInWhole
        : pizzaAtOrOverMax
      : option?.limit_suboptions_by_max
        ? (balance === option?.max || state.quantity === suboption.max)
        : state.quantity === suboption?.max || (!state.selected && balance === option?.max)
  const price = option?.with_half_option && suboption?.half_price && state.position !== 'whole' ? suboption?.half_price : suboption?.price

  const theme: any = useTheme();
  const [, t] = useLanguage()
  const [{ parsePrice }] = useUtils()
  const [showMessage, setShowMessage] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  // `components.product_option` (image, price), `checkbox` / `radio`, the small `stepper` and the `halves` tabs.
  const look = theme.native.components.product_option.base
  const choice = themeScoped(theme, 'product_option', 'choice')
  const stepper = themeScoped(theme, 'product_option', 'stepper').base
  const halvesSlot = theme.native.components.product_option.slots.halves
  const pill = themePart(theme, 'tabs', `variants.${halvesSlot.variant}`)
  const tabIconSize = themePart(theme, 'tabs', `sizes.${halvesSlot.size}.icon_size`)

  const styles = useMemo(() => StyleSheet.create({
    icon: {
      width: look.image_size,
      height: look.image_size
    },
    price: { ...nativeTextStyle(look.price), color: look.price_color },
    name: { ...nativeTextStyle(choice.base.text), color: choice.base.color },
    nameSelected: { color: choice.variants.default.states.selected.color },
    message: { ...nativeTextStyle(look.description), color: look.error, marginBottom: themeSpace(theme, 'xs') },
    value: { ...nativeTextStyle(stepper.value), color: stepper.value_color },
    half: { ...nativeTextStyle(themePart(theme, 'tabs', 'base.text')), textTransform: 'capitalize' },
    flip: { transform: [{ scaleX: -1 }] },
  }), [theme, look, stepper, choice]);

  const handleSuboptionClick = () => {
    toggleSelect()
    setIsDirty(true)
    const minMaxValidation = option?.with_half_option ? usePizzaValidation : (balance === option?.max && option?.suboptions?.length > balance && !(option?.min === 1 && option?.max === 1))

    if (!state.selected && minMaxValidation) {
      setShowMessage(true)
    }
  }

  useEffect(() => {
    if (balance === option?.max && state?.selected && isDirty) {
      setIsDirty(false)
      setIsScrollAvailable(option?.id)
    }
  }, [state?.selected])

  useEffect(() => {
    if (!(balance === option?.max && option?.suboptions?.length > balance && !(option?.min === 1 && option?.max === 1))) {
      setShowMessage(false)
    }
  }, [balance, pizzaState?.[`option:${option?.id}`]?.value])

  const showImages = themeVisible(theme, 'product.options.image')
  // The group reserves the picture's box in every row when any of its options has a picture.
  const reservesImage = showImages && option?.suboptions?.some((item: any) => item?.enabled !== false && hasImage(item?.image))
  const imageUri = hasImage(image) ? imageUrl(image, { height: look.image_size }) : null
  const single = !((option?.min === 0 && option?.max === 1) || option?.max > 1 || option?.max == null)
  // A choice that cannot be taken: the group reached its maximum (the tap says so) or nothing can be added.
  const maxReached = !state?.selected && (option?.with_half_option
    ? !!usePizzaValidation
    : balance === option?.max && option?.suboptions?.length > balance && !(option?.min === 1 && option?.max === 1))
  const showStepper = !(option?.max === 1 && option?.min === 1) && option?.allow_suboption_quantity && state?.selected
  const stepButton = (name: string, isOff: boolean, onClick: () => void) => (
    <OButton
      iconOnly
      size='sm'
      appearance={stepper.button_appearance}
      accessibilityLabel={name === 'add' ? t('INCREASE', 'Increase') : t('DECREASE', 'Decrease')}
      icon={<Icon name={name} size='sm' color={isOff ? 'text_disabled' : 'primary'} />}
      disabled={isOff}
      onClick={onClick}
    />
  )

  return (
    <View>
      <ChoiceRow
        kind={single ? 'radio' : 'check'}
        selected={!!state?.selected}
        disabled={!!disabled}
        dimmed={maxReached}
        onPress={handleSuboptionClick}
        accessibilityLabel={suboption?.name}
        trailing={showStepper ? (
          <QuantityControl>
            {stepButton('remove', !!(disabled || state.quantity === 0), decrement)}
            <OText style={styles.value}>{state.quantity}</OText>
            {stepButton('add', !!(disabled || disableIncrement || usePizzaValidation), increment)}
          </QuantityControl>
        ) : undefined}
        footer={option?.with_half_option && state?.selected ? (
          <PositionControl>
            {halfOptions.map((position) => {
              const active = state.selected && state.position === position
              return (
                <Circle
                  key={position}
                  active={active}
                  disabled={disabled || (position === 'whole' && pizzaAtOrOverMax)}
                  onPress={() => changePosition(position)}
                >
                  {/* The web's glyphs: a half-filled circle (turned for the right half), a filled one for the whole. */}
                  <Icon
                    set='mci'
                    name={position === 'whole' ? 'circle' : 'circle-half-full'}
                    color={active ? pill.active : pill.inactive}
                    size={tabIconSize}
                    style={position === 'right' ? styles.flip : undefined}
                  />
                  <OText
                    weight={600}
                    style={styles.half}
                    color={active ? pill.active : pill.inactive}
                  >
                    {` ${t(position.toUpperCase(), position)}`}
                  </OText>
                </Circle>
              )
            })}
          </PositionControl>
        ) : undefined}
      >
        {reservesImage && (
          <Logo>
            {!!imageUri && (
              <FastImage
                style={styles.icon}
                source={{ uri: imageUri, priority: FastImage.priority.normal }}
                objectFit='cover'
              />
            )}
          </Logo>
        )}
        <WrapperOptionName>
          <OText style={[styles.name, state?.selected && styles.nameSelected]}>{suboption?.name}</OText>
          {price > 0 && themeVisible(theme, 'product.options.price') && (
            <OText style={styles.price}>
              {'+ '}{parsePrice(price)}
            </OText>
          )}
        </WrapperOptionName>
      </ChoiceRow>
      {showMessage && (
        <OText style={styles.message}>
          {`${t('OPTIONS_MAX_LIMIT', 'Maximum options to choose')}: ${option?.max}`}
        </OText>
      )}
    </View>
  )
}

export const ProductOptionSubOption = (props: any) => {
  const productOptionSubOptionProps = {
    ...props,
    UIComponent: ProductOptionSubOptionUI,
    isOrigin: true,
    disableDeselection: true
  }

  return (
    <ProductSubOptionController {...productOptionSubOptionProps} />
  )
}
