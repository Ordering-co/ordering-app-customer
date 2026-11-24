import React, { useMemo } from 'react'
import { Dimensions, StyleSheet, View } from 'react-native'
import { useTheme } from 'styled-components/native';
import { CountryFlag } from '../shared/CountryFlag';

import langCountries from './lang_country.json';
import { LanguageSelectorParams } from '../../types'
import { DummyContainer } from './styles'
import { LanguageSelector as LanguageSelectorController, useLanguage } from '@components'
import Icon from '../shared/Icon'
import OSelect from '../shared/OSelect'
import OText from '../shared/OText'
import { PressableScale } from '../shared/PressableScale'
import { nativeTextStyle, themeColor, themeControlHeight, themeIconSize, themeRadius, themeSpace } from '@/theme/helpers'

/**
 * The language chip (welcome screen): a `primary` pill that opens the
 * languages in the app's select sheet (`OSelect`).
 */
const LanguageSelectorUI = (props: LanguageSelectorParams) => {
  const {
    languagesState,
    currentLanguage,
    handleChangeLanguage,
    hideIconFlag,
    hideIconDropdown,
    containerStyle
  } = props

  const [, t] = useLanguage()
  const theme: any = useTheme();
  // The pill grows with the screen (layout, not a design value).
  const widthShare = Dimensions.get('window').width * 0.04

  // The language's flag: its exact code, else its language part (`pt-br` → `pt`).
  const flagOf = (code: string) => {
    const lower = code?.toLowerCase()
    return (langCountries.find(item => item.value.toLowerCase() === lower) ??
      langCountries.find(item => item.value.toLowerCase() === lower?.split(/[-_]/)[0]))?.countryCode
  }

  const options = (languagesState?.languages ?? [])
    .map((language: any) => {
      const flagCode = flagOf(language?.code)
      return {
        value: language?.code,
        label: language?.name,
        leading: flagCode ? <CountryFlag isoCode={flagCode.toLowerCase()} size={themeIconSize(theme, 'sm')} /> : undefined
      }
    })
    .sort((a: any, b: any) => (a.label ?? '').localeCompare(b.label ?? ''))

  const currentFlag = !hideIconFlag ? flagOf(currentLanguage as string) : undefined

  const styles = useMemo(() => StyleSheet.create({
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: themeSpace(theme, 'sm'),
      height: themeControlHeight(theme, 'md'),
      borderRadius: themeRadius(theme, 'full', { fixed: true }),
      backgroundColor: themeColor(theme, 'primary'),
      paddingLeft: themeSpace(theme, 'md') + widthShare,
      paddingRight: themeSpace(theme, 'md'),
    },
    label: { ...nativeTextStyle(theme.native.tokens.typography.body), color: themeColor(theme, 'on_primary') },
  }), [theme, widthShare])

  if (!languagesState?.languages) return <DummyContainer />

  return (
    <View style={containerStyle}>
      <OSelect
        title={t('LANGUAGE', 'Language')}
        options={options}
        value={currentLanguage}
        onSelect={(code) => handleChangeLanguage(code)}
        renderTrigger={({ open, selected }) => (
          <PressableScale testID='language-selector' onPress={open} style={styles.pill}>
            {!!currentFlag && (
              <CountryFlag isoCode={currentFlag.toLowerCase()} size={themeIconSize(theme, 'sm')} />
            )}
            <OText style={styles.label} numberOfLines={1}>{selected?.label}</OText>
            {!hideIconDropdown && <Icon name='chevron-down' size='sm' color='on_primary' />}
          </PressableScale>
        )}
      />
    </View>
  )
}

export const LanguageSelector = (props: LanguageSelectorParams) => {
  const LanguageProps = {
    ...props,
    UIComponent: LanguageSelectorUI
  }

  return <LanguageSelectorController {...LanguageProps} />
}
