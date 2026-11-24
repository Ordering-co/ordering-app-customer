import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import uuid from 'react-native-uuid';
import { useTheme } from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useLanguage, useSession, useOrder, useToast, useApi, ToastType, useConfig } from '@components';
import { OButton, OText, LanguageSelector } from '@ui';

import { BackgroundImage, Overlay, SafeContainer, TopContent, WrapperBtn } from './styles';
import { usePageSections } from '@/theme/sections';
import { themeImage, themeSpace, themeVisible } from '@/theme/helpers';
import { useUtilsHome } from './utils';

/** `home_hero.base.title_align` / `content_align` as React Native takes them. */
const TEXT_ALIGN: Record<string, 'auto' | 'center' | 'right'> = { start: 'auto', center: 'center', end: 'right' }
const ITEMS_ALIGN: Record<string, 'flex-start' | 'center' | 'flex-end'> = { start: 'flex-start', center: 'center', end: 'flex-end' }


export const Home = (props: any) => {
  const { onNavigationRedirect } = props;

  const theme: any = useTheme();
  const insets = useSafeAreaInsets()
  const [, t] = useLanguage();
  const [orderState, { handleOrderStateLoading }] = useOrder();
  const [ordering] = useApi()
  const [, { login }] = useSession()
  const [, { showToast }] = useToast()
  const [{ configs }] = useConfig()

  const isGuestCheckoutEnabled = configs?.guest_checkout_enabled?.value === '1'

  // Join fragments in code — never rely on spaces inside translated strings.
  const homeLead = t('HOME_TITLE', 'Shop').trim()
  const homeEasily = t('EASILY_QUICKLY', 'easily, quickly').trim()
  const homeAnd = t('AND', 'and').trim()
  const homeSecurely = t('SECURELY', 'securely').trim()
  const homePeriod = t('PERIOD', '.')

  const { fontSize, titleMarginTop, lineHeight } = useUtilsHome().getResponsiveSizes();

  const { render } = usePageSections('home')
  const hero = theme.native.components.home_hero
  // The highlighted runs of the title ("easily, quickly", "securely").
  const highlightWeight = hero.base.highlight_weight
  const styles = useMemo(() => StyleSheet.create({
    // The hero title's size and color; its family follows each run's weight (heading font).
    title: {
      color: hero.base.title_color,
      fontSize,
      lineHeight,
      marginTop: titleMarginTop,
      textAlign: TEXT_ALIGN[hero.base.title_align],
      width: '100%'
    },
    // The landing's safe area, at least the page's vertical rhythm.
    safe: {
      alignItems: ITEMS_ALIGN[hero.base.content_align],
      paddingTop: Math.max(insets.top, themeSpace(theme, 'lg')),
      paddingBottom: Math.max(insets.bottom, themeSpace(theme, 'sm'))
    }
  }), [theme, hero, fontSize, lineHeight, titleMarginTop, insets.top, insets.bottom])

  const handleCreateGuestUser = async (values: any) => {
    try {
      await handleOrderStateLoading(true)
      const { content: { error, result } } = await ordering.users().save(values)
      if (!error) {
        await login({
          user: result,
          token: result.session?.access_token
        })
        onNavigationRedirect?.('BottomTab', { screen: 'Home' })
      } else {
        showToast(ToastType.Error, t('ERROR_CREATING_GUEST_USER', 'Error creating guest users'))
      }
      await handleOrderStateLoading(false)
    } catch (err) {
      await handleOrderStateLoading(false)
      showToast(ToastType.Error, t('ERROR_CREATING_GUEST_USER', 'Error creating guest users'))
    }
  }

  const handleUpdateGuest = async () => {
    const guestToken = uuid.v4()
    if (guestToken) await handleCreateGuestUser({ guest_token: guestToken })
  }

  const renderLanguageSelector = () => themeVisible(theme, 'home.language_selector') && (
    <TopContent>
      <LanguageSelector onNavigationRedirect={onNavigationRedirect} />
    </TopContent>
  )

  const renderTitle = () => themeVisible(theme, 'home.hero.title') && (
    <OText preset='h1' style={styles.title} weight={400}>
      {`${homeLead} `}
      <OText preset='h1' style={styles.title} weight={highlightWeight}>
        {homeEasily}
      </OText>
      {`\n${homeAnd} `}
      <OText preset='h1' style={styles.title} weight={highlightWeight}>
        {homeSecurely}
      </OText>
      {homePeriod}
    </OText>
  )

  const renderLoginAccount = () => !orderState?.loading && (
    <WrapperBtn>
      <OButton
        text={t('LOG_IN', 'Log in')}
        color={hero.slots.login.color}
        appearance={hero.slots.login.appearance}
        size={hero.slots.login.size}
        disabled={orderState?.loading}
        onClick={() => onNavigationRedirect('BottomTab', { screen: 'Home', params: { target: 'LOGIN' } })}
      />
      <OButton
        text={t('SIGN_UP', 'Sign up')}
        color={hero.slots.signup.color}
        appearance={hero.slots.signup.appearance}
        size={hero.slots.signup.size}
        disabled={orderState?.loading}
        onClick={() => onNavigationRedirect('BottomTab', { screen: 'Home', params: { target: 'SIGNUP' } })}
      />
      {isGuestCheckoutEnabled && (
        <OButton
          text={t('GUEST', 'Guest')}
          color='inverse'
          appearance='ghost'
          disabled={orderState?.loading}
          onClick={handleUpdateGuest}
        />
      )}
    </WrapperBtn>
  )

  return (
    <BackgroundImage
      source={themeImage(theme, 'home_hero')}
      resizeMode="cover"
    >
      <Overlay />
      <SafeContainer style={styles.safe}>
        {render({
          language_selector: renderLanguageSelector,
          title: renderTitle,
          login_account: renderLoginAccount
        })}
      </SafeContainer>
    </BackgroundImage>
  );
};
