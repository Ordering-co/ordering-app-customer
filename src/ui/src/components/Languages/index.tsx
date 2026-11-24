import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTheme } from 'styled-components/native';
import { CountryFlag } from '../shared/CountryFlag';
import { LoadingOverlay } from '../LoadingOverlay';

import { nativeTextStyle, themeIconSize } from '@/theme/helpers';
import {
  ScreenContainer,
  LanguageList,
  RadioButtonOuter,
  RadioButtonInner,
  LanguageItemContainer,
  WrapperFlag
} from './styles';

import langCountries from '../LanguageSelector/lang_country.json';
import { LanguageSelector as LanguageSelectorController, useLanguage } from '@components'
import { PressableScale } from '../shared/PressableScale'
import { OText } from '@ui'

const LanguagesUI = (props: any) => {
  const theme: any = useTheme();
  const [{ loading: languagesLoading }, t] = useLanguage();
  const row = theme.native.components.list_row.base

  const {
    languagesState,
    currentLanguage,
    handleChangeLanguage
  } = props

  const [languagePressed, setLanguagePressed] = useState<any>(currentLanguage)

  // Guard deep-links: with one (or no) language there is nothing to choose, so go back.
  useEffect(() => {
    if (!languagesLoading && !languagesState?.loading && (languagesState?.languages?.length ?? 0) <= 1) {
      props.goToBack && props.goToBack()
    }
  }, [languagesLoading, languagesState?.loading, languagesState?.languages])

  const changeLanguage = (lang: string) => {
    setLanguagePressed(lang)
    handleChangeLanguage(lang)
  }

  const _languages = languagesState?.languages?.map((language: any) => {
    return {
      code: language?.code,
      name: language?.name,
      flagCode: langCountries.find((item: any) => item.value == language?.code)?.countryCode,
    }
  })

  _languages && _languages.sort((a: any, b: any) => (a.content > b.content) ? 1 : ((b.content > a.content) ? -1 : 0))

  const renderItem = ({ item }: any) => (
    <PressableScale onPress={() => changeLanguage(item.code)}>
      <LanguageItemContainer>
        <WrapperFlag>
          <CountryFlag isoCode={item.flagCode} size={themeIconSize(theme, 'sm')} />
        </WrapperFlag>
        {/* The name takes the row, so the radio sits at its end as on every list row. */}
        <OText style={{ ...nativeTextStyle(row.title), color: row.title_color, flex: 1 }}>{item.name}</OText>
        <RadioButtonOuter isSelected={languagePressed === item.code}>
          {languagePressed === item.code && <RadioButtonInner />}
        </RadioButtonOuter>
      </LanguageItemContainer>
    </PressableScale>
  );

  return (
    <ScreenContainer>
      <LoadingOverlay visible={languagesLoading || languagesState?.loading} />
      {!languagesLoading && !languagesState?.loading && (
        <LanguageList
          data={_languages}
          renderItem={renderItem}
          keyExtractor={(item: any) => item.code}
          ListEmptyComponent={<View><OText>{t('NO_LANGUAGES_AVAILABLE', 'No languages available.')}</OText></View>}
        />
      )}
    </ScreenContainer>
  );
};

export const Languages = (props: any) => {
  const LanguageProps = {
    ...props,
    UIComponent: LanguagesUI
  }

  return <LanguageSelectorController {...LanguageProps} />
}
