import React, { useEffect, useMemo, useRef, useState } from 'react';
import { singleLineInput } from '../shared/singleLineInput'
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTheme } from 'styled-components/native';
import { isValidPhoneNumber, CountryCode } from 'libphonenumber-js/max';
import { getAllCountries, FlagType } from 'react-native-country-picker-modal'
import { CountryFlag } from '../shared/CountryFlag';
import { Wrapper } from './styles'
import { Calling, PickerCountry, nationalNumberOf, parseFullNumber, resolveDefaultCalling, withoutSeparators } from './calling'
import { PhoneInputParams } from '../../types';

import { useLanguage, useConfig } from '@components';
import { OText } from '@ui';
import Icon from '../shared/Icon';
import OSelect from '../shared/OSelect';
import { nativeBoxStyle, nativeTextStyle, themeColor, themeIconSize, themeSpace } from '@/theme/helpers';

/**
 * The phone field: the country (its flag, opening the countries in the app's
 * select sheet), its calling code and the number. The app's own, in place of
 * react-native-phone-number-input (unmaintained since 2022, with
 * google-libphonenumber and a second country picker): the number is validated
 * with libphonenumber-js (its full metadata, as google-libphonenumber's) and
 * reported to `handleData` (`phone.country_phone_code` and `phone.cellphone`,
 * the national number without its country's trunk prefix). The calling code
 * is the country's, by ISO (`./calling`); a number typed or pasted whole
 * (`+52 55 1234 5678`) sets its country and leaves the national number.
 */

const countriesWithSubOptions = ['PR']
const codesStartsWithZero: any = ['44']

