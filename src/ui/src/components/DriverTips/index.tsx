import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { useTheme } from 'styled-components/native';

import {
  DTContainer,
  DTCard,
  DTWrapperTips,
  DTForm,
  DTLabel,
  DTWrapperInput,
  DTCardLoader
} from './styles'

import {
  DriverTips as DriverTipsController,
  useUtils,
  useLanguage,
  useConfig,
} from '@components';
import { OButton, OInput, OText } from '../shared';
import { nativeBoxStyle, nativeTextStyle, themeVisible } from '@/theme/helpers';

const DriverTipsUI = (props: any) => {
  const {
    driverTip,
    driverTipsOptions,
    isMulti,
    isLoading,
    cart,
    carts,
    isDriverTipUseCustom,
    handlerChangeOption,
    isFixedPrice
  } = props;

  const [{ parsePrice }] = useUtils();
  const theme: any = useTheme();
  const [, t] = useLanguage();
  const [{ configs }] = useConfig();
  const [customTip, setCustomTip] = useState((!isMulti && isDriverTipUseCustom && !driverTipsOptions.includes(driverTip)) ?? false)
  const currentTip = customTip ? parseFloat(driverTip || 0) > 0 : !!(!customTip && !driverTipsOptions.includes(driverTip) && parseFloat(driverTip || 0))
  const [value, setvalue] = useState('');
  const [pendingOption, setPendingOption] = useState<any>(null)

  useEffect(() => {
    if (!isLoading) setPendingOption(null)
  }, [isLoading])

  // The tips are `chip`s: resting, pressed and selected looks; the label is the block's subtitle.
  const chip = theme.native.components.chip
  const states = chip.variants.default.states
  const style = useMemo(() => {
    const look = theme.native.components.chip
    const subtitle = theme.native.components.driver_tips
    return StyleSheet.create({
    chip: nativeBoxStyle(look.base),
    chipPressed: nativeBoxStyle(look.variants.default.states.pressed),
    chipSelected: nativeBoxStyle(look.variants.default.states.selected),
    chipText: nativeTextStyle(look.base.text),
    label: {
      ...nativeTextStyle(isMulti ? subtitle.variants.multi.subtitle : subtitle.base.subtitle),
      color: subtitle.base.subtitle_color
    },
    inputStyle: {
      flex: 1,
      marginBottom: 0
    }
    })
  }, [theme, isMulti])
  const ink = (selected: boolean) => selected ? states.selected.color : chip.base.color

  const placeholderCurrency = !isFixedPrice ? `0%` : (configs?.currency_position?.value || 'left') === 'left'
    ? `${configs?.format_number_currency?.value}0`
    : `0${configs?.format_number_currency?.value}`

  const handleChangeDriverTip = (val: any) => {
    const tip = Number(val)
    if ((isNaN(tip) || tip < 0)) {
      setvalue(value)
      return
    }
    setvalue(val)
  }

  const multiCartTipsAmmout = carts?.reduce((total: any, cart: any) => {
    return total + parseFloat(cart?.driver_tip || 0)
  }, 0)

  return (
    <DTContainer>
      {themeVisible(theme, 'checkout.driver_tips.subtitle') && (
        <DTLabel>
          <OText style={style.label}>
            {t('CUSTOM_DRIVER_TIP_MESSAGE', '100% of these tips go directly to your driver')}
          </OText>
        </DTLabel>
      )}
      <DTWrapperTips>
        {driverTipsOptions.map((option: any, i: number) => {
          const selected = option === driverTip && !customTip
          return (
            <Pressable
              key={i}
              accessibilityRole='button'
              accessibilityState={{ selected }}
              onPress={() => {
                if (isLoading || selected) return
                setPendingOption(option)
                handlerChangeOption(option)
                setCustomTip(false)
              }}
            >
              {({ pressed }) => (
                <DTCard style={[style.chip, pressed && style.chipPressed, selected && style.chipSelected]}>
                  <OText
                    numberOfLines={1}
                    style={style.chipText}
                    color={pendingOption === option ? 'transparent' : ink(selected)}
                  >
                    {`${isFixedPrice ? parsePrice(option) : `${option}%`}`}
                  </OText>
                  {pendingOption === option && (
                    <DTCardLoader>
                      <ActivityIndicator size='small' color={ink(selected)} />
                    </DTCardLoader>
                  )}
                </DTCard>
              )}
            </Pressable>
          )
        })}
        {isDriverTipUseCustom && (
          <Pressable
            accessibilityRole='button'
            accessibilityState={{ selected: customTip }}
            onPress={() => { !isLoading && setCustomTip(true) }}
          >
            {({ pressed }) => (
              <DTCard style={[style.chip, pressed && style.chipPressed, customTip && style.chipSelected]}>
                <OText
                  numberOfLines={1}
                  style={style.chipText}
                  color={pendingOption === 'custom' ? 'transparent' : ink(customTip)}
                >
                  {t('CUSTOM_TIP', 'Custom')}
                </OText>
                {pendingOption === 'custom' && (
                  <DTCardLoader>
                    <ActivityIndicator size='small' color={ink(customTip)} />
                  </DTCardLoader>
                )}
              </DTCard>
            )}
          </Pressable>
        )}
      </DTWrapperTips>
      {customTip && (
        <DTForm>
          <DTWrapperInput>
            <OInput
              placeholder={placeholderCurrency}
              style={style.inputStyle}
              value={value}
              type={'numeric'}
              onChange={handleChangeDriverTip}
              autoCapitalize='none'
              autoCorrect={false}
              maxLength={isFixedPrice ? 5 : 3}
            />
            <OButton
              text={t('APPLY_TIP', 'Apply Tip')}
              disabled={parseFloat(value || '0') < 0 || parseFloat(value || '0') === driverTip || value === ''}
              onClick={() => {
                setPendingOption('custom')
                handlerChangeOption(value)
                setvalue('')
              }}
            />
          </DTWrapperInput>
        </DTForm>
      )}
      {currentTip && (
        <OText
          preset='body_lg'
          color='primary_text'
          align='center'
          mTop='sm'
        >
          {t('CURRENT_DRIVER_TIP_AMOUNT', 'Current driver tip amount')}{!isFixedPrice &&
            ` (${driverTip}%)`}: {isFixedPrice ? parsePrice(multiCartTipsAmmout ?? driverTip) : parsePrice(multiCartTipsAmmout ?? cart?.driver_tip)}
        </OText>
      )}
    </DTContainer>
  )
}


export const DriverTips = (props: any) => {
  const driverTipsProps = {
    ...props,
    UIComponent: DriverTipsUI
  }

  return <DriverTipsController {...driverTipsProps} />
}