export const PhoneInputNumber = (props: PhoneInputParams) => {
  const {
    data,
    handleData,
    defaultValue,
    defaultCode,
    forwardRef,
    textInputProps,
    boxStyle,
    inputStyle,
    textStyle,
    flagStyle,
    noDropIcon,
    isDisabled,
    isStartValidation,
    changeCountry,
    updateStateWithSubmit,
    defaultCodeFallback
  } = props

  const theme: any = useTheme();

  const [, t] = useLanguage()
  const [{ configs }] = useConfig()
  const [userphoneNumber, setUserphoneNumber] = useState('');
  const [number, setNumber] = useState<string>(defaultValue ? String(defaultValue) : '');
  // The country chosen in the sheet (or typed with the number); until then, the default one.
  const [picked, setPicked] = useState<Calling | null>(null)
  const [hasBlurred, setHasBlurred] = useState(false);
  // The countries of the sheet: one row per calling code (Puerto Rico has two).
  const [countries, setCountries] = useState<PickerCountry[]>([])
  // The user has typed in the field: a later `defaultValue` no longer replaces the number.
  const typed = useRef(false)
  const wasDisabled = useRef(!!isDisabled)
  const ownRef = useRef<TextInput>(null)
  const inputRef = forwardRef ?? ownRef
  const isDisableNumberValidation = parseInt(configs?.validation_phone_number_lib?.value ?? 1, 10)
  const style = React.useMemo(() => {
    const input = theme.native.components.input
    const base = input.base
    const field = theme.native.components.field.base
    const box = { borderRadius: base.radius, ...nativeBoxStyle(base) }
    return StyleSheet.create({
      row: { flexDirection: 'row' },
      input: {
        ...box,
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: base.padding_x,
        height: input.sizes.md.height,
      },
      inputError: nativeBoxStyle(input.variants.default.states.error),
      countryBtn: {
        backgroundColor: themeColor(theme, 'surface_alt'),
        ...box,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: input.sizes.md.height,
        // As wide with or without the chevron (as the library's fixed box was).
        minWidth: input.sizes.md.height + themeSpace(theme, 'xxl'),
        marginEnd: themeSpace(theme, 'sm'),
      },
      text: { ...nativeTextStyle(base.text), color: base.text_color },
      code: { marginEnd: themeSpace(theme, 'sm') },
      number: { ...singleLineInput, flex: 1, alignSelf: 'stretch', padding: 0 },
      readOnly: {
        ...box,
        ...nativeBoxStyle(input.variants.default.states.disabled),
        flexDirection: 'row',
        alignItems: 'center',
        gap: base.icon_gap,
        paddingHorizontal: base.padding_x,
        marginBottom: field.gap,
        width: '100%',
        height: input.sizes.md.height,
      },
      flagTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: themeSpace(theme, 'xs'),
        alignSelf: 'stretch',
        flexGrow: 1,
        paddingHorizontal: base.padding_x,
      },
      flagSelect: { alignSelf: 'stretch', flexGrow: 1 },
      // Spaced from the next field like every input (`field.gap`).
      container: { width: '100%', marginBottom: field.gap },
      error: { ...nativeTextStyle(field.error), color: field.error_color },
      phoneError: { textAlign: 'center', marginTop: field.message_gap },
    })
  }, [theme])
  const isRequiredEmpty = isStartValidation && userphoneNumber === ''

  // The default country and its calling code, by ISO (a saved numeric code stays as it is).
  const defaults = useMemo(() => resolveDefaultCalling({
    defaultCode,
    configCountry: configs?.default_country_code?.value,
    fallbackCode: defaultCodeFallback,
    subOptionCountries: countriesWithSubOptions,
  }, countries), [defaultCode, defaultCodeFallback, configs?.default_country_code?.value, countries])
  const countryCode: string = picked?.countryCode ?? defaults.countryCode
  const callingCode: string = picked?.code ?? defaults.code

  const handleChangeNumber = (value: any) => {
    setUserphoneNumber(value)
  }

  // What is typed stays in the field as typed (rewriting it drops the next
  // keystrokes); the number reported has no spaces, dashes or parentheses.
  const onChangeText = (text: string) => {
    typed.current = true
    const entered = text.trim()
    if (entered.startsWith('+')) {
      // A whole number, with its calling code: its country and the national number.
      const whole = parseFullNumber(entered, countries, !isDisableNumberValidation)
      if (whole) {
        setPicked({ countryCode: whole.countryCode, code: whole.code })
        setNumber(whole.number)
        handleChangeNumber(`+${whole.code}${whole.number}`)
        if (whole.countryCode !== countryCode) {
          const country = countries.find(item => item.cca2 === whole.countryCode)
          changeCountry?.({ ...(country ?? { cca2: whole.countryCode }), callingCode: [whole.code] })
        }
        return
      }
      // Still being typed: not a number yet (its `+` keeps it refused).
      setNumber(text)
      handleChangeNumber(`+${callingCode}${withoutSeparators(entered)}`)
      return
    }
    setNumber(text)
    const national = withoutSeparators(text)
    handleChangeNumber(national.length > 0 ? `+${callingCode}${national}` : national)
  }

  /**
   * The national number reported: the country's own (its trunk prefix off, a
   * zero that is part of the number kept: Italy) or, when what is typed is not
   * a number of the country, without a leading zero (as
   * react-native-phone-number-input's).
   */
  const numberWithoutZero = () => {
    const own = nationalNumberOf(number, { countryCode, code: callingCode })
    if (own !== null) return own
    const national = withoutSeparators(number)
    return national.length > 0 && national.startsWith('0') ? national.substring(1) : national
  }

  useEffect(() => {
    if ((defaultValue && userphoneNumber) || !defaultValue) {
      if (userphoneNumber) {
        const validationsForUK = ['01', '02', '07', '0800', '0808', '0845', '0870', '0871']

        let isPossibly = false
        let numberWithoutCountryCode = ''
        const cellphone = userphoneNumber.slice(0, 0) + userphoneNumber.slice(1, userphoneNumber.length)
        if (codesStartsWithZero.includes(callingCode)) {
          numberWithoutCountryCode = cellphone.replace(callingCode || '', '')
          const result = validationsForUK.some(areaCode => numberWithoutCountryCode?.startsWith(areaCode))
          isPossibly = result && numberWithoutCountryCode?.length >= 10 && numberWithoutCountryCode?.length < 12
        }
        let checkValid = false
        try {
          checkValid = isValidPhoneNumber(userphoneNumber, countryCode as CountryCode)
        } catch {
          checkValid = false
        }
        const formattedNumber = numberWithoutZero()
        const regex = /^[0-9]*$/
        const validNumber = regex.test(cellphone)
        if (((!checkValid && formattedNumber && !isPossibly) || !validNumber) && !!isDisableNumberValidation) {
          handleData && handleData({
            ...data,
            error: t('INVALID_ERROR_PHONE_NUMBER', 'The Phone Number field is invalid')
          })
          return
        }
        handleData && handleData({
          ...data,
          error: '',
          phone: {
            country_phone_code: callingCode,
            cellphone: !isDisableNumberValidation ? cellphone.slice(callingCode?.length) : formattedNumber
          }
        }, {
          countryCallingCode: callingCode,
          number: numberWithoutCountryCode,
        })
      } else {
        handleData && handleData({
          ...data,
          error: '',
          phone: {
            country_phone_code: null,
            cellphone: null
          }
        })
      }
    }
  }, [userphoneNumber, hasBlurred])

  useEffect(() => {
    // A value that arrives (or changes) after the mount is shown, unless the user is typing.
    if (updateStateWithSubmit ? !!defaultValue : !typed.current) setNumber(defaultValue ? String(defaultValue) : '')
  }, [defaultValue])

  useEffect(() => {
    // Back from read-only (the profile's edit): the saved number again, not what was typed before.
    if (wasDisabled.current && !isDisabled) {
      typed.current = false
      setNumber(defaultValue ? String(defaultValue) : '')
      setPicked(null)
      setUserphoneNumber('')
      setHasBlurred(false)
    }
    wasDisabled.current = !!isDisabled
  }, [isDisabled])

  useEffect(() => {
    // The countries' local data (emoji flags: nothing is downloaded); the mocked library in tests may have none.
    if (typeof getAllCountries !== 'function') return
    getAllCountries(FlagType.EMOJI, 'common')
      .then(list => setCountries(list))
      .catch(() => setCountries([]))
  }, [])

  const countryOptions = useMemo(() => countries
    .flatMap((country: any) => (country.callingCode ?? []).map((code: string) => ({
      value: `${country.cca2}:${code}`,
      label: `${country.name} (+${code})`,
      leading: <CountryFlag isoCode={country.cca2.toLowerCase()} size={themeIconSize(theme, 'sm')} />,
      country: { ...country, callingCode: [code] }
    })))
    .sort((a: any, b: any) => a.label.localeCompare(b.label)), [countries, theme])

  // The country chosen in the sheet keeps the typed number and reports the new calling code.
  const handleSelectCountry = (option: any) => {
    typed.current = true
    const country = option.country
    const code = country.callingCode?.[0] ?? ''
    setPicked({ countryCode: country.cca2, code })
    const national = withoutSeparators(number)
    handleChangeNumber(code ? `+${code}${national}` : national)
    changeCountry?.(country)
  }

  return (
    <Wrapper>
      {isRequiredEmpty && (
        <OText style={style.error}>
          {t('VALIDATION_ERROR_MOBILE_PHONE_REQUIRED', 'The field Mobile phone is required').replace('_attribute_', t('CELLPHONE', 'Cellphone'))}*
        </OText>
      )}
      {isDisabled && (
        <View style={style.readOnly}>
          <OText style={style.text}>
            +{defaults.code} {defaultValue}
          </OText>
        </View>
      )}
      {!isDisabled && (
        <View style={[style.row, style.container]}>
          <View style={[style.countryBtn, flagStyle, boxStyle]}>
            <OSelect
              title={t('SELECT_COUNTRY', 'Select country')}
              searchable
              searchPlaceholder={t('SEARCH', 'Search')}
              options={countryOptions}
              value={`${countryCode.toUpperCase()}:${callingCode}`}
              onSelect={(_value, option) => handleSelectCountry(option)}
              style={style.flagSelect}
              renderTrigger={({ open }) => (
                <Pressable
                  testID='phone-country-trigger'
                  accessibilityRole='button'
                  accessibilityLabel={t('SELECT_COUNTRY', 'Select country')}
                  onPress={open}
                  style={style.flagTrigger}
                >
                  <CountryFlag isoCode={countryCode.toLowerCase()} size={themeIconSize(theme, 'sm')} />
                  {!noDropIcon && (
                    <Icon name='chevron-down' size={theme.native.components.input.base.icon_size} color={theme.native.components.input.base.icon_color} />
                  )}
                </Pressable>
              )}
            />
          </View>
          {/* Only the number's box focuses the field: the countries' sheet is not inside it. */}
          <Pressable
            testID='phone-input-box'
            accessible={false}
            onPress={() => inputRef?.current?.focus?.()}
            style={[style.input, isRequiredEmpty && style.inputError, inputStyle]}
          >
            {!!callingCode && <OText style={[style.text, style.code, textStyle]}>{`+${callingCode}`}</OText>}
            <TextInput
              ref={inputRef}
              testID='phone-input'
              style={[style.text, style.number, textStyle]}
              value={number}
              onChangeText={onChangeText}
              placeholder={t('PHONE_NUMBER', 'Phone Number')}
              placeholderTextColor={theme.native.components.input.base.placeholder}
              keyboardType='phone-pad'
              textContentType='telephoneNumber'
              dataDetectorTypes='phoneNumber'
              onBlur={() => setHasBlurred(true)}
              {...(textInputProps || {})}
            />
          </Pressable>
        </View>
      )}
      {!!data?.error && hasBlurred && (
        <OText style={[style.error, style.phoneError]}>
          {data.error}
        </OText>
      )}
    </Wrapper>
  )
}
